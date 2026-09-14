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

**Not done**
- `routes.py`, logging to `ai_parse_logs`, PATCH endpoint, frontend preview card, eval set

**Known limits**
- 500 req/day free tier; no retry/timeout guard; categories fetched per call