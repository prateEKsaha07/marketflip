date: 8/16/2026
changes:
- categories table created with RLS
- request_events table created with RLS
- profiles table extended with new columns
- requests table extended with new columns
- Existing category data migrated to the new structure

date: 8/17/2026
changes:
- Added delivery_method, delivery_address, delivery_confirmed_by_shop, delivery_response_at columns to requests table
- Extended RequestCreate and RequestResponse schemas to include delivery fields
- Added confirm_delivery() and deny_delivery() service methods in RequestService
- Added PATCH /requests/{id}/delivery/confirm endpoint (shop confirms home delivery)
- Added PATCH /requests/{id}/delivery/deny endpoint (shop denies home delivery)
- Added PATCH /requests/{id}/delivery endpoint (buyer sets delivery method)
- Added PATCH /requests/{id}/switch-to-pickup endpoint (buyer switches to pickup after denial)
- Updated /bids/{id}/buyer endpoint to return delivery_confirmed_by_shop and delivery_response_at fields
- Added delivery confirmation UI to shop/BidDetail.jsx (Confirm/Deny buttons with status display)
- Added delivery status display to buyer/MyPurchases.jsx showing shop's response
- Added "Switch to Pickup" and "Cancel Order" actions when shop denies delivery
- Implemented two-way settlement flow: buyer must wait for shop confirmation before verifying transaction
- Requests with pickup or confirmed home_delivery move to "Verify" tab; pending/denied stay in "Selected" tab
- Verify button disabled until shop confirms delivery or buyer switches to pickup

date: 8/23/2026
changes:
- Created Faker seed script (mfx-core/utils/seed_data.py) for synthetic data generation
- Added Bhilai pincodes (490001-490050) for realistic location data
- Implemented user creation with Supabase Auth Admin API (bypasses email confirmation)
- Added duplicate checking for all inserts (profiles, requests, bids, events)
- Generated 15 buyers and 12 shops (in addition to existing 2 users)
- Generated 50 requests across 5 categories (electronics, furniture, clothing, books, home_kitchen)
- Generated 120 bids with realistic price variance (108 pending, 12 selected)
- Generated 272 request events (views, bid_placed, selected) for ML training
- Implemented request lifecycle simulation (32 open, 7 completed, 6 expired, 5 purchased)
- Added proper logging with step-by-step progress
- Added verification functions before generation (connection, tables, users)
- Added `is_negotiable` column to bids table for future use
- Cleaned database tables (kept only 2 main users: prateeksaha098@gmail.com, prateeksaha963@gmail.com)
