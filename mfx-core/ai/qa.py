"""
Q&A pipeline — asks Gemini a question with the buyer's data as context.
"""

import time
import os
import logging
from dotenv import load_dotenv
from google import genai
from google.genai import types
from supabase import create_client

from .prompts import QA_SYSTEM_PROMPT, build_qa_prompt
from .providers.registry import fetch_context

load_dotenv()

logger = logging.getLogger(__name__)

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

MODEL = "gemini-3.1-flash-lite"


def log_ask(
    buyer_id: str,
    question: str,
    answer: str | None,
    providers_used: list[str],
    latency_ms: int,
    data_source: str = "live",
    error: str | None = None,
    tokens_in: int | None = None,
    tokens_out: int | None = None,
) -> str:
    payload = {
        "buyer_id": buyer_id,
        "question": question,
        "answer": answer,
        "providers_used": providers_used,
        "error": error,
        "latency_ms": latency_ms,
        "data_source": data_source,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
    }
    response = supabase.table("ai_ask_logs").insert(payload).execute()
    return response.data[0]["id"]


def ask_question(question: str, buyer_id: str, data_source: str = "live") -> dict:
    start = time.perf_counter()

    context, providers_used = fetch_context(question, buyer_id, role="buyer")

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=build_qa_prompt(question, context),
            config=types.GenerateContentConfig(
                system_instruction=QA_SYSTEM_PROMPT,
                temperature=0.2,
                max_output_tokens=200,
            ),
        )
    except Exception as e:
        latency_ms = int((time.perf_counter() - start) * 1000)
        log_ask(
            buyer_id=buyer_id,
            question=question,
            answer=None,
            providers_used=providers_used,
            latency_ms=latency_ms,
            data_source=data_source,
            error=str(e),
        )
        raise RuntimeError(f"Q&A failed: {e}") from e

    latency_ms = int((time.perf_counter() - start) * 1000)
    answer = response.text.strip()

    usage = response.usage_metadata
    log_id = log_ask(
        buyer_id=buyer_id,
        question=question,
        answer=answer,
        providers_used=providers_used,
        latency_ms=latency_ms,
        data_source=data_source,
        tokens_in=usage.prompt_token_count if usage else None,
        tokens_out=usage.candidates_token_count if usage else None,
    )

    return {
        "answer": answer,
        "raw_question": question,
        "providers_used": providers_used,
        "log_id": log_id,
    }


# -------------------------------------------------
# standalone test
#   python -m ai.qa <buyer_uuid> "<question>"
#   or set TEST_BUYER_ID / TEST_QUESTION below

TEST_BUYER_ID = ""
TEST_QUESTION = "how many bids do I have?"

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 2:
        buyer_id, question = sys.argv[1], sys.argv[2]
    else:
        buyer_id, question = TEST_BUYER_ID, TEST_QUESTION

    if not buyer_id:
        print('Usage: python -m ai.qa <buyer_uuid> "<question>"')
        sys.exit(1)

    print(f"Question: {question}\n")
    result = ask_question(question, buyer_id)
    print("Answer:")
    print(result["answer"])
    print(f"\nProviders used: {result['providers_used']}")
    print(f"Log ID: {result['log_id']}")