# Marketplace Platform - Complete Database Schema Guide

> **Version:** 1.0.0 | **Last Updated:** September 2026 | **Status:** Production Ready

---

## Table of Contents

- [System Overview](#system-overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Core Tables](#core-tables)
- [Transaction Flow](#transaction-flow)
- [Auction System](#auction-system)
- [Communication Layer](#communication-layer)
- [User Engagement](#user-engagement)
- [System Tables](#system-tables)
- [Row Level Security Policies](#row-level-security-policies)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Performance Considerations](#performance-considerations)

---

## System Overview

### Architecture Summary

```mermaid
graph TB
    subgraph "User Layer"
        A[Buyers] --> B[Requests]
        A --> C[Auction Bids]
        A --> D[Reviews]
        E[Shop Owners] --> F[Auctions]
        E --> G[Bids]
        E --> H[Shop Reliability]
    end
    
    subgraph "Core Platform"
        I[Categories]
        J[Conversations]
        K[Messages]
        L[Notifications]
        M[Reports]
    end
    
    subgraph "Data Layer"
        N[(PostgreSQL)]
        O[Row Level Security]
        P[Audit Logs]
    end
    
    B --> I
    F --> I
    J --> K
    A --> J
    E --> J
    B --> P
    F --> P
```

### Key Features

| Feature | Description | Tables Involved |
|---------|-------------|-----------------|
| Request-Based Bidding | Buyers post needs, shops bid | `requests`, `bids` |
| Auction System | Shops list items for auction | `auctions`, `auction_bids` |
| Real-time Chat | Direct buyer-seller communication | `conversations`, `messages` |
| Rating & Reviews | Trust & reputation system | `reviews` |
| Shop Reliability | Performance scoring engine | `shop_reliability_scores` |
| Content Moderation | Reporting system | `reports` |

---

## Entity Relationship Diagram

```mermaid
erDiagram
    PROFILES ||--o{ REQUESTS : creates
    PROFILES ||--o{ BIDS : places
    PROFILES ||--o{ AUCTIONS : creates
    PROFILES ||--o{ AUCTION_BIDS : places
    PROFILES ||--o{ CONVERSATIONS : participates
    PROFILES ||--o{ REVIEWS : writes
    PROFILES ||--o{ NOTIFICATIONS : receives
    PROFILES ||--o{ FAVORITES : owns
    PROFILES ||--o{ SAVED_SEARCHES : owns
    PROFILES ||--o{ REPORTS : files
    
    REQUESTS ||--o{ BIDS : receives
    REQUESTS ||--o{ REQUEST_EVENTS : generates
    REQUESTS ||--o{ CONVERSATION_ACTIVE_TRANSACTIONS : references
    
    AUCTIONS ||--o{ AUCTION_BIDS : receives
    AUCTIONS ||--o{ AUCTION_CLOSE_EVENTS : logs
    
    CATEGORIES ||--o{ CATEGORIES : parent_of
    
    CONVERSATIONS ||--o{ MESSAGES : contains
    CONVERSATIONS ||--o{ CONVERSATION_ACTIVE_TRANSACTIONS : tracks
    
    PROFILES ||--|| SHOP_RELIABILITY_SCORES : has
    
    REQUESTS }o--|| CATEGORIES : belongs_to
    AUCTIONS }o--|| CATEGORIES : belongs_to
```

### Table Relationship Matrix

| Parent Table | Child Table | Relationship | Foreign Key |
|--------------|-------------|--------------|-------------|
| `profiles` | `requests` | One-to-Many | `buyer_id` |
| `profiles` | `bids` | One-to-Many | `shop_id` |
| `profiles` | `auctions` | One-to-Many | `shop_id` |
| `profiles` | `auction_bids` | One-to-Many | `buyer_id` |
| `profiles` | `conversations` | One-to-Many | `buyer_id`, `shop_id` |
| `profiles` | `messages` | One-to-Many | `sender_id` |
| `requests` | `bids` | One-to-Many | `request_id` |
| `requests` | `request_events` | One-to-Many | `request_id` |
| `auctions` | `auction_bids` | One-to-Many | `auction_id` |
| `auctions` | `auction_close_events` | One-to-Many | `auction_id` |
| `categories` | `categories` | Self-Reference | `parent_category_id` |
| `conversations` | `messages` | One-to-Many | `conversation_id` |
| `conversations` | `conversation_active_transactions` | One-to-Many | `conversation_id` |
| `profiles` | `shop_reliability_scores` | One-to-One | `shop_id` |

---

## Core Tables

### 1. `profiles` - User Management

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('buyer', 'shop_owner')),
    shop_name TEXT,
    full_name TEXT,
    address TEXT NOT NULL,
    pincode TEXT NOT NULL,
    phone TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    profile_photo_url TEXT,
    bio TEXT,
    business_hours JSONB,
    years_in_business INT,
    preferred_categories JSONB,
    avg_response_time_minutes INT,
    total_transactions INT DEFAULT 0,
    completed_transactions INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMPTZ,
    gst_number TEXT,
    identity_number TEXT,
    identity_type TEXT,
    delivery_address TEXT,
    budget_range_preference JSONB,
    notification_preferences JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Field Groups:**

```mermaid
graph LR
    subgraph "Identity"
        A[id] --> B[full_name]
        A --> C[role]
        A --> D[phone]
        A --> E[email]
    end
    
    subgraph "Business"
        F[shop_name] --> G[business_hours]
        F --> H[years_in_business]
        F --> I[gst_number]
    end
    
    subgraph "Verification"
        J[is_verified] --> K[identity_number]
        J --> L[identity_type]
    end
    
    subgraph "Analytics"
        M[total_transactions] --> N[completed_transactions]
        M --> O[avg_response_time_minutes]
    end
```

### 2. `categories` - Product Hierarchy

```mermaid
graph TD
    A[Root Categories] --> B[Electronics]
    A --> C[Fashion]
    A --> D[Home & Living]
    A --> E[Services]
    
    B --> B1[Smartphones]
    B --> B2[Laptops]
    B --> B3[Accessories]
    
    C --> C1[Men's Wear]
    C --> C2[Women's Wear]
    C --> C3[Footwear]
    
    D --> D1[Furniture]
    D --> D2[Decor]
    D --> D3[Kitchen]
    
    E --> E1[Repairs]
    E --> E2[Cleaning]
    E --> E3[Delivery]
```

**Category Schema Structure:**
```json
{
  "fields": [
    {
      "name": "brand",
      "type": "text",
      "required": false
    },
    {
      "name": "model",
      "type": "text",
      "required": false
    },
    {
      "name": "specifications",
      "type": "jsonb",
      "required": false
    }
  ]
}
```

---

## Transaction Flow

### Request-to-Bid Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Open: Buyer creates request
    Open --> Bidding: Shop places bid
    Bidding --> Selected: Buyer selects bid
    Selected --> InProgress: Shop accepts
    InProgress --> Completed: Delivery confirmed
    InProgress --> Failed: Delivery issues
    Completed --> Reviewed: Rating left
    Reviewed --> [*]
    Failed --> [*]
    Open --> Expired: Timeout
    Expired --> [*]
    
    note right of Open
        Request Details:
        - Item name
        - Budget range
        - Location
        - Category
    end note
    
    note right of Selected
        Transaction Details:
        - Selected bid ID
        - Delivery method
        - Address
    end note
```

### `requests` Table Structure

```mermaid
graph TB
    subgraph "Request Core"
        A[id] --> B[item_name]
        A --> C[description]
        A --> D[budget_min]
        A --> E[budget_max]
    end
    
    subgraph "Location & Category"
        F[pincode] --> G[category_id]
        F --> H[delivery_address]
    end
    
    subgraph "Status & Timeline"
        I[status] --> J[created_at]
        I --> K[expires_at]
        I --> L[completed_at]
    end
    
    subgraph "Media & References"
        M[image_urls] --> N[reference_url]
        M --> O[reference_image]
    end
    
    subgraph "Verification"
        P[verification_code] --> Q[verification_attempts]
        P --> R[delivery_confirmed_by_shop]
    end
```

### `bids` Table Structure

```mermaid
graph LR
    A[Bid] --> B[request_id]
    A --> C[shop_id]
    A --> D[price]
    A --> E[note]
    A --> F[status]
    A --> G[created_at]
    A --> H[selected_at]
    A --> I[is_negotiable]
```

**Bid Status Flow:**
```mermaid
stateDiagram-v2
    [*] --> Pending: Shop places bid
    Pending --> Selected: Buyer selects
    Pending --> Rejected: Buyer rejects
    Pending --> Withdrawn: Shop withdraws
    Selected --> [*]
    Rejected --> [*]
    Withdrawn --> [*]
```

---

## Auction System

### Auction Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: Shop creates
    Draft --> Active: Shop publishes
    Active --> Bidding: Buyers place bids
    Bidding --> Ending: Time expires
    Ending --> Closed: Winner determined
    Closed --> Completed: Delivery confirmed
    Completed --> [*]
    Active --> Cancelled: Shop cancels
    Cancelled --> [*]
    
    note right of Bidding
        Features:
        - Current highest bid
        - Reserve price
        - Countdown timer
    end note
```

### `auctions` Table Structure

```mermaid
graph TB
    subgraph "Auction Core"
        A[id] --> B[item_name]
        A --> C[description]
        A --> D[starting_price]
        A --> E[reserve_price]
    end
    
    subgraph "Bid Tracking"
        F[current_highest_bid] --> G[current_highest_bidder]
        F --> H[winning_bid_id]
    end
    
    subgraph "Timeline"
        I[created_at] --> J[end_time]
        I --> K[closed_at]
        I --> L[completed_at]
    end
    
    subgraph "Delivery"
        M[delivery_method] --> N[delivery_address]
        M --> O[delivery_confirmed_by_shop]
    end
```

### Auction vs Request Comparison

| Feature | Requests | Auctions |
|---------|----------|----------|
| **Initiator** | Buyer | Shop Owner |
| **Pricing** | Buyer sets budget range | Shop sets starting price |
| **Bidding** | Shops bid downward | Buyers bid upward |
| **Selection** | Buyer selects bid | Highest bid wins |
| **Timeline** | Open until selection | Fixed end time |
| **Competition** | Shops compete for sale | Buyers compete for item |

---

## Communication Layer

### Conversation Flow

```mermaid
sequenceDiagram
    participant B as Buyer
    participant C as Conversation
    participant S as Shop
    participant M as Message
    
    B->>C: Creates conversation
    C->>S: Adds shop participant
    loop Messaging
        B->>M: Sends message
        M->>C: Stores in conversation
        C->>S: Notifies shop
        S->>M: Responds
        M->>C: Stores response
        C->>B: Notifies buyer
    end
    B->>C: Completes transaction
    C->>S: Transaction completed
```

### Conversation Management

```mermaid
graph TB
    subgraph "Conversation"
        A[id] --> B[buyer_id]
        A --> C[shop_id]
        A --> D[active_source_type]
        A --> E[active_source_id]
        A --> F[locked]
        A --> G[created_at]
        A --> H[updated_at]
    end
    
    subgraph "Messages"
        I[id] --> J[conversation_id]
        I --> K[sender_id]
        I --> L[content]
        I --> M[is_read]
        I --> N[read_at]
        I --> O[is_reported]
        I --> P[is_blocked]
    end
    
    subgraph "Active Transactions"
        Q[id] --> R[conversation_id]
        Q --> S[source_type]
        Q --> T[source_id]
        Q --> U[item_name]
        Q --> V[status]
        Q --> W[created_at]
        Q --> X[completed_at]
    end
```

**Message Flow State Diagram:**
```mermaid
stateDiagram-v2
    [*] --> Created: User sends message
    Created --> Delivered: System processes
    Delivered --> Read: Recipient views
    Read --> Replied: Recipient responds
    Read --> Reported: User reports
    Reported --> Blocked: Admin action
    Blocked --> [*]
```

---

## User Engagement

### Review System

```mermaid
graph LR
    subgraph "Review Process"
        A[Transaction Completed] --> B[Review Available]
        B --> C[Buyer Reviews Shop]
        B --> D[Shop Reviews Buyer]
        C --> E[Rating & Comment]
        D --> E
        E --> F[Update Reliability Score]
    end
    
    subgraph "Review Components"
        G[rating: 1-5]
        H[comment: text]
        I[target_type: request/auction]
        J[target_id: reference]
    end
```

### Reliability Score Calculation

```mermaid
graph TB
    subgraph "Input Metrics"
        A[Response Time] --> D[Score Calculation]
        B[Completion Rate] --> D
        C[Selection Rate] --> D
    end
    
    subgraph "Score Components"
        D --> E[Response Score]
        D --> F[Completion Score]
        D --> G[Selection Score]
    end
    
    subgraph "Output"
        E --> H[Reliability Score]
        F --> H
        G --> H
        H --> I[Shop Ranking]
        H --> J[Trust Indicator]
    end
```

### `shop_reliability_scores` Metrics

| Metric | Formula | Weight |
|--------|---------|--------|
| Response Score | `1 / (1 + avg_response_time/60)` | 30% |
| Completion Score | `completed / total_requests` | 35% |
| Selection Score | `selected / total_bids` | 35% |
| Overall Score | `(response + completion + selection) / 3` | 100% |

---

## Row Level Security Policies

### Security Matrix

```mermaid
graph TB
    subgraph "Public Access"
        A[SELECT on open requests]
        B[SELECT on categories]
        C[SELECT on reviews]
        D[SELECT on reliability scores]
    end
    
    subgraph "Authenticated Access"
        E[Create bids/auctions]
        F[Manage own profile]
        G[Participate in conversations]
        H[Place auction bids]
    end
    
    subgraph "Ownership Access"
        I[CRUD on own requests]
        J[CRUD on own bids]
        K[CRUD on own auctions]
        L[Manage own favorites]
    end
    
    subgraph "Service Role"
        M[Full access all tables]
        N[Manage reliability scores]
        O[Create notifications]
        P[Manage reports]
    end
```

### Policy Enforcement Flow

```mermaid
flowchart TD
    A[User Request] --> B{Authenticated?}
    B -->|No| C[Public Policy Check]
    B -->|Yes| D{Role Check}
    
    C --> E[SELECT only]
    C --> F[Status = 'open']
    
    D -->|Buyer| G[Own requests]
    D -->|Shop| H[Own bids/auctions]
    D -->|Both| I[Conversation access]
    
    G --> J[CRUD where buyer_id = auth.uid()]
    H --> K[CRUD where shop_id = auth.uid()]
    I --> L[WHERE participant = auth.uid()]
    
    E --> M[Result]
    F --> M
    J --> M
    K --> M
    L --> M
```

### Security Policy Summary

| Table | Public Access | Authenticated Access | Ownership Access |
|-------|--------------|---------------------|------------------|
| `profiles` | No | No | Full CRUD |
| `requests` | SELECT (open) | No | Full CRUD |
| `bids` | No | No | Full CRUD |
| `auctions` | No | SELECT | Full CRUD |
| `auction_bids` | No | SELECT | INSERT |
| `conversations` | No | No | SELECT |
| `messages` | No | No | INSERT/SELECT |
| `reviews` | No | SELECT | INSERT/DELETE |
| `notifications` | No | No | SELECT/UPDATE |
| `favorites` | No | No | Full CRUD |
| `categories` | No | SELECT | No |
| `reports` | No | No | INSERT/SELECT |

---

## Data Flow Diagrams

### Request Creation Flow

```mermaid
flowchart TD
    A[Buyer Auth] --> B[Create Request]
    B --> C[Validate Input]
    C --> D{Valid?}
    D -->|Yes| E[Save Request]
    D -->|No| F[Return Error]
    E --> G[Generate Events]
    G --> H[Notify Shops]
    H --> I[Start Bidding]
    I --> J[Open Status]
    
    B --> K[Select Category]
    K --> L[Category Schema]
    L --> M[Validate Fields]
    M --> C
```

### Bid to Transaction Flow

```mermaid
flowchart TD
    A[Shop Views Request] --> B[Place Bid]
    B --> C[Create Bid Record]
    C --> D[Notify Buyer]
    D --> E[Await Selection]
    E --> F{Buyer Action}
    
    F -->|Select| G[Mark Selected]
    F -->|Reject| H[Mark Rejected]
    F -->|Timeout| I[Expire]
    
    G --> J[Create Conversation]
    J --> K[Share Contact]
    K --> L[Arrange Delivery]
    L --> M[Complete Transaction]
    M --> N[Request Review]
    
    N --> O[Update Reliability Score]
    O --> P[Close Request]
```

### Auction Lifecycle Flow

```mermaid
flowchart TD
    A[Shop Creates Auction] --> B[Set Parameters]
    B --> C[Publish Auction]
    C --> D[Active Status]
    D --> E{Buyer Bids}
    E -->|Yes| F[Update Highest Bid]
    F --> G[Notify Shop]
    G --> H[Check End Time]
    H -->|Still Active| E
    H -->|Ended| I[Close Auction]
    
    I --> J[Determine Winner]
    J --> K[Notify Winner]
    K --> L[Complete Transaction]
    L --> M[Request Review]
    M --> N[Update Reliability]
    
    D --> O[Reserve Price Check]
    O --> P{Met?}
    P -->|No| Q[Cancel Auction]
    P -->|Yes| E
```

---

## Performance Considerations

### Indexing Strategy

| Table | Column(s) | Index Type | Use Case |
|-------|-----------|------------|----------|
| `requests` | `status`, `created_at` | BTREE | Filter open requests |
| `requests` | `buyer_id` | BTREE | User's requests |
| `requests` | `category_id` | BTREE | Category filtering |
| `bids` | `request_id` | BTREE | Request bids lookup |
| `bids` | `shop_id` | BTREE | Shop's bids |
| `auctions` | `status`, `end_time` | BTREE | Active auctions |
| `auctions` | `shop_id` | BTREE | Shop's auctions |
| `messages` | `conversation_id`, `created_at` | BTREE | Conversation messages |
| `conversations` | `buyer_id`, `shop_id` | BTREE | Participant lookup |
| `profiles` | `pincode` | BTREE | Location-based search |
| `profiles` | `role` | BTREE | Role filtering |
| `reviews` | `target_id`, `target_type` | BTREE | Target reviews |
| `notifications` | `user_id`, `read` | BTREE | Unread notifications |

### Query Optimization Tips

**1. Open Requests Query**
```sql
-- Optimized with composite index
SELECT * FROM requests 
WHERE status = 'open' 
AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

**2. Shop Reliability Calculation**
```sql
-- Materialized view for performance
CREATE MATERIALIZED VIEW shop_reliability_view AS
SELECT 
    shop_id,
    avg_response_time_minutes,
    completion_rate,
    reliability_score
FROM shop_reliability_scores
WHERE calculated_at > NOW() - INTERVAL '30 days';
```

**3. Active Auctions with End Times**
```sql
-- Use partial index
CREATE INDEX idx_active_auctions_end_time 
ON auctions(end_time) 
WHERE status = 'active';
```

---

## Monitoring Metrics

### Key Performance Indicators

| Metric | Target | Monitoring Table |
|--------|--------|------------------|
| Request Response Time | < 5 minutes | `profiles.avg_response_time_minutes` |
| Completion Rate | > 80% | `shop_reliability_scores.completion_rate` |
| Auction Success Rate | > 70% | `auctions.status = 'completed'` |
| User Retention | > 60% | `profiles.last_active_at` |
| Review Completion | > 50% | `reviews` count |
| Verification Rate | > 75% | `profiles.is_verified` |

### Growth Metrics

```mermaid
graph LR
    A[Daily Active Users] --> B[Transactions]
    B --> C[Revenue]
    A --> D[New Shops]
    A --> E[New Buyers]
    D --> F[Total Products]
    E --> G[Total Requests]
```

---

## Maintenance Operations

### Regular Cleanup Tasks

```sql
-- Archive completed requests older than 90 days
-- Archive inactive conversations
-- Purge unverified accounts after 30 days
-- Recalculate reliability scores weekly
-- Clean expired verification codes
```

### Backup Strategy

| Component | Frequency | Retention |
|-----------|-----------|-----------|
| Full Database Backup | Daily | 30 days |
| Incremental Backup | Every 6 hours | 7 days |
| WAL Archiving | Continuous | 7 days |
| Configuration Backup | On Change | 90 days |

---

## Appendix

### Field Naming Conventions

| Prefix | Meaning | Example |
|--------|---------|---------|
| `is_` | Boolean flag | `is_verified`, `is_read` |
| `_at` | Timestamp | `created_at`, `updated_at` |
| `_id` | Foreign key | `buyer_id`, `shop_id` |
| `_count` | Counter | `views_count`, `attempts_count` |
| `_preferences` | User settings | `notification_preferences` |

### State Constants

**Request Status:**
```python
REQUEST_STATUS = {
    'OPEN': 'open',
    'CLOSED': 'closed', 
    'COMPLETED': 'completed',
    'EXPIRED': 'expired'
}
```

**Bid Status:**
```python
BID_STATUS = {
    'PENDING': 'pending',
    'SELECTED': 'selected',
    'REJECTED': 'rejected',
    'WITHDRAWN': 'withdrawn'
}
```

**Auction Status:**
```python
AUCTION_STATUS = {
    'ACTIVE': 'active',
    'CLOSED': 'closed',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled'
}
```

---

## Support

For schema-related questions or issues:
- **Database Team:** db@platform.com
- **API Documentation:** /api/docs
- **Migration Guide:** /docs/migrations

---

*This document is maintained by the owner. Last updated: September 2026*