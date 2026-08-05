# Bids Module - Complete Documentation

---

## Overview

The Bids module enables shop owners to place bids on buyer requests and allows buyers to manage those bids. It handles the complete bidding lifecycle from creation to selection, including updates and withdrawals.

---

## Table of Contents

- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Schemas](#schemas-pydantic-models)
- [Service Layer](#service-layer)
- [RLS Policies](#rls-policies)
- [Error Handling](#error-handling)
- [Testing Guide](#testing-guide)
- [Postman Collection](#postman-collection)

---

## Architecture

### File Structure

```
bids/
├── __init__.py
├── schemas.py      # Pydantic models for request/response validation
├── service.py      # Business logic and database operations
└── routes.py       # API endpoints and routing
```

### Module Dependencies

```
┌─────────────┐
│   Routes    │
│  (routes.py)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Service   │
│ (service.py)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Supabase   │
│  Database   │
└─────────────┘
```

---

## Database Schema

### Bids Table

```sql
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  price INTEGER NOT NULL CHECK (price > 0),
  note TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'selected', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_bids_request_id ON bids(request_id);
CREATE INDEX idx_bids_shop_id ON bids(shop_id);
CREATE INDEX idx_bids_status ON bids(status);
```

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique bid identifier |
| `request_id` | UUID | NOT NULL, REFERENCES requests(id) | Associated request |
| `shop_id` | UUID | NOT NULL, REFERENCES profiles(id) | Shop owner who placed the bid |
| `price` | INTEGER | NOT NULL, CHECK (price > 0) | Quoted price in INR |
| `note` | TEXT | NULLABLE | Additional notes from shop owner |
| `status` | TEXT | DEFAULT 'pending' | Bid status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Submission timestamp |

### Status Values

| Status | Description |
|--------|-------------|
| `pending` | Bid is active and awaiting buyer decision |
| `selected` | Buyer has chosen this bid |
| `rejected` | Buyer has rejected this bid |

---

## API Endpoints

### 1. POST /requests/{request_id}/bids

**Description:** Place a bid on a request

**Authentication:** Required (Bearer Token)

**Authorization:** Role must be `shop_owner`

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `request_id` | UUID | ID of the request to bid on |

**Request Body:**
```json
{
  "price": 85000,
  "note": "Available in black, 1 year warranty, brand new"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `price` | integer | ✅ | Bid price (> 0) |
| `note` | string | ❌ | Additional notes for the buyer |

**Validation Rules:**
- Price must be greater than 0
- Request must exist and be `open`
- Shop cannot have another `pending` bid on the same request

**Response (201 Created):**
```json
{
  "id": "a28d61a0-3e32-43d3-9360-b76908af87ee",
  "request_id": "f78ade9f-66f8-4884-b00f-671d45b74b65",
  "shop_id": "cdedd5f6-2726-44a8-9337-66da346dd628",
  "price": 85000,
  "note": "Available in black, 1 year warranty, brand new",
  "status": "pending",
  "created_at": "2026-08-05T00:16:22.806214Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Request is not open for bidding |
| 400 | You already have a pending bid on this request |
| 403 | Only shop owners can place bids |
| 404 | Request not found |
| 422 | Validation error (invalid price) |

---

### 2. GET /requests/{request_id}/bids

**Description:** Get all bids for a specific request

**Authentication:** Required (Bearer Token)

**Authorization:** 
- **Buyer:** Can see all bids on their own requests
- **Shop Owner:** Can only see their own bids

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `request_id` | UUID | ID of the request |

**Response (200 OK):**
```json
[
  {
    "id": "a28d61a0-3e32-43d3-9360-b76908af87ee",
    "request_id": "f78ade9f-66f8-4884-b00f-671d45b74b65",
    "shop_id": "cdedd5f6-2726-44a8-9337-66da346dd628",
    "price": 85000,
    "note": "Available in black, 1 year warranty, brand new",
    "status": "pending",
    "created_at": "2026-08-05T00:16:22.806214Z",
    "profiles": {
      "shop_name": "Tech Store",
      "phone": "9876543211",
      "address": "456 Market Road, New Delhi"
    }
  }
]
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 401 | Unauthorized (missing/invalid token) |
| 404 | Request not found |

---

### 3. GET /bids

**Description:** Get all bids for the current user

**Authentication:** Required (Bearer Token)

**Authorization:**
- **Shop Owner:** Returns all bids placed by the shop
- **Buyer:** Returns all bids on requests owned by the buyer

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `request_id` | string | Filter by request ID (optional) |

**Response (200 OK) - Shop Owner:**
```json
[
  {
    "id": "a28d61a0-3e32-43d3-9360-b76908af87ee",
    "request_id": "f78ade9f-66f8-4884-b00f-671d45b74b65",
    "shop_id": "cdedd5f6-2726-44a8-9337-66da346dd628",
    "price": 85000,
    "status": "pending",
    "requests": {
      "id": "f78ade9f-66f8-4884-b00f-671d45b74b65",
      "item_name": "Sony WH-1000XM5",
      "buyer_id": "buyer-uuid-here"
    }
  }
]
```

**Response (200 OK) - Buyer:**
```json
[
  {
    "id": "a28d61a0-3e32-43d3-9360-b76908af87ee",
    "request_id": "f78ade9f-66f8-4884-b00f-671d45b74b65",
    "shop_id": "cdedd5f6-2726-44a8-9337-66da346dd628",
    "price": 85000,
    "status": "pending",
    "profiles": {
      "shop_name": "Tech Store",
      "phone": "9876543211",
      "address": "456 Market Road, New Delhi"
    }
  }
]
```

---

### 4. PATCH /bids/{bid_id}

**Description:** Update a pending bid

**Authentication:** Required (Bearer Token)

**Authorization:** Shop owner who created the bid

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `bid_id` | UUID | ID of the bid to update |

**Request Body:**
```json
{
  "price": 82000,
  "note": "Updated: Available with 2 year warranty"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `price` | integer | ❌ | Updated bid price (> 0) |
| `note` | string | ❌ | Updated notes |

**Validation Rules:**
- At least one field must be provided
- Bid must exist and be `pending`
- Shop must own the bid

**Response (200 OK):**
```json
{
  "id": "a28d61a0-3e32-43d3-9360-b76908af87ee",
  "request_id": "f78ade9f-66f8-4884-b00f-671d45b74b65",
  "shop_id": "cdedd5f6-2726-44a8-9337-66da346dd628",
  "price": 82000,
  "note": "Updated: Available with 2 year warranty",
  "status": "pending",
  "created_at": "2026-08-05T00:16:22.806214Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Cannot update a bid that is not pending |
| 403 | You don't have permission to update this bid |
| 403 | Only shop owners can update bids |
| 404 | Bid not found |

---

### 5. DELETE /bids/{bid_id}

**Description:** Withdraw/delete a pending bid

**Authentication:** Required (Bearer Token)

**Authorization:** Shop owner who created the bid

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `bid_id` | UUID | ID of the bid to delete |

**Response (204 No Content):**
```
(No response body)
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Cannot delete a bid that is not pending |
| 403 | You don't have permission to delete this bid |
| 403 | Only shop owners can delete bids |
| 404 | Bid not found |

---

### 6. PATCH /bids/{bid_id}/select

**Description:** Select a bid (approve the bid)

**Authentication:** Required (Bearer Token)

**Authorization:** Buyer who owns the request

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `bid_id` | UUID | ID of the bid to select |

**Behavior:**
- Sets selected bid status to `selected`
- Sets all other bids on the request to `rejected`
- Updates request status to `purchased`
- Returns shop contact information

**Response (200 OK):**
```json
{
  "bid_id": "a28d61a0-3e32-43d3-9360-b76908af87ee",
  "request_id": "f78ade9f-66f8-4884-b00f-671d45b74b65",
  "status": "selected",
  "selected_bid": {
    "id": "a28d61a0-3e32-43d3-9360-b76908af87ee",
    "request_id": "f78ade9f-66f8-4884-b00f-671d45b74b65",
    "shop_id": "cdedd5f6-2726-44a8-9337-66da346dd628",
    "price": 85000,
    "note": "Available in black, 1 year warranty, brand new",
    "status": "selected",
    "created_at": "2026-08-05T00:16:22.806214Z",
    "shop_name": "Tech Store",
    "shop_phone": "9876543211",
    "shop_address": "456 Market Road, New Delhi"
  },
  "shop_contact": {
    "shop_name": "Tech Store",
    "phone": "9876543211",
    "address": "456 Market Road, New Delhi"
  }
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Request is not open for selection |
| 400 | Bid is no longer pending |
| 403 | Only buyers can select bids |
| 403 | You don't have permission to select this bid |
| 404 | Bid not found |

---

## Schemas (Pydantic Models)

### schemas.py

```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID

# ----- Bid Schemas -----

class BidCreate(BaseModel):
    """Schema for creating a new bid"""
    price: int = Field(..., gt=0, description="Bid price")
    note: Optional[str] = Field(None, description="Additional notes")
    
    @field_validator('price')
    @classmethod
    def validate_price(cls, v: int) -> int:
        if v <= 0:
            raise ValueError('price must be greater than 0')
        return v

class BidUpdate(BaseModel):
    """Schema for updating a bid"""
    price: Optional[int] = Field(None, gt=0, description="Updated bid price")
    note: Optional[str] = Field(None, description="Updated notes")
    
    @field_validator('price')
    @classmethod
    def validate_price(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v <= 0:
            raise ValueError('price must be greater than 0')
        return v

class BidResponse(BaseModel):
    """Schema for bid response"""
    id: UUID
    request_id: UUID
    shop_id: UUID
    price: int
    note: Optional[str]
    status: str
    created_at: datetime
    
    model_config = {
        "from_attributes": True
    }

class BidDetailResponse(BidResponse):
    """Schema for detailed bid response with shop info"""
    shop_name: Optional[str] = None
    shop_phone: Optional[str] = None
    shop_address: Optional[str] = None

class BidSelectionResponse(BaseModel):
    """Schema for response after selecting a bid"""
    bid_id: UUID
    request_id: UUID
    status: str
    selected_bid: BidDetailResponse
    shop_contact: dict
```

---

## Service Layer

### service.py

```python
from supabase import Client
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

class BidService:
    def __init__(self, supabase_admin: Client, supabase_anon: Client):
        self.supabase_admin = supabase_admin
        self.supabase_anon = supabase_anon
    
    def create_bid(self, request_id: str, shop_id: str, price: int, note: Optional[str] = None) -> Dict[str, Any]:
        """Create a new bid on a request"""
        # Implementation...
    
    def update_bid(self, bid_id: str, shop_id: str, price: Optional[int] = None, note: Optional[str] = None) -> Dict[str, Any]:
        """Update a bid (only if pending)"""
        # Implementation...
    
    def delete_bid(self, bid_id: str, shop_id: str) -> bool:
        """Delete/withdraw a bid (only if pending)"""
        # Implementation...
    
    def select_bid(self, bid_id: str, buyer_id: str) -> Dict[str, Any]:
        """Select a bid (buyer only)"""
        # Implementation...
```

---

## RLS Policies

```sql
-- Shop owners can insert their own bids
CREATE POLICY "Shop owners can insert their own bids"
  ON bids FOR INSERT
  WITH CHECK (auth.uid() = shop_id);

-- Shop owners can select their own bids
CREATE POLICY "Shop owners can select their own bids"
  ON bids FOR SELECT
  USING (auth.uid() = shop_id);

-- Shop owners can update their own bids
CREATE POLICY "Shop owners can update their own bids"
  ON bids FOR UPDATE
  USING (auth.uid() = shop_id);

-- Shop owners can delete their own bids
CREATE POLICY "Shop owners can delete their own bids"
  ON bids FOR DELETE
  USING (auth.uid() = shop_id);

-- Buyers can select bids on their requests
CREATE POLICY "Buyers can select bids on their requests"
  ON bids FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requests
      WHERE requests.id = bids.request_id
      AND requests.buyer_id = auth.uid()
    )
  );
```

---

## Error Handling

### Common Error Codes

| Status | Code | Description | Solution |
|--------|------|-------------|----------|
| 400 | BID_001 | Request is not open for bidding | Check request status |
| 400 | BID_002 | You already have a pending bid on this request | Withdraw existing bid |
| 400 | BID_003 | Cannot update a bid that is not pending | Only pending bids can be updated |
| 400 | BID_004 | Cannot delete a bid that is not pending | Only pending bids can be deleted |
| 400 | BID_005 | Request is not open for selection | Request may be already purchased |
| 400 | BID_006 | Bid is no longer pending | Bid already selected/rejected |
| 403 | AUTH_001 | Only shop owners can place bids | Check user role |
| 403 | AUTH_002 | Only buyers can select bids | Check user role |
| 403 | AUTH_003 | You don't have permission | User doesn't own the resource |
| 404 | NOT_FOUND | Request/Bid not found | Verify ID exists |

---

## Testing Guide

### Postman Environment Variables

| Variable | Description |
|----------|-------------|
| `base_url` | API base URL (http://localhost:8000) |
| `buyer_token` | JWT token for buyer |
| `shop_token` | JWT token for shop owner |
| `request_id` | ID of the request |
| `bid_id` | ID of the bid |

### Test Flow

1. **Create Buyer** - Signup as buyer
2. **Create Shop Owner** - Signup as shop owner
3. **Create Request** - Buyer creates an open request
4. **Place Bid** - Shop owner bids on the request
5. **Get Bids** - Verify bid was created
6. **Update Bid** - Shop owner updates the bid
7. **Select Bid** - Buyer selects the bid
8. **Verify Status** - Check request status = "purchased"


## API Contract Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/requests/{id}/bids` | Place a bid | Shop Owner |
| GET | `/requests/{id}/bids` | Get bids for request | All |
| GET | `/bids` | Get user's bids | All |
| PATCH | `/bids/{id}` | Update bid | Shop Owner |
| DELETE | `/bids/{id}` | Delete bid | Shop Owner |
| PATCH | `/bids/{id}/select` | Select bid | Buyer |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-08-03 | Initial release |
| 1.0.1 | 2026-08-05 | Added shop contact info to selection response |

---

## Dependencies

```txt
fastapi>=0.104.0
pydantic>=2.0.0
supabase>=1.0.0
python-dotenv>=1.0.0
```

---

## Installation

### 1. Add to main.py

```python
from bids.routes import router as bids_router, bid_router

app.include_router(bids_router)  # /requests/... endpoints
app.include_router(bid_router)   # /bids/... endpoints
```

### 2. Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Next Steps

After completing the Bids module, you can add:

1. **Notifications** - Alert buyers/shops about bid activity
2. **Bid History** - Track all bid changes
3. **Analytics** - Bid statistics and insights
4. **Auto-expiry** - Automatically expire bids after a certain time

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| 404 on PATCH/DELETE | Use `/bids/{id}` not `/requests/bids/{id}` |
| 400 "Request is not open" | Create a new request |
| 403 "Permission denied" | Check user role (buyer vs shop owner) |
| `shop_name` is null | Update profile with shop contact info |

---

**Module Status:** Complete and Tested
