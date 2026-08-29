from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
import logging
from chat.services import ChatService
from utils.verification import generate_verification_code

logger = logging.getLogger(__name__)

class BidService:
    def __init__(self, supabase_admin: Client, supabase_anon: Client):
        self.supabase_admin = supabase_admin
        self.supabase_anon = supabase_anon
    
    def create_bid(self, request_id: str, shop_id: str, price: int, note: Optional[str] = None) -> Dict[str, Any]:
        """Create a new bid on a request"""
        try:
            # Check if request exists and is open
            request_check = self.supabase_admin.table("requests") \
                .select("id, status") \
                .eq("id", request_id) \
                .execute()
            
            if not request_check.data:
                raise Exception("Request not found")
            
            if request_check.data[0]["status"] != "open":
                raise Exception("Cannot bid on a request that is not open")
            
            # Check if shop already has a pending bid on this request
            existing_bid = self.supabase_admin.table("bids") \
                .select("id, status") \
                .eq("request_id", request_id) \
                .eq("shop_id", shop_id) \
                .eq("status", "pending") \
                .execute()
            
            if existing_bid.data:
                raise Exception("You already have a pending bid on this request")
            
            # Create bid
            data = {
                "request_id": request_id,
                "shop_id": shop_id,
                "price": price,
                "note": note,
                "status": "pending"
            }
            
            response = self.supabase_admin.table("bids").insert(data).execute()
            
            if not response.data:
                raise Exception("Failed to create bid")
            
            return response.data[0]
            
        except Exception as e:
            logger.error(f"Error creating bid: {str(e)}")
            raise
    
    def update_bid(self, bid_id: str, shop_id: str, price: Optional[int] = None, note: Optional[str] = None) -> Dict[str, Any]:
        """Update a bid (only if pending)"""
        try:
            # Check bid exists and belongs to shop
            bid_check = self.supabase_admin.table("bids") \
                .select("id, shop_id, status") \
                .eq("id", bid_id) \
                .execute()
            
            if not bid_check.data:
                raise Exception("Bid not found")
            
            bid = bid_check.data[0]
            
            if str(bid["shop_id"]) != shop_id:
                raise Exception("You don't have permission to update this bid")
            
            if bid["status"] != "pending":
                raise Exception("Cannot update a bid that is not pending")
            
            # Build update data
            update_data = {}
            if price is not None:
                update_data["price"] = price
            if note is not None:
                update_data["note"] = note
            
            if not update_data:
                raise Exception("No fields to update")
            
            response = self.supabase_admin.table("bids") \
                .update(update_data) \
                .eq("id", bid_id) \
                .execute()
            
            if not response.data:
                raise Exception("Failed to update bid")
            
            return response.data[0]
            
        except Exception as e:
            logger.error(f"Error updating bid: {str(e)}")
            raise
    
    def delete_bid(self, bid_id: str, shop_id: str) -> bool:
        """Delete/withdraw a bid (only if pending)"""
        try:
            # Check bid exists and belongs to shop
            bid_check = self.supabase_admin.table("bids") \
                .select("id, shop_id, status") \
                .eq("id", bid_id) \
                .execute()
            
            if not bid_check.data:
                raise Exception("Bid not found")
            
            bid = bid_check.data[0]
            
            if str(bid["shop_id"]) != shop_id:
                raise Exception("You don't have permission to delete this bid")
            
            if bid["status"] != "pending":
                raise Exception("Cannot delete a bid that is not pending")
            
            # Hard delete the bid
            response = self.supabase_admin.table("bids") \
                .delete() \
                .eq("id", bid_id) \
                .execute()
            
            if not response.data:
                raise Exception("Failed to delete bid")
            
            return True
            
        except Exception as e:
            logger.error(f"Error deleting bid: {str(e)}")
            raise
    
    def select_bid(self, bid_id: str, buyer_id: str) -> Dict[str, Any]:
        """Select a bid (buyer only) - generates OTP for pickup requests and unlocks chat"""
        try:
            print(f"=== SELECT BID SERVICE ===")
            print(f"Bid ID: {bid_id}")
            print(f"Buyer ID: {buyer_id}")
            
            # Get the bid
            bid_response = self.supabase_admin.table("bids") \
                .select("*") \
                .eq("id", bid_id) \
                .execute()       
            print(f"Bid response: {bid_response.data}")         
            if not bid_response.data:
                raise Exception("Bid not found")
            
            bid = bid_response.data[0]
            request_id = bid["request_id"]
            shop_id = bid["shop_id"]
            
            # Get the request with delivery_method
            request_response = self.supabase_admin.table("requests") \
                .select("id, buyer_id, status, item_name, description, budget_min, budget_max, pincode, category, created_at, delivery_method") \
                .eq("id", request_id) \
                .execute()
            print(f"Request response: {request_response.data}")
            if not request_response.data:
                raise Exception("Request not found")
            request = request_response.data[0]
            
            # Check permissions
            if str(request["buyer_id"]) != buyer_id:
                raise Exception("You don't have permission to select this bid")
            
            if request["status"] != "open":
                raise Exception("Cannot select a bid on a request that is not open")
            
            if bid["status"] != "pending":
                raise Exception("Cannot select a bid that is not pending")

            # get buyer profile info
            buyer_response = self.supabase_admin.table("profiles") \
                .select('shop_name, phone, address')\
                .eq('id', buyer_id) \
                .execute()
            buyer_info = buyer_response.data[0] if buyer_response.data else {}

            # get shop profile info
            shop_response = self.supabase_admin.table("profiles") \
                            .select('shop_name, phone, address')\
                            .eq('id', shop_id) \
                            .execute()
            shop_info = shop_response.data[0] if shop_response.data else {}
            
            # ====== CHECK IF PICKUP - GENERATE OTP ======
            verification_code = None
            delivery_method = request.get("delivery_method")
            
            if delivery_method == "pickup":
                verification_code = generate_verification_code()
                print(f"=== PICKUP OTP GENERATED IN BID SERVICE ===")
                print(f"Request ID: {request_id}")
                print(f"Verification Code: {verification_code}")
            
            # Update selected bid to 'selected'
            selected_response = self.supabase_admin.table("bids") \
                .update(
                    {
                        "status": "selected",
                        "selected_at": datetime.now().isoformat()
                    }
                ) \
                .eq("id", bid_id) \
                .execute()
            print(f"Selected response: {selected_response.data}")
            
            if not selected_response.data:
                raise Exception("Failed to select bid")
            
            # Update all other pending bids to 'rejected'
            self.supabase_admin.table("bids") \
                .update(
                    {
                        "status": "rejected",
                        "rejected_at" : datetime.now().isoformat()
                    }
                ) \
                .eq("request_id", request_id) \
                .eq("status", "pending") \
                .neq("id", bid_id) \
                .execute()
            print("all other bids are auto selected rejected")
            
            # ====== UPDATE REQUEST STATUS TO PURCHASED ======
            request_update_data = {
                "status": "purchased",
                "purchased_at": datetime.now().isoformat(),
                "selected_bid_id": bid_id
            }
            
            # If pickup, add verification code and auto-confirm delivery
            if verification_code:
                request_update_data["verification_code"] = verification_code
                request_update_data["verification_attempts"] = 0
                request_update_data["delivery_confirmed_by_shop"] = True
                request_update_data["delivery_response_at"] = datetime.now().isoformat()
                print(f"Pickup auto-confirmed with OTP: {verification_code}")
            
            # Update request
            self.supabase_admin.table("requests") \
                .update(request_update_data) \
                .eq("id", request_id) \
                .execute()
            print("changed purchased status and updated purchased at and selected bid id")

            # ====== UNLOCK CHAT ======
            try:
                chat_service = ChatService(self.supabase_admin, self.supabase_anon)
                conversation = chat_service.get_or_create_conversation(
                    buyer_id=buyer_id,
                    shop_id=shop_id
                )
                chat_service.unlock_conversation(
                    conversation_id=conversation["id"],
                    source_type="request",
                    source_id=request_id
                )
                print(f"Chat unlocked for conversation {conversation['id']}")
            except Exception as e:
                print(f"Error unlocking chat: {e}")
                # Don't fail the bid selection if chat fails
    
            # Build response
            selected_bid = selected_response.data[0]
            
            response_data = {
                "status": "selected",
                "request_status": "purchased",
                "bid_id": bid_id,
                "request_id": request_id, 
                "selected_bid": {
                    **selected_bid,
                    "shop_name": shop_info.get('shop_name'),
                    "phone": shop_info.get('phone'),
                    "shop_address": shop_info.get('address')
                },
                "shop_contact": {
                    "name": shop_info.get('shop_name'),
                    "phone": shop_info.get('phone'),
                    "address": shop_info.get('address')
                },
                "buyer_contact": {
                    "name": buyer_info.get("shop_name") or "buyer",
                    "phone": buyer_info.get('phone'),
                    "address": buyer_info.get('address')
                },
                "request_details": {
                    "item_name": request.get('item_name'),
                    "description": request.get('description'),
                    "budget_min": request.get('budget_min'),
                    "budget_max": request.get('budget_max'),
                    "pincode": request.get('pincode'),
                    "category": request.get('category'),
                    "created_at": request.get('created_at')
                },
                "message": "Bid selected successfully! The request is now purchased"
            }
            
            if verification_code:
                response_data["verification_code"] = verification_code
                response_data["message"] = "Bid selected successfully! Pickup OTP code generated. Share it with the shop."
            
            return response_data
            
        except Exception as e:
            print(f"Error in select_bid: {str(e)}")
            logger.error(f"Error selecting bid: {str(e)}")
            raise