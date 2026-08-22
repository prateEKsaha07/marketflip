from pydantic import BaseModel, Field, field_validator, ValidationInfo
from typing import Optional, List
from datetime import datetime
from uuid import UUID

# ----- Request Schemas -----
class RequestCreate(BaseModel):
    """Schema for creating a new request"""
    item_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    budget_min: int = Field(..., gt=0)
    budget_max: int = Field(..., gt=0)
    pincode: str = Field(..., min_length=6, max_length=6)
    category: Optional[str] = "electronics"
    reference_url: Optional[str] = None
    reference_image: Optional[str] = None
    delivery_method: Optional[str] = "home_delivery"
    delivery_address: Optional[str] = None
    image_urls: Optional[List[str]] = []
    
    @field_validator('budget_max')
    @classmethod
    def validate_budget(cls, v: int, info: ValidationInfo) -> int:
        if 'budget_min' in info.data and v < info.data['budget_min']:
            raise ValueError('budget_max must be greater than or equal to budget_min')
        return v
    
    @field_validator('pincode')
    @classmethod
    def validate_pincode(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('pincode must contain only digits')
        return v


class RequestResponse(BaseModel):
    """Schema for request response"""
    id: UUID
    buyer_id: UUID
    item_name: str
    description: Optional[str] = None
    budget_min: int
    budget_max: int
    pincode: str
    category: str
    reference_url: Optional[str] = None
    reference_image: Optional[str] = None
    delivery_method: Optional[str] = None   
    delivery_address: Optional[str] = None
    image_urls: Optional[List[str]] = []
    status: str
    created_at: datetime
    expires_at: datetime
    
    model_config = {
        "from_attributes": True
    }


class RequestDetailResponse(RequestResponse):
    """Schema for detailed request response with bids"""
    bids: List['BidResponse'] = []
    
    model_config = {"from_attributes": True}


# ----- Bid Schemas (for nested responses) -----

class BidResponse(BaseModel):
    """Schema for bid response"""
    id: UUID
    request_id: UUID
    shop_id: UUID
    price: int
    note: Optional[str] = None
    status: str
    created_at: datetime
    shop_name: Optional[str] = None
    
    model_config = {
        "from_attributes": True
    }


# ----- Query Params -----

class RequestQueryParams(BaseModel):
    """Query parameters for filtering requests"""
    pincode: Optional[str] = Field(None, min_length=6, max_length=6)
    category: Optional[str] = None
    status: Optional[str] = "open"
    
    @field_validator('pincode')
    @classmethod
    def validate_pincode(cls, v: Optional[str]) -> Optional[str]:
        if v and not v.isdigit():
            raise ValueError('pincode must contain only digits')
        return v


class DeliveryUpdate(BaseModel):
    delivery_method: str
    delivery_address: Optional[str] = None


class RequestUpdate(BaseModel):
    item_name: Optional[str] = None
    description: Optional[str] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    pincode: Optional[str] = None
    category: Optional[str] = None
    reference_url: Optional[str] = None
    reference_image: Optional[str] = None


class DeliveryConfirmResponse(BaseModel):
    """Schema for delivery confirmation response"""
    request_id: UUID
    delivery_confirmed_by_shop: bool
    delivery_response_at: datetime
    
    model_config = {"from_attributes": True}