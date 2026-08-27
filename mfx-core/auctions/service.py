from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)


class AuctionService:
    def __init__(self, supabase_admin: Client, supabase_anon: Client):
        self.supabase_admin = supabase_admin
        self.supabase_anon = supabase_anon

    def createAuction(self, 
                  shop_id: str, 
                  auction_data: Dict[str, Any]
                  ) -> Dict[str, Any]:
        """Create a new auction"""
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
                "delivery_method": auction_data.get("delivery_method", "home_delivery"),
                "delivery_address": auction_data.get("delivery_address"),
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
                    limit: int = 100, 
                    offset: int = 0
                    ) -> List[Dict[str, Any]]:
        """Get auctions with filters"""
        try:
            query = self.supabase_admin.table("auctions").select("*")
            
            if status:
                query = query.eq("status", status)
            
            if pincode:
                query = query.eq("pincode", pincode)
            if category:
                query = query.eq("category", category)

            query = query.order("created_at", desc=True)
            query = query.range(offset, offset + limit - 1)

            response = query.execute()
            auctions = response.data if response.data else []

            logger.info(f"Found {len(auctions)} auctions")

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

            return auctions
            
        except Exception as e:
            logger.error(f"Error getting auctions: {str(e)}")
            raise

    def getAuctionById(self, 
                       auction_id: str
                       ) -> Dict[str, Any]:
        """Get auction by ID with bids"""
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

            # Parse end_time
            end_time_str = auction["end_time"]
            if isinstance(end_time_str, str):
                end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
            else:
                end_time = end_time_str
            
            # Use timezone-aware current time
            now = datetime.now(timezone.utc)
            
            if now > end_time:
                raise ValueError("Auction has ended")

            current_highest = auction.get("current_highest_bid") or auction["starting_price"]
            if bid_amount <= current_highest:
                raise ValueError(f"Bid must be higher than current highest bid (₹{current_highest})")
            
            if auction.get("current_highest_bidder") == buyer_id:
                raise ValueError("You are already the highest bidder")

            # Place the bid
            bid_data = {
                "auction_id": auction_id,
                "buyer_id": buyer_id,
                "bid_amount": bid_amount
            }
            
            bid_response = self.supabase_admin.table("auction_bids").insert(bid_data).execute()
            
            if not bid_response.data:
                raise Exception("Failed to place bid")
            
            # Update auction
            update_data = {
                "current_highest_bid": bid_amount
            }
            
            # Try to update current_highest_bidder
            try:
                self.supabase_admin.table("auctions") \
                    .select("current_highest_bidder") \
                    .limit(1) \
                    .execute()
                update_data["current_highest_bidder"] = buyer_id
            except Exception:
                pass
            
            # Sniping prevention
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