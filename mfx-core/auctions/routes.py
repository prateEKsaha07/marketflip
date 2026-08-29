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
    AuctionBidResponse
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
    status: str = Query("active", pattern="^(active|sold|expired|cancelled|all)$"),
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


# ====== NEW: Close Auction with Winner (Internal Endpoint) ======
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
    # Allow service role or admin access
    # The Edge Function calls with a valid Supabase service role token
    
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