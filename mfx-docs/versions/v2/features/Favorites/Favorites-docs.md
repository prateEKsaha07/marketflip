# Favorites System Documentation

## Overview

The Favorites System enables users to save and manage their favorite requests and auctions. Users can add or remove items from their favorites list, check if an item is favorited, and retrieve all their favorites.

---

## Table of Contents

- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Service Layer](#service-layer)
- [Security & Permissions](#security--permissions)
- [Error Handling](#error-handling)

---

## API Endpoints

### 1. Toggle Favorite

**POST** `/favorites/toggle`

Adds or removes a favorite item. If the item is already favorited, it is removed; otherwise, it is added.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `target_type` | string | Type of item: 'request' or 'auction' |
| `target_id` | UUID | ID of the target item |

**Example Request:**
```json
{
  "target_type": "request",
  "target_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response (Added):**
```json
{
  "action": "added",
  "favorited": true,
  "favorite": {
    "id": "uuid",
    "user_id": "uuid",
    "target_type": "request",
    "target_id": "uuid",
    "created_at": "2026-09-15T10:30:00Z"
  }
}
```

**Response (Removed):**
```json
{
  "action": "removed",
  "favorited": false
}
```

**Permissions:** Authenticated users

**Error Codes:**
- `400`: Invalid target_type or server error
- `401`: Unauthorized

---

### 2. Get Favorites

**GET** `/favorites`

Retrieves all favorites for the current user.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `target_type` | string | Optional filter by target_type (request/auction) |

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "target_type": "request",
    "target_id": "uuid",
    "created_at": "2026-09-15T10:30:00Z"
  }
]
```

**Permissions:** Authenticated users

---

### 3. Check Favorite Status

**GET** `/favorites/check/{target_type}/{target_id}`

Checks if a specific item is favorited by the current user.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `target_type` | string | Type of item (request/auction) |
| `target_id` | UUID | ID of the target item |

**Response:**
```json
{
  "favorited": true
}
```

**Permissions:** Authenticated users

**Error Codes:**
- `400`: Invalid target_type or server error
- `401`: Unauthorized

---

## Data Models

### Request Models

**FavoriteCreate**
| Field | Type | Description |
|-------|------|-------------|
| `target_type` | string | Must be 'request' or 'auction' |
| `target_id` | UUID | ID of the target to favorite |

### Response Models

**FavoriteResponse**
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Favorite record ID |
| `user_id` | UUID | User who favorited |
| `target_type` | string | Type of favorited item |
| `target_id` | UUID | ID of the favorited item |
| `created_at` | datetime | When favorite was created |

---

## Service Layer

### FavoriteService

The service handles all favorite operations with Supabase integration.

**Initialization:**
- Requires `supabase_admin` and `supabase_anon` clients
- Uses admin client for database operations

**Core Methods:**

| Method | Description |
|--------|-------------|
| `toggle_favorite()` | Adds or removes a favorite |
| `get_favorites()` | Gets all favorites for a user |
| `is_favorited()` | Checks if an item is favorited |

#### toggle_favorite()

**Functionality:**
1. Checks if the item is already favorited by the user
2. If favorited: Deletes the favorite record
3. If not favorited: Creates a new favorite record

**Parameters:**
- `user_id`: ID of the user
- `target_type`: 'request' or 'auction'
- `target_id`: ID of the target item

**Returns:**
- Object with `action` ('added' or 'removed'), `favorited` status, and favorite data if added

#### get_favorites()

**Functionality:**
- Retrieves all favorites for a user
- Supports optional filtering by target_type
- Orders results by created_at descending

**Parameters:**
- `user_id`: ID of the user
- `target_type`: Optional filter

**Returns:**
- List of favorite objects

#### is_favorited()

**Functionality:**
- Checks if a specific item is favorited by a user

**Parameters:**
- `user_id`: ID of the user
- `target_type`: 'request' or 'auction'
- `target_id`: ID of the target item

**Returns:**
- Boolean indicating if favorited

---

## Security & Permissions

### Authentication Requirements

All endpoints require authentication via the `get_current_user` dependency, which validates the Bearer token and returns the current user.

### Role-Based Access Control

| Action | Buyer | Shop Owner |
|--------|-------|------------|
| Add Favorite | Yes | Yes |
| Remove Favorite | Yes | Yes |
| Get Favorites | Yes | Yes |
| Check Favorite | Yes | Yes |

### RLS Policies

The database implements Row Level Security to ensure users can only manage their own favorites:

- Users can view their own favorites
- Users can insert favorites with their own user_id
- Users can delete their own favorites
- Users cannot update favorites (toggle handles add/remove)

---

## Error Handling

### Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | `INVALID_TARGET_TYPE` | target_type must be 'request' or 'auction' |
| 400 | `INVALID_TARGET_ID` | target_id must be a valid UUID |
| 401 | `UNAUTHORIZED` | User not authenticated |
| 400 | `SERVER_ERROR` | Database or server error |

### Error Response Format

All errors follow the standard FastAPI error format:
```json
{
  "detail": "Error message description"
}
```

---

## Database Schema

### Favorites Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References profiles.id |
| `target_type` | TEXT | 'request' or 'auction' |
| `target_id` | UUID | ID of the target item |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Constraints:**
- Unique constraint on (user_id, target_type, target_id) prevents duplicates

---

## Integration Examples

### Checking Favorite Status in Listings

When displaying lists of requests or auctions, you can check favorite status for each item:

1. Retrieve the list of items
2. Get all favorites for the user filtered by target_type
3. Map favorite IDs to a set
4. Add `is_favorited` flag to each item

### Toggle Favorite from UI

Frontend integration pattern:

1. User clicks favorite icon
2. Call POST `/favorites/toggle` with target_type and target_id
3. Update UI based on response:
   - If `action` is 'added': Display filled favorite icon
   - If `action` is 'removed': Display empty favorite icon

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-15 | Initial documentation |

---

*This documentation is maintained by the Owner.*