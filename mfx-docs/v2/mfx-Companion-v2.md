# MarketFlip v2 — Build Order
### Companion to `marketflip-v2-roadmap.md`

Sequenced so each step unlocks or de-risks the next. Edit as we go.

---

## Phase 0: Foundational Safeguards (do alongside/before Phase 1 tables)
0. RLS policies drafted for every new table as it's created (not deferred) — public-read/private-write pattern for `categories`/`shop_reliability_scores`, owner-only for `saved_searches`/`favorites`/`notifications`, matched-parties-only for `conversations`/`messages`, insert-only/no-public-read for `request_events`

---

## Phase 1: Data Foundation — ✅ DONE (Aug 17, 2026)
1. `categories` table — migrate existing hardcoded `category` string field to reference this
2. `request_events` table — start logging views/bid_placed/selected immediately (ML data starts accumulating from day one of v2, don't wait)
3. Extend `profiles` with new columns (bio, business_hours, preferences, computed stats fields — start as nullable, backfill later); keep DOB/gender optional, not required
4. Extend `requests` with `views_count`, `urgency`, `preferred_contact_time`
5. **Faker seed script** — ✅ DONE (Aug 22, 2026). Built `mfx-core/utils/seed_data.py`. *Note: run against the same (production) Supabase project for now, not a separate staging one as originally planned — flagged to revisit/separate later, not blocking.* Generated: 15 buyers + 12 shops (kept 2 real users), 50 requests across 5 categories, 120 bids (108 pending/12 selected), 272 request_events, realistic lifecycle mix (32 open, 7 completed, 6 expired, 5 purchased). Used Supabase Auth Admin API to bypass email confirmation for bulk fake users; duplicate-checking on all inserts.

---

## Phase 2: Delivery Confirmation Flow — ✅ DONE (Aug 17, 2026)
*(also added, beyond original scope: `PATCH /requests/{id}/switch-to-pickup`, cancel-order action, and tab-gating in `buyer/Dashboard.jsx`/`MyPurchases.jsx` so unresolved deliveries stay in "Selected" tab while pickup/confirmed move to "Verify" tab)*
6. Add `delivery_confirmed_by_shop`, `delivery_response_at` to `requests`
7. Backend: `PATCH /requests/{id}/delivery/confirm`, `PATCH /requests/{id}/delivery/deny`
8. Frontend: extend `shop/BidDetail.jsx` (confirm/deny UI), extend `buyer/MyPurchases.jsx` (shows shop's response, pickup/cancel option on denial)

*Small, high-value, fully reuses existing pages — good warm-up before auctions.*

---

## Phase 3: Image Uploads (Cloudinary, multi-image) — ✅ DONE (Aug 23, 2026), except shop-side display (see note below)
9. Set up Cloudinary account, free-tier upload preset (unsigned, or signed via backend for more control)
10. Add validation: max file size (e.g. 5MB), type whitelist (jpg/png/webp), max image count per listing (e.g. 3–5) — client-side + server-side check on Cloudinary response metadata
11. Migrate `reference_image`/`image_url` single fields to `image_urls` array/jsonb field on `requests` and `auctions`
12. Frontend: replace URL text input with multi-file picker + upload widget in `PostRequest.jsx`, `PostAuction.jsx` (once built)
13. Card components: show first/primary image only (keep cards lightweight)
14. Detail pages (`RequestDetail.jsx`, future auction detail): image carousel/gallery component for all uploaded images

---

## Phase 3b: Shop-Side Image Display — ✅ DONE (Aug 24, 2026)
13b. Image carousel added to shop `BidDetail.jsx`; shop `BrowseRequests.jsx` cards show first image (buyer cards remain text-only by design — see roadmap 2.18). Bonus fixes: new `GET /bids/{id}` endpoint, `MyBids`→`BidDetail` navigation fixed for all statuses, `/bids` trailing-slash route bug fixed, emojis replaced with Lucide icons.

---

## Phase 4: Seller Auctions (new core flow #2) — ✅ DONE (Aug 27, 2026)

**Folder structure (backend `mfx-core`):**
```
auctions/        — routes.py, schemas.py, service.py (POST/GET /auctions, GET/{id}, DELETE/{id})
auction_bids/     — routes.py, schemas.py, service.py (POST /auctions/{id}/bids)
supabase/functions/close-auctions/index.ts   — new Edge Function, mirrors expire-requests
```
**Folder structure (frontend `mfx-web`):**
```
pages/shop/PostAuction.jsx, MyAuctions.jsx   — new
pages/buyer/BrowseAuctions.jsx, AuctionDetail.jsx   — new
```
**Navigation:** auctions sit behind an intermediate "Auction Dashboard" hub on both roles (see roadmap Section 12) rather than flat top-level nav links.

15. ✅ `auctions` table (with delivery + sniping-prevention fields baked in per Section 4.5 of roadmap) — done Aug 27
16. ✅ `auction_bids` table — done Aug 27
16b. ✅ RLS policies for both tables — done Aug 27
16c. ✅ Auction schemas (creation, update, bidding) — done Aug 27
17. ✅ Backend routes: `POST /auctions`, `GET /auctions` (+ filters, `status="all"`, limit/offset), `GET /auctions/{id}`, `POST /auctions/{id}/bids`, `DELETE /auctions/{id}` — done Aug 27
18. ✅ **Sniping prevention** — done Aug 27 (auto-extends `end_time` by 5 min on late bids)
19. ✅ Auto-close Edge Function `close-auctions`, scheduled every 5 min — done Aug 27
20. ✅ Frontend: Shop Auction Dashboard, `PostAuction.jsx`, `MyAuctions.jsx`, Shop Auction Detail, Buyer Auction Dashboard, `BrowseAuctions.jsx`, Buyer Auction Detail — done Aug 27
21. ✅ Post-auction delivery/verify flow — done Aug 27 (reuses Phase 2 pattern, extended for auctions)

*Bug fix along the way: timezone issue in `placeBid` function. Bid history now shows buyer names.*

---

## Phase 4b: Profile Completion Page — ✅ DONE (Aug 27–29, 2026)

**Shop side (Aug 27/28):**
- `gst_number` column added to `profiles`
- New frontend `profile/` module: `Profile.jsx`, `ProfileForm.jsx`, `ProfileLayout.jsx`
- Full read/write/display loop; key fields also surfaced on Shop Dashboard

**Buyer side + finishing touches (Aug 29):**
- New columns added: `identity_number`, `identity_type`, `delivery_address`, `budget_range_preference`, `notification_preferences`
- `ProfileUpdate` schema extended with buyer fields; `GET /auth/profiles/{user_id}` returns them
- **Immutability implemented:** `identity_number` locked once set (matches `gst_number`)
- **Role-specific validation added:** buyers can't set shop fields, shops can't set buyer fields, on profile update
- `Profile.jsx`/`ProfileForm.jsx` extended to display/edit all new buyer fields; locked badge shown for immutable fields
- **Verified Shop badge:** implemented on Shop Dashboard, conditional on `gst_number` presence

**Still pending (from original 21d):** surfacing GST/identity fields on matched request/auction detail pages, and showing the Verified badge on bid cards (per your decision that it should appear both on shop profile/cards AND on bid cards when buyers compare bids) — badge exists on dashboard only so far, not yet on bid cards.

---

## Phase 4c: OTP-Based Transaction Completion — ✅ DONE (Aug 29, 2026)

**Mechanics as built — in-app code, no third-party SMS/email cost:**
1. OTP (`verification_code`) generated at multiple trigger points: delivery confirmed by shop, pickup switch, pickup selected as delivery method, and bid selected (for pickup requests specifically — this last one was a bug fix, see below)
2. Buyer holds the code (shown in `MyPurchases.jsx`, with show/hide, copy, attempts-remaining, max-attempts warning)
3. Shop enters the code in `BidDetail.jsx` (works for both home delivery and pickup)
4. Backend verifies via `POST /requests/{id}/verify-otp` (max 5 attempts)

**Delivered:**
- Schema: `verification_code`, `verification_attempts`, `completed_via_override` added to both `requests` and `auctions`; `reserve_price` added to `auctions`
- `utils/verification.py` with `generate_verification_code()`
- OTP generation wired into: `confirm_delivery`, `switch-to-pickup`, `set_delivery_method` (pickup), `select_bid` (pickup requests)
- `deny_delivery` clears `verification_code`/`verification_attempts` (correct — no valid handoff if delivery is denied)
- `POST /requests/{id}/verify-otp` — shop submits code, max 5 attempts
- `PATCH /requests/{id}/override-complete` — buyer override after max attempts (the dispute/fallback path from 21h)
- Schemas updated: `RequestResponse`, `DeliveryConfirmResponse` include verification fields
- Frontend: OTP section in `BidDetail.jsx` (both delivery types), OTP display in `MyPurchases.jsx` (active + Completed tab for record-keeping)
- **Bug fixes:** pickup-flow OTP wasn't generating on bid selection — fixed by adding generation at `select_bid` for pickup requests; `showOtpVerification` condition fixed to cover both delivery types; delivery-method badge added to OTP section for clarity

**Reserve price (21k):** ✅ fully done (Aug 29) — `close-auctions` Edge Function now checks `reserve_price`; added a `reserve_not_met → expired` status path when the highest bid doesn't meet it. Deployed to production.

---

## Phase 4d: Transaction History / Reports Page — ✅ DONE (Aug 29, 2026)

**Design (decided):** one shared page/route, accessible to both roles via a "Reports"/"History" button on their respective dashboards — not two separate buyer/shop pages. Content is naturally role-scoped since the underlying query filters by `current_user.id` (a buyer sees their own requests + bids made; a shop sees requests they bid on + auctions they posted).

**Structure:**
- Two top-level sections/tabs: **Requests** and **Auctions**
- Within each section, further split by status (mirroring existing dashboard tabs — Open/Completed/Expired/Deleted for requests; Active/Sold/Expired/Cancelled for auctions)

**Delivered:**
- Backend: `GET /bids/auction-bids` (buyer auction bid history), `GET /bids/shop-bids` (shop bid history) — new endpoints, reused alongside existing `GET /requests`/`GET /auctions`
- Frontend: `TransactionHistory.jsx` — shared component, mounted at `/buyer/history` and `/shop/history` (same component, role-scoped by data, not a single literal URL — matches the "shared page" intent)
- Report-style tables for Requests and Auctions sections; summary KPI cards (Total, Completed/Selected, Auctions, Sold/Won); status-based filtering tabs with counts
- Role-based views: buyers see requests + auction bids; shops see bids + auctions posted
- "History" button added to both `buyer/Dashboard.jsx` and `shop/Dashboard.jsx`
- Emojis replaced with Lucide icons; safe handling added for missing/undefined data

---

## Phase 5: In-App Chat (contact-based, WhatsApp-style) — ✅ DONE (Aug 30, 2026)

**Design (as built):**
- **Conversation key:** one persistent thread per `(buyer_id, shop_id)` pair — not per-transaction. A buyer and shop who transact multiple times over time share one continuous thread with full history, not a new chat each time.
- **Lock/unlock:** **computed, not stored** — a conversation is locked when it has zero rows in `conversation_active_transactions`. Bid selection / auction win inserts a row (unlocks); transaction completion deletes it (relocks once no active transactions remain). This design supports **multiple simultaneous active transactions** between the same pair, correcting a gap in the original single-`active_source_id` plan.
- **Pinned product header:** driven by rows in `conversation_active_transactions` (each carries a denormalized `item_name`), so the chat can show one or more currently-active items being discussed.
- **History persists:** old messages are never deleted — they remain visible as a record across the whole relationship, including through locked periods.
- **UI:** WhatsApp-style — `ChatList.jsx` (all conversations, compact UI) + `ChatView.jsx` (individual thread), both linked from dashboards with unread-count badges.

**Final schema:** see roadmap Section 4.13/4.13b/4.14 (`conversations`, `conversation_active_transactions`, `messages`).

22. ✅ Tables created with RLS — done Aug 29/30 (`conversations`, `messages`, `conversation_active_transactions`)
23. ✅ Backend: `ChatService` methods (`is_conversation_locked`, `get_active_transaction`, `unlock_conversation`, `lock_conversation`); unlock wired into `select_bid()` and `close_auction_with_winner()`; lock wired into `verify-otp` and `override-complete` endpoints — done Aug 30. **Bug found and fixed:** `bids/routes.py` was doing selection logic inline instead of calling the service method, silently bypassing the unlock call entirely — root-caused and fixed.
24. ✅ Realtime: `useChat` hook subscribes to `messages` — done Aug 30
25. ⬜ **Moderation:** profanity filter, rate limiting, report/block — not yet built (still pending, was original scope item 25)
26. ✅ Frontend: `ChatList.jsx`, `ChatView.jsx`, routes (`/buyer/chat`, `/shop/chat`, `/chat/:conversationId`), dashboard chat buttons with unread badges, `isOwner` bug fixed (`user.user_id` not `user.id`) — done Aug 30

**Remaining for this phase:** moderation (step 25) is the one piece not yet built — everything else (schema, unlock/lock logic, realtime, UI, navigation) is functionally complete and verified working.

---

## Phase 5b: Auction Post-Sale Flow — BACKEND ✅ DONE (Aug 31, 2026), frontend pending

**Design decisions locked in (Aug 30–31):**
- **Delivery address:** buyer-supplied post-win, not shop-set at creation — corrected: `delivery_method`/`delivery_address` removed from auction creation, matching how `requests` already works (delivery is *to* the buyer, set when they arrange delivery, not baked in by the shop upfront)
- **OTP triggers:** mirror requests exactly — shop confirms home delivery, pickup selected, or pickup switch (not on `status='sold'` alone, which only means "winner determined," not "delivery arranged")
- **Switch-to-pickup:** no new boolean flag — just updates `delivery_method='pickup'` and regenerates OTP, consistent with the requests pattern
- **Completed vs Sold:** added `completed` as its own status (not overloaded onto `sold`) — `sold` = winner determined, `completed` = OTP verified/overridden. Mirrors `requests`' `purchased` → `completed` two-stage pattern; also what triggers chat relock.
- **Notifications:** brought forward from Phase 6, built now with a fuller schema (`title`, `body`, `link` — better than the originally-scoped `message`-only version) rather than a throwaway "minimal" table
- **Relist:** built server-side as `POST /auctions/{id}/relist` (backend copy, not frontend-only prefill) — more consistent with existing API structure

**Delivered (Aug 31):**
- `auctions` status constraint updated to include `completed`; `delivery_method`/`delivery_address` removed from creation payload
- `notifications` table created with RLS (Phase 6 table, built early)
- `PATCH /auctions/{id}/delivery` (buyer sets method + address), `/delivery/confirm` (shop confirms, generates OTP), `/delivery/deny` (shop denies, clears OTP), `/switch-to-pickup` (regenerates OTP), `POST /auctions/{id}/verify-otp` (5-attempt cap), `PATCH /auctions/{id}/override-complete`, `POST /auctions/{id}/relist`
- `GET /auctions` status filter updated to include `completed`
- Chat lock integration added to `verify-otp` and `override-complete`
- Notification placeholders wired for won/sold/delivery events

**Frontend page plan (finalized Aug 31) — Auction Dashboard hub fans out to 4 pages per role, not a single status-driven detail page:**

**Shop side:**
1. Post Auction — existing, unchanged
2. Active Auctions — existing, unchanged (status='active' only, no post-sale flow)
3. **Finalized Auctions** (new) — sold/completed/cancelled auctions; this is where the actual Phase 5b post-sale flow lives: delivery confirm/deny UI, OTP entry (mirrors `BidDetail.jsx`), max-attempts warning, and the **Relist** button for cancelled auctions
4. **Auction History** (new) — full log, all statuses, passive read-only record — distinct from Finalized Auctions, which is actionable

**Buyer side (mirrored):**
1. Browse Auctions — existing, unchanged
2. My Bids / active bidding — existing, unchanged
3. **My Won Auctions** (new) — delivery method selection, OTP display (show/hide, copy — mirrors `MyPurchases.jsx`), status tracking through to completed
4. **Auction History** (new — likely a shared component with shop side's History page, role-scoped by query, not a separate build)

**✅ ALL DONE (Aug 31, 2026) — Phase 5b fully complete, backend and frontend:**
- Schema: `check_delivery_address_if_home_delivery` constraint added; new `auction_close_events` table for audit history tracking
- `close-auctions` Edge Function hardened: retry logic, backend warm-up, direct Supabase fallback, batch processing (5 at a time), event logging, 60s timeout
- Shop: `MyAuctions.jsx` scoped to active-only, `FinalizedAuctions.jsx` (new — confirm/deny + OTP + Relist), `AuctionHistory.jsx` (new — read-only), `AuctionDashboard.jsx` updated with 4-card nav, `AuctionDetailShop.jsx` extended with delivery/OTP
- Buyer: `MyWonAuctions.jsx` (new — delivery selector + OTP display), `AuctionHistory.jsx` (new), `AuctionDashboard.jsx` 4-card nav, `AuctionDetail.jsx` extended with OTP display
- Shared: `components/auction/AuctionHistoryTable.jsx` (reused across both roles' History pages, avoiding duplication)
- Routes: `/shop/finalized-auctions`, `/shop/auction-history`, `/buyer/my-won-auctions`, `/buyer/auction-history`

**Phase 5b is fully closed out.** Next per build order: Phase 6 (Sort + Report/Flag) — though note the `notifications` table (originally Phase 6 scope) is already built, so Phase 6 now only needs sort + reports/flagging.

---

## Phase 5c: Request Dashboard Page Flow — ✅ DONE (Sep 1, 2026)

**Design (as built):** Request flow's navigation brought in line with the 4-card Auction Dashboard pattern from Phase 5b. **Zero backend changes confirmed** — all existing endpoints and business logic stayed untouched, purely a frontend reorganization.

**Buyer hub delivered:** `RequestDashboard.jsx` (4 cards: Post Request, My Open Requests, Finalized Requests, Request History) with 4 KPI cards (Total Requests, Open Requests, Finalized, Total Bids). New `MyOpenRequests.jsx` (status='open' only). New `MyBids.jsx` (buyer's auction bids — a naming overlap with the shop-side `MyBids.jsx`, worth noting since they're different pages serving different roles/purposes).

**Shop hub delivered:** `RequestDashboard.jsx` (4 cards: Browse Requests, My Bids, Finalized Bids, Bid History) with 4 KPI cards (Total Bids, Pending, Selected, Completed). New `FinalizedBids.jsx` (selected/rejected bids, links into existing `BidDetail.jsx`). `MyBids.jsx` split to pending-only with sub-tabs (All, Selected, Rejected, Completed). `BidDetail.jsx` extended with a Completed section and conditional back-navigation. `BrowseRequests.jsx` back button now routes to the new hub.

**KPIs relocated:** removed from `buyer/Dashboard.jsx` and `shop/Dashboard.jsx` (now pure navigation) and moved onto the respective `RequestDashboard.jsx` hub pages — cleaner separation of "where do I go" vs. "what's my status."

**Bonus (bundled same day, frontend-only so consistent with phase scope):** `Profile.jsx` and `ProfileFormPage.jsx` redesigned — KPIs removed, professional section-based layout.

**Routes added:** `/buyer/requests`, `/buyer/my-open-requests`, `/buyer/my-bids`, `/shop/requests`, `/shop/finalized-bids`.

**Phase 5c fully complete — Requests and Auctions now share the same symmetric 4-card dashboard pattern across both roles.**

---

## Phase 6: Browse Improvements — Sort + Report/Flag
27. Add `sort` query param support to `GET /requests` and `GET /auctions` (newest, price asc/desc, most bids, ending soon)
28. Frontend: sort dropdown in `shop/BrowseRequests.jsx` toolbar and future `buyer/BrowseAuctions.jsx` toolbar
29. `reports` table
30. Backend: `POST /reports` (any authenticated user can report a listing/user/message), flagged listings excluded from browse feeds while `status='pending'`
31. Frontend: report/flag icon+modal on request/auction cards and detail pages
32. Manual review via Supabase dashboard for now — no admin panel yet

---

## Phase 7: Engagement Features
33. `saved_searches` table + backend + simple UI in `buyer/Dashboard.jsx`
34. `favorites` table + backend + bookmark button on request/auction cards
35. `notifications` table + backend + notification dropdown with unread badge count in `Navbar.jsx` (in-app only)
   - Trigger points: delivery confirmation needed (shop), bid selected (shop), outbid on auction (buyer), auction won (buyer), new chat message

---

## Phase 8: Reliability & ML Prep
36. `shop_reliability_scores` table
37. Backend job to compute score periodically (response_time avg, completion_rate, selection_rate) from data now available via `request_events`, `bids`, `auctions`
38. Surface score on shop profile / bid cards (buyer sees it when comparing bids)

---

## Phase 9: ML Features
39. **Price suggestion** (regression) — needs sufficient real `requests`/`bids` volume from live usage
40. **Bid ranking/recommendation** — combine price + `shop_reliability_scores`
41. **Category/item recommendations (Apriori)** — association rule mining on `request_events`/`bids` co-occurrence data; surface as "related requests"/"shops who bid on this also bid on..." sections
42. **Demand forecasting** (time-series, by pincode/category) — needs `request_events` history
43. **Fraud/spam detection** (classification) — needs labeled or heuristic-flagged bad-bid examples

---

## Phase 10: Reviews (later, not urgent)
44. `reviews` table + backend + UI on `MyPurchases.jsx`/`CompletedTransactions.jsx` (post-transaction prompt)

---

## Phase 11: Mobile Support (after v2 web stabilizes)
45. PWA conversion (manifest.json, service worker, installable) — default recommended path
46. Re-evaluate React Native/Expo wrapper only if a specific need arises (app store presence, deeper native features)

---

## Phase 12: Privacy & Compliance (before wider launch beyond your own testing)
47. Draft a basic privacy policy / terms of use covering what's collected and why (DOB, gender, location, chat messages, behavioral events)
48. Confirm sensitive fields (DOB, gender) stay optional and are not exposed on public profile views
49. Review what's shown publicly vs. stored-only across all new profile/behavioral fields

---

## Deferred (not scoped yet — noted for future consideration)
- Admin panel/role (approve verifications, moderate reports at scale)
- Shop verification badge — **full** manual-approval version (partial GST-based badge is v2, see Phase 4b)
- Full-text search on item_name/description
- Requests flow/format change, similar to auction restructure — explicitly "at the very last," no specifics yet
- "Watching" / live bid count on auctions (via extending `favorites`) — needs Phase 7 first, v3 candidate
- Notification digest (email) — needs new external email service, in-app-only stays the v2 decision

---

## Notes
- This order prioritizes: **data collection starts early** (Phase 1) so ML (Phase 9) isn't blocked later by insufficient data.
- Faker-generated seed data (Phase 1, step 5) bridges the gap between "app just launched" and "enough real data to train on" — kept in a separate staging project so it never contaminates production/live analytics; also needed to give Apriori (Phase 9, step 41) enough co-occurrence data to be meaningful.
- RLS (Phase 0) is called out separately and explicitly so it isn't skipped like it nearly was in early POC development — write the policy at the same time as the table, not after.
- Delivery confirmation (Phase 2) is intentionally before Auctions (Phase 4) — smaller scope, validates the pattern that Auctions' post-sale flow will reuse.
- Multi-image Cloudinary (Phase 3) is placed before Auctions so `PostAuction.jsx` can be built with proper image upload from the start, rather than retrofitting later.
- Sniping prevention (Phase 4, step 18) is built into the auction bid handler itself, not bolted on after — cheaper to do at the same time as the base bid endpoint.
- Phases 4b/4c/4d (profile completion, OTP verification, transaction history) were raised the same day Phase 4 finished — placed right after Auctions since 4b/4c directly touch flows Auctions and Core Flow both just built (delivery/verify), and 4d is a natural follow-on reporting surface. 4c's mechanics are finalized (buyer holds code, shop enters it, retry cap + buyer-override fallback) — no third-party OTP/SMS cost. Reserve price bundled into 4c since it shares the same auction close-out logic. Not yet started; sequence among 4b/4c/4d themselves isn't fixed — pick whichever fits next.
- Chat (Phase 5) comes after Auctions since it needs both Core Flow selection and Auction win as trigger points; moderation is built alongside chat, not after.
- Sort + report/flag (Phase 6) grouped together as both are browse/listing-page additions, done right after both listing types (requests + auctions) exist.
- Reliability scores (Phase 8) must come before ML bid ranking (Phase 9, step 40) since ranking depends on it.
- Mobile (Phase 11) is last — no point wrapping/PWA-ing a UI that's still changing.
- Privacy/compliance (Phase 12) is last but should happen before real users beyond your own testing use the app — not a hard blocker for continued dev.
- Admin panel and shop verification are deliberately deferred, not forgotten — revisit once core v2 feature set is live.