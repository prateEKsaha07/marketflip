from pydantic import BaseModel, Field
from typing import Optional, Literal, List, Dict, Any

class Confidence(BaseModel):
    item_name: Literal["high", "low"]
    budget: Literal["high", "low"]
    category: Literal["high", "low"]
    pincode: Literal["high", "low"]
    urgency: Literal["high", "low"]

class parsed_request(BaseModel):
    item_name: Optional[str] = Field(
        default=None,
        description="Name of the item")
    description: Optional[str] = Field(
        default=None,
        description="Extra detail not already in item_name. Null if nothing to add.")
    budget_min: Optional[int] = Field(
        default=None,
        description="Minimum budget in rupees. Integer, no decimals.")
    budget_max: Optional[int] = Field(
        default=None,
        description="Maximum budget in rupees. Integer, no decimals.")
    category_id: Optional[str] = Field(
        default=None,
        description="UUID of the category from the provided category list. Must match exactly.")
    pincode: Optional[str] = Field(
        default=None,
        description="6-digit Indian pincode. Exactly 6 digits.")
    urgency: Optional[Literal["flexible", "soon", "urgent"]] = Field(
        default=None,
        description="'urgent' (asap/today), 'soon' (this week), 'flexible' (no rush)")
    confidence: Confidence

# JSON body with a text field
class ParseRequestIn(BaseModel):
    text: str

# the response model must wrap it
class ParseRequestOut(BaseModel):
    draft: Optional[parsed_request]
    missing_fields: List[str]
    low_confidence_fields: List[str]
    raw_text: str
    log_id: Optional[str] = None

class LogActionIn(BaseModel):
    buyer_action: Literal["accepted", "edited", "abandoned"]
    edited_fields: Optional[Dict[str, Any]] = None


class AskIn(BaseModel):
    question: str = Field(..., min_length=3, max_length=300)


class AskOut(BaseModel):
    answer: str
    raw_question: str
    providers_used: List[str]
    log_id: Optional[str] = None
