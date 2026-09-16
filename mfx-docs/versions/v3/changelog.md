## Changelog — `mfx-core/ai` (v3.0)

**Date:** 2026-09-14

**Added**
- `schema.py`: `ParsedRequest`, `Confidence` — matches `requests` table constraints
- `service.py`: `parse_request()`, `get_categories()`, `build_prompt()`, `validate_and_clean()`, `compute_missing()`, `SYSTEM_PROMPT`

**Changed**
- Model: `gemini-3.1-flash-lite` via native `google-genai` SDK
- `urgency` enum → `flexible | soon | urgent` (matches DB CHECK)
- `category_id` → validated UUID from real `categories` table
- `budget_min/max` → `int`

**Fixed**
- Category hallucination, `budget_min = 0`, invalid urgency/pincode, gibberish input

**Verified**
- 5 test prompts pass (including gibberish → all null + low confidence)

**Known limits**
- 500 req/day free tier; no retry/timeout guard; categories fetched per call

## Changelog — v3.0

**Date:** 2026-09-15
**Status:** Shipped

---

### Backend

**Added**
- `mfx-core/ai/` module: `schema.py`, `service.py`, `routes.py`
- `POST /ai/parse-request` — natural language → structured draft
- `PATCH /ai/parse-request/{log_id}` — record buyer action
- `GET /ai/categories` — category list for preview dropdown
- `ai_parse_logs` table — prompt, draft, tokens, latency, error, buyer_action, edited_fields, data_source
- `parse_request`, `get_categories`, `build_prompt`, `validate_and_clean`, `compute_missing`, `insert_ai_log`, `update_ai_log_action`

**Changed**
- Provider: Gemini 3.1 Flash-Lite (Groq account restricted)
- `urgency` enum: `flexible | soon | urgent`
- `category_id`: validated UUID from real categories table
- `budget_min/max`: integers

**Verified**
- 5 extraction test prompts (incl. gibberish → all null + low confidence)
- 7 HTTP cases: 200 / 400 / 403 / 200 / 200 / 404 / 422

---

### Frontend

**Added**
- `src/api/ai.js` — `parseRequest`, `logAction`, `getCategories`, `uploadImage`
- `src/components/ai-assistant/` — `AIAssistant`, `FloatingButton`, `AssistantPanel`, `AssistantInput`, `AssistantPreview`, `index.js`
- Mounted `<AIAssistant />` on `/buyer/dashboard`
- Sonner `<Toaster />` at App level
- Image upload in preview card (Cloudinary via `POST /upload/single`)

**Changed**
- `FloatingButton`: GPU-friendly wobble, lighter palette, hover scale reversal, left-side tooltip with per-letter reveal, monospace typography
- `AssistantPanel`: backdrop blur with delayed pulse, Esc-to-close, scroll lock, hidden scrollbars
- `AssistantPreview`: sends `image_urls: [url]` to match detail page render
- Global: hidden scrollbars in `index.css`

---

### End-to-end flow

```
Buyer types → POST /ai/parse-request → Gemini extract
    → validate against categories → log → preview card
    → buyer edits + uploads image → PATCH action logged
    → POST /requests → redirect to /buyer/request/{id}
```

---

### Known limits (v3.1 backlog)

- 500 req/day free tier cap
- No retry/timeout on Gemini call
- No rate limiting on endpoint
- Categories fetched per parse (no cache)
- No eval set (spec calls for 20–30 prompts)
- Conversational follow-up questions not built (slot-filling design deferred)
- No multimodal input (image → AI understanding)

---

### Deviations from original spec

- **Provider:** Gemini 3.1 Flash-Lite (spec said Claude/OpenAI) — Groq restricted, Cerebras has no permanent free tier
- **Category handling:** Option B — frontend maps UUID → name before POST (backend `RequestCreate` unchanged)
- **Exit criteria:** manual verification, not ">92% accuracy / <1.5s" (spec adjustment already agreed)

## `mfx-core/docs/CHANGELOG.md`

```markdown
# Changelog — MarketFlip AI Assistant

---

## [v3.1] — 2026-09-16

### Added

**Backend**
- `ai/qa.py` — Q&A pipeline (`ask_question`, `log_ask`, `build_qa_prompt`)
- `ai/prompts.py` — `QA_SYSTEM_PROMPT`, `build_qa_prompt()` (moved `SYSTEM_PROMPT` here from `service.py`)
- `ai/providers/` — new package
  - `registry.py` — `pick_providers()`, `fetch_context()`
  - `requests.py` — buyer's own requests provider
  - `bids.py` — bids + shop lookup provider
- `POST /ai/ask` — Q&A endpoint (buyer only)
- `ai_ask_logs` table — question, answer, providers_used, tokens, latency, data_source
- Standalone `__main__` tests in each provider and `qa.py`

**Frontend**
- `AssistantAnswer.jsx` — bullets + page link renderer
- `askQuestion()` in `src/api/ai.js`
- Intent detection in `AssistantPanel.jsx` (keyword prefix or trailing `?`)
- New `answered` state in the panel state machine
- Mixed example chips (2 Q&A + 2 create)
- Updated placeholder and helper text

### Changed

- `ai/schema.py` — added `AskIn`, `AskOut`
- `ai/routes.py` — added `POST /ai/ask`
- `ai/service.py` — imports `SYSTEM_PROMPT` from `prompts.py`
- `AssistantInput.jsx` — button labels "Ask" / "Thinking…" (covers both flows)
- `AssistantPanel.jsx` — single input routes to Q&A or create based on intent

### Fixed

- `providers/registry.py` — fallback path no longer duplicates `requests` in `providers_used`
- `providers/requests.py`, `providers/bids.py` — corrected env var name (`SUPABASE_SERVICE_ROLE_KEY`)

### Verified

- Provider tests: `requests.py`, `bids.py` return correct data standalone
- Registry: keyword routing + fallback both work
- Q&A edge cases: bids count, expiry, most expensive, list, out-of-scope
- Format: max 3 bullets, `→ page` line, no UUIDs, ₹ rendering
- End-to-end via Postman before frontend
- Frontend: answer card renders, "View details" navigates, "Ask another" resets
- Create flow still works (regression check)

### Known limits

- No rate limiting on `/ai/ask`
- No retry on Gemini failure
- No conversation memory
- Shop-side not built

---

## [v3.0] — 2026-09-15

### Added

**Backend**
- `mfx-core/ai/` module — `schema.py`, `service.py`, `routes.py`, `prompts.py`
- `POST /ai/parse-request`, `PATCH /ai/parse-request/{log_id}`, `GET /ai/categories`
- `ai_parse_logs` table
- Service functions: `parse_request`, `get_categories`, `build_prompt`, `validate_and_clean`, `compute_missing`, `insert_ai_log`, `update_ai_log_action`

**Frontend**
- `src/api/ai.js` — `parseRequest`, `logAction`, `getCategories`, `uploadImage`
- `src/components/ai-assistant/` — `AIAssistant`, `FloatingButton`, `AssistantPanel`, `AssistantInput`, `AssistantPreview`, `index.js`
- Mounted on `/buyer/dashboard`
- Sonner `<Toaster />` at app level
- Image upload in preview card (Cloudinary via `POST /upload/single`)

### Changed

- LLM provider: Gemini 3.1 Flash-Lite (Groq account restricted)
- `urgency` enum: `flexible | soon | urgent` (matches DB CHECK)
- `category_id`: validated UUID from real categories table
- `budget_min/max`: integers
- `FloatingButton`: GPU-friendly wobble, lighter palette, hover scale reversal, left-side tooltip with per-letter reveal, monospace typography
- `AssistantPanel`: backdrop blur with delayed pulse, Esc-to-close, scroll lock, hidden scrollbars
- `AssistantPreview`: sends `image_urls: [url]` to match detail page render

### Fixed

- Hover scale not reversing on mouse-leave
- Image not displaying on request detail page (field mismatch)
- Water-drop stutter in orb animation
- Tooltip misalignment during orb wobble
- Scrollbars visible on dashboard and panel

### Verified

- 5 extraction test prompts (incl. gibberish → all null + low confidence)
- 7 HTTP test cases: 200 / 400 / 403 / 200 / 200 / 404 / 422
- Full flow: parse → preview → edit → image upload → confirm → redirect
- `buyer_action: 'edited'` + `edited_fields` logged to `ai_parse_logs`
- Image uploaded to Cloudinary `marketflip/requests/`, `image_urls` populated

### Known limits

- 500 req/day free tier cap
- No retry/timeout on Gemini call
- No rate limiting on endpoint
- Categories fetched per parse (no cache)
```
---

## [v3.2] — 2026-09-16

### Added

**Backend**
- `ai/providers/shop_auctions.py` — shop's auctions provider
  with bid aggregation, outcome classification, and leader derivation
- `QA_SHOP_SYSTEM_PROMPT` in `ai/prompts.py`
- `role` column on `ai_ask_logs`

**Frontend**
- `<AIAssistant />` mounted on `src/pages/shop/Dashboard.jsx`
- Role-aware example chips and placeholder in `AssistantInput.jsx`
- Role-aware page resolver in `AssistantAnswer.jsx`

### Changed

- `ai/providers/registry.py` — `shop_auctions_provider` registered
- `ai/qa.py` — `ask_question(question, user_id, role)` dispatches on role;
  `log_ask` records role
- `POST /ai/ask` — accepts both buyers and shop owners
- `AssistantInput` and `AssistantAnswer` read role from `localStorage`

### Fixed

- `leading_bidder` in shop auctions — derived from actual highest bid,
  not the stale `current_highest_bidder` column
- `second_highest_bid` — guaranteed ≤ `current_highest_bid` by
  computing both from the same sorted bids list

### Verified

- Standalone provider test: `shop_auctions.fetch(shop_id)` returns
  correct aggregation for 4 seed auctions
- Registry: shop question routes to `shop_auctions` only; buyer
  question routes to buyer providers only
- Q&A end-to-end: 5 shop prompts tested (active, sold, expired,
  count, out-of-scope)
- Buyer regression: unchanged behavior for all buyer questions
- Frontend: chips differ by role, "View details" navigates to the
  correct shop page

### Known limits

- Same as v3.1: no rate limiting, no retry, no conversation memory
- Seed auctions in the DB still have stale `status` values from
  before the close-auctions logic was finalized