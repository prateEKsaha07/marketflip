from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import Optional, List
from uuid import UUID
import logging

from auth.dependencies import get_current_user
from auctions.schemas import (
    AuctionCreate,
    AuctionUpdate,
    AuctionResponse,
    AuctionDetailResponse,
    AuctionBidCreate,
    AuctionBidResponse,
    AuctionSetDeliveryRequest,
    AuctionDeliveryConfirmResponse,
    AuctionVerifyOTPRequest,
    AuctionVerifyOTPResponse,
    AuctionSwitchToPickupRequest,
    AuctionOverrideCompleteResponse,
    AuctionRelistResponse
)
from auctions.service import AuctionService
from auth.dependencies import supabase_anon, supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auctions", tags=["Auctions"])

# Initialize service
auction_service = AuctionService(supabase_admin, supabase_anon)


@router.post("", response_model=AuctionResponse, status_code=201)
async def createAuction(
    auction_data: AuctionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new auction (shop owner only)"""
    if current_user.get("role") != "shop_owner":
        raise HTTPException(
            status_code=403,
            detail="Only shop owners can create auctions"
        )

    try:
        result = auction_service.createAuction(
            shop_id=current_user["id"],
            auction_data=auction_data.model_dump()
        )
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Create auction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create auction: {str(e)}")


@router.get("", response_model=List[AuctionResponse])
async def getAuctions(
    pincode: Optional[str] = Query(None, min_length=6, max_length=6),
    category: Optional[str] = None,
    status: str = Query("active", pattern="^(active|sold|completed|expired|cancelled|all)$"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """Get auctions with filters"""
    try:
        # Handle "all" status by passing None
        status_filter = None if status == "all" else status
        
        auctions = auction_service.getAuctions(
            pincode=pincode,
            category=category,
            status=status_filter,
            limit=limit,
            offset=offset
        )
        return auctions
    except Exception as e:
        logger.error(f"Get auctions error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{auction_id}", response_model=AuctionDetailResponse)
async def getAuctionDetail(
    auction_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Get auction details with bids"""
    try:
        result = auction_service.getAuctionById(str(auction_id))
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Get auction detail error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{auction_id}/bids", response_model=AuctionBidResponse, status_code=201)
async def placeBid(
    auction_id: UUID,
    bid_data: AuctionBidCreate,
    current_user: dict = Depends(get_current_user)
):
    """Place a bid on an auction (buyer only)"""
    if current_user.get("role") != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can place bids on auctions"
        )

    try:
        result = auction_service.placeBid(
            auction_id=str(auction_id),
            buyer_id=current_user["id"],
            bid_amount=bid_data.bid_amount
        )
        return result["bid"]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Place bid error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to place bid")


@router.delete("/{auction_id}", status_code=204)
async def cancelAuction(
    auction_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Cancel an active auction (shop owner only)"""
    if current_user.get("role") != "shop_owner":
        raise HTTPException(
            status_code=403,
            detail="Only shop owners can cancel auctions"
        )

    try:
        success = auction_service.cancelAuction(
            auction_id=str(auction_id),
            shop_id=current_user["id"]
        )
        if not success:
            raise HTTPException(status_code=400, detail="Failed to cancel auction")
        return None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Cancel auction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel auction")


# ====== INTERNAL: Close Auction with Winner ======
@router.post("/{auction_id}/close-with-winner", status_code=200)
async def close_auction_with_winner(
    auction_id: UUID,
    payload: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    INTERNAL endpoint for close-auctions Edge Function to call.
    Closes an auction with a winner and unlocks chat.
    This endpoint is protected by the Edge Function calling it with a service token.
    """
    winner_buyer_id = payload.get("winner_buyer_id")
    if not winner_buyer_id:
        raise HTTPException(status_code=400, detail="winner_buyer_id is required")
    
    try:
        result = auction_service.close_auction_with_winner(
            auction_id=str(auction_id),
            winner_buyer_id=str(winner_buyer_id)
        )
        return {
            "message": "Auction closed with winner, chat unlocked",
            "auction": result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Close auction with winner error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ====== PHASE 5B: Post-Sale Delivery/OTP Endpoints ======

@router.patch("/{auction_id}/delivery", response_model=AuctionResponse)
async def set_delivery_method(
    auction_id: UUID,
    delivery_data: AuctionSetDeliveryRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Buyer sets delivery method and address after winning auction.
    Generates OTP if delivery method is 'pickup' (immediate handoff).
    """
    if current_user.get("role") != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can set delivery method"
        )

    try:
        result = auction_service.set_delivery_method(
            auction_id=str(auction_id),
            buyer_id=current_user["id"],
            delivery_method=delivery_data.delivery_method,
            delivery_address=delivery_data.delivery_address
        )
        return result["auction"]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Set delivery method error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to set delivery method: {str(e)}")


@router.patch("/{auction_id}/delivery/confirm", response_model=AuctionDeliveryConfirmResponse)
async def confirm_delivery(
    auction_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Shop confirms delivery arrangement.
    Generates OTP for home delivery (pickup already has OTP from set_delivery_method).
    """
    if current_user.get("role") != "shop_owner":
        raise HTTPException(
            status_code=403,
            detail="Only shop owners can confirm delivery"
        )

    try:
        result = auction_service.confirm_delivery(
            auction_id=str(auction_id),
            shop_id=current_user["id"]
        )
        return {
            "auction_id": result["auction"]["id"],
            "status": result["auction"]["status"],
            "delivery_confirmed_by_shop": result["auction"]["delivery_confirmed_by_shop"],
            "delivery_response_at": result["auction"]["delivery_response_at"],
            "verification_code": result.get("verification_code"),
            "message": "Delivery confirmed successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Confirm delivery error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to confirm delivery: {str(e)}")


@router.patch("/{auction_id}/delivery/deny", response_model=AuctionResponse)
async def deny_delivery(
    auction_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Shop denies delivery arrangement.
    Clears OTP and gives buyer option to switch to pickup.
    """
    if current_user.get("role") != "shop_owner":
        raise HTTPException(
            status_code=403,
            detail="Only shop owners can deny delivery"
        )

    try:
        result = auction_service.deny_delivery(
            auction_id=str(auction_id),
            shop_id=current_user["id"]
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Deny delivery error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to deny delivery: {str(e)}")


@router.patch("/{auction_id}/switch-to-pickup", response_model=AuctionResponse)
async def switch_to_pickup(
    auction_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Buyer switches to pickup after shop denies delivery.
    Generates new OTP for pickup handoff.
    """
    if current_user.get("role") != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can switch to pickup"
        )

    try:
        result = auction_service.switch_to_pickup(
            auction_id=str(auction_id),
            buyer_id=current_user["id"]
        )
        return result["auction"]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Switch to pickup error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to switch to pickup: {str(e)}")


@router.post("/{auction_id}/verify-otp", response_model=AuctionVerifyOTPResponse)
async def verify_otp(
    auction_id: UUID,
    otp_data: AuctionVerifyOTPRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Shop verifies OTP code submitted by buyer.
    On success: auction status becomes 'completed', chat locks.
    Max 5 attempts.
    """
    if current_user.get("role") != "shop_owner":
        raise HTTPException(
            status_code=403,
            detail="Only shop owners can verify OTP"
        )

    try:
        result = auction_service.verify_otp(
            auction_id=str(auction_id),
            shop_id=current_user["id"],
            verification_code=otp_data.verification_code
        )
        return {
            "auction_id": result["auction"]["id"],
            "status": result["auction"]["status"],
            "verification_attempts": result["verification_attempts"],
            "max_attempts": 5,
            "completed": result["completed"],
            "message": result["message"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Verify OTP error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to verify OTP: {str(e)}")


@router.patch("/{auction_id}/override-complete", response_model=AuctionOverrideCompleteResponse)
async def override_complete(
    auction_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Buyer overrides transaction completion after max OTP attempts.
    Used when shop is unable or refuses to verify OTP.
    Sets status='completed' and locks chat.
    """
    if current_user.get("role") != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can override completion"
        )

    try:
        result = auction_service.override_complete(
            auction_id=str(auction_id),
            buyer_id=current_user["id"]
        )
        return {
            "auction_id": result["id"],
            "status": result["status"],
            "completed_via_override": result["completed_via_override"],
            "message": "Transaction completed via override"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Override complete error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to complete transaction: {str(e)}")


@router.post("/{auction_id}/relist", response_model=AuctionRelistResponse)
async def relist_auction(
    auction_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Shop relists a cancelled auction.
    Copies core fields into a new auction with fresh start.
    """
    if current_user.get("role") != "shop_owner":
        raise HTTPException(
            status_code=403,
            detail="Only shop owners can relist auctions"
        )

    try:
        result = auction_service.relist_auction(
            auction_id=str(auction_id),
            shop_id=current_user["id"]
        )
        return {
            "original_auction_id": result["original_auction_id"],
            "new_auction_id": result["new_auction_id"],
            "status": "success",
            "message": "Auction relisted successfully"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Relist auction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to relist auction: {str(e)}")