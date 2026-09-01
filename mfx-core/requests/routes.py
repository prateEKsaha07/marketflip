from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import Optional, List
from uuid import UUID
import logging
from datetime import datetime

from auth.dependencies import get_current_user
from requests.schemas import (
    RequestCreate,
    RequestResponse,
    RequestDetailResponse,
    RequestQueryParams,
    DeliveryUpdate,
    RequestUpdate,
    DeliveryConfirmResponse,
    VerifyOTPRequest, 
    VerifyOTPResponse,
    OverrideCompleteResponse
)

from requests.services import RequestService
from auth.dependencies import supabase_anon, supabase_admin
from utils.verification import generate_verification_code
from chat.services import ChatService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/requests", tags=["requests"])

# Initialize service
request_service = RequestService(supabase_admin, supabase_anon)


# ====== HELPER: Get flagged targets ======
def _get_flagged_targets(target_type: str) -> List[str]:
    """
    Get IDs of targets with pending reports.
    Used to exclude flagged items from browse feeds.
    """
    try:
        response = supabase_admin.table("reports") \
            .select("target_id") \
            .eq("target_type", target_type) \
            .eq("status", "pending") \
            .execute()
        
        return [str(r["target_id"]) for r in response.data] if response.data else []
    except Exception as e:
        logger.error(f"Error getting flagged targets for {target_type}: {e}")
        return []


# ----- Routes -----

@router.post("", response_model=RequestResponse)
async def create_request(
    request_data: RequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new request (buyer only)"""
    if current_user.get("role") != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can create requests"
        )
    
    try:
        request_dict = request_data.model_dump()
        
        result = request_service.create_request(
            buyer_id=current_user["id"],
            request_data=request_dict
        )
        
        if "image_urls" not in result:
            result["image_urls"] = []
        elif result["image_urls"] is None:
            result["image_urls"] = []
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Create request error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create request")


@router.get("")
async def get_requests(
    status: Optional[str] = Query("open", regex="^(open|purchased|completed|deleted|expired|all)$"),
    pincode: Optional[str] = None,
    category: Optional[str] = None,
    sort: str = Query("newest", regex="^(newest|price_asc|price_desc|most_bids)$"),
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get requests with filters, sorting, and exclude flagged items."""
    try:
        print(f"=== GET REQUESTS ===")
        print(f"Status: {status}, Sort: {sort}")
        print(f"User Role: {current_user.get('role')}")
        print(f"User ID: {current_user.get('id')}")
        
        query = supabase_admin.table("requests").select("*")
        
        # ====== EXCLUDE FLAGGED REQUESTS ======
        flagged_ids = _get_flagged_targets("request")
        if flagged_ids:
            print(f"Excluding {len(flagged_ids)} flagged requests from feed")
            query = query.not_.in_("id", flagged_ids)
        
        if status != "all":
            print(f"Filtering by status: {status}")
            query = query.eq("status", status)
        
        if pincode:
            query = query.eq("pincode", pincode)
        
        if category:
            query = query.eq("category", category)
        
        if current_user.get("role") == "buyer":
            print("Filtering by buyer_id for buyer")
            query = query.eq("buyer_id", current_user["id"])
        
        # ====== APPLY SORTING ======
        if sort == "newest":
            query = query.order("created_at", desc=True)
        elif sort == "price_asc":
            query = query.order("budget_min", ascending=True)
        elif sort == "price_desc":
            query = query.order("budget_max", ascending=False)
        elif sort == "most_bids":
            # We'll sort by bid_count after fetching
            query = query.order("created_at", desc=True)
        else:
            query = query.order("created_at", desc=True)
        
        query = query.range(offset, offset + limit - 1)
        
        response = query.execute()
        requests_data = response.data if response.data else []
        print(f"Found: {len(requests_data)} requests (excluded flagged)")
        
        for req in requests_data:
            bid_count_response = supabase_admin.table("bids") \
                .select("id", count="exact") \
                .eq("request_id", req["id"]) \
                .execute()
            
            if hasattr(bid_count_response, 'count'):
                req["bid_count"] = bid_count_response.count
            else:
                req["bid_count"] = len(bid_count_response.data) if bid_count_response.data else 0
            
            print(f"Request {req['id']} has {req['bid_count']} bids")
        
        # If sorting by most_bids, sort after fetching
        if sort == "most_bids":
            requests_data.sort(key=lambda x: x.get("bid_count", 0), reverse=True)
        
        return requests_data
        
    except Exception as e:
        logger.error(f"Get requests error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{request_id}", response_model=RequestDetailResponse)
async def get_request_detail(
    request_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Get request details with bids (bypasses flag filter for detail page).
    Bids are only shown if the current user is the buyer.
    """
    try:
        request_result = supabase_admin.table("requests")\
            .select("*")\
            .eq("id", str(request_id))\
            .execute()
        
        if not request_result.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request = request_result.data[0]
        
        # ALL delivery fields are included
        delivery_fields = [
            "delivery_method",
            "delivery_address",
            "delivery_confirmed_by_shop",
            "delivery_response_at"
        ]
        
        for field in delivery_fields:
            if field not in request:
                request[field] = None
        
        # image_urls is always included
        if "image_urls" not in request:
            request["image_urls"] = []
        elif request["image_urls"] is None:
            request["image_urls"] = []
        
        # Include verification fields
        if "verification_code" not in request:
            request["verification_code"] = None
        if "verification_attempts" not in request:
            request["verification_attempts"] = 0
        if "completed_via_override" not in request:
            request["completed_via_override"] = False
        
        logger.info(f"Request {request_id} delivery_confirmed_by_shop: {request.get('delivery_confirmed_by_shop')}")
        
        if current_user["id"] == request["buyer_id"]:
            bids_result = supabase_admin.table("bids")\
                .select("*, profiles!bids_shop_id_fkey(shop_name, phone, address)")\
                .eq("request_id", str(request_id))\
                .execute()
            
            request["bids"] = bids_result.data if bids_result.data else []
        
        return request
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get request detail error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{request_id}", status_code=204)
async def delete_request(
    request_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a request (soft delete - sets status to 'deleted').
    Only the buyer who created the request can delete it.
    """
    if current_user.get("role") != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can delete requests")
    
    try:
        print(f"=== DELETE REQUEST ===")
        print(f"Request ID: {request_id}")
        print(f"User ID: {current_user['id']}")
        print(f"User Role: {current_user.get('role')}")
        
        check_response = supabase_admin.table("requests") \
            .select("buyer_id, status") \
            .eq("id", str(request_id)) \
            .execute()
        
        print(f"Check response: {check_response.data}")
        
        if not check_response.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request = check_response.data[0]
        
        if str(request["buyer_id"]) != current_user["id"]:
            raise HTTPException(status_code=403, detail="You don't have permission to delete this request")
        
        if request["status"] == "deleted":
            raise HTTPException(status_code=400, detail="Request is already deleted")
        
        response = supabase_admin.table("requests") \
            .update({"status": "deleted"}) \
            .eq("id", str(request_id)) \
            .execute()
        
        print(f"Update response: {response.data}")
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to delete request")
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete request error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ====== OTP VERIFICATION ENDPOINTS ======

@router.patch("/{request_id}/delivery/confirm", response_model=DeliveryConfirmResponse)
async def confirm_delivery(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Shop confirms home delivery for a request.
    - Only the shop owner whose bid was selected can confirm
    - Request must be in 'purchased' state
    - Delivery method must be 'home_delivery'
    - Generates a 4-digit verification code for the transaction
    """
    if current_user.get("role") != "shop_owner":
        raise HTTPException(
            status_code=403,
            detail="Not a shop owner"
        )

    try:
        # Get request
        request_result = supabase_admin.table("requests")\
            .select("*")\
            .eq("id", request_id)\
            .execute()
        
        if not request_result.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request = request_result.data[0]
        
        if request["status"] != "purchased":
            raise HTTPException(
                status_code=400,
                detail="Request must be in purchased state"
            )
        
        # Verify shop is the selected one
        if request.get("selected_bid_id"):
            bid_result = supabase_admin.table("bids")\
                .select("shop_id")\
                .eq("id", request["selected_bid_id"])\
                .execute()
            
            if not bid_result.data:
                raise HTTPException(status_code=400, detail="Selected bid not found")
            
            if bid_result.data[0]["shop_id"] != current_user["id"]:
                raise HTTPException(
                    status_code=403,
                    detail="Only the selected shop can confirm delivery"
                )
        else:
            raise HTTPException(status_code=400, detail="No bid selected for this request")
        
        # Generate verification code
        verification_code = generate_verification_code()
        
        # Update request
        result = supabase_admin.table("requests")\
            .update({
                "delivery_confirmed_by_shop": True,
                "delivery_response_at": datetime.utcnow().isoformat(),
                "verification_code": verification_code,
                "verification_attempts": 0
            })\
            .eq("id", request_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=400,
                detail="Failed to confirm delivery"
            )
        
        updated_request = result.data[0]
        
        logger.info(f"Delivery confirmed for request {request_id}. Verification code generated.")
        
        return DeliveryConfirmResponse(
            request_id=updated_request["id"],
            delivery_confirmed_by_shop=updated_request["delivery_confirmed_by_shop"],
            delivery_response_at=updated_request["delivery_response_at"],
            verification_code=verification_code
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Confirm delivery error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{request_id}/delivery/deny", response_model=DeliveryConfirmResponse)
async def deny_delivery(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Shop denies home delivery for a request.
    - Only the shop owner whose bid was selected can deny
    - Request must be in 'purchased' state
    - Delivery method must be 'home_delivery'
    """
    if current_user.get("role") != "shop_owner":
        raise HTTPException(
            status_code=403,
            detail="Only shop owners can deny delivery"
        )
    
    try:
        # Get request
        request_result = supabase_admin.table("requests")\
            .select("*")\
            .eq("id", request_id)\
            .execute()
        
        if not request_result.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request = request_result.data[0]
        
        if request["status"] != "purchased":
            raise HTTPException(
                status_code=400,
                detail="Request must be in purchased state"
            )
        
        # Verify shop is the selected one
        if request.get("selected_bid_id"):
            bid_result = supabase_admin.table("bids")\
                .select("shop_id")\
                .eq("id", request["selected_bid_id"])\
                .execute()
            
            if not bid_result.data:
                raise HTTPException(status_code=400, detail="Selected bid not found")
            
            if bid_result.data[0]["shop_id"] != current_user["id"]:
                raise HTTPException(
                    status_code=403,
                    detail="Only the selected shop can deny delivery"
                )
        else:
            raise HTTPException(status_code=400, detail="No bid selected for this request")
        
        # Update request - clear verification code if exists
        result = supabase_admin.table("requests")\
            .update({
                "delivery_confirmed_by_shop": False,
                "delivery_response_at": datetime.utcnow().isoformat(),
                "verification_code": None,
                "verification_attempts": 0
            })\
            .eq("id", request_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=400,
                detail="Failed to deny delivery"
            )
        
        updated_request = result.data[0]
        
        return DeliveryConfirmResponse(
            request_id=updated_request["id"],
            delivery_confirmed_by_shop=updated_request["delivery_confirmed_by_shop"],
            delivery_response_at=updated_request["delivery_response_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Deny delivery error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{request_id}/switch-to-pickup")
async def switch_to_pickup(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Switch a purchased request from home_delivery to pickup.
    
    Used when:
    1. Shop denies home delivery
    2. Buyer chooses to pickup instead
    
    This sets delivery_method to 'pickup' and auto-confirms delivery
    and generates a verification code.
    """
    if current_user.get("role") != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can switch to pickup"
        )
    
    request_result = supabase_admin.table("requests")\
        .select("*")\
        .eq("id", request_id)\
        .execute()
    
    if not request_result.data:
        raise HTTPException(status_code=404, detail="Request not found")
    
    request = request_result.data[0]
    
    if request["buyer_id"] != current_user["id"]:
        raise HTTPException(
            status_code=403,
            detail="You don't own this request"
        )
    
    if request["status"] != "purchased":
        raise HTTPException(
            status_code=400,
            detail="Only purchased requests can be switched to pickup"
        )
    
    if request["delivery_method"] != "home_delivery":
        raise HTTPException(
            status_code=400,
            detail="Request is already set to pickup or no delivery method selected"
        )
    
    # Generate verification code
    verification_code = generate_verification_code()
    
    try:
        result = supabase_admin.table("requests")\
            .update({
                "delivery_method": "pickup",
                "delivery_confirmed_by_shop": True,
                "delivery_response_at": datetime.utcnow().isoformat(),
                "verification_code": verification_code,
                "verification_attempts": 0
            })\
            .eq("id", request_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=400,
                detail="Failed to switch to pickup"
            )
        
        updated_request = result.data[0]
        
        logger.info(f"Switched to pickup for request {request_id}. Verification code generated.")
        
        return {
            "message": "Successfully switched to pickup. Verification code generated.",
            "request": {
                "id": updated_request["id"],
                "delivery_method": updated_request["delivery_method"],
                "delivery_confirmed_by_shop": updated_request["delivery_confirmed_by_shop"],
                "delivery_response_at": updated_request["delivery_response_at"],
                "status": updated_request["status"],
                "verification_code": verification_code
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Switch to pickup error for request {request_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to switch to pickup: {str(e)}"
        )


@router.patch("/{request_id}/delivery")
async def set_delivery_method(
    request_id: str,
    delivery_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Set delivery method for a purchased request.
    
    Used when:
    1. Buyer initially selects delivery method
    2. Sets delivery_method and delivery_address
    """
    if current_user.get("role") != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can set delivery method"
        )
    
    # Get request
    request_result = supabase_admin.table("requests")\
        .select("*")\
        .eq("id", request_id)\
        .execute()
    
    if not request_result.data:
        raise HTTPException(status_code=404, detail="Request not found")
    
    request = request_result.data[0]
    
    if request["buyer_id"] != current_user["id"]:
        raise HTTPException(
            status_code=403,
            detail="You don't own this request"
        )
    
    if request["status"] != "purchased":
        raise HTTPException(
            status_code=400,
            detail="Only purchased requests can set delivery method"
        )
    
    delivery_method = delivery_data.get("delivery_method")
    if delivery_method not in ["home_delivery", "pickup"]:
        raise HTTPException(
            status_code=400,
            detail="delivery_method must be 'home_delivery' or 'pickup'"
        )
    
    # BUILD UPDATE DATA
    update_data = {}
    
    # Always include these
    update_data["delivery_method"] = delivery_method
    update_data["delivery_address"] = delivery_data.get("delivery_address")
    
    if delivery_method == "pickup":
        # Generate verification code for pickup
        verification_code = generate_verification_code()
        
        logger.info(f"=== PICKUP OTP GENERATED ===")
        logger.info(f"Request ID: {request_id}")
        logger.info(f"Verification Code: {verification_code}")
        
        # For pickup, auto-confirm and generate OTP
        update_data["delivery_confirmed_by_shop"] = True
        update_data["delivery_response_at"] = datetime.utcnow().isoformat()
        update_data["verification_code"] = verification_code
        update_data["verification_attempts"] = 0
        
        logger.info(f"Update data for pickup: {update_data}")
    
    try:
        # PERFORM UPDATE
        result = supabase_admin.table("requests")\
            .update(update_data)\
            .eq("id", request_id)\
            .execute()
        
        logger.info(f"Result data: {result.data}")
        
        if not result.data:
            raise HTTPException(
                status_code=400,
                detail="Failed to set delivery method"
            )
        
        updated_request = result.data[0]
        logger.info(f"Updated request: {updated_request}")
        
        # RETURN RESPONSE
        response_data = {
            "message": f"Delivery method set to {delivery_method}",
            "request": {
                "id": updated_request["id"],
                "delivery_method": updated_request.get("delivery_method"),
                "delivery_address": updated_request.get("delivery_address"),
                "delivery_confirmed_by_shop": updated_request.get("delivery_confirmed_by_shop"),
                "delivery_response_at": updated_request.get("delivery_response_at"),
                "status": updated_request.get("status"),
                "verification_code": updated_request.get("verification_code")
            }
        }
        
        logger.info(f"Response: {response_data}")
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Set delivery method error for request {request_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to set delivery method: {str(e)}"
        )


@router.post("/{request_id}/verify-otp")
async def verify_otp(
    request_id: UUID,
    payload: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Shop verifies transaction with OTP code.
    Max 5 attempts. Buyer can override after cap.
    
    Request body: {"code": "1234"}
    """
    if current_user.get("role") != "shop_owner":
        raise HTTPException(
            status_code=403,
            detail="Only shop owners can verify OTP"
        )
    
    code = payload.get("code")
    if not code or len(code) != 4 or not code.isdigit():
        raise HTTPException(
            status_code=400,
            detail="Invalid code format. Must be 4 digits."
        )
    
    try:
        # Get request
        request_result = supabase_admin.table("requests")\
            .select("*")\
            .eq("id", str(request_id))\
            .execute()
        
        if not request_result.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request = request_result.data[0]
        
        if request["status"] != "purchased":
            raise HTTPException(
                status_code=400,
                detail="Request must be in purchased state"
            )
        
        # Verify shop is the selected one
        if request.get("selected_bid_id"):
            bid_result = supabase_admin.table("bids")\
                .select("shop_id")\
                .eq("id", request["selected_bid_id"])\
                .execute()
            
            if not bid_result.data:
                raise HTTPException(status_code=400, detail="Selected bid not found")
            
            if bid_result.data[0]["shop_id"] != current_user["id"]:
                raise HTTPException(
                    status_code=403,
                    detail="Only the selected shop can verify the transaction"
                )
        else:
            raise HTTPException(status_code=400, detail="No bid selected for this request")
        
        # Check if already completed
        if request["status"] == "completed":
            raise HTTPException(status_code=400, detail="Transaction already completed")
        
        # Check attempts
        attempts = request.get("verification_attempts", 0)
        if attempts >= 5:
            raise HTTPException(
                status_code=400,
                detail="Maximum verification attempts exceeded. Buyer must override."
            )
        
        # Verify code
        stored_code = request.get("verification_code")
        if not stored_code:
            raise HTTPException(
                status_code=400,
                detail="No verification code generated. Delivery must be confirmed first."
            )
        
        if code == stored_code:
            # Success!
            result = supabase_admin.table("requests")\
                .update({
                    "status": "completed",
                    "completed_at": datetime.utcnow().isoformat(),
                    "verification_code": None
                })\
                .eq("id", str(request_id))\
                .execute()
            
            if not result.data:
                raise HTTPException(status_code=400, detail="Failed to complete transaction")
            
            logger.info(f"Transaction {request_id} verified by shop {current_user['id']}")
            
            # LOCK CHAT
            try:
                bid_result = supabase_admin.table("bids") \
                    .select("shop_id") \
                    .eq("id", request["selected_bid_id"]) \
                    .execute()
                
                if bid_result.data:
                    shop_id = bid_result.data[0]["shop_id"]
                    buyer_id = request["buyer_id"]
                    
                    chat_service = ChatService(supabase_admin, supabase_anon)
                    conversation = chat_service.get_or_create_conversation(
                        buyer_id=buyer_id,
                        shop_id=shop_id
                    )
                    chat_service.lock_conversation(conversation["id"])
                    logger.info(f"Chat locked for conversation {conversation['id']}")
            except Exception as e:
                logger.error(f"Error locking chat: {e}")
            
            return {
                "message": "Transaction verified successfully!",
                "status": "completed"
            }
        else:
            # Failed attempt
            new_attempts = attempts + 1
            result = supabase_admin.table("requests")\
                .update({
                    "verification_attempts": new_attempts
                })\
                .eq("id", str(request_id))\
                .execute()
            
            remaining = 5 - new_attempts
            if remaining <= 0:
                raise HTTPException(
                    status_code=400,
                    detail="Verification failed. Maximum attempts reached. Buyer must override."
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Incorrect code. {remaining} attempt(s) remaining."
                )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verify OTP error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{request_id}/override-complete")
async def override_complete(
    request_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Buyer manually marks transaction as completed after max attempts exceeded.
    Sets completed_via_override = true for audit trail.
    """
    if current_user.get("role") != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can override"
        )
    
    try:
        # Get request
        request_result = supabase_admin.table("requests")\
            .select("*")\
            .eq("id", str(request_id))\
            .execute()
        
        if not request_result.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request = request_result.data[0]
        
        if request["status"] != "purchased":
            raise HTTPException(
                status_code=400,
                detail="Request must be in purchased state"
            )
        
        if request["buyer_id"] != current_user["id"]:
            raise HTTPException(
                status_code=403,
                detail="Only the buyer can override"
            )
        
        attempts = request.get("verification_attempts", 0)
        if attempts < 5:
            raise HTTPException(
                status_code=400,
                detail=f"Must exhaust all 5 attempts before override. {5 - attempts} remaining."
            )
        
        result = supabase_admin.table("requests")\
            .update({
                "status": "completed",
                "completed_at": datetime.utcnow().isoformat(),
                "completed_via_override": True,
                "verification_code": None
            })\
            .eq("id", str(request_id))\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to complete transaction")
        
        logger.info(f"Transaction {request_id} completed via override by buyer {current_user['id']}")
        
        # LOCK CHAT
        try:
            bid_result = supabase_admin.table("bids") \
                .select("shop_id") \
                .eq("id", request["selected_bid_id"]) \
                .execute()
            
            if bid_result.data:
                shop_id = bid_result.data[0]["shop_id"]
                buyer_id = request["buyer_id"]
                
                chat_service = ChatService(supabase_admin, supabase_anon)
                conversation = chat_service.get_or_create_conversation(
                    buyer_id=buyer_id,
                    shop_id=shop_id
                )
                chat_service.lock_conversation(conversation["id"])
                logger.info(f"Chat locked for conversation {conversation['id']}")
        except Exception as e:
            logger.error(f"Error locking chat: {e}")
        
        return {
            "message": "Transaction completed via override.",
            "completed_via_override": True,
            "status": "completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Override complete error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{request_id}/verify")
async def verify_transaction(
    request_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    [DEPRECATED] Verify transaction completion. Buyers only.
    This is being replaced by the OTP flow.
    Kept for backward compatibility.
    """
    if current_user.get("role") != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can verify transactions")
    
    try:
        check_response = supabase_admin.table("requests") \
            .select("buyer_id, status") \
            .eq("id", str(request_id)) \
            .execute()
        
        if not check_response.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request = check_response.data[0]
        
        if str(request["buyer_id"]) != current_user["id"]:
            raise HTTPException(status_code=403, detail="Permission denied")
        
        if request["status"] != "purchased":
            raise HTTPException(status_code=400, detail="Only purchased requests can be verified")
        
        response = supabase_admin.table("requests") \
            .update({
                "status": "completed",
                "completed_at": datetime.now().isoformat()
            }) \
            .eq("id", str(request_id)) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to verify transaction")
        
        return {
            "message": "Transaction verified successfully!",
            "request_id": str(request_id),
            "status": "completed",
            "completed_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verify transaction error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{request_id}")
async def update_request(
    request_id: UUID,
    update_data: RequestUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a request.
    Only the buyer who created the request can update it.
    """
    if current_user.get("role") != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can update requests")
    
    try:
        check_response = supabase_admin.table("requests") \
            .select("buyer_id, status") \
            .eq("id", str(request_id)) \
            .execute()
        
        if not check_response.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request = check_response.data[0]
        
        if str(request["buyer_id"]) != current_user["id"]:
            raise HTTPException(status_code=403, detail="You don't have permission to update this request")
        
        if request["status"] != "open":
            raise HTTPException(status_code=400, detail="Only open requests can be updated")
        
        update_dict = {}
        if update_data.item_name is not None:
            update_dict["item_name"] = update_data.item_name
        if update_data.description is not None:
            update_dict["description"] = update_data.description
        if update_data.budget_min is not None:
            update_dict["budget_min"] = update_data.budget_min
        if update_data.budget_max is not None:
            update_dict["budget_max"] = update_data.budget_max
        if update_data.pincode is not None:
            if len(update_data.pincode) != 6 or not update_data.pincode.isdigit():
                raise HTTPException(status_code=400, detail="Pincode must be 6 digits")
            update_dict["pincode"] = update_data.pincode
        if update_data.category is not None:
            update_dict["category"] = update_data.category
        if update_data.reference_url is not None:
            update_dict["reference_url"] = update_data.reference_url
        if update_data.reference_image is not None:
            update_dict["reference_image"] = update_data.reference_image
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        response = supabase_admin.table("requests") \
            .update(update_dict) \
            .eq("id", str(request_id)) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to update request")
        
        return {
            "message": "Request updated successfully",
            "request": response.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update request error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/test-completed")
async def test_completed(
    current_user: dict = Depends(get_current_user)
):
    """Test endpoint to debug completed status"""
    try:
        response = supabase_admin.table("requests").select("*").execute()
        
        statuses = {}
        for req in response.data:
            s = req.get("status", "unknown")
            statuses[s] = statuses.get(s, 0) + 1
        
        completed = [r for r in response.data if r.get("status") == "completed"]
        
        return {
            "total": len(response.data),
            "status_counts": statuses,
            "completed_count": len(completed),
            "completed_requests": completed
        }
    except Exception as e:
        return {"error": str(e)}