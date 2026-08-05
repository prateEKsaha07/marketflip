from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class BidCreate(BaseModel):
    """Schema for creating a new bid"""
    price: int = Field(..., gt=0)
    note: Optional[str] = None
    
    @field_validator('price')
    @classmethod
    def validate_price(cls, v: int) -> int:
        if v <= 0:
            raise ValueError('price must be greater than 0')
        return v

class BidUpdate(BaseModel):
    """Schema for updating a bid"""
    price: Optional[int] = Field(None, gt=0)
    note: Optional[str] = None
    
    @field_validator('price')
    @classmethod
    def validate_price(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError('price must be greater than 0')
        return v

class BidResponse(BaseModel):
    """Schema for bid response"""
    id: UUID
    request_id: UUID
    shop_id: UUID
    price: int
    note: Optional[str]
    status: str
    created_at: datetime
    
    model_config = {
        "from_attributes": True
    }

class BidDetailResponse(BidResponse):
    """Schema for detailed bid response with shop info"""
    shop_name: Optional[str] = None
    shop_phone: Optional[str] = None
    shop_address: Optional[str] = None

class BidSelectionResponse(BaseModel):
    """Schema for response after selecting a bid"""
    bid_id: UUID
    request_id: UUID
    status: str
    selected_bid: BidDetailResponse
    shop_contact: dict