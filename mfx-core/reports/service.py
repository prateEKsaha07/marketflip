from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ReportService:
    def __init__(self, supabase_admin: Client, supabase_anon: Client):
        self.supabase_admin = supabase_admin
        self.supabase_anon = supabase_anon

    def create_report(self, reporter_id: str, report_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new report"""
        try:
            # Validate target exists
            target_type = report_data["target_type"]
            target_id = report_data["target_id"]
            
            if target_type == "request":
                table = "requests"
            elif target_type == "auction":
                table = "auctions"
            elif target_type == "user":
                table = "profiles"
            elif target_type == "message":
                table = "messages"
            else:
                raise ValueError(f"Invalid target_type: {target_type}")
            
            # Check if target exists
            check_response = self.supabase_admin.table(table) \
                .select("id") \
                .eq("id", str(target_id)) \
                .execute()
            
            if not check_response.data:
                raise ValueError(f"{target_type} with id {target_id} not found")
            
            # Check if user already reported this target (prevent spam)
            existing = self.supabase_admin.table("reports") \
                .select("id, status") \
                .eq("reporter_id", reporter_id) \
                .eq("target_type", target_type) \
                .eq("target_id", str(target_id)) \
                .eq("status", "pending") \
                .execute()
            
            if existing.data:
                raise ValueError("You have already reported this item")
            
            # Create report
            data = {
                "reporter_id": reporter_id,
                "target_type": target_type,
                "target_id": str(target_id),
                "reason": report_data["reason"],
                "description": report_data.get("description"),
                "status": "pending"
            }
            
            response = self.supabase_admin.table("reports").insert(data).execute()
            
            if not response.data:
                raise Exception("Failed to create report")
            
            return response.data[0]
            
        except Exception as e:
            logger.error(f"Error creating report: {str(e)}")
            raise

    def get_reports(
        self,
        status: Optional[str] = None,
        target_type: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get reports with filters (admin only)"""
        try:
            query = self.supabase_admin.table("reports").select("*")
            
            if status:
                query = query.eq("status", status)
            if target_type:
                query = query.eq("target_type", target_type)
            
            query = query.order("created_at", desc=True)
            query = query.range(offset, offset + limit - 1)
            
            response = query.execute()
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Error getting reports: {str(e)}")
            raise

    def get_user_reports(self, user_id: str) -> List[Dict[str, Any]]:
        """Get reports created by a user"""
        try:
            response = self.supabase_admin.table("reports") \
                .select("*") \
                .eq("reporter_id", user_id) \
                .order("created_at", desc=True) \
                .execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Error getting user reports: {str(e)}")
            raise

    def update_report_status(self, report_id: str, status: str) -> Dict[str, Any]:
        """Update report status (admin only)"""
        try:
            response = self.supabase_admin.table("reports") \
                .update({
                    "status": status,
                    "updated_at": datetime.utcnow().isoformat()
                }) \
                .eq("id", str(report_id)) \
                .execute()
            
            if not response.data:
                raise ValueError("Report not found")
            
            return response.data[0]
            
        except Exception as e:
            logger.error(f"Error updating report: {str(e)}")
            raise

    def get_flagged_targets(self, target_type: str) -> List[str]:
        """Get IDs of targets with pending reports (to exclude from feeds)"""
        try:
            response = self.supabase_admin.table("reports") \
                .select("target_id") \
                .eq("target_type", target_type) \
                .eq("status", "pending") \
                .execute()
            
            return [str(r["target_id"]) for r in response.data] if response.data else []
            
        except Exception as e:
            logger.error(f"Error getting flagged targets: {str(e)}")
            return []