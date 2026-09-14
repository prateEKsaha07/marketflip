import os
import json

from dotenv import load_dotenv
from google import genai
from google.genai import types

from ai.schema import parsed_request

load_dotenv()
client = genai.Client(
    api_key=os.environ["GEMINI_API_KEY"]
)
model = "gemini-3.1-flash-lite"


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


def parse_request(text: str) -> dict:
    response = client.models.generate_content(
        model=model,
        contents=text,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=parsed_request,
            temperature=0.0,
        ),
    )
    return json.loads(response.text)


if __name__ == "__main__":
    result = parse_request(
        "need a used mountain bike under 8000, urgent, in 560001"
    )
    print(json.dumps(result, indent=2))