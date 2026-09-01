from supabase import Client
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class SavedSearchService:
    def __init__(self, supabase_admin: Client, supabase_anon: Client):
        self.supabase_admin = supabase_admin
        self.supabase_anon = supabase_anon

    def create_saved_search(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            response = self.supabase_admin.table("saved_searches").insert({
                "user_id": user_id,
                "name": data["name"],
                "search_params": data["search_params"]
            }).execute()
            
            if not response.data:
                raise Exception("Failed to create saved search")
            return response.data[0]
        except Exception as e:
            logger.error(f"Error creating saved search: {str(e)}")
            raise

    def get_saved_searches(self, user_id: str) -> List[Dict[str, Any]]:
        try:
            response = self.supabase_admin.table("saved_searches") \
                .select("*") \
                .eq("user_id", user_id) \
                .order("created_at", desc=True) \
                .execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"Error getting saved searches: {str(e)}")
            return []

    def update_saved_search(self, search_id: str, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            update_data = {}
            if "name" in data:
                update_data["name"] = data["name"]
            if "search_params" in data:
                update_data["search_params"] = data["search_params"]
            update_data["updated_at"] = datetime.utcnow().isoformat()
            
            response = self.supabase_admin.table("saved_searches") \
                .update(update_data) \
                .eq("id", search_id) \
                .eq("user_id", user_id) \
                .execute()
            
            if not response.data:
                raise Exception("Saved search not found")
            return response.data[0]
        except Exception as e:
            logger.error(f"Error updating saved search: {str(e)}")
            raise

    def delete_saved_search(self, search_id: str, user_id: str) -> bool:
        try:
            response = self.supabase_admin.table("saved_searches") \
                .delete() \
                .eq("id", search_id) \
                .eq("user_id", user_id) \
                .execute()
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            logger.error(f"Error deleting saved search: {str(e)}")
            raise