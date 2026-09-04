# MarketFlip v2
### Future Development Roadmap — Living Document

| | |
|---|---|
| **Product** | MarketFlip v2 |
| **Status** | v2 Build Order Complete (Phases 0–12) — Sep 4, 2026. **v3 scope: stabilization (bugs, frontend design, performance) — not new features.** |
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

### 2.10 In-App Chat — contact-based, WhatsApp-style (redesigned Aug 29)
- **Scope change from v1 POC** — original docs explicitly excluded chat; reintroduced here for v2 because it adds real value once a bid/auction is actually won
- **Redesigned from the original transaction-scoped concept:** chat is now tied to the **buyer-shop pair**, not a single transaction — one persistent thread per relationship, like WhatsApp, not a new chat per deal
- Chat **unlocks** when a transaction is active between the pair (bid selected / auction won); **locks (read-only)** when there's no active transaction; a future transaction between the same pair unlocks it again and the thread continues
- Message history is never deleted — stays visible as a record through locked periods too
- The chat view pins the currently-active transaction's product details at the top (item, price, image) so both parties know what they're discussing
- **UI:** a chat list page (WhatsApp-style, all threads for the user, active + locked) plus an individual chat view — both linked from the dashboard
- Scope: text-only, between two matched parties (buyer + shop) only
- Needs: pair-keyed `conversations` table + `messages` table (see Section 4.13), realtime delivery via Supabase Realtime (free tier included, no extra service needed)

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
| `messages` | Matched parties only (via conversation's buyer_id/shop_id) | Insert-only, sender must be self, INSERT only when conversation `locked=false`; `read_at`/moderation flags set via backend only, no user UPDATE policy |
| `conversations` | Matched parties only (buyer_id/shop_id) | Insert via backend on first transaction between a pair; no user UPDATE policy (lock state now computed, not stored) |
| `conversation_active_transactions` | Matched parties on the parent conversation | Backend/service-role only, no user INSERT/UPDATE/DELETE — rows created on bid-select/auction-win, deleted on completion |
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
gst_number text, nullable               -- shop only, built Aug 27/28
identity_number text, nullable          -- buyer only, buyer-side parity to gst_number (trust/verification)
delivery_address text, nullable         -- buyer only, default/saved address for delivery-method step (Phase 2)
budget_range_preference jsonb, nullable -- buyer only, e.g. {min, max} — pairs with preferred_categories, feeds future ML (Phase 9)
notification_preferences jsonb, nullable -- both roles, optional; granular control once Phase 6 notifications ship
```
**Role field map (shared table):**
- Both roles: `full_name`, `date_of_birth`, `gender`, `profile_photo_url`, `bio`, `total_transactions`, `completed_transactions`, `is_verified`, `last_active_at`, `notification_preferences`
- Shop-only (null for buyers): `shop_name`, `business_hours`, `years_in_business`, `gst_number`, `avg_response_time_minutes`
- Buyer-only (null for shops): `preferred_categories`, `identity_number`, `delivery_address`, `budget_range_preference`

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

### 4.5 New: `auctions` (corrected Aug 31 — delivery fields are buyer-set post-win, not creation-time)
```sql
id uuid PK default gen_random_uuid()
shop_id uuid FK -> profiles(id)
item_name text
description text, nullable
starting_price integer
reserve_price integer, nullable           -- shop-set minimum, checked by close-auctions
current_highest_bid integer, nullable
winning_bid_id uuid, nullable, FK -> auction_bids(id)
category text
pincode text (6 chars)
image_url text, nullable
image_urls jsonb, nullable                -- array of Cloudinary URLs, multi-image support
status text check ('active','sold','completed','expired','cancelled') default 'active'
end_time timestamptz
closed_at timestamptz, nullable          -- set by cron when auction auto-closes
delivery_method text, nullable            -- 'home_delivery' | 'pickup' — buyer-set post-win, NOT at creation
delivery_address text, nullable           -- buyer-supplied, NOT shop-set at creation (corrected Aug 31)
delivery_confirmed_by_shop boolean, nullable default null
delivery_response_at timestamptz, nullable
verification_code text, nullable
verification_attempts integer default 0
completed_via_override boolean default false
verified_at timestamptz, nullable
created_at timestamptz default now()
```
> **Corrected Aug 31:** `delivery_method`/`delivery_address` are set by the buyer post-win via `PATCH /auctions/{id}/delivery`, not by the shop at creation time — matches how `requests` already works (delivery is *to* the buyer). Original creation form does not collect these. `status` now includes `completed` as a distinct terminal state from `sold` (sold = winner determined, completed = OTP verified/overridden) — mirrors `requests`' `purchased`→`completed` pattern.

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

### 4.11 New: `notifications` (built ahead of schedule Aug 31, during Phase 5b — schema upgraded from original plan)
```sql
id uuid PK default gen_random_uuid()
user_id uuid FK -> profiles(id)
type text          -- 'auction_won' | 'auction_sold' | 'delivery_confirm_needed' | 'delivery_denied' | 'transaction_completed' | 'bid_selected' | 'outbid' | 'new_message' | etc.
title text
body text
link text, nullable     -- deep-link to relevant chat/auction/request
read boolean default false
created_at timestamptz default now()
```
> Unread badge count = count of `read=false` rows per user — surface in `Navbar.jsx`. **Upgraded from original plan:** added `title`/`link` (was just `message`) — more useful for deep-linking notifications to their source; this is the real Phase 6 table, not a throwaway placeholder.

### 4.12 New: `reviews` (finalized Sep 3 — polymorphic target, one per transaction per direction)
```sql
id uuid PK default gen_random_uuid()
reviewer_id uuid FK -> profiles(id)
reviewed_id uuid FK -> profiles(id)
target_type text check ('request','auction')     -- polymorphic, matches favorites/reports pattern
target_id uuid
rating integer check (rating between 1 and 5)
comment text, nullable
created_at timestamptz default now()
unique (reviewer_id, target_type, target_id)      -- one review per transaction per direction, not unlimited over time
```

**Decisions (Sep 3):**
- **Polymorphic `target_type`/`target_id`**, not a nullable per-type FK — consistent with `favorites`/`reports`, supports both requests and auctions without adding a new column per transaction type
- **One review per transaction per direction** — enforced by the unique constraint; a new transaction between the same pair legitimately allows a new review
- **Visibility: public, not gated on mutual review** — reviews are visible once submitted; retaliation risk is handled via the existing `reports` moderation mechanism, not by hiding reviews until both parties submit (which would chill honest negative feedback)
- **UI placement: `MyPurchases.jsx` and `MyWonAuctions.jsx` only**, not `TransactionHistory.jsx` — the prompt belongs on the "just completed" views, not the passive historical record (keeps `TransactionHistory.jsx`'s read-only purpose intact per Section 13.3)

### 4.13 New: `conversations` (redesigned Aug 29 — pair-based, not transaction-based)
```sql
id uuid PK default gen_random_uuid()
buyer_id uuid FK -> profiles(id)
shop_id uuid FK -> profiles(id)
created_at timestamptz default now()
unique (buyer_id, shop_id)                                        -- one persistent thread per pair
```
> One conversation per buyer-shop **pair** (not per transaction) — like WhatsApp. Created on first transaction between the pair, then reused as transactions come and go. **Lock state is computed, not stored** (as-built Aug 30) — see 4.13b `conversation_active_transactions`; a conversation is locked when it has zero active-transaction rows.

### 4.13b New: `conversation_active_transactions` (added Aug 30 — supports multiple simultaneous active transactions per pair)
```sql
id uuid PK default gen_random_uuid()
conversation_id uuid FK -> conversations(id)
source_type text check ('request','auction')
source_id uuid
item_name text, nullable          -- denormalized snapshot for chat header, avoids a join
created_at timestamptz default now()
unique (conversation_id, source_type, source_id)
```
> One row per active transaction keeping a conversation unlocked. Inserted on bid selection / auction win; deleted on transaction completion (hard-delete approach chosen). A conversation with zero rows here is locked. Supports a buyer and shop having more than one simultaneous open deal without one overwriting the other (the gap found in the original single-`active_source_id` design).

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

## 12. Auction Navigation Structure (implemented Aug 27)

Auctions sit behind an intermediate "Auction Dashboard" hub on both roles, rather than flat top-level nav links:

```
Shop Dashboard
    ├── [Auctions] → Auction Dashboard
    │                   ├── [View All] → My Auctions
    │                   │                   └── [View] → Auction Detail (Shop)
    │                   └── [Create] → Post Auction
    │
    └── [My Bids] → My Bids

Buyer Dashboard
    ├── [Auctions] → Auction Dashboard
    │                   ├── [Browse] → Browse Auctions
    │                   │                   └── [Click] → Auction Detail (Buyer)
    │                   └── [Live Auctions] → Browse Auctions
    │
    └── [My Purchases] → My Purchases
```

---

## 13. New Ideas Raised (Aug 27) — Not Yet Built

### 13.1 Profile Completion Page
Both `profiles` table extensions (Phase 1) and identity fields need a UI — currently only the DB columns exist, no page to fill/update them.
- **New page:** profile edit/complete page for both roles (separate from signup)
- **Shop owners:** add GST number (or similar business identifier) — likely **immutable once set** (can't be silently changed after verification-adjacent use)
- **Buyers:** add phone number or an identification number — same immutability consideration
- **Usage:** these identity fields get surfaced on request/auction detail pages (e.g. shown to the matched party post-selection, similar to how contact info is revealed) — adds a light trust/verification layer without building the full "shop verification badge" feature from Section 2 deferred list
- **Decided (v2 scope):** partial "Verified Shop" badge — once a shop fills in their GST number, auto-show a lightweight badge ("business info provided"). Not full manual-approval verification (that stays deferred) — just a conditional render off the existing field, no new backend needed.
- **Open question:** exact field set and which are immutable vs. editable — refine when building

### 13.2 OTP-Based Transaction Completion (in-app code, no third-party SMS/email cost)
Replaces the current single-button "verify transaction" step with a two-party confirmation code — generated and checked entirely in-app, avoiding any SMS/email OTP service fees.

**Mechanics (decided):**
1. Once delivery is confirmed (home delivery confirmed by shop, or pickup arranged), backend generates a random 4-digit `verification_code`, stored on the `requests`/`auctions` row
2. **Buyer holds the code** — shown only in their app (`MyPurchases.jsx` / auction equivalent)
3. Physical handoff happens (delivery or pickup) — buyer shares the code with the shop in person
4. **Shop enters the code** in their app (`BidDetail.jsx` / auction equivalent) to confirm the handoff
5. Backend checks entered code against stored code → match sets `status = 'completed'`; mismatch returns an error and allows retry

**Schema additions (both `requests` and `auctions`):**
```sql
verification_code text, nullable
verification_attempts integer default 0
completed_via_override boolean default false
```

**Dispute / fallback path (required, not optional — a verification gate needs a failure path):**
- Cap retry attempts (e.g. 5)
- After the cap is hit, allow the **buyer** to manually mark the transaction completed instead (they're the party who'd know if the handoff genuinely happened) — flagged `completed_via_override = true` so it's visible for future admin/dispute tooling, even though no admin panel exists yet
- This override path is the safety net until a real admin/dispute system (Phase-deferred) exists

Applies to both flows: `requests.verify` (Phase 2, being extended) and the future auction post-sale verify step (Phase 4, step 21).

**Verification flow diagram (as built):**
```
Shop enters OTP
       │
       ▼
  Code correct?
       │
   ┌───┴───┐
   │       │
  Yes      No
   │       │
   ▼       ▼
Complete   attempts++
Transaction   │
             │
        attempts < 5?
             │
         ┌───┴───┐
         │       │
        Yes      No
         │       │
         ▼       ▼
   Try again    Max attempts reached
                (Blocked for shop)
                     │
                     ▼
              Buyer sees override button
                     │
                     ▼
              Buyer clicks override
                     │
                     ▼
           Transaction completed with
           completed_via_override = true
```

**Status: ✅ fully built (Aug 29, 2026)**, including reserve price enforcement in `close-auctions` — see build order Phase 4c and Section 14 changelog for implementation details.

### 13.3 Transaction History & Analytics ("Reports" page) — ✅ DONE (Aug 29, 2026)
**Delivered as:** `TransactionHistory.jsx`, mounted at `/buyer/history` and `/shop/history` — one shared component, role-scoped by data. Two sections (Requests / Auctions), each with report-style tables, summary KPI cards, and status-based filter tabs with counts.
- Complete summary/log of past transactions (requests + auctions combined)
- Intended as the future home for ML-driven insights (price trends, demand patterns, personal spending/selling summaries) once ML features (Phase 9) are built
- **Not the same as the "analytics dashboard" explicitly skipped earlier (Section 2.12)** — that was about platform-operator-style dashboards; this is user-facing transaction history + future ML surface.

### 13.4 Requests Format Change — now underway (Aug 31), scope clarified as frontend-only
Originally deferred as "maybe later." **Scope now clarified (Aug 31):** this is a **frontend page-flow reorganization only** — bringing Requests' navigation in line with the 4-card Auction Dashboard hub pattern from Phase 5b. No backend changes; all existing request/bid logic and endpoints stay exactly as-is. See build order Phase 5c for the full page plan.

### 13.5 Additional Ideas Raised — v2 vs. v3 Split
Evaluated by whether it completes/de-risks something already in motion (v2) vs. needs new infra or a new external service (v3+):

**In v2 scope (small additions, bundled into existing phases):**
- Verified Shop badge (partial) — bundled into 13.1/Phase 4b, no new backend
- **Reserve price on auctions** — shop sets a minimum acceptable price; if highest bid doesn't reach it by `end_time`, auction doesn't auto-sell. One column (`reserve_price integer, nullable`) + one check in the `close-auctions` Edge Function logic. Bundle into auction schema alongside 13.2's dispute path work since both touch the same close-out logic.
- OTP dispute/reopen path — required alongside 13.2, not separable from it

**Deferred to v3 or later:**
- "Watching" / live bid count on auction cards (via extending `favorites`) — depends on Phase 7 (`favorites`) existing first; revisit as a v3 refinement once engagement features are live and it's clear auctions need the urgency nudge
- Full-text search on item_name/description — already deferred, stays deferred; useful but non-blocking, needs its own indexing work
- Notification digest (email) — needs a new external email service integration, not just a table; in-app-only was a deliberate v2 decision (Section 2.16-equivalent), revisit only if in-app notifications prove insufficient

---

## 14. Changelog
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
- **Aug 27, 2026** — Phase 4 (Seller Auctions) started: `auctions` and `auction_bids` tables created (delivery + sniping-prevention fields baked in per Section 4.5/4.6), plus RLS policies for both. Auction schemas added for creation, update, and bidding. **Same day, continued:** full backend complete — `POST /auctions`, `GET /auctions` (filters: pincode/category/status, plus `status="all"` handling, limit/offset pagination), `GET /auctions/{id}` (detail + bid history), `POST /auctions/{id}/bids`, `DELETE /auctions/{id}` (shop cancels active only). Sniping prevention implemented (auto-extends `end_time` by 5 min on late bids). `current_highest_bid` and `current_highest_bidder` tracking added. `close-auctions` Edge Function created and scheduled (cron, every 5 min) to auto-close expired auctions. **Bug fixes:** missing return in service.py, `supabase_admin` typo, missing `current_highest_bid` handling, `AuctionService` variable name conflict in routes.py, `from_attributes` typo and inconsistent defaults in schemas.py. Backend for Phase 4 now fully complete — only frontend remains (`PostAuction.jsx`, `BrowseAuctions.jsx`, `MyAuctions.jsx`, `AuctionDetail.jsx`, post-auction delivery/verify flow).
- **Aug 27, 2026 (same day, cont'd)** — Phase 4 frontend complete: Shop Auction Dashboard, Post Auction page, My Auctions page, Shop Auction Detail page, Buyer Auction Dashboard, Browse Auctions page, Buyer Auction Detail page — all built. **Navigation restructured** (see Section 12 below) — auctions now sit behind an intermediate "Auction Dashboard" hub on both roles rather than flat top-level links. **Bug fix:** timezone issue in `placeBid` function. Bid history now shows buyer names. **Phase 4 is now fully complete end-to-end.**
- **Aug 27, 2026 (planning)** — New ideas scoped: profile completion page with GST/identity fields + partial verified-shop badge (13.1), in-app OTP-style transaction completion with buyer-holds/shop-enters mechanic + retry cap + buyer-override dispute fallback (13.2), transaction history/reports page as future ML surface (13.3), requests format change deferred (13.4). v2-vs-v3 split done for additional ideas (13.5): reserve price on auctions and OTP dispute path folded into v2; watching/live-bid-count, full-text search, and email notification digest pushed to v3+.
- **Aug 27/28, 2026** — Phase 4b (Profile Completion) shop side built: `gst_number` column added to `profiles`; new frontend `profile/` module (`Profile.jsx`, `ProfileForm.jsx`, `ProfileLayout.jsx`) with full save→fetch→display loop; key fields also surfaced on Shop Dashboard. **Still pending:** buyer-side profile fields (phone/ID), GST immutability enforcement, surfacing GST/identity on matched request/auction detail pages, and the partial verified-shop badge — none of these are done yet.
- **Aug 29, 2026** — Phase 4b fully complete: buyer-side fields added (`identity_number`, `identity_type`, `delivery_address`, `budget_range_preference`, `notification_preferences`), `identity_number` immutability implemented (matches `gst_number`), role-specific field validation added (buyers can't set shop fields and vice versa), Verified Shop badge live on Shop Dashboard. **Remaining:** GST/identity surfacing on matched request/auction detail pages, and Verified badge on bid cards (currently dashboard-only). Phase 4c (OTP Transaction Completion) fully complete same day: `verification_code`/`verification_attempts`/`completed_via_override` on both `requests` and `auctions`, `reserve_price` on `auctions`; OTP generation wired into delivery-confirm, pickup-switch, pickup-selected, and bid-selected-for-pickup (the last one was a bug fix — pickup flow wasn't generating OTP on selection originally); `POST /requests/{id}/verify-otp` (5-attempt cap) and `PATCH /requests/{id}/override-complete` (buyer fallback) both live; frontend OTP UI in `BidDetail.jsx` (max-attempts warning, input disabled after 5 tries) and `MyPurchases.jsx` (show/hide, copy, attempts remaining, override button after cap, Completed-tab record view). `close-auctions` Edge Function updated to enforce `reserve_price` with a `reserve_not_met → expired` status path, deployed to production. **Phase 4c fully closed out, including reserve price — no open items remain from this session.** Phase 4d (Transaction History) also completed same day: `TransactionHistory.jsx` built and mounted at `/buyer/history` + `/shop/history`, new `GET /bids/auction-bids`/`GET /bids/shop-bids` endpoints, report tables + KPI cards + status tabs for both Requests and Auctions sections, "History" button added to both dashboards. **Aug 27–29 was an exceptionally productive stretch — Phases 4b, 4c, and 4d all shipped complete.**
- **Aug 29, 2026 (Phase 5 design)** — In-App Chat redesigned before build: switched from transaction-scoped conversations (one thread per bid/auction) to **contact-based, WhatsApp-style** conversations (one persistent thread per buyer-shop pair, reused across multiple transactions over time). Conversation locks (read-only) when no transaction is active between the pair, unlocks on a new bid selection/auction win, relocks on completion — full message history always stays visible, never deleted. Chat pins the currently-active transaction's product details at the top. New UI concept: a WhatsApp-style chat list page (all threads, active + locked) plus the individual chat view. `conversations` schema (4.13) updated accordingly — `unique(buyer_id, shop_id)` instead of per-source rows.
- **Aug 29, 2026 (Phase 5 build started)** — `conversations` and `messages` tables created with RLS enabled and policies applied: SELECT restricted to matched parties on both tables, `messages` INSERT restricted to self as sender AND only when the conversation is unlocked (enforced at the DB layer, not just backend), and — correctly — **no user-facing UPDATE policy on either table**, since lock-state transitions, `active_source_*`, `read_at`, and moderation flags (`is_reported`/`is_blocked`) are all backend/service-role owned per the authorization model. RLS table in Section 2.13 updated to reflect the finalized `messages`/`conversations` rules. Indexes added on both tables.
- **Aug 30, 2026** — Root cause found and fixed for the "unlock not triggering" bug: `bids/routes.py`'s `select_bid` endpoint was doing bid-selection logic inline rather than calling `bid_service.select_bid()` — bypassing the service layer entirely, so the chat-unlock call never ran. Fixed to call the service method properly. **Locked-state redesign implemented:** `conversation_active_transactions` table created (per-transaction rows, not a single `active_source_id`/`locked` boolean) — supports multiple simultaneous active transactions between the same buyer-shop pair, matching the Problem-B scenario discussed. `ChatService` extended with `is_conversation_locked()`, `get_active_transaction()`, `unlock_conversation()` (now takes `item_name` for the pinned header), `lock_conversation()`. `send_message()` and `get_conversations_for_user()` now compute lock state from active transactions rather than a static column. Unlock wired into `select_bid()` (Core Flow) and `close_auction_with_winner()` (Auctions) with `item_name`; lock wired into both completion paths — `verify-otp` and `override-complete` in `requests/routes.py`. **Fixed:** duplicate-key errors on active transaction inserts. Frontend: `ChatList.jsx`/`ChatView.jsx` built and refined (compact UI), `isOwner` check bug fixed (`user.user_id` not `user.id`), Realtime message subscription via `useChat` hook, chat routes added (`/buyer/chat`, `/shop/chat`, `/chat/:conversationId`), chat button with unread-count badge on both dashboards, role-based navigation fixed. **Phase 5 (In-App Chat) is now functionally complete** — unlock/lock flow verified working end-to-end across Core Flow, Auctions, and both completion paths.
- **Aug 30, 2026 (Phase 5b design)** — Decided to give auctions their own dedicated post-sale flow (delivery/OTP/completion) rather than reusing `requests/*` endpoints — same shape as the Request flow, separate endpoints writing to `auctions` table's existing columns. Flow diagrammed: auction close → notifications (won/sold) + chat unlock → delivery method → shop confirm/deny → OTP (same 5-attempt-cap + override pattern as requests) → completed → notification + chat relock-check. **Cancellation/relist decision:** denied+cancelled auctions don't auto-reopen or re-auction — shop gets a "Relist" action that copies core fields into a fresh `PostAuction` submission (eBay-style relist, not a reopened auction). This is the next thing to build.
- **Aug 30–31, 2026 (Phase 5b design finalized)** — Three implementation questions resolved: (1) delivery address is buyer-supplied post-win, not shop-set at creation — corrected `auctions` schema (4.5) to remove `delivery_method`/`delivery_address` from creation, matching `requests`; (2) OTP generation triggers mirror requests exactly (confirm/pickup-selected/pickup-switch, not on `status='sold'` alone); switch-to-pickup uses no new flag, just updates `delivery_method` and regenerates OTP; (3) added `completed` as a distinct status from `sold` (mirrors `requests`' `purchased`→`completed`); notifications table brought forward from Phase 6 and built now with an upgraded schema (`title`/`body`/`link` instead of just `message`) rather than a throwaway minimal version.
- **Aug 31, 2026** — Phase 5b backend complete: `auctions` status constraint updated (`completed` added), `delivery_method`/`delivery_address` removed from creation payload, `notifications` table live with RLS, all six auction post-sale endpoints built (`/delivery`, `/delivery/confirm`, `/delivery/deny`, `/switch-to-pickup`, `/verify-otp`, `/override-complete`) plus `/relist` (server-side field copy), `GET /auctions` status filter updated, chat lock wired into `verify-otp`/`override-complete`, notification placeholders wired for won/sold/delivery events. **Pending:** frontend UI for all of the above (delivery/confirm/deny/OTP screens on auction detail pages, Relist button), and confirming chat-unlock-on-win correctly populates `conversation_active_transactions` for auctions specifically.
- **Aug 31, 2026 (frontend page plan)** — Decided against a single status-driven detail page for the auction post-sale flow; instead, Auction Dashboard hub fans out to 4 pages per role. Shop: Post Auction + Active Auctions (existing) + **Finalized Auctions** (new — sold/completed/cancelled, delivery confirm/deny, OTP entry, Relist button) + **Auction History** (new — passive full record). Buyer: Browse Auctions + My Bids (existing) + **My Won Auctions** (new — delivery selection, OTP display) + Auction History (shared component, role-scoped). This keeps "still bidding" and "post-sale" cleanly separated rather than one page handling every status.
- **Aug 31, 2026 (Phase 5b fully closed)** — All frontend pieces delivered: `check_delivery_address_if_home_delivery` constraint, new `auction_close_events` audit table, `close-auctions` Edge Function hardened (retry logic, batching, timeout, event logging). Shop: `MyAuctions.jsx` scoped to active-only, new `FinalizedAuctions.jsx` and `AuctionHistory.jsx`, `AuctionDashboard.jsx` updated to 4-card nav, `AuctionDetailShop.jsx` extended. Buyer: new `MyWonAuctions.jsx` and `AuctionHistory.jsx`, `AuctionDashboard.jsx` 4-card nav, `AuctionDetail.jsx` extended. Shared `AuctionHistoryTable.jsx` component reused across both roles. New routes added. **Phase 5b fully closed — auctions now have a complete, symmetric post-sale flow matching the Request flow's mechanics.**
- **Aug 31, 2026 (Phase 5c — Request Dashboard page flow)** — Decided to bring Requests' navigation in line with the same 4-card hub pattern just built for auctions. **Frontend-only, zero backend changes** — existing endpoints and flow logic (`RequestDetail.jsx`, `BidDetail.jsx`, `PostRequest.jsx`, `MyPurchases.jsx`) stay exactly as-is, just reorganized. Buyer hub: Post Request + new My Open Requests + Finalized Requests (=`MyPurchases.jsx` reframed) + Request History. Shop hub: Browse Requests + My Bids (split to pending-only) + new Finalized Bids (list feeding into existing `BidDetail.jsx`) + Bid History. Section 13.4 updated to reflect this is now underway, not deferred. See build order Phase 5c for full page/step plan. Added immediately after Phase 5b, before Phase 6.
- **Sep 1, 2026 (Phase 5c complete)** — Both dashboards built and delivered: buyer `RequestDashboard.jsx` (4 cards + 4 KPI cards), shop `RequestDashboard.jsx` (4 cards + 4 KPI cards). New pages: `MyOpenRequests.jsx`, `FinalizedBids.jsx`, buyer-side `MyBids.jsx` (auction bids). `MyBids.jsx` (shop) split to pending-only with sub-tabs. `BidDetail.jsx` extended with Completed section. KPIs relocated off the main dashboards onto the new hub pages — dashboards are now pure navigation. **Bundled same day:** Profile pages (`Profile.jsx`, `ProfileFormPage.jsx`) redesigned, KPIs removed, professional section layout. Zero backend changes confirmed. **Phase 5c fully closed — Requests and Auctions now share the same symmetric 4-card dashboard pattern.**
- **Sep 2, 2026 (Phase 6 complete)** — Sort added to both `GET /requests` and `GET /auctions` (newest/price_asc/price_desc/most_bids, plus ending_soon for auctions), sort dropdowns live on both browse pages. `reports` table + RLS built; endpoints expanded beyond original scope (`POST /reports`, `GET /reports`, `GET /reports/my`, `PATCH /reports/{id}` for status updates); flagged (pending) items excluded from both browse feeds. `ReportModal.jsx` built and wired into browse pages, detail pages, and `FinalizedBids.jsx` — broader placement than originally scoped. **Phase 6 fully complete.** Note: the `notifications` table/backend portion of Phase 7 (step 35) is already done from Phase 5b — only the Navbar dropdown UI (if not already wired) remains from that step.
- **Sep 2, 2026 (Phase 7 complete)** — `saved_searches` and `favorites` tables + full CRUD/toggle endpoints delivered. Notifications completed: `NotificationDropdown.jsx` live on both dashboards, backend routes (list/unread-count/mark-read/mark-all-read) built, Phase 5b's placeholder notification calls replaced with real implementations across both `auctions/service.py` and `requests/services.py`. **9 of 10 notification trigger points verified via direct DB insertion** (auction won/sold, delivery set/confirmed/denied, switched-to-pickup, transaction completed, override completed, bid selected) — new-chat-message trigger not yet tested. **Follow-up flagged:** natural end-to-end UI flow testing still pending for all triggers (DB-insertion testing isn't the same as confirming the full user flow fires them correctly), and confirm `saved_searches`/`favorites` UI (buttons on cards, saved-search management) is actually wired in — not explicitly confirmed in this changelog.
- **Sep 2, 2026 (Phase 7 UI confirmed)** — `FavoriteButton.jsx`, `SaveSearchButton.jsx`, `SavedSearchesList.jsx` built and wired into both browse pages and both dashboards; `favorites` table has a unique constraint. This closes the one open item flagged above — **Phase 7 is now fully complete with nothing outstanding.** Remaining open item overall: natural end-to-end notification testing (still DB-insertion-verified only) and the untested new-chat-message trigger.
- **Sep 2, 2026 (Phase 7b — database reset, before ML prep)** — Decided to fully wipe transactional tables (`requests`, `bids`, `auctions`, `auction_bids`, `request_events`, and any other tables that accumulated manual-testing junk) rather than selectively filter out bad rows — safer than pattern-matching gibberish test data. `profiles` explicitly untouched (real accounts + Aug 22 fake buyer/shop profiles stay). New `data_source` column (`'seed'`/`'live'`) added to distinguish re-seeded synthetic data from future real activity going forward. Faker seed script re-run after the wipe to generate a fresh, properly-tagged batch. Synthetic data kept indefinitely (not deleted once real data arrives) — training queries just filter by `data_source`, and seed data doubles as a regression-test baseline later. Placed as Phase 7b, immediately before Phase 8 (Reliability & ML Prep).
- **Sep 2, 2026 (Phase 7b complete)** — `data_source` column live on all 5 transactional tables (default `'live'`, check constraint, indexed). Full truncation completed in correct FK order across 12 tables, `profiles` untouched. Seed script updated to tag everything `'seed'` and **expanded to generate auctions + auction bids** (30 auctions, 80 auction bids — new coverage beyond the original Aug 22 run). Final regenerated dataset: 50 requests, 113 bids, 30 auctions, 80 auction bids, 278 request events, all verified tagged. **Database is now clean and ready for Phase 8/9 ML work.**
- **Sep 2, 2026 (Phase 8 complete)** — `shop_reliability_scores` table + `reliability/` module delivered. Scoring formula: response_time (30%) + completion_rate (40%) + selection_rate (30%), 0-100 scale, response-time tiers <2h through >7d. Four endpoints (refresh/single/bulk/top). Badge surfaced on `shop/BidDetail.jsx`, color-coded by tier. **Open question:** original scope intended the badge on the buyer-facing bid comparison view too (where a buyer picks between multiple bids) — currently only on `BidDetail.jsx`, which is more of a shop/post-selection view. Worth confirming this is placed where buyers actually compare bids.
- **Sep 3, 2026 (Phase 9 complete)** — All 5 ML features delivered in one session: new `ml/` module with `config.py`, `data_loader.py` (correctly filters by `data_source`, using the Phase 7b tagging), `model_utils.py`, plus five models — `price_suggestion.py` (Linear Regression), `bid_ranking.py` (price + reliability weighted), `recommendations.py` (Apriori), `demand_forecast.py` (moving average), `fraud_detection.py` (RandomForest) — plus `train.py` pipeline and `test_ml.py` suite. **Flag for later documentation:** fraud detection's training labels/heuristics should be documented, since seed data has no genuine fraud examples to learn from — likely rule-based labeling (e.g. anomalous bid patterns) rather than true supervised fraud data. **Also flag:** no frontend surfacing yet confirmed for these ML outputs (price suggestions, recommendations shown to users) — natural next step. Strong pace: Phase 9 fully done just one day after Phase 7b's data cleanup unblocked it.
- **Aug 12, 2026 (update 2)** — Added synthetic/seed data strategy using Faker, staging Supabase project, to unblock ML prototyping ahead of real data volume.
- **Sep 3, 2026 (Phase 10 design)** — Reviews schema finalized: polymorphic `target_type`/`target_id` (matches `favorites`/`reports` pattern, supports both requests and auctions), one review per transaction per direction (`unique` constraint), public visibility on submission rather than mutual-review-gated (retaliation handled via existing `reports` moderation instead), review prompt UI scoped to `MyPurchases.jsx`/`MyWonAuctions.jsx` only — deliberately not on `TransactionHistory.jsx`, which stays a passive read-only record per its original Section 13.3 design.
- **Sep 4, 2026 (Phase 10 complete)** — `reviews` table + RLS + DB-level validation trigger delivered (transaction completed, reviewer is a real participant, and reviewed_id must be the actual counterparty — this last check closes a gap flagged during schema review). Backend `reviews/` module with 7 endpoints (create, profile list, my-reviews, target list, check, stats, delete) — broader than originally scoped. Frontend: `ReviewStars.jsx`, `ReviewModal.jsx`, `ReviewBadge.jsx`, review button on `MyPurchases.jsx` and `MyWonAuctions.jsx` exactly per plan, `TransactionHistory.jsx` confirmed untouched. **Phase 10 fully complete — v2 build order now shows every phase through Phase 10 done; only Phase 11 (Mobile/PWA) and Phase 12 (Privacy & Compliance) remain.**
- **Sep 4, 2026 (Phase 11 complete — first-ever PWA/mobile support built)** — Converted to a PWA via `vite-plugin-pwa`, no backend changes, no hand-written service worker. Icons prepared, plugin configured in `vite.config.js` (name/short_name/theme_color/background_color matching existing design palette/`display: standalone`), build verified (`dist/sw.js` + workbox chunk generated, 6 precache entries ~1.25MB), deployed to Vercel, confirmed working on an actual phone — "Add to Home Screen" installs standalone. **Phase 11 fully complete. Only Phase 12 (Privacy & Compliance) remains in the v2 build order.**
- **Sep 4, 2026 (Phase 12 complete — 🎉 V2 BUILD ORDER COMPLETE)** — `PrivacyPolicy.jsx` (7 sections) and `TermsOfService.jsx` (5 sections) built, routed at `/privacy`/`/terms`, legal disclaimer on signup, legal footer links on Profile. Full sensitive-field audit across 14 fields confirming optional-status and public/private visibility all match intended design. **This closes Phase 12 — every phase from Phase 0 through Phase 12 in the v2 build order is now complete.** Everything remaining is explicitly deferred by deliberate decision (admin panel, full shop verification, full-text search, requests-format-change specifics, watching/live-bid-count, email digests, shop-side ML) or flagged as a small follow-up worth a final check (reliability badge placement on `RequestDetail.jsx`, end-to-end notification flow testing, fraud-detection label documentation) — none of it blocks the app.
- **Sep 4, 2026 (v3 scope decided)** — v2 formally closed to new features. v3 priority set as **stabilization, not expansion**: (1) bug fixing pass, (2) frontend design pass on dashboards/hub pages — currently functionally complete but visually sparse, needs fuller use of the existing shadcn/ui + Tailwind + Framer Motion foundation from the v1 redesign, especially on the newer v2 pages built fast without the same design attention, (3) performance investigation — page load times degrading, specifically flagged on `BrowseRequests.jsx`/`BrowseAuctions.jsx`; likely causes to profile: unoptimized queries, N+1-style per-card lookups (images/reliability/bid counts), missing indexes, or client-side waterfalling — needs profiling before fixing. The existing "Deferred" feature list stays as v3-candidate material but is explicitly lower priority than these three stabilization areas.