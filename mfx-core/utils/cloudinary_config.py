"""
Cloudinary Configuration
"""

import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv
import os
import logging

load_dotenv()

logger = logging.getLogger(__name__)

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

if not CLOUDINARY_CLOUD_NAME or not CLOUDINARY_API_KEY or not CLOUDINARY_API_SECRET:
    logger.warning("Cloudinary credentials not set. Image upload will not work.")

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True
)

def upload_image(file, folder="marketflip"):
    """
    Upload an image to Cloudinary
    
    Args:
        file: The file object from FastAPI
        folder: The folder to upload to (default: marketflip)
    
    Returns:
        dict: The upload result with url, public_id, etc.
    """
    try:
        result = cloudinary.uploader.upload(
            file.file,
            folder=folder,
            resource_type="image",
            transformation=[
                {"quality": "auto"},
                {"fetch_format": "auto"}
            ]
        )
        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "width": result.get("width"),
            "height": result.get("height"),
            "format": result.get("format"),
            "bytes": result.get("bytes")
        }
    except Exception as e:
        logger.error(f"Cloudinary upload error: {str(e)}")
        raise

def upload_multiple_images(files, folder="marketflip", max_images=5):
    """
    Upload multiple images to Cloudinary
    
    Args:
        files: List of file objects
        folder: The folder to upload to
        max_images: Maximum number of images (default: 5)
    
    Returns:
        list: List of upload results
    """
    results = []
    for file in files[:max_images]:
        result = upload_image(file, folder)
        results.append(result)
    return results

def delete_image(public_id):
    """
    Delete an image from Cloudinary
    
    Args:
        public_id: The public_id of the image to delete
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result
    except Exception as e:
        logger.error(f"Cloudinary delete error: {str(e)}")
        raise