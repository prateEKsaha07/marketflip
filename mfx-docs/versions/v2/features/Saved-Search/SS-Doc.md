# Saved Searches System Documentation

## Overview

The Saved Searches System enables users to save and manage their search queries for future use. Users can create named searches with custom parameters, retrieve their saved searches, update existing ones, and delete searches they no longer need.

---

## Table of Contents

- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Service Layer](#service-layer)
- [Security & Permissions](#security--permissions)
- [Error Handling](#error-handling)

---

## API Endpoints

### 1. Create Saved Search

**POST** `/saved-searches`

Saves a search query for future use.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name for the saved search |
| `search_params` | object | Search parameters (JSON object) |

**Example Request:**
```json
{
  "name": "Vintage Cameras",
  "search_params": {
    "category": "electronics",
    "pincode": "560001",
    "budget_min": 1000,
    "budget_max": 5000,
    "status": "open"
  }
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Vintage Cameras",
  "search_params": {
    "category": "electronics",
    "pincode": "560001",
    "budget_min": 1000,
    "budget_max": 5000,
    "status": "open"
  },
  "created_at": "2026-09-15T10:30:00Z",
  "updated_at": "2026-09-15T10:30:00Z"
}
```

**Permissions:** Authenticated users

---

### 2. Get Saved Searches

**GET** `/saved-searches`

Retrieves all saved searches for the current user.

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Vintage Cameras",
    "search_params": {
      "category": "electronics",
      "pincode": "560001"
    },
    "created_at": "2026-09-15T10:30:00Z",
    "updated_at": "2026-09-15T10:30:00Z"
  }
]
```

**Permissions:** Authenticated users

---

### 3. Update Saved Search

**PATCH** `/saved-searches/{search_id}`

Updates an existing saved search.

**Path Parameters:**
- `search_id`: UUID of the saved search

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Updated display name |
| `search_params` | object | Updated search parameters |

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "Updated Search Name",
  "search_params": {
    "category": "electronics",
    "pincode": "560034"
  },
  "created_at": "2026-09-15T10:30:00Z",
  "updated_at": "2026-09-15T10:35:00Z"
}
```

**Permissions:** Owner only

**Error Codes:**
- 404: Saved search not found

---

### 4. Delete Saved Search

**DELETE** `/saved-searches/{search_id}`

Deletes a saved search.

**Path Parameters:**
- `search_id`: UUID of the saved search

**Permissions:** Owner only

**Response:** `204 No Content`

**Error Codes:**
- 404: Saved search not found

---

## Data Models

### Request Models

**SavedSearchCreate**
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name for the search |
| `search_params` | Dict[str, Any] | Search parameters as JSON |

**SavedSearchUpdate**
| Field | Type | Description |
|-------|------|-------------|
| `name` | Optional[str] | Updated name |
| `search_params` | Optional[Dict[str, Any]] | Updated parameters |

### Response Models

**SavedSearchResponse**
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Search ID |
| `user_id` | UUID | Owner ID |
| `name` | string | Search name |
| `search_params` | Dict[str, Any] | Search parameters |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |

---

## Service Layer

### SavedSearchService

**Initialization:**
- Requires `supabase_admin` and `supabase_anon` clients

**Core Methods:**

| Method | Description |
|--------|-------------|
| `create_saved_search()` | Creates a new saved search |
| `get_saved_searches()` | Gets all searches for a user |
| `update_saved_search()` | Updates an existing search |
| `delete_saved_search()` | Deletes a saved search |

### Method Details

**create_saved_search()**
- Inserts new record with user_id, name, and search_params
- Returns the created record

**get_saved_searches()**
- Queries saved_searches by user_id
- Orders by created_at descending
- Returns empty list if none found

**update_saved_search()**
- Updates only provided fields (name and/or search_params)
- Automatically updates updated_at timestamp
- Validates ownership via user_id check

**delete_saved_search()**
- Deletes by id and user_id (ensures ownership)
- Returns boolean indicating success

---

## Security & Permissions

### Role-Based Access Control

| Action | Authenticated Users |
|--------|---------------------|
| Create Saved Search | Yes |
| Get Saved Searches | Yes (own) |
| Update Saved Search | Yes (own) |
| Delete Saved Search | Yes (own) |

### Permission Enforcement

All endpoints validate that users can only access their own saved searches:

```python
# Create - user_id set from current_user
response = table.insert({
    "user_id": user_id,
    "name": data["name"],
    "search_params": data["search_params"]
}).execute()

# Update - query includes user_id check
response = table.update(update_data) \
    .eq("id", search_id) \
    .eq("user_id", user_id) \
    .execute()

# Delete - query includes user_id check
response = table.delete() \
    .eq("id", search_id) \
    .eq("user_id", user_id) \
    .execute()
```

### RLS Policies

Based on the database schema:
- Users can manage their own saved searches
- Users cannot access other users' saved searches

---

## Error Handling

### Error Codes

| Status Code | Description |
|-------------|-------------|
| 201 | Saved search created |
| 204 | Saved search deleted |
| 400 | Invalid request |
| 404 | Saved search not found |
| 500 | Server error |

### Error Messages

| Error | Cause |
|-------|-------|
| "Failed to create saved search" | Database insertion failed |
| "Saved search not found" | Invalid ID or not owner |

### Error Response Format

All errors follow the standard FastAPI error format:
```json
{
  "detail": "Saved search not found"
}
```

---

## Database Schema

### Saved Searches Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References profiles.id |
| `name` | TEXT | Display name |
| `search_params` | JSONB | Search parameters |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

## Integration Examples

### Using Saved Search for Quick Search

```javascript
// Frontend: Apply saved search
const savedSearch = {
  "name": "My Electronics Search",
  "search_params": {
    "category": "electronics",
    "pincode": "560001",
    "budget_min": 500,
    "budget_max": 5000
  }
}

// Apply saved search parameters
fetch(`/requests?${new URLSearchParams(savedSearch.search_params)}`)
```

### Search Parameters Structure

```json
{
  "category": "electronics",
  "pincode": "560001",
  "budget_min": 1000,
  "budget_max": 5000,
  "status": "open",
  "sort": "newest"
}
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-15 | Initial documentation |

---

*This documentation is maintained by the Owner.*