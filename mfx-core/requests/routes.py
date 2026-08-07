from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from uuid import UUID
import logging

from auth.dependencies import get_current_user
from requests.schemas import (
    RequestCreate, 
    RequestResponse, 
    RequestDetailResponse,
    RequestQueryParams
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
    status: Optional[str] = Query("open", regex="^(open|purchased|deleted|expired|all)$"),
    pincode: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get requests with filters. Shop owners browse all open requests."""
    try:
        # Build query - DO NOT filter by buyer_id for shop owners
        query = supabase_anon.table("requests").select("*")
        
        # Only apply status filter if not 'all'
        if status != "all":
            query = query.eq("status", status)
        # If status is 'all', don't apply status filter
        
        if pincode:
            query = query.eq("pincode", pincode)
        
        if category:
            query = query.eq("category", category)
        
        query = query.order("created_at", desc=True)
        query = query.range(offset, offset + limit - 1)
        
        response = query.execute()
        print(f"Requests found: {len(response.data) if response.data else 0}")
        return response.data if response.data else []
        
    except Exception as e:
        logger.error(f"Get requests error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    
# @router.get("/")
# async def get_requests(
#     status: Optional[str] = Query("open", regex="^(open|purchased|deleted|expired|all)$"),
#     pincode: Optional[str] = None,
#     category: Optional[str] = None,
#     limit: int = 100,
#     offset: int = 0,
#     current_user: dict = Depends(get_current_user)
# ):
#     """Get requests with filters."""
#     try:
#         # Build query
#         query = supabase_anon.table("requests").select("*")
        
#         # Only apply status filter if not 'all'
#         if status != "all":
#             query = query.eq("status", status)
        
#         if pincode:
#             query = query.eq("pincode", pincode)
        
#         if category:
#             query = query.eq("category", category)
        
#         # If user is a buyer, only show their own requests
#         if current_user.get("role") == "buyer":
#             query = query.eq("buyer_id", current_user["id"])
#         # If user is a shop owner, show all open requests (for browsing)
#         # No buyer_id filter for shop owners
        
#         query = query.order("created_at", desc=True)
#         query = query.range(offset, offset + limit - 1)
        
#         response = query.execute()
#         print(f"Requests found: {len(response.data) if response.data else 0}")
#         print(f"User role: {current_user.get('role')}")
#         print(f"User ID: {current_user.get('id')}")
#         return response.data if response.data else []
        
#     except Exception as e:
#         logger.error(f"Get requests error: {str(e)}")
#         raise HTTPException(status_code=400, detail=str(e))

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


# @router.delete("/{request_id}", status_code=204)
# async def delete_request(
#     request_id: UUID,
#     current_user: dict = Depends(get_current_user)
# ):
#     """
#     Delete a request (soft delete - sets status to 'deleted').
#     Only the buyer who created the request can delete it.
#     """
#     # Check role
#     if current_user.get("role") != "buyer":
#         raise HTTPException(status_code=403, detail="Only buyers can delete requests")
    
#     try:
#         # Soft delete request
#         success = request_service.delete_request(
#             request_id=str(request_id),
#             current_user_id=current_user["id"]
#         )
        
#         if success:
#             return None  # 204 No Content
        
#     except Exception as e:
#         logger.error(f"Delete request error: {str(e)}")
#         if "permission" in str(e).lower():
#             raise HTTPException(status_code=403, detail=str(e))
#         if "not found" in str(e).lower():
#             raise HTTPException(status_code=404, detail="Request not found")
#         raise HTTPException(status_code=400, detail=str(e))


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
