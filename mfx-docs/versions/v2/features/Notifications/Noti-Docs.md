# Notifications System Documentation

## Overview

The Notifications System manages user notifications across the platform. It supports retrieving notifications, marking them as read, getting unread counts, and deleting notifications. Notifications are created by system services for various events.

---

## Table of Contents

- [API Endpoints](#api-endpoints)
- [Security & Permissions](#security--permissions)
- [Error Handling](#error-handling)

---

## API Endpoints

### 1. Get Notifications

**GET** `/notifications`

Retrieves all notifications for the current user.

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Notifications per page (1-100) | 50 |
| `offset` | integer | Pagination offset | 0 |

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "type": "auction_won",
    "title": "You won the auction: Vintage Camera",
    "body": "Congratulations! You won the auction for Vintage Camera.",
    "link": "/buyer/auctions/123",
    "read": false,
    "created_at": "2026-09-15T10:30:00Z"
  }
]
```

**Permissions:** Authenticated users

---

### 2. Get Unread Count

**GET** `/notifications/unread-count`

Gets the total number of unread notifications for the current user.

**Response:**
```json
{
  "unread_count": 5
}
```

**Permissions:** Authenticated users

---

### 3. Mark as Read

**PATCH** `/notifications/{notification_id}/read`

Marks a specific notification as read.

**Path Parameters:**
- `notification_id`: UUID of the notification

**Response:**
```json
{
  "message": "Notification marked as read",
  "notification": {
    "id": "uuid",
    "user_id": "uuid",
    "type": "auction_won",
    "title": "You won the auction: Vintage Camera",
    "body": "Congratulations! You won the auction for Vintage Camera.",
    "link": "/buyer/auctions/123",
    "read": true,
    "created_at": "2026-09-15T10:30:00Z"
  }
}
```

**Permissions:** Authenticated users (notification must belong to user)

**Error Codes:**
- `404`: Notification not found

---

### 4. Mark All as Read

**PATCH** `/notifications/read-all`

Marks all notifications as read for the current user.

**Response:**
```json
{
  "message": "All notifications marked as read",
  "updated_count": 5
}
```

**Permissions:** Authenticated users

---

### 5. Create Notification

**POST** `/notifications`

Creates a notification for a user. This endpoint is for internal use.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | ID of the user to notify |
| `notification_type` | string | Type of notification |
| `title` | string | Notification title |
| `body` | string | Notification body content |
| `link` | string | Optional action link |

**Example Request:**
```json
{
  "user_id": "uuid",
  "notification_type": "auction_won",
  "title": "You won the auction: Vintage Camera",
  "body": "Congratulations! You won the auction.",
  "link": "/buyer/auctions/123"
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "type": "auction_won",
  "title": "You won the auction: Vintage Camera",
  "body": "Congratulations! You won the auction.",
  "link": "/buyer/auctions/123",
  "read": false,
  "created_at": "2026-09-15T10:30:00Z"
}
```

**Permissions:** Internal use only (service role)

---

### 6. Delete Notification

**DELETE** `/notifications/{notification_id}`

Deletes a notification.

**Path Parameters:**
- `notification_id`: UUID of the notification

**Response:** `204 No Content`

**Permissions:** Authenticated users (notification must belong to user)

**Error Codes:**
- `404`: Notification not found

---

## Security & Permissions

### Authentication Requirements

All endpoints require authentication via the `get_current_user` dependency.

### Role-Based Access Control

| Action | Buyer | Shop Owner | Service Role |
|--------|-------|------------|--------------|
| Get Notifications | Yes | Yes | Yes |
| Get Unread Count | Yes | Yes | Yes |
| Mark as Read | Yes (own) | Yes (own) | Yes |
| Mark All as Read | Yes (own) | Yes (own) | Yes |
| Create Notification | Limited | Limited | Yes |
| Delete Notification | Yes (own) | Yes (own) | Yes |

### RLS Policies

Based on the database schema, RLS policies enforce:

- Users can read their own notifications
- Users can update their own notifications
- Service role can create notifications

---

## Error Handling

### Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | `SERVER_ERROR` | Database or server error |
| 404 | `NOT_FOUND` | Notification not found |
| 401 | `UNAUTHORIZED` | User not authenticated |

### Error Response Format

All errors follow the standard FastAPI error format:
```json
{
  "detail": "Notification not found"
}
```

---

## Notification Types

Based on usage across the system, common notification types include:

| Type | Description |
|------|-------------|
| `auction_won` | Buyer won an auction |
| `auction_sold` | Shop sold an auction item |
| `delivery_method_set` | Buyer set delivery method |
| `delivery_confirmed` | Shop confirmed delivery |
| `delivery_denied` | Shop denied delivery |
| `switched_to_pickup` | Buyer switched to pickup |
| `transaction_completed` | Transaction completed |
| `override_completed` | Transaction completed via override |

---

## Database Schema

### Notifications Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | References profiles.id |
| `type` | TEXT | Notification type |
| `title` | TEXT | Notification title |
| `body` | TEXT | Notification body |
| `link` | TEXT | Optional action link |
| `read` | BOOLEAN | Read status |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-15 | Initial documentation |

---

*This documentation is maintained by the Owner.*