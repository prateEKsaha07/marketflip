# Reports System Documentation

## Overview

The Reports System enables users to report inappropriate content including requests, auctions, users, and messages. Reports are submitted by users and reviewed by administrators for moderation actions.

---

## Table of Contents

- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Service Layer](#service-layer)
- [Security & Permissions](#security--permissions)
- [Error Handling](#error-handling)

---

## API Endpoints

### 1. Create Report

**POST** `/reports`

Creates a new report for a target.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `target_type` | string | Type: request, auction, user, or message |
| `target_id` | UUID | ID of the target being reported |
| `reason` | string | Reason for reporting (1-255 characters) |
| `description` | string | Optional detailed description (max 1000 characters) |

**Example Request:**
```json
{
  "target_type": "request",
  "target_id": "123e4567-e89b-12d3-a456-426614174000",
  "reason": "Spam",
  "description": "This request appears to be fraudulent"
}
```

**Response:**
```json
{
  "id": "uuid",
  "reporter_id": "uuid",
  "target_type": "request",
  "target_id": "uuid",
  "reason": "Spam",
  "description": "This request appears to be fraudulent",
  "status": "pending",
  "created_at": "2026-09-15T10:30:00Z",
  "updated_at": "2026-09-15T10:30:00Z"
}
```

**Permissions:** Authenticated users

**Error Codes:**
- `400`: Invalid target_type, target not found, duplicate report
- `500`: Failed to create report

**Validation:**
- Users cannot report the same target multiple times while a report is pending
- Target must exist in the system

---

### 2. Get My Reports

**GET** `/reports/my`

Retrieves all reports created by the current user.

**Response:**
```json
[
  {
    "id": "uuid",
    "reporter_id": "uuid",
    "target_type": "request",
    "target_id": "uuid",
    "reason": "Spam",
    "description": "This request appears to be fraudulent",
    "status": "pending",
    "created_at": "2026-09-15T10:30:00Z",
    "updated_at": "2026-09-15T10:30:00Z"
  }
]
```

**Permissions:** Authenticated users

---

### 3. Get All Reports (Admin)

**GET** `/reports`

Retrieves reports with filters. Currently returns user's own reports.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | pending, reviewed, dismissed, action_taken |
| `target_type` | string | request, auction, user, message |
| `limit` | integer | Results per page (1-500), default 100 |
| `offset` | integer | Pagination offset, default 0 |

**Response:**
```json
[
  {
    "id": "uuid",
    "reporter_id": "uuid",
    "target_type": "request",
    "target_id": "uuid",
    "reason": "Spam",
    "description": "This request appears to be fraudulent",
    "status": "pending",
    "created_at": "2026-09-15T10:30:00Z",
    "updated_at": "2026-09-15T10:30:00Z"
  }
]
```

**Permissions:** Admin only (currently returns user's own reports)

---

### 4. Update Report Status (Admin)

**PATCH** `/reports/{report_id}`

Updates the status of a report.

**Path Parameters:**
- `report_id`: UUID of the report

**Request Body:**
```json
{
  "status": "reviewed"
}
```

**Status Options:**
- `pending`: Awaiting review
- `reviewed`: Reviewed but no action taken
- `dismissed`: Report dismissed
- `action_taken`: Action was taken

**Response:**
```json
{
  "id": "uuid",
  "reporter_id": "uuid",
  "target_type": "request",
  "target_id": "uuid",
  "reason": "Spam",
  "description": "This request appears to be fraudulent",
  "status": "reviewed",
  "created_at": "2026-09-15T10:30:00Z",
  "updated_at": "2026-09-15T10:35:00Z"
}
```

**Permissions:** Admin only

**Error Codes:**
- `404`: Report not found

---

## Data Models

### Request Models

**ReportCreate**
| Field | Type | Description |
|-------|------|-------------|
| `target_type` | string | request, auction, user, or message |
| `target_id` | UUID | ID of the target |
| `reason` | string | Report reason (1-255 chars) |
| `description` | string | Optional details (max 1000 chars) |

**ReportUpdate**
| Field | Type | Description |
|-------|------|-------------|
| `status` | string | pending, reviewed, dismissed, action_taken |

### Response Models

**ReportResponse**
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Report ID |
| `reporter_id` | UUID | User who created the report |
| `target_type` | string | Type of reported target |
| `target_id` | UUID | ID of the reported target |
| `reason` | string | Report reason |
| `description` | string | Optional details |
| `status` | string | Current report status |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |

---

## Service Layer

### ReportService

The service handles all report operations with Supabase integration.

**Initialization:**
- Requires `supabase_admin` and `supabase_anon` clients

**Core Methods:**

| Method | Description |
|--------|-------------|
| `create_report()` | Creates a new report with validation |
| `get_reports()` | Retrieves reports with filters (admin) |
| `get_user_reports()` | Retrieves reports created by a user |
| `update_report_status()` | Updates report status (admin) |
| `get_flagged_targets()` | Gets IDs of targets with pending reports |

#### create_report()

**Functionality:**
1. Validates target_type is valid
2. Checks if target exists in the system
3. Prevents duplicate pending reports from same user
4. Creates the report record

**Validation:**
- Target must exist in the corresponding table
- User cannot have a pending report on the same target

#### get_flagged_targets()

**Functionality:**
- Retrieves IDs of targets with pending reports
- Used to exclude flagged items from browse feeds
- Returns list of target IDs

---

## Security & Permissions

### Authentication Requirements

All endpoints require authentication via the `get_current_user` dependency.

### Role-Based Access Control

| Action | User | Admin |
|--------|------|-------|
| Create Report | Yes | Yes |
| Get My Reports | Yes | Yes |
| Get All Reports | No | Yes (planned) |
| Update Report Status | No | Yes (planned) |
| View Flagged Targets | - | System internal |

### RLS Policies

Based on the database schema:
- Users can create reports
- Users can view their own reports
- Service role can manage all reports

### Anti-Spam Protection

- Users cannot report the same target multiple times while a report is pending
- Duplicate reports are blocked

---

## Error Handling

### Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | `INVALID_TARGET_TYPE` | target_type must be request, auction, user, or message |
| 400 | `TARGET_NOT_FOUND` | The reported target does not exist |
| 400 | `DUPLICATE_REPORT` | User already reported this target |
| 404 | `REPORT_NOT_FOUND` | Report ID does not exist |
| 500 | `SERVER_ERROR` | Database or server error |

### Error Response Format

All errors follow the standard FastAPI error format:
```json
{
  "detail": "You have already reported this item"
}
```

---

## Integration Notes

### Flagged Content Filtering

The `get_flagged_targets()` method is used to exclude reported items from public feeds:

- Retrieves all pending reports for a target_type
- Returns list of target IDs
- Used in auction and request listings to hide flagged content

### Target Types and Tables

| Target Type | Table |
|-------------|-------|
| `request` | requests |
| `auction` | auctions |
| `user` | profiles |
| `message` | messages |

---

## Database Schema

### Reports Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `reporter_id` | UUID | References profiles.id |
| `target_type` | TEXT | request, auction, user, message |
| `target_id` | UUID | ID of the reported target |
| `reason` | TEXT | Report reason |
| `description` | TEXT | Optional details |
| `status` | TEXT | pending, reviewed, dismissed, action_taken |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-15 | Initial documentation |

---

*This documentation is maintained by the Owner.*