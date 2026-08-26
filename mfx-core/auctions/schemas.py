from pydantic import BaseModel, Field, field_validator
from typing import  Optional, List
from uuid import UUID
from  datetime import datetime


class AuctionCreate(BaseModel):
    """ Scema for creating an auction"""
    item_name : str = Field(..., min_length=1, max_length=255)
    description : Optional[str] = None
    starting_price : int = Field(..., gt=0)
    pincode = str = Field(..., min_length=6)
    category = Optional[str] = "electronics"
    end_time = datetime
    delivery_method : str = 'home_delivery'
    delivery_address: Optional[str] = None
    image_urls : Optional[List[str]] = []

    @field_validator('pincode')
    @classmethod
    def validate_pincode(cls, value : str) -> str:
        if not value.isdigit():
            raise ValueError('pincode must only contain digits')
        return value

    @field_validator
    @classmethod
    def validate_delivery_method(cls, value: str) -> str:
        if value is not in ['home_delivery','pickup']:
            raise ValueError('delivery method must only contain between home_delivery or pickup')
        return value

class AuctionUpdate(BaseModel):
    """Schema for updating auction"""
    item_name : Optional[str] = None
    description : Optional[str] = None
    category : Optional[str] = None
    delivery_method: Optional[str] = None
    delivery_address: Optional[str] = None

class AuctionResponse(BaseModel):
    """Schema for auction response"""
    id: UUID
    shop_id: UUID
    item_name: str
    description : Optional[str] = None
    starting_price : int
    current_highest_bid : Optional[int] = None
    winning_bid_id: Optional[UUID] = None
    category: Optional[str] = None
    pincode : str
    image_urls : Optional[List[str]] = None
    status : str
    end_time : datetime
    closed_at : Optional[datetime] = None
    delivery_method: Optional[str] = None
    delivery_address: Optional[str] = None
    delivery_confirmed_by_shop: Optional[bool] = None
    delivery_response_at: Optional[datetime] = None
    created_at: datetime
    shop_name: Optional[str] = None
    bid_count: Optional[int] = None

    model_config = {"from attributes": True}

class AuctionDetailResponse(AuctionResponse):
    """Schema for deatiled  auction response with bids"""
    bids: List['AuctionBidResponse'] = []
    model_config = {"from_attributes": True}

class AuctionBidCreate(BaseModel):
    """schema for plaving a bid in the auction"""
    bid_amount: int = Field(...,gt=0)

class AuctionBidResponse(BaseModel):
    """schema for auction response"""
    id: UUID
    auction_id: UUID
    buyer_id: UUID
    bid_amount: int
    created_at: datetime
    buyer_name: Optional[str] = None

    model_config = {"from_attributes": True}

# Forward reference for BidResponse
AuctionDetailResponse.model_rebuild()