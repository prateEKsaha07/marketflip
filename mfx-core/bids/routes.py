from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from uuid import UUID
import logging

from auth.dependencies import get_current_user
from bids.schemas import (
    BidCreate,
    BidUpdate,
    BidResponse,
    BidDetailResponse,
    BidSelectionResponse
)
from bids.services import BidService
from auth.dependencies import supabase_anon, supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/requests", tags=["bids"])

# Initialize service
bid_service = BidService(supabase_admin, supabase_anon)

# ----- Routes -----

@router.post("/{request_id}/bids", response_model=BidResponse, status_code=201)
async def create_bid(
    request_id: UUID,
    bid_data: BidCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Place a bid on a request.
    Only shop owners can place bids.
    """
    # Check role
    if current_user.get("role") != "shop_owner":
        raise HTTPException(status_code=403, detail="Only shop owners can place bids")
    
    try:
        result = bid_service.create_bid(
            request_id=str(request_id),
            shop_id=current_user["id"],
            price=bid_data.price,
            note=bid_data.note
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Create bid error: {str(e)}")
        if "Request not found" in str(e):
            raise HTTPException(status_code=404, detail="Request not found")
        if "Cannot bid on a request that is not open" in str(e):
            raise HTTPException(status_code=400, detail="Request is not open for bidding")
        if "You already have a pending bid" in str(e):
            raise HTTPException(status_code=400, detail="You already have a pending bid on this request")
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/bids/{bid_id}", response_model=BidResponse)
async def update_bid(
    bid_id: UUID,
    bid_data: BidUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a pending bid.
    Only the shop owner who created the bid can update it.
    """
    # Check role
    if current_user.get("role") != "shop_owner":
        raise HTTPException(status_code=403, detail="Only shop owners can update bids")
    
    try:
        result = bid_service.update_bid(
            bid_id=str(bid_id),
            shop_id=current_user["id"],
            price=bid_data.price,
            note=bid_data.note
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Update bid error: {str(e)}")
        if "Bid not found" in str(e):
            raise HTTPException(status_code=404, detail="Bid not found")
        if "You don't have permission" in str(e):
            raise HTTPException(status_code=403, detail=str(e))
        if "Cannot update a bid that is not pending" in str(e):
            raise HTTPException(status_code=400, detail="Only pending bids can be updated")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/bids/{bid_id}", status_code=204)
async def delete_bid(
    bid_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Withdraw/delete a pending bid.
    Only the shop owner who created the bid can delete it.
    """
    # Check role
    if current_user.get("role") != "shop_owner":
        raise HTTPException(status_code=403, detail="Only shop owners can delete bids")
    
    try:
        success = bid_service.delete_bid(
            bid_id=str(bid_id),
            shop_id=current_user["id"]
        )
        
        if success:
            return None  # 204 No Content
        
    except Exception as e:
        logger.error(f"Delete bid error: {str(e)}")
        if "Bid not found" in str(e):
            raise HTTPException(status_code=404, detail="Bid not found")
        if "You don't have permission" in str(e):
            raise HTTPException(status_code=403, detail=str(e))
        if "Cannot delete a bid that is not pending" in str(e):
            raise HTTPException(status_code=400, detail="Only pending bids can be deleted")
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/bids/{bid_id}/select", response_model=BidSelectionResponse)
async def select_bid(
    bid_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Select a bid.
    Only the buyer who owns the request can select a bid.
    """
    # Check role
    if current_user.get("role") != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can select bids")
    
    try:
        result = bid_service.select_bid(
            bid_id=str(bid_id),
            buyer_id=current_user["id"]
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Select bid error: {str(e)}")
        if "Bid not found" in str(e):
            raise HTTPException(status_code=404, detail="Bid not found")
        if "You don't have permission" in str(e):
            raise HTTPException(status_code=403, detail=str(e))
        if "Cannot select a bid on a request that is not open" in str(e):
            raise HTTPException(status_code=400, detail="Request is not open for selection")
        if "Cannot select a bid that is not pending" in str(e):
            raise HTTPException(status_code=400, detail="Bid is no longer pending")
        raise HTTPException(status_code=400, detail=str(e))