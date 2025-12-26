"""
VPS API Key Management API for customers
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_customer_user_id
from app.models.vps_api_key import VPSAPIKey
import secrets

router = APIRouter()


class VPSAPIKeyCreate(BaseModel):
    name: str = Field(..., description="User-friendly name for the API key")
    vps_panel_url: Optional[str] = Field(None, description="URL of the VPS panel")
    description: Optional[str] = Field(None, description="Optional description")
    expires_in_days: Optional[int] = Field(None, description="Number of days until expiration (optional)")
    permissions: Optional[str] = Field(None, description="JSON string of allowed permissions")


class VPSAPIKeyUpdate(BaseModel):
    name: Optional[str] = None
    vps_panel_url: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None
    permissions: Optional[str] = None


class VPSAPIKeyResponse(BaseModel):
    id: str
    customer_id: str
    name: str
    api_key: str  # Show full key only on creation
    vps_panel_url: Optional[str]
    is_active: bool
    last_used_at: Optional[datetime]
    expires_at: Optional[datetime]
    description: Optional[str]
    permissions: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class VPSAPIKeyListResponse(BaseModel):
    id: str
    customer_id: str
    name: str
    api_key: str  # Masked key for listing
    vps_panel_url: Optional[str]
    is_active: bool
    last_used_at: Optional[datetime]
    expires_at: Optional[datetime]
    description: Optional[str]
    permissions: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


def mask_api_key(api_key: str) -> str:
    """Mask API key for display (show first 8 and last 4 characters)"""
    if len(api_key) <= 12:
        return "*" * len(api_key)
    return f"{api_key[:8]}...{api_key[-4:]}"


@router.get("/", response_model=List[VPSAPIKeyListResponse])
async def list_api_keys(
    user_id: str = Depends(get_customer_user_id),
    db: AsyncSession = Depends(get_db)
):
    """List all API keys for the current customer"""
    result = await db.execute(
        select(VPSAPIKey).where(VPSAPIKey.customer_id == user_id)
    )
    keys = result.scalars().all()
    
    # Mask API keys in response
    response = []
    for key in keys:
        key_dict = {
            **key.__dict__,
            "api_key": mask_api_key(key.api_key)
        }
        response.append(VPSAPIKeyListResponse(**key_dict))
    
    return response


@router.post("/", response_model=VPSAPIKeyResponse)
async def create_api_key(
    request: VPSAPIKeyCreate,
    user_id: str = Depends(get_customer_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new API key"""
    # Generate API key
    api_key_value = f"vps_{secrets.token_urlsafe(32)}"
    
    # Calculate expiration if provided
    expires_at = None
    if request.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=request.expires_in_days)
    
    # Create API key
    new_key = VPSAPIKey(
        customer_id=user_id,
        name=request.name,
        api_key=api_key_value,
        vps_panel_url=request.vps_panel_url or "http://192.168.10.203:12000",
        description=request.description,
        expires_at=expires_at,
        permissions=request.permissions or '["start", "stop", "restart", "status"]',
        is_active=True
    )
    
    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)
    
    return VPSAPIKeyResponse(
        id=new_key.id,
        customer_id=new_key.customer_id,
        name=new_key.name,
        api_key=new_key.api_key,  # Show full key on creation
        vps_panel_url=new_key.vps_panel_url,
        is_active=new_key.is_active,
        last_used_at=new_key.last_used_at,
        expires_at=new_key.expires_at,
        description=new_key.description,
        permissions=new_key.permissions,
        created_at=new_key.created_at,
        updated_at=new_key.updated_at
    )


@router.get("/{key_id}", response_model=VPSAPIKeyListResponse)
async def get_api_key(
    key_id: str,
    user_id: str = Depends(get_customer_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific API key (masked)"""
    result = await db.execute(
        select(VPSAPIKey).where(
            VPSAPIKey.id == key_id,
            VPSAPIKey.customer_id == user_id
        )
    )
    key = result.scalar_one_or_none()
    
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    # Return masked key
    key_dict = {
        **key.__dict__,
        "api_key": mask_api_key(key.api_key)
    }
    return VPSAPIKeyListResponse(**key_dict)


@router.put("/{key_id}", response_model=VPSAPIKeyListResponse)
async def update_api_key(
    key_id: str,
    request: VPSAPIKeyUpdate,
    user_id: str = Depends(get_customer_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update an API key"""
    result = await db.execute(
        select(VPSAPIKey).where(
            VPSAPIKey.id == key_id,
            VPSAPIKey.customer_id == user_id
        )
    )
    key = result.scalar_one_or_none()
    
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    # Update fields
    update_data = request.dict(exclude_unset=True)
    if update_data:
        await db.execute(
            update(VPSAPIKey)
            .where(VPSAPIKey.id == key_id)
            .values(**update_data, updated_at=datetime.utcnow())
        )
        await db.commit()
        await db.refresh(key)
    
    # Return masked key
    key_dict = {
        **key.__dict__,
        "api_key": mask_api_key(key.api_key)
    }
    return VPSAPIKeyListResponse(**key_dict)


@router.delete("/{key_id}")
async def delete_api_key(
    key_id: str,
    user_id: str = Depends(get_customer_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete an API key"""
    result = await db.execute(
        select(VPSAPIKey).where(
            VPSAPIKey.id == key_id,
            VPSAPIKey.customer_id == user_id
        )
    )
    key = result.scalar_one_or_none()
    
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    await db.delete(key)
    await db.commit()
    
    return {"message": "API key deleted successfully"}


@router.post("/{key_id}/regenerate", response_model=VPSAPIKeyResponse)
async def regenerate_api_key(
    key_id: str,
    user_id: str = Depends(get_customer_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Regenerate an API key (creates new key, invalidates old one)"""
    result = await db.execute(
        select(VPSAPIKey).where(
            VPSAPIKey.id == key_id,
            VPSAPIKey.customer_id == user_id
        )
    )
    key = result.scalar_one_or_none()
    
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    
    # Generate new API key
    new_api_key = f"vps_{secrets.token_urlsafe(32)}"
    
    await db.execute(
        update(VPSAPIKey)
        .where(VPSAPIKey.id == key_id)
        .values(api_key=new_api_key, updated_at=datetime.utcnow())
    )
    await db.commit()
    await db.refresh(key)
    
    # Return full key on regeneration
    return VPSAPIKeyResponse(
        id=key.id,
        customer_id=key.customer_id,
        name=key.name,
        api_key=key.api_key,  # Show full key on regeneration
        vps_panel_url=key.vps_panel_url,
        is_active=key.is_active,
        last_used_at=key.last_used_at,
        expires_at=key.expires_at,
        description=key.description,
        permissions=key.permissions,
        created_at=key.created_at,
        updated_at=key.updated_at
    )

