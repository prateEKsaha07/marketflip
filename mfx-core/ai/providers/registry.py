"""
Provider registry — routes questions to the right data providers.
"""

import logging

from . import requests as requests_provider
from . import bids as bids_provider

logger = logging.getLogger(__name__)

# ============================================================
# To add a new provider (e.g., auctions):
#   1. Create ai/providers/auctions.py with the standard contract
#   2. Import it above
#   3. Add it to ALL_PROVIDERS below
# No changes needed in qa.py, routes.py, or the frontend.
# ============================================================

ALL_PROVIDERS = [
    requests_provider,
    bids_provider,
    # auctions_provider,   # phase 3.2
    # purchases_provider,  # phase 3.3
    # chats_provider,      # phase 3.4
]

# keyword → provider lookup, built once
KEYWORD_MAP = {
    kw: p
    for p in ALL_PROVIDERS
    for kw in p.INTENT_KEYWORDS
}


def pick_providers(question: str, role: str = "buyer") -> list:
    q = question.lower()
    matched = []
    seen = set()

    for keyword, provider in KEYWORD_MAP.items():
        if keyword in q and provider.PROVIDER_NAME not in seen:
            if provider.ROLE in (role, "both"):
                matched.append(provider)
                seen.add(provider.PROVIDER_NAME)

    # fallback: no keyword matched → fetch everything for this role
    if not matched:
        matched = [p for p in ALL_PROVIDERS if p.ROLE in (role, "both")]

        for p in matched:
            seen.add(p.PROVIDER_NAME)

    # always include requests (anchor table) for buyers
    if role == "buyer" and "requests" not in seen:
        matched.append(requests_provider)

    return matched


def fetch_context(question: str, user_id: str, role: str = "buyer"):
    """
    Fetch data from relevant providers.
    Returns (context_dict, names_used_list).
    Never raises — a failed provider is skipped.
    """
    providers = pick_providers(question, role)
    context = {}
    names_used = []

    for p in providers:
        try:
            context[p.PROVIDER_NAME] = p.fetch(user_id)
            names_used.append(p.PROVIDER_NAME)
        except Exception as e:
            logger.warning(f"Provider {p.PROVIDER_NAME} failed: {e}")

    return context, names_used


# -------------------------------------------------
# standalone test
#   python -m ai.providers.registry <buyer_uuid> "<question>"
#   or set TEST_BUYER_ID / TEST_QUESTION and run:
#   python -m ai.providers.registry

TEST_BUYER_ID = ""                                   # ← optional
TEST_QUESTION = "how many bids do I have?"           # ← optional

if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) > 2:
        buyer_id, question = sys.argv[1], sys.argv[2]
    else:
        buyer_id, question = TEST_BUYER_ID, TEST_QUESTION

    if not buyer_id:
        print('Usage: python -m ai.providers.registry <buyer_uuid> "<question>"')
        print("   or: set TEST_BUYER_ID and TEST_QUESTION at the top of this file")
        sys.exit(1)

    print(f"Question: {question}")
    print(f"Buyer:    {buyer_id}\n")

    context, used = fetch_context(question, buyer_id)
    print(f"Providers used: {used}\n")
    print(json.dumps(context, indent=2, default=str))