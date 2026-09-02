from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID

class PriceSuggestionRequest(BaseModel):
    request_id: UUID = Field(..., description="Unique identifier for the request")
    category: str = Field(..., description="Category of the product for which the price suggestion is requested")
    budget_min: Optional[int] = Field(None, description="Minimum budget for the product")
    budget_max: Optional[int] = Field(None, description="Maximum budget for the product")
    pincode: Optional[str] = Field(None, description="Pincode of the location for which the price suggestion is requested") 

class PriceSuggestionResponse(BaseModel):
    request_id: UUID = Field(..., description="Unique identifier for the request")
    suggested_price: int = Field(..., description="Suggested price for the product based on the request parameters")
    confidence_score: float = Field(..., description="Confidence score of the suggested price")
    min_price: Optional[int] = Field(None, description="Minimum price observed for the product in the given category and location")
    max_price: Optional[int] = Field(None, description="Maximum price observed for the product in the given category and location")
