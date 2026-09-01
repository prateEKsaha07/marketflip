from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID

from auth.dependencies import get_current_user
from saved_searches.schemas import SavedSearchCreate, SavedSearchUpdate, SavedSearchResponse
from saved_searches.service import SavedSearchService
from auth.dependencies import supabase_anon, supabase_admin

router = APIRouter(prefix="/saved-searches", tags=["Saved Searches"])

saved_search_service = SavedSearchService(supabase_admin, supabase_anon)


@router.post("", response_model=SavedSearchResponse, status_code=201)
async def create_saved_search(
    data: SavedSearchCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        return saved_search_service.create_saved_search(
            user_id=current_user["id"],
            data=data.model_dump()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[SavedSearchResponse])
async def get_saved_searches(
    current_user: dict = Depends(get_current_user)
):
    try:
        return saved_search_service.get_saved_searches(current_user["id"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{search_id}", response_model=SavedSearchResponse)
async def update_saved_search(
    search_id: UUID,
    data: SavedSearchUpdate,
    current_user: dict = Depends(get_current_user)
):
    try:
        return saved_search_service.update_saved_search(
            search_id=str(search_id),
            user_id=current_user["id"],
            data=data.model_dump(exclude_unset=True)
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{search_id}", status_code=204)
async def delete_saved_search(
    search_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    try:
        success = saved_search_service.delete_saved_search(
            search_id=str(search_id),
            user_id=current_user["id"]
        )
        if not success:
            raise HTTPException(status_code=404, detail="Saved search not found")
        return None
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))