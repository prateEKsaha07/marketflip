Here's the file structure, why each piece exists, and where it sits relative to v3.0.

---

## Where this sits in versioning

**v3.0 shipped:** create a request through the AI assistant.

**This is v3.1:** read-only Q&A about the buyer's own data. New files, new endpoint, no changes to any v3.0 code except a small edit in `AssistantPanel.jsx` to route questions vs. creation.

Call it **v3.1 — Assistant Q&A** (or "Assistant Quick Answers").

Nothing in v3.0 breaks. Everything is additive.

---

## File structure

```
mfx-core/ai/
├── __init__.py
├── schema.py                # exists (v3.0) — add AskIn, AskOut
├── service.py               # exists (v3.0) — UNCHANGED
├── routes.py                # exists (v3.0) — add POST /ai/ask
├── prompts.py               # exists or add (v3.0) — add QA_SYSTEM_PROMPT
│
├── qa.py                    # NEW — ask_question, build_qa_prompt, log_ask
│
└── providers/               # NEW FOLDER
    ├── __init__.py          # empty
    ├── registry.py          # pick_providers, fetch_context
    ├── requests.py          # buyer's requests
    └── bids.py              # bids on buyer's requests
    (future) auctions.py
    (future) purchases.py
    (future) chats.py
    (future) shop_*.py       # when you build seller-side


frontend/src/
├── api/
│   └── ai.js                # exists — add askQuestion
│
└── components/ai-assistant/
    ├── AIAssistant.jsx      # exists — UNCHANGED
    ├── FloatingButton.jsx   # exists — UNCHANGED
    ├── AssistantInput.jsx   # exists — edit placeholder text
    ├── AssistantPreview.jsx # exists — UNCHANGED (v3.0 creation flow)
    ├── AssistantPanel.jsx   # exists — add intent detection + "answered" state
    └── AssistantAnswer.jsx  # NEW — renders bullets + page link
```

---

## Why each new file exists

### `qa.py`

Separate from `service.py` because:

- **Different concern.** `service.py` handles request creation (extract → validate → log). `qa.py` handles reading and summarizing. Same LLM, totally different pipeline.
- **Different shape.** `service.parse_request()` returns a structured draft. `qa.ask_question()` returns free text.
- **Different model config.** `parse_request` uses `response_schema` (structured JSON). `ask_question` uses free text with `max_output_tokens=200`.
- **Easier to reason about.** When debugging "why did my Q&A return gibberish", you look in one file. Same for "why did my request extract fail".

If `service.py` grew to 400 lines mixing both, you'd regret it in two weeks.

### `providers/` folder

This is the important architectural choice. Without it, `qa.py` would hardcode:

```python
requests_data = fetch_requests(buyer_id)
bids_data = fetch_bids(buyer_id)
context = {"requests": requests_data, "bids": bids_data}
```

Adding auctions would mean editing `qa.py` again. And again for purchases. And again for chats. Every new domain touches the same file, growing risk of breaking the others.

With providers:

```python
context, used = fetch_context(question, buyer_id)
```

Adding auctions is: create `providers/auctions.py`, add one line to `ALL_PROVIDERS`. Zero changes to `qa.py`. This is why the folder exists.

### `providers/registry.py`

The brain of the system. Three jobs:

1. **Route the question** — keywords → which providers to fetch
2. **Fetch in parallel** — call each provider, collect results
3. **Fail soft** — if a provider errors, skip it, don't crash the whole request

Without a registry, `qa.py` would need to know about every provider. Bad coupling. The registry is the single place that knows the full list.

### `providers/requests.py` and `providers/bids.py`

Each is a **self-contained description of how to read one domain**. It knows:

- What columns to select
- How to summarize for the LLM
- Which keywords trigger it
- Which page to link to

It knows nothing about Gemini, nothing about other providers, nothing about HTTP. Pure data access.

### `AssistantAnswer.jsx`

A dedicated render component for the answer. Why not inline in `AssistantPanel`?

- **Different structure from preview card.** Answer is bullets + link, preview is form inputs.
- **Reusable.** When you add "Ask about this request" buttons on the request detail page later, they can reuse this component.
- **Small.** ~60 lines. Keeps `AssistantPanel` from becoming a monster.

---

## The rule of thumb

| Concern | Lives in |
|---------|----------|
| HTTP request/response shapes | `schema.py` |
| Endpoint routing | `routes.py` |
| LLM prompt strings | `prompts.py` |
| Request-creation pipeline | `service.py` |
| Q&A pipeline | `qa.py` |
| Data access for one domain | `providers/<domain>.py` |
| Routing questions to providers | `providers/registry.py` |
| UI rendering | `frontend components` |

One concern per file. When you open a file, you know exactly why you're there.

---

## Why this scales

**Add auctions (v3.2):**
- Create `providers/auctions.py` (one file)
- Add two lines to `registry.py`
- Done. No touching `qa.py`, `routes.py`, or the frontend.

**Add purchases (v3.3):**
- Create `providers/purchases.py`
- Two lines in `registry.py`
- Done.

**Add seller-side (v3.4):**
- Add `ROLE = "shop_owner"` to new shop providers
- `fetch_context(question, user_id, role="shop_owner")` filters automatically
- Frontend gets a role toggle or separate shop assistant — no backend changes

**Swap Gemini for another model:**
- Edit one line in `qa.py` (the `generate_content` call)
- Providers untouched, prompts untouched, frontend untouched

**Add streaming responses:**
- Change `generate_content` to `generate_content_stream` in `qa.py`
- Frontend consumes the stream
- Providers untouched

Every one of those is a small, isolated change because each concern is in its own file.

---

## What changes in v3.0 files

| File | Change | Risk |
|------|--------|------|
| `ai/schema.py` | Add `AskIn`, `AskOut` (2 classes) | None — additive |
| `ai/routes.py` | Add `POST /ai/ask` (1 function + 1 import) | None — additive |
| `ai/prompts.py` | Add `QA_SYSTEM_PROMPT` (1 constant) | None — additive |
| `src/api/ai.js` | Add `askQuestion` (1 function) | None — additive |
| `AssistantInput.jsx` | Update placeholder text | Cosmetic |
| `AssistantPanel.jsx` | Add intent detection + `answered` state | Localized — the `create` flow untouched |

**Nothing existing gets rewritten.** v3.0 continues to work. You're adding a sibling feature.

---

## Full build order

```
BACKEND
1.  Migration: ai_ask_logs table
2.  providers/__init__.py           (empty)
3.  providers/requests.py           (fetch buyer's requests)
4.  providers/bids.py               (fetch bids + shop lookups)
5.  providers/registry.py           (pick_providers, fetch_context)
6.  prompts.py: QA_SYSTEM_PROMPT
7.  qa.py: ask_question, build_qa_prompt, log_ask
8.  schema.py: AskIn, AskOut
9.  routes.py: POST /ai/ask

TEST BACKEND
10. REPL test: fetch_context("how many bids", buyer_id)
11. curl POST /ai/ask

FRONTEND
12. api/ai.js: askQuestion
13. AssistantAnswer.jsx
14. AssistantPanel.jsx: intent detection + answered state
15. AssistantInput.jsx: placeholder

TEST END-TO-END
16. From dashboard: ask a question → see bullets
17. Ask a create request → still works
```

---

## Verify at each checkpoint

| After step | What to verify |
|------------|----------------|
| 3 | `providers.requests.fetch(buyer_id)` returns correct dict in REPL |
| 4 | `providers.bids.fetch(buyer_id)` includes shop_name + for_item |
| 5 | `fetch_context("how many bids", buyer_id)` picks both providers |
| 7 | `ask_question("how many bids?", buyer_id)` returns 3-bullet answer |
| 9 | `curl POST /ai/ask` returns 200 with correct JSON |
| 13 | `AssistantAnswer` renders bullets + link in isolation |
| 14 | Clicking a question routes to Q&A; typing "need a bike" routes to create |
| 16 | Full flow works from the dashboard |

---

## The one risky change

`AssistantPanel.jsx` — adding intent detection changes the entry point. Test carefully:

```
Type: "need a bike under 8000"     → preview card (create flow) ✅
Type: "how many bids do I have?"    → answer card (Q&A flow) ✅
Type: "asdfghjkl"                   → preview card with all-null draft (gibberish) ✅
Type: "show me my requests"         → answer card ✅
Type: ""                            → Parse button disabled ✅
```

If the intent detection misfires, tune the keywords in `looksLikeQuestion`. Everything else in v3.0 stays exactly as it is.

---

## Ready?

Say go and I'll write in the build order:

**File 1:** the `ai_ask_logs` migration
**File 2–3:** `providers/__init__.py`, `providers/requests.py`
**File 4:** `providers/bids.py`
**File 5:** `providers/registry.py`

Then a REPL test before touching `qa.py`. That way you verify data access works before adding LLM complexity on top.

Writing in build order. Start with file 1, run it, then move to file 2.

---

## File 1 — `ai_ask_logs` migration

Run in Supabase SQL editor:

```sql
-- ============================================================
-- Migration: create ai_ask_logs
-- Purpose:  log every buyer Q&A to the AI assistant
-- ============================================================

CREATE TABLE public.ai_ask_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  buyer_id uuid NOT NULL,

  question text NOT NULL,
  answer text NULL,

  -- which providers were queried to answer this question
  providers_used text[] NOT NULL DEFAULT '{}',

  -- LLM metadata
  tokens_in integer NULL,
  tokens_out integer NULL,
  latency_ms integer NULL,

  error text NULL,

  data_source text NOT NULL DEFAULT 'live',

  CONSTRAINT ai_ask_logs_pkey PRIMARY KEY (id),

  CONSTRAINT ai_ask_logs_buyer_id_fkey
    FOREIGN KEY (buyer_id) REFERENCES profiles (id) ON DELETE CASCADE,

  CONSTRAINT ai_ask_logs_answer_or_error CHECK (
    (answer IS NOT NULL) OR (error IS NOT NULL)
  ),

  CONSTRAINT ai_ask_logs_data_source_check CHECK (
    data_source = ANY (ARRAY['seed'::text, 'live'::text])
  )
) TABLESPACE pg_default;


CREATE INDEX IF NOT EXISTS idx_ai_ask_logs_buyer_id
  ON public.ai_ask_logs USING btree (buyer_id)
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_ai_ask_logs_created_at
  ON public.ai_ask_logs USING btree (created_at DESC)
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_ai_ask_logs_data_source
  ON public.ai_ask_logs USING btree (data_source)
  TABLESPACE pg_default;


ALTER TABLE public.ai_ask_logs ENABLE ROW LEVEL SECURITY;
```

Run this. Confirm the table exists:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ai_ask_logs'
ORDER BY ordinal_position;
```

---

## File 2 — `mfx-core/ai/providers/__init__.py`

Empty file. Just create it:

```bash
mkdir mfx-core/ai/providers
touch mfx-core/ai/providers/__init__.py
```

Contents:

```python
# Provider registry for AI Q&A assistant.
# Each provider fetches and summarizes one domain of buyer data.
# See registry.py for routing logic.
```

---

## File 3 — `mfx-core/ai/providers/requests.py`

```python
"""
Provider: buyer's own requests.

Fetches the buyer's active requests and returns a compact summary
suitable for passing to an LLM as context.
"""

from datetime import datetime, timezone
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)


PROVIDER_NAME = "requests"
ROLE = "buyer"
INTENT_KEYWORDS = [
    "request", "post", "item", "buy", "expire", "oldest", "recent",
    "open", "active", "status",
]
PAGES = {"requests": "/buyer/requests"}


def _days_ago(iso: str) -> int:
    """Whole days since an ISO timestamp."""
    if not iso:
        return 0
    dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    return (datetime.now(timezone.utc) - dt).days


def _days_until(iso: str) -> int:
    """Whole days until an ISO timestamp. Negative if already past."""
    if not iso:
        return 0
    dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    return (dt - datetime.now(timezone.utc)).days


def fetch(buyer_id: str) -> dict:
    """Return a summary of the buyer's active requests."""
    rows = (
        supabase.table("requests")
        .select(
            "item_name, status, budget_min, budget_max, "
            "pincode, category, created_at, expires_at"
        )
        .eq("buyer_id", buyer_id)
        .neq("status", "deleted")
        .eq("data_source", "live")
        .order("created_at", desc=True)
        .execute()
        .data
    )

    items = [
        {
            "item_name": r["item_name"],
            "status": r["status"],
            "budget": f"₹{r['budget_min']}-{r['budget_max']}",
            "pincode": r["pincode"],
            "category": r.get("category"),
            "created_days_ago": _days_ago(r["created_at"]),
            "expires_in_days": _days_until(r["expires_at"]),
        }
        for r in rows
    ]

    return {"count": len(items), "items": items}
```

---

## Test File 3 in a REPL before moving on

```bash
cd mfx-core
python
```

```python
from ai.providers.requests import fetch

# paste a real buyer UUID from your profiles table
result = fetch("04f027ec-3668-4ec9-9c80-308a57b35346")
import json
print(json.dumps(result, indent=2, default=str))
```

**Expected:** a dict with `count` and a list of `items`, each with `item_name`, `status`, `budget`, `pincode`, `category`, `created_days_ago`, `expires_in_days`.

If it works → proceed to File 4.

If it errors:
- `KeyError` on an env var → check `.env` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- `AttributeError: 'str' object has no attribute 'replace'` → `created_at` is coming back as a `datetime`, not a string. Change `_days_ago` to accept both:

```python
def _days_ago(iso) -> int:
    if not iso:
        return 0
    if isinstance(iso, str):
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    else:
        dt = iso
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - dt).days
```

Same for `_days_until`.

Here's every file for v3.1 — full code, ready to paste. Read top to bottom and create them in this order.

---

## File 1 — Migration: `ai_ask_logs`

**Where:** Supabase SQL editor (run once)

```sql
-- ============================================================
-- Migration: create ai_ask_logs
-- Purpose:  log every buyer Q&A to the AI assistant
-- ============================================================

CREATE TABLE public.ai_ask_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  buyer_id uuid NOT NULL,
  question text NOT NULL,
  answer text NULL,
  providers_used text[] NOT NULL DEFAULT '{}',
  tokens_in integer NULL,
  tokens_out integer NULL,
  latency_ms integer NULL,
  error text NULL,
  data_source text NOT NULL DEFAULT 'live',

  CONSTRAINT ai_ask_logs_pkey PRIMARY KEY (id),

  CONSTRAINT ai_ask_logs_buyer_id_fkey
    FOREIGN KEY (buyer_id) REFERENCES profiles (id) ON DELETE CASCADE,

  CONSTRAINT ai_ask_logs_answer_or_error CHECK (
    (answer IS NOT NULL) OR (error IS NOT NULL)
  ),

  CONSTRAINT ai_ask_logs_data_source_check CHECK (
    data_source = ANY (ARRAY['seed'::text, 'live'::text])
  )
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_ai_ask_logs_buyer_id
  ON public.ai_ask_logs USING btree (buyer_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_ai_ask_logs_created_at
  ON public.ai_ask_logs USING btree (created_at DESC) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_ai_ask_logs_data_source
  ON public.ai_ask_logs USING btree (data_source) TABLESPACE pg_default;

ALTER TABLE public.ai_ask_logs ENABLE ROW LEVEL SECURITY;
```

---

## File 2 — `mfx-core/ai/providers/__init__.py`

**Where:** new folder `ai/providers/`

```python
# Provider registry for AI Q&A assistant.
# Each provider fetches and summarizes one domain of buyer data.
# See registry.py for routing logic.
```

---

## File 3 — `mfx-core/ai/providers/requests.py`

```python
"""
Provider: buyer's own requests.
"""

from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

PROVIDER_NAME = "requests"
ROLE = "buyer"
INTENT_KEYWORDS = [
    "request", "post", "item", "buy", "expire", "oldest", "recent",
    "open", "active", "status",
]
PAGES = {"requests": "/buyer/requests"}


def _to_dt(iso) -> datetime | None:
    if not iso:
        return None
    if isinstance(iso, str):
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    else:
        dt = iso
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _days_ago(iso) -> int:
    dt = _to_dt(iso)
    if not dt:
        return 0
    return (datetime.now(timezone.utc) - dt).days


def _days_until(iso) -> int:
    dt = _to_dt(iso)
    if not dt:
        return 0
    return (dt - datetime.now(timezone.utc)).days


def fetch(buyer_id: str) -> dict:
    rows = (
        supabase.table("requests")
        .select(
            "item_name, status, budget_min, budget_max, "
            "pincode, category, created_at, expires_at"
        )
        .eq("buyer_id", buyer_id)
        .neq("status", "deleted")
        .eq("data_source", "live")
        .order("created_at", desc=True)
        .execute()
        .data
    )

    items = [
        {
            "item_name": r["item_name"],
            "status": r["status"],
            "budget": f"₹{r['budget_min']}-{r['budget_max']}",
            "pincode": r["pincode"],
            "category": r.get("category"),
            "created_days_ago": _days_ago(r["created_at"]),
            "expires_in_days": _days_until(r["expires_at"]),
        }
        for r in rows
    ]

    return {"count": len(items), "items": items}
```

---

## File 4 — `mfx-core/ai/providers/bids.py`

```python
"""
Provider: bids on the buyer's requests.

Fetches bids placed on any of the buyer's requests, joins with shop
profile info, and returns a compact summary.
"""

from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

PROVIDER_NAME = "bids"
ROLE = "buyer"
INTENT_KEYWORDS = [
    "bid", "offer", "quote", "highest", "cheapest", "closest",
    "selected", "rejected", "shop",
]
PAGES = {"requests": "/buyer/requests"}


def _to_dt(iso) -> datetime | None:
    if not iso:
        return None
    if isinstance(iso, str):
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    else:
        dt = iso
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _days_ago(iso) -> int:
    dt = _to_dt(iso)
    if not dt:
        return 0
    return (datetime.now(timezone.utc) - dt).days


def fetch(buyer_id: str) -> dict:
    # 1. buyer's request ids + item names
    req_rows = (
        supabase.table("requests")
        .select("id, item_name")
        .eq("buyer_id", buyer_id)
        .neq("status", "deleted")
        .eq("data_source", "live")
        .execute()
        .data
    )

    if not req_rows:
        return {"count": 0, "items": []}

    request_ids = [r["id"] for r in req_rows]
    req_item_names = {r["id"]: r["item_name"] for r in req_rows}

    # 2. bids on those requests
    bid_rows = (
        supabase.table("bids")
        .select(
            "request_id, shop_id, price, status, "
            "created_at, selected_at, rejected_at"
        )
        .in_("request_id", request_ids)
        .eq("data_source", "live")
        .execute()
        .data
    )

    if not bid_rows:
        return {"count": 0, "items": []}

    # 3. batch fetch shop profiles
    shop_ids = list({b["shop_id"] for b in bid_rows})
    shop_rows = (
        supabase.table("profiles")
        .select("id, shop_name, pincode")
        .in_("id", shop_ids)
        .execute()
        .data
    )
    shop_map = {s["id"]: s for s in shop_rows}

    # 4. build compact items
    items = []
    for b in bid_rows:
        shop = shop_map.get(b["shop_id"], {})
        items.append({
            "for_item": req_item_names.get(b["request_id"], "unknown"),
            "price": b["price"],
            "status": b["status"],
            "shop_name": shop.get("shop_name"),
            "shop_pincode": shop.get("pincode"),
            "created_days_ago": _days_ago(b["created_at"]),
            "selected": b["selected_at"] is not None,
            "rejected": b["rejected_at"] is not None,
        })

    return {"count": len(items), "items": items}
```

---

## File 5 — `mfx-core/ai/providers/registry.py`

```python
"""
Provider registry — routes questions to the right data providers.
"""

import logging

from . import requests as requests_provider
from . import bids as bids_provider

logger = logging.getLogger(__name__)

# ============================================================
# To add a new provider (e.g., auctions):
#   1. Create ai/providers/auctions.py with the standard contract
#   2. Import it above
#   3. Add it to ALL_PROVIDERS below
# No changes needed in qa.py, routes.py, or the frontend.
# ============================================================

ALL_PROVIDERS = [
    requests_provider,
    bids_provider,
    # auctions_provider,   # phase 3.2
    # purchases_provider,  # phase 3.3
    # chats_provider,      # phase 3.4
]

# keyword → provider lookup, built once
KEYWORD_MAP = {
    kw: p
    for p in ALL_PROVIDERS
    for kw in p.INTENT_KEYWORDS
}


def pick_providers(question: str, role: str = "buyer") -> list:
    """Return providers relevant to the question. Falls back to all."""
    q = question.lower()
    matched = []
    seen = set()

    for keyword, provider in KEYWORD_MAP.items():
        if keyword in q and provider.PROVIDER_NAME not in seen:
            if provider.ROLE in (role, "both"):
                matched.append(provider)
                seen.add(provider.PROVIDER_NAME)

    # fallback: no keyword matched → fetch everything for this role
    if not matched:
        matched = [p for p in ALL_PROVIDERS if p.ROLE in (role, "both")]

    # always include requests (anchor table) for buyers
    if role == "buyer" and "requests" not in seen:
        matched.append(requests_provider)

    return matched


def fetch_context(question: str, user_id: str, role: str = "buyer"):
    """
    Fetch data from relevant providers.
    Returns (context_dict, names_used_list).
    Never raises — a failed provider is skipped.
    """
    providers = pick_providers(question, role)
    context = {}
    names_used = []

    for p in providers:
        try:
            context[p.PROVIDER_NAME] = p.fetch(user_id)
            names_used.append(p.PROVIDER_NAME)
        except Exception as e:
            logger.warning(f"Provider {p.PROVIDER_NAME} failed: {e}")

    return context, names_used
```

---

## File 6 — `mfx-core/ai/prompts.py` (add to existing)

If `prompts.py` exists, append this. If not, create it and move your `SYSTEM_PROMPT` here too.

```python
QA_SYSTEM_PROMPT = """You are a quick-answer assistant for a MarketFlip buyer.

The buyer's data is provided as JSON. It may include these sections:
- requests: items the buyer wants to buy
- bids: offers from shops on those requests
(future: auctions, purchases, chats — only include sections that exist)

OUTPUT FORMAT (MANDATORY):
- Maximum 3 bullet points.
- Each bullet: one line, under 12 words.
- No intro sentence. No closing sentence. Just bullets.
- Use "•" as the bullet character.
- End with a single line: "→ {page_name}" naming the page with full details.

EXAMPLES:

Q: how many bids on my bike request?
A:
• 3 bids on "mountain bike"
• Highest: ₹8,500 (Sharma Cycles)
• Closest shop: 560002
→ Requests page

Q: what's my oldest open request?
A:
• "laptop" — posted 8 days ago
• 2 bids pending
→ Requests page

Q: show me all my bids
A:
• 14 bids across 6 requests
• Too many to list here
→ Requests page

RULES:
- Answer ONLY from the provided context. Never invent numbers, shops, or dates.
- If the context doesn't contain the answer, output:
  • I don't have that information.
  → Dashboard
- Never list every item. Summarize: counts, highest, lowest, closest, most recent, oldest.
- Never output IDs, ISO timestamps, or field names.
- Currency: ₹ prefix, no decimals.
- Time: "2 days ago", "5 days left" — not raw dates.
- If the buyer asks for a full list, refuse gently and point to the page.

PAGES:
- Requests: /buyer/requests
- Auctions: /buyer/auctions
- Purchases: /buyer/purchases
- Chats: /buyer/chat
- Dashboard: /buyer/dashboard
"""


def build_qa_prompt(question: str, context: dict) -> str:
    import json
    return f"""Buyer's question:
\"\"\"{question}\"\"\"

Buyer's data (JSON):
{json.dumps(context, indent=2)}

Answer per the output format. Max 3 bullets. End with "→ {{page}}".
"""
```

---

## File 7 — `mfx-core/ai/qa.py`

```python
"""
Q&A pipeline — asks Gemini a question with the buyer's data as context.
"""

import time
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from supabase import create_client
import logging

from .prompts import QA_SYSTEM_PROMPT, build_qa_prompt
from .providers.registry import fetch_context

load_dotenv()

logger = logging.getLogger(__name__)

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

MODEL = "gemini-3.1-flash-lite"


def log_ask(
    buyer_id: str,
    question: str,
    answer: str | None,
    providers_used: list[str],
    latency_ms: int,
    data_source: str = "live",
    error: str | None = None,
    tokens_in: int | None = None,
    tokens_out: int | None = None,
) -> str:
    payload = {
        "buyer_id": buyer_id,
        "question": question,
        "answer": answer,
        "providers_used": providers_used,
        "error": error,
        "latency_ms": latency_ms,
        "data_source": data_source,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
    }
    response = supabase.table("ai_ask_logs").insert(payload).execute()
    return response.data[0]["id"]


def ask_question(question: str, buyer_id: str, data_source: str = "live") -> dict:
    start = time.perf_counter()

    context, providers_used = fetch_context(question, buyer_id, role="buyer")

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=build_qa_prompt(question, context),
            config=types.GenerateContentConfig(
                system_instruction=QA_SYSTEM_PROMPT,
                temperature=0.2,
                max_output_tokens=200,
            ),
        )
    except Exception as e:
        latency_ms = int((time.perf_counter() - start) * 1000)
        log_ask(
            buyer_id=buyer_id,
            question=question,
            answer=None,
            providers_used=providers_used,
            latency_ms=latency_ms,
            data_source=data_source,
            error=str(e),
        )
        raise RuntimeError(f"Q&A failed: {e}") from e

    latency_ms = int((time.perf_counter() - start) * 1000)
    answer = response.text.strip()

    usage = response.usage_metadata
    log_id = log_ask(
        buyer_id=buyer_id,
        question=question,
        answer=answer,
        providers_used=providers_used,
        latency_ms=latency_ms,
        data_source=data_source,
        tokens_in=usage.prompt_token_count if usage else None,
        tokens_out=usage.candidates_token_count if usage else None,
    )

    return {
        "answer": answer,
        "raw_question": question,
        "providers_used": providers_used,
        "log_id": log_id,
    }
```

---

## File 8 — `mfx-core/ai/schema.py` (add to existing)

Append these two classes:

```python
class AskIn(BaseModel):
    question: str = Field(..., min_length=3, max_length=300)


class AskOut(BaseModel):
    answer: str
    raw_question: str
    providers_used: List[str]
    log_id: Optional[str] = None
```

---

## File 9 — `mfx-core/ai/routes.py` (add to existing)

Append this route. Add imports at top of file:

```python
from ai.schema import AskIn, AskOut
from ai.qa import ask_question
```

Then the route:

```python
@router.post("/ask", response_model=AskOut)
async def ask_endpoint(
    payload: AskIn,
    current_user: dict = Depends(get_current_user),
):
    """Answer a quick question about the buyer's data (buyer only)."""
    if current_user.get("role") != "buyer":
        raise HTTPException(status_code=403, detail="Only buyers can ask questions")

    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question is required")

    try:
        result = ask_question(payload.question, current_user["id"])
        return result
    except RuntimeError as e:
        logger.error(f"Ask failed: {e}")
        raise HTTPException(status_code=503, detail="Assistant unavailable")
    except Exception:
        logger.exception("Unexpected error in ask_endpoint")
        raise HTTPException(status_code=500, detail="Internal error")
```

---

## File 10 — `frontend/src/api/ai.js` (add to existing)

```js
export const askQuestion = async (question) => {
  const { data } = await api.post("/ai/ask", { question });
  return data;
};
```

---

## File 11 — `frontend/src/components/ai-assistant/AssistantAnswer.jsx`

```jsx
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AssistantAnswer({ question, answer, onAskAnother }) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const lines = answer
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets = lines.filter((l) => l.startsWith("•"));
  const pageLine = lines.find((l) => l.startsWith("→"));

  const pagePath = (() => {
    if (!pageLine) return null;
    const name = pageLine.replace("→", "").trim().toLowerCase();
    if (name.includes("request")) return "/buyer/requests";
    if (name.includes("auction")) return "/buyer/auctions";
    if (name.includes("purchase")) return "/buyer/purchases";
    if (name.includes("chat")) return "/buyer/chat";
    return "/buyer/dashboard";
  })();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="p-4 flex flex-col gap-3"
    >
      {/* Buyer's question */}
      <div className="self-end max-w-[85%] rounded-2xl bg-indigo-500
                      text-white px-4 py-2 text-sm">
        {question}
      </div>

      {/* Assistant's answer */}
      <div className="self-start max-w-[90%] rounded-2xl bg-[#F5F3EF]
                      text-[#1A1A2E] px-4 py-3 text-sm">
        <div className="flex items-center gap-1.5 mb-2 text-[10px]
                        uppercase tracking-wider text-[#A0A0B0]">
          <Sparkles size={11} className="text-indigo-500" />
          Assistant
        </div>

        <ul className="flex flex-col gap-1.5">
          {bullets.map((line, i) => (
            <li key={i} className="flex gap-2 leading-snug">
              <span className="text-[#FFBE91] font-bold">•</span>
              <span>{line.replace(/^•\s*/, "")}</span>
            </li>
          ))}
        </ul>

        {pagePath && (
          <button
            onClick={() => navigate(pagePath)}
            className="mt-3 inline-flex items-center gap-1 text-xs
                       font-medium text-indigo-600 hover:text-indigo-800
                       transition-colors"
          >
            View details
            <ArrowRight size={12} />
          </button>
        )}
      </div>

      <button
        onClick={onAskAnother}
        className="self-start text-xs text-gray-500 hover:text-gray-800
                   underline transition-colors"
      >
        Ask another
      </button>
    </motion.div>
  );
}
```

---

## File 12 — `AssistantPanel.jsx` (full replacement)

```jsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

import { parseRequest, askQuestion } from "../../api/ai";
import AssistantInput from "./AssistantInput";
import AssistantPreview from "./AssistantPreview";
import AssistantAnswer from "./AssistantAnswer";

const looksLikeQuestion = (text) => {
  const t = text.toLowerCase().trim();
  if (t.endsWith("?")) return true;
  const starters = [
    "how", "what", "which", "when", "where", "who", "why",
    "show", "list", "tell me", "do i", "have i", "did i",
  ];
  return starters.some((w) => t.startsWith(w));
};

export default function AssistantPanel({ isOpen, onClose }) {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState("idle");
  const [text, setText] = useState("");
  const [draft, setDraft] = useState(null);
  const [missing, setMissing] = useState([]);
  const [lowConf, setLowConf] = useState([]);
  const [logId, setLogId] = useState(null);
  const [error, setError] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleParse = async () => {
    setState("parsing");
    setError(null);
    try {
      const result = await parseRequest(text);
      setDraft(result.draft);
      setMissing(result.missing_fields || []);
      setLowConf(result.low_confidence_fields || []);
      setLogId(result.log_id);
      setState("preview");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "Couldn't parse your request. Please try again.";
      setError(typeof msg === "string" ? msg : "Parse failed");
      setState("idle");
    }
  };

  const handleAsk = async () => {
    setState("asking");
    setError(null);
    try {
      const result = await askQuestion(text);
      setAnswerResult({
        question: text,
        answer: result.answer,
        logId: result.log_id,
      });
      setState("answered");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "Couldn't get an answer. Please try again.";
      setError(typeof msg === "string" ? msg : "Ask failed");
      setState("idle");
    }
  };

  const handleSubmit = () => {
    if (looksLikeQuestion(text)) {
      handleAsk();
    } else {
      handleParse();
    }
  };

  const handleReset = () => {
    setState("idle");
    setText("");
    setDraft(null);
    setMissing([]);
    setLowConf([]);
    setLogId(null);
    setError(null);
    setAnswerResult(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(handleReset, 250);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[55] pointer-events-auto"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{
              opacity: [0, 1, 0.92, 1],
              backdropFilter: [
                "blur(0px)", "blur(14px)", "blur(10px)", "blur(12px)",
              ],
              backgroundColor: [
                "rgba(255,252,225,0)",
                "rgba(255,252,225,0.55)",
                "rgba(255,252,225,0.45)",
                "rgba(255,252,225,0.5)",
              ],
            }}
            exit={{
              opacity: 0,
              backdropFilter: "blur(0px)",
              backgroundColor: "rgba(255,252,225,0)",
            }}
            transition={{
              duration: 0.6,
              delay: 0.15,
              times: [0, 0.35, 0.7, 1],
              ease: "easeOut",
            }}
            onClick={handleClose}
            aria-hidden="true"
          />

          <motion.div
            key="panel"
            role="dialog"
            aria-label="AI assistant"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
            transition={{
              duration: reduceMotion ? 0 : 0.22,
              delay: 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="fixed bottom-24 right-6 z-[58] w-[380px]
                       max-w-[calc(100vw-48px)]
                       max-h-[min(640px,calc(100vh-140px))]
                       bg-white rounded-2xl shadow-2xl shadow-gray-900/15
                       flex flex-col overflow-hidden"
          >
            <header className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <motion.span
                animate={reduceMotion ? {} : { rotate: [0, 10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="text-indigo-500"
              >
                <Sparkles size={16} />
              </motion.span>
              <h3 className="flex-1 text-sm font-semibold text-gray-900">
                Ask AI
              </h3>
              <button
                onClick={handleClose}
                aria-label="Close"
                className="p-1 text-gray-400 hover:text-gray-700
                           transition-transform hover:rotate-90 duration-200"
              >
                <X size={18} />
              </button>
            </header>

            <div className="overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {state === "idle" || state === "parsing" || state === "asking" ? (
                <AssistantInput
                  text={text}
                  setText={setText}
                  onParse={handleSubmit}
                  isParsing={state === "parsing" || state === "asking"}
                  error={error}
                  onRetry={handleSubmit}
                />
              ) : state === "answered" && answerResult ? (
                <AssistantAnswer
                  question={answerResult.question}
                  answer={answerResult.answer}
                  onAskAnother={handleReset}
                />
              ) : (
                <AssistantPreview
                  draft={draft}
                  missingFields={missing}
                  lowConfidenceFields={lowConf}
                  logId={logId}
                  onCancel={handleReset}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

## File 13 — `AssistantInput.jsx` (small edits)

Two strings change. Find and replace:

**Placeholder:**
```jsx
placeholder={`Ask "how many bids?" or describe what you want to buy…`}
```

**Helper text:**
```jsx
<p>
  Ask a question about your requests or bids, or describe something
  you want to buy. Be specific — <span className="text-gray-700 font-medium">item</span>,{" "}
  <span className="text-gray-700 font-medium">budget</span>,{" "}
  <span className="text-gray-700 font-medium">pincode</span>.
</p>
```

**Example chips** — add a couple of question examples alongside the create examples:

```jsx
const EXAMPLE_PROMPTS = [
  "how many bids do I have?",
  "which request expires soonest?",
  "used mountain bike under 8000, urgent, 560001",
  "iPhone 13 around 40k",
];
```

---

## Build & test order

1. Run the migration (File 1)
2. Create `ai/providers/` folder + `__init__.py` (File 2)
3. Write `providers/requests.py` (File 3)
4. **REPL test** — verify `fetch(buyer_id)` returns data
5. Write `providers/bids.py` (File 4)
6. **REPL test** — verify bids join correctly
7. Write `providers/registry.py` (File 5)
8. **REPL test** — verify `fetch_context("how many bids", buyer_id)` picks both providers
9. Add `QA_SYSTEM_PROMPT` + `build_qa_prompt` to `prompts.py` (File 6)
10. Write `qa.py` (File 7)
11. **REPL test** — verify `ask_question("how many bids?", buyer_id)` returns bullets
12. Add `AskIn`/`AskOut` to `schema.py` (File 8)
13. Add route to `routes.py` (File 9)
14. **HTTP test** — curl the endpoint
15. Add `askQuestion` to `api/ai.js` (File 10)
16. Write `AssistantAnswer.jsx` (File 11)
17. Replace `AssistantPanel.jsx` (File 12)
18. Edit `AssistantInput.jsx` (File 13)
19. **End-to-end test** from dashboard

---

## REPL test commands

After step 3:
```python
from ai.providers.requests import fetch
import json
print(json.dumps(fetch("<buyer-uuid>"), indent=2, default=str))
```

After step 6:
```python
from ai.providers.bids import fetch
import json
print(json.dumps(fetch("<buyer-uuid>"), indent=2, default=str))
```

After step 8:
```python
from ai.providers.registry import fetch_context
ctx, used = fetch_context("how many bids do I have?", "<buyer-uuid>")
print("used:", used)
import json
print(json.dumps(ctx, indent=2, default=str))
```

After step 11:
```python
from ai.qa import ask_question
result = ask_question("how many bids do I have?", "<buyer-uuid>")
print(result["answer"])
```

Each REPL test should pass before moving to the next file. If any step errors, paste the traceback and I'll fix before you continue.

---

## Total files

| # | File | Action |
|---|------|--------|
| 1 | Supabase | migration |
| 2 | `ai/providers/__init__.py` | new |
| 3 | `ai/providers/requests.py` | new |
| 4 | `ai/providers/bids.py` | new |
| 5 | `ai/providers/registry.py` | new |
| 6 | `ai/prompts.py` | append |
| 7 | `ai/qa.py` | new |
| 8 | `ai/schema.py` | append |
| 9 | `ai/routes.py` | append |
| 10 | `frontend/src/api/ai.js` | append |
| 11 | `AssistantAnswer.jsx` | new |
| 12 | `AssistantPanel.jsx` | replace |
| 13 | `AssistantInput.jsx` | edit strings |

Start with the migration, then work down. Paste the REPL output after step 3 and I'll confirm before you move on.