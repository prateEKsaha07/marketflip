import os
import json

from dotenv import load_dotenv
from google import genai
from google.genai import types
from supabase import create_client

from ai.schema import parsed_request

load_dotenv()

supabase = create_client(
    supabase_url=os.environ["SUPABASE_URL"],
    supabase_key=os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
model = "gemini-3.1-flash-lite"

REQUIRED_FIELDS = ["item_name", "budget_min", "budget_max", "pincode"]
OPTIONAL_FIELDS = ["description", "category_id", "urgency"]
SYSTEM_PROMPT = """You extract structured request data from a buyer's natural-language description.

Rules:
- urgency MUST be exactly one of: "flexible", "soon", "urgent".
    - "urgent" → user says urgent / asap / today / immediately
    - "soon" → user says this week / in a few days
    - "flexible" → no time pressure, or user says no rush
- budget_min and budget_max are integers. If user gives one number, set budget_min = 80% of it, budget_max = 120% of it.
- Never set budget_min to 0 unless the user explicitly says "free".
- pincode MUST be exactly 6 digits.
- description should add detail not already in item_name. If nothing to add, return null.
- If a field is not mentioned, return null. Do NOT guess.
- Mark confidence "low" for inferred fields.
- category_id must be a UUID from the provided category list. If you cannot match, return null."""



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


def parse_request(text: str) -> dict:
    categories = get_categories()

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

    parsed = json.loads(response.text)
    parsed = validate_and_clean(parsed, categories)
    missing, low_conf = compute_missing(parsed)

    return {
        "draft": parsed,
        "missing_fields": missing,
        "low_confidence_fields": low_conf,
        "raw_text": text,
    }


if __name__ == "__main__":
    test_prompts = [
        "need a used mountain bike under 8000, urgent, in 560001",
        "looking for a phone, no rush",
        "urgent need of books under 500 in 400001",
        "want to buy a laptop around 50k",
        "asdfghjkl random text not a real request",
    ]
    for p in test_prompts:
        print(f"\n--- {p}")
        result = parse_request(p)
        print(json.dumps(result, indent=2))