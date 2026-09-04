# MarketFlip
### Reverse Marketplace — POC Documentation (Merged)

| | |
|---|---|
| **Product** | MarketFlip |
| **Repository** | `mfx-core` (backend) · `mfx-web` (frontend) · `mfx-docs` (documentation) |
| **Status** | POC Complete — Full Flow + Premium UI Redesign |
| **Category (v1)** | Electronics |
| **Owner** | Prateek |
| **Version** | 1.0 |
| **Last Updated** | August 11, 2026 |

---

## 1. Overview

Buyer posts what they want to buy → Shop owners bid with their price → Buyer picks the best fit → Contact is revealed → Delivery method chosen → Transaction verified/completed. No payments, no in-app chat — the app connects the two sides; the deal itself happens offline.

**Problem it solves:** offline price discovery is inefficient — buyer has no way to compare prices across local shops before visiting them. This flips the model: sellers compete for the buyer instead of the buyer hunting shop to shop.

**Geographic scope (POC):** Bhilai, Chhattisgarh only. Only shop owners registered with a Bhilai address can bid.

**Location matching:** address collected at signup for credential/verification. Matching between buyers and shop owners is done via **pincode** (6-digit).

---

## 2. Core Flow — COMPLETE (built + tested end-to-end)

### 2.1 User Journey (as built)

```mermaid
flowchart TD
    A[Landing Page] --> B{Signup / Login}
    B -->|Buyer| C[Buyer Dashboard]
    B -->|Shop Owner| D[Shop Dashboard]

    C --> E[Post Request]
    E --> F[Request: status = open]
    D --> G[Browse Open Requests]
    G --> H[Place Bid]
    H --> I[Bid: status = pending]

    F --> J[Buyer Views Bids - RequestDetail]
    I --> J
    J --> K[Buyer Selects a Bid]
    K --> L[Request: status = purchased]
    K --> M[Shop Contact Revealed to Buyer]

    L --> N[Buyer: My Purchases]
    N --> O[Select Delivery Method]
    O --> P[Verify Transaction]
    P --> Q[Request: status = completed]
    K --> R[Shop: BidDetail - buyer contact]
    Q --> S[Shop: CompletedTransactions]
```

### 2.2 Request Lifecycle (State Diagram — final)

```mermaid
stateDiagram-v2
    [*] --> open : buyer posts request
    open --> purchased : buyer selects a bid
    open --> deleted : buyer deletes manually
    open --> expired : cron, 7 days pass
    purchased --> completed : buyer verifies transaction
    purchased --> [*]
    completed --> [*]
    deleted --> [*]
    expired --> [*]
```

---

## 3. Roles

| Role | Can do |
|---|---|
| **Buyer** | Post request, view own requests (Open/Expired/Deleted tabs), view bids, select a bid, delete a request, edit open request, My Purchases (Selected → Verification → Completed), set delivery method, verify transaction |
| **Shop Owner** | Register with address, browse open requests, place bid, edit/withdraw pending bid, view own bids with status, view buyer contact on selected bid (BidDetail), view completed transactions, view bid stats (KPI cards) |

---

## 4. Screens (as built)

1. `Landing.jsx` — Hero, Features, HowItWorks, Testimonials, FAQ, AboutDev, Footer sections
2. `Auth.jsx` — combined Login/Signup with progressive 3-step signup (email/password → role/shop → contact details)
3. `buyer/Dashboard.jsx` — tabs: Open, Expired, Deleted
4. `buyer/PostRequest.jsx`
5. `buyer/RequestDetail.jsx` — bid list + select action + success card
6. `buyer/MyPurchases.jsx` — Selected → Verification → Completed flow, functional delivery + verify, persists on refresh
7. `buyer/EditRequest.jsx` — edit open request (item_name, description, budget, pincode, category, reference)
8. `shop/Dashboard.jsx` — KPI stat cards (Total/Pending/Selected/Rejected/Completed), nav buttons
9. `shop/BrowseRequests.jsx` — debounced pincode filters, closed-request indicators (purchased/completed), bid placement
10. `shop/MyBids.jsx` — bid list with status, clickable selected bids → BidDetail
11. `shop/BidDetail.jsx` — buyer contact, request + delivery details
12. `shop/CompletedTransactions.jsx` — completed transactions with buyer details

All screens built and functional, including delivery/verify/completed flow end-to-end, styled with the shadcn/ui + Tailwind + Framer Motion redesign. No remaining planned screens.

---

## 5. API Contract (as built)

Base URL: root (or `/api/v1`, per your FastAPI setup)
Auth: Bearer token (Supabase JWT) in `Authorization` header for all routes except signup/login.

| Method | Endpoint | Description | Auth | Status |
|--------|----------|-------------|------|--------|
| POST | `/auth/signup` | Register user | No | Built |
| POST | `/auth/login` | Login user | No | Built |
| GET | `/auth/profiles/{id}` | Get user profile | Yes | Built |
| POST | `/requests` | Create request | Buyer | Built |
| GET | `/requests?pincode=&category=&status=` | List requests (supports `status=all`, `completed`) | Any | Built |
| GET | `/requests/{id}` | Get request detail + bids | Any | Built |
| DELETE | `/requests/{id}` | Soft-delete request | Buyer | Built |
| PATCH | `/requests/{id}` | Update open request | Buyer | Built |
| PATCH | `/requests/{id}/delivery` | Update delivery method | Buyer | Built |
| PATCH | `/requests/{id}/verify` | Verify transaction → `completed` | Buyer | Built |
| POST | `/requests/{id}/bids` | Place bid | Shop | Built |
| GET | `/requests/{id}/bids` | Get bids for a request | Any | Built |
| GET | `/bids?request_id=` | Get all bids (role-scoped) | Any | Built |
| PATCH | `/bids/{id}` | Update pending bid | Shop | Built |
| DELETE | `/bids/{id}` | Withdraw pending bid | Shop | Built |
| PATCH | `/bids/{id}/select` | Select bid, reveal contact | Buyer | Built (enhanced) |
| GET | `/bids/{id}/buyer` | Get buyer details for selected bid | Shop | Built |
| GET | `/bids/stats` | Bid statistics for shop owner | Shop | Built |

### Sample: `PATCH /bids/{id}/select` (enhanced response, as built)
```json
{
  "bid_id": "uuid",
  "request_id": "uuid",
  "status": "selected",
  "selected_bid": {
    "id": "uuid",
    "price": 85000,
    "note": "Available in black, 1 year warranty",
    "status": "selected",
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

---

## 6. Database Schema (final, as built)

### `profiles`
```sql
id uuid PK, references auth.users(id)
role text check ('buyer','shop_owner')
shop_name text, nullable
address text
pincode text (6 chars)
phone text
created_at timestamptz default now()
```

### `requests`
```sql
id uuid PK default gen_random_uuid()
buyer_id uuid, FK -> profiles(id)
item_name text
description text, nullable
budget_min integer
budget_max integer
pincode text (6 chars)
category text default 'electronics'
reference_url text, nullable
reference_image text, nullable
status text default 'open', check ('open','purchased','completed','deleted','expired')
created_at timestamptz default now()
expires_at timestamptz default now() + 7 days
purchased_at timestamptz, nullable
completed_at timestamptz, nullable
selected_bid_id uuid, nullable, FK -> bids(id)
delivery_method text, nullable
delivery_address text, nullable
```

### `bids`
```sql
id uuid PK default gen_random_uuid()
request_id uuid, FK -> requests(id)
shop_id uuid, FK -> profiles(id)
price integer
note text, nullable
status text default 'pending', check ('pending','selected','rejected','withdrawn')
created_at timestamptz default now()
selected_at timestamptz, nullable
rejected_at timestamptz, nullable
withdrawn_at timestamptz, nullable
buyer_contact_viewed boolean default false
```

---

## 7. Project Structure

### Backend — `mfx-core` (FastAPI)
```
mfx-core/
├── main.py
├── config.py
├── auth/
│   ├── routes.py          # signup, login, profiles/{id}
│   └── dependencies.py    # get_current_user (JWT + role lookup)
├── requests/
│   ├── routes.py
│   ├── schemas.py
│   └── service.py
├── bids/
│   ├── routes.py
│   ├── schemas.py
│   └── service.py
├── supabase/
│   └── functions/
│       └── expire-requests/
│           └── index.ts    # Edge Function, daily cron 2 AM
└── requirements.txt
```

### Frontend — `mfx-web` (React + Vite)
```
mfx-web/src/
├── api/
│   └── client.js               # axios instance, Bearer header, 401 handling
├── components/
│   ├── ui/                     # shadcn/ui components (button, card, input...)
│   ├── backgrounds/
│   │   └── WaveBackground.jsx
│   ├── sections/                # Hero, Features, HowItWorks, Testimonials, FAQ, AboutDev, Footer
│   ├── LandingNavbar.jsx
│   └── Navbar.jsx
├── context/
│   └── AuthContext.jsx         # token/role/user_id, login/logout
├── pages/
│   ├── Landing.jsx              (done)
│   ├── Auth.jsx                 (done - combined login/signup, progressive steps)
│   ├── buyer/
│   │   ├── Dashboard.jsx        (done)
│   │   ├── PostRequest.jsx      (done)
│   │   ├── RequestDetail.jsx    (done)
│   │   ├── MyPurchases.jsx      (done)
│   │   └── EditRequest.jsx      (done)
│   └── shop/
│       ├── Dashboard.jsx        (done)
│       ├── BrowseRequests.jsx   (done)
│       ├── MyBids.jsx           (done)
│       ├── BidDetail.jsx        (done)
│       └── CompletedTransactions.jsx (done)
├── styles/
│   └── index.css                # Tailwind base + Ubuntu font
├── lib/
│   └── utils.js                 # cn() helper
├── App.jsx
└── main.jsx
```

---

## 8. Stack (Free Tier Only)

| Layer | Tool | Tier |
|---|---|---|
| Frontend | React 18 + Vite 5 → Vercel | Free |
| Backend | FastAPI → Render | Free |
| DB / Auth / Storage | Supabase | Free |
| Cron | Supabase `pg_cron` + Edge Function (`expire-requests`, daily 2 AM) | Free |
| Styling | Tailwind CSS + shadcn/ui | Free |
| Animation | Framer Motion 11 | Free |
| Icons | Lucide React | Free |
| Forms | React Hook Form | Free |
| HTTP | Axios (interceptors for auth token + 401 handling) | Free |

---

## 9. Design System

### 9.1 Color Palette

| Name | Hex | Usage |
|---|---|---|
| Peach | `#FFBE91` | Primary buttons, accents |
| Cream | `#FFDDB0` | Secondary accents |
| Soft Blue | `#CFEBFF` | Accent highlights |
| Light Cream | `#FFFCE1` | Background |
| Dark | `#1A1A2E` | Text |
| Background | `#F8F6F0` | Page background |
| Border | `#EEECE6` | Borders/dividers |

**Status colors:** Pending `#D4A000` · Selected `#2D7A3A` · Rejected `#B33A3A` · Completed `#2A6B9C`

### 9.2 Typography
Font: Ubuntu (Google Fonts, fallback `-apple-system, sans-serif`). Sizes `text-xs` (12px) through `text-4xl` (36px), weights 300–700.

### 9.3 Design Principles
Glass-morphism (`backdrop-blur-xl bg-white/80`) · subtle shadows with hover lift · 4px spacing grid · vector icons only (Lucide), no emojis.

### 9.4 Animation Patterns
Global spring transition (`stiffness: 400, damping: 25`). Staggered card fade-ups, hover scale on buttons, slide-in navbar, accordion height transitions (FAQ), fade-slide page transitions.

### 9.5 Responsive Breakpoints
`sm` 640px · `md` 768px · `lg` 1024px · `xl` 1280px — mobile-first grid/typography/spacing scaling throughout.

---

## 10. Known Gaps / Next Steps

Full buyer + shop flow, auto-expiry, filtering, badges, edit-request, and the shadcn/ui + Tailwind + Framer Motion redesign are all complete. No functional or visual gaps remain — POC is deployment-ready.

Next discussion: **deployment**.

---

## 11. Explicitly Out of Scope (POC)
Payments · In-app chat · Ratings/reviews · Shop verification · Push notifications · Multiple categories

---

## 12. Risk Assessment

| Risk | Type | Notes |
|---|---|---|
| Scope creep | Process | Transaction-completion flow (delivery/verify) and full redesign were added after original Core Flow lock — tracked to prevent further unchecked expansion pre-deployment. |
| Chicken-egg problem | Product | No shops → empty requests → buyers leave. Manually onboard 5–10 shops before opening to buyers. |
| No trust/verification | Product | Buyer can't verify a shop before contact reveal. Acceptable for POC. |
| Free-tier cold starts | Technical | Render/Supabase free tier sleeps — expect slow first load in demo. |
| No training data for ML feature | Data | Price-suggestion model has nothing to learn from until real closed requests exist. |

---

## 13. Setup Instructions

### Backend (`mfx-core`)
```bash
# activate venv
pip install -r requirements.txt
# create .env with: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
uvicorn main:app --reload
```

### Frontend (`mfx-web`)
```bash
npm install
npx shadcn-ui@latest init   # if components/ui not already present
npm run dev
# api/client.js / VITE_API_URL points to http://127.0.0.1:8000 by default
```

Production build: `npm run build && npm run preview`

---

## 14. Build Order (final)
1. Done — DB schema
2. Done — Auth + role redirect
3. Done — Landing/Auth (login+signup)
4. Done — Post request (buyer)
5. Done — Browse + bid (shop owner)
6. Done — Review + select bid (buyer)
7. Done — Contact reveal
8. Done — Delivery + verify + completed status
9. Done — Shop-side buyer contact + BidDetail + CompletedTransactions
10. Done — Auto-expire cron
11. Done — Pincode filter, bid badge, closed message, edit request
12. Done — Tailwind + shadcn/ui + Framer Motion visual redesign
13. Next — Deployment