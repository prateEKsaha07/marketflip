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

**Date:** 2026-09-15
**Changed**
feat(ai): AI request assistant — backend complete

- POST /ai/parse-request: NL text → structured draft (Gemini 3.1 Flash-Lite)
- PATCH /ai/parse-request/{log_id}: record buyer action (accepted/edited/abandoned)
- ai_parse_logs table: prompt, draft, tokens, latency, error, buyer_action
- Category IDs validated against real categories table
- data_source column separates test ('seed') from real traffic ('live')
- Missing/low-confidence fields returned for frontend preview

Verified (7/7):
  200 happy path
  400 empty text
  403 non-buyer
  200 patch accepted
  200 patch edited
  404 missing log
  422 invalid action