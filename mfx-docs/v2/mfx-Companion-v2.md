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

## Phase 4b: Profile Completion Page (new, raised Aug 27)
21b. Build profile edit/complete page for both roles — surfaces the Phase 1 `profiles` extensions (bio, business_hours, etc.) that currently have no UI
21c. Add identity fields: shop GST number (likely immutable once set), buyer phone/ID number (immutability TBD)
21d. Surface these fields on request/auction detail pages once matched (post-selection), similar to existing contact-reveal pattern
21e. Decide exact field set + which are immutable vs. editable before building (see roadmap Section 13.1 open question)

---

## Phase 4c: OTP-Based Transaction Completion (finalized mechanics, Aug 27)

**Decided mechanics — in-app code, no third-party SMS/email cost:**
1. On delivery confirmation (home delivery confirmed by shop, or pickup arranged), backend generates a random 4-digit `verification_code`, stored on the `requests`/`auctions` row
2. **Buyer holds the code** — shown only in their app (`MyPurchases.jsx` / auction equivalent)
3. Physical handoff happens — buyer shares the code with the shop in person
4. **Shop enters the code** in their app (`BidDetail.jsx` / auction equivalent) to confirm
5. Backend checks entered code against stored → match sets `status='completed'`; mismatch returns error, allows retry

21f. Schema: add `verification_code text, nullable`, `verification_attempts integer default 0`, `completed_via_override boolean default false` to both `requests` and `auctions`
21g. Backend: generate code on delivery-confirmed/pickup-ready transition; verification endpoint for shop to submit code; increment `verification_attempts` on mismatch
21h. **Dispute/fallback path (required):** cap attempts (e.g. 5); after cap, allow buyer to manually mark completed instead, setting `completed_via_override = true` for future admin/dispute visibility (no admin panel yet, this is the interim safety net)
21i. Frontend: code display on buyer's `MyPurchases.jsx`/auction equivalent; code entry UI on shop's `BidDetail.jsx`/auction equivalent; override button on buyer side after attempt cap is hit
21j. Replaces the current single-button verify step in both `requests.verify` flow (Phase 2) and future auction post-sale verify step (Phase 4, step 21) — test existing verify edge cases (denial, pickup-switch) still work with this layered in
21k. **Reserve price (v2-scoped, from roadmap 13.5):** add `reserve_price integer, nullable` to `auctions`; `close-auctions` Edge Function checks highest bid against it — if unmet, auction doesn't auto-sell (goes unsold/expired instead of `sold`) even past `end_time`. Bundle here since it touches the same close-out logic already built in Phase 4 step 19.

---

## Phase 4d: Transaction History / Reports Page (new, raised Aug 27)
21l. New user-facing page: combined request + auction transaction history/log — distinct from the dashboard KPI cards and from the platform-analytics-dashboard idea explicitly skipped in Section 2.12
21m. Scope for now: chronological history + basic summary (counts, totals) — no ML yet
21n. Reserve as the future surface for ML outputs (Phase 9: price trends, demand patterns, personal insights) once those features exist — don't over-build the ML-facing parts now

---

## Phase 5: In-App Chat (post-selection only)
22. `conversations` table, `messages` table
23. Backend: auto-create conversation on bid selection (`PATCH /bids/{id}/select`) and on auction auto-close with a winner
24. Backend/Realtime: Supabase Realtime subscription on `messages` filtered by `conversation_id`
25. **Moderation:** basic profanity/abuse keyword filter on send, rate limiting on message frequency, report/block action (block prevents further messages from that user)
26. Frontend: `Chat.jsx` component — message list + input, opened from `RequestDetail.jsx`/`MyPurchases.jsx` (buyer) and `BidDetail.jsx` (shop)

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