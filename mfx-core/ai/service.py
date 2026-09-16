import os
import json
import logging
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types
from supabase import create_client

from ai.schema import parsed_request

load_dotenv()

logger = logging.getLogger(__name__)
logging.getLogger("google_genai.models").setLevel(logging.ERROR)

supabase = create_client(
    supabase_url=os.environ["SUPABASE_URL"],
    supabase_key=os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
model = "gemini-3.1-flash-lite"

REQUIRED_FIELDS = ["item_name", "budget_min", "budget_max", "pincode"]
OPTIONAL_FIELDS = ["description", "category_id", "urgency"]
from ai.prompts import SYSTEM_PROMPT
# SYSTEM_PROMPT = """You extract structured request data from a buyer's natural-language description.

# Rules:
# - urgency MUST be exactly one of: "flexible", "soon", "urgent".
#     - "urgent" → user says urgent / asap / today / immediately
#     - "soon" → user says this week / in a few days
#     - "flexible" → no time pressure, or user says no rush
# - budget_min and budget_max are integers. If user gives one number, set budget_min = 80% of it, budget_max = 120% of it.
# - Never set budget_min to 0 unless the user explicitly says "free".
# - pincode MUST be exactly 6 digits.
# - description should add detail not already in item_name. If nothing to add, return null.
# - If a field is not mentioned, return null. Do NOT guess.
# - Mark confidence "low" for inferred fields.
# - category_id must be a UUID from the provided category list. If you cannot match, return null."""

# Helpers
def validate_and_clean(parsed: dict, categories: list[dict]) -> dict:
    pin = parsed.get("pincode")
    if pin and (not str(pin).isdigit() or len(str(pin)) != 6):
        parsed["pincode"] = None

    if parsed.get("urgency") not in ("flexible", "soon", "urgent"):
        parsed["urgency"] = None

    valid_ids = {c["id"] for c in categories}
    if parsed.get("category_id") not in valid_ids:
        parsed["category_id"] = None

    for f in ("budget_min", "budget_max"):
        if parsed.get(f) is not None:
            try:
                parsed[f] = int(parsed[f])
            except (ValueError, TypeError):
                parsed[f] = None

    if parsed.get("item_name"):
        parsed["item_name"] = parsed["item_name"].strip()
    if parsed.get("description"):
        parsed["description"] = parsed["description"].strip()

    return parsed


def compute_missing(parsed: dict) -> tuple[list[str], list[str]]:
    missing = [
        f for f in REQUIRED_FIELDS + OPTIONAL_FIELDS
        if parsed.get(f) in (None, "")
    ]
    low_conf = [
        k for k, v in parsed.get("confidence", {}).items()
        if v == "low"
    ]
    return missing, low_conf


def get_categories() -> list[dict]:
    response = (
        supabase.table("categories")
        .select("id, name")
        .order("name")
        .execute()
    )
    return response.data


def build_prompt(text: str, cats: list[dict]) -> str:
    categories = "\n".join(f"  {c['id']}: {c['name']}" for c in cats)
    return f"""Available categories:
{categories}

Buyer's description:
\"\"\"{text}\"\"\"

Extract the structured request. Only pick category_id from the list above."""



# Logging
def insert_ai_log(
    buyer_id: str,
    raw_text: str,
    draft: dict | None,
    missing_fields: list[str],
    low_confidence_fields: list[str],
    model: str,
    tokens_in: int | None,
    tokens_out: int | None,
    latency_ms: int | None,
    error: str | None = None,
    data_source: str = "live",
) -> str:
    """Insert an ai_parse_logs row. Returns the log_id."""
    payload = {
        "buyer_id": buyer_id,
        "raw_text": raw_text,
        "draft": draft,
        "missing_fields": missing_fields,
        "low_confidence_fields": low_confidence_fields,
        "model": model,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "latency_ms": latency_ms,
        "error": error,
        "data_source": data_source,
    }
    response = supabase.table("ai_parse_logs").insert(payload).execute()
    return response.data[0]["id"]


def update_ai_log_action(
    log_id: str,
    action: str,
    edited: dict | None = None,
) -> bool:
    """Update the buyer_action on an existing log. Returns True if found."""
    try:
        results = (
            supabase.table("ai_parse_logs")
            .update({"buyer_action": action, "edited_fields": edited})
            .eq("id", log_id)
            .execute()
        )
    except Exception as e:
        logger.error(f"update_ai_log_action failed: {e}")
        return False

    if not results.data:
        logger.warning(f"ai_parse_logs row not found: log_id={log_id}")
        return False

    return True


# Main
def parse_request(
    text: str,
    buyer_id: str,
    data_source: str = "live",
) -> dict:
    categories = get_categories()
    start = time.perf_counter()

    try:
        response = client.models.generate_content(
            model=model,
            contents=build_prompt(text, categories),
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                response_schema=parsed_request,
                temperature=0.0,
            ),
        )
    except Exception as e:
        latency = int((time.perf_counter() - start) * 1000)
        insert_ai_log(
            buyer_id=buyer_id,
            raw_text=text,
            draft=None,
            missing_fields=[],
            low_confidence_fields=[],
            model=model,
            tokens_in=None,
            tokens_out=None,
            latency_ms=latency,
            error=str(e),
            data_source=data_source,
        )
        raise RuntimeError(f"LLM call failed: {e}") from e

    latency = int((time.perf_counter() - start) * 1000)

    parsed = json.loads(response.text)
    parsed = validate_and_clean(parsed, categories)
    missing, low_conf = compute_missing(parsed)

    usage = response.usage_metadata
    log_id = insert_ai_log(
        buyer_id=buyer_id,
        raw_text=text,
        draft=parsed,
        missing_fields=missing,
        low_confidence_fields=low_conf,
        model=model,
        tokens_in=usage.prompt_token_count if usage else None,
        tokens_out=usage.candidates_token_count if usage else None,
        latency_ms=latency,
        error=None,
        data_source=data_source,
    )

    return {
        "draft": parsed,
        "missing_fields": missing,
        "low_confidence_fields": low_conf,
        "raw_text": text,
        "log_id": log_id,
    }


# Local test
if __name__ == "__main__":
    TEST_BUYER_ID = "cdedd5f6-2726-44a8-9337-66da346dd628"

    test_prompts = [
        "need a used mountain bike under 8000, urgent, in 560001",
        "looking for a phone, no rush",
        "urgent need of books under 500 in 400001",
        "want to buy a laptop around 50k",
        "asdfghjkl random text not a real request",
    ]

    for p in test_prompts:
        print(f"\n--- {p}")
        result = parse_request(
            text=p,
            buyer_id=TEST_BUYER_ID,
            data_source="seed",
        )
        print(json.dumps(result, indent=2))