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
