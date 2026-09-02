from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MarketFlip API", version="2.0.0", redirect_slashes=False)

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

# IMPORT ROUTERS
from auth.routes import router as auth_router
from requests.routes import router as requests_router
from bids.routes import router as bids_router, bid_router
from routes.upload import router as upload_router
from auctions.routes import router as auctions_router
from chat.routes import router as chat_router
from reports.routes import router as reports_router
from notifications.routes import router as notifications_router
from saved_searches.routes import router as saved_searches_router
from favorites.routes import router as favorites_router
from reliability.routes import router as reliability_router
from ml.routes import router as ml_router
logger.info("All routers imported successfully")

# INCLUDE ROUTERS
app.include_router(auth_router)
app.include_router(requests_router)
app.include_router(bids_router)
app.include_router(bid_router)
app.include_router(upload_router)
app.include_router(auctions_router)
app.include_router(chat_router)
app.include_router(reports_router)
app.include_router(notifications_router)
app.include_router(saved_searches_router)
app.include_router(favorites_router)
app.include_router(reliability_router)
app.include_router(ml_router)
logger.info("All routers included successfully")

# STARTUP EVENT
@app.on_event("startup")
async def startup_event():
    """Check Supabase and Cloudinary connections on startup"""
    
    # Check Supabase
    try:
        from auth.dependencies import supabase_anon, supabase_admin
        
        supabase_anon.table("profiles").select("count").limit(1).execute()
        logger.info("Supabase ANON connection successful")
        
        supabase_admin.table("profiles").select("count").limit(1).execute()
        logger.info("Supabase SERVICE ROLE connection successful")
        
    except Exception as e:
        logger.error(f"Supabase connection failed: {str(e)}")
    
    # Check Cloudinary
    try:
        import cloudinary
        from utils.cloudinary_config import CLOUDINARY_CLOUD_NAME
        
        if CLOUDINARY_CLOUD_NAME:
            logger.info(f"Cloudinary configured with cloud name: {CLOUDINARY_CLOUD_NAME}")
            
            # Test upload by checking config (no actual upload)
            config = cloudinary.config()
            if config.cloud_name:
                logger.info("Cloudinary connection verified")
            else:
                logger.warning("Cloudinary config loaded but cloud_name is empty")
        else:
            logger.warning("Cloudinary credentials not set. Image upload will not work.")
            
    except ImportError:
        logger.warning("Cloudinary package not installed. Image upload will not work.")
    except Exception as e:
        logger.warning(f"Cloudinary verification failed: {str(e)}")


# ROOT ENDPOINTS
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