import numpy as np
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class BidRanker:
    def __init__(self, reliability_weight: float = 0.4, price_weight: float = 0.6):
        self.reliability_weight = reliability_weight
        self.price_weight = price_weight

    def rank_bids(self, bids: List[Dict[str, Any]], 
                  budget_min: int, budget_max: int,
                  reliability_scores: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Rank bids by combined score of price + reliability
        """
        if not bids:
            return []
        
        budget_mid = (budget_min + budget_max) / 2
        
        scored_bids = []
        
        for bid in bids:
            shop_id = bid.get('shop_id')
            
            # Normalize price score (0-100)
            price_score = self._calculate_price_score(
                bid.get('price', 0),
                budget_min,
                budget_max,
                budget_mid
            )
            
            # Get reliability score
            reliability_score = reliability_scores.get(shop_id, 0)
            
            # Combined score
            combined_score = (
                price_score * self.price_weight +
                reliability_score * self.reliability_weight
            )
            
            scored_bids.append({
                **bid,
                'price_score': price_score,
                'reliability_score': reliability_score,
                'combined_score': combined_score
            })
        
        # Sort by combined score descending
        scored_bids.sort(key=lambda x: x['combined_score'], reverse=True)
        
        return scored_bids

    def _calculate_price_score(self, price: int, budget_min: int, 
                               budget_max: int, budget_mid: float) -> float:
        """Calculate price score (0-100)"""
        if price <= 0:
            return 0
        
        # If price is within budget, score is higher for lower prices
        if price < budget_min:
            return 100
        elif price <= budget_mid:
            # Linear from 100 to 50
            return 100 - ((price - budget_min) / (budget_mid - budget_min) * 50)
        elif price <= budget_max:
            # Linear from 50 to 20
            return 50 - ((price - budget_mid) / (budget_max - budget_mid) * 30)
        else:
            # Penalize over-budget
            return max(0, 20 - ((price - budget_max) / budget_max * 20))

    def get_recommendation(self, scored_bids: List[Dict[str, Any]], 
                           top_n: int = 3) -> List[Dict[str, Any]]:
        """Get top N recommended bids"""
        return scored_bids[:top_n]