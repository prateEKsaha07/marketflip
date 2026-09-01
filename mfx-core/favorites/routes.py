from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from uuid import UUID

from auth.dependencies import get_current_user
from favorites.schemas import FavoriteCreate, FavoriteResponse
from favorites.service import FavoriteService
from auth.dependencies import supabase_anon, supabase_admin

router = APIRouter(prefix="/favorites", tags=["Favorites"])

favorite_service = FavoriteService(supabase_admin, supabase_anon)


@router.post("/toggle")
async def toggle_favorite(
    data: FavoriteCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        return favorite_service.toggle_favorite(
            user_id=current_user["id"],
            target_type=data.target_type,
            target_id=str(data.target_id)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[FavoriteResponse])
async def get_favorites(
    target_type: Optional[str] = Query(None, pattern="^(request|auction)$"),
    current_user: dict = Depends(get_current_user)
):
    try:
        return favorite_service.get_favorites(
            user_id=current_user["id"],
            target_type=target_type
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/check/{target_type}/{target_id}")
async def check_favorite(
    target_type: str,
    target_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    try:
        is_favorited = favorite_service.is_favorited(
            user_id=current_user["id"],
            target_type=target_type,
            target_id=str(target_id)
        )
        return {"favorited": is_favorited}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))