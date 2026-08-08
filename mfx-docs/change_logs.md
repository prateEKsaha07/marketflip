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