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

# Two routers - one for /requests prefix, one for /bids prefix
router = APIRouter(prefix="/requests", tags=["bids"])
bid_router = APIRouter(prefix="/bids", tags=["bids"])

# Initialize service
bid_service = BidService(supabase_admin, supabase_anon)


# ====== TEST ROUTE ======

@bid_router.get("/test")
async def test_bids_route():
    return {"message": "Bids router is working!"}


# ====== /requests/... ENDPOINTS ======

@router.post("/{request_id}/bids", response_model=BidResponse, status_code=201)
async def create_bid(
    request_id: UUID,
    bid_data: BidCreate,
    current_user: dict = Depends(get_current_user)
):
    """Place a bid on a request. Shop owners only."""
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


@router.get("/{request_id}/bids")
async def get_bids_for_request(
    request_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Get all bids for a specific request."""
    try:
        # Check request exists
        request_check = supabase_admin.table("requests") \
            .select("id, buyer_id") \
            .eq("id", str(request_id)) \
            .execute()
        
        if not request_check.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request = request_check.data[0]
        
        is_buyer = str(request["buyer_id"]) == current_user["id"]
        is_shop_owner = current_user.get("role") == "shop_owner"
        
        # Use explicit relationship name to avoid ambiguity
        query = supabase_admin.table("bids") \
            .select("*, profiles!shop_id(shop_name, phone, address)") \
            .eq("request_id", str(request_id)) \
            .order("created_at", desc=True)
        
        # If shop owner, only show their own bids
        if is_shop_owner and not is_buyer:
            query = query.eq("shop_id", current_user["id"])
        
        response = query.execute()
        return response.data if response.data else []
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get bids for request error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ====== /bids/... ENDPOINTS ======

@bid_router.get("/")
async def get_bids(
    request_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get bids based on user role."""
    try:
        if current_user.get("role") == "shop_owner":
            # Use explicit foreign key relationship name
            query = supabase_admin.table("bids") \
                .select("*, requests!bids_request_id_fkey(item_name, buyer_id, status)") \
                .eq("shop_id", current_user["id"]) \
                .order("created_at", desc=True)
            
            if request_id:
                query = query.eq("request_id", request_id)
            
            response = query.execute()
            return response.data if response.data else []
            
        elif current_user.get("role") == "buyer":
            # First get all requests owned by buyer
            requests_response = supabase_admin.table("requests") \
                .select("id") \
                .eq("buyer_id", current_user["id"]) \
                .execute()
            
            request_ids = [req["id"] for req in requests_response.data] if requests_response.data else []
            
            if not request_ids:
                return []
            
            # Get bids for those requests with explicit relationship
            query = supabase_admin.table("bids") \
                .select("*, requests!bids_request_id_fkey(item_name, buyer_id, status), profiles!shop_id(shop_name, phone, address)") \
                .in_("request_id", request_ids) \
                .order("created_at", desc=True)
            
            if request_id:
                query = query.eq("request_id", request_id)
            
            response = query.execute()
            return response.data if response.data else []
            
        else:
            raise HTTPException(status_code=403, detail="Unauthorized role")
            
    except Exception as e:
        logger.error(f"Get bids error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@bid_router.patch("/{bid_id}", response_model=BidResponse)
async def update_bid(
    bid_id: UUID,
    bid_data: BidUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a pending bid. Shop owners only."""
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


@bid_router.delete("/{bid_id}", status_code=204)
async def delete_bid(
    bid_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Withdraw a pending bid. Shop owners only."""
    if current_user.get("role") != "shop_owner":
        raise HTTPException(status_code=403, detail="Only shop owners can delete bids")
    
    try:
        success = bid_service.delete_bid(
            bid_id=str(bid_id),
            shop_id=current_user["id"]
        )
        if success:
            return None
    except Exception as e:
        logger.error(f"Delete bid error: {str(e)}")
        if "Bid not found" in str(e):
            raise HTTPException(status_code=404, detail="Bid not found")
        if "You don't have permission" in str(e):
            raise HTTPException(status_code=403, detail=str(e))
        if "Cannot delete a bid that is not pending" in str(e):
            raise HTTPException(status_code=400, detail="Only pending bids can be deleted")
        raise HTTPException(status_code=400, detail=str(e))


@bid_router.patch("/{bid_id}/select", response_model=BidSelectionResponse)
async def select_bid(
    bid_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Select a bid. Buyers only."""
    print(f"=== SELECT BID ROUTE HIT ===")
    print(f"Bid ID: {bid_id}")
    print(f"User: {current_user}")
    
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