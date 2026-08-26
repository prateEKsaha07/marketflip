#!/usr/bin/env python3
"""
Supabase & Cloudinary Cleanup Script
Cleans up old/unused data from database and Cloudinary
"""

import os
import sys
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
import logging
import cloudinary
import cloudinary.uploader
import cloudinary.api
import time

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============================================
# SUPABASE SETUP
# ============================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    logger.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    sys.exit(1)

SUPABASE_URL = SUPABASE_URL.rstrip('/')
if SUPABASE_URL.endswith('/rest/v1'):
    SUPABASE_URL = SUPABASE_URL[:-8]
elif '/rest/v1' in SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.split('/rest/v1')[0]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
logger.info(f"Connected to Supabase: {SUPABASE_URL}")

# ============================================
# CLOUDINARY SETUP
# ============================================

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True
)

# ============================================
# DATABASE CLEANUP FUNCTIONS
# ============================================

def get_table_count(table: str) -> int:
    """Get count of rows in a table"""
    try:
        result = supabase.table(table).select("id", count="exact").execute()
        return result.count if result.count is not None else len(result.data)
    except Exception as e:
        logger.error(f"Error counting {table}: {e}")
        return 0

def clean_request_events(days_to_keep: int = 30) -> int:
    """Delete old request events"""
    cutoff_date = (datetime.now() - timedelta(days=days_to_keep)).isoformat()
    
    try:
        result = supabase.table("request_events") \
            .delete() \
            .lt("created_at", cutoff_date) \
            .execute()
        
        deleted_count = len(result.data) if result.data else 0
        logger.info(f"Deleted {deleted_count} request events older than {days_to_keep} days")
        return deleted_count
    except Exception as e:
        logger.error(f"Error cleaning request_events: {e}")
        return 0

def clean_old_requests(limit: int = 1000) -> int:
    """Delete requests that are expired and older than 30 days"""
    cutoff_date = (datetime.now() - timedelta(days=30)).isoformat()
    
    try:
        # First, clear references
        supabase.table("requests").update({"selected_bid_id": None}).is_("status", "expired").execute()
        
        # Then delete
        result = supabase.table("requests") \
            .delete() \
            .eq("status", "expired") \
            .lt("expires_at", cutoff_date) \
            .limit(limit) \
            .execute()
        
        deleted_count = len(result.data) if result.data else 0
        logger.info(f"Deleted {deleted_count} expired requests older than 30 days")
        return deleted_count
    except Exception as e:
        logger.error(f"Error cleaning old requests: {e}")
        return 0

def clean_duplicate_profiles() -> List[Dict]:
    """Find and remove duplicate profiles (same email)"""
    try:
        # Get all profiles with emails
        result = supabase.table("profiles").select("id, email, full_name").execute()
        profiles = result.data if result.data else []
        
        email_map = {}
        duplicates = []
        
        for profile in profiles:
            email = profile.get("email")
            if not email:
                continue
            
            if email in email_map:
                duplicates.append(profile)
            else:
                email_map[email] = profile
        
        if duplicates:
            for dup in duplicates:
                supabase.table("profiles").delete().eq("id", dup["id"]).execute()
                logger.info(f"Deleted duplicate profile: {dup['email']} ({dup['id']})")
        
        logger.info(f"Deleted {len(duplicates)} duplicate profiles")
        return duplicates
    except Exception as e:
        logger.error(f"Error cleaning duplicate profiles: {e}")
        return []

def clean_bids_without_requests() -> int:
    """Delete bids that reference non-existent requests"""
    try:
        # Get all request IDs
        request_result = supabase.table("requests").select("id").execute()
        request_ids = [r["id"] for r in request_result.data] if request_result.data else []
        
        # Get all bids
        bid_result = supabase.table("bids").select("id, request_id").execute()
        bids = bid_result.data if bid_result.data else []
        
        orphan_bids = [b for b in bids if b["request_id"] not in request_ids]
        
        for bid in orphan_bids:
            supabase.table("bids").delete().eq("id", bid["id"]).execute()
        
        logger.info(f"Deleted {len(orphan_bids)} orphan bids")
        return len(orphan_bids)
    except Exception as e:
        logger.error(f"Error cleaning orphan bids: {e}")
        return 0

def delete_all_data() -> Dict[str, int]:
    """Delete ALL data from all tables (except profiles if keep_users=True)"""
    result = {}
    
    try:
        # Order matters - child tables first
        tables_to_clear = [
            "messages",
            "conversations",
            "auction_bids",
            "auctions",
            "request_events",
            "bids",
            "requests",
            "saved_searches",
            "favorites",
            "notifications",
            "reviews",
            "reports",
            "shop_reliability_scores"
        ]
        
        for table in tables_to_clear:
            try:
                # Clear references first
                if table == "requests":
                    supabase.table("requests").update({"selected_bid_id": None}).execute()
                
                del_result = supabase.table(table).delete().execute()
                count = len(del_result.data) if del_result.data else 0
                result[table] = count
                logger.info(f"Cleared {table}: {count} rows")
            except Exception as e:
                logger.warning(f"Could not clear {table}: {e}")
                result[table] = 0
        
        return result
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        return result

# ============================================
# CLOUDINARY CLEANUP FUNCTIONS
# ============================================

def get_all_cloudinary_images(prefix: str = "marketflip", max_results: int = 500) -> List[Dict]:
    """Get all images from Cloudinary"""
    images = []
    next_cursor = None
    
    try:
        while True:
            result = cloudinary.api.resources(
                type="upload",
                prefix=prefix,
                max_results=min(max_results, 500),
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

def get_db_image_urls() -> List[str]:
    """Get all image URLs from database"""
    urls = []
    
    try:
        # Get from requests
        req_result = supabase.table("requests").select("image_urls").execute()
        for req in req_result.data or []:
            if req.get("image_urls"):
                urls.extend(req["image_urls"])
    except Exception as e:
        logger.warning(f"Error getting request images: {e}")
    
    try:
        # Get from auctions
        auction_result = supabase.table("auctions").select("image_urls").execute()
        for auction in auction_result.data or []:
            if auction.get("image_urls"):
                urls.extend(auction["image_urls"])
    except Exception as e:
        logger.warning(f"Error getting auction images: {e}")
    
    return list(set(urls))

def find_unused_cloudinary_images(dry_run: bool = True) -> List[Dict]:
    """Find Cloudinary images not referenced in database"""
    try:
        logger.info("Fetching Cloudinary images...")
        cloudinary_images = get_all_cloudinary_images()
        logger.info(f"Found {len(cloudinary_images)} images in Cloudinary")
        
        logger.info("Fetching database image URLs...")
        db_urls = get_db_image_urls()
        logger.info(f"Found {len(db_urls)} image URLs in database")
        
        unused = []
        for img in cloudinary_images:
            if img["url"] not in db_urls:
                unused.append(img)
        
        logger.info(f"Found {len(unused)} unused images in Cloudinary")
        
        if unused and not dry_run:
            logger.info("Deleting unused images...")
            deleted = 0
            for img in unused:
                try:
                    result = cloudinary.uploader.destroy(img["public_id"])
                    if result.get("result") == "ok":
                        deleted += 1
                        if deleted % 10 == 0:
                            logger.info(f"Deleted {deleted}/{len(unused)} images")
                except Exception as e:
                    logger.error(f"Error deleting {img['public_id']}: {e}")
            logger.info(f"Deleted {deleted} unused images")
        
        return unused
    except Exception as e:
        logger.error(f"Error finding unused images: {e}")
        return []

def delete_cloudinary_images_older_than(days: int = 30, dry_run: bool = True) -> List[Dict]:
    """Delete Cloudinary images older than specified days"""
    cutoff_date = datetime.now() - timedelta(days=days)
    
    try:
        images = get_all_cloudinary_images()
        old_images = []
        
        for img in images:
            created_at = datetime.fromisoformat(img["created_at"].replace("Z", "+00:00"))
            if created_at < cutoff_date:
                old_images.append(img)
        
        logger.info(f"Found {len(old_images)} images older than {days} days")
        
        if old_images and not dry_run:
            logger.info("Deleting old images...")
            deleted = 0
            for img in old_images:
                try:
                    result = cloudinary.uploader.destroy(img["public_id"])
                    if result.get("result") == "ok":
                        deleted += 1
                except Exception as e:
                    logger.error(f"Error deleting {img['public_id']}: {e}")
            logger.info(f"Deleted {deleted} old images")
        
        return old_images
    except Exception as e:
        logger.error(f"Error deleting old images: {e}")
        return []

def get_cloudinary_storage_usage() -> Dict[str, Any]:
    """Get Cloudinary storage usage stats"""
    try:
        result = cloudinary.api.usage()
        return {
            "storage_used_bytes": result.get("storage_usage", 0),
            "storage_used_mb": result.get("storage_usage", 0) / (1024 * 1024),
            "storage_limit_bytes": result.get("storage_limit", 0),
            "storage_limit_mb": result.get("storage_limit", 0) / (1024 * 1024),
            "images_count": result.get("images_count", 0)
        }
    except Exception as e:
        logger.error(f"Error getting storage usage: {e}")
        return {}

# ============================================
# MAIN MENU
# ============================================

def main():
    """Main cleanup menu"""
    logger.info("=" * 60)
    logger.info("Supabase & Cloudinary Cleanup Script")
    logger.info("=" * 60)
    
    while True:
        print("\n" + "=" * 60)
        print("CLEANUP OPTIONS")
        print("=" * 60)
        print("")
        print("DATABASE CLEANUP:")
        print("  1. Show database counts")
        print("  2. Clean old request_events (> 30 days)")
        print("  3. Clean expired requests (> 30 days)")
        print("  4. Clean orphan bids (no request)")
        print("  5. Clean duplicate profiles")
        print("  6. DELETE ALL DATA (WARNING: IRREVERSIBLE)")
        print("")
        print("CLOUDINARY CLEANUP:")
        print("  7. Show Cloudinary storage usage")
        print("  8. Find unused images (dry run)")
        print("  9. Delete unused images")
        print("  10. Delete images older than 30 days (dry run)")
        print("  11. Delete images older than 30 days")
        print("")
        print("GENERAL:")
        print("  12. Run all cleanup (dry run)")
        print("  13. Run all cleanup (actual)")
        print("  14. Exit")
        print("")
        
        choice = input("Select option (1-14): ").strip()
        
        if choice == "1":
            print("\nDatabase Counts:")
            tables = ["profiles", "requests", "bids", "auctions", "auction_bids", "request_events", "categories"]
            for table in tables:
                count = get_table_count(table)
                print(f"  {table}: {count}")
        
        elif choice == "2":
            days = input("Days to keep (default: 30): ").strip()
            days = int(days) if days else 30
            clean_request_events(days)
        
        elif choice == "3":
            limit = input("Max requests to delete (default: 1000): ").strip()
            limit = int(limit) if limit else 1000
            clean_old_requests(limit)
        
        elif choice == "4":
            clean_bids_without_requests()
        
        elif choice == "5":
            clean_duplicate_profiles()
        
        elif choice == "6":
            confirm = input("WARNING: This will delete ALL data from ALL tables! Type 'YES DELETE ALL' to confirm: ")
            if confirm == "YES DELETE ALL":
                delete_all_data()
            else:
                print("Cancelled.")
        
        elif choice == "7":
            usage = get_cloudinary_storage_usage()
            print(f"\nCloudinary Storage Usage:")
            print(f"  Used: {usage.get('storage_used_mb', 0):.2f} MB")
            print(f"  Limit: {usage.get('storage_limit_mb', 0):.2f} MB")
            print(f"  Images: {usage.get('images_count', 0)}")
        
        elif choice == "8":
            find_unused_cloudinary_images(dry_run=True)
        
        elif choice == "9":
            confirm = input("Delete all unused Cloudinary images? (yes/no): ")
            if confirm.lower() == "yes":
                find_unused_cloudinary_images(dry_run=False)
            else:
                print("Cancelled.")
        
        elif choice == "10":
            days = input("Days threshold (default: 30): ").strip()
            days = int(days) if days else 30
            delete_cloudinary_images_older_than(days, dry_run=True)
        
        elif choice == "11":
            days = input("Days threshold (default: 30): ").strip()
            days = int(days) if days else 30
            confirm = input(f"Delete images older than {days} days? (yes/no): ")
            if confirm.lower() == "yes":
                delete_cloudinary_images_older_than(days, dry_run=False)
            else:
                print("Cancelled.")
        
        elif choice == "12":
            print("\nRUNNING ALL CLEANUP (DRY RUN)...")
            print("-" * 40)
            clean_request_events(30)
            clean_old_requests(1000)
            clean_bids_without_requests()
            clean_duplicate_profiles()
            find_unused_cloudinary_images(dry_run=True)
            print("-" * 40)
            print("Dry run complete. Use option 13 for actual cleanup.")
        
        elif choice == "13":
            confirm = input("WARNING: This will delete data! Type 'RUN CLEANUP' to confirm: ")
            if confirm == "RUN CLEANUP":
                print("\nRUNNING ALL CLEANUP...")
                print("-" * 40)
                clean_request_events(30)
                clean_old_requests(1000)
                clean_bids_without_requests()
                clean_duplicate_profiles()
                find_unused_cloudinary_images(dry_run=False)
                print("-" * 40)
                print("Cleanup complete!")
            else:
                print("Cancelled.")
        
        elif choice == "14":
            print("Exiting.")
            break
        
        else:
            print("Invalid option. Please try again.")

if __name__ == "__main__":
    main()