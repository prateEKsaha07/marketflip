# Reliability System Documentation

## Overview

The Reliability System computes and manages trust scores for shop owners based on their transaction performance. Scores are derived from response times, completion rates, and selection rates across both request-based bids and auction transactions.

---

## Table of Contents

- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Service Layer](#service-layer)
- [Score Calculation](#score-calculation)
- [Security & Permissions](#security--permissions)
- [Error Handling](#error-handling)

---

## API Endpoints

### 1. Get Shop Reliability

**GET** `/reliability/shop/{shop_id}`

Retrieves the reliability score for a specific shop. If no score exists, it computes one on the fly.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `shop_id` | UUID | ID of the shop |

**Response:**
```json
{
  "id": "uuid",
  "shop_id": "uuid",
  "avg_response_time_minutes": 120.5,
  "completion_rate": 0.85,
  "selection_rate": 0.75,
  "reliability_score": 82.5,
  "response_score": 90.0,
  "completion_score": 85.0,
  "selection_score": 75.0,
  "total_requests_handled": 20,
  "total_bids_placed": 15,
  "total_selected": 12,
  "total_completed": 10,
  "calculated_at": "2026-09-15T10:30:00Z",
  "updated_at": "2026-09-15T10:30:00Z"
}
```

**Permissions:** Authenticated users

---

### 2. Get Multiple Shops Reliability

**GET** `/reliability/shops`

Retrieves reliability scores for multiple shops.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `shop_ids` | string | Comma-separated list of shop IDs |

**Response:**
```json
[
  {
    "id": "uuid",
    "shop_id": "uuid",
    "avg_response_time_minutes": 120.5,
    "completion_rate": 0.85,
    "selection_rate": 0.75,
    "reliability_score": 82.5,
    ...
  }
]
```

**Permissions:** Authenticated users

---

### 3. Get Top Reliable Shops

**GET** `/reliability/top`

Retrieves the top reliable shops based on reliability score.

**Query Parameters:**

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | integer | Number of shops to return (1-50) | 10 |

**Response:**
```json
[
  {
    "id": "uuid",
    "shop_id": "uuid",
    "avg_response_time_minutes": 45.0,
    "completion_rate": 0.95,
    "selection_rate": 0.90,
    "reliability_score": 92.5,
    ...
  }
]
```

**Permissions:** Authenticated users

---

### 4. Refresh Reliability Scores (Internal)

**POST** `/reliability/refresh`

Computes and updates reliability scores for all shops. This is an internal endpoint for periodic updates.

**Response:**
```json
[
  {
    "id": "uuid",
    "shop_id": "uuid",
    "avg_response_time_minutes": 120.5,
    "completion_rate": 0.85,
    ...
  }
]
```

**Permissions:** Service role / Admin only

---

## Data Models

### Response Model

**ShopReliabilityScoreResponse**
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Score record ID |
| `shop_id` | UUID | Shop ID |
| `avg_response_time_minutes` | float | Average response time in minutes |
| `completion_rate` | float | Rate of completed transactions (0-1) |
| `selection_rate` | float | Rate of bids selected (0-1) |
| `reliability_score` | float | Overall reliability score (0-100) |
| `response_score` | float | Response time score (0-100) |
| `completion_score` | float | Completion rate score (0-100) |
| `selection_score` | float | Selection rate score (0-100) |
| `total_requests_handled` | int | Total bids placed on requests |
| `total_bids_placed` | int | Total bids placed (requests + auctions) |
| `total_selected` | int | Total bids selected |
| `total_completed` | int | Total completed transactions |
| `calculated_at` | datetime | When scores were calculated |
| `updated_at` | datetime | Last update timestamp |

---

## Service Layer

### ReliabilityService

The service handles reliability score computation and management.

**Initialization:**
- Requires `supabase_admin` and `supabase_anon` clients

**Core Methods:**

| Method | Description |
|--------|-------------|
| `compute_shop_reliability()` | Computes scores for a single shop |
| `compute_all_shops_reliability()` | Computes scores for all shops |
| `update_shop_reliability_scores()` | Updates or inserts scores |
| `get_shop_reliability_score()` | Retrieves score for a shop |
| `get_reliability_scores()` | Retrieves scores for multiple shops |
| `refresh_all_reliability_scores()` | Full refresh for all shops |

---

## Score Calculation

### Data Sources

**Request Flow (bids table):**
- Total bids placed by shop
- Selected bids (status = 'selected')
- Completed requests (request.status = 'completed')
- Response time: From bid creation to request completion

**Auction Flow (auctions table):**
- Total auctions created by shop
- Completed auctions (status = 'completed')
- Response time: From auction close to completion

### Metrics Computed

**1. Average Response Time**
- Request Flow: Time from bid creation to request completion
- Auction Flow: Time from auction close to completion
- Combined average across both flows
- Converted to minutes for display

**2. Completion Rate**
- Formula: `(completed requests + completed auctions) / (total bids + total auctions)`
- Range: 0 to 1

**3. Selection Rate**
- Formula: `selected bids / total bids`
- Range: 0 to 1

### Score Weights

| Score Component | Weight |
|-----------------|--------|
| Response Score | 30% |
| Completion Score | 40% |
| Selection Score | 30% |
| **Overall Reliability Score** | **100%** |

### Response Score Mapping

| Response Time | Score |
|---------------|-------|
| < 2 hours | 100 |
| 2-12 hours | 90 |
| 12-24 hours | 80 |
| 1-3 days | 60 |
| 3-7 days | 40 |
| > 7 days | 20 |
| No data | 0 |

---

## Security & Permissions

### Authentication Requirements

All endpoints require authentication via the `get_current_user` dependency.

### Role-Based Access Control

| Action | Buyer | Shop Owner | Service Role |
|--------|-------|------------|--------------|
| Get Shop Reliability | Yes | Yes | Yes |
| Get Multiple Shops | Yes | Yes | Yes |
| Get Top Shops | Yes | Yes | Yes |
| Refresh Scores | No | No | Yes |

### RLS Policies

Based on the database schema:
- Anyone can read reliability scores
- Service role can manage reliability scores

---

## Error Handling

### Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | `SERVER_ERROR` | Database or server error |
| 500 | `REFRESH_ERROR` | Failed to refresh scores |

### Error Response Format

All errors follow the standard FastAPI error format:
```json
{
  "detail": "Error message description"
}
```

---

## Database Schema

### Shop Reliability Scores Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `shop_id` | UUID | References profiles.id (unique) |
| `avg_response_time_minutes` | float8 | Average response time in minutes |
| `completion_rate` | float8 | Completion rate (0-1) |
| `selection_rate` | float8 | Selection rate (0-1) |
| `reliability_score` | float8 | Overall reliability score (0-100) |
| `response_score` | float8 | Response time score (0-100) |
| `completion_score` | float8 | Completion score (0-100) |
| `selection_score` | float8 | Selection score (0-100) |
| `total_requests_handled` | int4 | Total bids on requests |
| `total_bids_placed` | int4 | Total bids placed |
| `total_selected` | int4 | Total bids selected |
| `total_completed` | int4 | Total completed transactions |
| `calculated_at` | timestamptz | Calculation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-09-15 | Initial documentation |

---

*This documentation is maintained by the Owner.*