# change logs

## 2026-08-05 | mfx-v1 poc

### Problem
- poc development

### Fixed
- Added finalized bid message.
- Revealed contact details.
- Updated UI.

### Files
- frontend

### Status
✅ Working
---
### Notes
Need to test multiple bids from different users.
---
## 2026-08-07 | mfx-v1 poc

### Problem
## Buyer Side
- Request disappears from dashboard after selection
- No "Completed Purchases" section
- No way to view transaction history
- No shop contact information displayed after selection

## Shop Side
- Bid just shows "SELECTED" status
- No "Congratulations" view
- No buyer contact information displayed
- No sense of completion/achievement

### Fixed

### Files

### Status
partially done

### Notes
None
---
# 2026-08-08 | mfx-v1 POC Progress

---

## What Was Completed Today

### Backend
1. **Delivery endpoint** (`PATCH /requests/{id}/delivery`) - Fixed table name typo
2. **Verify endpoint** (`PATCH /requests/{id}/verify`) - Fixed datetime import
3. **Database** - Added `'completed'` to status check constraint
4. **Status regex** - Added `'completed'` to GET `/requests` query validation
5. **GET /bids/{id}/buyer** - New endpoint for shop owners to view buyer details on selected bids
6. **GET /bids/stats** - New endpoint for bid statistics (pending/selected/rejected/completed/total)

### Frontend - Buyer
1. **MyPurchases** - Three-section flow (Selected → Verification → Completed)
2. **Data persistence** - Fixed data disappearing on refresh
3. **Dashboard** - Removed purchased tab (now only in MyPurchases)
4. **Delivery selection** - Functional with address prompt
5. **Verify transaction** - Functional with confirmation

### Frontend - Shop
1. **BidDetail page** - View buyer contact, request details, delivery info for selected bids
2. **MyBids** - Clickable selected bids → navigate to BidDetail
3. **Dashboard stats cards** - KPI cards showing Total, Pending, Selected, Rejected, Completed
4. **CompletedTransactions page** - View all completed transactions with buyer details

---

## Files Modified
- `bids/routes.py`
- `requests/routes.py`
- `pages/buyer/Dashboard.jsx`
- `pages/buyer/MyPurchases.jsx`
- `pages/shop/Dashboard.jsx`
- `pages/shop/MyBids.jsx`
- `pages/shop/BidDetail.jsx` (new)
- `pages/shop/CompletedTransactions.jsx` (new)
- `App.jsx`

---

## Status
- ✅ Buyer flow complete
- ✅ Shop BidDetail complete
- ✅ Shop CompletedTransactions complete
- ✅ POC Core Flow Complete

Here's the updated change log for today:

---

## 2026-08-09 | mfx-v1 POC

---

### Problem

#### Buyer Side
- No bid count visibility on dashboard requests
- No edit option for open requests

#### Shop Side
- Pincode filtering was triggering on every keystroke (partial pincode sent to API)
- No visual indicator for "closed" requests (purchased/completed)
- No auto-expiry for open requests past expiry date

---

### Fixed

#### Backend
1. **Auto-Expire Cron Job** - Deployed Supabase Edge Function + pg_cron schedule (daily at 2 AM) to expire open requests where `expires_at < NOW()`
2. **Bid Count** - Added `bid_count` field to `GET /requests` response
3. **PATCH /requests/{id}** - Added endpoint for buyers to update open requests

#### Frontend - Buyer
1. **Bid Count Badge** - Added bid count badge to each request card in Dashboard (e.g., `💬 3 bids`)
2. **Edit Request** - Added Edit button on Dashboard and Request Detail page for open requests
3. **Edit Request Page** - Created `EditRequest.jsx` with full form to update request details

#### Frontend - Shop
1. **Pincode Filtering** - Split filters into `filters` (UI) and `activeFilters` (API) to prevent auto-searching on every keystroke
2. **"Closed" Message** - Added visual indicators for purchased (`🔒 This request has been purchased`) and completed (`✅ This transaction has been completed`) requests in Browse Requests

---

### Files Modified

#### Backend
- `requests/routes.py` - Added bid_count to GET /requests response, added PATCH /requests/{id} endpoint
- `supabase/functions/expire-requests/index.ts` - New Edge Function for auto-expiry
- Supabase SQL - pg_cron schedule set up

#### Frontend
- `pages/buyer/Dashboard.jsx` - Added bid count badge, added Edit button
- `pages/buyer/RequestDetail.jsx` - Added Edit button
- `pages/buyer/EditRequest.jsx` - NEW: Edit request form page
- `pages/shop/BrowseRequests.jsx` - Fixed pincode filtering, added closed messages
- `App.jsx` - Added route for `/buyer/edit-request/:id`

---

### Status
- ✅ Auto-Expire Cron Job: Complete
- ✅ Pincode Filtering: Complete
- ✅ Bid Count Badge: Complete
- ✅ "Closed" Message: Complete
- ✅ Edit Request (Backend + Frontend): Complete
- 🎯 POC Feature Complete - Ready for Deployment

---

### Notes
- Supabase Edge Function deployed: `expire-requests`
- Cron schedule: `0 2 * * *` (daily at 2 AM)
- Tested and verified all features working
- Edit Request allows buyers to update: item_name, description, budget_min, budget_max, pincode, category, reference_url, reference_image