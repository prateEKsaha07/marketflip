from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from uuid import UUID
import logging

from auth.dependencies import get_current_user
from reports.schemas import ReportCreate, ReportResponse, ReportUpdate
from reports.service import ReportService
from auth.dependencies import supabase_anon, supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["Reports"])

report_service = ReportService(supabase_admin, supabase_anon)


@router.post("", response_model=ReportResponse, status_code=201)
async def create_report(
    report_data: ReportCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new report.
    Any authenticated user can report a listing, user, or message.
    """
    try:
        result = report_service.create_report(
            reporter_id=current_user["id"],
            report_data=report_data.model_dump()
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Create report error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create report: {str(e)}")


@router.get("", response_model=List[ReportResponse])
async def get_reports(
    status: Optional[str] = Query(None, pattern="^(pending|reviewed|dismissed|action_taken)$"),
    target_type: Optional[str] = Query(None, pattern="^(request|auction|user|message)$"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """
    Get reports (admin only).
    For now, only the user's own reports are accessible.
    Admin panel will be added later.
    """
    try:
        # For now, return user's own reports
        # TODO: Add admin role check for full access
        result = report_service.get_user_reports(current_user["id"])
        return result
    except Exception as e:
        logger.error(f"Get reports error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/my", response_model=List[ReportResponse])
async def get_my_reports(
    current_user: dict = Depends(get_current_user)
):
    """Get all reports created by the current user"""
    try:
        result = report_service.get_user_reports(current_user["id"])
        return result
    except Exception as e:
        logger.error(f"Get my reports error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: UUID,
    update_data: ReportUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update report status (admin only).
    TODO: Add admin role check.
    """
    try:
        # TODO: Add admin role verification
        result = report_service.update_report_status(
            report_id=str(report_id),
            status=update_data.status
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Update report error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update report: {str(e)}")