"""
Q&A pipeline — asks Gemini a question with the user's data as context.
Supports both buyers and shop owners.
"""

import time
import os
import logging
from dotenv import load_dotenv
from google import genai
from google.genai import types
from supabase import create_client

from .prompts import (
    QA_SYSTEM_PROMPT,
    QA_SHOP_SYSTEM_PROMPT,
    build_qa_prompt,
)
from .providers.registry import fetch_context

load_dotenv()

logger = logging.getLogger(__name__)

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

MODEL = "gemini-3.1-flash-lite"


def _system_prompt_for(role: str) -> str:
    if role == "shop_owner":
        return QA_SHOP_SYSTEM_PROMPT
    return QA_SYSTEM_PROMPT


def log_ask(
    user_id: str,
    role: str,
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
        "buyer_id": user_id,          # column name kept for backward compat
        "role": role,
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


def ask_question(
    question: str,
    user_id: str,
    role: str = "buyer",
    data_source: str = "live",
) -> dict:
    start = time.perf_counter()

    context, providers_used = fetch_context(question, user_id, role=role)
    system_prompt = _system_prompt_for(role)

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=build_qa_prompt(question, context),
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.2,
                max_output_tokens=200,
            ),
        )
    except Exception as e:
        latency_ms = int((time.perf_counter() - start) * 1000)
        log_ask(
            user_id=user_id,
            role=role,
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
        user_id=user_id,
        role=role,
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


TEST_USER_ID = ""
TEST_QUESTION = "how many bids do I have?"
TEST_ROLE = "buyer"

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 2:
        user_id = sys.argv[1]
        question = sys.argv[2]
        role = sys.argv[3] if len(sys.argv) > 3 else TEST_ROLE
    else:
        user_id = TEST_USER_ID
        question = TEST_QUESTION
        role = TEST_ROLE

    if not user_id:
        print('Usage: python -m ai.qa <user_uuid> "<question>" [role]')
        sys.exit(1)

    print(f"Question: {question}")
    print(f"Role:     {role}\n")

    result = ask_question(question, user_id, role=role)
    print("Answer:")
    print(result["answer"])
    print(f"\nProviders used: {result['providers_used']}")
    print(f"Log ID: {result['log_id']}")