from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MarketFlip API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://marketflip-mauve.vercel.app",
        "https://marketflip.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# IMPORT ROUTERS (after app initialization)
# ============================================

# Import routers
try:
    from auth.routes import router as auth_router
    logger.info("Auth router imported successfully")
except Exception as e:
    logger.error(f"Failed to import auth router: {e}")

try:
    from requests.routes import router as requests_router
    logger.info("Requests router imported successfully")
except Exception as e:
    logger.error(f"Failed to import requests router: {e}")

try:
    from bids.routes import router as bids_router, bid_router
    logger.info("Bids router imported successfully")
except Exception as e:
    logger.error(f"Failed to import bids router: {e}")

# ============================================
# INCLUDE ROUTERS
# ============================================

app.include_router(auth_router)
app.include_router(requests_router)
app.include_router(bids_router)
app.include_router(bid_router)

# ============================================
# STARTUP EVENT
# ============================================

@app.on_event("startup")
async def startup_event():
    """Check Supabase connection on startup"""
    try:
        from auth.dependencies import supabase_anon, supabase_admin
        
        # Test connection with ANON key
        test_anon = supabase_anon.table("profiles").select("count").limit(1).execute()
        logger.info("Supabase ANON connection successful")
        
        # Test connection with SERVICE ROLE key
        test_admin = supabase_admin.table("profiles").select("count").limit(1).execute()
        logger.info("Supabase SERVICE ROLE connection successful")
        
    except Exception as e:
        logger.error(f"Supabase connection failed: {str(e)}")
        logger.error("Please check environment variables")

# ============================================
# ROOT ENDPOINT
# ============================================

@app.get("/")
async def root():
    return {
        "message": "MarketFlip API is running",
        "version": "2.0.0",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)