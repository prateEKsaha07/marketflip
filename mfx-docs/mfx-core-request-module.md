# Requests Module - Complete Documentation

---

## Overview

The Requests module manages buyer requests for products. It handles the full lifecycle of a request from creation to expiry, including listing, viewing details, and soft deletion.

---

## Table of Contents

- [File Structure](#file-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Schemas](#schemas)
- [Service Layer](#service-layer)
- [RLS Policies](#rls-policies)
- [Testing](#testing)
- [Error Handling](#error-handling)

---

## File Structure

```
requests/
├── __init__.py
├── schemas.py      # Pydantic models for request/response
├── service.py      # Database operations
└── routes.py       # API endpoints
```

---

## Database Schema

### Requests Table

```sql
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  item_name TEXT NOT NULL,
  description TEXT,
  budget_min INTEGER NOT NULL,
  budget_max INTEGER NOT NULL,
  pincode TEXT NOT NULL CHECK (char_length(pincode) = 6),
  category TEXT DEFAULT 'electronics',
  reference_url TEXT,
  reference_image TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'purchased', 'deleted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days' NOT NULL
);
```

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique request identifier |
| `buyer_id` | UUID | NOT NULL, REFERENCES profiles(id) | Buyer who created the request |
| `item_name` | TEXT | NOT NULL | Product name |
| `description` | TEXT | NULLABLE | Detailed product description |
| `budget_min` | INTEGER | NOT NULL | Minimum budget |
| `budget_max` | INTEGER | NOT NULL | Maximum budget |
| `pincode` | TEXT | NOT NULL, CHECK (char_length=6) | Buyer's location pincode |
| `category` | TEXT | DEFAULT 'electronics' | Product category |
| `reference_url` | TEXT | NULLABLE | Product reference URL |
| `reference_image` | TEXT | NULLABLE | Product image URL |
| `status` | TEXT | DEFAULT 'open' | Request status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `expires_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() + 7 days | Expiry timestamp |

### Status Values

| Status | Description |
|--------|-------------|
| `open` | Request is active and accepting bids |
| `purchased` | Buyer has selected a bid and purchased |
| `deleted` | Buyer has soft-deleted the request |
| `expired` | Request has passed expiry date |

---

## API Endpoints

### 1. POST /requests - Create Request

**Description:** Create a new request (buyer only)

**Authentication:** Required (Bearer Token)

**Authorization:** Role must be `buyer`

**Request Body:**
```json
{
  "item_name": "iPhone 15 Pro",
  "description": "Looking for new iPhone 15 Pro, 256GB, black color",
  "budget_min": 80000,
  "budget_max": 100000,
  "pincode": "110001",
  "category": "electronics",
  "reference_url": "https://apple.com/iphone-15-pro",
  "reference_image": "https://example.com/iphone.jpg"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `item_name` | string | ✅ | Product name (min 1, max 255 chars) |
| `description` | string | ❌ | Detailed description |
| `budget_min` | integer | ✅ | Minimum budget (> 0) |
| `budget_max` | integer | ✅ | Maximum budget (>= budget_min) |
| `pincode` | string | ✅ | 6-digit pincode |
| `category` | string | ❌ | Product category (default: electronics) |
| `reference_url` | string | ❌ | Product reference URL |
| `reference_image` | string | ❌ | Product image URL |

**Response (201 Created):**
```json
{
  "id": "a1905113-aec7-4433-8978-81e82b6e09b6",
  "buyer_id": "04f027ec-3668-4ec9-9c80-308a57b35346",
  "item_name": "iPhone 15 Pro",
  "description": "Looking for new iPhone 15 Pro, 256GB, black color",
  "budget_min": 80000,
  "budget_max": 100000,
  "pincode": "110001",
  "category": "electronics",
  "reference_url": "https://apple.com/iphone-15-pro",
  "reference_image": "https://example.com/iphone.jpg",
  "status": "open",
  "created_at": "2026-08-03T19:16:58.397885Z",
  "expires_at": "2026-08-10T19:16:58.397885Z"
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Validation error (e.g., budget_max < budget_min) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (user is not a buyer) |

---

### 2. GET /requests - List Requests

**Description:** Get all requests with optional filters

**Authentication:** Required (Bearer Token)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | `open` | Filter by status (open/purchased/deleted/expired) |
| `pincode` | string | - | Filter by pincode (6 digits) |
| `category` | string | - | Filter by category |
| `limit` | integer | 100 | Number of results (1-500) |
| `offset` | integer | 0 | Pagination offset |

**Example Request:**
```
GET /requests?status=open&pincode=110001&category=electronics&limit=10&offset=0
```

**Response (200 OK):**
```json
[
  {
    "id": "a1905113-aec7-4433-8978-81e82b6e09b6",
    "buyer_id": "04f027ec-3668-4ec9-9c80-308a57b35346",
    "item_name": "iPhone 15 Pro",
    "description": "Looking for new iPhone 15 Pro, 256GB, black color",
    "budget_min": 80000,
    "budget_max": 100000,
    "pincode": "110001",
    "category": "electronics",
    "reference_url": "https://apple.com/iphone-15-pro",
    "reference_image": "https://example.com/iphone.jpg",
    "status": "open",
    "created_at": "2026-08-03T19:16:58.397885Z",
    "expires_at": "2026-08-10T19:16:58.397885Z"
  }
]
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 400 | Invalid filter parameter (e.g., pincode not 6 digits) |
| 401 | Unauthorized (missing/invalid token) |

---

### 3. GET /requests/{request_id} - Get Request Detail

**Description:** Get detailed request information including bids

**Authentication:** Required (Bearer Token)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `request_id` | UUID | Request identifier |

**Behavior:**
- All authenticated users can view request details
- Bids are only included if the current user is the buyer

**Example Request:**
```
GET /requests/a1905113-aec7-4433-8978-81e82b6e09b6
```

**Response (200 OK):**
```json
{
  "id": "a1905113-aec7-4433-8978-81e82b6e09b6",
  "buyer_id": "04f027ec-3668-4ec9-9c80-308a57b35346",
  "item_name": "iPhone 15 Pro",
  "description": "Looking for new iPhone 15 Pro, 256GB, black color",
  "budget_min": 80000,
  "budget_max": 100000,
  "pincode": "110001",
  "category": "electronics",
  "reference_url": "https://apple.com/iphone-15-pro",
  "reference_image": "https://example.com/iphone.jpg",
  "status": "open",
  "created_at": "2026-08-03T19:16:58.397885Z",
  "expires_at": "2026-08-10T19:16:58.397885Z",
  "bids": [
    {
      "id": "bid-123",
      "request_id": "a1905113-aec7-4433-8978-81e82b6e09b6",
      "shop_id": "shop-uuid",
      "price": 85000,
      "note": "Available in black, 1 year warranty",
      "status": "pending",
      "created_at": "2026-08-03T20:00:00Z",
      "shop_name": "Tech Store"
    }
  ]
}
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 401 | Unauthorized (missing/invalid token) |
| 404 | Request not found |

---

### 4. DELETE /requests/{request_id} - Delete Request

**Description:** Soft delete a request (set status to 'deleted')

**Authentication:** Required (Bearer Token)

**Authorization:** Must be the buyer who created the request

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `request_id` | UUID | Request identifier |

**Behavior:**
- Does NOT hard delete the record
- Sets status to 'deleted'
- Request is excluded from "open" listings

**Example Request:**
```
DELETE /requests/a1905113-aec7-4433-8978-81e82b6e09b6
```

**Response (204 No Content):**
```
(No response body)
```

**Error Responses:**

| Status | Description |
|--------|-------------|
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (user is not the buyer) |
| 404 | Request not found |

---

## Schemas (Pydantic Models)

### RequestCreate

```python
class RequestCreate(BaseModel):
    """Schema for creating a new request"""
    item_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    budget_min: int = Field(..., gt=0)
    budget_max: int = Field(..., gt=0)
    pincode: str = Field(..., min_length=6, max_length=6)
    category: Optional[str] = "electronics"
    reference_url: Optional[str] = None
    reference_image: Optional[str] = None
    
    @field_validator('budget_max')
    @classmethod
    def validate_budget(cls, v: int, info: ValidationInfo) -> int:
        if 'budget_min' in info.data and v < info.data['budget_min']:
            raise ValueError('budget_max must be >= budget_min')
        return v
    
    @field_validator('pincode')
    @classmethod
    def validate_pincode(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError('pincode must contain only digits')
        return v
```

### RequestResponse

```python
class RequestResponse(BaseModel):
    """Schema for request response"""
    id: UUID
    buyer_id: UUID
    item_name: str
    description: Optional[str] = None
    budget_min: int
    budget_max: int
    pincode: str
    category: str
    reference_url: Optional[str] = None
    reference_image: Optional[str] = None
    status: str
    created_at: datetime
    expires_at: datetime
    
    model_config = {"from_attributes": True}
```

### RequestDetailResponse

```python
class RequestDetailResponse(RequestResponse):
    """Schema for detailed request response with bids"""
    bids: List[BidResponse] = []
```

---

## Service Layer

### RequestService Class

```python
class RequestService:
    def __init__(self, supabase_admin: Client, supabase_anon: Client):
        self.supabase_admin = supabase_admin
        self.supabase_anon = supabase_anon
    
    def create_request(self, buyer_id: str, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new request"""
        pass
    
    def get_requests(
        self, 
        pincode: Optional[str] = None,
        category: Optional[str] = None,
        status: str = "open",
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get requests with filters"""
        pass
    
    def get_request_by_id(self, request_id: str, current_user_id: str) -> Dict[str, Any]:
        """Get request by ID with bids (if user is buyer)"""
        pass
    
    def delete_request(self, request_id: str, current_user_id: str) -> bool:
        """Soft delete a request (set status to 'deleted')"""
        pass
```

---

## RLS Policies

```sql
-- Buyers can insert their own requests
CREATE POLICY "Buyers can insert their own requests"
  ON requests FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Buyers can select their own requests
CREATE POLICY "Buyers can select their own requests"
  ON requests FOR SELECT
  USING (auth.uid() = buyer_id);

-- Buyers can update their own requests
CREATE POLICY "Buyers can update their own requests"
  ON requests FOR UPDATE
  USING (auth.uid() = buyer_id);

-- Buyers can delete their own requests
CREATE POLICY "Buyers can delete their own requests"
  ON requests FOR DELETE
  USING (auth.uid() = buyer_id);

-- Anyone can view open requests (feed)
CREATE POLICY "Anyone can view open requests"
  ON requests FOR SELECT
  USING (status = 'open');
```

---

## Testing

### Postman Collection

Create this collection in Postman:

```
📁 Requests Module
├── 🔒 1. Login
│   └── POST {{base_url}}/auth/login
├── 🔒 2. Create Request
│   └── POST {{base_url}}/requests
├── 🔒 3. Get All Requests
│   └── GET {{base_url}}/requests?status=open
├── 🔒 4. Get Request Detail
│   └── GET {{base_url}}/requests/{{request_id}}
└── 🔒 5. Delete Request
    └── DELETE {{base_url}}/requests/{{request_id}}
```

### Test Data

**Sample Buyer:**
```json
{
  "email": "buyer_test@example.com",
  "password": "TestPass123!",
  "role": "buyer",
  "address": "123 Main Street",
  "pincode": "110001",
  "phone": "9876543210"
}
```

**Sample Request:**
```json
{
  "item_name": "iPhone 15 Pro",
  "description": "Looking for new iPhone 15 Pro, 256GB",
  "budget_min": 80000,
  "budget_max": 100000,
  "pincode": "110001",
  "category": "electronics"
}
```

---

## Error Handling

### Common Errors

| Error | Status | Description |
|-------|--------|-------------|
| `budget_max must be >= budget_min` | 400 | Budget validation failed |
| `pincode must contain only digits` | 400 | Invalid pincode format |
| `Only buyers can create requests` | 403 | User role is not buyer |
| `Request not found` | 404 | Request ID doesn't exist |
| `You don't have permission` | 403 | User doesn't own the request |
| `Invalid authentication token` | 401 | JWT token invalid/expired |

---

## Installation

### 1. Add to main.py

```python
from requests.routes import router as requests_router

app.include_router(requests_router)
```

### 2. Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Dependencies

```txt
fastapi>=0.104.0
pydantic>=2.0.0
supabase>=1.0.0
python-dotenv>=1.0.0
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-08-03 | Initial release |
| 1.0.1 | 2026-08-03 | Added reference fields support |
| 1.0.2 | 2026-08-03 | Pydantic V2 migration |

---

## Next Steps

1. **Bids Module** - Shop owners bidding on requests
2. **Notifications** - Alert buyers about bids
3. **Search** - Advanced request search
4. **Analytics** - Request metrics and insights

---

## API Contract Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/requests` | Create request | ✅ Buyer only |
| GET | `/requests` | List requests | ✅ Required |
| GET | `/requests/{id}` | Get request detail | ✅ Required |
| DELETE | `/requests/{id}` | Soft delete request | ✅ Buyer only |

---

**Module Status:** ✅ Complete and Tested
