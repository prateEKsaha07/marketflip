from supabase import Client
from uuid import UUID
from typing import List, Optional, Dict
import logging

logger = logging.getLogger(__name__)

class ReviewService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    def create_review(
        self, 
        reviewer_id: UUID, 
        reviewed_id: UUID, 
        target_type: str, 
        target_id: UUID, 
        rating: int, 
        comment: Optional[str] = None
    ) -> dict:
        """
        Create a new review.
        DB-level triggers will validate:
        - Transaction is completed
        - User is a participant
        - reviewed_id is the counterparty
        - One review per (reviewer, target)
        """
        data = {
            "reviewer_id": str(reviewer_id),
            "reviewed_id": str(reviewed_id),
            "target_type": target_type,
            "target_id": str(target_id),
            "rating": rating,
            "comment": comment
        }

        result = self.supabase.table("reviews").insert(data).execute()
        
        if not result.data or len(result.data) == 0:
            raise Exception("Failed to create review")
        
        return result.data[0]

    def get_reviews_for_profile(self, profile_id: UUID, limit: int = 50, offset: int = 0) -> List[dict]:
        """Get all reviews for a profile (both received and given)"""
        result = self.supabase.table("reviews")\
            .select("*")\
            .eq("reviewed_id", str(profile_id))\
            .order("created_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        
        return result.data if result.data else []

    def get_reviews_given_by_user(self, reviewer_id: UUID, limit: int = 50, offset: int = 0) -> List[dict]:
        """Get all reviews given by a user"""
        result = self.supabase.table("reviews")\
            .select("*")\
            .eq("reviewer_id", str(reviewer_id))\
            .order("created_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        
        return result.data if result.data else []

    def get_reviews_for_target(self, target_type: str, target_id: UUID) -> List[dict]:
        """Get all reviews for a specific transaction target"""
        result = self.supabase.table("reviews")\
            .select("*")\
            .eq("target_type", target_type)\
            .eq("target_id", str(target_id))\
            .order("created_at", desc=True)\
            .execute()
        
        return result.data if result.data else []

    def check_user_reviewed_target(self, reviewer_id: UUID, target_type: str, target_id: UUID) -> Optional[dict]:
        """Check if a user has already reviewed a specific target"""
        result = self.supabase.table("reviews")\
            .select("id")\
            .eq("reviewer_id", str(reviewer_id))\
            .eq("target_type", target_type)\
            .eq("target_id", str(target_id))\
            .execute()
        
        return result.data[0] if result.data and len(result.data) > 0 else None

    def get_review_stats(self, profile_id: UUID) -> dict:
        """Get review statistics for a profile"""
        # Get all reviews where this profile is reviewed
        result = self.supabase.table("reviews")\
            .select("rating")\
            .eq("reviewed_id", str(profile_id))\
            .execute()
        
        reviews = result.data if result.data else []
        total = len(reviews)
        
        if total == 0:
            return {
                "average_rating": None,
                "total_reviews": 0,
                "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
            }
        
        # Calculate average
        total_rating = sum(r["rating"] for r in reviews)
        avg = round(total_rating / total, 2)
        
        # Calculate distribution
        dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for r in reviews:
            dist[r["rating"]] = dist.get(r["rating"], 0) + 1
        
        return {
            "average_rating": avg,
            "total_reviews": total,
            "rating_distribution": dist
        }

    def delete_review(self, review_id: UUID, user_id: UUID) -> bool:
        """Delete a review (only the reviewer can delete their own)"""
        # Check if review exists and belongs to user
        check = self.supabase.table("reviews")\
            .select("id")\
            .eq("id", str(review_id))\
            .eq("reviewer_id", str(user_id))\
            .execute()
        
        if not check.data or len(check.data) == 0:
            return False
        
        # Delete it
        self.supabase.table("reviews")\
            .delete()\
            .eq("id", str(review_id))\
            .execute()
        
        return True