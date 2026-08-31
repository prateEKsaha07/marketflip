from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class AuctionCreate(BaseModel):
    """Schema for creating an auction - shop sets item details, NOT delivery address"""
    item_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    starting_price: int = Field(..., gt=0)
    pincode: str = Field(..., min_length=6)
    category: Optional[str] = "electronics"
    end_time: datetime
    image_urls: Optional[List[str]] = []

    @field_validator('pincode')
    @classmethod
    def validate_pincode(cls, value: str) -> str:
        if not value.isdigit():
            raise ValueError('pincode must only contain digits')
        return value


class AuctionUpdate(BaseModel):
    """Schema for updating auction"""
    item_name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None


class AuctionResponse(BaseModel):
    """Schema for auction response"""
    id: UUID
    shop_id: UUID
    item_name: str
    description: Optional[str] = None
    starting_price: int
    current_highest_bid: Optional[int] = None
    winning_bid_id: Optional[UUID] = None
    category: Optional[str] = None
    pincode: str
    image_urls: Optional[List[str]] = []
    status: str
    end_time: datetime
    closed_at: Optional[datetime] = None
    delivery_method: Optional[str] = None
    delivery_address: Optional[str] = None
    delivery_confirmed_by_shop: Optional[bool] = None
    delivery_response_at: Optional[datetime] = None
    verification_code: Optional[str] = None
    verification_attempts: Optional[int] = 0
    completed_via_override: Optional[bool] = False
    created_at: datetime
    shop_name: Optional[str] = None
    bid_count: Optional[int] = 0

    model_config = {"from_attributes": True}


class AuctionDetailResponse(AuctionResponse):
    """Schema for detailed auction response with bids"""
    bids: List['AuctionBidResponse'] = []
    model_config = {"from_attributes": True} 


class AuctionBidCreate(BaseModel):
    """Schema for placing a bid on an auction"""
    bid_amount: int = Field(..., gt=0)


class AuctionBidResponse(BaseModel):
    """Schema for auction bid response"""
    id: UUID
    auction_id: UUID
    buyer_id: UUID
    bid_amount: int
    created_at: datetime
    buyer_name: Optional[str] = None

    model_config = {"from_attributes": True}


# ====== PHASE 5B: Post-Sale Delivery/OTP Schemas ======

class AuctionSetDeliveryRequest(BaseModel):
    """Buyer sets delivery method and address after winning"""
    delivery_method: str = Field(..., pattern="^(home_delivery|pickup)$")
    delivery_address: Optional[str] = None

    @field_validator('delivery_address')
    @classmethod
    def validate_delivery_address(cls, v: Optional[str], info) -> Optional[str]:
        delivery_method = info.data.get('delivery_method')
        if delivery_method == 'home_delivery' and (not v or not v.strip()):
            raise ValueError('delivery_address is required for home delivery')
        return v


class AuctionDeliveryConfirmResponse(BaseModel):
    """Response when shop confirms/denies delivery"""
    auction_id: UUID
    status: str
    delivery_confirmed_by_shop: bool
    delivery_response_at: datetime
    verification_code: Optional[str] = None
    message: str


class AuctionVerifyOTPRequest(BaseModel):
    """Shop submits OTP for verification"""
    verification_code: str = Field(..., min_length=6, max_length=6)


class AuctionVerifyOTPResponse(BaseModel):
    """Response after OTP verification attempt"""
    auction_id: UUID
    status: str
    verification_attempts: int
    max_attempts: int = 5
    completed: bool
    message: str


class AuctionSwitchToPickupRequest(BaseModel):
    """Buyer switches to pickup after delivery denial"""
    delivery_address: Optional[str] = None


class AuctionOverrideCompleteResponse(BaseModel):
    """Response after buyer override completes the transaction"""
    auction_id: UUID
    status: str
    completed_via_override: bool
    message: str


class AuctionRelistResponse(BaseModel):
    """Response after relisting a cancelled auction"""
    original_auction_id: UUID
    new_auction_id: UUID
    status: str
    message: str


# Forward reference for BidResponse
AuctionDetailResponse.model_rebuild()