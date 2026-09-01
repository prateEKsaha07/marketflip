# MarketFlip

MarketFlip is a reverse marketplace for local commerce. Buyers publish what they need and receive competitive offers from nearby shop owners. The platform also supports shop-created auctions with live bidding.

## Current Status

- Buyer and shop-owner workflows are available.
- Request, bid, delivery, and auction APIs are implemented in FastAPI.
- Supabase PostgreSQL and Supabase Auth provide persistence and authentication.
- Cloudinary handles request image uploads.
- Frontend and backend are deployed on Vercel and Render.

## Features

### Buyers

- Register and authenticate with role-based access.
- Create, edit, browse, and manage purchase requests.
- Set categories, budgets, location, delivery preferences, and reference images.
- Compare shop bids and select an offer.
- View buyer purchases and verify completed transactions.
- Browse auctions, place bids, and review bid history.

### Shop Owners

- Browse open buyer requests by category and location.
- Submit, edit, and withdraw bids with pricing notes.
- View bid details and buyer information after selection.
- Confirm or deny home delivery and manage completed transactions.
- Create, manage, and cancel auctions.
- Review auction bids and current highest bidders.

### Platform

- JWT authentication through Supabase Auth.
- PostgreSQL row-level security policies.
- Request lifecycle and event tracking.
- Delivery confirmation and pickup fallback flow.
- Multi-image upload with validation and carousel viewing.
- Auction closing with sniping prevention and a scheduled Supabase Edge Function.
- FastAPI startup checks for Supabase and Cloudinary configuration.

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Framer Motion, Axios, Lucide React |
| Backend | Python, FastAPI, Pydantic, Uvicorn |
| Data and auth | Supabase Auth, PostgreSQL, Row Level Security |
| Media | Cloudinary |
| Hosting | Vercel (frontend), Render (backend) |

## Repository Structure

```text
marketflip/
├── mfx-core/
│   ├── auth/                 Authentication routes and dependencies
│   ├── requests/             Purchase request routes, schemas, and services
│   ├── bids/                 Bid routes, schemas, and services
│   ├── auctions/             Auction routes, schemas, and service layer
│   ├── routes/upload.py      Cloudinary upload endpoints
│   ├── supabase/functions/   Scheduled request and auction functions
│   └── main.py               FastAPI application entry point
├── mfx-web/
│   └── src/
│       ├── api/              API client
│       ├── components/       Shared and landing-page components
│       ├── context/          Authentication context
│       ├── pages/buyer/      Buyer dashboards and workflows
│       ├── pages/shop/       Shop-owner dashboards and workflows
│       └── hooks/            Client-side upload and utility hooks
├── mfx-docs/                 Product and technical documentation
└── supabase/                 Database project configuration
```

## Local Development

### Backend

Requires Python 3.11+ and environment variables for Supabase and Cloudinary.

```powershell
cd mfx-core
..\mfx\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

The API is available at `http://localhost:8000`. Interactive documentation is available at `http://localhost:8000/docs`.

### Frontend

```powershell
cd mfx-web
npm install
npm run dev
```

The development client is available at `http://localhost:5173`.

Available frontend checks:

```powershell
npm run lint
npm run build
```

## Production Endpoints

- Frontend: <https://marketflip-mauve.vercel.app>
- Backend: <https://marketflip.onrender.com>
- API documentation: <https://marketflip.onrender.com/docs>

## Project Documentation & Roadmap
Our complete architecture specs, database schemas, and version roadmaps are live in Notion:
**[View MarketFlip HQ Master Workspace (Read-Only)](https://emphasized-citrus-c5e.notion.site/MarketFlip-HQ-3cebcc73368d80b48018e8fd77c12461?source=copy_link)**

## License

Copyright © 2026 Prateek Saha. Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.
