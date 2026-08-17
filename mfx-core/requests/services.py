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
            # required fields
            data = {
                "buyer_id": buyer_id,
                "item_name": request_data["item_name"],
                "budget_min": request_data["budget_min"],
                "budget_max": request_data["budget_max"],
                "pincode": request_data["pincode"],
                "status": "open",
                "category": request_data.get("category", "electronics")
            }
            
            optional_fields = [
                "description", 
                "reference_url", 
                "reference_image",
                "delivery_method",
                "delivery_address"
                ]
            for field in optional_fields:
                if field in request_data and request_data[field] is not None:
                    data[field] = request_data[field]

            if "delivery_method" not in data:
                data["delivery_method"] = "home_delivery"
            
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
            query = query.eq("status", status)
            if pincode:
                query = query.eq("pincode", pincode)
            if category:
                query = query.eq("category", category)
            query = query.order("created_at", desc=True)
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

    def confirm_delivery(self, request_id: UUID, shop_id: UUID) -> Dict[str, Any]:
        """
    Shop confirms home delivery for a request.
    
    Args:
        request_id: The request ID
        shop_id: The shop owner's profile ID
        
    Returns:
        Updated request data with delivery confirmation
        
    Raises:
        ValueError: If validation fails
    """
        try:
            request_result = self.supabase_admin.table("requests")\
            .select("*, selected_bid_id") \
            .eq("status", "purchased") \
            .eq("id", str(request_id)) \
            .execute()
        
            if not request_result.data:
                raise ValueError("Request not found or not in 'purchased' status")
        
            request = request_result.data[0]
        
            if request.get("delivery_method") != "home_delivery":
                raise ValueError("Delivery method is not home delivery")
        
            selected_bid_id = request.get("selected_bid_id")
            if not selected_bid_id:
                raise ValueError("No bid selected for this request")
        
            bid_result = self.supabase_admin.table("bids") \
                .select("shop_id") \
                .eq("id", selected_bid_id) \
                .eq("status", "selected") \
                .execute()
        
            if not bid_result.data:
                raise ValueError("Selected bid not found")
        
            if bid_result.data[0]["shop_id"] != str(shop_id):
                raise ValueError("You are not the shop owner of the selected bid")
        
            update_result = self.supabase_admin.table("requests") \
                .update({
                    "delivery_confirmed_by_shop": True,
                    "delivery_response_at": datetime.utcnow().isoformat()  
                }) \
                .eq("id", str(request_id)) \
                .execute()
        
            if not update_result.data:
                raise ValueError("Failed to update delivery confirmation")
        
            return update_result.data[0]
        
        except Exception as e:
            logger.error(f"Error while confirming delivery for {request_id}: {str(e)}")
            raise

    def deny_delivery(self, request_id: str, shop_id: str) -> Dict[str, Any]:
        """
    Shop denies home delivery for a request.
    
    Args:
        request_id: The request ID
        shop_id: The shop owner's profile ID
        
    Returns:
        Updated request data with delivery denial
        
    Raises:
        ValueError: If validation fails
    """
        try:
            request_result = self.supabase_admin.table("requests")\
            .select("*, selected_bid_id") \
            .eq("id", str(request_id)) \
            .eq("status", "purchased") \
            .execute()
        
            if not request_result.data:
                raise ValueError("Request not found or not in 'purchased' state")
        
            request = request_result.data[0]
        
            if request.get("delivery_method") != "home_delivery":
                raise ValueError("Delivery method is not set to 'home_delivery'")
        
            selected_bid_id = request.get("selected_bid_id")
            if not selected_bid_id:
                raise ValueError("No bid selected for this request")
        
            bid_result = self.supabase_admin.table("bids")\
            .select("shop_id") \
            .eq("id", selected_bid_id) \
            .eq("status", "selected") \
            .execute()
        
            if not bid_result.data:
                raise ValueError("Selected bid not found")
        
            if bid_result.data[0]["shop_id"] != str(shop_id):
                raise ValueError("You are not the shop owner of the selected bid")
        
            update_result = self.supabase_admin.table("requests")\
                .update({
                "delivery_confirmed_by_shop": False,
                "delivery_response_at": datetime.utcnow().isoformat()
            })\
            .eq("id", str(request_id))\
            .execute()
        
            if not update_result.data:
                raise ValueError("Failed to update delivery denial")
        
            return update_result.data[0]
        
        except Exception as e:
            logger.error(f"Error while denying delivery for {request_id}: {str(e)}")
            raise 
         

    


        

            
        
