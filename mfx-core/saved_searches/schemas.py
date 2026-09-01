from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime


class SavedSearchCreate(BaseModel):
    name: str
    search_params: Dict[str, Any]


class SavedSearchUpdate(BaseModel):
    name: Optional[str] = None
    search_params: Optional[Dict[str, Any]] = None


class SavedSearchResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    search_params: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}