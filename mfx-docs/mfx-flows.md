# MarketFlip — Full Flow Reference
### Diagrams + API Calls per Flow

---

## 1. Auth Flow

```mermaid
flowchart TD
    A[Landing Page] --> B[Signup]
    B --> C[POST /auth/signup]
    C --> D[profiles row created]
    D --> E[Login]
    A --> E
    E --> F[POST /auth/login]
    F --> G[access_token + role + user_id]
    G -->|role=buyer| H[Buyer Dashboard]
    G -->|role=shop_owner| I[Shop Dashboard]
```

| Step | API |
|---|---|
| Signup | `POST /auth/signup` |
| Login | `POST /auth/login` |
| Get profile (any role) | `GET /auth/profiles/{id}` |

---

## 2. Buyer Flow — Post to Purchase

```mermaid
sequenceDiagram
    participant B as Buyer
    participant S as System

    B->>S: POST /requests
    S-->>B: request created, status=open
    S-->>B: GET /requests (Dashboard, Open tab)
    B->>S: GET /requests/{id} (RequestDetail)
    S-->>B: request + bids list
    B->>S: PATCH /bids/{id}/select
    S-->>B: request.status=purchased, shop_contact revealed
```

```mermaid
stateDiagram-v2
    [*] --> open : POST /requests
    open --> purchased : PATCH /bids/{id}/select
    open --> deleted : DELETE /requests/{id}
    open --> expired : cron (7 days)
    purchased --> completed : PATCH /requests/{id}/verify
```

| Step | API |
|---|---|
| Create request | `POST /requests` |
| View own requests (tabs) | `GET /requests?status=open\|expired\|deleted` |
| Edit open request | `PATCH /requests/{id}` |
| Delete request | `DELETE /requests/{id}` |
| View request + bids | `GET /requests/{id}` |
| Select winning bid | `PATCH /bids/{id}/select` |

---

## 3. Buyer Flow — Purchase to Completion

```mermaid
flowchart TD
    A[Bid Selected - purchased] --> B[MyPurchases page]
    B --> C[PATCH /requests/id/delivery]
    C --> D[delivery_method set]
    D --> E[PATCH /requests/id/verify]
    E --> F[status = completed, completed_at set]
```

| Step | API |
|---|---|
| View purchases | `GET /requests?status=purchased` |
| Set delivery method | `PATCH /requests/{id}/delivery` |
| Verify transaction | `PATCH /requests/{id}/verify` |

---

## 4. Shop Owner Flow — Browse to Bid

```mermaid
sequenceDiagram
    participant SO as Shop Owner
    participant S as System

    SO->>S: GET /requests?pincode=&category=&status=open
    S-->>SO: matching open requests (with closed indicators for purchased/completed)
    SO->>S: POST /requests/{id}/bids
    S-->>SO: bid created, status=pending
    SO->>S: PATCH /bids/{id} (edit) or DELETE /bids/{id} (withdraw)
```

| Step | API |
|---|---|
| Browse open requests | `GET /requests?pincode=&category=&status=open` |
| Place bid | `POST /requests/{id}/bids` |
| Edit pending bid | `PATCH /bids/{id}` |
| Withdraw pending bid | `DELETE /bids/{id}` |
| View bids on a request | `GET /requests/{id}/bids` |

---

## 5. Shop Owner Flow — Bid to Transaction Complete

```mermaid
flowchart TD
    A[Bid placed - pending] --> B{Buyer selects?}
    B -->|Yes| C[bid.status = selected]
    B -->|No, other bid chosen| D[bid.status = rejected]
    C --> E[Shop: BidDetail page]
    E --> F[GET /bids/id/buyer - buyer contact]
    F --> G[Buyer verifies transaction]
    G --> H[Shop: CompletedTransactions page]
```

| Step | API |
|---|---|
| View own bids + status | `GET /bids?request_id=` |
| View buyer contact (selected bid) | `GET /bids/{id}/buyer` |
| View bid stats (KPI cards) | `GET /bids/stats` |
| View completed transactions | `GET /requests?status=completed` |

---

## 6. Full Combined Lifecycle

```mermaid
stateDiagram-v2
    [*] --> open : buyer posts request
    open --> purchased : buyer selects a bid
    open --> deleted : buyer deletes manually
    open --> expired : cron, 7 days pass
    purchased --> completed : buyer verifies transaction
    purchased --> [*]
    completed --> [*]
    deleted --> [*]
    expired --> [*]

    state open {
        [*] --> pending_bids
        pending_bids --> pending_bids : shop places/edits/withdraws bid
    }
```

```mermaid
stateDiagram-v2
    [*] --> pending : shop places bid
    pending --> selected : buyer selects this bid
    pending --> rejected : buyer selects another bid
    pending --> withdrawn : shop withdraws
    selected --> [*]
    rejected --> [*]
    withdrawn --> [*]
```

---

## 7. Full API Reference

| Method | Endpoint | Role | Used In Flow |
|---|---|---|---|
| POST | `/auth/signup` | ❌ | Auth |
| POST | `/auth/login` | ❌ | Auth |
| GET | `/auth/profiles/{id}` | Any | Auth, BidDetail |
| POST | `/requests` | Buyer | Post to Purchase |
| GET | `/requests?status=&pincode=&category=` | Any | Dashboard, Browse |
| GET | `/requests/{id}` | Any | RequestDetail |
| PATCH | `/requests/{id}` | Buyer | Edit Request |
| DELETE | `/requests/{id}` | Buyer | Delete Request |
| PATCH | `/requests/{id}/delivery` | Buyer | Purchase to Completion |
| PATCH | `/requests/{id}/verify` | Buyer | Purchase to Completion |
| POST | `/requests/{id}/bids` | Shop | Browse to Bid |
| GET | `/requests/{id}/bids` | Any | RequestDetail, Browse |
| GET | `/bids?request_id=` | Any | MyBids |
| PATCH | `/bids/{id}` | Shop | Edit Bid |
| DELETE | `/bids/{id}` | Shop | Withdraw Bid |
| PATCH | `/bids/{id}/select` | Buyer | Select Bid |
| GET | `/bids/{id}/buyer` | Shop | BidDetail |
| GET | `/bids/stats` | Shop | Shop Dashboard |