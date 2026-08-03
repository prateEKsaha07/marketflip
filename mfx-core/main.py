from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth.routes import router as auth_router
from requests.routes import router as requests_router
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Auth API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(requests_router)
@app.on_event("startup")
async def startup_event():
    """Check Supabase connection on startup"""
    try:
        from auth.dependencies import supabase_anon, supabase_admin
        
        # Test connection with ANON key
        test_anon = supabase_anon.table("profiles").select("count").limit(1).execute()
        logger.info("✅ Supabase ANON connection successful")
        
        # Test connection with SERVICE ROLE key
        test_admin = supabase_admin.table("profiles").select("count").limit(1).execute()
        logger.info("✅ Supabase SERVICE ROLE connection successful")
        
    except Exception as e:
        logger.error(f"❌ Supabase connection failed: {str(e)}")
        logger.error("Please check environment variables")

@app.get("/")
async def root():
    return {"message": "Auth API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)