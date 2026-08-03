import os
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from typing import Dict, Any
import logging
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Debug: Print loaded values
logger.info(f"SUPABASE_URL: {SUPABASE_URL}")
logger.info(f"SUPABASE_ANON_KEY loaded: {SUPABASE_ANON_KEY is not None}")
logger.info(f"SUPABASE_SERVICE_ROLE_KEY loaded: {SUPABASE_SERVICE_ROLE_KEY is not None}")

# Validate environment variables
if not SUPABASE_URL:
    logger.error("SUPABASE_URL is not set in environment")
    raise ValueError("SUPABASE_URL must be set")
if not SUPABASE_ANON_KEY:
    logger.error("SUPABASE_ANON_KEY is not set in environment")
    raise ValueError("SUPABASE_ANON_KEY must be set")
if not SUPABASE_SERVICE_ROLE_KEY:
    logger.error("SUPABASE_SERVICE_ROLE_KEY is not set in environment")
    raise ValueError("SUPABASE_SERVICE_ROLE_KEY must be set")

# Clean URL - remove any trailing paths
SUPABASE_URL = SUPABASE_URL.rstrip('/')
# Remove /rest/v1 if present
if SUPABASE_URL.endswith('/rest/v1'):
    SUPABASE_URL = SUPABASE_URL[:-8]  # Remove '/rest/v1'
elif '/rest/v1' in SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.split('/rest/v1')[0]

logger.info(f"Cleaned SUPABASE_URL: {SUPABASE_URL}")

# Initialize clients
try:
    # Use ANON key for auth operations
    supabase_anon: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    # Use SERVICE ROLE key for admin operations (bypasses RLS)
    supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    logger.info(f"✅ Supabase clients initialized with URL: {SUPABASE_URL}")
except Exception as e:
    logger.error(f"❌ Failed to initialize Supabase clients: {str(e)}")
    raise

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Validates the Bearer token and returns the current user with role from profiles table.
    """
    token = credentials.credentials

    try:
        user = supabase_anon.auth.get_user(token)

        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid authentication token")

        user_id = user.user.id

        # Fetch role from profiles table (bypass RLS with admin client)
        profile = supabase_admin.table("profiles").select("role").eq("id", user_id).single().execute()

        if not profile.data:
            raise HTTPException(status_code=404, detail="Profile not found for this user")

        return {
            "id": user_id,
            "email": user.user.email,
            "role": profile.data["role"]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")