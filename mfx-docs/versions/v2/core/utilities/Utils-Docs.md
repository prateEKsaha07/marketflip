# Utils Documentation

## Overview

The Utils module provides helper functions and utilities used across the platform. It includes verification code generation, Cloudinary integration for image uploads, and various maintenance scripts for database cleanup and seeding.

---

## Table of Contents

- [Verification Utilities](#verification-utilities)
- [Cloudinary Utilities](#cloudinary-utilities)
- [Maintenance Scripts](#maintenance-scripts)
- [Seed Data Script](#seed-data-script)
- [Debug Utilities](#debug-utilities)

---

## Verification Utilities

### `generate_verification_code()`

Generates a 4-digit numeric verification code used for OTP verification in transactions.

**Function:**
```python
def generate_verification_code() -> str:
    """Generate a 4-digit numeric verification code"""
    return ''.join(random.choices(string.digits, k=4))
```

**Returns:**
- `str`: A 4-digit code (e.g., "1234")

**Usage:**
- Request delivery confirmation
- Auction delivery confirmation
- Pickup transaction verification

**File Location:** `utils/verification.py`

---

## Cloudinary Utilities

### Configuration

```python
cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True
)
```

**Environment Variables Required:**
| Variable | Description |
|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

**File Location:** `utils/cloudinary_config.py`

### Functions

#### `upload_image(file, folder="marketflip")`

Uploads a single image to Cloudinary.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | File | The file object from FastAPI |
| `folder` | str | Folder path (default: marketflip) |

**Returns:**
```json
{
  "url": "https://res.cloudinary.com/...",
  "public_id": "marketflip/requests/abc123",
  "width": 800,
  "height": 600,
  "format": "jpg",
  "bytes": 12345
}
```

**Transformations Applied:**
- `quality`: auto
- `fetch_format`: auto

#### `upload_multiple_images(files, folder="marketflip", max_images=5)`

Uploads multiple images to Cloudinary.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `files` | List[File] | List of file objects |
| `folder` | str | Folder path (default: marketflip) |
| `max_images` | int | Maximum images (default: 5) |

**Returns:**
- `List[Dict]`: List of upload results

#### `delete_image(public_id)`

Deletes an image from Cloudinary.

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `public_id` | str | The public_id of the image |

**Returns:**
- Cloudinary deletion result

---

## Maintenance Scripts

### Cleanup Script

**File:** `scripts/cleanup.py`

Interactive script for cleaning up database and Cloudinary resources.

**Features:**

| Category | Options |
|----------|---------|
| **Database** | Show counts, clean old request_events, clean expired requests, clean orphan bids, clean duplicate profiles, delete all data |
| **Cloudinary** | Show storage usage, find unused images, delete unused images, delete images older than N days |
| **General** | Run all cleanup (dry run), run all cleanup (actual) |

**Usage:**
```bash
python scripts/cleanup.py
```

**Configuration:**
```python
# Environment variables required
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

**Key Functions:**

| Function | Description |
|----------|-------------|
| `clean_request_events(days_to_keep)` | Deletes request events older than N days |
| `clean_old_requests(limit)` | Deletes expired requests older than 30 days |
| `clean_bids_without_requests()` | Deletes orphan bids |
| `clean_duplicate_profiles()` | Removes duplicate profiles |
| `delete_all_data()` | Deletes ALL data from all tables |
| `find_unused_cloudinary_images()` | Finds images not referenced in DB |
| `delete_cloudinary_images_older_than(days)` | Deletes images older than N days |

---

## Seed Data Script

**File:** `scripts/seed_data.py`

Generates realistic synthetic data for testing and ML prototyping.

### Configuration

```python
# Number of records to generate
NUM_BUYERS = 15
NUM_SHOPS = 12
NUM_REQUESTS = 50
MAX_BIDS_PER_REQUEST = 6
NUM_AUCTIONS = 30
NUM_AUCTION_BIDS = 80
NUM_EVENTS = 300
```

### Categories Data

| Category | Items | Budget Range |
|----------|-------|--------------|
| `electronics` | Smartphone, Laptop, Headphones, etc. | 2,000 - 150,000 |
| `furniture` | Sofa, Dining Table, Bed, etc. | 1,500 - 80,000 |
| `clothing` | Shirt, Jeans, Dress, etc. | 300 - 20,000 |
| `books` | Fiction Novel, Textbook, etc. | 100 - 5,000 |
| `home_kitchen` | Microwave, Refrigerator, etc. | 500 - 50,000 |

### Pincode Data

Uses Bhilai pincodes (490001 - 490050) for location-based testing.

### Key Functions

| Function | Description |
|----------|-------------|
| `create_users_with_auth()` | Creates buyers and shops with auth |
| `create_requests()` | Generates requests with data_source='seed' |
| `create_bids()` | Generates bids with data_source='seed' |
| `create_auctions()` | Generates auctions with data_source='seed' |
| `create_auction_bids()` | Generates auction bids with data_source='seed' |
| `create_request_events()` | Generates events with data_source='seed' |
| `process_lifecycle()` | Simulates request lifecycle |

### Data Source Tagging

All seeded data includes `"data_source": "seed"` field for identification.

**Usage:**
```bash
python scripts/seed_data.py
```

---

## Debug Utilities

### Bid Seeder

**File:** `scripts/debug_bids.py`

Creates test bids for existing requests.

**Usage:**
```bash
python scripts/debug_bids.py
```

**Functionality:**
- Fetches open requests
- Finds shop owners
- Creates random bids with realistic prices

---

## Environment Variables Reference

| Variable | Used By | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | All scripts | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | All scripts | Service role key |
| `CLOUDINARY_CLOUD_NAME` | Upload, Cleanup | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Upload, Cleanup | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Upload, Cleanup | Cloudinary API secret |

---

## File Structure

```
utils/
├── __init__.py
├── verification.py          # Code generation
├── cloudinary_config.py     # Cloudinary integration

scripts/
├── cleanup.py              # Database & Cloudinary cleanup
├── seed_data.py            # Synthetic data generation
├── debug_bids.py           # Test bid creation
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-15 | Initial documentation |

---

*This documentation is maintained by the Platform Engineering Team.*