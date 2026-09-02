from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from uuid import UUID
import logging

from auth.dependencies import get_current_user
from reliability.service import ReliabilityService
from reliability.schemas import ShopReliabilityScoreResponse
from auth.dependencies import supabase_anon, supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reliability", tags=["Reliability"])

reliability_service = ReliabilityService(supabase_admin, supabase_anon)


@router.post("/refresh", response_model=List[ShopReliabilityScoreResponse])
async def refresh_reliability_scores(
    current_user: dict = Depends(get_current_user)
):
    """
    Refresh reliability scores for all shops.
    This is an internal endpoint that should be called periodically.
    For now, only service role/admins can call this.
    """
    # TODO: Add admin role check
    try:
        scores = reliability_service.refresh_all_reliability_scores()
        return scores
    except Exception as e:
        logger.error(f"Refresh reliability scores error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/shop/{shop_id}", response_model=Optional[ShopReliabilityScoreResponse])
async def get_shop_reliability(
    shop_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Get reliability score for a specific shop"""
    try:
        score = reliability_service.get_shop_reliability_score(str(shop_id))
        if not score:
            # Compute on the fly if not exists
            computed = reliability_service.compute_shop_reliability(str(shop_id))
            reliability_service.update_shop_reliability_scores([computed])
            score = reliability_service.get_shop_reliability_score(str(shop_id))
        return score
    except Exception as e:
        logger.error(f"Get shop reliability error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/shops", response_model=List[ShopReliabilityScoreResponse])
async def get_shops_reliability(
    shop_ids: str = Query(..., description="Comma-separated list of shop IDs"),
    current_user: dict = Depends(get_current_user)
):
    """Get reliability scores for multiple shops"""
    try:
        ids = [id.strip() for id in shop_ids.split(",") if id.strip()]
        scores = reliability_service.get_reliability_scores(ids)
        
        # Compute missing scores on the fly
        missing_ids = [id for id in ids if id not in [s["shop_id"] for s in scores]]
        if missing_ids:
            for shop_id in missing_ids:
                computed = reliability_service.compute_shop_reliability(shop_id)
                reliability_service.update_shop_reliability_scores([computed])
            scores = reliability_service.get_reliability_scores(ids)
        
        return scores
    except Exception as e:
        logger.error(f"Get shops reliability error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/top", response_model=List[ShopReliabilityScoreResponse])
async def get_top_reliable_shops(
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """Get top reliable shops"""
    try:
        response = supabase_admin.table("shop_reliability_scores") \
            .select("*") \
            .order("reliability_score", desc=True) \
            .limit(limit) \
            .execute()
        
        return response.data if response.data else []
    except Exception as e:
        logger.error(f"Get top reliable shops error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))