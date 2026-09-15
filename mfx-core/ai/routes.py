from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
import logging

from auth.dependencies import get_current_user
from ai.schema import ParseRequestIn, ParseRequestOut
from ai.service import parse_request

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai",tags=["ai"])

@router.post("/parse-request",response_model=ParseRequestOut)
async def parse_request_endpoint(
        payload : ParseRequestIn,
        current_user : dict = Depends(get_current_user)  
):
    """Create a new request through ai (buyer Only)"""
    if current_user.get("role") != "buyer":
        raise HTTPException(
            status_code=403,
            detail = "Only buyers can generate requests"
        )
    # dead CheCk - used to be here
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, 
                            detail="Request text is required")
    try:
        result = parse_request( 
            text=payload.text,
            buyer_id=current_user["id"])
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        logger.error(f"LLM call failed: {e}")
        raise HTTPException(
            status_code=503,
            detail="AI parsing is not available right now",
        )
    except Exception as e:
        logger.error(f"Request generation error: {str(e)}")
        raise HTTPException(status_code=503,
                            detail="ai pasing is not avail right now")


    