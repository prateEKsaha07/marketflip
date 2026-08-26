# MarketFlip v2
### Future Development Roadmap — Living Document

| | |
|---|---|
| **Product** | MarketFlip v2 |
| **Status** | Planning |
| **Base** | Builds on POC v1.0 (deployed, live) |
| **Owner** | Prateek |
| **Purpose** | Expand into a data-rich, ML-capable marketplace; resume-grade DS/ML project |
| **Started** | August 12, 2026 |
| **Note** | This is a living doc — edit as we go, don't treat as locked scope like the POC docs |

---

## 1. Motivation

- POC (v1.0) is live and functionally complete — reverse marketplace: buyer posts, shop bids, buyer selects.
- Goal now: add ML features for resume value (data science/ML focus), deepen data capture, expand beyond electronics, and add a second core flow (seller-initiated auctions).
- v1.0 locked-scope discipline still applies loosely — track each addition here instead of letting scope drift undocumented.

---

## 2. Planned Feature Areas

### 2.1 Profile Module Expansion
Richer buyer/shop profiles — both UX value (Amazon-style profiles) and ML feature-generation value.

**Buyer additions:** preferences/interests, purchase history rollup, avg budget range, saved searches, favorites.
**Shop additions:** business hours, years in business, categories sold, avg response time, reliability score, total/completed transaction counts.

### 2.2 ML Features (priority order)
1. **Price suggestion** — regression, predicts fair price range from category + budget + historical bid data
2. **Bid ranking/recommendation** — rank bids by price + shop reliability, not just lowest price
3. **Shop reliability score** — composite: response time, completion rate, selection rate
4. **Demand forecasting** — predict high-demand categories/items by pincode (time-series)
5. **Fraud/spam detection** — flag suspicious bid patterns (classification)

> Blocked until: sufficient real transaction data exists (POC is now live and collecting this). **Interim plan:** synthetic/seed data via Faker (see Section 2.9) will be used to prototype and validate ML pipelines before real volume is sufficient.

### 2.3 Data Infrastructure
- Event logging (views, bid attempts, time-to-select) — required before any ML work
- Analytics dashboard (reuse RAG_v2 dashboard patterns)

### 2.4 Category Expansion
- Move from hardcoded `category` string to a `categories` taxonomy table with subcategories
- Category-specific fields (e.g. electronics: brand/model; furniture: dimensions) via flexible schema (jsonb)

### 2.5 Seller Auctions (new flow)
- Shops post items for auction; buyers bid up the price (inverse of core Request→Bid flow)
- Reuses existing UI patterns: `BrowseRequests.jsx` → `BrowseAuctions.jsx`, `PostRequest.jsx` → `PostAuction.jsx` — no rebuild from scratch, adapt existing components/pages

### 2.6 Delivery Confirmation Flow
- Extends existing delivery step: when buyer selects `home_delivery`, shop must confirm or deny
- If denied → buyer chooses pickup or cancels the bid
- Reuses `BidDetail.jsx` (shop confirm/deny UI) and `MyPurchases.jsx` (buyer sees shop's response)

### 2.7 Engagement / Retention (suggested additions)
- Saved searches — buyer alerted on new matching requests/auctions by pincode+category
- Favorites/bookmarks — on requests or auctions
- In-app notifications — delivery confirmation needed, bid selected, outbid on auction, new chat message (unread badge count in Navbar)

### 2.8 Reviews (flagged for later, not urgent)
- Post-transaction ratings between buyer and shop

### 2.9 Image Uploads (Cloudinary)
- Replace manual image-URL-paste with actual file upload, stored via Cloudinary (free tier: 25GB storage/bandwidth)
- Applies to: request reference images, auction item images, (optionally) shop profile photos
- Flow: user selects file → frontend uploads to Cloudinary (unsigned upload preset or signed via backend) → Cloudinary returns a hosted URL → store that URL in updated `image_urls` array field (see 2.18 for multi-image upgrade)
- Bonus: Cloudinary auto-resize/compress means faster-loading cards without extra work

### 2.10 In-App Chat (post-selection only)
- **Scope change from v1 POC** — original docs explicitly excluded chat; reintroduced here for v2 because it adds real value once a bid/auction is actually won
- Chat unlocks **only after**: a bid is selected (Core Flow) or an auction closes with a winner (Auctions flow) — not available during open bidding, to avoid buyers/shops negotiating outside the bid mechanism
- Scope: text-only, tied to a specific `request_id` or `auction_id`, between the two matched parties only
- Needs: `conversations` table + `messages` table (see Section 3/4), realtime delivery via Supabase Realtime (free tier included, no extra service needed)

### 2.11 Synthetic / Seed Data (for ML prototyping)
Real data volume from the live app won't be sufficient for meaningful ML training early on. Plan: use Python `Faker` library + custom logic to generate realistic seed data, rather than pulling mismatched external datasets (public e-commerce datasets like Kaggle's Amazon/Flipkart/Olist don't match this schema or Bhilai/electronics context).

- Seed into a **separate staging Supabase project** (not the live production one)
- Generate: fake buyers/shops (Bhilai-area pincodes), requests with realistic budget ranges per category, bids with realistic price variance around budget, some no-bid expiries, some multi-bid competitions, auction items with plausible bid escalation
- Bonus: this also stress-tests the actual API/DB under volume
- Swap to real data once live volume grows enough

### 2.12 Analytics
Skipped as a separate dashboard for now — existing/planned KPI cards on `buyer/Dashboard.jsx` and `shop/Dashboard.jsx` are sufficient. Revisit only if a dedicated analytics view becomes clearly necessary later.

### 2.13 RLS Policies for New Tables
**Authorization model:** FastAPI backend is the primary layer (role checks via `get_current_user`, same pattern as v1), using the Supabase service role key to bypass RLS for legitimate backend operations. RLS is a restrictive-by-default secondary safety net — matters mainly if the DB is ever queried directly (anon key from frontend, or future exposure). All 12 new tables (`categories`, `auctions`, `auction_bids`, `request_events`, `shop_reliability_scores`, `saved_searches`, `favorites`, `notifications`, `reviews`, `conversations`, `messages`, `reports`) need explicit RLS policies before going live — not just "RLS enabled with no policy" like early POC mistakes.

| Table | Read | Write |
|---|---|---|
| `saved_searches`, `favorites` | Own rows only | Own rows only |
| `notifications` | Own rows only | Own rows only (mark read + delete allowed) |
| `messages`, `conversations` | Matched parties only (buyer_id/shop_id) | Matched parties only; `read_at` set via backend, not direct write |
| `categories` | Public | Admin/backend only |
| `request_events` | Own rows only (`actor_id = auth.uid()`) | Insert-only, own actions |
| `shop_reliability_scores` | Public (all authenticated users) | Backend service role only |
| `reports` | Own submitted reports only | Insert-only, own reports |
| `auction_bids` | Public (needed to see bid history/current high) | Insert-only, no updates to past bids |

### 2.14 Content Moderation (Chat)
Since chat opens real-time text between strangers, basic moderation needed before wide launch:
- Profanity/abuse filter on message send (simple keyword filter to start; can upgrade later)
- Report/block functionality — report a conversation, block a user from further messaging
- Rate limiting on message sends (prevent spam flooding)

### 2.15 Image Upload Validation
Cloudinary uploads need constraints to control cost/security:
- File size limit (e.g. max 5MB per image)
- File type whitelist (jpg, png, webp only — no arbitrary file types)
- Max images per request/auction (e.g. 1–3)
- Client-side validation before upload + server-side check on the returned Cloudinary metadata

### 2.16 Auction Sniping Prevention
Auction sniping: a bidder places a winning bid in the last few seconds before `end_time`, leaving no time for others to counter-bid — considered unfair since the win is by timing, not genuine best offer.

**Fix (standard pattern, e.g. eBay-style):** if a bid arrives within the last N minutes (e.g. 5) of `end_time`, auto-extend `end_time` by a few more minutes. Repeats until no new bids land in that window, ensuring a fair final contest. Needs logic in the `POST /auctions/{id}/bids` handler, not just the auto-close cron.

### 2.17 Data Privacy Note
v2 collects meaningfully more personal data than the POC (DOB, gender, business hours, location history, chat messages, behavioral event logs). Before wider launch:
- Add a basic privacy policy / terms covering what's collected and why
- Ensure sensitive fields (DOB, gender) are optional, not mandatory, at signup/profile
- Consider what's shown publicly (e.g. don't expose DOB/gender on public profile views) vs. stored only
- Not a blocker for continued dev/testing, but should be addressed before real users beyond your own testing

### 2.18 Multi-Image Support
Currently only a single image URL per listing. Upgrade to proper multi-image support (e.g. up to 3–5 images per request/auction), with a carousel on detail pages instead of a single static image.
- Store as an array of Cloudinary URLs rather than one string field
- **Decided (refined Aug 24):** buyer-side cards stay text-only (buyer already knows what they posted, no need to repeat their own image). Shop-side cards (`BrowseRequests.jsx`) DO show the first image, left-aligned — shops are seeing listings fresh and a thumbnail helps them decide faster. Detail views on both sides show the full carousel.
- Detail view (`RequestDetail.jsx`, future auction detail page): image carousel/gallery

### 2.19 Sort Options
Add sorting to browse/list views — currently only filterable, not sortable.
- Requests/Auctions: newest first (default), price low→high, price high→low, most bids, ending soonest (auctions only)
- Implemented as a query param on existing `GET /requests` and future `GET /auctions` (e.g. `?sort=price_asc`)

### 2.20 Report / Flag Listings
Extend beyond chat moderation (2.14) to the listings themselves — requests and auctions can be reported as spam/fake/inappropriate.
- Originally noted as a "nice to have" in the v1 POC docs but never built — now formally scoped
- Simple flag field/table, buyer or shop can report any listing, flagged items hidden pending manual review (manual for now, no admin panel yet per current scope)

### 2.21 Category-Based Recommendations (Apriori)
"Buyers who requested this also requested..." — association rule mining using the **Apriori algorithm**, driven by `request_events`/`bids` data (which categories/items co-occur across buyer sessions or across shop bidding patterns).
- Classic, well-documented ML technique — strong portfolio talking point alongside price prediction and reliability scoring
- Needs enough co-occurrence data — realistically waits until Faker seed data or real usage volume exists (same blocker as other ML features)
- Output: category/item pairings surfaced as "related requests" or "shops who bid on this also bid on..." on relevant pages

---

## 3. New Database Tables Needed

| # | Table | Purpose | Priority |
|---|---|---|---|
| 1 | `auctions` | Shop-posted auction items | High |
| 2 | `auction_bids` | Buyer bids on auctions | High |
| 3 | `categories` | Category taxonomy (supports subcategories, auctions too) | High |
| 4 | `request_events` | Behavioral log (viewed/bid_placed/selected) — ML training data | High |
| 5 | `shop_reliability_scores` | Computed score per shop, recalculated periodically | Medium |
| 6 | `saved_searches` | Buyer pincode+category alerts | Medium |
| 7 | `favorites` | Buyer bookmarks on requests/auctions | Medium |
| 8 | `notifications` | In-app alerts | Medium |
| 9 | `reviews` | Post-transaction ratings | Low / later |
| 10 | `conversations` | One chat thread per selected bid/auction win | High (new) |
| 11 | `messages` | Messages within a conversation | High (new) |
| 12 | `reports` | Flagged listings/users for moderation | Medium (new) |

**No new table needed for delivery confirmation** — just 2 new columns on existing `requests` table.
**No new table needed for image uploads** — Cloudinary URLs stored as an array on existing image field (upgraded from single string to array/jsonb).
**No new table needed for sorting** — handled via query params on existing list endpoints.
**No new table needed for Apriori recommendations** — computed from existing `request_events`/`bids` data, results cached/served via backend logic (or a lightweight `item_associations` cache table if performance requires it later).

---

## 4. Schema Additions (draft — will refine as we build each)

### 4.1 Extend `profiles`
```sql
full_name text, nullable
date_of_birth date, nullable
gender text, nullable
profile_photo_url text, nullable
bio text, nullable
business_hours jsonb, nullable          -- shop only
years_in_business integer, nullable     -- shop only
preferred_categories jsonb, nullable    -- buyer only
avg_response_time_minutes integer, nullable  -- shop, computed
total_transactions integer default 0
completed_transactions integer default 0
is_verified boolean default false
last_active_at timestamptz, nullable
```

### 4.2 Extend `requests`
```sql
views_count integer default 0
urgency text, nullable                  -- 'flexible' | 'soon' | 'urgent'
preferred_contact_time text, nullable
delivery_confirmed_by_shop boolean, nullable default null   -- null=pending, true=accepted, false=denied
delivery_response_at timestamptz, nullable
image_urls jsonb, nullable              -- array of Cloudinary URLs, replaces single reference_image field
```

### 4.3 Extend `bids`
```sql
response_time_seconds integer, nullable   -- time from request posted -> bid placed
is_negotiable boolean default false
```

### 4.4 New: `categories`
```sql
id uuid PK default gen_random_uuid()
name text
parent_category_id uuid, nullable, FK -> categories(id)
field_schema jsonb, nullable   -- category-specific field definitions
created_at timestamptz default now()
```

### 4.5 New: `auctions`
```sql
id uuid PK default gen_random_uuid()
shop_id uuid FK -> profiles(id)
item_name text
description text, nullable
starting_price integer
current_highest_bid integer, nullable
winning_bid_id uuid, nullable, FK -> auction_bids(id)
category text
pincode text (6 chars)
image_url text, nullable
image_urls jsonb, nullable                -- array of Cloudinary URLs, multi-image support
status text check ('active','sold','expired','cancelled') default 'active'
end_time timestamptz
closed_at timestamptz, nullable          -- set by cron when auction auto-closes
delivery_method text, nullable            -- 'home_delivery' | 'pickup'
delivery_confirmed_by_shop boolean, nullable default null
delivery_response_at timestamptz, nullable
verified_at timestamptz, nullable
created_at timestamptz default now()
```

### 4.6 New: `auction_bids`
```sql
id uuid PK default gen_random_uuid()
auction_id uuid FK -> auctions(id)
buyer_id uuid FK -> profiles(id)
bid_amount integer
created_at timestamptz default now()
```

### 4.7 New: `request_events`
```sql
id uuid PK default gen_random_uuid()
request_id uuid FK -> requests(id)
event_type text    -- 'viewed' | 'bid_placed' | 'selected' | etc.
actor_id uuid, nullable, FK -> profiles(id)
metadata jsonb, nullable
created_at timestamptz default now()
```

### 4.8 New: `shop_reliability_scores`
```sql
id uuid PK default gen_random_uuid()
shop_id uuid FK -> profiles(id)
score numeric
factors jsonb   -- breakdown: response_time, completion_rate, selection_rate
calculated_at timestamptz default now()
```

### 4.9 New: `saved_searches`
```sql
id uuid PK default gen_random_uuid()
buyer_id uuid FK -> profiles(id)
pincode text, nullable
category text, nullable
created_at timestamptz default now()
```

### 4.10 New: `favorites`
```sql
id uuid PK default gen_random_uuid()
user_id uuid FK -> profiles(id)
target_type text   -- 'request' | 'auction'
target_id uuid
created_at timestamptz default now()
```

### 4.11 New: `notifications`
```sql
id uuid PK default gen_random_uuid()
user_id uuid FK -> profiles(id)
type text          -- 'delivery_confirm_needed' | 'bid_selected' | 'outbid' | 'new_message' | etc.
message text
is_read boolean default false
related_id uuid, nullable
created_at timestamptz default now()
```
> Unread badge count = count of `is_read=false` rows per user — surface in `Navbar.jsx`.

### 4.12 New (later): `reviews`
```sql
id uuid PK default gen_random_uuid()
reviewer_id uuid FK -> profiles(id)
reviewed_id uuid FK -> profiles(id)
request_id uuid, nullable, FK -> requests(id)
rating integer check (rating between 1 and 5)
comment text, nullable
created_at timestamptz default now()
```

### 4.13 New: `conversations`
```sql
id uuid PK default gen_random_uuid()
source_type text check ('request','auction')
source_id uuid          -- request_id or auction_id depending on source_type
buyer_id uuid FK -> profiles(id)
shop_id uuid FK -> profiles(id)
created_at timestamptz default now()
```
> One conversation per selected bid / auction win. Created automatically when a bid is selected or an auction closes with a winner.

### 4.14 New: `messages`
```sql
id uuid PK default gen_random_uuid()
conversation_id uuid FK -> conversations(id)
sender_id uuid FK -> profiles(id)
content text
created_at timestamptz default now()
read_at timestamptz, nullable
```
> Realtime delivery via Supabase Realtime (free tier, subscribe to `messages` table changes filtered by `conversation_id`) — no extra service needed.

### 4.15 New: `reports`
```sql
id uuid PK default gen_random_uuid()
reporter_id uuid FK -> profiles(id)
target_type text     -- 'request' | 'auction' | 'user' | 'message'
target_id uuid
reason text           -- 'spam' | 'fake' | 'inappropriate' | 'other'
details text, nullable
status text check ('pending','reviewed','dismissed') default 'pending'
created_at timestamptz default now()
```
> Flagged listings hidden from browse feeds pending manual review (`status='pending'`) — no admin panel yet, review done manually via Supabase dashboard for now.

---

## 5. UI Reuse Plan (don't rebuild from scratch)

| New Feature | Reuses Existing Component/Page As Template |
|---|---|
| Browse Auctions (buyer) | `shop/BrowseRequests.jsx` pattern |
| Post Auction (shop) | `buyer/PostRequest.jsx` pattern |
| Auction bid placement | existing bid modal/form logic |
| Delivery confirm/deny (shop) | extend `shop/BidDetail.jsx` |
| Delivery response view (buyer) | extend `buyer/MyPurchases.jsx` |
| Saved searches / favorites UI | extend `buyer/Dashboard.jsx` with new tab/section |
| Notifications | new lightweight dropdown in `Navbar.jsx` |
| Image upload | replace URL text input in `PostRequest.jsx`/`PostAuction.jsx` with file picker + Cloudinary upload widget |
| Chat | new `Chat.jsx` page/panel, opened from `RequestDetail.jsx`/`MyPurchases.jsx` (buyer) and `BidDetail.jsx` (shop) once selected — simple message list + input, Supabase Realtime subscription |
| Multi-image carousel | extend `RequestDetail.jsx` (and future auction detail page) with a simple image carousel component; cards show first image only |
| Sort dropdown | small addition to `shop/BrowseRequests.jsx` and future `buyer/BrowseAuctions.jsx` toolbar, next to existing filters |
| Report/flag button | small icon/action on request/auction cards and detail pages, opens a lightweight reason-select modal |
| Related items (Apriori) | new section on `RequestDetail.jsx`/auction detail page — "related requests" list, reuses existing card component |

---

## 6. Suggested Build Order

1. `categories` table + migrate existing hardcoded category field
2. `request_events` table + basic event logging (unlocks ML data collection immediately)
3. Extend `profiles`, `requests`, `bids` with new columns
4. Delivery confirmation flow (small, high value, uses existing pages)
5. `auctions` + `auction_bids` tables + Browse/Post Auction pages
6. `saved_searches`, `favorites`, `notifications`
7. `shop_reliability_scores` (needs data from steps above first)
8. ML feature #1: price suggestion (needs real data volume)
9. ML feature #2: bid ranking
10. `reviews` (later)

---

## 7. Decisions Made

- **Auction winner selection:** Highest bid wins automatically at `end_time` — no manual shop selection step (unlike Core Flow bids). Requires a cron/Edge Function similar to `expire-requests` to close auctions and set winner at `end_time`.
- **Auction delivery/verify:** Reuses `requests`-style delivery/verify fields and flow (home delivery confirm/deny by shop, or pickup) — not a separate system. Auctions get their own `delivery_method`, `delivery_confirmed_by_shop` etc. columns (same pattern as `requests`).
- **Notifications:** In-app only for now — no push/email.
- **Mobile support:** Planned as a later phase — responsive-web first (already Tailwind responsive from v1.0 redesign), then evaluate PWA vs. React Native/Expo wrapper once web v2 stabilizes. See Section 9.
- **Image uploads:** Cloudinary (free tier) — file upload replaces manual URL paste, hosted URL stored in existing image fields.
- **In-app chat:** Text-only, unlocks only after bid selected / auction won, scoped to that specific transaction — via Supabase Realtime, no extra service.
- **Authorization model:** FastAPI backend is the primary authorization layer (role checks via `get_current_user`, same as v1). RLS policies act as a restrictive-by-default secondary safety net — backend uses the service role key to bypass as needed; RLS matters mainly if the DB is ever queried directly (anon key from frontend, or future direct exposure).
- **`reports` visibility:** Reporter can read their own submitted reports (status: pending/reviewed/dismissed) but not reports by/against others. Full read access is backend/service-role only.
- **`request_events` visibility:** Event creator can read their own events (`actor_id = auth.uid()`); no one can read others' events. ML/aggregate use goes through backend service role.
- **`shop_reliability_scores` visibility:** Public read for all authenticated users (buyers comparing bids, shops checking their own/competitors' scores) — not restricted by role. Write is service-role only, score is never user-editable.
- **`notifications`:** Users can mark as read (individually or bulk) AND delete/dismiss their own notifications — both actions scoped via `user_id = auth.uid()`.
- **`messages` read receipts:** `read_at` is set by backend only (e.g. `PATCH /conversations/{id}/read`), not direct user table writes — keeps read-state trustworthy, consistent with notifications.
- **`auction_bids`:** New-bid-only, no editing past bids — matches real auction semantics, keeps "highest bid" and sniping-prevention logic clean. A buyer wanting to bid higher places a new row.

---

## 8. Open Questions / Decisions Pending
- PWA vs. native wrapper (React Native/Expo) for mobile — to be decided closer to that phase, once v2 web features are stable.

---

## 9. Synthetic / Seed Data Strategy (for ML prototyping before real data volume exists)

Real usage data from day 1 won't be enough for ML models to train/predict with any precision. Plan: generate synthetic seed data rather than pulling external datasets (external e-commerce datasets like Kaggle/UCI won't match our schema, pincode geography, or category structure).

**Approach:** Python seeding script using the `Faker` library + custom logic, simulating realistic buyer/shop behavior over a simulated time window (e.g. "90 days" of activity compressed into one script run).

**What the script should simulate:**
- Realistic Bhilai-area pincode distribution
- Electronics category mix (weighted toward common items: phones, headphones, laptops)
- Price variance around buyer's stated budget (some bids under, some over, some way off)
- Bid competition patterns — some requests get 0 bids (→ expire), some get 1, some get 5+ competing bids
- Response time variance (shop bid speed — feeds `response_time_seconds` and reliability scoring)
- Realistic selection behavior — buyer doesn't always pick lowest price (adds noise/signal for ranking ML later)
- Some full lifecycle completions (purchased → delivery → verified → completed) and some drop-offs (purchased but never verified)

**Where it runs:** Seed into a **staging Supabase project**, not the live production one — swap to real data once organic volume grows enough.

**Bonus value:** This script also stress-tests the actual API endpoints (Faker-generated signups, requests, bids going through real `POST`/`PATCH` calls), so it doubles as informal load/integration testing.

---

## 10. Mobile Support (future phase, post-v2-web)

Two paths, decide once v2 web is stable:

| Option | Effort | Notes |
|---|---|---|
| **PWA** (Progressive Web App) | Low | Add manifest.json + service worker to existing Vite/React app, installable on home screen, works offline-lite. Fastest path, reuses 100% of existing code. |
| **React Native / Expo wrapper** | High | Separate codebase (can share some logic/API layer), true native feel, app store presence. Bigger commitment. |

**Recommendation (default plan unless revisited):** Start with PWA conversion after v2 web features are done — cheapest way to get "mobile app" on resume/portfolio, native wrapper only if there's a specific reason (app store listing, push notifications later, etc.)

---

## 11. Changelog
- **Aug 12, 2026** — Initial roadmap created. Scoped: profile expansion, ML features, category taxonomy, seller auctions, delivery confirmation, engagement features, full table list drafted.
- **Aug 12, 2026 (update)** — Decided: auctions auto-close with highest bid winning at end_time; auctions reuse requests-style delivery/verify flow; notifications in-app only; mobile support added as future phase (PWA-first recommendation).
- **Aug 12, 2026 (update 2)** — Added synthetic/seed data plan using Python Faker to prototype ML before real data volume is sufficient; will seed into a separate staging Supabase project, not production.
- **Aug 12, 2026 (update 3)** — Added Cloudinary for image uploads (replaces manual URL paste) and in-app chat, unlocked post-selection only (bid selected / auction won), via Supabase Realtime. Chat is a deliberate scope change from v1 POC's "no chat" exclusion — tracked here.
- **Aug 12, 2026 (update 4)** — Added: RLS policy requirements for all new tables, content moderation for chat (profanity filter, report/block, rate limiting), image upload validation (size/type/count limits), auction sniping prevention (auto-extend end_time on late bids), data privacy note (DOB/gender optional, privacy policy needed pre-launch), notification badge for chat messages. Analytics dashboard explicitly deprioritized in favor of existing dashboard KPI cards.
- **Aug 12, 2026 (update 5)** — Added: multi-image support (image_urls array, replaces single image field), sort options (price/newest/most bids/ending soon), report/flag listings (`reports` table, manual review for now — no admin panel), Apriori-based category/item recommendations. Admin panel and shop verification badge explicitly deferred, not scoped yet.
- **Aug 12, 2026 (update 6)** — Clarified authorization model (FastAPI backend primary, RLS as secondary safety net) and finalized per-table RLS read/write rules for all 12 new tables, including notifications delete permission, backend-only message read receipts, and auction_bids as insert-only (no editing past bids). Ready to begin Phase 1 build.
- **Aug 17, 2026** — Phase 1 (Data Foundation) complete: `categories`, `request_events` tables created, `profiles`/`requests` extended, existing category data migrated. Phase 2 (Delivery Confirmation) complete: backend confirm/deny/set-delivery/switch-to-pickup endpoints, frontend confirm/deny UI in `BidDetail.jsx`, delivery status + switch-to-pickup/cancel actions in `MyPurchases.jsx`, and two-way settlement flow with tab-gating (pending/denied requests stay in "Selected" tab, pickup/confirmed move to "Verify" tab; verify button disabled until resolved) — this tab-gating logic extends beyond original scope and is a good UX addition. Next: Phase 3 (Cloudinary multi-image).
- **Aug 22, 2026** — Faker seed script built (`mfx-core/utils/seed_data.py`): 15 buyers, 12 shops, 50 requests (5 categories), 120 bids, 272 request_events, realistic lifecycle distribution. **Note:** run against the same production Supabase project rather than a separate staging one as originally planned in Section 2.9/2.11 — deliberately deferred to separate later, not a blocker for now.
- **Aug 23, 2026** — Phase 3 (Cloudinary Multi-Image) complete. Backend: `cloudinary_config.py`, `routes/upload.py` (`/upload/single`, `/upload/multiple`), validation (5MB max, jpg/png/webp, max 5 images), startup verification, env vars added. Schema: `image_urls` jsonb migrated in on `requests`, `RequestCreate`/`RequestResponse` schemas updated. Frontend: `useCloudinary` hook, multi-file upload UI in `PostRequest.jsx`, new `ImageCarousel` component (with fullscreen view) added to `RequestDetail.jsx`, upload progress indicator added. **Bug fixes:** `GET /requests/{id}` wasn't returning `image_urls` (would've broken the carousel), duplicate `/requests` router prefix, `DeliveryConfirmResponse` import name typo, `requests.services` import path. **Remaining gap:** shop-side detail/bid view doesn't yet show the image carousel. Next: Phase 4 (Seller Auctions), plus this shop-side image gap.
- **Aug 24, 2026** — Phase 3b (Shop-Side Image Display) complete: `ImageCarousel` added to shop `BidDetail.jsx`; shop `BrowseRequests.jsx` cards now show first image, left-aligned (buyer cards remain text-only — buyer already knows what they posted, shop benefits from a quick visual). New `GET /bids/{id}` endpoint. `BidDetail.jsx` enhanced to fetch/display bid + request + buyer details together, with conditional buyer contact (selected bids only) and delivery confirmation status shown inline. **Bug fixes:** `MyBids` navigation to `BidDetail` fixed for all bid statuses (was broken for some), `/bids` route trailing-slash issue fixed. Emojis replaced with Lucide icons across components. All of Phase 3 (image support) now fully complete on both buyer and shop sides.
- **Aug 27, 2026** — Phase 4 (Seller Auctions) started: `auctions` and `auction_bids` tables created (delivery + sniping-prevention fields baked in per Section 4.5/4.6), plus RLS policies for both. Auction schemas added for creation, update, and bidding. Next: backend routes (`POST /auctions`, `GET /auctions`, `GET /auctions/{id}`, `POST /auctions/{id}/bids`, `DELETE /auctions/{id}`), sniping-prevention logic, auto-close cron, then frontend (`PostAuction.jsx`, `BrowseAuctions.jsx`, `AuctionDetail.jsx`, `MyAuctions.jsx`).
- **Aug 12, 2026 (update 2)** — Added synthetic/seed data strategy using Faker, staging Supabase project, to unblock ML prototyping ahead of real data volume.