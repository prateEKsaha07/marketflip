from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class ConversationCreate(BaseModel):
    buyer_id: UUID
    shop_id: UUID


class ConversationResponse(BaseModel):
    id: UUID
    buyer_id: UUID
    shop_id: UUID
    active_source_type: Optional[str] = None
    active_source_id: Optional[UUID] = None
    locked: bool = True
    created_at: datetime
    updated_at: datetime
    
    # Optional joined fields
    buyer_name: Optional[str] = None
    shop_name: Optional[str] = None
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: Optional[int] = 0
    active_item_name: Optional[str] = None
    active_item_price: Optional[int] = None
    active_item_image: Optional[str] = None
    
    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str) -> str:
        # Basic profanity filter
        # In production, use a proper profanity library
        banned_words = ['badword1', 'badword2']
        v_lower = v.lower()
        for word in banned_words:
            if word.lower() in v_lower:
                raise ValueError('Message contains prohibited content')
        return v.strip()


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    content: str
    is_read: bool = False
    read_at: Optional[datetime] = None
    created_at: datetime
    
    # Optional joined fields
    sender_name: Optional[str] = None
    sender_role: Optional[str] = None
    
    model_config = {"from_attributes": True}


class ChatUnlockRequest(BaseModel):
    source_type: str  # 'request' or 'auction'
    source_id: UUID


class ChatListResponse(BaseModel):
    conversations: List[ConversationResponse]
    total_unread: int