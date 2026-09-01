from supabase import Client
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class FavoriteService:
    def __init__(self, supabase_admin: Client, supabase_anon: Client):
        self.supabase_admin = supabase_admin
        self.supabase_anon = supabase_anon

    def toggle_favorite(self, user_id: str, target_type: str, target_id: str) -> Dict[str, Any]:
        try:
            # Check if already favorited
            check = self.supabase_admin.table("favorites") \
                .select("id") \
                .eq("user_id", user_id) \
                .eq("target_type", target_type) \
                .eq("target_id", target_id) \
                .execute()
            
            if check.data:
                # Remove favorite
                self.supabase_admin.table("favorites") \
                    .delete() \
                    .eq("id", check.data[0]["id"]) \
                    .execute()
                return {"action": "removed", "favorited": False}
            else:
                # Add favorite
                response = self.supabase_admin.table("favorites").insert({
                    "user_id": user_id,
                    "target_type": target_type,
                    "target_id": target_id
                }).execute()
                return {"action": "added", "favorited": True, "favorite": response.data[0] if response.data else None}
        except Exception as e:
            logger.error(f"Error toggling favorite: {str(e)}")
            raise

    def get_favorites(self, user_id: str, target_type: Optional[str] = None) -> List[Dict[str, Any]]:
        try:
            query = self.supabase_admin.table("favorites") \
                .select("*") \
                .eq("user_id", user_id)
            
            if target_type:
                query = query.eq("target_type", target_type)
            
            response = query.order("created_at", desc=True).execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error getting favorites: {str(e)}")
            return []

    def is_favorited(self, user_id: str, target_type: str, target_id: str) -> bool:
        try:
            response = self.supabase_admin.table("favorites") \
                .select("id") \
                .eq("user_id", user_id) \
                .eq("target_type", target_type) \
                .eq("target_id", target_id) \
                .execute()
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            logger.error(f"Error checking favorite: {str(e)}")
            return False