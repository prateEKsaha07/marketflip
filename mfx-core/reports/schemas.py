from pydantic import BaseModel, Field, field_validator
from typing import Optional
from uuid import UUID
from datetime import datetime


class ReportCreate(BaseModel):
    """Schema for creating a report"""
    target_type: str = Field(..., pattern="^(request|auction|user|message)$")
    target_id: UUID
    reason: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)

    @field_validator('target_type')
    @classmethod
    def validate_target_type(cls, v: str) -> str:
        if v not in ['request', 'auction', 'user', 'message']:
            raise ValueError('target_type must be request, auction, user, or message')
        return v


class ReportResponse(BaseModel):
    """Schema for report response"""
    id: UUID
    reporter_id: UUID
    target_type: str
    target_id: UUID
    reason: str
    description: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReportUpdate(BaseModel):
    """Schema for updating report status (admin only)"""
    status: str = Field(..., pattern="^(pending|reviewed|dismissed|action_taken)$")