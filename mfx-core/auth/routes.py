from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, validator
from typing import Optional
import logging
from auth.dependencies import supabase_anon, supabase_admin, get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

# ----- Request/Response Models -----

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    role: str
    address: str
    pincode: str
    phone: str
    shop_name: Optional[str] = None
    
    @validator('role')
    def validate_role(cls, v):
        if v not in ['buyer', 'shop_owner']:
            raise ValueError('role must be either "buyer" or "shop_owner"')
        return v
    
    @validator('pincode')
    def validate_pincode(cls, v):
        if len(v) != 6 or not v.isdigit():
            raise ValueError('pincode must be 6 digits')
        return v

class SignupResponse(BaseModel):
    user_id: str
    email: str
    role: str
    pincode: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    role: str
    user_id: str

# ----- Routes -----

@router.post("/signup", response_model=SignupResponse, status_code=201)
async def signup(request: SignupRequest):
    """
    Register a new user.
    """
    try:
        logger.info(f"Signup attempt for email: {request.email}")
        
        # 1. Create user with Supabase Auth (using ANON key)
        auth_response = supabase_anon.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        
        if not auth_response or not auth_response.user:
            logger.error("User creation failed - no user returned")
            raise HTTPException(status_code=400, detail="User creation failed")
        
        user_id = auth_response.user.id
        logger.info(f"User created with ID: {user_id}")
        
        # 2. Insert profile using ADMIN key (bypasses RLS)
        profile_data = {
            "id": user_id,
            "role": request.role,
            "address": request.address,
            "pincode": request.pincode,
            "phone": request.phone
        }
        
        if request.role == "shop_owner" and request.shop_name:
            profile_data["shop_name"] = request.shop_name
        
        logger.info(f"Inserting profile: {profile_data}")
        
        profile_response = supabase_admin.table("profiles").insert(profile_data).execute()
        
        if not profile_response.data:
            logger.error("Profile creation failed")
            # Clean up - delete the auth user if profile creation fails
            supabase_admin.auth.admin.delete_user(user_id)
            raise HTTPException(status_code=400, detail="Profile creation failed")
        
        return SignupResponse(
            user_id=user_id,
            email=request.email,
            role=request.role,
            pincode=request.pincode
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Signup failed: {str(e)}")


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate a user.
    """
    try:
        logger.info(f"Login attempt for email: {request.email}")
        
        # 1. Sign in with password (using ANON key)
        auth_response = supabase_anon.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not auth_response or not auth_response.user:
            logger.error("Invalid credentials")
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user_id = auth_response.user.id
        access_token = auth_response.session.access_token
        
        logger.info(f"User logged in: {user_id}")
        
        # 2. Fetch role from profiles (using ANON key for regular user access)
        profile_response = supabase_anon.table("profiles") \
            .select("role") \
            .eq("id", user_id) \
            .execute()
        
        if not profile_response.data:
            logger.error(f"Profile not found for user: {user_id}")
            raise HTTPException(status_code=404, detail="Profile not found")
        
        role = profile_response.data[0]["role"]
        
        return LoginResponse(
            access_token=access_token,
            role=role,
            user_id=user_id
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Login failed: {str(e)}")