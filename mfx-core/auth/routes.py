from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, Dict, Any
from uuid import UUID
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
    """Register a new user."""
    try:
        logger.info(f"Signup attempt for email: {request.email}")
        
        auth_response = supabase_anon.auth.sign_up({
            "email": request.email,
            "password": request.password
        })
        
        if not auth_response or not auth_response.user:
            logger.error("User creation failed - no user returned")
            raise HTTPException(status_code=400, detail="User creation failed")
        
        user_id = auth_response.user.id
        logger.info(f"User created with ID: {user_id}")
        
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
    """Authenticate a user."""
    try:
        logger.info(f"Login attempt for email: {request.email}")
        
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


@router.get("/profiles/{user_id}")
async def get_profile(
    user_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    """Get user profile by ID"""
    try:
        logger.info(f"=== GET PROFILE ===")
        logger.info(f"User ID requested: {user_id}")
        logger.info(f"Current user: {current_user}")
        
        response = supabase_admin.table("profiles") \
            .select("*") \
            .eq("id", str(user_id)) \
            .execute()
        
        logger.info(f"Profile response data: {response.data}")
        
        if not response.data:
            logger.error(f"Profile not found for ID: {user_id}")
            raise HTTPException(status_code=404, detail="Profile not found")
        
        profile = response.data[0]
        return {
            "id": profile.get("id"),
            "shop_name": profile.get("shop_name"),
            "phone": profile.get("phone"),
            "address": profile.get("address"),
            "pincode": profile.get("pincode"),
            "role": profile.get("role"),
            "full_name": profile.get("full_name"),
            "bio": profile.get("bio"),
            "profile_photo_url": profile.get("profile_photo_url"),
            "date_of_birth": profile.get("date_of_birth"),
            "gender": profile.get("gender"),
            "preferred_categories": profile.get("preferred_categories"),
            "business_hours": profile.get("business_hours"),
            "years_in_business": profile.get("years_in_business"),
            "gst_number": profile.get("gst_number"),
            "is_verified": profile.get("is_verified")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get profile error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ====== NEW: Update Profile Endpoint ======

@router.patch("/profiles/{user_id}")
async def update_profile(
    user_id: UUID,
    profile_data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """
    Update a user's profile.
    Users can only update their own profile.
    """
    if current_user["id"] != str(user_id):
        raise HTTPException(
            status_code=403,
            detail="You can only update your own profile"
        )
    
    try:
        logger.info(f"=== UPDATE PROFILE ===")
        logger.info(f"User ID: {user_id}")
        logger.info(f"Update data: {profile_data}")
        
        # Check if profile exists
        check_response = supabase_admin.table("profiles") \
            .select("id") \
            .eq("id", str(user_id)) \
            .execute()
        
        if not check_response.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Remove immutable fields
        immutable_fields = ["id", "role", "created_at", "total_transactions", "completed_transactions", "is_verified"]
        for field in immutable_fields:
            profile_data.pop(field, None)
        
        profile_data.pop("role", None)
        
        # Clean up - convert empty strings to None for date and other fields
        # This prevents PostgreSQL errors with invalid data types
        update_dict = {}
        for k, v in profile_data.items():
            if v is None:
                continue
            # Convert empty strings to None for fields that expect NULL
            if v == "" and k in ["date_of_birth", "gender", "profile_photo_url", "gst_number"]:
                continue  # Skip empty strings, leave as NULL in DB
            elif v == "":
                continue  # Skip other empty strings
            else:
                update_dict[k] = v
        
        # Special handling for date_of_birth - ensure valid date format
        if "date_of_birth" in profile_data and profile_data["date_of_birth"]:
            try:
                # Validate date format
                from datetime import datetime
                datetime.strptime(profile_data["date_of_birth"], "%Y-%m-%d")
                update_dict["date_of_birth"] = profile_data["date_of_birth"]
            except ValueError:
                # Invalid date, skip it
                logger.warning(f"Invalid date format: {profile_data['date_of_birth']}")
        
        # Special handling for preferred_categories - ensure it's a list
        if "preferred_categories" in profile_data:
            if isinstance(profile_data["preferred_categories"], list):
                update_dict["preferred_categories"] = profile_data["preferred_categories"]
            else:
                update_dict["preferred_categories"] = []
        
        if not update_dict:
            return {
                "message": "No fields to update",
                "profile": check_response.data[0]
            }
        
        logger.info(f"Updating profile {user_id} with: {update_dict}")
        
        response = supabase_admin.table("profiles") \
            .update(update_dict) \
            .eq("id", str(user_id)) \
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to update profile")
        
        updated_profile = response.data[0]
        logger.info(f"Profile updated successfully: {user_id}")
        
        return {
            "message": "Profile updated successfully",
            "profile": updated_profile
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating profile {user_id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))