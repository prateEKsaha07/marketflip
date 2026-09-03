from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional, Literal

class ReviewCreate(BaseModel):
    reviewed_id: UUID  # The counterparty (the person being reviewed)
    target_type: Literal["request", "auction"]
    target_id: UUID
    rating: int = Field(ge=1, le=5, description="Rating between 1 and 5")
    comment: Optional[str] = Field(None, max_length=1000)

    @field_validator('rating')
    def validate_rating(cls, v):
        if v < 1 or v > 5:
            raise ValueError('Rating must be between 1 and 5')
        return v

class ReviewResponse(BaseModel):
    id: UUID
    reviewer_id: UUID
    reviewed_id: UUID
    target_type: str
    target_id: UUID
    rating: int
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewCheckResponse(BaseModel):
    has_reviewed: bool
    review_id: Optional[UUID] = None

class ReviewStatsResponse(BaseModel):
    average_rating: Optional[float] = None
    total_reviews: int
    rating_distribution: dict 