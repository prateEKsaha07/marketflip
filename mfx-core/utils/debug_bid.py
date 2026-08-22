import os
import random
import uuid
from supabase import create_client
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

SUPABASE_URL = SUPABASE_URL.rstrip('/')
if SUPABASE_URL.endswith('/rest/v1'):
    SUPABASE_URL = SUPABASE_URL[:-8]
elif '/rest/v1' in SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.split('/rest/v1')[0]

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Get a request and shops
requests = supabase.table("requests").select("id, budget_min, budget_max").limit(5).execute()
shops = supabase.table("profiles").select("id").eq("role", "shop_owner").limit(10).execute()

print(f"Found {len(requests.data)} requests")
print(f"Found {len(shops.data)} shops")

if not requests.data or not shops.data:
    print("No requests or shops found")
    exit()

# Try to insert bids one by one
success_count = 0
fail_count = 0

for request in requests.data:
    # Try to create 2 bids per request
    for i in range(2):
        shop = random.choice(shops.data)
        price = random.randint(request['budget_min'], request['budget_max'])
        
        bid_data = {
            "id": str(uuid.uuid4()),
            "request_id": request['id'],
            "shop_id": shop['id'],
            "price": price,
            "note": "Test bid from debug",
            "status": "pending",
            "created_at": "2026-08-23T10:00:00Z"
        }
        
        try:
            result = supabase.table("bids").insert(bid_data).execute()
            if result.data:
                success_count += 1
                print(f"  Success: {bid_data['id']}")
            else:
                fail_count += 1
                print(f"  Failed: No data returned for {bid_data['id']}")
        except Exception as e:
            fail_count += 1
            print(f"  Error: {e}")

print(f"Success: {success_count}, Failed: {fail_count}")

# Check final count
result = supabase.table("bids").select("id").execute()
print(f"Total bids in DB: {len(result.data)}")