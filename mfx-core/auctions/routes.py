from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from uuid import UUID
import logging
from datetime import datetime

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
        raise HTTPException(status_code=500, detail="Failed to create auction")


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
        if status == "all":
            auctions = auction_service.getAuctions(
                pincode=pincode,
                category=category,
                status=None,
                limit=limit,
                offset=offset
            )
        else:
            auctions = auction_service.getAuctions(
                pincode=pincode,
                category=category,
                status=status,
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