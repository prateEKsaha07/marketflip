# MarketFlip v2 — Build Order
### Companion to `marketflip-v2-roadmap.md`

Sequenced so each step unlocks or de-risks the next. Edit as we go.

---

## Phase 0: Foundational Safeguards (do alongside/before Phase 1 tables)
0. RLS policies drafted for every new table as it's created (not deferred) — public-read/private-write pattern for `categories`/`shop_reliability_scores`, owner-only for `saved_searches`/`favorites`/`notifications`, matched-parties-only for `conversations`/`messages`, insert-only/no-public-read for `request_events`

---

## Phase 1: Data Foundation (do first — unlocks everything else)
1. `categories` table — migrate existing hardcoded `category` string field to reference this
2. `request_events` table — start logging views/bid_placed/selected immediately (ML data starts accumulating from day one of v2, don't wait)
3. Extend `profiles` with new columns (bio, business_hours, preferences, computed stats fields — start as nullable, backfill later); keep DOB/gender optional, not required
4. Extend `requests` with `views_count`, `urgency`, `preferred_contact_time`
5. **Faker seed script** — set up a separate staging Supabase project, write Python script using `Faker` + custom logic to generate realistic buyers/shops/requests/bids/auctions matching schema (Bhilai pincodes, electronics price ranges, realistic bid variance). Use this to prototype ML pipelines (Phase 6) without waiting on live volume.

---

## Phase 2: Delivery Confirmation Flow
6. Add `delivery_confirmed_by_shop`, `delivery_response_at` to `requests`
7. Backend: `PATCH /requests/{id}/delivery/confirm`, `PATCH /requests/{id}/delivery/deny`
8. Frontend: extend `shop/BidDetail.jsx` (confirm/deny UI), extend `buyer/MyPurchases.jsx` (shows shop's response, pickup/cancel option on denial)

*Small, high-value, fully reuses existing pages — good warm-up before auctions.*

---

## Phase 3: Image Uploads (Cloudinary, multi-image)
9. Set up Cloudinary account, free-tier upload preset (unsigned, or signed via backend for more control)
10. Add validation: max file size (e.g. 5MB), type whitelist (jpg/png/webp), max image count per listing (e.g. 3–5) — client-side + server-side check on Cloudinary response metadata
11. Migrate `reference_image`/`image_url` single fields to `image_urls` array/jsonb field on `requests` and `auctions`
12. Frontend: replace URL text input with multi-file picker + upload widget in `PostRequest.jsx`, `PostAuction.jsx` (once built)
13. Card components: show first/primary image only (keep cards lightweight)
14. Detail pages (`RequestDetail.jsx`, future auction detail): image carousel/gallery component for all uploaded images

---

## Phase 4: Seller Auctions (new core flow #2)
15. `auctions` table (with delivery + multi-image fields baked in per Section 4.5 of roadmap)
16. `auction_bids` table
17. Backend routes: `POST /auctions`, `GET /auctions`, `GET /auctions/{id}`, `POST /auctions/{id}/bids`, `DELETE /auctions/{id}` (cancel, shop only)
18. **Sniping prevention:** in the `POST /auctions/{id}/bids` handler, if a bid lands within N minutes (e.g. 5) of `end_time`, auto-extend `end_time` by a few minutes; repeat until no late bids land
19. Auto-close cron/Edge Function (mirrors `expire-requests`): at `end_time`, set `status='sold'`, `winning_bid_id` = highest bid, `closed_at` = now — or `status='expired'` if zero bids
20. Frontend: `shop/PostAuction.jsx` (adapt `buyer/PostRequest.jsx`), `buyer/BrowseAuctions.jsx` (adapt `shop/BrowseRequests.jsx`), auction bid placement (adapt existing bid modal)
21. Post-auction flow: winner sees delivery method selection (reuse Phase 2 pattern) → shop confirm/deny → verify (reuse `MyPurchases.jsx`/`BidDetail.jsx` logic)

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
- Shop verification badge (business proof upload + manual approval)
- Full-text search on item_name/description

---

## Notes
- This order prioritizes: **data collection starts early** (Phase 1) so ML (Phase 9) isn't blocked later by insufficient data.
- Faker-generated seed data (Phase 1, step 5) bridges the gap between "app just launched" and "enough real data to train on" — kept in a separate staging project so it never contaminates production/live analytics; also needed to give Apriori (Phase 9, step 41) enough co-occurrence data to be meaningful.
- RLS (Phase 0) is called out separately and explicitly so it isn't skipped like it nearly was in early POC development — write the policy at the same time as the table, not after.
- Delivery confirmation (Phase 2) is intentionally before Auctions (Phase 4) — smaller scope, validates the pattern that Auctions' post-sale flow will reuse.
- Multi-image Cloudinary (Phase 3) is placed before Auctions so `PostAuction.jsx` can be built with proper image upload from the start, rather than retrofitting later.
- Sniping prevention (Phase 4, step 18) is built into the auction bid handler itself, not bolted on after — cheaper to do at the same time as the base bid endpoint.
- Chat (Phase 5) comes after Auctions since it needs both Core Flow selection and Auction win as trigger points; moderation is built alongside chat, not after.
- Sort + report/flag (Phase 6) grouped together as both are browse/listing-page additions, done right after both listing types (requests + auctions) exist.
- Reliability scores (Phase 8) must come before ML bid ranking (Phase 9, step 40) since ranking depends on it.
- Mobile (Phase 11) is last — no point wrapping/PWA-ing a UI that's still changing.
- Privacy/compliance (Phase 12) is last but should happen before real users beyond your own testing use the app — not a hard blocker for continued dev.
- Admin panel and shop verification are deliberately deferred, not forgotten — revisit once core v2 feature set is live.

## License

Copyright © 2026 Prateek Saha

Licensed under the Apache License, Version 2.0.
See the [LICENSE](LICENSE) file for details.