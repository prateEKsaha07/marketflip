from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class BidService:
    def __init__(self, supabase_admin: Client, supabase_anon: Client):
        self.supabase_admin = supabase_admin
        self.supabase_anon = supabase_anon
    
    def create_bid(self, request_id: str, shop_id: str, price: int, note: Optional[str] = None) -> Dict[str, Any]:
        """Create a new bid on a request"""
        try:
            # Check if request exists and is open
            request_check = self.supabase_anon.table("requests") \
                .select("id, status") \
                .eq("id", request_id) \
                .execute()
            
            if not request_check.data:
                raise Exception("Request not found")
            
            if request_check.data[0]["status"] != "open":
                raise Exception("Cannot bid on a request that is not open")
            
            # Check if shop already has a pending bid on this request
            existing_bid = self.supabase_anon.table("bids") \
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
            bid_check = self.supabase_anon.table("bids") \
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
            bid_check = self.supabase_anon.table("bids") \
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
        """Select a bid (buyer only)"""
        try:
            # Get bid with request info
            bid_response = self.supabase_anon.table("bids") \
                .select("*, requests!inner(buyer_id, id, status)") \
                .eq("id", bid_id) \
                .execute()
            
            if not bid_response.data:
                raise Exception("Bid not found")
            
            bid = bid_response.data[0]
            request = bid.get("requests", {})
            
            # Check buyer owns the request
            if str(request.get("buyer_id")) != buyer_id:
                raise Exception("You don't have permission to select this bid")
            
            if request.get("status") != "open":
                raise Exception("Cannot select a bid on a request that is not open")
            
            if bid["status"] != "pending":
                raise Exception("Cannot select a bid that is not pending")
            
            # Start transaction: select this bid, reject others, update request
            request_id = request["id"]
            
            # 1. Update selected bid to 'selected'
            selected_response = self.supabase_admin.table("bids") \
                .update({"status": "selected"}) \
                .eq("id", bid_id) \
                .execute()
            
            if not selected_response.data:
                raise Exception("Failed to select bid")
            
            # 2. Update all other pending bids to 'rejected'
            rejected_response = self.supabase_admin.table("bids") \
                .update({"status": "rejected"}) \
                .eq("request_id", request_id) \
                .eq("status", "pending") \
                .neq("id", bid_id) \
                .execute()
            
            # 3. Update request status to 'purchased'
            request_response = self.supabase_admin.table("requests") \
                .update({"status": "purchased"}) \
                .eq("id", request_id) \
                .execute()
            
            # 4. Get shop contact info
            shop_response = self.supabase_anon.table("profiles") \
                .select("shop_name, phone, address") \
                .eq("id", bid["shop_id"]) \
                .execute()
            
            shop_info = shop_response.data[0] if shop_response.data else {}
            
            # 5. Get selected bid details
            selected_bid = selected_response.data[0]
            
            # Add shop info to response
            result = {
                "bid_id": bid_id,
                "request_id": request_id,
                "status": "selected",
                "selected_bid": {
                    **selected_bid,
                    "shop_name": shop_info.get("shop_name"),
                    "shop_phone": shop_info.get("phone"),
                    "shop_address": shop_info.get("address")
                },
                "shop_contact": {
                    "shop_name": shop_info.get("shop_name"),
                    "phone": shop_info.get("phone"),
                    "address": shop_info.get("address")
                }
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error selecting bid: {str(e)}")
            raise