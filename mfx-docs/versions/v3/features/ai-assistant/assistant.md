# MarketFlip AI Assistant — Architecture & Design

**Version:** v3.1
**Status:** Buyer-side shipped
**Last updated:** 2026-09-16
**Owner:** Backend + Frontend

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Backend Design](#3-backend-design)
4. [Provider Pattern](#4-provider-pattern)
5. [Pipeline Flows](#5-pipeline-flows)
6. [Frontend Design](#6-frontend-design)
7. [Data Model](#7-data-model)
8. [API Reference](#8-api-reference)
9. [Cost & Limits](#9-cost--limits)
10. [Extension Guide](#10-extension-guide)
11. [Known Constraints](#11-known-constraints)

---

## 1. Overview

The AI Assistant is a floating orb mounted on authenticated dashboards. It offers two capabilities through a single input box:

| Capability | Input | Output | Write? |
|-----------|-------|--------|--------|
| **Create Request** | Natural-language description of an item | Editable structured draft → `POST /requests` | Yes |
| **Quick Q&A** | Question about the user's own data | 3-bullet summary + link to full page | No |

Intent is detected server-side by keyword prefix or trailing `?`. Both flows share the same UI shell, panel, and logging infrastructure.

### 1.1 Design Principles

| Principle | Rationale |
|-----------|-----------|
| **One concern per file** | Debugging, onboarding, and modification stay fast |
| **Provider registry** | Adding a new data domain requires zero changes to the core pipeline |
| **Bounded output** | `max_output_tokens=200` makes verbose answers physically impossible |
| **Fire-and-forget logging** | Logging failures never block a buyer's action |
| **Anchored context** | `requests` is always fetched for buyers — it's the join key for everything else |
| **Fail-soft providers** | A broken provider is skipped; the rest of the answer still works |

---

## 2. System Architecture

### 2.1 High-level topology

```
┌───────────────────────────────────────────────────────────────────┐
│                        BROWSER (React 19)                          │
│                                                                    │
│  ┌──────────────────┐         ┌──────────────────────────────┐    │
│  │ FloatingButton   │◄────────┤  AssistantPanel (state)      │    │
│  │ (animated orb)   │  open   │   idle | parsing | asking    │    │
│  └──────────────────┘         │   preview | answered         │    │
│                                └──────────────┬───────────────┘    │
│                                               │                    │
│                              ┌────────────────┼────────────────┐   │
│                              ▼                ▼                ▼   │
│                        AssistantInput   AssistantPreview  Assistant│
│                                                                Answer│
└───────────────────────────────┬────────────────────────────────────┘
                                │ axios (JWT via interceptor)
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                              │
│                                                                    │
│  ┌──────────────┐      ┌────────────────┐     ┌────────────────┐  │
│  │  POST        │      │  POST          │     │  PATCH         │  │
│  │  /ai/ask     │      │  /ai/parse-    │     │  /ai/parse-    │  │
│  │              │      │  request       │     │  request/{id}  │  │
│  └──────┬───────┘      └───────┬────────┘     └───────┬────────┘  │
│         │                      │                      │           │
│         ▼                      ▼                      ▼           │
│  ┌──────────────┐      ┌────────────────┐     ┌────────────────┐  │
│  │   qa.py      │      │   service.py   │     │  service.py    │  │
│  │ ask_question │      │ parse_request  │     │ update_action  │  │
│  └──────┬───────┘      └───────┬────────┘     └───────┬────────┘  │
│         │                      │                      │           │
│         ▼                      ▼                      ▼           │
│  ┌──────────────┐      ┌────────────────┐     ┌────────────────┐  │
│  │  providers/  │      │  Gemini API    │     │  Supabase      │  │
│  │  registry    │      │  (Flash-Lite)  │     │  ai_parse_logs │  │
│  └──────┬───────┘      └───────┬────────┘     └────────────────┘  │
│         │                      │                                  │
│         ▼                      ▼                                  │
│  ┌──────────────┐      ┌────────────────┐                         │
│  │  Supabase    │      │  Supabase      │                         │
│  │  (requests,  │      │  ai_parse_logs │                         │
│  │   bids,      │      └────────────────┘                         │
│  │   profiles)  │                                                 │
│  └──────┬───────┘                                                 │
│         │                                                          │
│         ▼                                                          │
│  ┌──────────────┐                                                 │
│  │  Gemini API  │                                                 │
│  │  (Flash-Lite)│                                                 │
│  └──────────────┘                                                 │
└───────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                                │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Gemini API  │  │  Supabase    │  │  Cloudinary  │              │
│  │ (Google AI  │  │  (Postgres + │  │  (image CDN) │              │
│  │  Studio)    │  │   Storage)   │  │              │              │
│  └─────────────┘  └──────────────┘  └──────────────┘              │
└───────────────────────────────────────────────────────────────────┘
```

### 2.2 Request lifecycle

```
┌─────────────┐
│   Buyer     │
│  types text │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│   looksLikeQuestion(text)?              │
│   ─ keyword prefix OR ends with "?"     │
└──────┬───────────────────────┬──────────┘
       │ YES                   │ NO
       ▼                       ▼
┌──────────────┐      ┌──────────────────┐
│ POST /ai/ask │      │ POST /ai/parse-  │
│              │      │ request          │
└──────┬───────┘      └──────┬───────────┘
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────────┐
│ Q&A pipeline │      │ Create pipeline  │
└──────┬───────┘      └──────┬───────────┘
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────────┐
│  Assistant   │      │  Assistant       │
│  Answer      │      │  Preview         │
│  (bullets)   │      │  (editable)      │
└──────────────┘      └──────┬───────────┘
                             │
                             ▼
                      ┌──────────────────┐
                      │ POST /requests   │
                      │ (existing API)   │
                      └──────────────────┘
```

---

## 3. Backend Design

### 3.1 Module layout

```
mfx-core/ai/
├── __init__.py                # Router export
├── schema.py                  # All Pydantic models
├── service.py                 # Create-request pipeline
├── qa.py                      # Q&A pipeline
├── prompts.py                 # LLM prompt templates
├── routes.py                  # HTTP endpoints
└── providers/                 # Q&A data-fetch registry
    ├── __init__.py
    ├── registry.py            # Routing + orchestration
    ├── requests.py            # Buyer's requests
    └── bids.py                # Bids + shop lookups
```

### 3.2 File responsibilities

| File | Owns | Does NOT own |
|------|------|--------------|
| `schema.py` | HTTP request/response shapes, LLM output schema | Business logic |
| `service.py` | Request-creation orchestration | HTTP routing, prompt strings |
| `qa.py` | Q&A orchestration | Data fetching (delegated to providers) |
| `prompts.py` | All LLM prompt strings | Any code logic |
| `routes.py` | HTTP endpoints, auth, status codes | Business logic |
| `providers/*` | Single-domain data access | Cross-domain joins |
| `providers/registry.py` | Provider selection + orchestration | Individual provider logic |

### 3.3 Dependency graph

```
                    routes.py
                   ╱    │    ╲
                  ╱     │     ╲
                 ▼      ▼      ▼
          service.py  qa.py  schema.py
             │         │
             │         ├─→ prompts.py
             │         │
             │         └─→ providers/registry.py
             │                    │
             │                    ├─→ providers/requests.py
             │                    └─→ providers/bids.py
             │
             └─→ prompts.py

All modules ──→ Supabase client (module-level)
All modules ──→ Gemini client (module-level)
```

**Rule:** imports flow downward only. `routes.py` never imports from `providers/`. `providers/*` never imports from `qa.py`. No cycles.

---

## 4. Provider Pattern

### 4.1 The contract

Every provider is a self-contained module exposing the same surface:

| Symbol | Type | Purpose |
|--------|------|---------|
| `PROVIDER_NAME` | `str` | Unique key in the context dict |
| `ROLE` | `str` | `"buyer"`, `"shop_owner"`, or `"both"` |
| `INTENT_KEYWORDS` | `list[str]` | Lowercase words that trigger this provider |
| `PAGES` | `dict[str,str]` | Label → route for the `→ page` hint |
| `fetch(user_id)` | `function` | Returns `{"count": int, "items": list}` |

### 4.2 Registry internals

```
┌────────────────────────────────────────────────────────────┐
│                   registry.py                              │
│                                                            │
│  ALL_PROVIDERS = [requests, bids, ...]                     │
│                                                            │
│  KEYWORD_MAP = {                                           │
│     kw → provider                                          │
│     for each provider in ALL_PROVIDERS                     │
│     for each kw in provider.INTENT_KEYWORDS                │
│  }                                                          │
│                                                            │
│  pick_providers(question, role):                           │
│    ├─ match keywords against question.lower()              │
│    ├─ filter by role                                       │
│    ├─ if no match → return all providers for role          │
│    └─ always append requests if role == buyer              │
│                                                            │
│  fetch_context(question, user_id, role):                   │
│    ├─ pick_providers()                                     │
│    ├─ for each provider:                                   │
│    │   try    → context[name] = provider.fetch(user_id)    │
│    │   except → log warning, skip                          │
│    └─ return (context, providers_used)                     │
└────────────────────────────────────────────────────────────┘
```

### 4.3 Routing decision tree

```
                        Question arrives
                              │
                              ▼
               ┌──────────────────────────┐
               │  Lowercase the question  │
               └─────────────┬────────────┘
                             │
                             ▼
               ┌──────────────────────────┐
               │  Match against           │
               │  KEYWORD_MAP             │
               └─────────────┬────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
               matches found     no matches
                    │                 │
                    ▼                 ▼
            ┌──────────────┐  ┌────────────────────┐
            │ Collect      │  │ Return all         │
            │ matching     │  │ providers for role │
            │ providers    │  └─────────┬──────────┘
            └──────┬───────┘            │
                   │                    │
                   └──────────┬─────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │ role == "buyer"?     │
                   │  → append requests   │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │  providers list      │
                   │  (deduplicated)      │
                   └──────────────────────┘
```

### 4.4 Provider examples

**`providers/requests.py`** — buyer's requests

```
Question: "when does my bike expire?"
  → keyword "expire" matches requests provider
  → context = { requests: {...} }

Question: "what do I have going on?"
  → no keyword match → fallback
  → context = { requests: {...}, bids: {...} }
```

**`providers/bids.py`** — bids with shop join

```
Step 1: fetch buyer's request ids
         requests.id, item_name where buyer_id = X

Step 2: fetch bids on those requests
         bids where request_id IN (...)

Step 3: batch-fetch shop profiles
         profiles where id IN (distinct shop_ids)

Step 4: merge into compact items
         { for_item, price, shop_name, shop_pincode,
           created_days_ago, selected, rejected }
```

The batch-fetch at Step 3 is deliberate — a naive per-bid profile lookup creates N+1 queries. One `IN (...)` for all shops is O(1) round trips.

---

## 5. Pipeline Flows

### 5.1 Q&A pipeline

```
┌───────────────────────────────────────────────────────────────────┐
│                        POST /ai/ask                               │
│                    { question: "..." }                            │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                ▼
                  ┌──────────────────────────┐
                  │   auth: buyer only       │
                  │   validate: non-empty    │
                  └─────────────┬────────────┘
                                │
                                ▼
                  ┌──────────────────────────┐
                  │  fetch_context(          │
                  │    question,             │
                  │    buyer_id,             │
                  │    role="buyer")         │
                  └─────────────┬────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
         context built                    providers_used
         { requests: {...},              ["requests", "bids"]
           bids: {...} }                       │
              │                               │
              └─────────────┬─────────────────┘
                            │
                            ▼
              ┌──────────────────────────────┐
              │  build_qa_prompt(            │
              │    question,                 │
              │    context)                  │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  Gemini generate_content     │
              │   system: QA_SYSTEM_PROMPT   │
              │   temp: 0.2                  │
              │   max_output_tokens: 200     │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  answer (3 bullets +         │
              │   "→ page" line)             │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  log_ask() → ai_ask_logs     │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  { answer, raw_question,     │
              │    providers_used, log_id }  │
              └──────────────────────────────┘
```

**Latency breakdown** (measured on free tier):

| Stage | Typical |
|-------|---------|
| Provider fetch (2 queries) | 400–900 ms |
| Gemini call | 800–1,500 ms |
| Log insert | 80–150 ms |
| **Total** | **1.3–2.5 s** |

### 5.2 Create-request pipeline

```
┌───────────────────────────────────────────────────────────────────┐
│                  POST /ai/parse-request                           │
│                    { text: "..." }                                │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                ▼
                  ┌──────────────────────────┐
                  │   auth + validate        │
                  └─────────────┬────────────┘
                                │
                                ▼
                  ┌──────────────────────────┐
                  │  get_categories()        │
                  │  (live UUIDs + names)    │
                  └─────────────┬────────────┘
                                │
                                ▼
                  ┌──────────────────────────┐
                  │  build_prompt(text,      │
                  │    categories)           │
                  └─────────────┬────────────┘
                                │
                                ▼
                  ┌──────────────────────────┐
                  │  Gemini generate_content │
                  │   system: SYSTEM_PROMPT  │
                  │   response_schema:       │
                  │     ParsedRequest        │
                  │   temp: 0                │
                  └─────────────┬────────────┘
                                │
                                ▼
                  ┌──────────────────────────┐
                  │  parsed = json.loads()   │
                  └─────────────┬────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
    ┌──────────────────┐              ┌─────────────────────┐
    │ validate_and_    │              │  compute_missing()  │
    │ clean()          │              │  → missing_fields   │
    │  • pincode 6d    │              │  → low_confidence   │
    │  • urgency enum  │              └──────────┬──────────┘
    │  • category_id   │                         │
    │  • int budgets   │                         │
    └────────┬─────────┘                         │
             │                                   │
             └───────────────┬───────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  insert_ai_log()             │
              │  → ai_parse_logs             │
              └──────────────┬───────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  { draft, missing_fields,    │
              │    low_confidence_fields,    │
              │    raw_text, log_id }        │
              └──────────────────────────────┘
```

### 5.3 Buyer-confirm sub-flow

```
Buyer sees AssistantPreview
         │
         ├─ edits a field
         │
         ├─ uploads image (optional)
         │       │
         │       ▼
         │   POST /upload/single
         │   → Cloudinary URL
         │
         ▼
    Clicks Confirm
         │
         ▼
    compute_edited_fields()  ← diff vs original draft
         │
         ▼
    PATCH /ai/parse-request/{log_id}
      { buyer_action: "edited" | "accepted",
        edited_fields: {...} }
         │
         ▼
    POST /requests  (existing API)
      { item_name, budget_min, budget_max,
        pincode, category, image_urls }
         │
         ▼
    toast("Request submitted")
         │
         ▼
    navigate(`/buyer/request/${id}`)
```

---

## 6. Frontend Design

### 6.1 Component tree

```
┌─────────────────────────────────────────────────────┐
│                    AIAssistant                       │
│  owns: isOpen state                                  │
│                                                      │
│  ┌──────────────────────┐   ┌────────────────────┐  │
│  │  FloatingButton      │   │  AssistantPanel    │  │
│  │  (fixed bottom-right)│   │  (fixed bottom-24) │  │
│  │                      │   │                    │  │
│  │  • Animated orb      │   │  owns: state, text │  │
│  │  • Tooltip           │   │  • backdrop blur   │  │
│  │  • Idle wobble       │   │  • header          │  │
│  │  • Hover scale       │   │  • body router     │  │
│  └──────────────────────┘   └─────────┬──────────┘  │
│                                        │             │
│                          ┌─────────────┼──────────┐  │
│                          ▼             ▼          ▼  │
│                    ┌──────────┐ ┌───────────┐ ┌────┐│
│                    │Assistant │ │Assistant  │ │Asst││
│                    │Input     │ │Preview    │ │Ans ││
│                    │(idle)    │ │(preview)  │ │(an)││
│                    └──────────┘ └───────────┘ └────┘│
└─────────────────────────────────────────────────────┘
```

### 6.2 State machine

```
                     ┌─────────────┐
                     │    IDLE     │◄───────────────┐
                     │             │                │
                     │  input box  │                │
                     └──────┬──────┘                │
                            │                       │
              ┌─────────────┴────────────┐          │
              │                          │          │
       looksLikeQuestion          create-request    │
              │                          │          │
              ▼                          ▼          │
       ┌─────────────┐            ┌─────────────┐   │
       │  ASKING     │            │  PARSING    │   │
       │             │            │             │   │
       │  spinner    │            │  spinner    │   │
       └──────┬──────┘            └──────┬──────┘   │
              │                          │          │
         success                     success        │
              │                          │          │
              ▼                          ▼          │
       ┌─────────────┐            ┌─────────────┐   │
       │  ANSWERED   │            │  PREVIEW    │   │
       │             │            │             │   │
       │  bullets    │            │  editable   │   │
       │  + link     │            │  form       │   │
       └──────┬──────┘            └──────┬──────┘   │
              │                          │          │
         "Ask another"           cancel / confirm   │
              │                          │          │
              └──────────────────────────┴──────────┘
                           │
                      error any state
                           │
                           ▼
                     ┌─────────────┐
                     │   ERROR     │
                     │  shown in   │
                     │  input box  │
                     └─────────────┘
```

### 6.3 File map

| File | Responsibility | Lines (approx) |
|------|----------------|----------------|
| `AIAssistant.jsx` | Root, owns `isOpen` | 20 |
| `FloatingButton.jsx` | Animated orb + tooltip | 200 |
| `AssistantPanel.jsx` | State machine + backdrop | 200 |
| `AssistantInput.jsx` | Textarea, chips, submit | 130 |
| `AssistantPreview.jsx` | Draft editor + image upload | 350 |
| `AssistantAnswer.jsx` | Bullet renderer | 100 |
| `index.js` | Barrel export | 1 |
| `api/ai.js` | Axios wrappers | 40 |

### 6.4 Intent detection heuristic

```javascript
looksLikeQuestion(text):
  1. text.endsWith("?") → true
  2. text.startsWith(<any keyword>) → true
     keywords = ["how", "what", "which", "when", "where",
                 "who", "why", "show", "list", "tell me",
                 "do i", "have i", "did i"]
  3. otherwise → false
```

**Behavior table:**

| Input | Detected as | Routed to |
|-------|-------------|-----------|
| `how many bids do I have?` | Question | Q&A |
| `when does my bike expire?` | Question | Q&A |
| `show me all my requests` | Question | Q&A |
| `need a bike under 8000` | Create | Parse |
| `iPhone 13 around 40k` | Create | Parse |
| `i need a phone` | Create | Parse |
| `asdfghjkl` | Create | Parse (gibberish → all-null draft) |

### 6.5 Backdrop animation

The backdrop uses a **3-stage pulse keyframe** with a **150 ms delay**:

```
Time    Opacity    Blur       Effect
─────────────────────────────────────────────
0ms     0.00       0px        transparent
150ms   —          —          (delay)
~350ms  1.00       14px       peak overshoot
~500ms  0.92       10px       settle back
600ms   1.00       12px       final rest
```

This "peak → settle → rest" pattern makes the blur feel like it *arrives* rather than just fading in. The panel arrives 80 ms into the backdrop animation so it feels like it's cutting through the blur.

---

## 7. Data Model

### 7.1 `ai_parse_logs`

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | uuid | no | PK |
| `created_at` | timestamptz | no | insert time |
| `buyer_id` | uuid | no | FK → profiles, CASCADE |
| `raw_text` | text | no | original buyer text |
| `draft` | jsonb | yes | LLM output pre-validation |
| `missing_fields` | text[] | no | nulled by validator |
| `low_confidence_fields` | text[] | no | LLM flagged "low" |
| `model` | text | no | e.g. `"gemini-3.1-flash-lite"` |
| `tokens_in` | int | yes | prompt tokens |
| `tokens_out` | int | yes | completion tokens |
| `latency_ms` | int | yes | LLM call wall-clock |
| `buyer_action` | text | yes | `accepted` / `edited` / `abandoned` |
| `edited_fields` | jsonb | yes | diff from original draft |
| `error` | text | yes | LLM failure message |
| `data_source` | text | no | `seed` / `live` |

**Constraints:**
- `draft OR error` — every row has one or the other
- `buyer_action ∈ {accepted, edited, abandoned, null}`

### 7.2 `ai_ask_logs`

| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `id` | uuid | no | PK |
| `created_at` | timestamptz | no | insert time |
| `buyer_id` | uuid | no | FK → profiles, CASCADE |
| `question` | text | no | buyer's question |
| `answer` | text | yes | LLM answer |
| `providers_used` | text[] | no | which domains were queried |
| `tokens_in` | int | yes | prompt tokens |
| `tokens_out` | int | yes | completion tokens |
| `latency_ms` | int | yes | full pipeline wall-clock |
| `error` | text | yes | LLM failure message |
| `data_source` | text | no | `seed` / `live` |

**Constraints:**
- `answer OR error` — every row has one or the other

### 7.3 RLS posture

Both tables:

```sql
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
-- no policies
```

**Effect:** service role key has full access. Anon and authenticated keys are locked out entirely. Correct for backend-only telemetry.

### 7.4 Table growth estimates

Assumptions: 100 buyers, ~2 parses/day each, ~1 Q&A/day each.

| Table | Rows/day | Rows/month | Storage/year |
|-------|----------|------------|--------------|
| `ai_parse_logs` | 200 | 6,000 | ~15 MB |
| `ai_ask_logs` | 100 | 3,000 | ~5 MB |

Both are small enough to keep forever. Retention/archival isn't necessary for years.

---

## 8. API Reference

### 8.1 `POST /ai/parse-request`

**Auth:** buyer only

**Request:**
```json
{ "text": "need a used bike under 8000 in 560001, urgent" }
```

**Response 200:**
```json
{
  "draft": {
    "item_name": "mountain bike",
    "description": "used",
    "budget_min": 6400,
    "budget_max": 9600,
    "category_id": "d1816140-...",
    "pincode": "560001",
    "urgency": "urgent",
    "confidence": { "item_name": "high", "budget": "high", ... }
  },
  "missing_fields": [],
  "low_confidence_fields": [],
  "raw_text": "...",
  "log_id": "..."
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| 400 | Empty text |
| 403 | Non-buyer role |
| 503 | Gemini unavailable |
| 500 | Unexpected |

### 8.2 `PATCH /ai/parse-request/{log_id}`

**Auth:** buyer only

**Request:**
```json
{
  "buyer_action": "edited",
  "edited_fields": { "budget_max": 9000 }
}
```

**Response 200:**
```json
{ "ok": true }
```

**Errors:**

| Status | Condition |
|--------|-----------|
| 403 | Non-buyer |
| 404 | Log not found |
| 422 | Invalid action value |
| 500 | DB error |

### 8.3 `GET /ai/categories`

**Auth:** any authenticated

**Response 200:**
```json
[
  { "id": "d1816140-...", "name": "Automotive" },
  { "id": "8162c31f-...", "name": "Electronics" }
]
```

### 8.4 `POST /ai/ask`

**Auth:** buyer only

**Request:**
```json
{ "question": "how many bids do I have?" }
```

**Response 200:**
```json
{
  "answer": "• 1 bid on \"i phone 17\"\n• ₹77,400 from Tech Store\n• Selected\n→ Requests page",
  "raw_question": "how many bids do I have?",
  "providers_used": ["bids", "requests"],
  "log_id": "..."
}
```

**Errors:**

| Status | Condition |
|--------|-----------|
| 400 | Empty question |
| 403 | Non-buyer |
| 503 | Gemini unavailable |
| 500 | Unexpected |

---

## 9. Cost & Limits

### 9.1 Model

**`gemini-3.1-flash-lite`** via Google AI Studio free tier.

### 9.2 Free tier limits

| Limit | Value |
|-------|-------|
| Requests per minute | 15 |
| Requests per day | 500 |
| Tokens per minute | 250,000 |
| Credit card required | No |

### 9.3 Pricing (paid tier)

| Direction | Cost |
|-----------|------|
| Input | $0.25 / 1M tokens |
| Output | $1.50 / 1M tokens |

### 9.4 Per-operation cost

| Operation | Tokens In | Tokens Out | Cost |
|-----------|-----------|------------|------|
| Create request | ~700 | ~150 | $0.0004 |
| Q&A (2 providers) | ~2,000 | ~200 | $0.0008 |
| Q&A (5 providers) | ~4,500 | ~200 | $0.0014 |

### 9.5 Monthly projection

At 100 buyers, ~1 Q&A + 2 parses/day each:

```
Daily:   300 operations × $0.0006 avg ≈ $0.18/day
Monthly: ~$5.40/month

Free tier covers ~500 ops/day → 100 buyers is fully free
Beyond 500 ops/day: $5-10/month for 200-300 buyers
```

### 9.6 Free-tier caveat

**Data usage:** Google uses free-tier prompts for model improvement. Acceptable for testing with non-sensitive data. For production, enable billing on a **separate Google Cloud project** — billing on the same project removes its free tier permanently.

---

## 10. Extension Guide

### 10.1 Adding a buyer provider

**Three steps:**

**Step 1** — Create `ai/providers/<domain>.py`:

```python
PROVIDER_NAME   = "auctions"
ROLE            = "buyer"
INTENT_KEYWORDS = ["auction", "won", "position"]
PAGES           = {"auctions": "/buyer/auctions"}

def fetch(buyer_id: str) -> dict:
    # your query + summary
    return {"count": N, "items": [...]}
```

**Step 2** — Import in `registry.py`:

```python
from . import auctions as auctions_provider
```

**Step 3** — Add to `ALL_PROVIDERS`:

```python
ALL_PROVIDERS = [
    requests_provider,
    bids_provider,
    auctions_provider,   # ← new
]
```

Done. The Q&A pipeline picks it up automatically. Frontend needs no changes.

### 10.2 Adding a shop provider

Same three steps, plus:

- `ROLE = "shop_owner"` in the provider file
- Call `fetch_context(question, user_id, role="shop_owner")` from the shop route
- Add a shop-specific system prompt in `prompts.py`
- Mount `<AIAssistant />` on the shop dashboard

Registry filters by role automatically — no changes to `pick_providers` logic.

### 10.3 Adding a new Q&A capability

Examples: multi-turn conversation, action commands, streaming.

**Most additions follow this pattern:**

```
1. New function in qa.py (e.g. ask_question_stream)
2. New route in routes.py
3. New frontend component or state
4. Frontend consumes new endpoint
```

**Providers are untouched** in every one of these cases. That's the payoff of the abstraction.

### 10.4 Swapping LLM providers

Change one line in `qa.py` and one in `service.py`:

```python
MODEL = "gemini-3.1-flash-lite"
```

For a different SDK (e.g., switching from Google to Anthropic):

- Replace the `client` initialization
- Replace the `.generate_content()` call with the equivalent
- Keep prompts, providers, routes, frontend identical

The abstraction boundary is the LLM call itself — nothing else knows which provider is behind it.

---

## 11. Known Constraints

### 11.1 Current limitations

| Constraint | Impact | Mitigation |
|-----------|--------|------------|
| No rate limiting | A buyer can drain the daily quota | Add per-user throttle before public launch |
| No retry on Gemini failure | Transient 503s surface to user | Add retry with backoff |
| No timeout on Gemini call | Slow responses hold the request | Set client timeout to 20s |
| Categories fetched per parse | One extra DB roundtrip per create | Cache for 5 min |
| No conversation memory | Each question is standalone | Out of scope for v3.1 |
| Read-only Q&A | Can't perform actions | By design — actions go through regular UI |
| No multimodal input | Can't analyze uploaded images | Future enhancement |
| No eval set | No baseline accuracy measurement | Build 20–30 prompt test suite |

### 11.2 What ships next

| Priority | Feature | Effort |
|----------|---------|--------|
| High | Rate limiting on `/ai/ask` and `/ai/parse-request` | 1 hour |
| High | Retry + timeout wrapper on Gemini calls | 2 hours |
| High | Eval set (20–30 prompts + runner script) | 3 hours |
| Medium | Category cache (5-min TTL) | 1 hour |
| Medium | Shop-side Q&A | 1–2 days |
| Low | Multi-turn conversation | 3–5 days |
| Low | Action commands | Design-gated |

### 11.3 Things that are NOT constraints

- **Data size:** at current scale (100 buyers × 20 requests), the largest context is ~4 KB. Gemini handles this trivially.
- **Latency:** 1.3–2.5 s end-to-end is acceptable for a preview flow with a spinner.
- **Storage:** `ai_ask_logs` and `ai_parse_logs` grow at ~20 MB/year at current scale.
- **Cost:** free tier covers current usage with 10× headroom.

The architecture supports scaling to 10× current usage without code changes. Beyond that, the category cache and rate limiting become important; nothing else moves.

---

## Appendix A — Environment variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| `GEMINI_API_KEY` | `qa.py`, `service.py` | Google AI Studio key |
| `SUPABASE_URL` | providers, logging | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | providers, logging | Bypasses RLS |
| `CLOUDINARY_CLOUD_NAME` | `utils/cloudinary_config.py` | Image CDN |
| `CLOUDINARY_API_KEY` | `utils/cloudinary_config.py` | Image CDN |
| `CLOUDINARY_API_SECRET` | `utils/cloudinary_config.py` | Image CDN |

## Appendix B — Local testing commands

```bash
# providers
python -m ai.providers.requests <buyer_uuid>
python -m ai.providers.bids <buyer_uuid>
python -m ai.providers.registry <buyer_uuid> "<question>"

# full Q&A pipeline (no HTTP)
python -m ai.qa <buyer_uuid> "<question>"

# create-request pipeline
python -m ai.service
```

Each runs standalone — no FastAPI server, no frontend, no browser. Isolate bugs to a single layer.

## Appendix C — Reference queries

**Find a buyer with rich test data:**

```sql
SELECT r.buyer_id, COUNT(b.id) AS bid_count
FROM requests r
LEFT JOIN bids b ON b.request_id = r.id
WHERE r.data_source = 'live' AND r.status != 'deleted'
GROUP BY r.buyer_id
ORDER BY bid_count DESC
LIMIT 1;
```

**Verify a Q&A log row:**

```sql
SELECT id, question, answer, providers_used, latency_ms
FROM ai_ask_logs
ORDER BY created_at DESC
LIMIT 5;
```

**Daily cost estimate:**

```sql
SELECT
  DATE(created_at) AS day,
  COUNT(*) AS asks,
  SUM(tokens_in) AS total_in,
  SUM(tokens_out) AS total_out,
  ROUND(
    SUM(tokens_in) * 0.25 / 1000000 +
    SUM(tokens_out) * 1.50 / 1000000,
    6
  ) AS cost_usd
FROM ai_ask_logs
WHERE data_source = 'live'
GROUP BY DATE(created_at)
ORDER BY day DESC;
```