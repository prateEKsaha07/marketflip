#!/usr/bin/env python3
"""
MarketFlip v2 - Faker Seed Script
Generates realistic synthetic data for testing and ML prototyping.
Matches exact database schema with data_source tagging.
"""

import os
import sys
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from dotenv import load_dotenv
from faker import Faker
import logging
import requests
import time

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

fake = Faker('en_IN')

# ============================================
# CONFIGURATION
# ============================================

BHILAI_PINCODES = [
    '490001', '490002', '490003', '490005', '490006', '490007',
    '490008', '490009', '490011', '490015', '490020', '490021',
    '490023', '490024', '490025', '490026', '490027', '490028',
    '490029', '490031', '490032', '490033', '490034', '490035',
    '490036', '490037', '490038', '490039', '490040', '490041',
    '490042', '490043', '490044', '490045', '490046', '490047',
    '490048', '490049', '490050'
]

CATEGORIES = {
    'electronics': {
        'items': ['Smartphone', 'Laptop', 'Headphones', 'Smartwatch', 'Tablet', 'TV', 'Camera', 'Speaker', 'Monitor', 'Keyboard'],
        'budget_min': 2000,
        'budget_max': 150000
    },
    'furniture': {
        'items': ['Sofa', 'Dining Table', 'Bed', 'Wardrobe', 'Bookshelf', 'Desk', 'Chair', 'Cabinet', 'Coffee Table', 'Dresser'],
        'budget_min': 1500,
        'budget_max': 80000
    },
    'clothing': {
        'items': ['Shirt', 'Jeans', 'Dress', 'Jacket', 'Saree', 'Kurta', 'T-Shirt', 'Trousers', 'Sweater', 'Blazer'],
        'budget_min': 300,
        'budget_max': 20000
    },
    'books': {
        'items': ['Fiction Novel', 'Textbook', 'Biography', 'Cookbook', 'Comic Book', 'Poetry Collection', 'Travel Guide', 'Self-Help Book', 'History Book', 'Science Book'],
        'budget_min': 100,
        'budget_max': 5000
    },
    'home_kitchen': {
        'items': ['Microwave', 'Refrigerator', 'Mixer Grinder', 'Cookware Set', 'Utensils', 'Chimney', 'Water Purifier', 'Induction Stove', 'Gas Stove', 'Oven'],
        'budget_min': 500,
        'budget_max': 50000
    }
}

# Number of records to generate
NUM_BUYERS = 15
NUM_SHOPS = 12
NUM_REQUESTS = 50
MAX_BIDS_PER_REQUEST = 6
NUM_AUCTIONS = 30
NUM_AUCTION_BIDS = 80
NUM_EVENTS = 300

# ============================================
# SUPABASE SETUP
# ============================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    logger.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    sys.exit(1)

SUPABASE_URL = SUPABASE_URL.rstrip('/')
if SUPABASE_URL.endswith('/rest/v1'):
    SUPABASE_URL = SUPABASE_URL[:-8]
elif '/rest/v1' in SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.split('/rest/v1')[0]

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    logger.info(f"Connected to Supabase: {SUPABASE_URL}")
except Exception as e:
    logger.error(f"Failed to connect to Supabase: {e}")
    sys.exit(1)

AUTH_URL = f"{SUPABASE_URL}/auth/v1/admin"

# ============================================
# VERIFICATION FUNCTIONS
# ============================================

def verify_connection() -> bool:
    """Verify Supabase connection and service role access"""
    try:
        supabase.table("profiles").select("id").limit(1).execute()
        logger.info("Supabase connection verified")
        return True
    except Exception as e:
        logger.error(f"Supabase connection failed: {e}")
        return False

def verify_existing_users() -> bool:
    """Verify we have at least one buyer and one shop"""
    try:
        result = supabase.table("profiles").select("id, role").execute()
        profiles = result.data
        
        buyers = [p for p in profiles if p['role'] == 'buyer']
        shops = [p for p in profiles if p['role'] == 'shop_owner']
        
        logger.info(f"Found {len(buyers)} buyers and {len(shops)} shops")
        
        if not buyers:
            logger.error("No buyers found in profiles table. Please ensure you have at least one buyer.")
            return False
        
        if not shops:
            logger.error("No shops found in profiles table. Please ensure you have at least one shop.")
            return False
        
        return True
    except Exception as e:
        logger.error(f"Failed to verify existing users: {e}")
        return False

def verify_tables_exist() -> bool:
    """Verify all required tables exist"""
    required_tables = ['profiles', 'requests', 'bids', 'request_events', 'auctions', 'auction_bids']
    
    for table in required_tables:
        try:
            supabase.table(table).select("id").limit(1).execute()
            logger.info(f"Table '{table}' exists")
        except Exception as e:
            logger.error(f"Table '{table}' does not exist or is inaccessible: {e}")
            return False
    
    return True

def get_existing_ids(table: str, column: str = 'id') -> List[str]:
    """Get existing IDs from a table to check for duplicates"""
    try:
        result = supabase.table(table).select(column).execute()
        return [row[column] for row in result.data]
    except Exception as e:
        logger.debug(f"Error fetching existing IDs from {table}: {e}")
        return []

# ============================================
# AUTH HELPERS
# ============================================

def create_auth_user(email: str, password: str, user_metadata: Dict[str, Any]) -> Optional[str]:
    """Create a user in Supabase Auth and return the user ID"""
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": user_metadata
    }
    
    try:
        response = requests.post(f"{AUTH_URL}/users", headers=headers, json=payload)
        if response.status_code == 200:
            return response.json()['id']
        else:
            logger.debug(f"Failed to create auth user {email}: {response.status_code}")
            return None
    except Exception as e:
        logger.debug(f"Error creating auth user: {e}")
        return None

def generate_email(role: str) -> str:
    """Generate a unique fake email"""
    domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'example.com']
    first_name = fake.first_name().lower()
    last_name = fake.last_name().lower()
    return f"{role}_{first_name}.{last_name}_{random.randint(1000, 99999)}@{random.choice(domains)}"

# ============================================
# DATA GENERATION HELPERS
# ============================================

def random_pincode() -> str:
    return random.choice(BHILAI_PINCODES)

def random_category() -> str:
    return random.choice(list(CATEGORIES.keys()))

def random_item(category: str) -> str:
    return random.choice(CATEGORIES[category]['items'])

def random_budget(category: str) -> tuple:
    min_budget = CATEGORIES[category]['budget_min']
    max_budget = CATEGORIES[category]['budget_max']
    
    budget_min = random.randint(min_budget, min_budget + int((max_budget - min_budget) * 0.3))
    budget_max = random.randint(budget_min, min_budget + int((max_budget - min_budget) * 0.8))
    
    if budget_max < budget_min:
        budget_max = budget_min + random.randint(500, 5000)
    
    return budget_min, budget_max

def random_delivery_method() -> str:
    return random.choice(['home_delivery', 'pickup'])

def random_bid_price(budget_min: int, budget_max: int) -> int:
    roll = random.random()
    if roll < 0.7:
        return random.randint(budget_min, budget_max)
    elif roll < 0.9:
        return random.randint(int(budget_min * 0.6), budget_min)
    else:
        return random.randint(budget_max, int(budget_max * 1.2))

def random_urgency() -> Optional[str]:
    choices = ['flexible', 'soon', 'urgent', None]
    weights = [0.3, 0.3, 0.2, 0.2]
    return random.choices(choices, weights=weights, k=1)[0]

def random_date(start: datetime, end: datetime) -> datetime:
    """Generate random date between start and end"""
    return start + timedelta(
        days=random.randint(0, (end - start).days),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59)
    )

def random_status(weights: Dict[str, float]) -> str:
    """Pick a status based on weights"""
    return random.choices(list(weights.keys()), weights=list(weights.values()))[0]

# ============================================
# GENERATE USERS
# ============================================

def generate_buyer_data() -> tuple:
    """Generate buyer profile data matching profiles schema"""
    first_name = fake.first_name()
    last_name = fake.last_name()
    pincode = random_pincode()
    email = generate_email('buyer')
    password = 'Test@123456'
    
    profile = {
        "role": "buyer",
        "shop_name": None,
        "full_name": f"{first_name} {last_name}",
        "address": fake.street_address(),
        "pincode": pincode,
        "phone": fake.phone_number(),
        "date_of_birth": fake.date_of_birth(minimum_age=18, maximum_age=60).isoformat(),
        "gender": random.choice(['male', 'female', 'other']),
        "bio": fake.sentence(nb_words=10),
        "preferred_categories": [random_category() for _ in range(random.randint(1, 3))],
        "total_transactions": 0,
        "completed_transactions": 0,
        "is_verified": random.choice([True, False]),
        "last_active_at": datetime.now().isoformat()
    }
    
    return profile, email, password

def generate_shop_data() -> tuple:
    """Generate shop profile data matching profiles schema"""
    shop_names = [
        'Tech Hub', 'Gadget World', 'ElectroMart', 'Digital Store',
        'Home Decor', 'Furniture House', 'Comfort Zone', 'Interior Studio',
        'Fashion Point', 'Style Hub', 'Clothing Co', 'Trendy Wear',
        'Book Nook', 'Read & Relax', 'Literature House', 'Page Turner',
        'Kitchen Express', 'Home Appliances', 'Cook & Serve', 'Living Space'
    ]
    
    pincode = random_pincode()
    email = generate_email('shop')
    password = 'Test@123456'
    
    profile = {
        "role": "shop_owner",
        "shop_name": random.choice(shop_names),
        "full_name": fake.name(),
        "address": fake.street_address(),
        "pincode": pincode,
        "phone": fake.phone_number(),
        "business_hours": {
            "monday_friday": f"{random.randint(8, 10)}:00 - {random.randint(18, 22)}:00",
            "saturday": f"{random.randint(8, 10)}:00 - {random.randint(16, 20)}:00",
            "sunday": "Closed" if random.random() < 0.3 else f"{random.randint(8, 10)}:00 - {random.randint(14, 18)}:00"
        },
        "years_in_business": random.randint(1, 20),
        "total_transactions": 0,
        "completed_transactions": 0,
        "is_verified": random.choice([True, False]),
        "last_active_at": datetime.now().isoformat()
    }
    
    return profile, email, password

def create_users_with_auth(num_buyers: int, num_shops: int) -> tuple:
    """Create users with duplicate checking"""
    logger.info(f"Creating {num_buyers} buyers and {num_shops} shops...")
    
    existing_ids = get_existing_ids('profiles')
    logger.info(f"Found {len(existing_ids)} existing profiles")
    
    buyers = []
    shops = []
    created_count = 0
    
    for i in range(num_buyers):
        profile_data, email, password = generate_buyer_data()
        
        user_metadata = {"role": "buyer", "full_name": profile_data["full_name"]}
        user_id = create_auth_user(email, password, user_metadata)
        
        if user_id:
            profile_data["id"] = user_id
            try:
                supabase.table("profiles").insert(profile_data).execute()
                buyers.append(profile_data)
                created_count += 1
                if created_count % 5 == 0:
                    logger.info(f"  Created {created_count} users so far")
            except Exception as e:
                logger.error(f"  Failed to create buyer profile: {e}")
        else:
            logger.debug(f"  Failed to create auth user for {email}")
        
        time.sleep(0.1)
    
    for i in range(num_shops):
        profile_data, email, password = generate_shop_data()
        
        user_metadata = {"role": "shop_owner", "shop_name": profile_data["shop_name"]}
        user_id = create_auth_user(email, password, user_metadata)
        
        if user_id:
            profile_data["id"] = user_id
            try:
                supabase.table("profiles").insert(profile_data).execute()
                shops.append(profile_data)
                created_count += 1
                if created_count % 5 == 0:
                    logger.info(f"  Created {created_count} users so far")
            except Exception as e:
                logger.error(f"  Failed to create shop profile: {e}")
        else:
            logger.debug(f"  Failed to create auth user for {email}")
        
        time.sleep(0.1)
    
    logger.info(f"Created {len(buyers)} buyers and {len(shops)} shops")
    return buyers, shops

# ============================================
# GENERATE REQUESTS
# ============================================

def generate_request(buyer_id: str) -> Dict[str, Any]:
    """Generate a fake request matching requests schema with data_source='seed'"""
    category = random_category()
    item = random_item(category)
    budget_min, budget_max = random_budget(category)
    pincode = random_pincode()
    
    has_description = random.random() < 0.7
    created_at = fake.date_time_between(start_date='-30d', end_date='now')
    
    return {
        "id": str(uuid.uuid4()),
        "buyer_id": buyer_id,
        "item_name": item,
        "description": fake.sentence(nb_words=15) if has_description else None,
        "budget_min": budget_min,
        "budget_max": budget_max,
        "pincode": pincode,
        "category": category,
        "reference_url": fake.url() if random.random() < 0.2 else None,
        "reference_image": None,
        "reference_img": None,
        "status": "open",
        "created_at": created_at.isoformat(),
        "expires_at": (created_at + timedelta(days=7)).isoformat(),
        "views_count": random.randint(0, 50),
        "urgency": random_urgency(),
        "preferred_contact_time": None,
        "delivery_method": None,
        "delivery_address": None,
        "delivery_confirmed_by_shop": None,
        "delivery_response_at": None,
        "image_urls": None,
        "category_id": None,
        "selected_bid_id": None,
        "purchased_at": None,
        "completed_at": None,
        "data_source": "seed"  # <-- NEW
    }

def create_requests(buyer_ids: List[str], num_requests: int) -> List[Dict]:
    """Create requests with data_source='seed'"""
    logger.info(f"Creating {num_requests} requests...")
    
    if not buyer_ids:
        logger.error("No buyer IDs available!")
        return []
    
    existing_ids = get_existing_ids('requests')
    logger.info(f"Found {len(existing_ids)} existing requests")
    
    requests = []
    created_count = 0
    
    for i in range(num_requests):
        buyer_id = random.choice(buyer_ids)
        request = generate_request(buyer_id)
        
        if request['id'] in existing_ids:
            continue
        
        requests.append(request)
        
        try:
            supabase.table("requests").insert(request).execute()
            created_count += 1
            existing_ids.append(request['id'])
            if created_count % 10 == 0:
                logger.info(f"  Created {created_count}/{num_requests} requests")
        except Exception as e:
            logger.error(f"  Failed to create request: {e}")
    
    logger.info(f"Created {created_count} new requests with data_source='seed'")
    return requests

# ============================================
# GENERATE BIDS
# ============================================

def generate_bid(request: Dict, shop_id: str) -> Dict[str, Any]:
    """Generate a fake bid with data_source='seed'"""
    budget_min = request['budget_min']
    budget_max = request['budget_max']
    price = random_bid_price(budget_min, budget_max)
    
    has_note = random.random() < 0.4
    
    created_at = fake.date_time_between(
        start_date=datetime.fromisoformat(request['created_at']),
        end_date='now'
    )
    
    return {
        "id": str(uuid.uuid4()),
        "request_id": request['id'],
        "shop_id": shop_id,
        "price": price,
        "note": fake.sentence(nb_words=8) if has_note else None,
        "status": "pending",
        "created_at": created_at.isoformat(),
        "selected_at": None,
        "rejected_at": None,
        "withdrawn_at": None,
        "buyer_contact_viewed": False,
        "is_negotiable": random.random() < 0.3,
        "data_source": "seed"  # <-- NEW
    }

def create_bids(requests: List[Dict], shop_ids: List[str]) -> List[Dict]:
    """Create bids with data_source='seed'"""
    logger.info(f"Creating bids...")
    logger.info(f"  Requests available: {len(requests)}")
    logger.info(f"  Shops available: {len(shop_ids)}")
    
    if not shop_ids:
        logger.error("  No shop IDs available!")
        return []
    
    if not requests:
        logger.error("  No requests available!")
        return []
    
    existing_ids = get_existing_ids('bids')
    logger.info(f"Found {len(existing_ids)} existing bids")
    
    all_bids = []
    request_with_bids = 0
    created_count = 0
    total_bids_attempted = 0
    skipped_no_bids = 0
    skipped_no_shops = 0
    duplicate_skipped = 0
    insert_failed = 0
    
    for idx, request in enumerate(requests):
        roll = random.random()
        if roll < 0.3:
            num_bids = 0
        elif roll < 0.8:
            num_bids = random.randint(1, 3)
        else:
            num_bids = random.randint(4, MAX_BIDS_PER_REQUEST)
        
        if idx < 10:
            logger.info(f"  Request {idx+1}: roll={roll:.2f}, num_bids={num_bids}, id={request['id'][:8]}")
        
        if num_bids == 0:
            skipped_no_bids += 1
            continue
        
        if len(shop_ids) < num_bids:
            num_bids = len(shop_ids)
            logger.debug(f"  Reduced bids to {num_bids} (only {len(shop_ids)} shops available)")
        
        if num_bids == 0:
            skipped_no_shops += 1
            continue
        
        selected_shops = random.sample(shop_ids, min(num_bids, len(shop_ids)))
        
        if not selected_shops:
            skipped_no_shops += 1
            continue
        
        request_with_bids += 1
        
        for shop_id in selected_shops:
            bid = generate_bid(request, shop_id)
            total_bids_attempted += 1
            
            if bid['id'] in existing_ids:
                duplicate_skipped += 1
                continue
            
            all_bids.append(bid)
            
            try:
                result = supabase.table("bids").insert(bid).execute()
                if result.data:
                    created_count += 1
                    existing_ids.append(bid['id'])
                    if created_count % 10 == 0:
                        logger.info(f"  Created {created_count} bids so far")
                else:
                    insert_failed += 1
                    logger.warning(f"  No data returned for bid {bid['id']}")
            except Exception as e:
                insert_failed += 1
                logger.warning(f"  Failed to insert bid: {e}")
        
        if (idx + 1) % 10 == 0:
            logger.info(f"  Processed {idx + 1}/{len(requests)} requests, created {created_count} bids so far")
    
    logger.info(f"  Summary:")
    logger.info(f"    - Requests with bids: {request_with_bids}/{len(requests)}")
    logger.info(f"    - Requests with no bids: {skipped_no_bids}")
    logger.info(f"    - Requests skipped (no shops): {skipped_no_shops}")
    logger.info(f"    - Bids attempted: {total_bids_attempted}")
    logger.info(f"    - Bids created: {created_count}")
    logger.info(f"    - Duplicates skipped: {duplicate_skipped}")
    logger.info(f"    - Insert failed: {insert_failed}")
    
    return all_bids

# ============================================
# GENERATE AUCTIONS
# ============================================

AUCTION_NAMES = [
    "Vintage Camera", "Smart Watch", "Drone", "Tablet", "Gaming Console",
    "Record Player", "Vinyl Collection", "Sports Equipment", "Artwork",
    "Antique Vase", "Designer Bag", "Sunglasses", "Perfume", "Jewelry",
    "Collector's Item", "Limited Edition Shoe", "Signed Book", "Concert Tickets",
    "Studio Headphones", "Mechanical Keyboard", "Graphics Card", "Monitor",
    "Office Chair", "Standing Desk", "Bookshelf", "Coffee Table"
]

def generate_auction(shop_id: str) -> Dict[str, Any]:
    """Generate a fake auction with data_source='seed'"""
    item_name = random.choice(AUCTION_NAMES)
    starting_price = random.randint(100, 5000)
    category = random_category()
    pincode = random_pincode()
    created_at = random_date(datetime.now() - timedelta(days=30), datetime.now())
    end_time = random_date(created_at, created_at + timedelta(days=14))
    
    return {
        "id": str(uuid.uuid4()),
        "shop_id": shop_id,
        "item_name": item_name,
        "description": f"Beautiful {item_name} in excellent condition",
        "starting_price": starting_price,
        "current_highest_bid": starting_price,
        "pincode": pincode,
        "category": category,
        "status": random_status({
            'active': 0.4,
            'sold': 0.25,
            'expired': 0.2,
            'cancelled': 0.15
        }),
        "reserve_price": starting_price + random.randint(100, 1000) if random.random() > 0.3 else None,
        "end_time": end_time.isoformat(),
        "image_urls": [f"https://picsum.photos/seed/{random.randint(1000,9999)}/400/400"] if random.random() > 0.4 else [],
        "created_at": created_at.isoformat(),
        "closed_at": None,
        "data_source": "seed"  # <-- NEW
    }

def create_auctions(shop_ids: List[str], num_auctions: int) -> List[Dict]:
    """Create auctions with data_source='seed'"""
    logger.info(f"Creating {num_auctions} auctions...")
    
    if not shop_ids:
        logger.error("No shop IDs available!")
        return []
    
    existing_ids = get_existing_ids('auctions')
    logger.info(f"Found {len(existing_ids)} existing auctions")
    
    auctions = []
    created_count = 0
    
    for i in range(num_auctions):
        shop_id = random.choice(shop_ids)
        auction = generate_auction(shop_id)
        
        if auction['id'] in existing_ids:
            continue
        
        auctions.append(auction)
        
        try:
            supabase.table("auctions").insert(auction).execute()
            created_count += 1
            existing_ids.append(auction['id'])
            if created_count % 10 == 0:
                logger.info(f"  Created {created_count}/{num_auctions} auctions")
        except Exception as e:
            logger.error(f"  Failed to create auction: {e}")
    
    logger.info(f"Created {created_count} new auctions with data_source='seed'")
    return auctions

# ============================================
# GENERATE AUCTION BIDS
# ============================================

def generate_auction_bid(auction_id: str, buyer_id: str) -> Dict[str, Any]:
    """Generate a fake auction bid with data_source='seed'"""
    bid_amount = random.randint(100, 10000)
    created_at = random_date(datetime.now() - timedelta(days=15), datetime.now())
    
    return {
        "id": str(uuid.uuid4()),
        "auction_id": auction_id,
        "buyer_id": buyer_id,
        "bid_amount": bid_amount,
        "created_at": created_at.isoformat(),
        "data_source": "seed"  # <-- NEW
    }

def create_auction_bids(auctions: List[Dict], buyer_ids: List[str], num_bids: int) -> List[Dict]:
    """Create auction bids with data_source='seed'"""
    logger.info(f"Creating {num_bids} auction bids...")
    
    if not auctions:
        logger.error("No auctions available!")
        return []
    
    if not buyer_ids:
        logger.error("No buyer IDs available!")
        return []
    
    existing_ids = get_existing_ids('auction_bids')
    logger.info(f"Found {len(existing_ids)} existing auction bids")
    
    auction_bids = []
    created_count = 0
    
    for i in range(num_bids):
        auction = random.choice(auctions)
        buyer_id = random.choice(buyer_ids)
        bid = generate_auction_bid(auction['id'], buyer_id)
        
        if bid['id'] in existing_ids:
            continue
        
        auction_bids.append(bid)
        
        try:
            supabase.table("auction_bids").insert(bid).execute()
            created_count += 1
            existing_ids.append(bid['id'])
            if created_count % 10 == 0:
                logger.info(f"  Created {created_count}/{num_bids} auction bids")
        except Exception as e:
            logger.error(f"  Failed to create auction bid: {e}")
    
    logger.info(f"Created {created_count} new auction bids with data_source='seed'")
    return auction_bids

# ============================================
# GENERATE REQUEST EVENTS
# ============================================

def create_request_events(requests: List[Dict], bids: List[Dict], buyer_ids: List[str], shop_ids: List[str]) -> List[Dict]:
    """Create request events with data_source='seed'"""
    logger.info(f"Creating request events...")
    
    if not requests:
        logger.error("No requests available!")
        return []
    
    existing_ids = get_existing_ids('request_events')
    logger.info(f"Found {len(existing_ids)} existing events")
    
    events = []
    all_actor_ids = buyer_ids + shop_ids
    created_count = 0
    
    for request in requests:
        # Viewed events
        num_views = random.randint(1, 5)
        for _ in range(num_views):
            actor_id = random.choice(all_actor_ids)
            created_at = fake.date_time_between(
                start_date=datetime.fromisoformat(request['created_at']),
                end_date='now'
            )
            event = {
                "id": str(uuid.uuid4()),
                "request_id": request['id'],
                "event_type": 'viewed',
                "actor_id": actor_id,
                "metadata": {"timestamp": created_at.isoformat()},
                "created_at": created_at.isoformat(),
                "data_source": "seed"  # <-- NEW
            }
            
            if event['id'] in existing_ids:
                continue
            
            events.append(event)
        
        # Bid placed events
        request_bids = [b for b in bids if b['request_id'] == request['id']]
        for bid in request_bids:
            event = {
                "id": str(uuid.uuid4()),
                "request_id": request['id'],
                "event_type": 'bid_placed',
                "actor_id": bid['shop_id'],
                "metadata": {"bid_id": bid['id'], "price": bid['price']},
                "created_at": bid['created_at'],
                "data_source": "seed"  # <-- NEW
            }
            
            if event['id'] in existing_ids:
                continue
            
            events.append(event)
        
        # Selected events (20% chance)
        if request_bids and random.random() < 0.2:
            selected_bid = random.choice(request_bids)
            created_at = fake.date_time_between(
                start_date=datetime.fromisoformat(selected_bid['created_at']),
                end_date='now'
            )
            event = {
                "id": str(uuid.uuid4()),
                "request_id": request['id'],
                "event_type": 'selected',
                "actor_id": request['buyer_id'],
                "metadata": {"bid_id": selected_bid['id'], "price": selected_bid['price']},
                "created_at": created_at.isoformat(),
                "data_source": "seed"  # <-- NEW
            }
            
            if event['id'] in existing_ids:
                continue
            
            events.append(event)
    
    # Insert events
    for i, event in enumerate(events):
        try:
            supabase.table("request_events").insert(event).execute()
            created_count += 1
            if (i + 1) % 50 == 0:
                logger.info(f"  Created {i + 1}/{len(events)} events")
        except Exception as e:
            logger.debug(f"  Failed to create event: {e}")
    
    logger.info(f"Created {created_count} request events with data_source='seed'")
    return events

# ============================================
# PROCESS REQUESTS (Lifecycle)
# ============================================

def process_lifecycle(requests: List[Dict], bids: List[Dict]):
    """Simulate request lifecycle: some expire, some get selected, some complete"""
    logger.info(f"Processing request lifecycle...")
    
    completed_count = 0
    expired_count = 0
    selected_count = 0
    failed_count = 0
    
    for request in requests:
        request_bids = [b for b in bids if b['request_id'] == request['id']]
        
        if not request_bids:
            continue
        
        # 30% chance of being selected
        if random.random() < 0.3:
            # 70% choose lowest price, 30% choose random
            if random.random() < 0.7:
                selected_bid = min(request_bids, key=lambda x: x['price'])
            else:
                selected_bid = random.choice(request_bids)
            
            try:
                supabase.table("bids").update({
                    "status": "selected",
                    "selected_at": datetime.now().isoformat()
                }).eq("id", selected_bid['id']).execute()
                selected_count += 1
            except Exception as e:
                failed_count += 1
                logger.debug(f"  Failed to select bid: {e}")
            
            try:
                supabase.table("requests").update({
                    "status": "purchased",
                    "selected_bid_id": selected_bid['id'],
                    "purchased_at": datetime.now().isoformat()
                }).eq("id", request['id']).execute()
            except Exception as e:
                failed_count += 1
                logger.debug(f"  Failed to update request: {e}")
            
            # 60% of purchased get completed
            if random.random() < 0.6:
                delivery_method = random_delivery_method()
                try:
                    supabase.table("requests").update({
                        "status": "completed",
                        "delivery_method": delivery_method,
                        "delivery_confirmed_by_shop": True if delivery_method == 'pickup' else None,
                        "completed_at": datetime.now().isoformat()
                    }).eq("id", request['id']).execute()
                    completed_count += 1
                except Exception as e:
                    failed_count += 1
                    logger.debug(f"  Failed to complete request: {e}")
        
        # 20% chance of expiring
        elif random.random() < 0.2:
            try:
                supabase.table("requests").update({
                    "status": "expired"
                }).eq("id", request['id']).execute()
                expired_count += 1
            except Exception as e:
                failed_count += 1
                logger.debug(f"  Failed to expire request: {e}")
    
    logger.info(f"Lifecycle complete: {selected_count} selected, {completed_count} completed, {expired_count} expired")

# ============================================
# MAIN
# ============================================

def main():
    logger.info("=" * 60)
    logger.info("MarketFlip v2 - Faker Seed Script (with data_source tagging)")
    logger.info("=" * 60)
    
    # Step 1: Verify connection
    logger.info("Step 1: Verifying Supabase connection...")
    if not verify_connection():
        logger.error("Failed to verify Supabase connection. Exiting.")
        sys.exit(1)
    logger.info("  Connection verified.")
    
    # Step 2: Verify tables exist
    logger.info("Step 2: Verifying tables exist...")
    if not verify_tables_exist():
        logger.error("Required tables are missing. Please run migrations first. Exiting.")
        sys.exit(1)
    logger.info("  All tables exist.")
    
    # Step 3: Verify existing users
    logger.info("Step 3: Verifying existing users...")
    if not verify_existing_users():
        logger.error("No users found. Please ensure you have at least one buyer and one shop. Exiting.")
        sys.exit(1)
    logger.info("  Users verified.")
    
    # Step 4: Get existing profiles
    logger.info("Step 4: Fetching existing profiles...")
    result = supabase.table("profiles").select("id, role").execute()
    existing_profiles = result.data
    
    existing_buyers = [p['id'] for p in existing_profiles if p['role'] == 'buyer']
    existing_shops = [p['id'] for p in existing_profiles if p['role'] == 'shop_owner']
    
    logger.info(f"  Found {len(existing_buyers)} existing buyers, {len(existing_shops)} existing shops")
    
    # Step 5: Create new users
    logger.info("Step 5: Creating new users...")
    buyers, shops = create_users_with_auth(NUM_BUYERS, NUM_SHOPS)
    
    all_buyer_ids = existing_buyers + [b['id'] for b in buyers]
    all_shop_ids = existing_shops + [s['id'] for s in shops]
    
    logger.info(f"  Total: {len(all_buyer_ids)} buyers, {len(all_shop_ids)} shops")
    
    if not all_buyer_ids:
        logger.error("No buyers available! Exiting.")
        sys.exit(1)
    
    if not all_shop_ids:
        logger.error("No shops available! Exiting.")
        sys.exit(1)
    
    # Step 6: Create requests
    logger.info("Step 6: Creating requests...")
    requests = create_requests(all_buyer_ids, NUM_REQUESTS)
    
    if not requests:
        logger.error("No requests created. Exiting.")
        sys.exit(1)
    
    # Step 7: Create bids
    logger.info("Step 7: Creating bids...")
    bids = create_bids(requests, all_shop_ids)
    
    # Step 8: Create events
    logger.info("Step 8: Creating request events...")
    events = create_request_events(requests, bids, all_buyer_ids, all_shop_ids)
    
    # Step 9: Create auctions
    logger.info("Step 9: Creating auctions...")
    auctions = create_auctions(all_shop_ids, NUM_AUCTIONS)
    
    # Step 10: Create auction bids
    logger.info("Step 10: Creating auction bids...")
    auction_bids = create_auction_bids(auctions, all_buyer_ids, NUM_AUCTION_BIDS)
    
    # Step 11: Process lifecycle
    logger.info("Step 11: Processing lifecycle...")
    process_lifecycle(requests, bids)
    
    # Step 12: Summary
    logger.info("=" * 60)
    logger.info("SEED DATA SUMMARY (All with data_source='seed')")
    logger.info("=" * 60)
    
    result = supabase.table("profiles").select("id, role").execute()
    final_buyers = [p for p in result.data if p['role'] == 'buyer']
    final_shops = [p for p in result.data if p['role'] == 'shop_owner']
    
    result = supabase.table("requests").select("id, status, data_source").execute()
    requests_data = result.data
    status_counts = {}
    for r in requests_data:
        status_counts[r['status']] = status_counts.get(r['status'], 0) + 1
    
    result = supabase.table("bids").select("id, status, data_source").execute()
    bids_data = result.data
    bid_status_counts = {}
    for b in bids_data:
        bid_status_counts[b['status']] = bid_status_counts.get(b['status'], 0) + 1
    
    result = supabase.table("auctions").select("id, status, data_source").execute()
    auctions_data = result.data
    auction_status_counts = {}
    for a in auctions_data:
        auction_status_counts[a['status']] = auction_status_counts.get(a['status'], 0) + 1
    
    result = supabase.table("request_events").select("id, data_source").execute()
    events_count = len(result.data)
    
    result = supabase.table("auction_bids").select("id, data_source").execute()
    auction_bids_count = len(result.data)
    
    logger.info(f"Profiles: {len(final_buyers)} buyers, {len(final_shops)} shops")
    logger.info(f"Requests: {len(requests_data)} total (data_source='seed')")
    for status, count in status_counts.items():
        logger.info(f"  - {status}: {count}")
    logger.info(f"Bids: {len(bids_data)} total (data_source='seed')")
    for status, count in bid_status_counts.items():
        logger.info(f"  - {status}: {count}")
    logger.info(f"Auctions: {len(auctions_data)} total (data_source='seed')")
    for status, count in auction_status_counts.items():
        logger.info(f"  - {status}: {count}")
    logger.info(f"Request Events: {events_count} total (data_source='seed')")
    logger.info(f"Auction Bids: {auction_bids_count} total (data_source='seed')")
    
    logger.info("=" * 60)
    logger.info("Seed data generation complete!")
    logger.info("All data has data_source='seed'")
    logger.info("=" * 60)

if __name__ == "__main__":
    main()