from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(
    os.environ['SUPABASE_URL'],
    os.environ['SUPABASE_SERVICE_ROLE_KEY']
)

PROVIDER_NAME = "requests"
ROLE = "buyer"
INTENT_KEYWORDS = [
    "request", "post", "item", "buy", "expire", "oldest", "recent",
    "open", "active", "status",
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

def _days_until(iso) -> int:
    dt = _to_dt(iso)
    if not dt:
        return 0
    return (dt - datetime.now(timezone.utc)).days

# -------------------------------------------------
# buyer's own requests data
def fetch(buyer_id: str) -> dict:
    rows = (
        supabase.table("requests")
        .select("item_name, status, budget_min, budget_max, "
                "pincode, category, created_at, expires_at")
        .eq("buyer_id", buyer_id)
        .neq("status", "deleted")
        .eq("data_source", "live")
        .order("created_at", desc=True)
        .execute()
        .data
    )

    items = [
        {
            "item_name": r["item_name"],
            "status": r["status"],
            "budget": f"₹{r['budget_min']}-{r['budget_max']}",
            "pincode": r["pincode"],
            "category": r.get("category"),
            "created_days_ago": _days_ago(r["created_at"]),
            "expires_in_days": _days_until(r["expires_at"]),
        }
        for r in rows
    ]
    return {"count": len(items), "items": items}


# -------------------------------------------------
# standalone test

TEST_BUYER_ID = "04f027ec-3668-4ec9-9c80-308a57b35346"

if __name__ == "__main__":
    import sys
    import json

    buyer_id = sys.argv[1] if len(sys.argv) > 1 else TEST_BUYER_ID

    if not buyer_id:
        print("Usage: python -m ai.providers.requests <buyer_uuid>")
        print("   or: set TEST_BUYER_ID at the top of this file")
        sys.exit(1)

    print(f"Fetching requests for buyer: {buyer_id}\n")
    result = fetch(buyer_id)
    print(json.dumps(result, indent=2, default=str))