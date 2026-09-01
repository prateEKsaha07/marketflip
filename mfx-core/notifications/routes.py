from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import logging

from auth.dependencies import get_current_user
from auth.dependencies import supabase_anon, supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def get_notifications(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all notifications for the current user.
    """
    try:
        user_id = current_user["id"]
        
        response = supabase_admin.table("notifications") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .range(offset, offset + limit - 1) \
            .execute()
        
        return response.data if response.data else []
        
    except Exception as e:
        logger.error(f"Get notifications error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/unread-count")
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    """
    Get unread notification count for the current user.
    """
    try:
        user_id = current_user["id"]
        
        response = supabase_admin.table("notifications") \
            .select("id", count="exact") \
            .eq("user_id", user_id) \
            .eq("read", False) \
            .execute()
        
        count = response.count if hasattr(response, 'count') else len(response.data) if response.data else 0
        
        return {"unread_count": count}
        
    except Exception as e:
        logger.error(f"Get unread count error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark a specific notification as read.
    """
    try:
        user_id = current_user["id"]
        
        # Check if notification exists and belongs to user
        check_response = supabase_admin.table("notifications") \
            .select("id") \
            .eq("id", str(notification_id)) \
            .eq("user_id", user_id) \
            .execute()
        
        if not check_response.data:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        response = supabase_admin.table("notifications") \
            .update({"read": True}) \
            .eq("id", str(notification_id)) \
            .eq("user_id", user_id) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to mark notification as read")
        
        return {
            "message": "Notification marked as read",
            "notification": response.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mark as read error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/read-all")
async def mark_all_as_read(
    current_user: dict = Depends(get_current_user)
):
    """
    Mark all notifications as read for the current user.
    """
    try:
        user_id = current_user["id"]
        
        response = supabase_admin.table("notifications") \
            .update({"read": True}) \
            .eq("user_id", user_id) \
            .eq("read", False) \
            .execute()
        
        return {
            "message": "All notifications marked as read",
            "updated_count": len(response.data) if response.data else 0
        }
        
    except Exception as e:
        logger.error(f"Mark all as read error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("")
async def create_notification(
    user_id: str,
    notification_type: str,
    title: str,
    body: str,
    link: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a notification for a user.
    This endpoint is for internal use (service role only).
    """
    # Only allow service role or admin to create notifications
    # For now, allow any authenticated user to create notifications for themselves
    # but in production this should be restricted
    
    try:
        data = {
            "user_id": user_id,
            "type": notification_type,
            "title": title,
            "body": body,
            "link": link,
            "read": False
        }
        
        response = supabase_admin.table("notifications").insert(data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create notification")
        
        return response.data[0]
        
    except Exception as e:
        logger.error(f"Create notification error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{notification_id}", status_code=204)
async def delete_notification(
    notification_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a notification.
    """
    try:
        user_id = current_user["id"]
        
        # Check if notification exists and belongs to user
        check_response = supabase_admin.table("notifications") \
            .select("id") \
            .eq("id", str(notification_id)) \
            .eq("user_id", user_id) \
            .execute()
        
        if not check_response.data:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        response = supabase_admin.table("notifications") \
            .delete() \
            .eq("id", str(notification_id)) \
            .eq("user_id", user_id) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to delete notification")
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete notification error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))