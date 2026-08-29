from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from uuid import UUID
import logging
from datetime import datetime

from auth.dependencies import get_current_user, supabase_admin, supabase_anon
from chat.schemas import (
    ConversationResponse,
    MessageCreate,
    MessageResponse,
    ChatUnlockRequest,
    ChatListResponse
)
from chat.services import ChatService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])

chat_service = ChatService(supabase_admin, supabase_anon)


# ====== CONVERSATIONS ======

@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all conversations for the current user.
    """
    try:
        user_id = current_user["id"]
        role = current_user.get("role")
        
        if role not in ["buyer", "shop_owner"]:
            raise HTTPException(status_code=403, detail="Invalid role")
        
        conversations = chat_service.get_conversations_for_user(user_id, role)
        return conversations
        
    except Exception as e:
        logger.error(f"Get conversations error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """
    Get messages for a conversation.
    """
    try:
        # Verify user is part of the conversation
        conv_response = supabase_admin.table("conversations") \
            .select("buyer_id, shop_id") \
            .eq("id", str(conversation_id)) \
            .execute()
        
        if not conv_response.data:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conv = conv_response.data[0]
        if conv["buyer_id"] != current_user["id"] and conv["shop_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not part of this conversation")
        
        messages = chat_service.get_messages(str(conversation_id), limit, offset)
        
        # Mark messages as read
        chat_service.mark_messages_read(str(conversation_id), current_user["id"])
        
        return messages
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get messages error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: UUID,
    message: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a message in a conversation.
    """
    try:
        # Verify user is part of the conversation
        conv_response = supabase_admin.table("conversations") \
            .select("buyer_id, shop_id, locked") \
            .eq("id", str(conversation_id)) \
            .execute()
        
        if not conv_response.data:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conv = conv_response.data[0]
        if conv["buyer_id"] != current_user["id"] and conv["shop_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Not part of this conversation")
        
        if conv.get("locked", True):
            raise HTTPException(status_code=400, detail="Conversation is locked")
        
        # Simple rate limiting (check last message time)
        last_msg_response = supabase_admin.table("messages") \
            .select("created_at") \
            .eq("conversation_id", str(conversation_id)) \
            .eq("sender_id", current_user["id"]) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
        
        if last_msg_response.data:
            last_time = datetime.fromisoformat(last_msg_response.data[0]["created_at"].replace('Z', '+00:00'))
            time_diff = (datetime.now().astimezone() - last_time).total_seconds()
            if time_diff < 2:  # 2 second rate limit
                raise HTTPException(status_code=429, detail="Too many messages. Please wait.")
        
        result = chat_service.send_message(
            conversation_id=str(conversation_id),
            sender_id=current_user["id"],
            content=message.content
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send message error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/conversations/{conversation_id}/read")
async def mark_read(
    conversation_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark all messages in a conversation as read.
    """
    try:
        count = chat_service.mark_messages_read(str(conversation_id), current_user["id"])
        return {"message": f"Marked {count} messages as read", "count": count}
        
    except Exception as e:
        logger.error(f"Mark read error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/unread-count")
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    """
    Get total unread message count for the current user.
    """
    try:
        count = chat_service.get_unread_count(
            current_user["id"],
            current_user.get("role")
        )
        
        return {"unread_count": count}
        
    except Exception as e:
        logger.error(f"Get unread count error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))