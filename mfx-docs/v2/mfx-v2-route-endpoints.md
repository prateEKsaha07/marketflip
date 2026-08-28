# MarketFlip v2 Route and Endpoint Guide

**Status:** Current implementation reference  
**Backend:** FastAPI in `mfx-core`  
**Frontend:** React/Vite in `mfx-web`  
**Local API base URL:** `http://127.0.0.1:8000`

This document describes the routes that are currently registered in `mfx-core`, what each route asks the caller to provide, who may call it, and what it does. It also records the v2 work requested in `mfx-docs/v2/mfx-Companion-v2.md` but not yet implemented as an API route.

## 1. Request Rules

### Authentication

All routes marked **Protected** require:

```http
Authorization: Bearer <supabase_access_token>
```

The backend validates the token with Supabase Auth and loads the caller's role from `profiles`. The supported roles are `buyer` and `shop_owner`.

### Common path values

| Value | Meaning |
|---|---|
| `{request_id}` | UUID of a buyer request |
| `{bid_id}` | UUID of a request bid |
| `{auction_id}` | UUID of a shop auction |
| `{user_id}` | UUID of a profile |

### Common errors

| Status | Meaning |
|---|---|
| `400` | Invalid input or business rule prevents the operation |
| `401` | Missing or invalid bearer token, or invalid login credentials |
| `403` | Authenticated user has the wrong role or does not own the resource |
| `404` | Requested request, bid, auction, or profile does not exist |
| `422` | FastAPI/Pydantic validation failed before the handler ran |
| `500` | Unexpected backend or external-service failure |

## 2. Endpoint Summary

### System

| Method | Endpoint | Auth | What the caller asks the API to do |
|---|---|---|---|
| `GET` | `/` | Public | Check that the MarketFlip API is running. |
| `GET` | `/health` | Public | Check API health. |

### Authentication and profiles

| Method | Endpoint | Auth | What the caller provides / receives |
|---|---|---|---|
| `POST` | `/auth/signup` | Public | Sends account credentials, role, address, pincode, phone, and optional shop name. Creates an Auth user and profile. Returns `user_id`, email, role, and pincode. |
| `POST` | `/auth/login` | Public | Sends email and password. Returns a Supabase `access_token`, role, and `user_id`. |
| `GET` | `/auth/profiles/{user_id}` | Protected | Asks for one profile by UUID. Returns contact, business, preference, verification, and profile fields. |
| `PATCH` | `/auth/profiles/{user_id}` | Protected, owner only | Sends a JSON object containing profile fields to change. `id`, `role`, timestamps, computed transaction stats, and `is_verified` are ignored as immutable fields. |

### Buyer requests

| Method | Endpoint | Auth | What the caller provides / receives |
|---|---|---|---|
| `POST` | `/requests` | Protected, buyer only | Sends a new item request. Returns the created request. |
| `GET` | `/requests` | Protected | Optionally sends `status`, `pincode`, `category`, `limit`, and `offset`. Buyers see their own requests; shop owners browse requests. Returns newest-first requests with bid counts. |
| `GET` | `/requests/{request_id}` | Protected | Sends a request UUID. Returns request details; the buyer who owns it also receives its bids. |
| `PATCH` | `/requests/{request_id}` | Protected, buyer owner | Sends editable request fields. Updates an open request. |
| `DELETE` | `/requests/{request_id}` | Protected, buyer owner | Sends a request UUID. Soft-deletes the request by changing its status to `deleted`; it is not physically removed. |
| `PATCH` | `/requests/{request_id}/delivery` | Protected, buyer owner | Sends `delivery_method` (`home_delivery` or `pickup`) and optional `delivery_address` for a purchased request. Pickup is automatically marked as confirmed. |
| `PATCH` | `/requests/{request_id}/switch-to-pickup` | Protected, buyer owner | Sends only the request UUID. Changes a purchased home-delivery request to pickup and marks the delivery as confirmed. |
| `PATCH` | `/requests/{request_id}/delivery/confirm` | Protected, selected shop | Sends only the request UUID. Confirms home delivery for a purchased request. |
| `PATCH` | `/requests/{request_id}/delivery/deny` | Protected, selected shop | Sends only the request UUID. Denies home delivery for a purchased request so the buyer can switch to pickup. |
| `PATCH` | `/requests/{request_id}/verify` | Protected, buyer owner | Sends only the request UUID. Changes a purchased request to `completed`. This is the current one-click verification flow. |
| `GET` | `/requests/test-completed` | Protected | Development/test route for completed-request data. |

### Request bids

| Method | Endpoint | Auth | What the caller provides / receives |
|---|---|---|---|
| `POST` | `/requests/{request_id}/bids` | Protected, shop owner | Sends `price` and optional `note`. Creates one pending bid on an open request. |
| `GET` | `/requests/{request_id}/bids` | Protected | Sends a request UUID. The buyer sees all bids; a shop owner sees only that shop's bids. |
| `GET` | `/bids` | Protected | Optionally sends `request_id`. Returns the caller's bids according to role. |
| `GET` | `/bids/test` | Public | Development route that confirms the bids router is mounted. |
| `GET` | `/bids/{bid_id}` | Protected, owning shop only | Sends a bid UUID. Returns the bid with its request details. |
| `PATCH` | `/bids/{bid_id}` | Protected, owning shop only | Sends optional `price` and/or `note`. Updates a pending bid. |
| `DELETE` | `/bids/{bid_id}` | Protected, owning shop only | Sends a bid UUID. Withdraws a pending bid. |
| `PATCH` | `/bids/{bid_id}/select` | Protected, buyer owner | Sends a bid UUID. Selects the bid, marks the request purchased, and reveals the selected shop contact through the response. |
| `GET` | `/bids/{bid_id}/buyer` | Protected, owning shop only | Sends a selected bid UUID. Returns buyer/request contact details and records that contact was viewed. |
| `GET` | `/bids/stats` | Protected, shop owner | Sends no body. Returns pending, selected, rejected, completed, and total bid counts. |

### Auctions

| Method | Endpoint | Auth | What the caller provides / receives |
|---|---|---|---|
| `POST` | `/auctions` | Protected, shop owner | Sends auction details and creates an active auction. |
| `GET` | `/auctions` | Protected | Optionally sends `pincode`, `category`, `status`, `limit`, and `offset`. Returns active, sold, expired, cancelled, or all auctions. |
| `GET` | `/auctions/{auction_id}` | Protected | Sends an auction UUID. Returns auction details and bids. |
| `POST` | `/auctions/{auction_id}/bids` | Protected, buyer only | Sends `bid_amount`. Places a buyer bid on an active auction. |
| `DELETE` | `/auctions/{auction_id}` | Protected, owning shop only | Sends an auction UUID. Cancels an active auction. |

### Image uploads

| Method | Endpoint | Auth | What the caller provides / receives |
|---|---|---|---|
| `POST` | `/upload/single` | Protected | Sends one multipart form file named `file`. The file must be JPG, PNG, or WebP and no larger than 5 MB. Returns Cloudinary upload data. |
| `POST` | `/upload/multiple` | Protected | Sends multipart form files named `files`. Accepts up to five files, each no larger than 5 MB and limited to JPG, PNG, or WebP. Returns Cloudinary data and a count. |

## 3. Request Bodies

### Signup

```json
{
  "email": "buyer@example.com",
  "password": "password",
  "role": "buyer",
  "address": "Bhilai",
  "pincode": "490001",
  "phone": "9999999999",
  "shop_name": null
}
```

`role` must be `buyer` or `shop_owner`. `pincode` must contain exactly six digits. `shop_name` is used for shop owners.

### Create request

```json
{
  "item_name": "Laptop",
  "description": "Used or new laptop for office work",
  "budget_min": 30000,
  "budget_max": 50000,
  "pincode": "490001",
  "category": "electronics",
  "reference_url": null,
  "reference_image": null,
  "delivery_method": "home_delivery",
  "delivery_address": "Bhilai",
  "image_urls": []
}
```

Required values are `item_name`, `budget_min`, `budget_max`, and `pincode`. Both budgets must be greater than zero, and the maximum cannot be below the minimum.

### Create or update a request bid

```json
{
  "price": 42000,
  "note": "Includes one-year warranty"
}
```

`price` must be greater than zero. Only pending bids can be changed or withdrawn.

### Set delivery

```json
{
  "delivery_method": "home_delivery",
  "delivery_address": "Bhilai, Chhattisgarh"
}
```

The delivery endpoint is available only after the request is purchased. `pickup` does not require an address.

### Create auction

```json
{
  "item_name": "Gaming Monitor",
  "description": "27-inch monitor",
  "starting_price": 15000,
  "pincode": "490001",
  "category": "electronics",
  "end_time": "2026-09-01T18:00:00Z",
  "delivery_method": "pickup",
  "delivery_address": null,
  "image_urls": []
}
```

Required values are `item_name`, `starting_price`, `pincode`, and `end_time`. The delivery method must be `home_delivery` or `pickup`.

### Auction bid

```json
{
  "bid_amount": 17500
}
```

`bid_amount` must be greater than zero. The backend applies the auction's active-state and late-bid rules.

## 4. Typical Workflows

### Request purchase workflow

```text
POST /auth/signup or POST /auth/login
        |
        v
POST /requests
        |
        v
Shop: GET /requests -> POST /requests/{request_id}/bids
        |
        v
Buyer: GET /requests/{request_id}
        |
        v
PATCH /bids/{bid_id}/select
        |
        v
PATCH /requests/{request_id}/delivery
        |
        +--> Shop: PATCH /requests/{request_id}/delivery/confirm
        |       or /delivery/deny
        |
        +--> Buyer: PATCH /requests/{request_id}/switch-to-pickup
        |
        v
PATCH /requests/{request_id}/verify
```

### Auction workflow

```text
Shop: POST /auctions
        |
        v
Buyer: GET /auctions -> POST /auctions/{auction_id}/bids
        |
        v
Scheduled close-auctions function selects the highest bid
```

## 5. What the v2 Build Order Is Asking For Next

The companion roadmap is a build order, not a list of routes that all exist today. The major requested API additions after the current implementation are:

| Roadmap area | API/data work requested |
|---|---|
| Profile completion | Typed profile update contract, identity fields such as GST/phone or ID, immutable-field rules, and controlled contact reveal after matching. |
| OTP transaction completion | Add verification code and attempt fields to requests and auctions; generate the code at delivery/pickup readiness; add a shop code-submission endpoint; cap retries; add buyer override after the cap. |
| Reserve price | Add nullable `reserve_price` to auctions and prevent auto-sale when the highest bid does not meet it. |
| Transaction history | Add a user-facing history endpoint or page combining request and auction transactions with counts and totals. |
| In-app chat | Add conversations/messages storage, selection/winner triggers, realtime message delivery, moderation, rate limiting, report, and block routes. |
| Browse improvements | Add sort parameters, reports/flagging, and hide pending-flag listings from browse feeds. |
| Engagement | Add saved searches, favorites, and in-app notifications with unread counts. |
| Reliability and ML | Add shop reliability computation and later price suggestions, bid ranking, recommendations, demand forecasting, and fraud signals. |

### Current implementation gaps to keep visible

- OTP verification is planned but is not currently implemented. The available request completion route is the buyer-only one-click `PATCH /requests/{request_id}/verify`.
- Auction delivery confirmation and auction completion routes are planned in the companion document but are not currently registered in `mfx-core`.
- Chat, reports, saved searches, favorites, notifications, reliability scores, and transaction-history API routes are not currently registered.
- `GET /bids/stats` and `GET /requests/test-completed` are declared after dynamic `/{id}` routes in their modules. They may need route-order attention because a dynamic path can intercept those literal paths before the UUID validation occurs.

## 6. Frontend Route Map

Frontend routes are registered in `mfx-web/src/App.jsx` and are separate from the FastAPI API endpoints.

### Public

```text
/
/auth
```

### Buyer

```text
/buyer/dashboard
/buyer/post-request
/buyer/request/:id
/buyer/purchases
/buyer/edit-request/:id
/buyer/auctions
/buyer/auctions/browse
/buyer/auctions/:id
/buyer/profile
/buyer/profile/edit
```

### Shop owner

```text
/shop/dashboard
/shop/browse
/shop/my-bids
/shop/bid/:id
/shop/completed
/shop/auctions
/shop/auctions/post
/shop/auctions/my
/shop/auctions/:id
/shop/profile
/shop/profile/edit
```

## 7. Complete Source Folder Structure

This is the application and documentation tree. Generated dependencies, build output, Python virtual-environment contents, caches, and Supabase temporary metadata are intentionally omitted.

```text
marketflip/
├── LICENSE
├── README.md
├── mfx-core/
│   ├── __init__.py
│   ├── main.py
│   ├── requirements.txt
│   ├── test_code.py
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── dependencies.py
│   │   └── routes.py
│   ├── requests/
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   ├── schemas.py
│   │   └── services.py
│   ├── bids/
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   ├── schemas.py
│   │   └── services.py
│   ├── auctions/
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   ├── schemas.py
│   │   └── service.py
│   ├── routes/
│   │   └── upload.py
│   ├── supabase/
│   │   └── functions/
│   │       ├── close-auctions/
│   │       │   └── index.ts
│   │       └── expire-requests/
│   │           └── index.ts
│   └── utils/
│       ├── CleanupScript.py
│       ├── cloudinary_config.py
│       ├── debug_bid.py
│       └── seed_data.py
├── mfx-web/
│   ├── components.json
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.cjs
│   ├── README.md
│   ├── requirements.txt
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.js
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── icons.svg
│   │   └── shop_dsb.png
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── api/
│       │   └── client.js
│       ├── components/
│       │   ├── ImageCarousel.jsx
│       │   ├── LandingNavbar.jsx
│       │   ├── PageTransition.jsx
│       │   ├── backgrounds/
│       │   │   └── AnimatedBackground.jsx
│       │   ├── sections/
│       │   │   ├── AboutDev.jsx
│       │   │   ├── AnimatedTestimonials.jsx
│       │   │   ├── BentoFeatures.jsx
│       │   │   ├── FAQ.jsx
│       │   │   ├── Features.jsx
│       │   │   ├── Footer.jsx
│       │   │   ├── Hero.jsx
│       │   │   ├── HowItWorks.jsx
│       │   │   └── Testimonials.jsx
│       │   └── ui/
│       │       ├── button.jsx
│       │       └── card.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── hooks/
│       │   └── useCloudinary.js
│       ├── lib/
│       │   └── utils.js
│       ├── pages/
│       │   ├── Auth.jsx
│       │   ├── Landing.jsx
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   ├── buyer/
│       │   │   ├── AuctionDashboard.jsx
│       │   │   ├── AuctionDetail.jsx
│       │   │   ├── BrowseAuctions.jsx
│       │   │   ├── Dashboard.jsx
│       │   │   ├── EditRequest.jsx
│       │   │   ├── MyPurchases.jsx
│       │   │   ├── PostRequest.jsx
│       │   │   └── RequestDetail.jsx
│       │   ├── profile/
│       │   │   ├── Profile.jsx
│       │   │   ├── ProfileForm.jsx
│       │   │   └── ProfileLayout.jsx
│       │   └── shop/
│       │       ├── AuctionDashboard.jsx
│       │       ├── AuctionDetailShop.jsx
│       │       ├── BidDetail.jsx
│       │       ├── BrowseRequests.jsx
│       │       ├── CompletedTransactions.jsx
│       │       ├── Dashboard.jsx
│       │       ├── MyAuctions.jsx
│       │       ├── MyBids.jsx
│       │       └── PostAuction.jsx
│       └── styles/
│           └── auth.css
├── mfx-docs/
│   ├── mfx-codebase.md
│   ├── mfx-flows.md
│   ├── mfx-frontend.md
│   ├── v1/
│   │   ├── change_logs.md
│   │   ├── mfx-core-bids-module.md
│   │   ├── mfx-core-request-module.md
│   │   ├── mfx-poc-doc-v1.0.md
│   │   ├── mfx-poc-docs-0.1.md
│   │   └── mfx-supabase-docs.md
│   └── v2/
│       ├── change_logs.md
│       ├── mfx-Companion-v2.md
│       ├── mfx-v2-plans.md
│       ├── mfx-v2-route-endpoints.md
│       └── supabase_tables.md
└── supabase/
```

## 8. Interactive API Documentation

When the backend is running, FastAPI exposes generated documentation at:

```text
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/redoc
```

The generated OpenAPI page is the final runtime authority for response schemas and route registration. This document is the human-readable companion that explains the purpose and caller requirements.