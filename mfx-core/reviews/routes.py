from fastapi import APIRouter, Depends, HTTPException, status, Query
from uuid import UUID
from typing import List, Dict, Any

from auth.dependencies import get_current_user, supabase_admin
from .schemas import (
    ReviewCreate, 
    ReviewResponse, 
    ReviewCheckResponse,
    ReviewStatsResponse
)
from .service import ReviewService

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_data: ReviewCreate,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Create a new review for a completed transaction.
    
    Validations (enforced at DB level):
    - Transaction must be 'completed'
    - User must be a participant in the transaction
    - reviewed_id must be the counterparty
    - One review per (reviewer, target)
    """
    service = ReviewService(supabase_admin)
    
    # Check if user already reviewed this target
    existing = service.check_user_reviewed_target(
        current_user["id"],
        review_data.target_type,
        review_data.target_id
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this transaction"
        )
    
    try:
        review = service.create_review(
            reviewer_id=current_user["id"],
            reviewed_id=review_data.reviewed_id,
            target_type=review_data.target_type,
            target_id=review_data.target_id,
            rating=review_data.rating,
            comment=review_data.comment
        )
        
        return review
        
    except Exception as e:
        error_msg = str(e)
        if "Cannot review an incomplete transaction" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transaction must be completed before reviewing"
            )
        elif "User is not a participant" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a participant in this transaction"
            )
        elif "You can only review the other participant" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You can only review the other participant in this transaction"
            )
        elif "Cannot review yourself" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot review yourself"
            )
        elif "duplicate key value violates unique constraint" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reviewed this transaction"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create review: {error_msg}"
            )

@router.get("/profile/{profile_id}", response_model=List[ReviewResponse])
async def get_reviews_for_profile(
    profile_id: UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get all reviews received by a profile"""
    service = ReviewService(supabase_admin)
    reviews = service.get_reviews_for_profile(profile_id, limit, offset)
    return reviews

@router.get("/my-reviews", response_model=List[ReviewResponse])
async def get_my_reviews(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get all reviews given by the current user"""
    service = ReviewService(supabase_admin)
    reviews = service.get_reviews_given_by_user(current_user["id"], limit, offset)
    return reviews

@router.get("/target/{target_type}/{target_id}", response_model=List[ReviewResponse])
async def get_reviews_for_target(
    target_type: str,
    target_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get all reviews for a specific transaction target"""
    if target_type not in ["request", "auction"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="target_type must be 'request' or 'auction'"
        )
    
    service = ReviewService(supabase_admin)
    reviews = service.get_reviews_for_target(target_type, target_id)
    return reviews

@router.get("/check/{target_type}/{target_id}", response_model=ReviewCheckResponse)
async def check_user_reviewed(
    target_type: str,
    target_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Check if the current user has already reviewed this target"""
    if target_type not in ["request", "auction"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="target_type must be 'request' or 'auction'"
        )
    
    service = ReviewService(supabase_admin)
    existing = service.check_user_reviewed_target(
        current_user["id"],
        target_type,
        target_id
    )
    
    return ReviewCheckResponse(
        has_reviewed=existing is not None,
        review_id=existing["id"] if existing else None
    )

@router.get("/stats/{profile_id}", response_model=ReviewStatsResponse)
async def get_review_stats(
    profile_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get review statistics for a profile"""
    service = ReviewService(supabase_admin)
    stats = service.get_review_stats(profile_id)
    return ReviewStatsResponse(**stats)

@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: UUID,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Delete a review (only the reviewer can delete their own)"""
    service = ReviewService(supabase_admin)
    deleted = service.delete_review(review_id, current_user["id"])
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found or you don't have permission to delete it"
        )
    
    return None