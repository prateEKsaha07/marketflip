# MarketFlip

> **PROJECT STATUS: PAUSED**

---

## Notice: Development is on Hold

Alright, here's the situation.

MarketFlip's development is temporarily paused. Not dead, not abandoned, just taking a nap.

**Why?** Because I'm a broke developer and Supabase's free tier only allows **two projects at once**. I needed that second slot for a new project I'm building, which, funny enough, is basically a **way upgraded version of MarketFlip**. So MarketFlip got politely asked to step aside and hold my coffee while I work on its cooler sibling.

**Couldn't I just pay for Supabase Premium?** No. My bank account laughed at me. So here we are.

**What this means for you (the curious visitor):**

| Can I... | Status |
| --- | --- |
| Visit the Vercel landing page | Yes, go wild |
| See how it works | Yes |
| Read the code or inspect the deployed frontend as reference | Absolutely |
| Log in | No. Auth ran on Supabase, which is currently napping |
| Yell at me to fix it faster | Sure, but it won't speed things up |

I'll be looking into **alternative services** for auth and/or data as soon as I can scrape together the time and/or money. Until then, MarketFlip is **on pause**. Think of it as a museum exhibit. Beautiful, functional-looking, but please don't touch the login button.

Thanks for your patience.

---

## What is MarketFlip?

MarketFlip is a **reverse marketplace** for local commerce. Instead of shops listing products and hoping buyers show up, **buyers publish what they need**, and nearby shop owners send in **competitive offers**. Think of it as "Uber, but for haggling with your local shopkeeper."

The platform also supports **shop-created auctions with live bidding**, because why not add a little adrenaline to buying a blender.

---

## Current Status (as it was before the pause)

- Buyer and shop-owner workflows are available.
- Request, bid, delivery, and auction APIs are implemented in FastAPI.
- Supabase PostgreSQL and Supabase Auth provide persistence and authentication.
- Cloudinary handles request image uploads.
- Frontend and backend are deployed on Vercel and Render.

> **Note:** The information below describes the project as it was **before the pause**. Code is intact; just the live auth is offline.

---

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

---

## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Framer Motion, Axios, Lucide React |
| Backend | Python, FastAPI, Pydantic, Uvicorn |
| Data and auth | Supabase Auth, PostgreSQL, Row Level Security |
| Media | Cloudinary |
| Hosting | Vercel (frontend), Render (backend) |

---

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
├── mfx-docs/                 Product and technical documentation (see below)
└── supabase/                 Database project configuration
```

---

## Documentation

Detailed product specs, architecture notes, database schemas, and version roadmaps live in the **`mfx-docs/`** folder in this repo. That's your best source of truth.

There's also a Notion workspace below, but heads up, it's **not actively maintained**:

**[View MarketFlip HQ Master Workspace (Read-Only)](https://emphasized-citrus-c5e.notion.site/MarketFlip-HQ-3cebcc73368d80b48018e8fd77c12461?source=copy_link)**

> TL;DR: If the Notion and `mfx-docs/` disagree, trust `mfx-docs/`.

---

## Local Development

### Backend

Requires Python 3.11+ and environment variables for Supabase and Cloudinary.

```powershell
cd mfx-core
..\mfx\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

- API: `http://localhost:8000`
- Interactive docs: `http://localhost:8000/docs`

### Frontend

```powershell
cd mfx-web
npm install
npm run dev
```

- Dev client: `http://localhost:5173`

Available frontend checks:

```powershell
npm run lint
npm run build
```

---

## Production Endpoints

- **Frontend:** <https://marketflip-mauve.vercel.app>
- **Backend:** <https://marketflip.onrender.com>
- **API docs:** <https://marketflip.onrender.com/docs>

> **Login is disabled** on the deployed frontend while Supabase is paused. You can still browse the landing page, poke around the UI, and inspect the code. Just don't expect the login button to do anything dramatic.

---

## Roadmap (When It Wakes Up)

Once I sort out an alternative auth/data service, or win the lottery, MarketFlip will resume development. Priorities:

1. Migrate or replace Supabase Auth so logins work again.
2. Resume feature work per the roadmap in `mfx-docs/`.
3. Possibly merge learnings from the newer "upgraded sibling" project back into MarketFlip.

Until then: on hold.

---

## License

Copyright © 2026 Prateek Saha. Licensed under the **Apache License, Version 2.0**. See [LICENSE](LICENSE) for details.

---

*Built with caffeine, stubbornness, and an unreasonable love for marketplaces.*