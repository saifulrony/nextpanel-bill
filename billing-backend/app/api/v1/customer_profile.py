from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.database import get_db
from app.core.security import get_customer_user_id
from app.models import User

router = APIRouter()

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None

class ProfileResponse(BaseModel):
    id: str
    full_name: Optional[str]
    email: str
    phone: Optional[str]
    company: Optional[str]
    created_at: str
    updated_at: str

@router.get("/profile", response_model=ProfileResponse)
async def get_customer_profile(
    user_id: str = Depends(get_customer_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get customer profile information"""
    try:
        print(f"Getting profile for user_id: {user_id}")
        
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        print(f"User found: {user}")
        
        if not user:
            print(f"User not found for ID: {user_id}")
            raise HTTPException(status_code=404, detail="User not found")
        
        return ProfileResponse(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            company=user.company,
            created_at=user.created_at.isoformat() if user.created_at else "",
            updated_at=user.updated_at.isoformat() if user.updated_at else ""
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching customer profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch profile")

@router.put("/profile", response_model=ProfileResponse)
async def update_customer_profile(
    request: ProfileUpdateRequest,
    user_id: str = Depends(get_customer_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update customer profile information"""
    try:
        # Check if user exists
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if email is being changed and if it's already taken
        if request.email and request.email != user.email:
            existing_user = await db.execute(
                select(User).where(User.email == request.email, User.id != user_id)
            )
            if existing_user.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Email already in use")
        
        # Prepare update data
        update_data = {}
        if request.full_name is not None:
            update_data["full_name"] = request.full_name
        if request.email is not None:
            update_data["email"] = request.email
        if request.phone is not None:
            update_data["phone"] = request.phone
        if request.company is not None:
            update_data["company"] = request.company
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Update user
        await db.execute(
            update(User)
            .where(User.id == user_id)
            .values(**update_data)
        )
        await db.commit()
        
        # Fetch updated user
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        updated_user = result.scalar_one()
        
        return ProfileResponse(
            id=updated_user.id,
            full_name=updated_user.full_name,
            email=updated_user.email,
            phone=updated_user.phone,
            company=updated_user.company,
            created_at=updated_user.created_at.isoformat(),
            updated_at=updated_user.updated_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error updating customer profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

@router.get("/settings", response_model=dict)
async def get_customer_settings(
    user_id: str = Depends(get_customer_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get customer settings (notifications, security, preferences)"""
    try:
        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user settings from database
        from sqlalchemy import text
        settings_result = await db.execute(
            text("SELECT settings FROM user_settings WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        settings_row = settings_result.fetchone()
        
        if settings_row:
            # Return saved settings
            import json
            saved_settings = json.loads(settings_row[0])
            # Ensure the settings are wrapped in the expected format
            if "preferences" in saved_settings:
                return saved_settings
            else:
                # If preferences are saved directly, wrap them
                return {"preferences": saved_settings}
        else:
            # Return default settings if none exist
            default_settings = {
                "notifications": {
                    "email_notifications": True,
                    "sms_notifications": False,
                    "marketing_emails": False,
                    "billing_alerts": True,
                    "security_alerts": True,
                },
                "security": {
                    "two_factor_auth": False,
                    "login_alerts": True,
                    "session_timeout": 30,
                },
                "preferences": {
                    "timezone": "UTC",
                    "date_format": "MM/DD/YYYY",
                    "currency": "USD",
                    "language": "en",
                }
            }
            return default_settings
            
    except Exception as e:
        print(f"Error fetching customer settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch settings")

@router.put("/settings", response_model=dict)
async def update_customer_settings(
    settings: dict,
    user_id: str = Depends(get_customer_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update customer settings"""
    try:
        import json
        import uuid
        from datetime import datetime
        
        # Check if user settings already exist
        from sqlalchemy import text
        existing_result = await db.execute(
            text("SELECT id FROM user_settings WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        existing_row = existing_result.fetchone()
        
        settings_json = json.dumps(settings)
        
        if existing_row:
            # Update existing settings
            await db.execute(
                text("UPDATE user_settings SET settings = :settings, updated_at = :updated_at WHERE user_id = :user_id"),
                {
                    "settings": settings_json,
                    "updated_at": datetime.utcnow(),
                    "user_id": user_id
                }
            )
        else:
            # Insert new settings
            settings_id = str(uuid.uuid4())
            await db.execute(
                text("INSERT INTO user_settings (id, user_id, settings, created_at, updated_at) VALUES (:id, :user_id, :settings, :created_at, :updated_at)"),
                {
                    "id": settings_id,
                    "user_id": user_id,
                    "settings": settings_json,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            )
        
        await db.commit()
        
        return {
            "message": "Settings updated successfully",
            "settings": settings
        }
    except Exception as e:
        await db.rollback()
        print(f"Error updating customer settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update settings")
