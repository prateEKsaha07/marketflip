from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class ShopReliabilityScoreResponse(BaseModel):
    """Schema for shop reliability score response"""
    id: UUID
    shop_id: UUID
    avg_response_time_minutes: float
    completion_rate: float
    selection_rate: float
    reliability_score: float
    response_score: float
    completion_score: float
    selection_score: float
    total_requests_handled: int
    total_bids_placed: int
    total_selected: int
    total_completed: int
    calculated_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ShopReliabilityScoreUpdate(BaseModel):
    """Schema for updating reliability score (internal)"""
    avg_response_time_minutes: Optional[float] = None
    completion_rate: Optional[float] = None
    selection_rate: Optional[float] = None
    reliability_score: Optional[float] = None
    response_score: Optional[float] = None
    completion_score: Optional[float] = None
    selection_score: Optional[float] = None
    total_requests_handled: Optional[int] = None
    total_bids_placed: Optional[int] = None
    total_selected: Optional[int] = None
    total_completed: Optional[int] = None