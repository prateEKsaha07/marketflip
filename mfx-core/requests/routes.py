from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from uuid import UUID
import logging
from datetime import datetime

from auth.dependencies import get_current_user
from requests.schemas import (
    RequestCreate, 
    RequestResponse, 
    RequestDetailResponse,
    DeliveryUpdate,
    RequestUpdate,
    DeliveryConfirmresponse
)
from requests.services import RequestService
from auth.dependencies import supabase_anon, supabase_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/requests", tags=["requests"])

# Initialize service
request_service = RequestService(supabase_admin, supabase_anon)

# ----- Routes -----

@router.post("/", response_model=RequestResponse, status_code=201)
async def create_request(
    request_data: RequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new request.
    Only buyers can create requests.
    """
    # Check role
    if current_user.get("role") != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can create requests")
    
    try:
        # Create request - pass buyer_id and request_data as dict
        result = request_service.create_request(
            buyer_id=current_user["id"],
            request_data=request_data.model_dump()  # Use model_dump() instead of dict()
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Create request error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
async def get_requests(
    status: Optional[str] = Query("open", regex="^(open|purchased|completed|deleted|expired|all)$"),
    pincode: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get requests with filters."""
    try:
        print(f"=== GET REQUESTS ===")
        print(f"Status: {status}")
        print(f"User Role: {current_user.get('role')}")
        print(f"User ID: {current_user.get('id')}")
        
        #supabase_admin to bypass RLS
        query = supabase_admin.table("requests").select("*")
        
        if status != "all":
            print(f"Filtering by status: {status}")
            query = query.eq("status", status)
        
        if pincode:
            query = query.eq("pincode", pincode)
        
        if category:
            query = query.eq("category", category)
        
        # For buyers, only show their own requests
        if current_user.get("role") == "buyer":
            print("Filtering by buyer_id for buyer")
            query = query.eq("buyer_id", current_user["id"])
        
        query = query.order("created_at", desc=True)
        query = query.range(offset, offset + limit - 1)
        
        response = query.execute()
        requests_data = response.data if response.data else []
        print(f"Found: {len(requests_data)} requests")
        
        # Added bid count for each request
        for req in requests_data:
            bid_count_response = supabase_admin.table("bids") \
                .select("id", count="exact") \
                .eq("request_id", req["id"]) \
                .execute()
            
            # Get the count from the response
            if hasattr(bid_count_response, 'count'):
                req["bid_count"] = bid_count_response.count
            else:
                # Fallback: count the data array
                req["bid_count"] = len(bid_count_response.data) if bid_count_response.data else 0
            
            print(f"Request {req['id']} has {req['bid_count']} bids")
        
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
    Get request details with bids.
    Bids are only shown if the current user is the buyer.
    """
    try:
        # Get request with bids
        result = request_service.get_request_by_id(
            request_id=str(request_id),
            current_user_id=current_user["id"]
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Get request detail error: {str(e)}")
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Request not found")
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
    # Check role
    if current_user.get("role") != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can delete requests")
    
    try:
        print(f"=== DELETE REQUEST ===")
        print(f"Request ID: {request_id}")
        print(f"User ID: {current_user['id']}")
        print(f"User Role: {current_user.get('role')}")
        
        # Check ownership using supabase_admin
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
        
        # Soft delete - update status
        response = supabase_admin.table("requests") \
            .update({"status": "deleted"}) \
            .eq("id", str(request_id)) \
            .execute()
        
        print(f"Update response: {response.data}")
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to delete request")
        
        return None  # 204 No Content
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete request error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{request_id}/delivery")
async def update_delivery(
    request_id : UUID,
    delivery_data : DeliveryUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    updates delivery method for a purchases request
    Only the buyer who owns the request can update delivery.
    """
    if current_user.get("role") != "buyer":
        raise HTTPException(status_code=403, details= "only buyers can update delivery")

    try:
        if delivery_data.delivery_method not in ['home_delivery','pickup']:
            raise HTTPException(status_code=400, detail='invail delivery method must be home_delivery or pickup')

        check_response = supabase_admin.table("requests") \
            .select('buyer_id, status') \
            .eq('id', str(request_id)) \
            .execute()

        if not check_response.data:
            raise HTTPException(status_code=404, detail="request not found")

        request = check_response.data[0]

        if str(request["buyer_id"]) != current_user["id"]:
            raise HTTPException(status_code=403, detail="ypu dont have permission to update this request")

        if request["status"] != 'purchased':
            raise HTTPException(status_code=403, details = "delivery can only be set on purchased request")
        update_data = {
            "delivery_method" : delivery_data.delivery_method
        }
        
        if delivery_data.delivery_address:
            update_data["delivery_address"] = delivery_data.delivery_address

            response = supabase_admin.table("requests") \
                .update(update_data) \
                .eq("id", str(request_id)) \
                .execute()

            if not response.data:
                raise HTTPException(status_code=400, detail="failed to update delivery")

            return {
                "message": "delivery method updated successfully",
                "request_id": str(request_id),
                "delivery_method" : delivery_data.delivery_method,
                "delivery_address" : delivery_data.delivery_address
            }
    except HTTPException:
        raise
    except Exception as e :
        logger.error(f"update delivery error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{request_id}/verify")
async def verify_transaction(
    request_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Verify transaction completion. Buyers only."""
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

@router.get("/test-completed")
async def test_completed(
    current_user: dict = Depends(get_current_user)
):
    """Test endpoint to debug completed status"""
    try:
        # Use supabase_admin to bypass RLS
        response = supabase_admin.table("requests").select("*").execute()
        
        # Count statuses
        statuses = {}
        for req in response.data:
            s = req.get("status", "unknown")
            statuses[s] = statuses.get(s, 0) + 1
        
        # Get completed requests
        completed = [r for r in response.data if r.get("status") == "completed"]
        
        return {
            "total": len(response.data),
            "status_counts": statuses,
            "completed_count": len(completed),
            "completed_requests": completed
        }
    except Exception as e:
        return {"error": str(e)}

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
    # Check role
    if current_user.get("role") != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can update requests")
    
    try:
        # Check request exists and belongs to buyer
        check_response = supabase_admin.table("requests") \
            .select("buyer_id, status") \
            .eq("id", str(request_id)) \
            .execute()
        
        if not check_response.data:
            raise HTTPException(status_code=404, detail="Request not found")
        
        request = check_response.data[0]
        
        if str(request["buyer_id"]) != current_user["id"]:
            raise HTTPException(status_code=403, detail="You don't have permission to update this request")
        
        # Only allow updates if status is 'open'
        if request["status"] != "open":
            raise HTTPException(status_code=400, detail="Only open requests can be updated")
        
        # Build update data (only include fields that are provided)
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
        
        # Update the request
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

@router.patch("/{request_id}/delivery/confirm", response_model=DeliveryConfirmresponse)
async def confirm_delivery(
    request_id : str,
    current_user : dict  = Depends(get_current_user)
):
   """
    Shop confirms home delivery for a request.
    - Only the shop owner whose bid was selected can confirm
    - Request must be in 'purchased' state
    - Delivery method must be 'home_delivery'
    """

   if current_user.get("role") != "shop_owner":
       raise HTTPException(
           status_code=403,
           detail="not a shop owner"
       )

   try:
       service = RequestService(supabase_admin,supabase_anon)
       updated_request = service.confirm_delivery(
           request_id=request_id,
           shop_id=current_user["id"]
       )
   except Exception as e :
       raise HTTPException(
           status_code=400,
           detail=str(e)
       )
   return DeliveryConfirmresponse(
        request_id=updated_request["id"],
        delivery_confirmed_by_shop=updated_request["delivery_confirmed_by_shop"],
        delivery_response_at=updated_request["delivery_response_at"]
   )

@router.patch("/{request_id}/delivery/deny")
async def deny_delivery(request_id: UUID, current_user: dict = Depends(get_current_user)):
    """
    same as confirm just exchanged the funtions
    """
    if current_user["role"] != "shop_owner":
        raise HTTPException(status_code=403, detail="Only shop owners can deny delivery")
    try:
           service = RequestService(supabase_admin,supabase_anon)
           updated_request = service.deny_delivery(
               request_id=request_id,
               shop_id=current_user["id"]
           )
    except Exception as e :
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    return DeliveryConfirmresponse(
            request_id=updated_request["id"],
            delivery_confirmed_by_shop=updated_request["delivery_confirmed_by_shop"],
            delivery_response_at=updated_request["delivery_response_at"]
       )

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
    so the buyer can immediately verify the transaction.
    """
    # 1. Verify user is a buyer
    if current_user.get("role") != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can switch to pickup"
        )
    
    # 2. Get the request
    request_result = supabase_admin.table("requests")\
        .select("*")\
        .eq("id", request_id)\
        .execute()
    
    if not request_result.data:
        raise HTTPException(status_code=404, detail="Request not found")
    
    request = request_result.data[0]
    
    # 3. Verify buyer owns this request
    if request["buyer_id"] != current_user["id"]:
        raise HTTPException(
            status_code=403,
            detail="You don't own this request"
        )
    
    # 4. Validate state
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
    
    # 5. Update to pickup
    try:
        result = supabase_admin.table("requests")\
            .update({
                "delivery_method": "pickup",
                "delivery_confirmed_by_shop": True,  # Auto-confirm for pickup
                "delivery_response_at": datetime.utcnow().isoformat()
            })\
            .eq("id", request_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=400,
                detail="Failed to switch to pickup"
            )
        
        updated_request = result.data[0]
        
        return {
            "message": "Successfully switched to pickup",
            "request": {
                "id": updated_request["id"],
                "delivery_method": updated_request["delivery_method"],
                "delivery_confirmed_by_shop": updated_request["delivery_confirmed_by_shop"],
                "delivery_response_at": updated_request["delivery_response_at"],
                "status": updated_request["status"]
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
    delivery_data: dict,  # { "delivery_method": "home_delivery", "delivery_address": "..." }
    current_user: dict = Depends(get_current_user)
):
    """
    Set delivery method for a purchased request.
    
    Used when:
    1. Buyer initially selects delivery method
    2. Sets delivery_method and delivery_address
    """
    # Verify user is a buyer
    if current_user.get("role") != "buyer":
        raise HTTPException(
            status_code=403,
            detail="Only buyers can set delivery method"
        )
    
    # Get the request
    request_result = supabase_admin.table("requests")\
        .select("*")\
        .eq("id", request_id)\
        .execute()
    
    if not request_result.data:
        raise HTTPException(status_code=404, detail="Request not found")
    
    request = request_result.data[0]
    
    # Verify buyer owns this request
    if request["buyer_id"] != current_user["id"]:
        raise HTTPException(
            status_code=403,
            detail="You don't own this request"
        )
    
    # Validate state
    if request["status"] != "purchased":
        raise HTTPException(
            status_code=400,
            detail="Only purchased requests can set delivery method"
        )
    
    # Validate delivery method
    delivery_method = delivery_data.get("delivery_method")
    if delivery_method not in ["home_delivery", "pickup"]:
        raise HTTPException(
            status_code=400,
            detail="delivery_method must be 'home_delivery' or 'pickup'"
        )
    
    # Prepare update data
    update_data = {
        "delivery_method": delivery_method,
        "delivery_address": delivery_data.get("delivery_address")
    }
    
    # If pickup, auto-confirm
    if delivery_method == "pickup":
        update_data["delivery_confirmed_by_shop"] = True
        update_data["delivery_response_at"] = datetime.utcnow().isoformat()
    
    try:
        result = supabase_admin.table("requests")\
            .update(update_data)\
            .eq("id", request_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=400,
                detail="Failed to set delivery method"
            )
        
        updated_request = result.data[0]
        
        return {
            "message": f"Delivery method set to {delivery_method}",
            "request": {
                "id": updated_request["id"],
                "delivery_method": updated_request["delivery_method"],
                "delivery_address": updated_request.get("delivery_address"),
                "delivery_confirmed_by_shop": updated_request.get("delivery_confirmed_by_shop"),
                "status": updated_request["status"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Set delivery method error for request {request_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to set delivery method: {str(e)}"
        )