"""
System Settings API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user_id, require_admin
from app.models import SystemSetting
from app.schemas import (
    SystemSettingResponse,
    SystemSettingUpdateRequest,
    BulkSettingsUpdateRequest
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/", response_model=List[SystemSettingResponse])
async def list_settings(
    db: AsyncSession = Depends(get_db),
    category: Optional[str] = None,
    is_public: Optional[bool] = None
):
    """List all system settings (admin sees all, users see public only)"""
    try:
        user_id = await require_admin()
        is_admin = True
    except:
        is_admin = False
    
    query = select(SystemSetting)
    
    # Non-admins can only see public settings
    if not is_admin:
        query = query.where(SystemSetting.is_public == True)
    
    # Apply filters
    if category:
        query = query.where(SystemSetting.category == category)
    if is_public is not None:
        query = query.where(SystemSetting.is_public == is_public)
    
    query = query.order_by(SystemSetting.category, SystemSetting.key)
    
    result = await db.execute(query)
    settings = result.scalars().all()
    
    return settings


@router.get("/{key}", response_model=SystemSettingResponse)
async def get_setting(
    key: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific setting by key"""
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == key)
    )
    setting = result.scalars().first()
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    # Check if user can access this setting
    try:
        await require_admin()
    except:
        if not setting.is_public:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return setting


@router.put("/{key}", response_model=SystemSettingResponse)
async def update_setting(
    key: str,
    request: SystemSettingUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Update a system setting (admin only)"""
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == key)
    )
    setting = result.scalars().first()
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    setting.value = request.value
    setting.updated_by = current_user_id
    
    await db.commit()
    await db.refresh(setting)
    
    logger.info(f"Updated setting: {key} = {request.value}")
    
    return setting


@router.post("/bulk", response_model=Dict[str, Any])
async def bulk_update_settings(
    request: BulkSettingsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Bulk update multiple settings (admin only)"""
    updated_count = 0
    errors = []
    
    for key, value in request.settings.items():
        try:
            result = await db.execute(
                select(SystemSetting).where(SystemSetting.key == key)
            )
            setting = result.scalars().first()
            
            if setting:
                setting.value = value
                setting.updated_by = current_user_id
                updated_count += 1
            else:
                errors.append(f"Setting not found: {key}")
        except Exception as e:
            errors.append(f"Error updating {key}: {str(e)}")
    
    await db.commit()
    
    return {
        "updated_count": updated_count,
        "errors": errors,
        "message": f"Updated {updated_count} settings"
    }


@router.get("/public/all", response_model=Dict[str, str])
async def get_public_settings(
    db: AsyncSession = Depends(get_db)
):
    """Get all public settings as a key-value map"""
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.is_public == True)
    )
    settings = result.scalars().all()
    
    return {setting.key: setting.value for setting in settings if setting.value}


@router.post("/initialize")
async def initialize_default_settings(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Initialize default system settings (admin only, run once)"""
    default_settings = [
        # Time Settings
        {
            "key": "system_timezone",
            "value": "UTC",
            "value_type": "string",
            "category": "time",
            "display_name": "System Timezone",
            "description": "Default timezone for the system",
            "is_public": True
        },
        {
            "key": "date_format",
            "value": "YYYY-MM-DD",
            "value_type": "string",
            "category": "time",
            "display_name": "Date Format",
            "description": "Default date display format",
            "is_public": True
        },
        {
            "key": "time_format",
            "value": "24h",
            "value_type": "string",
            "category": "time",
            "display_name": "Time Format",
            "description": "12-hour or 24-hour time format",
            "is_public": True
        },
        # General Settings
        {
            "key": "site_name",
            "value": "NextPanel Billing",
            "value_type": "string",
            "category": "general",
            "display_name": "Site Name",
            "description": "Name of your site",
            "is_public": True
        },
        {
            "key": "support_email",
            "value": "support@nextpanel.com",
            "value_type": "string",
            "category": "general",
            "display_name": "Support Email",
            "description": "Email address for customer support",
            "is_public": True
        },
        {
            "key": "currency_symbol",
            "value": "$",
            "value_type": "string",
            "category": "general",
            "display_name": "Currency Symbol",
            "description": "Default currency symbol",
            "is_public": True
        },
    ]
    
    created_count = 0
    for setting_data in default_settings:
        # Check if already exists
        result = await db.execute(
            select(SystemSetting).where(SystemSetting.key == setting_data["key"])
        )
        existing = result.scalars().first()
        
        if not existing:
            setting = SystemSetting(
                **setting_data,
                updated_by=current_user_id
            )
            db.add(setting)
            created_count += 1
    
    await db.commit()
    
    return {
        "message": f"Initialized {created_count} default settings",
        "created_count": created_count
    }

