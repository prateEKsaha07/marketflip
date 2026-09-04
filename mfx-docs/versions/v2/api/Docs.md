# MarketFlip API Documentation

## Overview

MarketFlip API is a RESTful API backend for a marketplace platform connecting buyers with shop owners. The API supports request-based bidding, auctions, chat, reviews, notifications, and ML-powered features.

**Base URL:** `https://marketflip.onrender.com`  
**API Version:** 2.0.0  
**Documentation:** `/docs` (Swagger UI)

---

## Table of Contents

- [Authentication APIs](#authentication-apis)
- [Request APIs](#request-apis)
- [Bid APIs](#bid-apis)
- [Auction APIs](#auction-apis)
- [Chat APIs](#chat-apis)
- [Reviews APIs](#reviews-apis)
- [Notifications APIs](#notifications-apis)
- [Reports APIs](#reports-apis)
- [Favorites APIs](#favorites-apis)
- [Saved Searches APIs](#saved-searches-apis)
- [Reliability APIs](#reliability-apis)
- [ML APIs](#ml-apis)
- [Upload APIs](#upload-apis)
- [Health APIs](#health-apis)

---

## Authentication APIs

### 1. Signup

**POST** `/auth/signup`

Registers a new user and creates their profile.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Valid email address |
| `password` | string | User password |
| `role` | string | 'buyer' or 'shop_owner' |
| `address` | string | Physical address |
| `pincode` | string | 6-digit pincode |
| `phone` | string | Contact phone number |
| `shop_name` | string | Required for shop_owner |

**Response:**
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "buyer",
  "pincode": "560001"
}
```

---

### 2. Login

**POST** `/auth/login`

Authenticates a user and returns access token.

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | User email |
| `password` | string | User password |

**Response:**
```json
{
  "access_token": "jwt_token",
  "role": "buyer",
  "user_id": "uuid"
}
```

---

### 3. Get Profile

**GET** `/auth/profiles/{user_id}`

Retrieves a user's profile information.

**Headers:**
- `Authorization: Bearer {access_token}`

**Path Parameters:**
- `user_id`: UUID of the user

---

### 4. Update Profile

**PATCH** `/auth/profiles/{user_id}`

Updates a user's profile information.

**Headers:**
- `Authorization: Bearer {access_token}`

**Path Parameters:**
- `user_id`: UUID of the user (must match authenticated user)

**Request Body:** (Partial update)

| Field | Type | Description |
|-------|------|-------------|
| `full_name` | string | User's full name |
| `phone` | string | Contact phone |
| `address` | string | Physical address |
| `pincode` | string | 6-digit pincode |
| `bio` | string | User biography |
| `profile_photo_url` | string | Profile picture URL |
| `date_of_birth` | string | YYYY-MM-DD format |
| `gender` | string | male/female/other |
| `preferred_categories` | array | List of categories |
| `business_hours` | object | Shop operating hours |
| `years_in_business` | integer | Years of operation |
| `gst_number` | string | GST registration |
| `identity_number` | string | Government ID |
| `identity_type` | string | Type of ID |
| `delivery_address` | string | Default delivery address |
| `budget_range_preference` | object | Budget preferences |
| `notification_preferences` | object | Notification settings |

**Immutable Fields:** id, role, created_at, total_transactions, completed_transactions, is_verified

---

## Request APIs

### 5. Create Request

**POST** `/requests`

Creates a new purchase request.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Buyer only

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `item_name` | string | Item name (1-255 chars) |
| `description` | string | Optional description |
| `budget_min` | integer | Minimum budget (>0) |
| `budget_max` | integer | Maximum budget (>= budget_min) |
| `pincode` | string | 6-digit pincode |
| `category` | string | Category (default: electronics) |
| `reference_url` | string | Optional reference URL |
| `reference_image` | string | Optional reference image |
| `delivery_method` | string | home_delivery or pickup |
| `delivery_address` | string | Required for home_delivery |
| `image_urls` | array | Optional image URLs |

---

### 6. Get Requests

**GET** `/requests`

Retrieves requests with filters. Excludes flagged items.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | open/purchased/completed/deleted/expired/all |
| `pincode` | string | Filter by pincode |
| `category` | string | Filter by category |
| `sort` | string | newest/price_asc/price_desc/most_bids |
| `limit` | integer | Results per page |
| `offset` | integer | Pagination offset |

**Behavior:**
- Buyers see only their own requests
- Flagged requests excluded from feed

---

### 7. Get Request Detail

**GET** `/requests/{request_id}`

Retrieves detailed request information with bids (if user is buyer).

**Headers:**
- `Authorization: Bearer {access_token}`

---

### 8. Update Request

**PATCH** `/requests/{request_id}`

Updates an open request.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Buyer who owns the request

**Conditions:** Request must be in `open` status

---

### 9. Delete Request

**DELETE** `/requests/{request_id}`

Soft deletes a request (sets status to 'deleted').

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Buyer who owns the request

---

### 10. Set Delivery Method

**PATCH** `/requests/{request_id}/delivery`

Sets delivery method for a purchased request.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Buyer who owns the request

**Conditions:**
- Request must be in `purchased` status
- delivery_method must be 'home_delivery' or 'pickup'

**Pickup Behavior:**
- Auto-confirms delivery
- Generates verification code
- Sets verification_attempts to 0

---

### 11. Confirm Delivery (Shop)

**PATCH** `/requests/{request_id}/delivery/confirm`

Shop confirms home delivery for a request.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Shop owner whose bid was selected

**Conditions:**
- Request must be in `purchased` status
- Delivery method must be 'home_delivery'
- Generates 4-digit verification code

---

### 12. Deny Delivery (Shop)

**PATCH** `/requests/{request_id}/delivery/deny`

Shop denies home delivery for a request.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Shop owner whose bid was selected

**Conditions:**
- Request must be in `purchased` status
- Delivery method must be 'home_delivery'
- Clears verification code

---

### 13. Switch to Pickup

**PATCH** `/requests/{request_id}/switch-to-pickup`

Buyer switches from home_delivery to pickup.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Buyer who owns the request

**Conditions:**
- Request must be in `purchased` status
- Current delivery_method must be 'home_delivery'
- Auto-confirms delivery and generates OTP

---

### 14. Verify OTP (Shop)

**POST** `/requests/{request_id}/verify-otp`

Shop verifies transaction with OTP code.

**Headers:**
- `Authorization: Bearer {access_token}`

**Request Body:**
```json
{
  "code": "1234"
}
```

**Permissions:** Shop owner whose bid was selected

**Rules:**
- Code must be 4 digits
- Max 5 attempts
- On success: status becomes 'completed', chat locks

---

### 15. Override Complete (Buyer)

**PATCH** `/requests/{request_id}/override-complete`

Buyer manually marks transaction as completed after max attempts.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Buyer who owns the request

**Conditions:**
- Request must be in `purchased` status
- verification_attempts must be >= 5

---

### 16. Verify Transaction (Deprecated)

**PATCH** `/requests/{request_id}/verify`

[DEPRECATED] Legacy endpoint for transaction verification.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Buyer only

---

## Bid APIs

### 17. Create Bid

**POST** `/requests/{request_id}/bids`

Places a bid on an open request.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Shop owner only

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `price` | integer | Bid amount (>0) |
| `note` | string | Optional note |

**Validation:**
- Request must be open
- Shop cannot have pending bid on same request

---

### 18. Get Bids for Request

**GET** `/requests/{request_id}/bids`

Retrieves all bids for a specific request.

**Headers:**
- `Authorization: Bearer {access_token}`

**Behavior:**
- Buyers see all bids on their requests
- Shop owners see only their own bids

---

### 19. Get Shop Bids

**GET** `/bids/shop-bids`

Retrieves all bids placed by the current shop owner.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Shop owner only

---

### 20. Get Auction Bids

**GET** `/bids/auction-bids`

Retrieves all auction bids placed by the current buyer.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Buyer only

---

### 21. Get Bids

**GET** `/bids`

Retrieves bids based on user role.

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**
- `request_id`: Filter by request ID

**Behavior:**
- Shop owners see their own bids
- Buyers see bids on their requests

---

### 22. Get Bid by ID

**GET** `/bids/{bid_id}`

Retrieves a single bid by ID.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Shop owner who owns the bid

---

### 23. Update Bid

**PATCH** `/bids/{bid_id}`

Updates a pending bid.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Shop owner who owns the bid

**Conditions:** Bid must be in `pending` status

---

### 24. Delete Bid

**DELETE** `/bids/{bid_id}`

Withdraws a pending bid.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Shop owner who owns the bid

**Conditions:** Bid must be in `pending` status

---

### 25. Select Bid

**PATCH** `/bids/{bid_id}/select`

Selects a bid for purchase.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Buyer who owns the request

**Actions:**
- Updates bid status to 'selected'
- Rejects all other pending bids
- Updates request status to 'purchased'
- Generates OTP for pickup requests
- Unlocks chat

---

### 26. Get Buyer Details

**GET** `/bids/{bid_id}/buyer`

Retrieves buyer details for a selected bid.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Shop owner who owns the bid

**Conditions:** Bid must be in `selected` status

---

### 27. Get Bid Stats

**GET** `/bids/stats`

Retrieves bid statistics for the shop owner.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Shop owner only

**Response:**
```json
{
  "pending": 5,
  "selected": 3,
  "rejected": 2,
  "completed": 1,
  "total": 11
}
```

---

## Auction APIs

### 28. Create Auction

**POST** `/auctions`

Creates a new auction listing.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Shop owner only

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `item_name` | string | Item name (1-255 chars) |
| `description` | string | Optional description |
| `starting_price` | integer | Starting bid price (>0) |
| `pincode` | string | 6-digit pincode |
| `category` | string | Category (default: electronics) |
| `end_time` | datetime | Auction end time |
| `image_urls` | array | Optional image URLs |

---

### 29. Get Auctions

**GET** `/auctions`

Retrieves auctions with filters. Excludes flagged items.

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `pincode` | string | Filter by pincode |
| `category` | string | Filter by category |
| `status` | string | active/sold/completed/expired/cancelled/all |
| `sort` | string | newest/price_asc/price_desc/most_bids/ending_soon |
| `limit` | integer | Results per page (1-500) |
| `offset` | integer | Pagination offset |

---

### 30. Get Auction Detail

**GET** `/auctions/{auction_id}`

Retrieves auction details with bids.

**Headers:**
- `Authorization: Bearer {access_token}`

---

### 31. Cancel Auction

**DELETE** `/auctions/{auction_id}`

Cancels an active auction.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Shop owner who owns the auction

**Conditions:** Auction must be in `active` status

---

### 32. Place Bid

**POST** `/auctions/{auction_id}/bids`

Places a bid on an active auction.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Buyer only

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `bid_amount` | integer | Bid amount (>0) |

**Rules:**
- Bid must exceed current highest bid
- Auction must be active
- Sniping protection: extends by 5 minutes if bid within last 5 minutes

---

### 33. Close Auction with Winner (Internal)

**POST** `/auctions/{auction_id}/close-with-winner`

Internal endpoint called by Edge Function.

**Permissions:** Service role only

**Request Body:**
```json
{
  "winner_buyer_id": "uuid"
}
```

**Actions:**
- Updates auction status to 'sold'
- Unlocks chat
- Sends notifications

---

### 34. Set Delivery Method (Auction)

**PATCH** `/auctions/{auction_id}/delivery`

Buyer sets delivery method after winning auction.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Winning buyer

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `delivery_method` | string | home_delivery or pickup |
| `delivery_address` | string | Required for home_delivery |

**Pickup Behavior:**
- Generates OTP immediately
- Auto-confirms delivery

---

### 35. Confirm Delivery (Auction)

**PATCH** `/auctions/{auction_id}/delivery/confirm`

Shop confirms delivery arrangement.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Shop owner who owns the auction

**Actions:**
- Sets delivery_confirmed_by_shop = true
- Generates OTP for home_delivery
- Notifies buyer

---

### 36. Deny Delivery (Auction)

**PATCH** `/auctions/{auction_id}/delivery/deny`

Shop denies delivery arrangement.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Shop owner who owns the auction

**Actions:**
- Sets delivery_confirmed_by_shop = false
- Clears OTP
- Notifies buyer

---

### 37. Switch to Pickup (Auction)

**PATCH** `/auctions/{auction_id}/switch-to-pickup`

Buyer switches to pickup after shop denies delivery.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Winning buyer

**Conditions:**
- Auction must be in 'sold' status
- Shop must not have confirmed delivery

---

### 38. Verify OTP (Auction)

**POST** `/auctions/{auction_id}/verify-otp`

Shop verifies OTP code.

**Headers:**
- `Authorization: Bearer {access_token}`

**Request Body:**
```json
{
  "verification_code": "123456"
}
```

**Permissions:** Shop owner who owns the auction

**Rules:**
- Max 5 attempts
- On success: status='completed', chat locks

---

### 39. Override Complete (Auction)

**PATCH** `/auctions/{auction_id}/override-complete`

Buyer overrides transaction completion after max OTP attempts.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Winning buyer

**Conditions:**
- verification_attempts must be >= 5

---

### 40. Relist Auction

**POST** `/auctions/{auction_id}/relist`

Shop relists a cancelled auction.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Shop owner who owns the auction

**Conditions:** Auction must be in 'cancelled' status

**Response:**
```json
{
  "original_auction_id": "uuid",
  "new_auction_id": "uuid",
  "status": "success",
  "message": "Auction relisted successfully"
}
```

---

## Chat APIs

### 41. Get Conversations

**GET** `/chat/conversations`

Retrieves all conversations for the current user.

**Headers:**
- `Authorization: Bearer {access_token}`

---

### 42. Get Messages

**GET** `/chat/conversations/{conversation_id}/messages`

Retrieves messages for a conversation.

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Messages per page (1-100) |
| `offset` | integer | Pagination offset |

**Permissions:** User must be part of conversation

---

### 43. Send Message

**POST** `/chat/conversations/{conversation_id}/messages`

Sends a message in a conversation.

**Headers:**
- `Authorization: Bearer {access_token}`

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `content` | string | Message content (1-2000 chars) |

**Permissions:** User must be part of conversation

**Conditions:** Conversation must be unlocked (active transaction exists)

**Rate Limit:** 1 message per 2 seconds

---

### 44. Mark Read

**PATCH** `/chat/conversations/{conversation_id}/read`

Marks all messages in a conversation as read.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** User must be part of conversation

---

### 45. Get Unread Count

**GET** `/chat/unread-count`

Gets total unread message count for the current user.

**Headers:**
- `Authorization: Bearer {access_token}`

---

## Reviews APIs

### 46. Create Review

**POST** `/reviews/`

Creates a new review for a completed transaction.

**Headers:**
- `Authorization: Bearer {access_token}`

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `reviewed_id` | UUID | The counterparty being reviewed |
| `target_type` | string | 'request' or 'auction' |
| `target_id` | UUID | ID of the transaction target |
| `rating` | integer | 1 to 5 |
| `comment` | string | Optional (max 1000 chars) |

**Validations (DB-Level):**
- Transaction must be 'completed'
- User must be participant
- reviewed_id must be counterparty
- One review per (reviewer, target)

---

### 47. Get Reviews for Profile

**GET** `/reviews/profile/{profile_id}`

Retrieves all reviews received by a profile.

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Results per page (1-100) |
| `offset` | integer | Pagination offset |

---

### 48. Get My Reviews

**GET** `/reviews/my-reviews`

Retrieves all reviews given by the current user.

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Results per page (1-100) |
| `offset` | integer | Pagination offset |

---

### 49. Get Reviews for Target

**GET** `/reviews/target/{target_type}/{target_id}`

Retrieves all reviews for a specific transaction target.

**Headers:**
- `Authorization: Bearer {access_token}`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `target_type` | string | 'request' or 'auction' |
| `target_id` | UUID | ID of the target |

---

### 50. Check User Reviewed

**GET** `/reviews/check/{target_type}/{target_id}`

Checks if the current user has already reviewed a target.

**Headers:**
- `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "has_reviewed": true,
  "review_id": "uuid"
}
```

---

### 51. Get Review Stats

**GET** `/reviews/stats/{profile_id}`

Retrieves review statistics for a profile.

**Headers:**
- `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "average_rating": 4.5,
  "total_reviews": 10,
  "rating_distribution": {
    "1": 0,
    "2": 1,
    "3": 2,
    "4": 3,
    "5": 4
  }
}
```

---

### 52. Delete Review

**DELETE** `/reviews/{review_id}`

Deletes a review. Only the reviewer can delete their own.

**Headers:**
- `Authorization: Bearer {access_token}`

---

## Notifications APIs

### 53. Get Notifications

**GET** `/notifications`

Retrieves all notifications for the current user.

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Results per page (1-100) |
| `offset` | integer | Pagination offset |

---

### 54. Get Unread Count

**GET** `/notifications/unread-count`

Gets unread notification count for the current user.

**Headers:**
- `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "unread_count": 5
}
```

---

### 55. Mark as Read

**PATCH** `/notifications/{notification_id}/read`

Marks a specific notification as read.

**Headers:**
- `Authorization: Bearer {access_token}`

**Path Parameters:**
- `notification_id`: UUID of the notification

---

### 56. Mark All as Read

**PATCH** `/notifications/read-all`

Marks all notifications as read for the current user.

**Headers:**
- `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "message": "All notifications marked as read",
  "updated_count": 5
}
```

---

### 57. Delete Notification

**DELETE** `/notifications/{notification_id}`

Deletes a notification.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** User must own the notification

---

## Reports APIs

### 58. Create Report

**POST** `/reports`

Creates a new report.

**Headers:**
- `Authorization: Bearer {access_token}`

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `target_type` | string | request/auction/user/message |
| `target_id` | UUID | ID of the target |
| `reason` | string | Report reason (1-255 chars) |
| `description` | string | Optional details (max 1000 chars) |

**Validation:**
- Cannot report same target multiple times while pending

---

### 59. Get My Reports

**GET** `/reports/my`

Retrieves all reports created by the current user.

**Headers:**
- `Authorization: Bearer {access_token}`

---

### 60. Get Reports

**GET** `/reports`

Retrieves all reports (admin only).

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | pending/reviewed/dismissed/action_taken |
| `target_type` | string | request/auction/user/message |
| `limit` | integer | Results per page (1-500) |
| `offset` | integer | Pagination offset |

---

### 61. Update Report

**PATCH** `/reports/{report_id}`

Updates report status (admin only).

**Headers:**
- `Authorization: Bearer {access_token}`

**Path Parameters:**
- `report_id`: UUID of the report

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | pending/reviewed/dismissed/action_taken |

---

## Favorites APIs

### 62. Toggle Favorite

**POST** `/favorites/toggle`

Adds or removes a favorite item.

**Headers:**
- `Authorization: Bearer {access_token}`

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `target_type` | string | 'request' or 'auction' |
| `target_id` | UUID | ID of the target |

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

---

### 63. Get Favorites

**GET** `/favorites`

Retrieves all favorites for the current user.

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `target_type` | string | Filter by target_type (request/auction) |

---

### 64. Check Favorite

**GET** `/favorites/check/{target_type}/{target_id}`

Checks if a specific item is favorited by the current user.

**Headers:**
- `Authorization: Bearer {access_token}`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `target_type` | string | 'request' or 'auction' |
| `target_id` | UUID | ID of the target |

**Response:**
```json
{
  "favorited": true
}
```

---

## Saved Searches APIs

### 65. Create Saved Search

**POST** `/saved-searches`

Saves a search query for future use.

**Headers:**
- `Authorization: Bearer {access_token}`

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name for the saved search |
| `search_params` | object | Search parameters (JSON) |

---

### 66. Get Saved Searches

**GET** `/saved-searches`

Retrieves all saved searches for the current user.

**Headers:**
- `Authorization: Bearer {access_token}`

---

### 67. Update Saved Search

**PATCH** `/saved-searches/{search_id}`

Updates an existing saved search.

**Headers:**
- `Authorization: Bearer {access_token}`

**Path Parameters:**
- `search_id`: UUID of the saved search

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Updated display name |
| `search_params` | object | Updated search parameters |

---

### 68. Delete Saved Search

**DELETE** `/saved-searches/{search_id}`

Deletes a saved search.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Owner only

---

## Reliability APIs

### 69. Get Shop Reliability

**GET** `/reliability/shop/{shop_id}`

Retrieves reliability score for a specific shop.

**Headers:**
- `Authorization: Bearer {access_token}`

**Path Parameters:**
- `shop_id`: UUID of the shop

**Response:**
```json
{
  "id": "uuid",
  "shop_id": "uuid",
  "avg_response_time_minutes": 120.5,
  "completion_rate": 0.85,
  "selection_rate": 0.75,
  "reliability_score": 82.5,
  "response_score": 90.0,
  "completion_score": 85.0,
  "selection_score": 75.0,
  "total_requests_handled": 20,
  "total_bids_placed": 15,
  "total_selected": 12,
  "total_completed": 10,
  "calculated_at": "2026-09-15T10:30:00Z",
  "updated_at": "2026-09-15T10:30:00Z"
}
```

---

### 70. Get Shops Reliability

**GET** `/reliability/shops`

Retrieves reliability scores for multiple shops.

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `shop_ids` | string | Comma-separated list of shop IDs |

---

### 71. Get Top Reliable Shops

**GET** `/reliability/top`

Retrieves the top reliable shops.

**Headers:**
- `Authorization: Bearer {access_token}`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Number of shops (1-50) |

---

### 72. Refresh Reliability Scores

**POST** `/reliability/refresh`

Computes and updates reliability scores for all shops.

**Headers:**
- `Authorization: Bearer {access_token}`

**Permissions:** Service role / Admin

---

## ML APIs

### 73. Get Price Suggestion

**POST** `/ml/price-suggestion`

Gets price suggestions based on market data.

**Headers:**
- `Authorization: Bearer {access_token}`

---

### 74. Rank Bids

**POST** `/ml/rank-bids`

Ranks bids for a request based on ML analysis.

**Headers:**
- `Authorization: Bearer {access_token}`

---

### 75. Get Recommendations

**GET** `/ml/recommendations`

Gets personalized recommendations for the user.

**Headers:**
- `Authorization: Bearer {access_token}`

---

### 76. Get Demand Forecast

**GET** `/ml/demand-forecast`

Gets demand forecast for items/categories.

**Headers:**
- `Authorization: Bearer {access_token}`

---

### 77. Detect Fraud

**POST** `/ml/detect-fraud`

Detects potential fraud in transactions.

**Headers:**
- `Authorization: Bearer {access_token}`

---

## Upload APIs

### 78. Upload Single Image

**POST** `/upload/single`

Uploads a single image to Cloudinary.

**Headers:**
- `Authorization: Bearer {access_token}`

**Request:** multipart/form-data

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Image file |

**Validation:**
- Max file size: 5 MB
- Allowed types: JPEG, PNG, WebP

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

---

### 79. Upload Multiple Images

**POST** `/upload/multiple`

Uploads multiple images to Cloudinary (max 5).

**Headers:**
- `Authorization: Bearer {access_token}`

**Request:** multipart/form-data

| Field | Type | Description |
|-------|------|-------------|
| `files` | List[File] | List of image files |

**Response:**
```json
{
  "success": true,
  "data": [
    {"url": "...", "public_id": "..."},
    {"url": "...", "public_id": "..."}
  ],
  "count": 2
}
```

---

## Health APIs

### 80. Root

**GET** `/`

Returns API status information.

**Response:**
```json
{
  "message": "MarketFlip API is running",
  "version": "2.0.0",
  "status": "healthy"
}
```

---

### 81. Health Check

**GET** `/health`

Used for monitoring and uptime checks.

**Response:**
```json
{
  "status": "healthy"
}
```

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {access_token}
```

The token is obtained from the `/auth/login` endpoint.

---

## Error Handling

All errors follow the standard FastAPI error format:

```json
{
  "detail": "Error message description"
}
```

### Common Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-09-15 | Full API documentation |

---

*This documentation is maintained by Owner.*