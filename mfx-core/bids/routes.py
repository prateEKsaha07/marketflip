from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from uuid import UUID
import logging
from datetime import datetime

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
from utils.verification import generate_verification_code

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


# ====== GET AUCTION BIDS FOR CURRENT USER ======
# MUST be placed BEFORE /{bid_id} to avoid route conflict
@bid_router.get("/auction-bids")
async def get_auction_bids(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all auction bids placed by the current user.
    Used for the buyer's transaction history.
    Only buyers can access this endpoint.
    """
    if current_user.get("role") != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can view their auction bids"
        )
    
    try:
        response = supabase_admin.table("auction_bids") \
            .select("*") \
            .eq("buyer_id", current_user["id"]) \
            .order("created_at", desc=True) \
            .execute()
        
        return response.data if response.data else []
        
    except Exception as e:
        logger.error(f"Get auction bids error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ====== GET SHOP OWNER'S BIDS ======
# MUST be placed BEFORE /{bid_id} to avoid route conflict
@bid_router.get("/shop-bids")
async def get_shop_bids(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all bids placed by the current shop owner.
    Used for shop owner's transaction history.
    Only shop owners can access this endpoint.
    """
    if current_user.get("role") != "shop_owner":
        raise HTTPException(
            status_code=403,
            detail="Only shop owners can view their bids"
        )
    
    try:
        response = supabase_admin.table("bids") \
            .select("*, requests!bids_request_id_fkey(*, profiles!requests_buyer_id_fkey(full_name, phone))") \
            .eq("shop_id", current_user["id"]) \
            .order("created_at", desc=True) \
            .execute()
        
        return response.data if response.data else []
        
    except Exception as e:
        logger.error(f"Get shop bids error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


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

@bid_router.get("")
async def get_bids(
    request_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get bids based on user role."""
    try:
        if current_user.get("role") == "shop_owner":
            query = supabase_admin.table("bids") \
                .select("*, requests!bids_request_id_fkey(item_name, buyer_id, status)") \
                .eq("shop_id", current_user["id"]) \
                .order("created_at", desc=True)
            
            if request_id:
                query = query.eq("request_id", request_id)
            
            response = query.execute()
            return response.data if response.data else []
            
        elif current_user.get("role") == "buyer":
            requests_response = supabase_admin.table("requests") \
                .select("id") \
                .eq("buyer_id", current_user["id"]) \
                .execute()
            
            request_ids = [req["id"] for req in requests_response.data] if requests_response.data else []
            
            if not request_ids:
                return []
            
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


# ====== GET SINGLE BID BY ID ======
# This MUST come AFTER /auction-bids and /shop-bids
@bid_router.get("/{bid_id}")
async def get_bid_by_id(
    bid_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a single bid by ID.
    Only the shop owner who owns the bid can view it.
    """
    print(f"=== GET BID BY ID ===")
    print(f"Bid ID: {bid_id}")
    print(f"User ID: {current_user['id']}")
    
    if current_user.get("role") != "shop_owner":
        raise HTTPException(status_code=403, detail="Only shop owners can view bid details")
    
    try:
        # Get bid with request details
        bid_response = supabase_admin.table("bids") \
            .select("*, requests!bids_request_id_fkey(*)") \
            .eq("id", str(bid_id)) \
            .execute()
        
        if not bid_response.data:
            raise HTTPException(status_code=404, detail="Bid not found")
        
        bid = bid_response.data[0]
        print(f"Bid found, shop_id: {bid['shop_id']}")
        
        # Check if the current user owns this bid
        if str(bid["shop_id"]) != current_user["id"]:
            raise HTTPException(status_code=403, detail="You don't have permission to view this bid")
        
        return bid
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get bid by ID error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ====== UPDATE BID ======
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


# ====== DELETE BID ======
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


# ====== SELECT BID (UPDATED WITH OTP FOR PICKUP) ======
@bid_router.patch("/{bid_id}/select")
async def select_bid(
    bid_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Select a bid. Buyers only.
    If the request has delivery_method = 'pickup', generates OTP code immediately.
    """
    print(f"=== SELECT BID ROUTE HIT ===")
    print(f"Bid ID: {bid_id}")
    print(f"User: {current_user}")
    
    if current_user.get("role") != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can select bids")
    
    try:
        # Get the bid
        bid_result = supabase_admin.table("bids") \
            .select("*") \
            .eq("id", str(bid_id)) \
            .execute()
        
        if not bid_result.data:
            raise HTTPException(status_code=404, detail="Bid not found")
        
        bid = bid_result.data[0]
        
        # Get the request
        request_result = supabase_admin.table("requests") \
            .select("*") \
            .eq("id", bid["request_id"]) \
            .execute()
        
        if not request_result.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request = request_result.data[0]
        
        # Verify buyer owns the request
        if str(request["buyer_id"]) != current_user["id"]:
            raise HTTPException(
                status_code=403,
                detail="You don't own this request"
            )
        
        # Verify request is open
        if request["status"] != "open":
            raise HTTPException(
                status_code=400,
                detail="Request is not open for bidding"
            )
        
        # Verify bid is pending
        if bid["status"] != "pending":
            raise HTTPException(
                status_code=400,
                detail="Bid is no longer pending"
            )
        
        # ====== CHECK IF PICKUP - GENERATE OTP ======
        verification_code = None
        
        if request.get("delivery_method") == "pickup":
            verification_code = generate_verification_code()
            logger.info(f"=== PICKUP OTP GENERATED ON BID SELECTION ===")
            logger.info(f"Request ID: {request['id']}")
            logger.info(f"Verification Code: {verification_code}")
        
        # Update the bid status to selected
        bid_update = supabase_admin.table("bids") \
            .update({
                "status": "selected",
                "selected_at": datetime.utcnow().isoformat()
            }) \
            .eq("id", str(bid_id)) \
            .execute()
        
        if not bid_update.data:
            raise HTTPException(status_code=400, detail="Failed to select bid")
        
        # Update the request status to purchased
        request_update_data = {
            "status": "purchased",
            "purchased_at": datetime.utcnow().isoformat(),
            "selected_bid_id": str(bid_id)
        }
        
        # If pickup, add verification code and auto-confirm delivery
        if verification_code:
            request_update_data["verification_code"] = verification_code
            request_update_data["verification_attempts"] = 0
            request_update_data["delivery_confirmed_by_shop"] = True
            request_update_data["delivery_response_at"] = datetime.utcnow().isoformat()
            logger.info(f"Pickup auto-confirmed with OTP: {verification_code}")
        
        request_update = supabase_admin.table("requests") \
            .update(request_update_data) \
            .eq("id", request["id"]) \
            .execute()
        
        if not request_update.data:
            # Revert bid status if request update fails
            supabase_admin.table("bids") \
                .update({"status": "pending", "selected_at": None}) \
                .eq("id", str(bid_id)) \
                .execute()
            raise HTTPException(status_code=400, detail="Failed to update request")
        
        updated_request = request_update.data[0]
        
        # Get shop details for response
        shop_result = supabase_admin.table("profiles") \
            .select("shop_name, phone, address") \
            .eq("id", bid["shop_id"]) \
            .execute()
        
        shop_details = shop_result.data[0] if shop_result.data else {}
        
        # Build response
        response_data = {
            "message": "Bid selected successfully!" if not verification_code else "Bid selected successfully! Pickup OTP code generated.",
            "bid": bid_update.data[0],
            "request": updated_request,
            "shop": shop_details
        }
        
        if verification_code:
            response_data["verification_code"] = verification_code
        
        logger.info(f"Bid {bid_id} selected for request {request['id']}")
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Select bid error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ====== GET BUYER DETAILS ======
@bid_router.get("/{bid_id}/buyer")
async def get_buyer_details(
    bid_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Get buyer details for a selected bid.
    Only the shop owner who owns the bid can view buyer details.
    """
    if current_user["role"] != "shop_owner":
        raise HTTPException(status_code=403, detail="Only shop owners can access this route")

    try:
        # Get bid
        bid_details = supabase_admin.table("bids") \
            .select("*") \
            .eq("id", str(bid_id)) \
            .execute()

        if not bid_details.data:
            raise HTTPException(status_code=404, detail="Bid not found!")
        bid = bid_details.data[0]
        if str(bid["shop_id"]) != current_user["id"]:
            raise HTTPException(status_code=403, detail="You don't have permission to access this data")
        if str(bid["status"]) != "selected":
            raise HTTPException(status_code=400, detail="Only selected bids can be shown to the shop owner")

        # Get request details
        request_details = supabase_admin.table("requests") \
            .select("id, buyer_id, item_name, description, budget_min, budget_max, pincode, status, delivery_method, delivery_address, completed_at, delivery_confirmed_by_shop, delivery_response_at, verification_code, verification_attempts, completed_via_override") \
            .eq("id", str(bid["request_id"])) \
            .execute()

        if not request_details.data:
            raise HTTPException(status_code=404, detail="Request not found!")

        request = request_details.data[0]

        # Get user profile details
        buyer_info = supabase_admin.table("profiles") \
            .select("shop_name, phone, pincode, address") \
            .eq("id", str(request["buyer_id"])) \
            .execute()

        if not buyer_info.data:
            raise HTTPException(status_code=404, detail="Buyer info not found!")

        buyer_info = buyer_info.data[0]

        # Update bids table as buyer contact viewed
        supabase_admin.table("bids") \
            .update({"buyer_contact_viewed": True}) \
            .eq("id", str(bid_id)) \
            .execute()
        print("Buyer contact viewed updated in bids table")

        return {
            "bid": {
                "id": bid["id"],
                "price": bid["price"],
                "note": bid["note"],
                "status": bid["status"],
                "created_at": bid["created_at"],
                "selected_at": bid.get("selected_at")
            },
            "request": {
                "id": request.get("id"),
                "buyer_id": request.get("buyer_id"),
                "item_name": request.get("item_name"),
                "description": request.get("description"),
                "budget_min": request.get("budget_min"),
                "budget_max": request.get("budget_max"),
                "pincode": request.get("pincode"),
                "status": request.get("status"),
                "delivery_method": request.get("delivery_method"),
                "delivery_address": request.get("delivery_address"),
                "completed_at": request.get("completed_at"),
                "delivery_confirmed_by_shop": request.get("delivery_confirmed_by_shop"),
                "delivery_response_at": request.get("delivery_response_at"),
                "verification_code": request.get("verification_code"),
                "verification_attempts": request.get("verification_attempts"),
                "completed_via_override": request.get("completed_via_override")
            },
            "buyer": {
                "id": request.get("buyer_id"),
                "phone": buyer_info.get("phone"),
                "address": buyer_info.get("address"),
                "pincode": buyer_info.get("pincode")
            },
            "message": "Buyer, bid and request has been sent to shop_owner side successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get buyer details error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ====== GET BID STATS ======
@bid_router.get("/stats")
async def get_bid_stats(
    current_user: dict = Depends(get_current_user)
):
    """
    Get bid statistics for the shop owner.
    Returns counts of bids by status.
    """
    if current_user.get("role") != "shop_owner":
        raise HTTPException(status_code=403, detail="Only shop owners can view bid statistics")
    
    try:
        response = supabase_admin.table("bids") \
            .select("status") \
            .eq("shop_id", current_user["id"]) \
            .execute()
        
        bids = response.data if response.data else []
        
        stats = {
            "pending": 0,
            "selected": 0,
            "rejected": 0,
            "completed": 0
        }
        
        for bid in bids:
            status = bid.get("status", "pending")
            if status in stats:
                stats[status] += 1
        
        stats["total"] = len(bids)
        
        return stats
        
    except Exception as e:
        logger.error(f"Get bid stats error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))