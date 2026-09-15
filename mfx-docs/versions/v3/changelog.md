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
feat(ai): persist every parse attempt to ai_parse_logs

- insert_ai_log() writes raw_text, draft, tokens, latency, error
- parse_request() logs both success and failure paths
- data_source column separates seed (tests) from live (traffic)
- log_id returned in response for buyer-action tracking