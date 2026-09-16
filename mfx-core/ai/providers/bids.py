from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(
    os.environ['SUPABASE_URL'],
    os.environ['SUPABASE_SERVICE_ROLE_KEY']
)

PROVIDER_NAME = "bids"
ROLE = "buyer"
INTENT_KEYWORDS = [
    "bid", "offer", "quote", "highest", "cheapest", "closest",
    "selected", "rejected", "shop",
]
PAGES = {"requests": "/buyer/requests"}


# ---------------------------------------------------

def _to_dt(iso) -> datetime | None:
    if not iso:
        return None
    if isinstance(iso, str):
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    else:
        dt = iso
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _days_ago(iso) -> int:
    dt = _to_dt(iso)
    if not dt:
        return 0
    return (datetime.now(timezone.utc) - dt).days


# -------------------------------------------------
# bids on the buyer's requests
def fetch(buyer_id: str) -> dict:
    # 1. buyer's request ids + item names
    req_rows = (
        supabase.table("requests")
        .select("id, item_name")
        .eq("buyer_id", buyer_id)
        .neq("status", "deleted")
        .eq("data_source", "live")
        .execute()
        .data
    )

    if not req_rows:
        return {"count": 0, "items": []}

    request_ids = [r["id"] for r in req_rows]
    req_item_names = {r["id"]: r["item_name"] for r in req_rows}

    # 2. bids on those requests
    bid_rows = (
        supabase.table("bids")
        .select(
            "request_id, shop_id, price, status, "
            "created_at, selected_at, rejected_at"
        )
        .in_("request_id", request_ids)
        .eq("data_source", "live")
        .execute()
        .data
    )

    if not bid_rows:
        return {"count": 0, "items": []}

    # 3. batch fetch shop profiles
    shop_ids = list({b["shop_id"] for b in bid_rows})
    shop_rows = (
        supabase.table("profiles")
        .select("id, shop_name, pincode")
        .in_("id", shop_ids)
        .execute()
        .data
    )
    shop_map = {s["id"]: s for s in shop_rows}

    # 4. build compact items
    items = []
    for b in bid_rows:
        shop = shop_map.get(b["shop_id"], {})
        items.append({
            "for_item": req_item_names.get(b["request_id"], "unknown"),
            "price": b["price"],
            "status": b["status"],
            "shop_name": shop.get("shop_name"),
            "shop_pincode": shop.get("pincode"),
            "created_days_ago": _days_ago(b["created_at"]),
            "selected": b["selected_at"] is not None,
            "rejected": b["rejected_at"] is not None,
        })

    return {"count": len(items), "items": items}


# -------------------------------------------------
# standalone test
#   python -m ai.providers.bids <buyer_uuid>
#   or set TEST_BUYER_ID below and run:
#   python -m ai.providers.bids

TEST_BUYER_ID = ""   # ← optional: paste a UUID here for quick testing

if __name__ == "__main__":
    import sys
    import json

    buyer_id = sys.argv[1] if len(sys.argv) > 1 else TEST_BUYER_ID

    if not buyer_id:
        print("Usage: python -m ai.providers.bids <buyer_uuid>")
        print("   or: set TEST_BUYER_ID at the top of this file")
        sys.exit(1)

    print(f"Fetching bids for buyer: {buyer_id}\n")
    result = fetch(buyer_id)
    print(json.dumps(result, indent=2, default=str))