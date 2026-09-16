"""
Provider: auctions the shop is running.
"""

from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(
    os.environ['SUPABASE_URL'],
    os.environ['SUPABASE_SERVICE_ROLE_KEY']
)

PROVIDER_NAME = "shop_auctions"
ROLE = "shop_owner"
INTENT_KEYWORDS = [
    "auction", "auctions", "listing", "listings", "selling", "sell",
    "leading", "highest bid", "reserve", "sold", "unsold", "ended",
    "live", "expired", "cancelled", "closing", "closes",
]
PAGES = {"auctions": "/shop/auctions"}


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


def _hours_until(iso) -> int | None:
    dt = _to_dt(iso)
    if not dt:
        return None
    delta = dt - datetime.now(timezone.utc)
    return int(delta.total_seconds() // 3600)


def _hours_ago(iso) -> int | None:
    dt = _to_dt(iso)
    if not dt:
        return None
    delta = datetime.now(timezone.utc) - dt
    return int(delta.total_seconds() // 3600)


def _outcome(status: str, has_bid: bool) -> str | None:
    if status == "active":
        return None
    if status == "sold":
        return "sold"
    if status == "completed":
        return "completed"
    if status == "cancelled":
        return "cancelled"
    if status == "expired":
        return "expired_no_bids" if not has_bid else "expired_reserve_not_met"
    return None


def fetch(shop_id: str) -> dict:
    rows = (
        supabase.table("auctions")
        .select(
            "id, item_name, status, starting_price, current_highest_bid, "
            "current_highest_bidder, reserve_price, winning_bid_id, "
            "end_time, closed_at, created_at, completed_at, "
            "delivery_confirmed_by_shop"
        )
        .eq("shop_id", shop_id)
        # .eq("data_source", "live")  -- testing on seed data
        .order("created_at", desc=True)
        .execute()
        .data
    )

    if not rows:
        return {"count": 0, "items": []}

    auction_ids = [r["id"] for r in rows]

    # fetch ALL bids for these auctions, sorted by amount descending
    bid_rows = (
        supabase.table("auction_bids")
        .select("auction_id, buyer_id, bid_amount, created_at")
        .in_("auction_id", auction_ids)
        .order("bid_amount", desc=True)
        .execute()
        .data
    )

    by_auction: dict[str, list] = {}
    for b in bid_rows:
        by_auction.setdefault(b["auction_id"], []).append(b)

    # batch fetch bidder names
    bidder_ids = list({b["buyer_id"] for b in bid_rows})
    bidder_map = {}
    if bidder_ids:
        bidder_rows = (
            supabase.table("profiles")
            .select("id, full_name")
            .in_("id", bidder_ids)
            .execute()
            .data
        )
        bidder_map = {p["id"]: p for p in bidder_rows}

    items = []
    for r in rows:
        auction_bids = by_auction.get(r["id"], [])
        bid_count = len(auction_bids)
        unique_bidders = len({b["buyer_id"] for b in auction_bids})

        # derive highest and second-highest from actual bids (not stale columns)
        actual_highest = auction_bids[0]["bid_amount"] if bid_count >= 1 else None
        second_highest = auction_bids[1]["bid_amount"] if bid_count >= 2 else None

        # leader = bidder with the highest actual bid
        leader_name = None
        if auction_bids:
            top_profile = bidder_map.get(auction_bids[0]["buyer_id"], {})
            leader_name = top_profile.get("full_name")

        # top 5 distinct bidders, in order of highest bid
        top_bidder_names = []
        seen = set()
        for b in auction_bids:
            if b["buyer_id"] in seen:
                continue
            seen.add(b["buyer_id"])
            profile = bidder_map.get(b["buyer_id"], {})
            name = profile.get("full_name")
            if name:
                top_bidder_names.append(name)
            if len(top_bidder_names) >= 5:
                break

        hours_left = _hours_until(r["end_time"])
        hours_since_close = _hours_ago(r["closed_at"])
        has_bid = actual_highest is not None

        items.append({
            "item_name": r["item_name"],
            "status": r["status"],
            "starting_price": r["starting_price"],
            "current_highest_bid": actual_highest,
            "leading_bidder": leader_name,
            "reserve_price": r.get("reserve_price"),
            "hours_left": hours_left if hours_left and hours_left > 0 else None,
            "hours_since_close": hours_since_close,
            "outcome": _outcome(r["status"], has_bid),
            "has_bids": has_bid,
            "bid_count": bid_count,
            "unique_bidder_count": unique_bidders,
            "second_highest_bid": second_highest,
            "top_bidders": top_bidder_names,
            "delivery_confirmed_by_shop": r.get("delivery_confirmed_by_shop"),
            "verified": r.get("completed_at") is not None,
        })

    return {"count": len(items), "items": items}


TEST_SHOP_ID = ""

if __name__ == "__main__":
    import sys
    import json

    shop_id = sys.argv[1] if len(sys.argv) > 1 else TEST_SHOP_ID

    if not shop_id:
        print("Usage: python -m ai.providers.shop_auctions <shop_uuid>")
        print("   or: set TEST_SHOP_ID at the top of this file")
        sys.exit(1)

    print(f"Fetching auctions for shop: {shop_id}\n")
    result = fetch(shop_id)
    print(json.dumps(result, indent=2, default=str))