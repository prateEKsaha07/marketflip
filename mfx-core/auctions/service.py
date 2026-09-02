from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta, timezone
import logging
import random
import string
from chat.services import ChatService

logger = logging.getLogger(__name__)


class AuctionService:
    def __init__(self, supabase_admin: Client, supabase_anon: Client):
        self.supabase_admin = supabase_admin
        self.supabase_anon = supabase_anon

    def _generate_verification_code(self) -> str:
        """Generate a 6-digit OTP code"""
        return ''.join(random.choices(string.digits, k=6))

    def _get_or_create_conversation(self, buyer_id: str, shop_id: str) -> Dict[str, Any]:
        """Get or create a conversation between buyer and shop"""
        chat_service = ChatService(self.supabase_admin, self.supabase_anon)
        return chat_service.get_or_create_conversation(
            buyer_id=buyer_id,
            shop_id=shop_id
        )

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

    def createAuction(self, 
                  shop_id: str, 
                  auction_data: Dict[str, Any]
                  ) -> Dict[str, Any]:
        """Create a new auction - shop sets item details only"""
        try:
            end_time = auction_data["end_time"]
            if isinstance(end_time, datetime):
                end_time = end_time.isoformat()
        
            data = {
                "shop_id": shop_id,
                "item_name": auction_data["item_name"],
                "description": auction_data.get("description"),
                "starting_price": auction_data["starting_price"],
                "current_highest_bid": auction_data["starting_price"],
                "pincode": auction_data["pincode"],
                "category": auction_data.get("category", "electronics"),
                "end_time": end_time,
                "image_urls": auction_data.get("image_urls", []),
                "status": "active"
            }
        
            logger.info(f"Creating auction with data: {data}")
        
            response = self.supabase_admin.table("auctions").insert(data).execute()
        
            if not response.data:
                raise Exception("Failed to create auction - no data returned")
        
            return response.data[0]
        
        except Exception as e:
            logger.error(f"Error creating auction: {str(e)}")
            raise

    def getAuctions(self, 
                    pincode: Optional[str] = None, 
                    category: Optional[str] = None, 
                    status: Optional[str] = "active",
                    sort: Optional[str] = "newest",
                    limit: int = 100, 
                    offset: int = 0
                    ) -> List[Dict[str, Any]]:
        """Get auctions with filters, sorting, and exclude flagged items"""
        try:
            query = self.supabase_admin.table("auctions").select("*")
            
            # ====== EXCLUDE FLAGGED AUCTIONS ======
            flagged_ids = self._get_flagged_targets("auction")
            if flagged_ids:
                logger.info(f"Excluding {len(flagged_ids)} flagged auctions from feed")
                query = query.not_.in_("id", flagged_ids)
            
            if status:
                query = query.eq("status", status)
            
            if pincode:
                query = query.eq("pincode", pincode)
            if category:
                query = query.eq("category", category)

            # ====== APPLY SORTING ======
            if sort == "newest":
                query = query.order("created_at", desc=True)
            elif sort == "price_asc":
                query = query.order("current_highest_bid")
            elif sort == "price_desc":
                query = query.order("current_highest_bid", desc=True)
            elif sort == "ending_soon":
                query = query.order("end_time")
            elif sort == "most_bids":
                query = query.order("created_at", desc=True)
            else:
                query = query.order("created_at", desc=True)

            query = query.range(offset, offset + limit - 1)

            response = query.execute()
            auctions = response.data if response.data else []

            logger.info(f"Found {len(auctions)} auctions (excluded flagged)")

            for auction in auctions:
                bid_count_response = self.supabase_admin.table("auction_bids") \
                    .select("id", count="exact") \
                    .eq("auction_id", auction["id"]) \
                    .execute()
                auction["bid_count"] = len(bid_count_response.data) if bid_count_response.data else 0
                
                shop_response = self.supabase_admin.table("profiles") \
                    .select("shop_name") \
                    .eq("id", auction["shop_id"]) \
                    .execute()
                if shop_response.data:
                    auction["shop_name"] = shop_response.data[0].get("shop_name")
                else:
                    auction["shop_name"] = None

            if sort == "most_bids":
                auctions.sort(key=lambda x: x.get("bid_count", 0), reverse=True)

            return auctions
            
        except Exception as e:
            logger.error(f"Error getting auctions: {str(e)}")
            raise

    def getAuctionById(self, 
                       auction_id: str
                       ) -> Dict[str, Any]:
        """Get auction by ID with bids (bypasses flag filter for detail page)"""
        try:
            auction_response = self.supabase_admin.table("auctions") \
                .select("*, profiles!shop_id(shop_name)") \
                .eq("id", auction_id) \
                .execute()
            
            if not auction_response.data:
                raise ValueError("Auction not found")
            
            auction = auction_response.data[0]
            
            bids_response = self.supabase_admin.table("auction_bids") \
                .select("*, profiles!buyer_id(full_name)") \
                .eq("auction_id", auction_id) \
                .order("created_at", desc=True) \
                .execute()
            
            bids = bids_response.data if bids_response.data else []
        
            formatted_bids = []
            for bid in bids:
                formatted_bids.append({
                    "id": bid["id"],
                    "auction_id": bid["auction_id"],
                    "buyer_id": bid["buyer_id"],
                    "bid_amount": bid["bid_amount"],
                    "created_at": bid["created_at"],
                    "buyer_name": bid.get("profiles", {}).get("full_name") if bid.get("profiles") else None
                })
            
            if auction.get("profiles"):
                auction["shop_name"] = auction["profiles"].get("shop_name")
                del auction["profiles"]
            
            auction["bids"] = formatted_bids
            auction["bid_count"] = len(formatted_bids)
            
            return auction
            
        except Exception as e:
            logger.error(f"Error fetching auction {auction_id}: {str(e)}")
            raise

    def placeBid(self, 
             auction_id: str, 
             buyer_id: str, 
             bid_amount: int
             ) -> Dict[str, Any]:
        """Place a bid on an auction"""
        try:
            auction_response = self.supabase_admin.table("auctions") \
                .select("*") \
                .eq("id", auction_id) \
                .execute()
            
            if not auction_response.data:
                raise ValueError("Auction not found")
            
            auction = auction_response.data[0]
            
            if auction["status"] != "active":
                raise ValueError("Auction is not active")

            end_time_str = auction["end_time"]
            if isinstance(end_time_str, str):
                end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
            else:
                end_time = end_time_str
            
            now = datetime.now(timezone.utc)
            
            if now > end_time:
                raise ValueError("Auction has ended")

            current_highest = auction.get("current_highest_bid") or auction["starting_price"]
            if bid_amount <= current_highest:
                raise ValueError(f"Bid must be higher than current highest bid (₹{current_highest})")
            
            if auction.get("current_highest_bidder") == buyer_id:
                raise ValueError("You are already the highest bidder")

            bid_data = {
                "auction_id": auction_id,
                "buyer_id": buyer_id,
                "bid_amount": bid_amount
            }
            
            bid_response = self.supabase_admin.table("auction_bids").insert(bid_data).execute()
            
            if not bid_response.data:
                raise Exception("Failed to place bid")
            
            update_data = {
                "current_highest_bid": bid_amount
            }
            
            try:
                self.supabase_admin.table("auctions") \
                    .select("current_highest_bidder") \
                    .limit(1) \
                    .execute()
                update_data["current_highest_bidder"] = buyer_id
            except Exception:
                pass
            
            time_left = (end_time - now).total_seconds()
            if time_left < 300:
                new_end_time = end_time + timedelta(minutes=5)
                update_data["end_time"] = new_end_time.isoformat()
                logger.info(f"Sniping prevention: Extended auction {auction_id} to {new_end_time}")
            
            self.supabase_admin.table("auctions") \
                .update(update_data) \
                .eq("id", auction_id) \
                .execute()
            
            return {
                "bid": bid_response.data[0],
                "auction_updated": update_data
            }
            
        except Exception as e:
            logger.error(f"Error placing bid on auction {auction_id}: {str(e)}")
            raise

    def cancelAuction(self, auction_id: str, shop_id: str) -> bool:
        """Cancel an active auction (shop owner only)."""
        try:
            auction_response = self.supabase_admin.table("auctions") \
                .select("*") \
                .eq("id", auction_id) \
                .execute()
            
            if not auction_response.data:
                raise ValueError("Auction not found")
            
            auction = auction_response.data[0]
            
            if auction["shop_id"] != shop_id:
                raise ValueError("You don't own this auction")
            
            if auction["status"] != "active":
                raise ValueError(f"Auction must be 'active' to cancel. Current status: {auction['status']}")
            
            update_data = {
                "status": "cancelled",
                "closed_at": datetime.now(timezone.utc).isoformat()
            }
            
            result = self.supabase_admin.table("auctions") \
                .update(update_data) \
                .eq("id", auction_id) \
                .execute()
            
            if not result.data:
                return False
            
            logger.info(f"Auction {auction_id} cancelled by shop {shop_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error cancelling auction {auction_id}: {str(e)}")
            raise

    def close_auction_with_winner(self, auction_id: str, winner_buyer_id: str) -> Dict[str, Any]:
        """Close an auction with a winner. Unlocks chat and sends notifications."""
        try:
            auction_response = self.supabase_admin.table("auctions") \
                .select("*") \
                .eq("id", auction_id) \
                .execute()
            
            if not auction_response.data:
                raise ValueError("Auction not found")
            
            auction = auction_response.data[0]
            shop_id = auction["shop_id"]
            
            update_data = {
                "status": "sold",
                "closed_at": datetime.now(timezone.utc).isoformat()
            }
            
            result = self.supabase_admin.table("auctions") \
                .update(update_data) \
                .eq("id", auction_id) \
                .execute()
            
            if not result.data:
                raise Exception("Failed to close auction")
            
            # UNLOCK CHAT
            try:
                chat_service = ChatService(self.supabase_admin, self.supabase_anon)
                conversation = chat_service.get_or_create_conversation(
                    buyer_id=winner_buyer_id,
                    shop_id=shop_id
                )
                chat_service.unlock_conversation(
                    conversation_id=conversation["id"],
                    source_type="auction",
                    source_id=auction_id,
                    item_name=auction.get("item_name")
                )
                logger.info(f"Chat unlocked for auction {auction_id}, conversation {conversation['id']}")
            except Exception as e:
                logger.error(f"Error unlocking chat for auction {auction_id}: {e}")
            
            # NOTIFICATION: Buyer won
            self._create_notification(
                user_id=winner_buyer_id,
                notification_type="auction_won",
                title=f"You won the auction: {auction.get('item_name')}",
                body=f"Congratulations! You won the auction for {auction.get('item_name')}. Please set your delivery method to complete the transaction.",
                link=f"/buyer/auctions/{auction_id}"
            )
            
            # NOTIFICATION: Shop sold
            self._create_notification(
                user_id=shop_id,
                notification_type="auction_sold",
                title=f"Your auction sold: {auction.get('item_name')}",
                body=f"Your auction for {auction.get('item_name')} has been sold. The buyer will set their delivery method soon.",
                link=f"/shop/auctions/{auction_id}"
            )
            
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error closing auction with winner: {str(e)}")
            raise

    # ====== PHASE 5B: Post-Sale Delivery/OTP Methods ======

    def set_delivery_method(self, auction_id: str, buyer_id: str, 
                           delivery_method: str, delivery_address: Optional[str] = None) -> Dict[str, Any]:
        """Buyer sets delivery method and address after winning auction."""
        try:
            auction_response = self.supabase_admin.table("auctions") \
                .select("*") \
                .eq("id", auction_id) \
                .execute()
            
            if not auction_response.data:
                raise ValueError("Auction not found")
            
            auction = auction_response.data[0]
            
            if auction["status"] != "sold":
                raise ValueError(f"Auction must be in 'sold' status to set delivery method. Current status: {auction['status']}")
            
            if auction.get("current_highest_bidder") != buyer_id:
                raise ValueError("Only the winning buyer can set delivery method")
            
            if delivery_method == "home_delivery" and (not delivery_address or not delivery_address.strip()):
                raise ValueError("Delivery address is required for home delivery")
            
            update_data = {
                "delivery_method": delivery_method,
                "delivery_address": delivery_address if delivery_method == "home_delivery" else None
            }
            
            if delivery_method == "pickup":
                otp = self._generate_verification_code()
                update_data["verification_code"] = otp
                update_data["verification_attempts"] = 0
            
            result = self.supabase_admin.table("auctions") \
                .update(update_data) \
                .eq("id", auction_id) \
                .execute()
            
            if not result.data:
                raise Exception("Failed to set delivery method")
            
            # NOTIFICATION: Buyer set delivery method
            self._create_notification(
                user_id=auction["shop_id"],
                notification_type="delivery_method_set",
                title=f"Buyer set delivery method for {auction.get('item_name')}",
                body=f"The buyer has selected {delivery_method} for the auction. Please confirm the delivery arrangement.",
                link=f"/shop/auctions/{auction_id}"
            )
            
            return {
                "auction": result.data[0],
                "verification_code": otp if delivery_method == "pickup" else None
            }
            
        except Exception as e:
            logger.error(f"Error setting delivery method for auction {auction_id}: {str(e)}")
            raise

    def confirm_delivery(self, auction_id: str, shop_id: str) -> Dict[str, Any]:
        """Shop confirms delivery arrangement. Generates OTP for home delivery."""
        try:
            auction_response = self.supabase_admin.table("auctions") \
                .select("*") \
                .eq("id", auction_id) \
                .execute()
            
            if not auction_response.data:
                raise ValueError("Auction not found")
            
            auction = auction_response.data[0]
            
            if auction["shop_id"] != shop_id:
                raise ValueError("You don't own this auction")
            
            if auction["status"] != "sold":
                raise ValueError(f"Auction must be in 'sold' status to confirm delivery. Current status: {auction['status']}")
            
            if not auction.get("delivery_method"):
                raise ValueError("Buyer must set delivery method first")
            
            update_data = {
                "delivery_confirmed_by_shop": True,
                "delivery_response_at": datetime.now(timezone.utc).isoformat()
            }
            
            if auction["delivery_method"] == "home_delivery":
                otp = self._generate_verification_code()
                update_data["verification_code"] = otp
                update_data["verification_attempts"] = 0
            
            result = self.supabase_admin.table("auctions") \
                .update(update_data) \
                .eq("id", auction_id) \
                .execute()
            
            if not result.data:
                raise Exception("Failed to confirm delivery")
            
            # NOTIFICATION: Shop confirmed
            self._create_notification(
                user_id=auction["current_highest_bidder"],
                notification_type="delivery_confirmed",
                title=f"Shop confirmed delivery for {auction.get('item_name')}",
                body=f"The shop has confirmed delivery. Please use the OTP code to complete the transaction.",
                link=f"/buyer/auctions/{auction_id}"
            )
            
            return {
                "auction": result.data[0],
                "verification_code": otp if auction["delivery_method"] == "home_delivery" else auction.get("verification_code")
            }
            
        except Exception as e:
            logger.error(f"Error confirming delivery for auction {auction_id}: {str(e)}")
            raise

    def deny_delivery(self, auction_id: str, shop_id: str) -> Dict[str, Any]:
        """Shop denies delivery arrangement. Clears OTP."""
        try:
            auction_response = self.supabase_admin.table("auctions") \
                .select("*") \
                .eq("id", auction_id) \
                .execute()
            
            if not auction_response.data:
                raise ValueError("Auction not found")
            
            auction = auction_response.data[0]
            
            if auction["shop_id"] != shop_id:
                raise ValueError("You don't own this auction")
            
            if auction["status"] != "sold":
                raise ValueError(f"Auction must be in 'sold' status to deny delivery. Current status: {auction['status']}")
            
            update_data = {
                "delivery_confirmed_by_shop": False,
                "delivery_response_at": datetime.now(timezone.utc).isoformat(),
                "verification_code": None,
                "verification_attempts": 0
            }
            
            result = self.supabase_admin.table("auctions") \
                .update(update_data) \
                .eq("id", auction_id) \
                .execute()
            
            if not result.data:
                raise Exception("Failed to deny delivery")
            
            # NOTIFICATION: Shop denied
            self._create_notification(
                user_id=auction["current_highest_bidder"],
                notification_type="delivery_denied",
                title=f"Shop denied delivery for {auction.get('item_name')}",
                body=f"The shop cannot deliver to your address. You can switch to pickup or cancel the transaction.",
                link=f"/buyer/auctions/{auction_id}"
            )
            
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error denying delivery for auction {auction_id}: {str(e)}")
            raise

    def switch_to_pickup(self, auction_id: str, buyer_id: str) -> Dict[str, Any]:
        """Buyer switches to pickup after shop denies delivery."""
        try:
            auction_response = self.supabase_admin.table("auctions") \
                .select("*") \
                .eq("id", auction_id) \
                .execute()
            
            if not auction_response.data:
                raise ValueError("Auction not found")
            
            auction = auction_response.data[0]
            
            if auction.get("current_highest_bidder") != buyer_id:
                raise ValueError("Only the winning buyer can switch to pickup")
            
            if auction["status"] != "sold":
                raise ValueError(f"Auction must be in 'sold' status to switch to pickup. Current status: {auction['status']}")
            
            if auction.get("delivery_confirmed_by_shop") is True:
                raise ValueError("Shop has already confirmed delivery. Cannot switch to pickup.")
            
            otp = self._generate_verification_code()
            
            update_data = {
                "delivery_method": "pickup",
                "delivery_address": None,
                "verification_code": otp,
                "verification_attempts": 0
            }
            
            result = self.supabase_admin.table("auctions") \
                .update(update_data) \
                .eq("id", auction_id) \
                .execute()
            
            if not result.data:
                raise Exception("Failed to switch to pickup")
            
            # NOTIFICATION: Buyer switched to pickup
            self._create_notification(
                user_id=auction["shop_id"],
                notification_type="switched_to_pickup",
                title=f"Buyer switched to pickup for {auction.get('item_name')}",
                body=f"The buyer has switched to pickup. Please arrange for pickup handoff.",
                link=f"/shop/auctions/{auction_id}"
            )
            
            return {
                "auction": result.data[0],
                "verification_code": otp
            }
            
        except Exception as e:
            logger.error(f"Error switching to pickup for auction {auction_id}: {str(e)}")
            raise

    def verify_otp(self, auction_id: str, shop_id: str, verification_code: str) -> Dict[str, Any]:
        """Shop verifies OTP code. On success: status='completed', chat locks."""
        MAX_ATTEMPTS = 5
        
        try:
            auction_response = self.supabase_admin.table("auctions") \
                .select("*") \
                .eq("id", auction_id) \
                .execute()
            
            if not auction_response.data:
                raise ValueError("Auction not found")
            
            auction = auction_response.data[0]
            
            if auction["shop_id"] != shop_id:
                raise ValueError("You don't own this auction")
            
            if auction["status"] != "sold":
                raise ValueError(f"Auction must be in 'sold' status to verify OTP. Current status: {auction['status']}")
            
            stored_otp = auction.get("verification_code")
            if not stored_otp:
                raise ValueError("No OTP has been generated for this auction")
            
            attempts = auction.get("verification_attempts", 0)
            if attempts >= MAX_ATTEMPTS:
                raise ValueError(f"Maximum OTP attempts ({MAX_ATTEMPTS}) exceeded. Buyer must override.")
            
            is_valid = verification_code == stored_otp
            new_attempts = attempts + 1
            
            if is_valid:
                update_data = {
                    "verification_attempts": new_attempts,
                    "status": "completed",
                    "closed_at": datetime.now(timezone.utc).isoformat(),
                    "completed_at": datetime.now(timezone.utc).isoformat()  # <-- ADDED
                }
                
                result = self.supabase_admin.table("auctions") \
                    .update(update_data) \
                    .eq("id", auction_id) \
                    .execute()
                
                if not result.data:
                    raise Exception("Failed to complete transaction")
                
                # LOCK CHAT
                try:
                    chat_service = ChatService(self.supabase_admin, self.supabase_anon)
                    conversation = chat_service.get_or_create_conversation(
                        buyer_id=auction["current_highest_bidder"],
                        shop_id=shop_id
                    )
                    chat_service.lock_conversation(
                        conversation_id=conversation["id"],
                        source_type="auction",
                        source_id=auction_id
                    )
                    logger.info(f"Chat locked for auction {auction_id}, conversation {conversation['id']}")
                except Exception as e:
                    logger.error(f"Error locking chat for auction {auction_id}: {e}")
                
                # NOTIFICATION: Transaction completed
                self._create_notification(
                    user_id=auction["current_highest_bidder"],
                    notification_type="transaction_completed",
                    title=f"Transaction completed: {auction.get('item_name')}",
                    body=f"The transaction for {auction.get('item_name')} has been completed successfully.",
                    link=f"/buyer/auctions/{auction_id}"
                )
                
                self._create_notification(
                    user_id=shop_id,
                    notification_type="transaction_completed",
                    title=f"Transaction completed: {auction.get('item_name')}",
                    body=f"The transaction for {auction.get('item_name')} has been completed successfully.",
                    link=f"/shop/auctions/{auction_id}"
                )
                
                return {
                    "auction": result.data[0],
                    "verification_attempts": new_attempts,
                    "completed": True,
                    "message": "OTP verified successfully. Transaction completed."
                }
            else:
                update_data = {
                    "verification_attempts": new_attempts
                }
                
                result = self.supabase_admin.table("auctions") \
                    .update(update_data) \
                    .eq("id", auction_id) \
                    .execute()
                
                if not result.data:
                    raise Exception("Failed to update attempts")
                
                return {
                    "auction": result.data[0],
                    "verification_attempts": new_attempts,
                    "completed": False,
                    "message": f"Invalid OTP. Attempts remaining: {MAX_ATTEMPTS - new_attempts}"
                }
            
        except Exception as e:
            logger.error(f"Error verifying OTP for auction {auction_id}: {str(e)}")
            raise

    def override_complete(self, auction_id: str, buyer_id: str) -> Dict[str, Any]:
        """Buyer overrides transaction completion after max OTP attempts."""
        MAX_ATTEMPTS = 5
        
        try:
            auction_response = self.supabase_admin.table("auctions") \
                .select("*") \
                .eq("id", auction_id) \
                .execute()
            
            if not auction_response.data:
                raise ValueError("Auction not found")
            
            auction = auction_response.data[0]
            
            if auction.get("current_highest_bidder") != buyer_id:
                raise ValueError("Only the winning buyer can override completion")
            
            if auction["status"] != "sold":
                raise ValueError(f"Auction must be in 'sold' status to override. Current status: {auction['status']}")
            
            attempts = auction.get("verification_attempts", 0)
            if attempts < MAX_ATTEMPTS:
                raise ValueError(f"OTP attempts ({attempts}) have not reached maximum ({MAX_ATTEMPTS})")
            
            update_data = {
                "status": "completed",
                "closed_at": datetime.now(timezone.utc).isoformat(),
                "completed_via_override": True,
                "completed_at": datetime.now(timezone.utc).isoformat()  # <-- ADDED
            }
            
            result = self.supabase_admin.table("auctions") \
                .update(update_data) \
                .eq("id", auction_id) \
                .execute()
            
            if not result.data:
                raise Exception("Failed to complete transaction")
            
            # LOCK CHAT
            try:
                chat_service = ChatService(self.supabase_admin, self.supabase_anon)
                conversation = chat_service.get_or_create_conversation(
                    buyer_id=buyer_id,
                    shop_id=auction["shop_id"]
                )
                chat_service.lock_conversation(
                    conversation_id=conversation["id"],
                    source_type="auction",
                    source_id=auction_id
                )
                logger.info(f"Chat locked for auction {auction_id} via override, conversation {conversation['id']}")
            except Exception as e:
                logger.error(f"Error locking chat for auction {auction_id} via override: {e}")
            
            # NOTIFICATION: Override completed
            self._create_notification(
                user_id=auction["shop_id"],
                notification_type="override_completed",
                title=f"Transaction completed via override: {auction.get('item_name')}",
                body=f"The buyer has completed the transaction via override. Please contact support if this was an error.",
                link=f"/shop/auctions/{auction_id}"
            )
            
            return result.data[0]
            
        except Exception as e:
            logger.error(f"Error overriding completion for auction {auction_id}: {str(e)}")
            raise

    def relist_auction(self, auction_id: str, shop_id: str, 
                      new_end_time: Optional[datetime] = None) -> Dict[str, Any]:
        """Shop relists a cancelled auction."""
        try:
            auction_response = self.supabase_admin.table("auctions") \
                .select("*") \
                .eq("id", auction_id) \
                .execute()
            
            if not auction_response.data:
                raise ValueError("Auction not found")
            
            original = auction_response.data[0]
            
            if original["shop_id"] != shop_id:
                raise ValueError("You don't own this auction")
            
            if original["status"] != "cancelled":
                raise ValueError(f"Auction must be 'cancelled' to relist. Current status: {original['status']}")
            
            if new_end_time is None:
                new_end_time = datetime.now(timezone.utc) + timedelta(days=7)
            elif isinstance(new_end_time, datetime):
                if new_end_time.tzinfo is None:
                    new_end_time = new_end_time.replace(tzinfo=timezone.utc)
            
            new_auction_data = {
                "shop_id": shop_id,
                "item_name": original["item_name"],
                "description": original.get("description"),
                "starting_price": original["starting_price"],
                "current_highest_bid": original["starting_price"],
                "pincode": original["pincode"],
                "category": original.get("category", "electronics"),
                "end_time": new_end_time.isoformat(),
                "image_urls": original.get("image_urls", []),
                "status": "active"
            }
            
            logger.info(f"Relisting auction {auction_id} as new auction")
            
            response = self.supabase_admin.table("auctions").insert(new_auction_data).execute()
            
            if not response.data:
                raise Exception("Failed to create relisted auction")
            
            new_auction = response.data[0]
            
            return {
                "original_auction_id": auction_id,
                "new_auction_id": new_auction["id"],
                "new_auction": new_auction
            }
            
        except Exception as e:
            logger.error(f"Error relisting auction {auction_id}: {str(e)}")
            raise