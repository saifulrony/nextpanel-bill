"""
Authentication API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field, validator
from typing import Optional
from app.core.database import get_db
from app.core.security import (
    hash_password, 
    verify_password, 
    create_access_token, 
    create_refresh_token,
    get_current_user_id
)
from app.models import User
from app.schemas import UserRegister, UserLogin, Token, UserResponse
import secrets
import re

router = APIRouter(prefix="/auth", tags=["auth"])


class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if v is not None and v != '':
            v = v.strip()
            if len(v) < 2:
                raise ValueError('Full name must be at least 2 characters')
        return v
    
    @validator('new_password')
    def validate_password_strength(cls, v):
        if v is not None and v != '':
            if len(v) < 6:
                raise ValueError('Password must be at least 6 characters')
            # Check for at least one uppercase, one lowercase, and one number
            if not re.search(r'[A-Z]', v):
                raise ValueError('Password must contain at least one uppercase letter')
            if not re.search(r'[a-z]', v):
                raise ValueError('Password must contain at least one lowercase letter')
            if not re.search(r'\d', v):
                raise ValueError('Password must contain at least one number')
        return v
    
    class Config:
        extra = 'forbid'  # Reject extra fields


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        company_name=user_data.company_name,
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login and get access token"""
    # Find user
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalars().first()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": user.id, "is_admin": user.is_admin})
    refresh_token = create_refresh_token(data={"sub": user.id, "is_admin": user.is_admin})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get current user info"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    request: UserProfileUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's profile"""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Update profile request: {request.dict()}")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update allowed fields
    if request.full_name is not None:
        user.full_name = request.full_name
    
    if request.company_name is not None:
        user.company_name = request.company_name
    
    # Handle password change if provided
    if request.current_password and request.new_password:
        # Verify current password
        if not verify_password(request.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )
        
        # Check if new password is different from current password
        if verify_password(request.new_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password"
            )
        
        # Update password
        user.password_hash = hash_password(request.new_password)
    
    await db.commit()
    await db.refresh(user)
    
    return user

