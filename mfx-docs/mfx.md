# MarketFlip - Complete Project Documentation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Deployment URLs](#5-deployment-urls)
6. [Database Schema](#6-database-schema)
7. [API Documentation](#7-api-documentation)
8. [Frontend Documentation](#8-frontend-documentation)
9. [User Flows](#9-user-flows)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [Testing](#11-testing)
12. [Performance & Optimization](#12-performance--optimization)
13. [Security](#13-security)
14. [Future Roadmap](#14-future-roadmap)

---

## 1. Executive Summary

**MarketFlip** is a reverse marketplace platform that connects buyers with local shop owners. Unlike traditional marketplaces where buyers search for products, MarketFlip allows buyers to post what they need, and shop owners compete to offer the best prices.

| Metric | Value |
|--------|-------|
| **Current Status** | POC Complete - Live |
| **Backend URL** | https://marketflip.onrender.com |
| **Frontend URL** | https://marketflip-web.vercel.app |
| **API Status** | Live & Responding |
| **Database** | Supabase (PostgreSQL) |

---

## 2. Project Overview

### 2.1 Problem Statement

**Traditional local shopping is inefficient:**
- Buyers spend hours visiting shops to compare prices
- Shop owners struggle to reach potential customers
- No transparency in pricing
- Wasted time and resources for both parties

### 2.2 Solution

**MarketFlip flips the model:**
- Buyers post what they want to buy
- Shop owners bid with their best prices
- Buyers compare offers and choose the best deal
- Sellers compete for buyers instead of buyers hunting

### 2.3 Core Value Proposition

```
+-----------------------------------------------------------+
|                    MarketFlip Value Prop                    |
+-----------------------------------------------------------+
|  Save Time       - No more shop-to-shop hunting           |
|  Save Money      - Sellers compete for your business      |
|  Transparency    - All bids are visible and comparable    |
|  Privacy         - Contact details revealed only on       |
|                    bid selection                           |
|  Local Focus     - Connect with trusted local shops       |
+-----------------------------------------------------------+
```

---

## 3. System Architecture

### 3.1 Architecture Diagram

```
+-----------------------------------------------------------+
|                         FRONTEND                           |
|                    (React + Vite + Vercel)                 |
+-----------------------------------------------------------+
|                                                           |
|  +-----------------+  +-----------------+                 |
|  |   Landing Page  |  |   Auth Pages   |                 |
|  +-----------------+  +-----------------+                 |
|  +-----------------+  +-----------------+                 |
|  |   Buyer Pages   |  |   Shop Pages   |                 |
|  +-----------------+  +-----------------+                 |
|  +-------------------------------------------------+     |
|  |         Context (Auth) + API Client             |     |
|  +-------------------------------------------------+     |
+-----------------------------------------------------------+
                           |
                           v
+-----------------------------------------------------------+
|                         BACKEND                           |
|                     (FastAPI + Render)                     |
+-----------------------------------------------------------+
|                                                           |
|  +-----------------+  +-----------------+                 |
|  |   Auth Routes   |  |  Request Routes |                 |
|  +-----------------+  +-----------------+                 |
|  +-----------------+  +-----------------+                 |
|  |   Bid Routes    |  |  Services Layer |                 |
|  +-----------------+  +-----------------+                 |
+-----------------------------------------------------------+
                           |
                           v
+-----------------------------------------------------------+
|                        DATABASE                            |
|                     (Supabase)                             |
+-----------------------------------------------------------+
|                                                           |
|  +-----------------+  +-----------------+                 |
|  |    Profiles     |  |    Requests    |                 |
|  +-----------------+  +-----------------+                 |
|  +-----------------+  +-----------------+                 |
|  |      Bids       |  |  Auth Users    |                 |
|  +-----------------+  +-----------------+                 |
+-----------------------------------------------------------+
```

---

## 4. Technology Stack

### 4.1 Frontend Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | React | 18.2.0 | UI Library |
| Build Tool | Vite | 5.x | Development & Build |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| UI Components | shadcn/ui | Latest | Pre-built components |
| Animations | Framer Motion | 11.x | UI animations |
| Icons | Lucide React | Latest | Vector icons |
| Routing | React Router DOM | 6.x | Page navigation |
| HTTP Client | Axios | 1.x | API calls |
| Hosting | Vercel | - | Production deployment |

### 4.2 Backend Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | FastAPI | 0.104.0 | API Development |
| Language | Python | 3.11+ | Backend logic |
| Database | Supabase (PostgreSQL) | Latest | Data persistence |
| Auth | Supabase Auth | Latest | User authentication |
| Hosting | Render | - | Production deployment |
| Edge Functions | Supabase | Latest | Cron jobs |

---

## 5. Deployment URLs

### 5.1 Production URLs

| Environment | URL | Status |
|-------------|-----|--------|
| **Frontend** | https://marketflip-web.vercel.app | Live |
| **Backend API** | https://marketflip.onrender.com | Live |
| **API Documentation** | https://marketflip.onrender.com/docs | Live |
| **Supabase Dashboard** | https://app.supabase.com | Live |

### 5.2 API Test

```bash
# Test backend health
curl https://marketflip.onrender.com/
# Response: {"message":"MarketFlip API is running"}
```

---

## 6. Database Schema

### 6.1 Entity Relationship Diagram

```
+------------------+     +------------------+     +------------------+
|     Profiles     |     |     Requests     |     |       Bids       |
+------------------+     +------------------+     +------------------+
| id (PK)          |-----| buyer_id (FK)    |     | id (PK)          |
| role             |     | id (PK)          |-----| request_id (FK)  |
| shop_name        |     | item_name        |     | shop_id (FK)     |
| address          |     | description      |     | price            |
| pincode          |     | budget_min       |     | note             |
| phone            |     | budget_max       |     | status           |
| created_at       |     | pincode          |     | created_at       |
+------------------+     | category         |     | selected_at      |
                         | status           |     | rejected_at      |
                         | created_at       |     | withdrawn_at     |
                         | expires_at       |     +------------------+
                         | purchased_at     |
                         | completed_at     |
                         | selected_bid_id  |
                         | delivery_method  |
                         | delivery_address |
                         +------------------+
```

### 6.2 Table: profiles

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) | User identifier |
| `role` | TEXT | NOT NULL, CHECK ('buyer','shop_owner') | User role |
| `shop_name` | TEXT | NULLABLE | Shop name (shop_owner only) |
| `address` | TEXT | NOT NULL | User address |
| `pincode` | TEXT | NOT NULL, CHECK (char_length=6) | 6-digit pincode |
| `phone` | TEXT | NOT NULL | Contact number |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |

### 6.3 Table: requests

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Request identifier |
| `buyer_id` | UUID | NOT NULL, REFERENCES profiles(id) | Buyer who created request |
| `item_name` | TEXT | NOT NULL | Product name |
| `description` | TEXT | NULLABLE | Product description |
| `budget_min` | INTEGER | NOT NULL | Minimum budget |
| `budget_max` | INTEGER | NOT NULL | Maximum budget |
| `pincode` | TEXT | NOT NULL, CHECK (char_length=6) | Buyer's pincode |
| `category` | TEXT | DEFAULT 'electronics' | Product category |
| `reference_url` | TEXT | NULLABLE | Product reference URL |
| `reference_image` | TEXT | NULLABLE | Product image URL |
| `status` | TEXT | NOT NULL, DEFAULT 'open' | Request status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `expires_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() + 7 days | Expiry timestamp |
| `purchased_at` | TIMESTAMPTZ | NULLABLE | Purchase timestamp |
| `completed_at` | TIMESTAMPTZ | NULLABLE | Completion timestamp |
| `selected_bid_id` | UUID | NULLABLE, REFERENCES bids(id) | Selected bid |
| `delivery_method` | TEXT | NULLABLE | Delivery method |
| `delivery_address` | TEXT | NULLABLE | Delivery address |

### 6.4 Table: bids

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Bid identifier |
| `request_id` | UUID | NOT NULL, REFERENCES requests(id) | Request being bid on |
| `shop_id` | UUID | NOT NULL, REFERENCES profiles(id) | Shop owner who bid |
| `price` | INTEGER | NOT NULL | Bid price |
| `note` | TEXT | NULLABLE | Additional notes |
| `status` | TEXT | NOT NULL, DEFAULT 'pending' | Bid status |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Creation timestamp |
| `selected_at` | TIMESTAMPTZ | NULLABLE | Selection timestamp |
| `rejected_at` | TIMESTAMPTZ | NULLABLE | Rejection timestamp |
| `withdrawn_at` | TIMESTAMPTZ | NULLABLE | Withdrawal timestamp |
| `buyer_contact_viewed` | BOOLEAN | DEFAULT FALSE | Contact viewed flag |

### 6.5 Status Values

**Request Status:**

| Status | Description |
|--------|-------------|
| `open` | Request is active and accepting bids |
| `purchased` | Buyer has selected a bid |
| `completed` | Transaction is complete |
| `expired` | Request has passed expiry date |
| `deleted` | Buyer has deleted the request |

**Bid Status:**

| Status | Description |
|--------|-------------|
| `pending` | Bid is awaiting buyer decision |
| `selected` | Buyer has selected this bid |
| `rejected` | Buyer has rejected this bid |
| `withdrawn` | Shop owner has withdrawn the bid |

---

## 7. API Documentation

### 7.1 API Overview

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| **Auth** | | | |
| POST | `/auth/signup` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| GET | `/auth/profiles/{id}` | Get user profile | Yes |
| **Requests** | | | |
| POST | `/requests` | Create request | Buyer |
| GET | `/requests` | List requests | All |
| GET | `/requests/{id}` | Get request detail | All |
| PATCH | `/requests/{id}` | Update request | Buyer |
| DELETE | `/requests/{id}` | Delete request | Buyer |
| PATCH | `/requests/{id}/delivery` | Update delivery | Buyer |
| PATCH | `/requests/{id}/verify` | Verify transaction | Buyer |
| **Bids** | | | |
| POST | `/requests/{id}/bids` | Place bid | Shop |
| GET | `/requests/{id}/bids` | Get bids for request | All |
| GET | `/bids` | Get all bids | All |
| PATCH | `/bids/{id}` | Update bid | Shop |
| DELETE | `/bids/{id}` | Delete bid | Shop |
| PATCH | `/bids/{id}/select` | Select bid | Buyer |
| GET | `/bids/{id}/buyer` | Get buyer details | Shop |
| GET | `/bids/stats` | Get bid statistics | Shop |

### 7.2 Auth Endpoints

#### POST /auth/signup

**Request:**
```json
{
  "email": "user@example.com",
  "password": "TestPass123!",
  "role": "buyer",
  "address": "123 Main St",
  "pincode": "110001",
  "phone": "9876543210",
  "shop_name": null
}
```

**Response (201 Created):**
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "buyer",
  "pincode": "110001"
}
```

#### POST /auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "TestPass123!"
}
```

**Response (200 OK):**
```json
{
  "access_token": "jwt_token_here",
  "role": "buyer",
  "user_id": "uuid"
}
```

### 7.3 Requests Endpoints

#### POST /requests

**Request:**
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

**Response (201 Created):**
```json
{
  "id": "uuid",
  "buyer_id": "uuid",
  "item_name": "iPhone 15 Pro",
  "status": "open",
  "created_at": "2026-08-11T...",
  "expires_at": "2026-08-18T..."
}
```

#### GET /requests

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | `open` | Filter by status |
| `pincode` | string | - | Filter by pincode |
| `category` | string | - | Filter by category |
| `limit` | integer | 100 | Results per page |
| `offset` | integer | 0 | Pagination offset |

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "item_name": "iPhone 15 Pro",
    "budget_min": 80000,
    "budget_max": 100000,
    "status": "open",
    "bid_count": 3
  }
]
```

### 7.4 Bids Endpoints

#### POST /requests/{id}/bids

**Request:**
```json
{
  "price": 85000,
  "note": "Available in black, 1 year warranty"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "request_id": "uuid",
  "shop_id": "uuid",
  "price": 85000,
  "status": "pending",
  "created_at": "2026-08-11T..."
}
```

#### PATCH /bids/{id}/select

**Response (200 OK):**
```json
{
  "bid_id": "uuid",
  "request_id": "uuid",
  "status": "selected",
  "selected_bid": {
    "id": "uuid",
    "price": 85000,
    "status": "selected",
    "shop_name": "Tech Store",
    "shop_phone": "9876543211",
    "shop_address": "456 Market Road"
  },
  "shop_contact": {
    "name": "Tech Store",
    "phone": "9876543211",
    "address": "456 Market Road"
  }
}
```

---

## 8. Frontend Documentation

### 8.1 Page Structure

| Page | Route | Access | Description |
|------|-------|--------|-------------|
| Landing | `/` | Public | Marketing page |
| Auth | `/auth` | Public | Login/Signup |
| Buyer Dashboard | `/buyer/dashboard` | Buyer | View requests |
| Post Request | `/buyer/post-request` | Buyer | Create request |
| Request Detail | `/buyer/request/:id` | Buyer | View bids |
| My Purchases | `/buyer/purchases` | Buyer | Purchase history |
| Edit Request | `/buyer/edit-request/:id` | Buyer | Edit request |
| Shop Dashboard | `/shop/dashboard` | Shop | View bids |
| Browse Requests | `/shop/browse` | Shop | Find requests |
| My Bids | `/shop/my-bids` | Shop | Manage bids |
| Bid Detail | `/shop/bid/:id` | Shop | View buyer |
| Completed Transactions | `/shop/completed` | Shop | Completed deals |

### 8.2 Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `LandingNavbar` | `src/components/LandingNavbar.jsx` | Navigation for landing page |
| `Hero` | `src/components/sections/Hero.jsx` | Main hero section |
| `Features` | `src/components/sections/Features.jsx` | Features grid |
| `HowItWorks` | `src/components/sections/HowItWorks.jsx` | Step-by-step guide |
| `Testimonials` | `src/components/sections/Testimonials.jsx` | User reviews |
| `FAQ` | `src/components/sections/FAQ.jsx` | Accordion FAQ |
| `AboutDev` | `src/components/sections/AboutDev.jsx` | Developer info |
| `Footer` | `src/components/sections/Footer.jsx` | Global footer |

---

## 9. User Flows

### 9.1 Buyer Flow

```
Landing Page
     |
     v
Sign Up / Login
     |
     v
Buyer Dashboard
     |
     v
Post Request
     |
     v
Request: status = open
     |
     v
View Bids on Request
     |
     v
Select a Bid
     |
     v
Request: status = purchased
     |
     v
My Purchases
     |
     v
Select Delivery Method
     |
     v
Verify Transaction
     |
     v
Request: status = completed
```

### 9.2 Shop Owner Flow

```
Landing Page
     |
     v
Sign Up / Login
     |
     v
Shop Dashboard
     |
     v
Browse Open Requests
     |
     v
Place Bid
     |
     v
Bid: status = pending
     |
     v
My Bids
     |
     v
+------------------+------------------+
|                  |                  |
v                  v                  v
Pending           Selected          Rejected
|                  |                  |
v                  v                  v
Edit/Withdraw     View Buyer        ----
                  Details
                  |
                  v
              Contact Buyer
                  |
                  v
              Complete Transaction
```

### 9.3 Request Lifecycle

```
    [*] 
     |
     v
   open <---- buyer posts request
     |
     +-----> purchased <---- buyer selects a bid
     |          |
     |          v
     |      completed <---- buyer verifies transaction
     |
     +-----> deleted <---- buyer deletes manually
     |
     +-----> expired <---- 7 days pass
     |
     v
    [*]
```

---

## 10. Authentication & Authorization

### 10.1 Auth Flow

```
User
  |
  v
Has Token?
  |
  +-- No --> Redirect to Auth
  |            |
  |            v
  |        Login/Signup
  |            |
  |            v
  |        Store Token
  |            |
  |            v
  |        Redirect to Dashboard
  |
  +-- Yes --> Validate Token
                |
                +-- Valid --> Access Protected Route
                |
                +-- Invalid --> Clear Token --> Redirect to Auth
```

### 10.2 Role-Based Access

| Role | Dashboard | Actions |
|------|-----------|---------|
| **Buyer** | `/buyer/dashboard` | Post requests, View bids, Select bids, Delete requests |
| **Shop Owner** | `/shop/dashboard` | Browse requests, Place bids, Manage bids, View buyer details |
| **Unauthenticated** | `/` or `/auth` | View landing page, Login/Signup |

---

## 11. Testing

### 11.1 API Testing (Postman)

| Test Case | Endpoint | Expected |
|-----------|----------|----------|
| Signup | POST `/auth/signup` | 201 Created |
| Login | POST `/auth/login` | 200 OK |
| Create Request | POST `/requests` | 201 Created |
| Get Requests | GET `/requests` | 200 OK |
| Place Bid | POST `/requests/{id}/bids` | 201 Created |
| Select Bid | PATCH `/bids/{id}/select` | 200 OK |

### 11.2 Frontend Testing

| Page | Test Case | Expected |
|------|-----------|----------|
| Landing | Load page | All sections visible |
| Auth | Login with valid credentials | Redirect to dashboard |
| Auth | Login with invalid credentials | Error message shown |
| Buyer Dashboard | Load dashboard | Requests displayed |
| Post Request | Submit form | Request created |

---

## 12. Performance & Optimization

### 12.1 Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | Optimized |
| Time to Interactive | < 3s | Optimized |
| API Response Time | < 200ms | Optimized |

### 12.2 Optimizations

| Optimization | Implementation |
|--------------|----------------|
| **Code Splitting** | Lazy loading routes |
| **Image Optimization** | SVG icons |
| **Caching** | Static assets cached |
| **API Optimization** | Pagination, efficient queries |
| **Animations** | Hardware-accelerated transforms |

---

## 13. Security

### 13.1 Security Measures

| Measure | Implementation |
|---------|----------------|
| **Authentication** | JWT tokens |
| **Authorization** | Role-based access control |
| **Data Protection** | Supabase RLS policies |
| **Input Validation** | Pydantic schemas |
| **CORS** | Restricted origins |
| **Environment Variables** | Secrets not exposed |

### 13.2 RLS Policies

```sql
-- Profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Requests
CREATE POLICY "Buyers can insert their own requests" ON requests
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Bids
CREATE POLICY "Shop owners can insert their own bids" ON bids
  FOR INSERT WITH CHECK (auth.uid() = shop_id);
```

---

## 14. Future Roadmap

### Phase 1: Core Enhancements
- Auto-expire cron job - Expire requests after 7 days
- Pincode filtering - Browse requests by location
- Bid count badge - Show bid counts on requests

### Phase 2: Feature Additions
- Notifications - Email/SMS alerts for bid activity
- Rating and Reviews - Shop reputation system
- Search - Advanced request search
- Analytics - Dashboard metrics

### Phase 3: Scale and Polish
- Mobile App - React Native version
- Payments - In-app payment integration
- Multiple Categories - Category-specific features
- AI Price Suggestions - Machine learning model

---

## 15. Environment Variables

### Backend (.env)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Frontend (.env)

```env
VITE_API_URL=https://marketflip.onrender.com
```

---

## 16. Useful Commands

```bash
# Backend Development
uvicorn main:app --reload

# Frontend Development
npm run dev

# Frontend Build
npm run build

# Deploy to Vercel
vercel --prod

# Deploy to Render
git push origin main
```

---

## 17. Project Status

| Component | Status |
|-----------|--------|
| Backend API | Live |
| Frontend | Live |
| Database | Connected |
| Authentication | Working |
| User Flows | Complete |
| POC | Complete |

---

**Documentation Version:** 1.0.0
**Last Updated:** August 11, 2026
**Status:** Complete and Deployed

---

**MarketFlip** - Flip How You Buy.