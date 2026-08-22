"""
Upload routes for Cloudinary image uploads
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
import logging

from auth.dependencies import get_current_user
from utils.cloudinary_config import upload_image, upload_multiple_images

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["Upload"])

MAX_FILE_SIZE = 5 * 1024 * 1024
ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

def validate_file(file: UploadFile) -> bool:
    """Validate file size and type"""
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    
    if size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds 5MB limit. Current size: {size / (1024 * 1024):.2f}MB"
        )
    
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: jpg, png, webp"
        )
    
    return True

@router.post("/single")
async def upload_single_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a single image to Cloudinary
    """
    try:
        validate_file(file)
        result = upload_image(file, folder="marketflip/requests")
        
        return {
            "success": True,
            "data": result
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/multiple")
async def upload_multiple_images_endpoint(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload multiple images to Cloudinary (max 5)
    """
    try:
        if len(files) > 5:
            raise HTTPException(
                status_code=400,
                detail="Maximum 5 images allowed per upload"
            )
        
        for file in files:
            validate_file(file)
        
        results = upload_multiple_images(files, folder="marketflip/requests")
        
        return {
            "success": True,
            "data": results,
            "count": len(results)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Multiple upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")