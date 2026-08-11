# MarketFlip v0.1

## POC Documentation

> **Project:** MarketFlip\
> **Tagline:** *Flip How You Buy.*\
> **Document Version:** 2.0.0\
> **Project Status:** POC Complete · Live Deployment\
> **Last Updated:** August 11, 2026

------------------------------------------------------------------------

## Document Purpose

This document provides a complete technical and functional description
of **MarketFlip**, including its business model, system architecture,
technology stack, database design, API surface, frontend structure,
authentication model, user journeys, testing strategy, security
controls, deployment model, performance considerations, and future
roadmap.

The documentation is intended to be useful for:

-   Developers maintaining or extending the project
-   Reviewers evaluating the system architecture
-   Project stakeholders understanding the business workflow
-   Students preparing project reports or demonstrations
-   Future contributors onboarding to the codebase

------------------------------------------------------------------------

# 1. Executive Summary

## 1.1 What is MarketFlip?

**MarketFlip is a reverse marketplace platform connecting buyers with
local shop owners.**

Traditional marketplaces generally follow this pattern:

> **Seller → lists product → Buyer searches → Buyer purchases**

MarketFlip reverses the interaction:

> **Buyer → posts requirement → Shops compete → Buyer selects offer**

Instead of making a buyer visit multiple stores to compare prices, the
platform allows the buyer to publish a purchase requirement and receive
competitive offers from participating shop owners.

### Core Concept

``` text
                    TRADITIONAL MARKETPLACE

        ┌──────────┐       Search       ┌────────────┐
        │  BUYER   │ ─────────────────> │  SELLERS   │
        └──────────┘                     └────────────┘
             │                                  │
             └──────────── Purchase ────────────┘


                         MARKETFLIP

        ┌──────────┐      Requirement     ┌────────────┐
        │  BUYER   │ ───────────────────> │  MARKET    │
        └──────────┘                       └────────────┘
                                               │
                                      ┌────────┼────────┐
                                      ▼        ▼        ▼
                                   Shop A   Shop B   Shop C
                                      │        │        │
                                      └─── BIDS ┴────────┘
                                               │
                                               ▼
                                      ┌────────────────┐
                                      │ Buyer compares │
                                      │ and selects    │
                                      │ best offer      │
                                      └────────────────┘
```

## 1.2 Current Project Snapshot

  Area                Current State
  ------------------- -------------------------
  Project Type        Reverse marketplace
  Current Stage       POC complete
  Frontend            Live
  Backend API         Live
  Database            Supabase PostgreSQL
  Authentication      Supabase Auth / JWT
  Frontend Hosting    Vercel
  Backend Hosting     Render
  API Documentation   FastAPI Swagger/OpenAPI
  Primary Roles       Buyer, Shop Owner

## 1.3 Production Endpoints

  Resource             URL                                      Status
  -------------------- ---------------------------------------- --------
  Frontend             `https://marketflip-web.vercel.app`      Live
  Backend              `https://marketflip.onrender.com`        Live
  API Documentation    `https://marketflip.onrender.com/docs`   Live
  Supabase Dashboard   `https://app.supabase.com`               Live

------------------------------------------------------------------------

# 2. Business Problem

## 2.1 Problems With Traditional Local Shopping

Local product discovery can require substantial effort from buyers.

### Buyer-side problems

-   Visiting multiple stores to compare prices
-   Calling or messaging several sellers
-   Difficulty determining whether a quoted price is competitive
-   Time spent describing the same requirement repeatedly
-   Limited visibility into available local inventory

### Seller-side problems

-   Difficulty discovering nearby customers with active purchase intent
-   Reliance on walk-in traffic
-   Limited opportunity to compete directly for a requirement
-   Lack of a structured channel for responding to buyer demand

## 2.2 MarketFlip's Solution

MarketFlip changes the direction of the marketplace.

  -----------------------------------------------------------------------
  Traditional Approach                MarketFlip Approach
  ----------------------------------- -----------------------------------
  Buyer searches for sellers          Buyer publishes a requirement

  Buyer requests prices individually  Sellers submit bids

  Seller waits for customers          Seller actively competes

  Price comparison happens manually   Offers are presented together

  Contact details may be exchanged    Contact information is revealed
  early                               after selection

  Buyer does most of the discovery    Marketplace distributes the
  work                                requirement
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 3. Product Objectives

The POC is designed around five primary objectives.

### 3.1 Reduce Search Effort

A buyer should be able to describe a requirement once rather than
contacting multiple shops individually.

### 3.2 Encourage Price Competition

Multiple shop owners can submit competing offers against the same
requirement.

### 3.3 Improve Transparency

The buyer can compare available bids before selecting one.

### 3.4 Protect Contact Information

Contact information is not intended to be exposed before a bid is
selected.

### 3.5 Create a Local Marketplace Loop

``` mermaid
flowchart LR
    A[Buyer has requirement] --> B[Post request]
    B --> C[Local shops discover request]
    C --> D[Shops submit bids]
    D --> E[Buyer compares offers]
    E --> F[Buyer selects bid]
    F --> G[Contact information becomes available]
    G --> H[Transaction]
    H --> I[Buyer verifies completion]
    I --> J[Completed transaction]
```

------------------------------------------------------------------------

# 4. Core Value Proposition

``` text
┌───────────────────────────────────────────────────────────┐
│                    MARKETFLIP VALUE                       │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  TIME        → No shop-to-shop price hunting             │
│  MONEY       → Sellers compete for the buyer              │
│  CHOICE      → Multiple offers can be compared            │
│  PRIVACY     → Contact information is controlled           │
│  LOCAL       → Designed around nearby/local businesses     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 5. Functional Scope

## 5.1 Buyer Capabilities

A buyer can:

1.  Register an account
2.  Log in
3.  Create a purchase request
4.  Specify product details
5.  Specify a minimum and maximum budget
6.  Provide a pincode
7.  Specify a category
8.  Optionally provide reference URLs/images
9.  View available requests and bids
10. Compare bids
11. Select a bid
12. Manage delivery information
13. Verify transaction completion
14. View purchase history
15. Edit eligible requests
16. Delete requests

## 5.2 Shop Owner Capabilities

A shop owner can:

1.  Register as a shop owner
2.  Log in
3.  Browse open purchase requests
4.  Submit bids
5.  Add pricing notes
6.  Edit eligible bids
7.  Withdraw bids
8.  View bid statistics
9.  View selected buyer information when permitted
10. Manage completed transactions

------------------------------------------------------------------------

# 6. System Architecture

## 6.1 High-Level Architecture

``` mermaid
flowchart TB
    U1[Buyer Browser]
    U2[Shop Owner Browser]

    subgraph FE[Frontend - React + Vite]
        UI[Pages and UI Components]
        AUTHCTX[Authentication Context]
        API[Axios API Client]
    end

    subgraph BE[Backend - FastAPI]
        AUTH[Authentication Routes]
        REQ[Request Routes]
        BID[Bid Routes]
        SERVICE[Business Logic / Services]
    end

    subgraph DB[Supabase]
        SA[Supabase Auth]
        PG[(PostgreSQL)]
        RLS[Row Level Security]
    end

    U1 --> FE
    U2 --> FE
    FE --> API
    API --> AUTH
    API --> REQ
    API --> BID
    AUTH --> SERVICE
    REQ --> SERVICE
    BID --> SERVICE
    SERVICE --> SA
    SERVICE --> PG
    PG --> RLS
```

## 6.2 Deployment Architecture

``` mermaid
flowchart LR
    B[User Browser]
    V[Vercel<br/>React + Vite]
    R[Render<br/>FastAPI]
    S[Supabase<br/>Auth + PostgreSQL]

    B --> V
    V -->|HTTPS / REST API| R
    R -->|Database + Auth| S
```

## 6.3 Architecture Responsibilities

  Layer           Responsibility
  --------------- ------------------------------------
  Browser         User interaction
  React           UI rendering and client-side state
  React Router    Route navigation
  Axios           API communication
  FastAPI         API and business logic
  Pydantic        Request/response validation
  Supabase Auth   Identity and authentication
  PostgreSQL      Persistent application data
  RLS             Database-level access control
  Vercel          Frontend hosting
  Render          Backend hosting

------------------------------------------------------------------------

# 7. Technology Stack

## 7.1 Frontend

  Category       Technology             Purpose
  -------------- ---------------------- -------------------------------
  UI Framework   React 18.2.0           Component-based UI
  Build Tool     Vite 5.x               Development/build tooling
  Styling        Tailwind CSS 3.x       Utility-first styling
  Components     shadcn/ui              Reusable interface components
  Animation      Framer Motion 11.x     UI animations
  Icons          Lucide React           Iconography
  Routing        React Router DOM 6.x   Client-side routing
  HTTP           Axios 1.x              REST API communication
  Hosting        Vercel                 Production frontend

## 7.2 Backend

  Category               Technology        Purpose
  ---------------------- ----------------- ------------------------
  Language               Python 3.11+      Backend implementation
  Framework              FastAPI 0.104.0   REST API
  Validation             Pydantic          Input validation
  Database               PostgreSQL        Persistent storage
  Platform               Supabase          Database/Auth platform
  Authentication         Supabase Auth     Identity management
  Hosting                Render            Backend deployment
  Scheduled/Edge Layer   Supabase          Cron/edge capabilities

------------------------------------------------------------------------

# 8. Repository / Application Structure

A logical application structure is represented below:

``` text
MarketFlip/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingNavbar.jsx
│   │   │   └── sections/
│   │   │       ├── Hero.jsx
│   │   │       ├── Features.jsx
│   │   │       ├── HowItWorks.jsx
│   │   │       ├── Testimonials.jsx
│   │   │       ├── FAQ.jsx
│   │   │       ├── AboutDev.jsx
│   │   │       └── Footer.jsx
│   │   ├── pages/
│   │   ├── context/
│   │   └── api/
│   ├── package.json
│   └── .env
│
├── backend/
│   ├── routes/
│   │   ├── auth.py
│   │   ├── requests.py
│   │   └── bids.py
│   ├── services/
│   ├── schemas/
│   ├── main.py
│   └── .env
│
└── documentation/
    └── MarketFlip_Professional_Documentation.md
```

> The structure above represents the logical architecture documented for
> the project. Exact repository paths should be treated as
> implementation-dependent unless present in the source repository.

------------------------------------------------------------------------

# 9. Database Design

## 9.1 Entity Relationship Model

``` mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : owns
    PROFILES ||--o{ REQUESTS : creates
    PROFILES ||--o{ BIDS : places
    REQUESTS ||--o{ BIDS : receives
    REQUESTS ||--o| BIDS : selects

    PROFILES {
        uuid id PK
        text role
        text shop_name
        text address
        text pincode
        text phone
        timestamptz created_at
    }

    REQUESTS {
        uuid id PK
        uuid buyer_id FK
        text item_name
        text description
        integer budget_min
        integer budget_max
        text pincode
        text category
        text reference_url
        text reference_image
        text status
        timestamptz created_at
        timestamptz expires_at
        timestamptz purchased_at
        timestamptz completed_at
        uuid selected_bid_id FK
        text delivery_method
        text delivery_address
    }

    BIDS {
        uuid id PK
        uuid request_id FK
        uuid shop_id FK
        integer price
        text note
        text status
        timestamptz created_at
        timestamptz selected_at
        timestamptz rejected_at
        timestamptz withdrawn_at
        boolean buyer_contact_viewed
    }
```

## 9.2 Relationship Summary

  ------------------------------------------------------------------------
  Relationship                           Cardinality Meaning
  --------------------- ---------------------------- ---------------------
  User → Profile                                 1:1 Each authenticated
                                                     user has a profile

  Buyer → Requests                               1:N A buyer can create
                                                     multiple requests

  Shop → Bids                                    1:N A shop can place
                                                     multiple bids

  Request → Bids                                 1:N A request can receive
                                                     multiple bids

  Request → Selected                          1:0..1 A request may
  Bid                                                eventually select one
                                                     bid
  ------------------------------------------------------------------------

------------------------------------------------------------------------

# 10. Database Tables

## 10.1 `profiles`

  ------------------------------------------------------------------------
  Column            Type              Constraints        Purpose
  ----------------- ----------------- ------------------ -----------------
  `id`              UUID              PK, FK to          User identifier
                                      `auth.users.id`    

  `role`            TEXT              Required;          User role
                                      buyer/shop_owner   

  `shop_name`       TEXT              Nullable           Shop name

  `address`         TEXT              Required           Address

  `pincode`         TEXT              Required; 6        Location
                                      characters         

  `phone`           TEXT              Required           Contact number

  `created_at`      TIMESTAMPTZ       Required; default  Creation
                                      `now()`            timestamp
  ------------------------------------------------------------------------

## 10.2 `requests`

  -----------------------------------------------------------------------------
  Column               Type              Constraints       Purpose
  -------------------- ----------------- ----------------- --------------------
  `id`                 UUID              PK; generated     Request identifier
                                         UUID              

  `buyer_id`           UUID              FK to             Request owner
                                         `profiles.id`     

  `item_name`          TEXT              Required          Product name

  `description`        TEXT              Nullable          Product requirements

  `budget_min`         INTEGER           Required          Minimum budget

  `budget_max`         INTEGER           Required          Maximum budget

  `pincode`            TEXT              Required; 6       Buyer location
                                         characters        

  `category`           TEXT              Default           Product category
                                         `electronics`     

  `reference_url`      TEXT              Nullable          Product reference

  `reference_image`    TEXT              Nullable          Product image

  `status`             TEXT              Required; default Lifecycle state
                                         `open`            

  `created_at`         TIMESTAMPTZ       Required          Creation timestamp

  `expires_at`         TIMESTAMPTZ       Required          Expiration timestamp

  `purchased_at`       TIMESTAMPTZ       Nullable          Selection/purchase
                                                           time

  `completed_at`       TIMESTAMPTZ       Nullable          Completion time

  `selected_bid_id`    UUID              Nullable; FK to   Selected offer
                                         `bids.id`         

  `delivery_method`    TEXT              Nullable          Delivery option

  `delivery_address`   TEXT              Nullable          Delivery destination
  -----------------------------------------------------------------------------

## 10.3 `bids`

  ------------------------------------------------------------------------------
  Column                   Type              Constraints       Purpose
  ------------------------ ----------------- ----------------- -----------------
  `id`                     UUID              PK; generated     Bid identifier
                                             UUID              

  `request_id`             UUID              Required FK       Target request

  `shop_id`                UUID              Required FK       Shop owner

  `price`                  INTEGER           Required          Offered price

  `note`                   TEXT              Nullable          Additional offer
                                                               details

  `status`                 TEXT              Required; default Bid lifecycle
                                             `pending`         

  `created_at`             TIMESTAMPTZ       Required          Creation time

  `selected_at`            TIMESTAMPTZ       Nullable          Selection time

  `rejected_at`            TIMESTAMPTZ       Nullable          Rejection time

  `withdrawn_at`           TIMESTAMPTZ       Nullable          Withdrawal time

  `buyer_contact_viewed`   BOOLEAN           Default `FALSE`   Contact-view
                                                               state
  ------------------------------------------------------------------------------

------------------------------------------------------------------------

# 11. State Management and Lifecycles

## 11.1 Request Lifecycle

``` mermaid
stateDiagram-v2
    [*] --> open: Buyer creates request
    open --> purchased: Buyer selects bid
    purchased --> completed: Buyer verifies transaction
    open --> deleted: Buyer deletes request
    open --> expired: Expiry reached
    completed --> [*]
    deleted --> [*]
    expired --> [*]
```

### Request States

  State         Meaning
  ------------- -------------------------------
  `open`        Request is accepting bids
  `purchased`   Buyer selected a bid
  `completed`   Transaction has been verified
  `expired`     Request passed expiry date
  `deleted`     Buyer deleted request

## 11.2 Bid Lifecycle

``` mermaid
stateDiagram-v2
    [*] --> pending: Shop places bid
    pending --> selected: Buyer selects bid
    pending --> rejected: Buyer rejects bid
    pending --> withdrawn: Shop withdraws bid
    selected --> [*]
    rejected --> [*]
    withdrawn --> [*]
```

### Bid States

  State         Meaning
  ------------- ----------------------------
  `pending`     Waiting for buyer decision
  `selected`    Chosen by buyer
  `rejected`    Not selected
  `withdrawn`   Removed by shop owner

------------------------------------------------------------------------

# 12. Buyer User Journey

``` mermaid
flowchart TD
    A[Landing Page] --> B[Sign Up / Login]
    B --> C[Buyer Dashboard]
    C --> D[Post Request]
    D --> E[Request becomes OPEN]
    E --> F[Shops submit bids]
    F --> G[Buyer views bids]
    G --> H{Select a bid?}
    H -->|No| G
    H -->|Yes| I[Request becomes PURCHASED]
    I --> J[Purchase History]
    J --> K[Select Delivery Method]
    K --> L[Transaction]
    L --> M[Verify Transaction]
    M --> N[Request becomes COMPLETED]
```

## 12.1 Buyer Decision Point

The central decision in the buyer flow is:

``` text
             Available Bids
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
    Shop A      Shop B      Shop C
    ₹X          ₹Y          ₹Z
       │           │           │
       └───────────┼───────────┘
                   ▼
           Compare offers
                   │
                   ▼
             Select one bid
```

------------------------------------------------------------------------

# 13. Shop Owner User Journey

``` mermaid
flowchart TD
    A[Landing Page] --> B[Sign Up / Login]
    B --> C[Shop Dashboard]
    C --> D[Browse Open Requests]
    D --> E[Review Buyer Requirement]
    E --> F[Place Bid]
    F --> G[Bid = PENDING]
    G --> H[My Bids]

    H --> I{Buyer Decision}
    I -->|Selected| J[View Buyer Details]
    I -->|Rejected| K[Bid Rejected]
    I -->|Still Pending| L[Edit / Withdraw]
    L --> H
    J --> M[Contact Buyer]
    M --> N[Complete Transaction]
```

------------------------------------------------------------------------

# 14. Authentication and Authorization

## 14.1 Authentication Flow

``` mermaid
sequenceDiagram
    participant U as User
    participant FE as React Frontend
    participant API as FastAPI
    participant AUTH as Supabase Auth

    U->>FE: Login / Signup
    FE->>API: Authentication request
    API->>AUTH: Validate credentials
    AUTH-->>API: User identity / token
    API-->>FE: Access token + role
    FE->>FE: Store authentication state
    FE->>API: Protected API request
    API->>API: Validate token
    API-->>FE: Authorized response
```

## 14.2 Authentication Decision Tree

``` text
                 ┌───────────────┐
                 │ User accesses │
                 │ protected page│
                 └───────┬───────┘
                         ▼
                  ┌─────────────┐
                  │ Token exists│
                  │ and valid?  │
                  └──────┬──────┘
                    Yes  │  No
                         │
             ┌───────────┘
             ▼
     Access protected route

                         No
                         │
                         ▼
                Redirect to Auth
                         │
                         ▼
                   Login/Signup
                         │
                         ▼
                   Store token
                         │
                         ▼
                   Dashboard
```

## 14.3 Role-Based Authorization

  -----------------------------------------------------------------------
  Role                    Dashboard               Main Permissions
  ----------------------- ----------------------- -----------------------
  Buyer                   `/buyer/dashboard`      Create/manage requests,
                                                  view bids, select bids

  Shop Owner              `/shop/dashboard`       Browse requests,
                                                  place/manage bids, view
                                                  eligible buyer details

  Unauthenticated         `/` / `/auth`           Public landing page and
                                                  authentication
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 15. API Architecture

## 15.1 API Surface

The documented API is divided into three functional domains:

``` mermaid
pie title API Endpoints by Domain
    "Authentication" : 3
    "Requests" : 7
    "Bids" : 7
```

> Counts are derived from the endpoint inventory documented in this
> project specification.

## 15.2 Endpoint Inventory

  Domain     Method   Endpoint                    Auth
  ---------- -------- --------------------------- --------
  Auth       POST     `/auth/signup`              Public
  Auth       POST     `/auth/login`               Public
  Auth       GET      `/auth/profiles/{id}`       Yes
  Requests   POST     `/requests`                 Buyer
  Requests   GET      `/requests`                 All
  Requests   GET      `/requests/{id}`            All
  Requests   PATCH    `/requests/{id}`            Buyer
  Requests   DELETE   `/requests/{id}`            Buyer
  Requests   PATCH    `/requests/{id}/delivery`   Buyer
  Requests   PATCH    `/requests/{id}/verify`     Buyer
  Bids       POST     `/requests/{id}/bids`       Shop
  Bids       GET      `/requests/{id}/bids`       All
  Bids       GET      `/bids`                     All
  Bids       PATCH    `/bids/{id}`                Shop
  Bids       DELETE   `/bids/{id}`                Shop
  Bids       PATCH    `/bids/{id}/select`         Buyer
  Bids       GET      `/bids/{id}/buyer`          Shop
  Bids       GET      `/bids/stats`               Shop

------------------------------------------------------------------------

# 16. Authentication API

## 16.1 `POST /auth/signup`

Registers a new MarketFlip user.

### Request

``` json
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

### Response

**201 Created**

``` json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "buyer",
  "pincode": "110001"
}
```

------------------------------------------------------------------------

## 16.2 `POST /auth/login`

Authenticates an existing user.

### Request

``` json
{
  "email": "user@example.com",
  "password": "TestPass123!"
}
```

### Response

**200 OK**

``` json
{
  "access_token": "jwt_token_here",
  "role": "buyer",
  "user_id": "uuid"
}
```

------------------------------------------------------------------------

# 17. Request API

## 17.1 `POST /requests`

Creates a new buyer requirement.

### Request

``` json
{
  "item_name": "iPhone 15 Pro",
  "description": "Looking for new iPhone 15 Pro, 256GB",
  "budget_min": 80000,
  "budget_max": 100000,
  "pincode": "110001",
  "category": "electronics"
}
```

### Response

**201 Created**

``` json
{
  "id": "uuid",
  "buyer_id": "uuid",
  "item_name": "iPhone 15 Pro",
  "status": "open",
  "created_at": "2026-08-11T...",
  "expires_at": "2026-08-18T..."
}
```

## 17.2 `GET /requests`

Returns available requests.

### Query Parameters

  Parameter    Type      Default   Purpose
  ------------ --------- --------- ---------------------------
  `status`     string    `open`    Filter by lifecycle state
  `pincode`    string    None      Location filter
  `category`   string    None      Category filter
  `limit`      integer   100       Result count
  `offset`     integer   0         Pagination offset

### Example Response

``` json
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

------------------------------------------------------------------------

# 18. Bid API

## 18.1 `POST /requests/{id}/bids`

Allows a shop owner to submit an offer against a request.

### Request

``` json
{
  "price": 85000,
  "note": "Available in black, 1 year warranty"
}
```

### Response

**201 Created**

``` json
{
  "id": "uuid",
  "request_id": "uuid",
  "shop_id": "uuid",
  "price": 85000,
  "status": "pending",
  "created_at": "2026-08-11T..."
}
```

## 18.2 `PATCH /bids/{id}/select`

Selects a bid for a buyer's request.

### Response

**200 OK**

``` json
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

### Selection Event

``` mermaid
sequenceDiagram
    participant B as Buyer
    participant FE as Frontend
    participant API as FastAPI
    participant DB as PostgreSQL

    B->>FE: Select bid
    FE->>API: PATCH /bids/{id}/select
    API->>API: Validate buyer ownership
    API->>DB: Mark selected bid
    API->>DB: Update request status
    API->>DB: Update related bid states
    DB-->>API: Updated records
    API-->>FE: Selection + permitted contact data
    FE-->>B: Show finalized transaction state
```

------------------------------------------------------------------------

# 19. Frontend Documentation

## 19.1 Route Map

  ---------------------------------------------------------------------------------
  Page              Route                       Access            Purpose
  ----------------- --------------------------- ----------------- -----------------
  Landing           `/`                         Public            Product
                                                                  introduction

  Authentication    `/auth`                     Public            Login/signup

  Buyer Dashboard   `/buyer/dashboard`          Buyer             Manage buyer
                                                                  activity

  Post Request      `/buyer/post-request`       Buyer             Create
                                                                  requirement

  Request Detail    `/buyer/request/:id`        Buyer             View request and
                                                                  bids

  Purchases         `/buyer/purchases`          Buyer             Purchase history

  Edit Request      `/buyer/edit-request/:id`   Buyer             Modify request

  Shop Dashboard    `/shop/dashboard`           Shop              Shop activity

  Browse            `/shop/browse`              Shop              Discover requests

  My Bids           `/shop/my-bids`             Shop              Manage submitted
                                                                  bids

  Bid Detail        `/shop/bid/:id`             Shop              View bid
                                                                  state/details

  Completed         `/shop/completed`           Shop              Completed
                                                                  transactions
  ---------------------------------------------------------------------------------

## 19.2 Landing Page Components

  Component         Responsibility
  ----------------- -------------------------------
  `LandingNavbar`   Primary navigation
  `Hero`            Main product proposition
  `Features`        Feature presentation
  `HowItWorks`      Workflow explanation
  `Testimonials`    User review section
  `FAQ`             Frequently asked questions
  `AboutDev`        Developer/project information
  `Footer`          Global footer

------------------------------------------------------------------------

# 20. End-to-End Transaction Flow

The core MarketFlip transaction can be represented as a single pipeline:

``` text
┌──────────┐
│  BUYER   │
└────┬─────┘
     │
     │ 1. Create requirement
     ▼
┌──────────────┐
│   REQUEST    │
│    OPEN      │
└──────┬───────┘
       │
       │ 2. Shops discover
       ▼
┌───────────────────────────────┐
│        MULTIPLE BIDS          │
│                               │
│ Shop A → ₹85,000              │
│ Shop B → ₹87,500              │
│ Shop C → ₹84,500              │
└───────────────┬───────────────┘
                │
                │ 3. Compare
                ▼
         ┌──────────────┐
         │ BUYER SELECTS│
         │     BID      │
         └──────┬───────┘
                │
                │ 4. Finalize
                ▼
       ┌──────────────────┐
       │ REQUEST PURCHASED│
       └────────┬─────────┘
                │
                │ 5. Contact / delivery
                ▼
       ┌──────────────────┐
       │   TRANSACTION    │
       └────────┬─────────┘
                │
                │ 6. Verify
                ▼
       ┌──────────────────┐
       │ REQUEST COMPLETED│
       └──────────────────┘
```

------------------------------------------------------------------------

# 21. Contact Privacy Model

A key product rule is that buyer/seller contact information should be
exposed only after a bid is selected.

``` mermaid
flowchart LR
    A[Shop submits bid] --> B[Bid = pending]
    B --> C[Buyer compares bids]
    C --> D{Bid selected?}
    D -->|No| E[Contact remains restricted]
    D -->|Yes| F[Bid = selected]
    F --> G[Permitted contact details available]
```

This design reduces unnecessary exposure of personal contact information
during the bidding phase.

------------------------------------------------------------------------

# 22. Testing Strategy

## 22.1 API Test Matrix

  Test             Endpoint                     Expected Result
  ---------------- ---------------------------- -----------------
  Signup           `POST /auth/signup`          201 Created
  Login            `POST /auth/login`           200 OK
  Create Request   `POST /requests`             201 Created
  Get Requests     `GET /requests`              200 OK
  Place Bid        `POST /requests/{id}/bids`   201 Created
  Select Bid       `PATCH /bids/{id}/select`    200 OK

## 22.2 Frontend Test Matrix

  Area              Test            Expected
  ----------------- --------------- ----------------------------------
  Landing           Load page       All major sections render
  Authentication    Valid login     Dashboard redirect
  Authentication    Invalid login   Error shown
  Buyer Dashboard   Load requests   Requests displayed
  Post Request      Submit form     Request created
  Bid Management    View bids       Correct bids displayed
  Purchase          Select bid      Request moves to purchased state

## 22.3 Recommended Additional Tests

For future production hardening, the test suite should also cover:

-   Unauthorized API requests
-   Cross-role access attempts
-   Invalid UUIDs
-   Invalid pincodes
-   Negative or invalid prices
-   Budget range validation
-   Duplicate bids
-   Bid withdrawal rules
-   Request expiry
-   Selecting a bid on an expired request
-   Selecting a second bid after purchase
-   Concurrent bid selection
-   Database constraint violations
-   RLS policy enforcement

------------------------------------------------------------------------

# 23. Performance and Optimization

## 23.1 Documented Targets

  Metric                       Target Documented State
  ------------------------ ---------- ------------------
  First Contentful Paint      \< 1.5s Optimized
  Time to Interactive           \< 3s Optimized
  API response time          \< 200ms Optimized

> These values are documented project targets/status indicators. They
> should not be interpreted as independently benchmarked measurements
> unless a performance test report is added.

## 23.2 Optimization Techniques

  Optimization                      Purpose
  --------------------------------- ----------------------------------
  Route lazy loading                Reduce initial frontend bundle
  SVG icons                         Reduce image overhead
  Static asset caching              Improve repeat load performance
  API pagination                    Prevent oversized responses
  Efficient database queries        Reduce backend/database overhead
  Hardware-accelerated transforms   Improve animation rendering

------------------------------------------------------------------------

# 24. Security Architecture

## 24.1 Security Controls

  Control               Implementation
  --------------------- ------------------------------------------
  Authentication        JWT-based authentication
  Authorization         Role-based access
  Database protection   Supabase Row Level Security
  Input validation      Pydantic schemas
  CORS                  Restricted origins
  Secret management     Environment variables
  Contact privacy       Contact data exposed after bid selection

## 24.2 Example RLS Policies

### Profiles

``` sql
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);
```

### Requests

``` sql
CREATE POLICY "Buyers can insert their own requests"
ON requests
FOR INSERT
WITH CHECK (auth.uid() = buyer_id);
```

### Bids

``` sql
CREATE POLICY "Shop owners can insert their own bids"
ON bids
FOR INSERT
WITH CHECK (auth.uid() = shop_id);
```

## 24.3 Security Layers

``` mermaid
flowchart TB
    A[User]
    B[Frontend Route Protection]
    C[JWT Authentication]
    D[FastAPI Authorization]
    E[Pydantic Validation]
    F[Supabase RLS]
    G[(PostgreSQL)]

    A --> B --> C --> D --> E --> F --> G
```

Security should therefore not rely on the frontend alone. The backend
and database should independently enforce authorization boundaries.

------------------------------------------------------------------------

# 25. Environment Configuration

## 25.1 Backend

``` env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 25.2 Frontend

``` env
VITE_API_URL=https://marketflip.onrender.com
```

### Important

Environment files containing credentials or service-role keys should
never be committed to a public repository.

------------------------------------------------------------------------

# 26. Local Development

## 26.1 Backend

``` bash
uvicorn main:app --reload
```

The FastAPI development server provides interactive API documentation
through the standard FastAPI documentation endpoint.

## 26.2 Frontend

``` bash
npm run dev
```

## 26.3 Production Build

``` bash
npm run build
```

## 26.4 Vercel Deployment

``` bash
vercel --prod
```

## 26.5 Backend Deployment

``` bash
git push origin main
```

------------------------------------------------------------------------

# 27. Deployment Model

``` mermaid
flowchart TD
    DEV[Developer]
    GIT[Git Repository]
    VERCEL[Vercel]
    RENDER[Render]
    SUPA[Supabase]

    DEV --> GIT
    GIT --> VERCEL
    GIT --> RENDER
    RENDER --> SUPA
    VERCEL -->|API requests| RENDER
```

## Deployment Responsibilities

  Platform         Role
  ---------------- -------------------------------
  Git repository   Source control
  Vercel           Frontend deployment
  Render           FastAPI backend deployment
  Supabase         Authentication and PostgreSQL
  Browser          Client runtime

------------------------------------------------------------------------

# 28. API Request Lifecycle

``` mermaid
sequenceDiagram
    participant Client as Browser
    participant Router as React Router
    participant API as Axios Client
    participant FastAPI as FastAPI
    participant DB as Supabase PostgreSQL

    Client->>Router: Navigate / perform action
    Router->>API: Trigger API call
    API->>FastAPI: HTTPS request + auth token
    FastAPI->>FastAPI: Validate token
    FastAPI->>FastAPI: Validate request data
    FastAPI->>DB: Query / mutation
    DB-->>FastAPI: Result
    FastAPI-->>API: JSON response
    API-->>Client: Update UI
```

------------------------------------------------------------------------

# 29. Error Handling Model

A robust implementation should treat errors at multiple levels:

``` text
Client Input
    │
    ▼
Frontend Validation
    │
    ▼
HTTP Request
    │
    ▼
FastAPI Validation
    │
    ├── Invalid → 4xx response
    │
    ▼
Authorization
    │
    ├── Unauthorized → 401/403
    │
    ▼
Business Rules
    │
    ├── Invalid state → 4xx
    │
    ▼
Database Operation
    │
    ├── Database error → 5xx
    │
    ▼
JSON Response
```

Recommended production behavior includes consistent error schemas,
meaningful messages, server-side logging, and avoidance of sensitive
information in client-facing errors.

------------------------------------------------------------------------

# 30. Data Integrity Rules

The database model establishes several important integrity
relationships.

### User Identity

``` text
auth.users.id
      │
      ▼
profiles.id
```

### Request Ownership

``` text
profiles.id
      │
      ▼
requests.buyer_id
```

### Bid Ownership

``` text
profiles.id
      │
      ▼
bids.shop_id
```

### Bid-to-Request Relationship

``` text
requests.id
      │
      ▼
bids.request_id
```

These relationships prevent orphaned application records and provide the
foundation for role-based access enforcement.

------------------------------------------------------------------------

# 31. Functional Requirements

## Buyer Requirements

  ID      Requirement
  ------- -----------------------------------------------
  BR-01   Buyer must be able to register
  BR-02   Buyer must be able to authenticate
  BR-03   Buyer must be able to create a request
  BR-04   Buyer must be able to specify budget
  BR-05   Buyer must be able to specify location
  BR-06   Buyer must be able to view bids
  BR-07   Buyer must be able to select a bid
  BR-08   Buyer must be able to manage delivery details
  BR-09   Buyer must be able to verify completion

## Shop Requirements

  -----------------------------------------------------------------------
  ID                                  Requirement
  ----------------------------------- -----------------------------------
  SR-01                               Shop owner must be able to register

  SR-02                               Shop owner must be able to
                                      authenticate

  SR-03                               Shop owner must be able to browse
                                      requests

  SR-04                               Shop owner must be able to submit
                                      bids

  SR-05                               Shop owner must be able to manage
                                      eligible bids

  SR-06                               Shop owner must be able to view
                                      buyer details after selection

  SR-07                               Shop owner must be able to view
                                      completed transactions
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 32. Non-Functional Requirements

  -----------------------------------------------------------------------
  Category                            Requirement
  ----------------------------------- -----------------------------------
  Security                            Authentication and authorization
                                      must be enforced

  Privacy                             Contact details should not be
                                      exposed prematurely

  Scalability                         API/database design should support
                                      increasing request and bid volume

  Availability                        Frontend and backend are deployed
                                      as separate services

  Maintainability                     Functional areas are separated into
                                      routes/services/components

  Performance                         API and frontend optimization
                                      targets are defined

  Usability                           Buyer and shop workflows are
                                      separated by role
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 33. Current Project Status

  Component           Status
  ------------------- -------------
  Backend API         Live
  Frontend            Live
  Database            Connected
  Authentication      Working
  Buyer Flow          Complete
  Shop Flow           Complete
  Bid Management      Complete
  Request Lifecycle   Implemented
  POC                 Complete

------------------------------------------------------------------------

# 34. Known Product Evolution Areas

The existing POC establishes the central marketplace loop. The next
engineering stage should focus on production-grade automation, trust,
discovery, and transaction handling.

## Priority 1: Lifecycle Automation

-   Automatically expire requests after seven days
-   Automatically update expired request states
-   Improve state transition validation

## Priority 2: Discovery

-   Pincode-based request filtering
-   Advanced search
-   Category-specific discovery
-   Better sorting and filtering

## Priority 3: Communication

-   Email notifications
-   SMS notifications
-   Bid activity notifications
-   Transaction status notifications

## Priority 4: Trust

-   Shop ratings
-   Buyer reviews
-   Reputation scores
-   Verified shops
-   Transaction history

## Priority 5: Commerce

-   In-app payments
-   Payment status
-   Refund handling
-   Order tracking

## Priority 6: Intelligence

-   AI-assisted price suggestions
-   Bid ranking
-   Product matching
-   Personalized recommendations

------------------------------------------------------------------------

# 35. Product Roadmap

``` mermaid
flowchart LR
    P1["Phase 1<br/>Core Enhancements"] --> P2["Phase 2<br/>Feature Expansion"]
    P2 --> P3["Phase 3<br/>Scale & Intelligence"]

    P1 --> A["Auto-expiry"]
    P1 --> B["Pincode filtering"]
    P1 --> C["Bid count"]

    P2 --> D["Notifications"]
    P2 --> E["Ratings & Reviews"]
    P2 --> F["Search"]
    P2 --> G["Analytics"]

    P3 --> H["Mobile App"]
    P3 --> I["Payments"]
    P3 --> J["Multiple Categories"]
    P3 --> K["AI Price Suggestions"]
```

------------------------------------------------------------------------

# 36. Future Mobile Architecture

A future React Native application could reuse the existing backend:

``` mermaid
flowchart TB
    API[Existing FastAPI API]

    WEB[React Web]
    MOBILE[React Native Mobile]
    ADMIN[Future Admin Panel]

    WEB --> API
    MOBILE --> API
    ADMIN --> API

    API --> AUTH[Supabase Auth]
    API --> DB[(PostgreSQL)]
```

This preserves the backend business logic while allowing additional
client applications to be introduced.

------------------------------------------------------------------------

# 37. Future AI Price Suggestion Concept

The planned AI capability could eventually analyze:

``` text
Buyer Request
     │
     ├── Product category
     ├── Product name
     ├── Budget
     ├── Location
     └── Historical bids
             │
             ▼
       Pricing Model
             │
             ▼
    Suggested Bid Range
             │
             ▼
       Buyer / Shop UI
```

This feature is a future roadmap item and is not represented as a
currently deployed ML service in the documented POC.

------------------------------------------------------------------------

# 38. Observability Recommendations

For a production release, the following should be added:

  Area         Recommendation
  ------------ -----------------------------------
  API logs     Structured request/error logs
  Monitoring   Backend uptime monitoring
  Errors       Centralized exception tracking
  Database     Query and connection monitoring
  Frontend     Client-side error tracking
  Security     Authentication failure monitoring
  Business     Request/bid/selection metrics

Useful business metrics could include:

``` text
Requests Created
        │
        ▼
Requests Receiving Bids
        │
        ▼
Average Bids per Request
        │
        ▼
Selected Bids
        │
        ▼
Completed Transactions
```

------------------------------------------------------------------------

# 39. Suggested KPI Dashboard

A future admin dashboard can expose:

  KPI                    Description
  ---------------------- ----------------------------------------
  Total Users            Registered buyers + shops
  Active Requests        Requests currently accepting bids
  Total Bids             Number of submitted bids
  Avg. Bids/Request      Marketplace competition indicator
  Selection Rate         Requests that result in a selected bid
  Completion Rate        Purchased requests reaching completion
  Active Shops           Shops currently participating
  Average Bid Value      Average offer amount
  Requests by Category   Demand distribution
  Requests by Pincode    Geographic demand

------------------------------------------------------------------------

# 40. Documentation Glossary

  -----------------------------------------------------------------------
  Term                                Meaning
  ----------------------------------- -----------------------------------
  Reverse Marketplace                 Marketplace where buyers publish
                                      demand and sellers compete

  Request                             A buyer's requirement for a product

  Bid                                 A shop's offer against a request

  Buyer                               User looking to purchase a product

  Shop Owner                          Seller competing for buyer requests

  Selected Bid                        Bid chosen by the buyer

  Pincode                             Six-digit location identifier

  RLS                                 Row Level Security

  JWT                                 JSON Web Token used for
                                      authenticated requests

  POC                                 Proof of Concept

  API                                 Application Programming Interface

  CRUD                                Create, Read, Update, Delete
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 41. Quick Reference

## Production

``` text
Frontend:
https://marketflip-web.vercel.app

Backend:
https://marketflip.onrender.com

Swagger/OpenAPI:
https://marketflip.onrender.com/docs
```

## Core API Groups

``` text
/auth/*
/requests/*
/bids/*
```

## Core Roles

``` text
buyer
shop_owner
```

## Core Request States

``` text
open
purchased
completed
expired
deleted
```

## Core Bid States

``` text
pending
selected
rejected
withdrawn
```

------------------------------------------------------------------------

# 42. Final Architecture Summary

MarketFlip is structured around a clean three-layer web architecture:

``` text
                    ┌─────────────────────────┐
                    │       PRESENTATION      │
                    │                         │
                    │ React + Vite + Tailwind │
                    │ React Router + Axios     │
                    └────────────┬────────────┘
                                 │
                                 │ HTTPS / REST
                                 ▼
                    ┌─────────────────────────┐
                    │       APPLICATION       │
                    │                         │
                    │ FastAPI + Python        │
                    │ Routes + Services       │
                    │ Pydantic Validation     │
                    └────────────┬────────────┘
                                 │
                                 │ SQL / Auth
                                 ▼
                    ┌─────────────────────────┐
                    │          DATA           │
                    │                         │
                    │ Supabase Auth           │
                    │ PostgreSQL              │
                    │ RLS                     │
                    └─────────────────────────┘
```

The central business loop is:

``` text
BUYER
  │
  ▼
CREATE REQUEST
  │
  ▼
SHOPS DISCOVER REQUEST
  │
  ▼
SHOPS PLACE BIDS
  │
  ▼
BUYER COMPARES BIDS
  │
  ▼
BUYER SELECTS BID
  │
  ▼
CONTACT / DELIVERY
  │
  ▼
TRANSACTION
  │
  ▼
BUYER VERIFIES
  │
  ▼
COMPLETED
```

This architecture gives MarketFlip a straightforward foundation for
extending the POC into a larger marketplace platform without changing
the fundamental buyer-driven bidding model.

------------------------------------------------------------------------

# Appendix A: API Status Code Reference

    Status Typical Meaning
  -------- ---------------------------------
       200 Successful operation
       201 Resource created
       400 Invalid request
       401 Authentication required/invalid
       403 Authenticated but not permitted
       404 Resource not found
       409 State/conflict condition
       422 Validation error
       500 Internal server error

------------------------------------------------------------------------

# Appendix B: Development Checklist

## Before committing

-   [ ] Environment secrets excluded
-   [ ] API endpoint tested
-   [ ] Authentication tested
-   [ ] Buyer authorization tested
-   [ ] Shop authorization tested
-   [ ] Request lifecycle tested
-   [ ] Bid lifecycle tested
-   [ ] Contact privacy tested
-   [ ] Invalid input tested
-   [ ] Database constraints verified

## Before deployment

-   [ ] Frontend production build succeeds
-   [ ] Backend starts correctly
-   [ ] Environment variables configured
-   [ ] CORS origins verified
-   [ ] Supabase RLS policies enabled
-   [ ] API health endpoint responds
-   [ ] Frontend can reach backend
-   [ ] Authentication works in production
-   [ ] Core buyer flow tested
-   [ ] Core shop flow tested

------------------------------------------------------------------------

# Appendix C: Version History

  -----------------------------------------------------------------------
  Version                 Date                    Description
  ----------------------- ----------------------- -----------------------
  1.0.0                   Aug 11, 2026            Initial project
                                                  documentation

  2.0.0                   Aug 11, 2026            Expanded professional
                                                  documentation with
                                                  architecture diagrams,
                                                  ERD, state diagrams,
                                                  sequence diagrams, API
                                                  documentation,
                                                  requirements, security,
                                                  deployment, testing,
                                                  and roadmap
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## Project Status

**MarketFlip --- Flip How You Buy.**

**Current Status:** POC Complete · Live

**Documentation Version:** 2.0.0

**Last Updated:** August 11, 2026


## License

Copyright © 2026 Prateek Saha

Licensed under the Apache License, Version 2.0.
See the [LICENSE](LICENSE) file for details.