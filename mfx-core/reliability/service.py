from supabase import Client
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
import statistics

logger = logging.getLogger(__name__)


class ReliabilityService:
    def __init__(self, supabase_admin: Client, supabase_anon: Client):
        self.supabase_admin = supabase_admin
        self.supabase_anon = supabase_anon

    def compute_shop_reliability(self, shop_id: str) -> Dict[str, Any]:
        """Compute reliability scores for a single shop"""
        try:
            # ====== GET REQUEST BIDS ======
            bids_response = self.supabase_admin.table("bids") \
                .select("*, requests!inner(*)") \
                .eq("shop_id", shop_id) \
                .execute()
            
            bids = bids_response.data if bids_response.data else []
            
            # ====== GET AUCTIONS ======
            auctions_response = self.supabase_admin.table("auctions") \
                .select("*") \
                .eq("shop_id", shop_id) \
                .execute()
            
            auctions = auctions_response.data if auctions_response.data else []
            
            total_bids = len(bids)
            total_auctions = len(auctions)
            total_transactions = total_bids + total_auctions
            
            if total_transactions == 0:
                return self._get_default_scores(shop_id)
            
            # ====== REQUEST FLOW: Calculate Metrics ======
            selected_bids = [b for b in bids if b.get("status") == "selected"]
            total_selected = len(selected_bids)
            
            # Completed requests
            completed_bids = [b for b in bids if b.get("requests", {}).get("status") == "completed"]
            total_completed_requests = len(completed_bids)
            
            # Calculate average response time for requests
            request_response_times = []
            for bid in completed_bids:
                try:
                    created_at_str = bid.get("created_at", "")
                    if not created_at_str:
                        continue
                    created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                    request = bid.get("requests", {})
                    completed_at_str = request.get("completed_at")
                    if completed_at_str:
                        completed_time = datetime.fromisoformat(completed_at_str.replace('Z', '+00:00'))
                        response_time = (completed_time - created_at).total_seconds() / 3600  # hours
                        if response_time >= 0:  # Only positive times
                            request_response_times.append(response_time)
                except Exception as e:
                    logger.debug(f"Error calculating request response time: {e}")
                    continue
            
            # ====== AUCTION FLOW: Calculate Metrics ======
            # Completed auctions
            completed_auctions = [a for a in auctions if a.get("status") == "completed"]
            total_completed_auctions = len(completed_auctions)
            
            # Calculate average response time for auctions
            auction_response_times = []
            for auction in completed_auctions:
                try:
                    closed_at_str = auction.get("closed_at")
                    completed_at_str = auction.get("completed_at") or closed_at
                    if closed_at_str and completed_at_str:
                        closed_time = datetime.fromisoformat(closed_at_str.replace('Z', '+00:00'))
                        completed_time = datetime.fromisoformat(completed_at_str.replace('Z', '+00:00'))
                        response_time = (completed_time - closed_time).total_seconds() / 3600  # hours
                        if response_time >= 0:  # Only positive times
                            auction_response_times.append(response_time)
                except Exception as e:
                    logger.debug(f"Error calculating auction response time: {e}")
                    continue
            
            # ====== COMBINE METRICS ======
            total_completed = total_completed_requests + total_completed_auctions
            all_response_times = request_response_times + auction_response_times
            
            avg_response_time = statistics.mean(all_response_times) if all_response_times else 0
            
            # Calculate rates based on total transactions
            completion_rate = total_completed / total_transactions if total_transactions > 0 else 0
            selection_rate = total_selected / total_bids if total_bids > 0 else 0
            
            # ====== COMPUTE SCORES (0-100 scale) ======
            response_score = self._compute_response_score(avg_response_time)
            completion_score = completion_rate * 100
            selection_score = selection_rate * 100
            
            # Weighted reliability score
            reliability_score = (
                response_score * 0.3 +
                completion_score * 0.4 +
                selection_score * 0.3
            )
            
            return {
                "shop_id": shop_id,
                "avg_response_time_minutes": avg_response_time * 60,  # Convert to minutes
                "completion_rate": round(completion_rate, 4),
                "selection_rate": round(selection_rate, 4),
                "reliability_score": round(reliability_score, 2),
                "response_score": round(response_score, 2),
                "completion_score": round(completion_score, 2),
                "selection_score": round(selection_score, 2),
                "total_bids_placed": total_transactions,  # Bids + Auctions
                "total_selected": total_selected,
                "total_completed": total_completed,
                "total_requests": total_bids,
                "total_auctions": total_auctions,
                "calculated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error computing reliability for shop {shop_id}: {str(e)}")
            raise

    def _compute_response_score(self, avg_response_hours: float) -> float:
        """
        Compute response score based on average response time.
        
        Scoring:
        - < 2 hours: 100 (Excellent)
        - 2-12 hours: 90 (Very Good)
        - 12-24 hours: 80 (Good)
        - 1-3 days: 60 (Average)
        - 3-7 days: 40 (Below Average)
        - > 7 days: 20 (Poor)
        - No data: 0
        """
        if avg_response_hours <= 0:
            return 0
        elif avg_response_hours <= 2:
            return 100
        elif avg_response_hours <= 12:
            return 90
        elif avg_response_hours <= 24:
            return 80
        elif avg_response_hours <= 72:
            return 60
        elif avg_response_hours <= 168:
            return 40
        else:
            return 20

    def _get_default_scores(self, shop_id: str) -> Dict[str, Any]:
        """Return default scores for shops with no data"""
        return {
            "shop_id": shop_id,
            "avg_response_time_minutes": 0,
            "completion_rate": 0,
            "selection_rate": 0,
            "reliability_score": 0,
            "response_score": 0,
            "completion_score": 0,
            "selection_score": 0,
            "total_bids_placed": 0,
            "total_selected": 0,
            "total_completed": 0,
            "total_requests": 0,
            "total_auctions": 0,
            "calculated_at": datetime.utcnow().isoformat()
        }

    def compute_all_shops_reliability(self) -> List[Dict[str, Any]]:
        """Compute reliability scores for all shops"""
        try:
            # Get all shop IDs
            response = self.supabase_admin.table("profiles") \
                .select("id") \
                .eq("role", "shop_owner") \
                .execute()
            
            shop_ids = [p["id"] for p in response.data] if response.data else []
            
            logger.info(f"Computing reliability for {len(shop_ids)} shops")
            
            results = []
            for shop_id in shop_ids:
                try:
                    score = self.compute_shop_reliability(shop_id)
                    results.append(score)
                except Exception as e:
                    logger.error(f"Error computing for shop {shop_id}: {e}")
            
            return results
            
        except Exception as e:
            logger.error(f"Error computing all shop reliability: {str(e)}")
            raise

    def update_shop_reliability_scores(self, scores: List[Dict[str, Any]]) -> bool:
        """Update or insert reliability scores for shops"""
        try:
            for score in scores:
                shop_id = score.pop("shop_id")
                
                # Check if score exists
                check = self.supabase_admin.table("shop_reliability_scores") \
                    .select("id") \
                    .eq("shop_id", shop_id) \
                    .execute()
                
                if check.data:
                    # Update existing
                    self.supabase_admin.table("shop_reliability_scores") \
                        .update({
                            **score,
                            "updated_at": datetime.utcnow().isoformat()
                        }) \
                        .eq("shop_id", shop_id) \
                        .execute()
                else:
                    # Insert new
                    self.supabase_admin.table("shop_reliability_scores") \
                        .insert({
                            **score,
                            "shop_id": shop_id,
                            "updated_at": datetime.utcnow().isoformat()
                        }) \
                        .execute()
            
            logger.info(f"Updated reliability scores for {len(scores)} shops")
            return True
            
        except Exception as e:
            logger.error(f"Error updating reliability scores: {str(e)}")
            raise

    def get_shop_reliability_score(self, shop_id: str) -> Optional[Dict[str, Any]]:
        """Get reliability score for a single shop"""
        try:
            response = self.supabase_admin.table("shop_reliability_scores") \
                .select("*") \
                .eq("shop_id", shop_id) \
                .execute()
            
            return response.data[0] if response.data else None
            
        except Exception as e:
            logger.error(f"Error getting reliability for shop {shop_id}: {str(e)}")
            return None

    def get_reliability_scores(self, shop_ids: List[str]) -> List[Dict[str, Any]]:
        """Get reliability scores for multiple shops"""
        try:
            if not shop_ids:
                return []
            
            response = self.supabase_admin.table("shop_reliability_scores") \
                .select("*") \
                .in_("shop_id", shop_ids) \
                .execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Error getting reliability scores: {str(e)}")
            return []

    def refresh_all_reliability_scores(self):
        """Compute and update reliability scores for all shops"""
        logger.info("Starting reliability score refresh...")
        
        scores = self.compute_all_shops_reliability()
        self.update_shop_reliability_scores(scores)
        
        logger.info(f"Reliability score refresh complete for {len(scores)} shops")
        return scores