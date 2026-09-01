from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class FavoriteCreate(BaseModel):
    target_type: str  # 'request' or 'auction'
    target_id: UUID


class FavoriteResponse(BaseModel):
    id: UUID
    user_id: UUID
    target_type: str
    target_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}