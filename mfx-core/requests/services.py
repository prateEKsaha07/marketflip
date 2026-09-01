from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
import logging

from utils.verification import generate_verification_code

logger = logging.getLogger(__name__)

class RequestService:
    def __init__(self, supabase_admin: Client, supabase_anon: Client):
        self.supabase_admin = supabase_admin
        self.supabase_anon = supabase_anon

    def _create_notification(self, user_id: str, notification_type: str,
                              title: str, body: str, link: str = None):
        """Create a real notification in the database"""
        try:
            data = {
                "user_id": user_id,
                "type": notification_type,
                "title": title,
                "body": body,
                "link": link,
                "read": False
            }
            response = self.supabase_admin.table("notifications").insert(data).execute()
            if response.data:
                logger.info(f"Notification created for user {user_id}: {title}")
            else:
                logger.warning(f"Failed to create notification for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to create notification: {e}")

    def _get_flagged_targets(self, target_type: str) -> List[str]:
        """
        Get IDs of targets with pending reports.
        Used to exclude flagged items from browse feeds.
        """
        try:
            response = self.supabase_admin.table("reports") \
                .select("target_id") \
                .eq("target_type", target_type) \
                .eq("status", "pending") \
                .execute()
            
            return [str(r["target_id"]) for r in response.data] if response.data else []
        except Exception as e:
            logger.error(f"Error getting flagged targets for {target_type}: {e}")
            return []

    def create_request(self, buyer_id: str, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new request"""
        try:
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
                "delivery_address",
                "image_urls" 
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
        """Get requests with filters - excludes flagged items"""
        try:
            query = self.supabase_anon.table("requests").select("*")
            
            # ====== EXCLUDE FLAGGED REQUESTS ======
            flagged_ids = self._get_flagged_targets("request")
            if flagged_ids:
                logger.info(f"Excluding {len(flagged_ids)} flagged requests from feed")
                query = query.not_.in_("id", flagged_ids)
            
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
            request_response = self.supabase_anon.table("requests") \
                .select("*") \
                .eq("id", request_id) \
                .execute()
            
            if not request_response.data:
                raise Exception("Request not found")
            
            request = request_response.data[0]
            
            if "image_urls" not in request:
                request["image_urls"] = []
            elif request["image_urls"] is None:
                request["image_urls"] = []
            
            is_buyer = str(request["buyer_id"]) == current_user_id
            
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
            check_response = self.supabase_admin.table("requests") \
                .select("buyer_id") \
                .eq("id", request_id) \
                .execute()
            
            if not check_response.data:
                raise Exception("Request not found")
            
            if str(check_response.data[0]["buyer_id"]) != current_user_id:
                raise Exception("You don't have permission to delete this request")
            
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
        Generates OTP code for the transaction.
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
        
            verification_code = generate_verification_code()
            logger.info(f"=== HOME DELIVERY OTP GENERATED ===")
            logger.info(f"Request ID: {request_id}")
            logger.info(f"Verification Code: {verification_code}")
        
            update_result = self.supabase_admin.table("requests") \
                .update({
                    "delivery_confirmed_by_shop": True,
                    "delivery_response_at": datetime.utcnow().isoformat(),
                    "verification_code": verification_code,
                    "verification_attempts": 0
                }) \
                .eq("id", str(request_id)) \
                .execute()
        
            if not update_result.data:
                raise ValueError("Failed to update delivery confirmation")
        
            # NOTIFICATION: Shop confirmed delivery
            try:
                self._create_notification(
                    user_id=request["buyer_id"],
                    notification_type="delivery_confirmed",
                    title=f"Shop confirmed delivery for {request.get('item_name')}",
                    body=f"The shop has confirmed delivery. Please use the OTP code to complete the transaction.",
                    link=f"/buyer/request/{request_id}"
                )
            except Exception as e:
                logger.error(f"Error creating notification: {e}")
        
            return update_result.data[0]
        
        except Exception as e:
            logger.error(f"Error while confirming delivery for {request_id}: {str(e)}")
            raise

    def deny_delivery(self, request_id: str, shop_id: str) -> Dict[str, Any]:
        """
        Shop denies home delivery for a request.
        Clears any existing verification code.
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
                    "delivery_response_at": datetime.utcnow().isoformat(),
                    "verification_code": None,
                    "verification_attempts": 0
                })\
                .eq("id", str(request_id))\
                .execute()
        
            if not update_result.data:
                raise ValueError("Failed to update delivery denial")
        
            # NOTIFICATION: Shop denied delivery
            try:
                self._create_notification(
                    user_id=request["buyer_id"],
                    notification_type="delivery_denied",
                    title=f"Shop denied delivery for {request.get('item_name')}",
                    body=f"The shop cannot deliver to your address. You can switch to pickup or cancel the transaction.",
                    link=f"/buyer/request/{request_id}"
                )
            except Exception as e:
                logger.error(f"Error creating notification: {e}")
        
            return update_result.data[0]
        
        except Exception as e:
            logger.error(f"Error while denying delivery for {request_id}: {str(e)}")
            raise

    def select_bid_with_pickup_otp(self, request_id: str, bid_id: str) -> Dict[str, Any]:
        """
        Select a bid and generate OTP if the request is for pickup.
        This is called from the bid selection flow.
        """
        try:
            request_result = self.supabase_admin.table("requests") \
                .select("*") \
                .eq("id", str(request_id)) \
                .execute()
            
            if not request_result.data:
                raise ValueError("Request not found")
            
            request = request_result.data[0]
            
            if request.get("delivery_method") == "pickup":
                verification_code = generate_verification_code()
                
                logger.info(f"=== PICKUP OTP GENERATED IN SERVICE ===")
                logger.info(f"Request ID: {request_id}")
                logger.info(f"Verification Code: {verification_code}")
                
                update_result = self.supabase_admin.table("requests") \
                    .update({
                        "verification_code": verification_code,
                        "verification_attempts": 0,
                        "delivery_confirmed_by_shop": True,
                        "delivery_response_at": datetime.utcnow().isoformat()
                    }) \
                    .eq("id", str(request_id)) \
                    .execute()
                
                if not update_result.data:
                    raise ValueError("Failed to update request with OTP")
                
                # NOTIFICATION: Bid selected (shop)
                try:
                    self._create_notification(
                        user_id=request["buyer_id"],
                        notification_type="bid_selected",
                        title=f"Your bid was selected for {request.get('item_name')}",
                        body=f"Your bid has been selected. Please proceed with the transaction.",
                        link=f"/buyer/request/{request_id}"
                    )
                except Exception as e:
                    logger.error(f"Error creating notification: {e}")
                
                return update_result.data[0]
            
            return request
            
        except Exception as e:
            logger.error(f"Error in select_bid_with_pickup_otp for {request_id}: {str(e)}")
            raise