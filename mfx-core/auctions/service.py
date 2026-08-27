from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class AuctionService:
    def __init__(self, supabase_admin: Client, supabase_anon: Client):
        self.supabase_admin = supabase_admin
        self.supabase_anon = supabase_anon

    def createAuction(self, 
                      shop_id: str, 
                      auction_data: Dict[str,Any]
                      ) -> Dict[str, Any]:
        """for creating a new auction"""
        try :
            data = {
                "shop_id": shop_id,
                "item_name": auction_data["item_name"],
                "description": auction_data.get("description"),
                "starting_price" : auction_data["starting_price"],
                "current_highest_bid": auction_data["starting_price"],
                "pincode" : auction_data["pincode"],
                "category" : auction_data["category","electronics"],
                "end_time" : auction_data["end_time"],
                "delivery_method" : auction_data.get("delivery_method","home_delivery"),
                "delivery_address": auction_data.get("delivery_address"),
                "image_urls": auction_data.get("image_urls", []),
                "status": "active"
            }
            response = self.supabase_admin.table("auctions").insert(data).execute()
            if not response.data:
                raise  Exception("failed to create Auction")
            return response.data[0]
        except Exception as e:
            logger.error(f"Error Creating a auction {str(e)}")
            raise

    def getAuctions(self, 
                    pincode : Optional[str] = None, 
                    category : Optional[str] = None, 
                    status : str = "active", 
                    limit: int = 100, 
                    offset : int = 0
                    ) -> List[Dict[str, Any]]:
        """get auctions with filter"""
        try: 
            query = self.supabase_admin.table("auctions").select("*,profiles!shop_id(shop_name)").eq("status",status)
            if pincode:
                query = query.eq("pincode", pincode)
            if category:
                query = query.eq("category", category)

            response  = query.execute()
            auctions = response.data if response.data else []

            # for bid count
            for auction in auctions:
                bid_count_response = self.supabase_admin.table("auction_bids").select("id", count = "exact").eq("auction_id", auction["id"]).execute() 
                auction["bid_count"] = len(bid_count_response.data) if bid_count_response.data else 0

                # get profile name 
                if auction.get("profiles"):
                    auction["shop_name"] = auction["profiles"].get("shop_name")
                    del auction["profiles"]

            return auctions
        except Exception as e:
            logger.error(f"error in getting auction {str(e)}")
            raise

    def getAuctionById(self, 
                          auction_id: str
                          ) -> Dict[str, Any]:
        """Get auction by ID with bids"""
        try:
            auction_response = self.supabase_anon.table("auctions").select("*, profiles!shop_id(shop_name)").eq("id", auction_id).execute()
            if not auction_response.data:
                raise ValueError("Auction not found")
            
            auction = auction_response.data[0]    
            # Get bids
            bids_response = self.supabase_anon.table("auction_bids").select("*, profiles!buyer_id(full_name)").eq("auction_id", auction_id).order("created_at", desc=True).execute()
            bids = bids_response.data if bids_response.data else []
        
            # Format bids
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
            
            #get shop_name
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
            auction_response = self.supabase_admin.table("auctions").select("*").eq("id", auction_id).execute()
            if not auction_response.data:
                raise ValueError("Auction not found")
            auction = auction_response.data[0]
            
            if auction["status"] != "active":
                raise ValueError("Auction is not active")

            end_time = datetime.fromisoformat(auction["end_time"])
            if datetime.now() > end_time:
                raise ValueError("Auction has ended")
    
            current_highest = auction.get("current_highest_bid") or auction["starting_price"]
            if bid_amount <= current_highest:
                raise ValueError(f"Bid must be higher than current highest bid (₹{current_highest})")
            
            if auction.get("current_highest_bidder") == buyer_id:
                raise ValueError("You are already the highest bidder")

            # place the bid
            bid_data = {
                "auction_id": auction_id,
                "buyer_id": buyer_id,
                "bid_amount": bid_amount
            }
            bid_response = self.supabase_admin.table("auction_bids").insert(bid_data).execute()
            if not bid_response.data:
                raise Exception("Failed to place bid")
            
            # Update auction with current highest bid
            update_data = {
                "current_highest_bid": bid_amount,
                "current_highest_bidder": buyer_id
            }
            
            # Sniping prevention: if bid within 5 minutes of end, extend by 5 minutes
            time_left = (end_time - datetime.now()).total_seconds()
            if time_left < 300:  # 5 minutes
                new_end_time = end_time + timedelta(minutes=5)
                update_data["end_time"] = new_end_time.isoformat()
                logger.info(f"Sniping prevention: Extended auction {auction_id} to {new_end_time}")
            self.supabase_admin.table("auctions").update(update_data).eq("id", auction_id).execute()
            
            return {
                "bid": bid_response.data[0],
                "auction_updated": update_data
            }
            
        except Exception as e:
            logger.error(f"Error placing bid on auction {auction_id}: {str(e)}")
            raise

    def cancelAuction(self, 
                      auction_id: str, 
                      shop_id: str
                      ) -> bool:
        """Cancel an active auction (shop owner only)"""
        try:
            check_response = self.supabase_admin.table("auctions").select("shop_id, status").eq("id", auction_id).execute()

            if not check_response.data:
                raise ValueError("Auction not found")
            auction = check_response.data[0]

            if auction["shop_id"] != shop_id:
                raise ValueError("You don't have permission to cancel this auction")
            if auction["status"] != "active":
                raise ValueError("Only active auctions can be cancelled")
            
            response = self.supabase_admin.table("auctions").update({"status": "cancelled"}).eq("id", auction_id).execute()
            return bool(response.data)

        except Exception as e:
            logger.error(f"Error cancelling auction {auction_id}: {str(e)}")
            raise

