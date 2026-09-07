# MarketFlip v3.0 — AI-Powered Multimodal Engine
### Adjusted for MarketFlip's actual stack, architecture, and solo-dev/free-tier constraints

> **Source:** adapted from the original "Master Release Plan: AI-Powered Multimodal Engine" draft. This version keeps the same six-milestone shape (v3.0–v3.5) but rewrites tech choices, exit criteria, and scope to match what MarketFlip actually is and what's realistic to build and evaluate solo. See "Adjustments from original spec" under each version for what changed and why.

---

## Ground Rules Carried Forward

- **Architecture rule (unchanged from the master roadmap):** the AI layer never writes marketplace records directly. Every AI feature parses/retrieves/suggests, then calls MarketFlip's existing REST API (`POST /requests`, `POST /auctions/{id}/bids`, etc.) to actually act. This keeps validation, RLS, and business logic in one place instead of duplicated inside AI code.
- **Data hygiene rule (unchanged from Phase 7b):** anything that indexes, embeds, or trains on marketplace data must respect the existing `data_source` (`'seed'` vs `'live'`) tagging — don't let synthetic seed data pollute a real semantic search index or a real agent's world-model, and don't let it silently vanish from evaluation either. Filter deliberately.
- **Cost rule (per the free-tier reality check already logged in the dev companion):** v3.x is the first phase in the whole roadmap that requires real, ongoing paid infrastructure (LLM API calls at minimum). Every version below flags its actual cost driver so you can budget before building, not after.
- **Scope boundary with v4.x:** v3.x AI features are **buyer-facing only** (per the master roadmap's own split — v4.4 "AI Shop Assistant" is where shop-side agent tooling lives). Don't let v3.4's agent framework grow shop-side tools; that's v4.4's job, reusing the same framework.

---

## Phase Summary

| Version | Milestone Name | Focus Area | Primary Technical Output |
|---|---|---|---|
| v3.0 | AI Request Assistant | Text parsing & intent | LLM structured-output pipeline → existing Request API |
| v3.1 | Voice Interface | Audio input | STT integration feeding the v3.0 pipeline (no TTS in scope) |
| v3.2 | Image Understanding | Computer vision | Vision-model tagging, reusing existing Cloudinary upload flow |
| v3.3 | AI Search Engine | Semantic retrieval | pgvector (inside existing Supabase Postgres) + keyword hybrid search |
| v3.4 | AI Agent Framework | Buyer-side autonomous workflows | Tool-calling agent restricted to buyer-facing, non-monetary actions |
| v3.5 | AI Engine Stabilization | Cost control & hardening | Prompt caching, model routing, fallback to non-AI paths |

---

## v3.0 — AI Request Assistant

### Objective
Buyer types a plain-language description of what they want; it becomes a structured request via the existing `POST /requests` endpoint — the same one `PostRequest.jsx` already calls.

### Core Deliverables & Tasks
- **Intent extraction pipeline:** call an LLM (Claude or OpenAI — pick one to start, don't build a multi-provider abstraction for a v1) with a structured-output/function-calling schema mapping directly onto your **existing** `requests` fields: `item_name`, `description`, `budget_min`, `budget_max`, `category_id` (matches against the real `categories` table from Phase 1 — don't let the LLM invent free-text categories), `pincode`, `urgency`.
- **New endpoint:** `POST /ai/parse-request` in a new `ai/` backend module (same file structure pattern as every other module: `routes.py`, `schemas.py`, `service.py`). Returns the structured draft; does **not** create the request itself.
- **Missing-field handling:** if budget or category can't be confidently extracted, the response includes which fields are missing/low-confidence rather than guessing — the frontend prompts the buyer to fill those in manually before submission.
- **UI:** a natural-language input box on `PostRequest.jsx` (additive — the existing manual form stays as-is and remains the fallback/default path), showing a preview card of the extracted fields before the buyer confirms and the normal `POST /requests` call fires.
- **Logging:** log every AI parse attempt (prompt, extracted output, whether the buyer edited/accepted it) — this is cheap now and becomes real training/eval data later, and it's also just good cost-tracking since every call costs money.

### Adjustments from original spec
- Dropped "self-hosted models" as an option for v1 — running your own inference infra contradicts the free-tier/solo-dev reality; use a hosted API.
- Original schema mentioned `Attributes`/`Categories` as if generic — mapped explicitly onto your actual `categories` table (with its `field_schema` jsonb from Phase 1) instead of inventing a parallel attribute system.
- **Exit criteria softened:** the original's ">92% parsing accuracy, <1.5s end-to-end" reads like a benchmark from a funded team with a labeled eval set and load-testing infra. For a solo build: **exit criteria is "the assistant correctly extracts item/budget/category on your own manual test set of ~20-30 realistic prompts, and the buyer can always fall back to the manual form."** Revisit hard numeric targets once you have real usage data to measure against — a number with no baseline to compare it to isn't a real target, it's decoration.
- **Cost flag:** this is the version where you start paying per request for LLM calls. Budget for it before shipping, not after — even light usage adds up if every request-creation attempt calls the API.

---

## v3.1 — Voice Interface

### Objective
Let a buyer speak their request instead of typing it, feeding straight into the v3.0 pipeline.

### Core Deliverables & Tasks
- **Speech-to-text only** — record audio in the browser (mic permission, basic recording UI), send to an STT API, get back text, feed that text into the existing v3.0 `/ai/parse-request` pipeline unchanged.
- **UI:** a mic button on the same natural-language input box from v3.0, with a simple recording-state indicator (not a full waveform visualizer — that's polish, not function).
- **PWA note:** since MarketFlip is already a PWA, microphone access needs to work correctly in the installed/standalone context on both Android Chrome and iOS Safari — test both explicitly, they handle mic permissions differently.

### Adjustments from original spec
- **Dropped text-to-speech entirely.** The original scoped TTS (voice responses/confirmations) — there's no clear product need for MarketFlip to *talk back* to a buyer; the existing preview-card confirmation UI from v3.0 already does that job visually. Cutting TTS removes a whole integration and cost surface for no lost functionality.
- **Dropped custom noise-suppression/audio-chunking algorithms** — build on whatever your chosen STT provider's SDK already handles (most handle this server-side now); writing custom audio DSP is disproportionate effort for a solo project when the goal is "reliable dictation," not "voice product."
- **Exit criteria softened:** dropped the specific WER%/latency numbers for the same reason as v3.0 — no eval infrastructure to measure them rigorously yet. Real target: "voice input reliably produces the same quality result as typing the same request, tested against your own set of sample requests spoken aloud."
- **Cost flag:** second real per-request cost — STT APIs are usually billed per minute of audio.

---

## v3.2 — Image Understanding

### Objective
Buyer attaches a photo when posting a request; the AI extracts what it can (product type, brand, visible specs) to help pre-fill the request — this is about **speeding up request creation**, not building a reverse product-search engine.

### Core Deliverables & Tasks
- **Reuse the existing upload path** — MarketFlip already has Cloudinary multi-image upload wired into `PostRequest.jsx` from Phase 3. Don't build a parallel image pipeline; hook vision extraction onto the image(s) the buyer is already uploading.
- **Vision model call:** send the uploaded image URL (already hosted on Cloudinary, no need to re-handle raw bytes) to a multimodal model (Claude or GPT-4o vision) asking for the same structured fields as v3.0 — product type/category, brand, visible condition notes.
- **Merge with text:** if the buyer also typed something (or used voice), combine both signals — image-extracted fields are suggestions the buyer confirms in the same preview-card flow from v3.0, not an auto-submit.
- **Skip visual deduplication entirely for v3.2** — see adjustment below.

### Adjustments from original spec
- **Cut visual deduplication (image embeddings vs. existing platform inventory) from this version.** MarketFlip is a reverse marketplace — buyers post *requests* (what they want), not *listings* of items they own. There's no "existing inventory" of buyer-side items to deduplicate against in the way this feature assumes; that concept fits a traditional peer-to-peer resale platform, not MarketFlip's model. If a real need for this emerges later (e.g. detecting duplicate/spam requests), it belongs with the `reports`/moderation system, not here.
- **Cut custom fine-tuned CLIP/YOLO models** — training and hosting a custom vision model is a genuinely large ML-engineering undertaking, disproportionate to what v3.2 needs. A hosted multimodal API call does this job for a fraction of the effort.
- **Exit criteria softened** for the same reasons as above — real target: "given a clear photo of a common electronics item, the assistant correctly identifies product type and brand most of the time," verified against your own sample photos, not a formal accuracy benchmark.
- **Cost flag:** third per-request cost — vision API calls are typically priced per image, often more than a text call.

---

## v3.3 — AI Search Engine

### Objective
Replace/augment the current pincode+category+status filtering on `BrowseRequests.jsx`/`BrowseAuctions.jsx` with semantic search — "find me something like X" instead of only exact filters.

### Core Deliverables & Tasks
- **Use pgvector inside your existing Supabase Postgres database** — not a separate vector database service. Supabase supports the `pgvector` extension natively; this means zero new infrastructure, zero new bill, and it lives right next to the `requests`/`auctions` tables it's indexing.
- **Embedding pipeline:** on request/auction creation (or as a backfill job for existing rows), generate an embedding from the item name + description + category, store it in a new `embedding vector` column. Respect `data_source` — only index/query against `'live'` rows for real search results; keep `'seed'` rows out of production search results (they can stay in a separate eval/test pass if useful).
- **Hybrid retrieval:** combine a pgvector similarity search with your existing SQL filters (pincode, category, status, price range) — semantic search narrows by *meaning*, your existing filters narrow by *hard constraints*. This is simpler than the original's BM25+RRF fusion approach and reuses infrastructure you already have.
- **Search bar:** add a natural-language search input to the browse pages, alongside (not replacing) the existing filter/sort UI from Phase 6.

### Adjustments from original spec
- **Swapped Pinecone/Qdrant/Milvus for pgvector in Supabase.** Those are all separate paid services (or self-hosted infra you'd need to run) — pgvector gets you 90% of the value with zero new infrastructure, which matters enormously for a free-tier solo project. Only reconsider a dedicated vector DB if pgvector's performance genuinely becomes a bottleneck at real scale — that's a "problem you'll be lucky to have," not a day-one requirement.
- **Dropped the separate LLM query-rewriting middleware layer** for v1 — an extra LLM call on every search adds cost and latency for a benefit (synonym expansion) that a good embedding model often handles reasonably well on its own. Revisit only if search quality is genuinely disappointing without it.
- **Exit criteria softened** — dropped nDCG@10/latency-under-200ms targets (no eval dataset or load-testing setup to measure them credibly). Real target: "searching in plain language returns noticeably more relevant results than the current exact-match filters, on your own spot-checks."
- **Cost note:** embeddings are typically much cheaper than generation/vision calls, and pgvector itself is free (it's just Postgres) — this version is the cheapest of the AI phases to run.

---

## v3.4 — AI Agent Framework

### Objective
A buyer-facing assistant that can chain a few read-oriented actions together in one conversation — e.g. "find gaming laptops under 80k near me and tell me which shop has the best reliability score" — using MarketFlip's own data via the ML/reliability features already built in v2.

### Core Deliverables & Tasks
- **Tool set, buyer-side only, mostly read-only to start:**
  - `search_requests` / `search_auctions` (built on v3.3's search)
  - `get_bids` (existing `GET /requests/{id}/bids`)
  - `compare_bids` (existing bid-ranking ML from Phase 9 — `bid_ranking.py` already does price + reliability weighting; the agent calls it, doesn't reinvent it)
  - `get_shop_reliability` (existing `GET /reliability/shop/{id}`)
  - `get_recommendations` (existing Apriori recommendations from Phase 9)
  - `create_request` — the **one** write action in scope, and it routes through v3.0's existing confirm-before-submit flow, never auto-submits
- **State machine, not a heavyweight framework:** for a solo project, a simple explicit state machine (or a lightweight tool-calling loop using your chosen LLM provider's native function-calling) is more maintainable than adopting LangGraph/AutoGen as new dependencies to learn and keep updated. Only reach for a framework if the hand-rolled version genuinely becomes unmanageable.
- **Guardrails:**
  - No transaction-completing actions (select a bid, place a bid, confirm delivery, etc.) — those all stay manual, at least for this version
  - `create_request` always shows the confirm-before-submit preview, same as typing/voice/image input
  - Basic prompt-injection resistance: the agent's tool calls are validated server-side against the actual authenticated user's permissions (same auth-layer pattern as the rest of the backend) — the LLM's output is never trusted blindly to determine *whose* data it can touch

### Adjustments from original spec
- **Cut all shop/seller-facing tools** (`NotifySeller`, `DraftOffer`, monitoring seller inventory) — these belong to v4.4 (AI Shop Assistant) per the master roadmap's own phase split, not v3.4. Keeping v3.4 buyer-only avoids scope bleed into a phase that hasn't been reached yet.
- **Cut `ScheduleFollowUp`** and any autonomous/proactive monitoring behavior (agent watching for new listings and reaching out unprompted) — this is a meaningfully larger and riskier undertaking (background jobs, deciding when to interrupt a user, notification-spam risk) than a request-time conversational agent. If wanted later, it's really a v9.x-style background-job/event-driven feature, not something to bolt onto a first agent version.
- **Swapped LangGraph/AutoGen for a hand-rolled state machine or native function-calling** — for the reasons above; these are real, well-regarded frameworks, but they're an added dependency and learning curve that isn't necessary for the buyer-only, mostly-read-only tool set scoped here.
- **Exit criteria softened** — "zero state loop deadlocks" and "human-in-the-loop only at final checkpoints" are good qualitative goals, kept as-is; dropped nothing here since these were already reasonably scoped, just noting there's no formal multi-step-task benchmark to test against — verify manually against a handful of realistic multi-step queries.
- **Cost flag:** the most expensive version so far — multi-step agent conversations mean multiple LLM calls per user interaction, not one. Watch usage closely once this ships.

---

## v3.5 — AI Engine Stabilization

### Objective
Before starting v4.0, make sure the AI layer built across v3.0–v3.4 is affordable and doesn't silently break the rest of the app when it fails.

### Core Deliverables & Tasks
- **Prompt/response caching:** cache repeated or near-identical requests (e.g. common search queries) — a simple cache table in Supabase or an in-memory cache in the backend is enough; no need for a dedicated Redis service yet (that's a v9.x concern) unless caching needs genuinely outgrow a simple table-based approach.
- **Model routing:** route simple, well-defined tasks (structured extraction in v3.0/v3.2) to a smaller/cheaper model tier; reserve the larger model for the v3.4 agent's multi-step reasoning, where it actually matters.
- **Token/cost tracking:** log token usage per request (you're already logging AI parse attempts from v3.0 — extend that logging to include cost) so you have real numbers instead of guessing at your monthly AI spend.
- **Graceful fallback everywhere:** every AI feature must degrade cleanly to its non-AI equivalent if the API call fails or times out — v3.0/v3.1/v3.2 fall back to the plain manual form (which never went away), v3.3 falls back to the existing exact-match filters, v3.4's agent just returns a clear "couldn't complete that, try again" rather than a broken UI state.
- **Basic monitoring:** track latency and error rate per AI endpoint — doesn't need a dedicated observability product (LangSmith/Phoenix/Helicone) for a solo project; structured logging you can query is enough at this scale, revisit dedicated tooling only if the manual approach stops being enough.

### Adjustments from original spec
- **Dropped dedicated AI observability platforms (LangSmith/Phoenix/Helicone)** and formal stress-testing infrastructure — these are valuable at team/production scale but are new paid tools and new integration work for a solo project; your existing logging patterns (already established throughout the backend) extended to cover AI calls get you most of the practical benefit for free.
- **Exit criteria softened:** dropped "30-40% cost reduction" and "99.9% success rate under peak synthetic load" — no baseline cost to measure a 30-40% reduction against yet, and no synthetic load-testing infrastructure. Real target: "you know roughly what the AI features cost per month, every AI feature has a working fallback path, and nothing in v3.0-v3.4 can take down a page if the AI call fails."
- This version has no new *cost* of its own — it's about controlling the cost the other five versions already introduced.

---

## Summary: What Changed and Why

The original plan reads like a roadmap for a funded team with dedicated infra, eval datasets, and observability tooling already in place. The adjustments throughout this version consistently do three things:

1. **Swap "new paid service" for "thing you already have"** wherever possible — pgvector instead of a vector DB service, hand-rolled state machine instead of an agent framework, existing logging instead of a new observability product, a cache table instead of Redis.
2. **Cut features that don't map onto MarketFlip's actual model** — visual deduplication assumed a peer-to-peer listing model MarketFlip doesn't have; shop-side agent tools belong to v4.4, not v3.4; proactive/autonomous monitoring is a different, later kind of feature (background jobs) than a request-time assistant.
3. **Replace unmeasurable benchmark numbers with honest, checkable goals** — every exit criteria in the original assumed an eval dataset and load-testing setup that doesn't exist yet. The adjusted versions ask "does this actually work well on realistic examples, and does it fail gracefully" instead of a percentage with no baseline.

Follow the same versioning rhythm as the rest of the roadmap: v3.5 (stabilization) is a real, necessary version here, not optional padding — the cost and reliability risk from v3.0–v3.4 is real and compounds if left unmanaged going into v4.0.