# MarketFlip - AI Project Context

## 1. Project Overview

**MarketFlip** is a reverse marketplace platform.

Traditional marketplace:

`Buyer → searches products → contacts sellers → compares prices`

MarketFlip:

`Buyer → posts requirement → local shops submit bids → buyer compares → buyer selects best bid`

The core idea is to make **sellers compete for buyer demand**, rather than making buyers search through multiple shops.

**Tagline:** Flip How You Buy.

**Current status:** POC complete and deployed.

---

# 2. Production Architecture

```text
                    USERS
              ┌───────┴────────┐
              │                │
           BUYER          SHOP OWNER
              │                │
              └───────┬────────┘
                      ▼
             React + Vite Frontend
                    Vercel
                      │
                  HTTPS/REST
                      ▼
                FastAPI Backend
                    Render
                      │
             ┌────────┴────────┐
             ▼                 ▼
       Supabase Auth      PostgreSQL
                              │
                         Row Level
                          Security
```

### Frontend

* React 18
* Vite
* Tailwind CSS
* shadcn/ui
* Framer Motion
* Lucide React
* React Router DOM
* Axios
* Hosted on Vercel

### Backend

* Python 3.11+
* FastAPI
* Pydantic
* Hosted on Render

### Database/Auth

* Supabase
* PostgreSQL
* Supabase Auth
* Row Level Security (RLS)

### Production URLs

```text
Frontend:
https://marketflip-web.vercel.app

Backend:
https://marketflip.onrender.com

Swagger:
https://marketflip.onrender.com/docs
```

---

# 3. User Roles

There are two primary roles.

## Buyer

A buyer wants to purchase something.

Can:

* Create purchase requests
* Set product name/description
* Set minimum and maximum budget
* Set pincode/location
* Set category
* Add reference URL/image
* View bids
* Compare bids
* Select a bid
* Manage delivery details
* Verify transaction completion
* View purchases
* Edit/delete eligible requests

## Shop Owner

A shop owner wants to sell products.

Can:

* Browse open buyer requests
* Submit bids
* Set bid price
* Add bid notes
* Edit/withdraw eligible bids
* View own bids
* See buyer details after their bid is selected
* Manage completed transactions

---

# 4. Core Business Flow

```text
BUYER
  │
  ▼
Create Request
  │
  ▼
Request = OPEN
  │
  ▼
Shops browse request
  │
  ├──── Shop A → Bid ₹85,000
  ├──── Shop B → Bid ₹87,000
  └──── Shop C → Bid ₹84,500
  │
  ▼
Buyer compares bids
  │
  ▼
Buyer selects one bid
  │
  ▼
Selected Bid = SELECTED
Request = PURCHASED
  │
  ▼
Relevant contact information becomes available
  │
  ▼
Delivery / Transaction
  │
  ▼
Buyer verifies transaction
  │
  ▼
Request = COMPLETED
```

### Important Product Rule

**Contact information should remain restricted before bid selection.**

Once a buyer selects a bid, the selected shop and relevant contact details can be revealed to the parties.

---

# 5. Database Model

There are three main application tables.

```text
                    profiles
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
         requests              bids
             │                   │
             └───────┬───────────┘
                     │
              request_id
```

## profiles

```text
id              UUID PK / auth.users.id
role            buyer | shop_owner
shop_name       nullable
address         required
pincode         6-digit text
phone           required
created_at      timestamp
```

## requests

```text
id                  UUID PK
buyer_id            FK → profiles.id
item_name           product name
description         optional
budget_min          minimum budget
budget_max          maximum budget
pincode             buyer pincode
category            default electronics
reference_url       optional
reference_image     optional
status              lifecycle state
created_at          timestamp
expires_at          timestamp
purchased_at        nullable
completed_at        nullable
selected_bid_id     FK → bids.id
delivery_method     nullable
delivery_address    nullable
```

## bids

```text
id                      UUID PK
request_id              FK → requests.id
shop_id                 FK → profiles.id
price                   bid price
note                    optional
status                  lifecycle state
created_at              timestamp
selected_at             nullable
rejected_at             nullable
withdrawn_at            nullable
buyer_contact_viewed    boolean
```

---

# 6. Request States

```text
                 ┌──────────┐
                 │   OPEN   │
                 └────┬─────┘
          ┌────────────┼────────────┐
          ▼            ▼            ▼
     PURCHASED      EXPIRED       DELETED
          │
          ▼
      COMPLETED
```

### States

```text
open       = accepting bids
purchased  = buyer selected a bid
completed  = transaction verified
expired    = request passed expiry
deleted    = buyer deleted request
```

Normal intended lifecycle:

`open → purchased → completed`

Alternative terminal paths:

`open → expired`

`open → deleted`

---

# 7. Bid States

```text
                 PENDING
                /   |    \
               /    |     \
              ▼     ▼      ▼
         SELECTED REJECTED WITHDRAWN
```

### States

```text
pending   = waiting for buyer decision
selected  = buyer selected this bid
rejected  = bid was not selected
withdrawn = shop withdrew bid
```

---

# 8. API Structure

The backend is organized around authentication, requests, and bids.

## Authentication

```text
POST /auth/signup
POST /auth/login
GET  /auth/profiles/{id}
```

## Requests

```text
POST   /requests
GET    /requests
GET    /requests/{id}
PATCH  /requests/{id}
DELETE /requests/{id}

PATCH /requests/{id}/delivery
PATCH /requests/{id}/verify
```

## Bids

```text
POST   /requests/{id}/bids
GET    /requests/{id}/bids

GET    /bids
PATCH  /bids/{id}
DELETE /bids/{id}

PATCH  /bids/{id}/select

GET    /bids/{id}/buyer
GET    /bids/stats
```

---

# 9. Important API Behaviors

## Create Request

```text
POST /requests
```

Example:

```json
{
  "item_name": "iPhone 15 Pro",
  "description": "256GB, new",
  "budget_min": 80000,
  "budget_max": 100000,
  "pincode": "110001",
  "category": "electronics"
}
```

Creates:

```text
status = open
expires_at = creation time + 7 days
```

## Place Bid

```text
POST /requests/{id}/bids
```

Example:

```json
{
  "price": 85000,
  "note": "Available in black, 1 year warranty"
}
```

Creates:

```text
status = pending
```

## Select Bid

```text
PATCH /bids/{id}/select
```

This is a critical business operation.

Expected result:

```text
Selected bid
    ↓
bid.status = selected
    ↓
request.status = purchased
    ↓
request.selected_bid_id = selected bid
    ↓
selected shop/contact information can be revealed
```

Other eligible bids should no longer remain active for the same purchase decision.

---

# 10. Frontend Routes

## Public

```text
/
 /auth
```

## Buyer

```text
/buyer/dashboard
/buyer/post-request
/buyer/request/:id
/buyer/purchases
/buyer/edit-request/:id
```

## Shop Owner

```text
/shop/dashboard
/shop/browse
/shop/my-bids
/shop/bid/:id
/shop/completed
```

---

# 11. Authentication

Authentication uses Supabase Auth/JWT.

General flow:

```text
Login / Signup
      │
      ▼
Supabase Auth
      │
      ▼
Authentication token
      │
      ▼
Frontend authentication state
      │
      ▼
Protected API requests
      │
      ▼
FastAPI validates token
      │
      ▼
Role/ownership authorization
      │
      ▼
Database operation
```

### Roles

```text
buyer
shop_owner
```

The frontend should never be treated as the only authorization layer.

Authorization should be enforced by:

1. Frontend route protection
2. Backend authorization
3. Database RLS where applicable

---

# 12. Security

Current documented security mechanisms:

* JWT authentication
* Role-based authorization
* Supabase RLS
* Pydantic input validation
* Restricted CORS
* Environment variables for secrets
* Contact information privacy

Example ownership rule:

```sql
auth.uid() = buyer_id
```

or:

```sql
auth.uid() = shop_id
```

depending on the operation.

---

# 13. Main Frontend Architecture

```text
React Application
│
├── Landing
│   ├── Navbar
│   ├── Hero
│   ├── Features
│   ├── HowItWorks
│   ├── Testimonials
│   ├── FAQ
│   ├── AboutDev
│   └── Footer
│
├── Authentication
│
├── Buyer Area
│   ├── Dashboard
│   ├── Post Request
│   ├── Request Details
│   ├── Edit Request
│   └── Purchases
│
└── Shop Area
    ├── Dashboard
    ├── Browse Requests
    ├── My Bids
    ├── Bid Details
    └── Completed Transactions
```

---

# 14. Critical Business Rules

These rules are important when modifying the project.

### Rule 1: Roles

A user is either:

```text
buyer
```

or:

```text
shop_owner
```

Role-specific operations must be protected.

### Rule 2: Request Ownership

Only the buyer who owns a request should be able to modify/delete it.

### Rule 3: Bid Ownership

A shop owner should only modify or withdraw their own bids.

### Rule 4: Bid Selection

Only the buyer who owns the request can select a bid.

### Rule 5: Request State

A request must be `open` to normally receive bids.

### Rule 6: Contact Privacy

Buyer/seller contact information should not be unnecessarily exposed before bid selection.

### Rule 7: Transaction Completion

A purchase should move to `completed` only after the appropriate transaction verification action.

### Rule 8: Expiration

Requests are designed with a seven-day expiry period.

---

# 15. Current POC Status

```text
Backend API             ✅ Live
Frontend                ✅ Live
Database                ✅ Connected
Authentication          ✅ Working
Buyer Flow              ✅ Complete
Shop Flow               ✅ Complete
Request Lifecycle       ✅ Implemented
Bid Management          ✅ Implemented
Deployment              ✅ Live
POC                     ✅ Complete
```

---

# 16. Known/Future Features

These are roadmap items, not necessarily currently implemented.

## Phase 1

* Automatic request expiry
* Better pincode filtering
* Bid count indicators

## Phase 2

* Email/SMS notifications
* Ratings and reviews
* Advanced search
* Analytics dashboard

## Phase 3

* React Native mobile application
* In-app payments
* Multiple product categories
* AI price suggestions

---

# 17. Future AI Price Suggestion

Potential architecture:

```text
Buyer Request
     │
     ├── Product
     ├── Category
     ├── Budget
     ├── Location
     └── Historical Bids
             │
             ▼
       Pricing Model
             │
             ▼
      Suggested Price
             │
             ▼
       User Interface
```

This is a **future feature**, not part of the currently deployed POC.

---

# 18. Development Commands

Backend:

```bash
uvicorn main:app --reload
```

Frontend:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Vercel:

```bash
vercel --prod
```

Backend deployment:

```bash
git push origin main
```

---

# 19. Environment Variables

Backend:

```env
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Frontend:

```env
VITE_API_URL=https://marketflip.onrender.com
```

Never expose service-role secrets in frontend code or public repositories.

---

# 20. AI Agent Instructions

When working on MarketFlip, assume the following:

1. **Do not redesign the core marketplace model.**
2. Buyers create requirements.
3. Shop owners bid on requirements.
4. Buyers select bids.
5. Contact information is controlled and should be revealed only at the appropriate transaction stage.
6. Preserve buyer/shop-owner role separation.
7. Preserve existing request and bid lifecycle states unless the task explicitly changes them.
8. Check ownership and authorization for every protected operation.
9. Prefer backend enforcement over frontend-only checks.
10. Preserve Supabase/PostgreSQL relationships.
11. Do not invent database columns or API endpoints when an existing implementation is available.
12. Before changing a business-critical workflow, understand the existing request → bid → selection → transaction flow.
13. Treat roadmap features as **not implemented** unless the code explicitly confirms them.
14. When fixing a bug, avoid unnecessarily rewriting unrelated architecture.
15. Keep API contracts between React and FastAPI consistent.
16. If modifying database structure, consider foreign keys, RLS, request states, bid states, and existing frontend/API dependencies.
17. The project is a POC, so prioritize correctness and maintainability over premature enterprise complexity.

---

# 21. One-Minute Project Summary

**MarketFlip is a buyer-driven reverse marketplace.**

A buyer posts:

> "I want this product. My budget is ₹X–₹Y."

Nearby shop owners discover the request and compete by submitting bids.

The buyer sees:

```text
Shop A → ₹85,000
Shop B → ₹82,500
Shop C → ₹87,000
```

The buyer selects the preferred bid.

The system then transitions:

```text
Request: OPEN
      ↓
Bid: SELECTED
      ↓
Request: PURCHASED
      ↓
Contact / Delivery
      ↓
Request: COMPLETED
```

The application consists of:

```text
React/Vite
     ↓
FastAPI
     ↓
Supabase Auth + PostgreSQL
```

with two roles:

```text
BUYER       → creates requests and selects bids
SHOP OWNER  → browses requests and places bids
```

The current POC is deployed and functional. Future development focuses on notifications, reputation, search, payments, mobile support, analytics, and AI-powered pricing.
