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

date: 8/22/2026
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

date: 8/23/2026
changes:
- Verified image_urls JSONB column exists on requests table
- Updated RequestCreate and RequestResponse schemas with image_urls field
- Updated create_request service method to handle image_urls
- Created useCloudinary hook for frontend upload handling
- Updated PostRequest component with multi-file upload UI
- Created ImageCarousel component with fullscreen view
- Added ImageCarousel to RequestDetail page
- Updated card components to show first image only
- Added file validation: max 5MB, jpg/png/webp only, max 5 images
- Added upload progress indicator

date: 8/23/2026
changes:
- Added Cloudinary integration for image uploads (cloud_name: dhsf8mub9)
- Created cloudinary_config.py with upload configuration
- Created routes/upload.py with /upload/single and /upload/multiple endpoints
- Added file validation: max 5MB, jpg/png/webp only, max 5 images
- Added Cloudinary startup verification
- Added CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env
- Created useCloudinary hook for frontend upload handling
- Updated PostRequest component with multi-file upload UI
- Created ImageCarousel component with fullscreen view
- Added ImageCarousel to RequestDetail page
- Updated RequestCreate and RequestResponse schemas with image_urls field
- Updated create_request service method to handle image_urls
- Fixed GET /requests/{id} endpoint to return image_urls field
- Fixed router prefix issues (removed duplicate /requests in routes)
- Fixed DeliveryConfirmResponse import (corrected spelling)
- Fixed requests.services import path


date: 8/24/2026
changes:
- Added image display to shop BrowseRequests cards (first image only, left-aligned)
- Added ImageCarousel component with fullscreen view
- Added ImageCarousel to shop BidDetail page
- Created GET /bids/{id} endpoint to fetch single bid details
- Updated MyBids navigation to route to BidDetail for all bid statuses
- Enhanced BidDetail to fetch and display bid, request, and buyer details
- Added image carousel to BidDetail page
- Improved BidDetail UI with better visual hierarchy
- Fixed MyBids card click navigation to open BidDetail
- Added buyer contact display with conditional visibility (shown only for selected bids)
- Added delivery confirmation status display in BidDetail
- Replaced emojis with Lucide icons across components
- Fixed /bids route (removed trailing slash issue)

date: 8/27/2026
changes:
- Created auctions and auction_bids tables with RLS policies
- Created auctions module with schemas, service, and routes
- Added POST /auctions endpoint (shop owners create auctions)
- Added GET /auctions endpoint (list with filters)
- Added GET /auctions/{id} endpoint (detail + bid history)
- Added POST /auctions/{id}/bids endpoint (buyers place bids)
- Added DELETE /auctions/{id} endpoint (shop cancels)
- Added sniping prevention logic
- Created close-auctions Edge Function
- Scheduled close-auctions cron job
- Created Shop Auction Dashboard
- Created Post Auction page
- Created My Auctions page
- Created Shop Auction Detail page
- Created Buyer Auction Dashboard
- Created Browse Auctions page
- Created Buyer Auction Detail page
- Fixed timezone issue in placeBid function
- Added current_highest_bidder tracking
- Added bid history with buyer names


date: 8/29/2026
changes:
- Added identity_number, identity_type, delivery_address, budget_range_preference, notification_preferences columns to profiles table
- Extended ProfileUpdate schema with new buyer fields
- Added immutability checks for identity_number (once set, cannot be changed)
- Added role-specific field validation in profile update (buyers can't set shop fields, shops can't set buyer fields)
- Updated GET /auth/profiles/{user_id} to return new buyer fields
- Extended Profile.jsx to display identity_number, identity_type, delivery_address, budget_range_preference with locked badge
- Extended ProfileForm.jsx to edit identity_number, identity_type, delivery_address, budget_range_preference
- Added GST locked badge for shop owners in Profile.jsx
- Added Verified Shop badge on shop dashboard (conditional on gst_number)
- Added verification_code, verification_attempts, completed_via_override columns to requests table
- Added verification_code, verification_attempts, completed_via_override, reserve_price columns to auctions table
- Created utils/verification.py with generate_verification_code() function
- Updated confirm_delivery endpoint to generate OTP on delivery confirmation
- Updated deny_delivery endpoint to clear verification_code and verification_attempts
- Updated switch-to-pickup endpoint to generate OTP on pickup switch
- Updated set_delivery_method endpoint to generate OTP for pickup selection
- Updated select_bid endpoint to generate OTP for pickup requests when bid is selected
- Added POST /requests/{id}/verify-otp endpoint for shop to verify OTP (max 5 attempts)
- Added PATCH /requests/{id}/override-complete endpoint for buyer override after max attempts
- Updated RequestResponse schema to include verification fields
- Updated DeliveryConfirmResponse schema to include verification_code
- Extended BidDetail.jsx with OTP verification section (works for both home delivery and pickup)
- Extended MyPurchases.jsx with OTP code display (show/hide, copy, attempts remaining, max attempts warning)
- Added OTP code display in Completed tab for record keeping
- Fixed pickup OTP generation flow (OTP now generated when bid is selected for pickup requests)
- Fixed showOtpVerification condition to work for both home delivery and pickup
- Added delivery method badge in OTP section (Pickup/Home Delivery)

## License

Copyright © 2026 Prateek Saha

Licensed under the Apache License, Version 2.0.
See the [LICENSE](LICENSE) file for details.