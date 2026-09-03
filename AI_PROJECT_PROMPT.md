# MarketFlip: Project Context Prompt

You are working on **MarketFlip**, a reverse marketplace for local commerce.
Understand the project below before answering questions or changing code.

## Product

MarketFlip changes the normal marketplace flow:

```text
Traditional marketplace: Buyer searches shops -> compares products -> contacts sellers
MarketFlip: Buyer posts a requirement -> local shops compete with bids -> buyer selects an offer
```

The platform connects buyers and local shop owners. It does not process payments or replace the final offline transaction. The buyer describes what they need, shops submit competitive offers, and the selected parties arrange pickup or delivery themselves.

The original proof of concept is focused on Bhilai, Chhattisgarh, India. Pincode is the main location-matching field and is stored as a six-digit string.

## Repository Layout

The repository is split into these main areas:

```text
marketflip/
├── mfx-core/       Python FastAPI backend
├── mfx-web/        React and Vite frontend
├── mfx-docs/       Product, architecture, API, database, roadmap, and version docs
├── supabase/       Supabase project metadata/configuration
├── mfx/            Local Python virtual environment; generated dependency files
├── README.md       Repository overview and setup
└── LICENSE         Apache License 2.0
```

Do not treat `mfx/`, `node_modules/`, `.env` files, `.temp/` metadata, `dist/`, caches, or binary model/assets as application source.

## Technology Stack

- Backend: Python 3.11+, FastAPI, Pydantic, Uvicorn, Supabase Python client.
- Authentication and persistence: Supabase Auth, PostgreSQL, and Row Level Security.
- Media: Cloudinary for image uploads.
- Frontend: React, Vite, React Router, Axios, Tailwind CSS, Framer Motion, Lucide React, and shadcn-style UI components.
- Scheduled jobs: Supabase Edge Functions using TypeScript/Deno.
- Machine learning: pandas, scikit-learn, joblib, association rules, forecasting, ranking, and fraud-detection prototypes.
- Hosting: frontend on Vercel and backend on Render.

## Backend Architecture

The backend entry point is `mfx-core/main.py`. It creates the FastAPI app, configures CORS, imports route modules, registers routers, performs startup checks for Supabase and Cloudinary, and exposes `/` and `/health`.

Backend modules are organized by domain:

- `auth/`: signup, login, profile lookup, JWT authentication, and role dependencies.
- `requests/`: buyer purchase requests, request listing/detail, editing, deletion, delivery, verification, and request lifecycle logic.
- `bids/`: shop bids, bid editing/withdrawal, bid selection, buyer contact access, and shop statistics.
- `auctions/`: shop-created auctions, auction browsing, bidding, history, and closing behavior.
- `chat/`: conversations and messages that become available after an eligible transaction or auction result.
- `favorites/`: saving and managing favorite requests/items.
- `notifications/`: notification endpoints and services.
- `reports/`: reporting users or marketplace content.
- `saved_searches/`: saved search filters and related services.
- `reliability/`: shop reliability calculations and badges.
- `ml/`: prediction endpoints, model implementations, data loading, training, and tests.
- `routes/upload.py`: Cloudinary image upload endpoints.
- `utils/`: Cloudinary configuration, seed data, cleanup, debugging, and verification utilities.
- `supabase/functions/`: scheduled Edge Functions for expiring requests and closing auctions.

Use the existing route/schema/service separation. Route handlers should validate input and coordinate the domain service; service code should own business rules and persistence operations.

## Frontend Architecture

The frontend lives in `mfx-web/src`.

- `main.jsx` bootstraps the application.
- `App.jsx` defines application routing and protected role-based routes.
- `context/AuthContext.jsx` stores the authenticated user, token, role, and user ID using local storage.
- `api/client.js` owns the Axios client, API base URL, bearer-token interceptor, and 401 cleanup.
- `components/` contains shared UI, navigation, backgrounds, image carousels, notifications, reports, saved searches, favorites, chat, ML widgets, and landing-page sections.
- `pages/` contains authentication, landing, buyer, shop, profile, chat, and transaction-history screens.
- `styles/`, `index.css`, and `App.css` contain global and feature styling.
- `hooks/` contains reusable chat and Cloudinary upload behavior.

The UI supports buyer and shop-owner dashboards, responsive layouts, animated transitions, image handling, auctions, chat, notifications, reliability indicators, and ML insight components. Preserve the established Tailwind/shadcn visual language when modifying existing screens.

## Roles and Permissions

There are two primary roles. One account has one role.

### Buyer

- Register and log in.
- Create, edit, browse, and delete eligible purchase requests.
- Set item details, category, budget range, pincode, delivery preference, reference URL, and images.
- View bids on their own requests.
- Compare bids and select one.
- View purchases and selected shop details.
- Choose delivery or pickup and verify completed transactions.
- Browse auctions, place eligible bids, view auction history, favorites, saved searches, notifications, chat, and profile data where supported.

### Shop Owner

- Register with shop/contact information.
- Browse open buyer requests, normally filtered by category and pincode.
- Submit, edit, and withdraw eligible bids.
- View their bids and selected-bid details.
- Access buyer contact details only after their bid is selected or another business rule explicitly unlocks access.
- Manage delivery/transaction follow-up and completed transactions.
- Create and manage auctions, review auction bids, and see finalized results.

## Core Buyer Request and Bid Flow

The primary request lifecycle is:

```text
Buyer creates request
  -> request.status = open
Shop owners browse matching open requests
  -> shops submit bids with price and optional note
Buyer views and compares bids
  -> buyer selects one bid
Selected bid.status = selected
Other active bids become rejected
Request.status = purchased
  -> selected parties receive the permitted contact information
Buyer chooses delivery/pickup and completes verification
  -> request.status = completed
```

Other request states are `deleted` and `expired`. Open requests may be edited or deleted by their owner. A scheduled job expires open requests after their expiration time, currently intended to be seven days after creation.

Critical privacy rule: buyer and shop contact information must remain restricted before bid selection. Never expose private contact fields merely because a user can view a public request or submit a bid.

## Auctions

Auctions are a second marketplace flow initiated by shops:

```text
Shop creates auction -> buyers browse active auction -> buyers place bids
-> auction ends -> highest eligible bid is determined
-> auction is finalized/expired -> permitted transaction/chat access is unlocked
```

The `close-auctions` Supabase Edge Function finds active auctions past `end_time`, determines the winning bid, respects reserve-price behavior, processes results in bounded batches, retries backend calls, and records close events when supported. It includes a fallback path for unlocking auction-related chat transactions. Preserve idempotency when changing auction closing logic.

## Main Data Model

The central tables are:

- `profiles`: user ID linked to `auth.users`, role, shop name, address, pincode, phone, and profile metadata.
- `requests`: buyer ID, item name, description, budget minimum/maximum, pincode, category, reference URL/image(s), lifecycle status, timestamps, selected bid, delivery method/address, and completion fields.
- `bids`: request ID, shop ID, price, note, status, timestamps, and contact-visibility fields.
- `auctions` and `auction_bids`: shop-created auctions and buyer offers.
- `request_events`: immutable activity/event history such as viewed, bid placed, selected, purchased, expired, completed, deleted, rejected, and withdrawn.
- Supporting domains may use conversations, messages, notifications, favorites, saved searches, reports, reliability, and transaction-related tables.
- The v2 design also documents categories and structured category field schemas.

Supabase Row Level Security is part of the security model. Policies must enforce ownership and role boundaries in addition to backend checks. Do not solve authorization only in the frontend.

## API Surface

Important backend endpoints include:

- `POST /auth/signup`, `POST /auth/login`, `GET /auth/profiles/{id}`
- `POST /requests`, `GET /requests`, `GET /requests/{id}`, `PATCH /requests/{id}`, `DELETE /requests/{id}`
- `PATCH /requests/{id}/delivery`, delivery confirmation/denial, pickup switching, and transaction verification endpoints
- `POST /requests/{id}/bids`, `GET /requests/{id}/bids`
- `GET /bids`, `PATCH /bids/{id}`, `DELETE /bids/{id}`, `PATCH /bids/{id}/select`, `GET /bids/{id}/buyer`, `GET /bids/stats`
- Auction, chat, notification, favorite, report, saved-search, reliability, upload, and ML routes registered by `main.py`.

The frontend normally talks to `http://127.0.0.1:8000` in development and uses `VITE_API_URL` or the deployed Render API in production. Authenticated requests use `Authorization: Bearer <Supabase JWT>`.

## ML Module

The ML code is a prototype layer, not the source of truth for marketplace authorization or transaction state.

- Price suggestion estimates a suitable price from request data such as budget, category, and pincode.
- Bid ranking combines price quality with shop reliability.
- Recommendations use association-style item/category relationships.
- Demand forecasting estimates upcoming demand from request events.
- Fraud detection scores suspicious bid behavior.
- `train.py` trains supported models and saves model artifacts; `test_ml.py` exercises the ML components.

Predictions must be treated as advisory. They must not bypass permissions, reveal private data, or make irreversible business decisions without the existing domain rules.

## Configuration and Local Commands

Backend setup:

```powershell
cd mfx-core
..\mfx\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend setup:

```powershell
cd mfx-web
npm install
npm run dev
npm run lint
npm run build
```

Required secrets/configuration are supplied through environment variables and must never be committed or pasted into prompts. Backend configuration includes Supabase URL/anonymous key/service-role key and Cloudinary credentials. Frontend configuration includes the Supabase URL/anon key and optional API URL.

## Engineering Rules for Future Changes

1. First identify the owning route, service, component, or state transition. Make the smallest change at that boundary.
2. Preserve existing public API shapes, route names, status values, and role semantics unless the task explicitly requires a migration.
3. Enforce authorization on the backend and database RLS; frontend route guards are only a usability layer.
4. Keep private contact data hidden until the selection/unlock condition is satisfied.
5. Validate request and bid state transitions server-side and make scheduled/retryable operations idempotent.
6. Reuse existing helpers, API client behavior, UI primitives, and styling patterns before adding abstractions.
7. Do not include secrets, local environment files, virtual environments, dependency directories, generated builds, or binary model files in an AI context prompt.
8. After a code change, run the narrowest relevant test, lint, build, or type/syntax check, then report any unrelated existing failures separately.
9. Treat documentation under `mfx-docs` as valuable product history, but verify historical claims against the current source before changing behavior.

## How to Respond to Tasks

When asked to modify this project, briefly state which current code path controls the behavior, implement the focused change, validate it, and summarize changed files plus verification. When requirements conflict with the existing implementation or documentation, call out the conflict and prefer the live code and explicit task requirement over stale historical documentation.