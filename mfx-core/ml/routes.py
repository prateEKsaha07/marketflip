from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from uuid import UUID

from auth.dependencies import get_current_user
from ml.price_suggestion import PriceSuggestionModel
from ml.bid_ranking import BidRanker
from ml.recommendations import AprioriRecommender
from ml.demand_forecast import DemandForecaster
from ml.fraud_detection import FraudDetector

router = APIRouter(prefix="/ml", tags=["ML"])

# Initialize models
price_model = PriceSuggestionModel()
price_model.load_model()

bid_ranker = BidRanker()
recommender = AprioriRecommender()
forecaster = DemandForecaster()
fraud_detector = FraudDetector()


@router.post("/price-suggestion")
async def get_price_suggestion(
    request_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Get suggested price for a request"""
    try:
        result = price_model.predict(request_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/rank-bids")
async def rank_bids(
    request_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Rank bids by price + reliability"""
    try:
        bids = request_data.get('bids', [])
        budget_min = request_data.get('budget_min', 0)
        budget_max = request_data.get('budget_max', 0)
        reliability_scores = request_data.get('reliability_scores', {})
        
        ranked = bid_ranker.rank_bids(bids, budget_min, budget_max, reliability_scores)
        return ranked
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/recommendations")
async def get_recommendations(
    request_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Get recommendations based on request"""
    # Implementation
    pass


@router.get("/demand-forecast")
async def get_demand_forecast(
    category: Optional[str] = None,
    pincode: Optional[str] = None,
    days: int = 7,
    current_user: dict = Depends(get_current_user)
):
    """Get demand forecast"""
    # Implementation
    pass


@router.post("/detect-fraud")
async def detect_fraud(
    bid_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Detect potential fraud in a bid"""
    try:
        result = fraud_detector.predict(bid_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))