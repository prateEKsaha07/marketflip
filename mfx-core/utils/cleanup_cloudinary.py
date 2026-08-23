#!/usr/bin/env python3
"""
Clean up unused images from Cloudinary
Deletes images that are not referenced in the database
"""

import os
import cloudinary
import cloudinary.uploader
import cloudinary.api
from dotenv import load_dotenv
from supabase import create_client
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cloudinary config
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True
)

# Supabase config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def get_all_image_urls_from_db():
    """Get all image URLs stored in the database"""
    urls = []
    
    # Get from requests
    requests_response = supabase.table("requests").select("image_urls").execute()
    for req in requests_response.data:
        if req.get("image_urls"):
            urls.extend(req["image_urls"])
    
    # Get from auctions (if table exists)
    try:
        auctions_response = supabase.table("auctions").select("image_urls").execute()
        for auction in auctions_response.data:
            if auction.get("image_urls"):
                urls.extend(auction["image_urls"])
    except Exception:
        pass
    
    return set(urls)  # Remove duplicates

def get_all_cloudinary_images(folder="marketflip"):
    """Get all image public_ids from Cloudinary"""
    images = []
    next_cursor = None
    
    try:
        while True:
            result = cloudinary.api.resources(
                type="upload",
                prefix=folder,
                max_results=500,
                next_cursor=next_cursor
            )
            
            for resource in result.get("resources", []):
                images.append({
                    "public_id": resource["public_id"],
                    "url": resource["secure_url"],
                    "created_at": resource["created_at"],
                    "bytes": resource["bytes"]
                })
            
            next_cursor = result.get("next_cursor")
            if not next_cursor:
                break
                
    except Exception as e:
        logger.error(f"Error fetching Cloudinary images: {e}")
    
    return images

def find_unused_images():
    """Find images in Cloudinary that are not in the database"""
    db_urls = get_all_image_urls_from_db()
    cloudinary_images = get_all_cloudinary_images()
    
    unused = []
    for img in cloudinary_images:
        if img["url"] not in db_urls:
            unused.append(img)
    
    return unused

def delete_image(public_id):
    """Delete a single image from Cloudinary"""
    try:
        result = cloudinary.uploader.destroy(public_id)
        if result.get("result") == "ok":
            logger.info(f"Deleted: {public_id}")
            return True
        else:
            logger.warning(f"Failed to delete: {public_id} - {result}")
            return False
    except Exception as e:
        logger.error(f"Error deleting {public_id}: {e}")
        return False

def delete_unused_images(dry_run=True):
    """Delete all unused images from Cloudinary"""
    logger.info("Finding unused images...")
    unused = find_unused_images()
    
    if not unused:
        logger.info("No unused images found.")
        return
    
    total_bytes = sum(img["bytes"] for img in unused)
    total_mb = total_bytes / (1024 * 1024)
    
    logger.info(f"Found {len(unused)} unused images ({total_mb:.2f} MB)")
    
    if dry_run:
        logger.info("DRY RUN - No images will be deleted")
        for img in unused[:10]:  # Show first 10
            logger.info(f"  - {img['public_id']} ({img['bytes'] / 1024:.1f} KB)")
        return
    
    # Delete images
    deleted_count = 0
    for img in unused:
        if delete_image(img["public_id"]):
            deleted_count += 1
    
    logger.info(f"Deleted {deleted_count} of {len(unused)} images")

def delete_images_older_than(days=30, dry_run=True):
    """Delete images older than specified days"""
    from datetime import datetime, timedelta
    
    cutoff_date = datetime.now() - timedelta(days=days)
    cloudinary_images = get_all_cloudinary_images()
    
    old_images = []
    for img in cloudinary_images:
        created_at = datetime.fromisoformat(img["created_at"].replace("Z", "+00:00"))
        if created_at < cutoff_date:
            old_images.append(img)
    
    if not old_images:
        logger.info(f"No images older than {days} days found.")
        return
    
    total_mb = sum(img["bytes"] for img in old_images) / (1024 * 1024)
    logger.info(f"Found {len(old_images)} images older than {days} days ({total_mb:.2f} MB)")
    
    if dry_run:
        logger.info("DRY RUN - No images will be deleted")
        return
    
    for img in old_images:
        delete_image(img["public_id"])

def main():
    """Main cleanup function"""
    logger.info("=" * 60)
    logger.info("Cloudinary Cleanup Script")
    logger.info("=" * 60)
    
    print("\nOptions:")
    print("1. Show unused images (dry run)")
    print("2. Delete unused images")
    print("3. Show images older than 30 days (dry run)")
    print("4. Delete images older than 30 days")
    print("5. Delete specific image by public_id")
    print("6. Exit")
    
    choice = input("\nSelect option (1-6): ").strip()
    
    if choice == "1":
        unused = find_unused_images()
        if not unused:
            print("No unused images found.")
        else:
            total_mb = sum(img["bytes"] for img in unused) / (1024 * 1024)
            print(f"\nFound {len(unused)} unused images ({total_mb:.2f} MB):")
            for img in unused[:20]:
                print(f"  - {img['public_id']} ({img['bytes'] / 1024:.1f} KB)")
            if len(unused) > 20:
                print(f"  ... and {len(unused) - 20} more")
    
    elif choice == "2":
        confirm = input("Are you sure you want to delete ALL unused images? (yes/no): ")
        if confirm.lower() == "yes":
            delete_unused_images(dry_run=False)
        else:
            print("Cancelled.")
    
    elif choice == "3":
        delete_images_older_than(days=30, dry_run=True)
    
    elif choice == "4":
        confirm = input("Are you sure you want to delete images older than 30 days? (yes/no): ")
        if confirm.lower() == "yes":
            delete_images_older_than(days=30, dry_run=False)
        else:
            print("Cancelled.")
    
    elif choice == "5":
        public_id = input("Enter public_id to delete: ").strip()
        confirm = input(f"Delete {public_id}? (yes/no): ")
        if confirm.lower() == "yes":
            delete_image(public_id)
    
    else:
        print("Exiting.")

if __name__ == "__main__":
    main()