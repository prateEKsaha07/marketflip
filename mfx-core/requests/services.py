from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class RequestService:
    def __init__(self, supabase_admin: Client, supabase_anon: Client):
        self.supabase_admin = supabase_admin
        self.supabase_anon = supabase_anon
    
    def create_request(self, buyer_id: str, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new request"""
        try:
            # Start with required fields only
            data = {
                "buyer_id": buyer_id,
                "item_name": request_data["item_name"],
                "budget_min": request_data["budget_min"],
                "budget_max": request_data["budget_max"],
                "pincode": request_data["pincode"],
                "status": "open",
                "category": request_data.get("category", "electronics")
            }
            
            # Add optional fields only if they exist in request_data
            optional_fields = ["description", "reference_url", "reference_image"]
            for field in optional_fields:
                if field in request_data and request_data[field] is not None:
                    data[field] = request_data[field]
            
            logger.info(f"Inserting data: {data}")
            
            response = self.supabase_admin.table("requests").insert(data).execute()
            
            if not response.data:
                raise Exception("Failed to create request")
            
            return response.data[0]
            
        except Exception as e:
            logger.error(f"Error creating request: {str(e)}")
            raise
    
    def get_requests(
        self, 
        pincode: Optional[str] = None,
        category: Optional[str] = None,
        status: str = "open",
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get requests with filters"""
        try:
            query = self.supabase_anon.table("requests").select("*")
            
            # Apply filters
            query = query.eq("status", status)
            
            if pincode:
                query = query.eq("pincode", pincode)
            
            if category:
                query = query.eq("category", category)
            
            # Order by created_at descending
            query = query.order("created_at", desc=True)
            
            # Pagination
            query = query.range(offset, offset + limit - 1)
            
            response = query.execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Error fetching requests: {str(e)}")
            raise
    
    def get_request_by_id(self, request_id: str, current_user_id: str) -> Dict[str, Any]:
        """Get request by ID with bids (if user is buyer)"""
        try:
            # Get request
            request_response = self.supabase_anon.table("requests") \
                .select("*") \
                .eq("id", request_id) \
                .execute()
            
            if not request_response.data:
                raise Exception("Request not found")
            
            request = request_response.data[0]
            
            # Check if current user is the buyer
            is_buyer = str(request["buyer_id"]) == current_user_id
            
            # Get bids if user is the buyer
            bids = []
            if is_buyer:
                bids_response = self.supabase_anon.table("bids") \
                    .select("*, profiles!shop_id(shop_name)") \
                    .eq("request_id", request_id) \
                    .execute()
                
                if bids_response.data:
                    for bid in bids_response.data:
                        bids.append({
                            "id": bid["id"],
                            "request_id": bid["request_id"],
                            "shop_id": bid["shop_id"],
                            "price": bid["price"],
                            "note": bid.get("note"),
                            "status": bid["status"],
                            "created_at": bid["created_at"],
                            "shop_name": bid.get("profiles", {}).get("shop_name") if bid.get("profiles") else None
                        })
            
            request["bids"] = bids
            return request
            
        except Exception as e:
            logger.error(f"Error fetching request {request_id}: {str(e)}")
            raise
    
    def delete_request(self, request_id: str, current_user_id: str) -> bool:
        """Soft delete a request (set status to 'deleted')"""
        try:
            # Check ownership
            check_response = self.supabase_admin.table("requests") \
                .select("buyer_id") \
                .eq("id", request_id) \
                .execute()
            
            if not check_response.data:
                raise Exception("Request not found")
            
            if str(check_response.data[0]["buyer_id"]) != current_user_id:
                raise Exception("You don't have permission to delete this request")
            
            # Soft delete - update status
            response = self.supabase_admin.table("requests") \
                .update({"status": "deleted"}) \
                .eq("id", request_id) \
                .execute()
            
            if not response.data:
                raise Exception("Failed to delete request")
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting request {request_id}: {str(e)}")
            raise