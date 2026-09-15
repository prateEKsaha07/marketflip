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