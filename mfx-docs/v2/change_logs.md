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