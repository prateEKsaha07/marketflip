"""
Provider registry — routes questions to the right data providers.
"""

import logging

from . import requests as requests_provider
from . import bids as bids_provider
from . import shop_auctions as shop_auctions_provider

logger = logging.getLogger(__name__)

# ============================================================
# To add a new provider:
#   1. Create ai/providers/<name>.py with the standard contract
#   2. Import it above
#   3. Add it to ALL_PROVIDERS below
# No changes needed in qa.py, routes.py, or the frontend.
# ============================================================

ALL_PROVIDERS = [
    # buyer-side
    requests_provider,
    bids_provider,
    # shop-side
    shop_auctions_provider,
    # future
    # shop_bids_provider,       # phase 3.3
    # shop_reliability_provider,# phase 3.4
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
#   python -m ai.providers.registry <user_uuid> "<question>" [role]
#   role defaults to "buyer" — pass "shop_owner" to test shop providers
#
#   Examples:
#     python -m ai.providers.registry <buyer_uuid> "how many bids do I have?"
#     python -m ai.providers.registry <shop_uuid> "how's my bike auction going?" shop_owner

TEST_USER_ID = ""                                    # ← optional
TEST_QUESTION = "how many bids do I have?"           # ← optional
TEST_ROLE = "buyer"                                  # ← "buyer" or "shop_owner"

if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) > 2:
        user_id = sys.argv[1]
        question = sys.argv[2]
        role = sys.argv[3] if len(sys.argv) > 3 else TEST_ROLE
    else:
        user_id = TEST_USER_ID
        question = TEST_QUESTION
        role = TEST_ROLE

    if not user_id:
        print('Usage: python -m ai.providers.registry <user_uuid> "<question>" [role]')
        print('   role is optional, defaults to "buyer"')
        print('   Example: python -m ai.providers.registry <uuid> "how many bids?" shop_owner')
        sys.exit(1)

    print(f"Question: {question}")
    print(f"User:     {user_id}")
    print(f"Role:     {role}\n")

    context, used = fetch_context(question, user_id, role=role)
    print(f"Providers used: {used}\n")
    print(json.dumps(context, indent=2, default=str))