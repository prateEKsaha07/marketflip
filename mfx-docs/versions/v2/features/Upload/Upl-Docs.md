# Upload System Documentation

## Overview

The Upload System provides secure image upload functionality using Cloudinary as the storage backend. It supports single and multiple image uploads with validation for file size, type, and quantity limits.

---

## Table of Contents

- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Security & Permissions](#security--permissions)
- [Error Handling](#error-handling)

---

## API Endpoints

### 1. Upload Single Image

**POST** `/upload/single`

Uploads a single image to Cloudinary.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (UploadFile)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "public_id": "marketflip/requests/abc123"
  }
}
```

**Permissions:** Authenticated users

---

### 2. Upload Multiple Images

**POST** `/upload/multiple`

Uploads multiple images to Cloudinary (max 5).

**Request:**
- Content-Type: `multipart/form-data`
- Field: `files` (List[UploadFile])

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "url": "https://res.cloudinary.com/...",
      "public_id": "marketflip/requests/abc123"
    },
    {
      "url": "https://res.cloudinary.com/...",
      "public_id": "marketflip/requests/def456"
    }
  ],
  "count": 2
}
```

**Permissions:** Authenticated users

---

## Configuration

### File Limits

| Setting | Value |
|---------|-------|
| Max File Size | 5 MB |
| Max Files per Upload | 5 |
| Allowed Types | image/jpeg, image/png, image/webp |

### Validation Rules

**File Size Validation:**
- Files exceeding 5MB are rejected
- Error message includes current file size

**File Type Validation:**
- Only JPEG, PNG, and WebP images are allowed
- Error message indicates allowed types

### Cloudinary Storage

| Setting | Value |
|---------|-------|
| Folder Path | `marketflip/requests` |
| Storage Service | Cloudinary |

---

## Security & Permissions

### Authentication

All endpoints require authentication via the `get_current_user` dependency.

### Role-Based Access Control

| Action | Authenticated Users | Unauthenticated Users |
|--------|---------------------|----------------------|
| Upload Single | Yes | No |
| Upload Multiple | Yes | No |

### Validation Enforcement

```python
def validate_file(file: UploadFile) -> bool:
    """Validate file size and type"""
    # Size check (5MB limit)
    if size > MAX_FILE_SIZE:
        raise HTTPException(400, "File size exceeds 5MB limit")
    
    # Type check
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "File type not allowed")
    
    return True
```

---

## Error Handling

### Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | File validation failed |
| 401 | Unauthorized |
| 500 | Upload failed |

### Error Messages

| Error | Cause |
|-------|-------|
| "File size exceeds 5MB limit" | File too large |
| "File type not allowed" | Invalid file format |
| "Maximum 5 images allowed per upload" | Too many files |
| "Upload failed: [error]" | Cloudinary error |

### Error Response Format

All errors follow the standard FastAPI error format:
```json
{
  "detail": "File size exceeds 5MB limit"
}
```

---

## Integration Notes

### Usage with Requests System

Uploaded images can be used in request creation:
- The `image_urls` field in requests stores Cloudinary URLs
- Upload endpoint returns URLs that can be saved

### Cloudinary Service

The upload system uses the `utils.cloudinary_config` module with:
- `upload_image()` - Single image upload
- `upload_multiple_images()` - Multiple image upload

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-15 | Initial documentation |

---

*This documentation is maintained by the Platform Engineering Team.*