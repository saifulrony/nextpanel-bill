"""
Security API endpoints for IP whitelist/blacklist management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel, validator
from app.core.database import get_db
from app.core.security import require_admin
from app.models import SystemSetting
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/security", tags=["security"])


class IPListResponse(BaseModel):
    whitelist: List[str]
    blacklist: List[str]


class IPAddressRequest(BaseModel):
    ip_address: str
    
    @validator('ip_address')
    def validate_ip(cls, v):
        # Basic IP validation (IPv4)
        import re
        ip_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        if not re.match(ip_pattern, v):
            raise ValueError('Invalid IP address format')
        
        # Validate each octet is 0-255
        parts = v.split('.')
        for part in parts:
            num = int(part)
            if num < 0 or num > 255:
                raise ValueError('Invalid IP address: octet must be 0-255')
        
        return v


@router.get("/ip-lists", response_model=IPListResponse)
async def get_ip_lists(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Get IP whitelist and blacklist (admin only)"""
    # Get whitelist
    whitelist_result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "security_ip_whitelist")
    )
    whitelist_setting = whitelist_result.scalars().first()
    
    # Get blacklist
    blacklist_result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "security_ip_blacklist")
    )
    blacklist_setting = blacklist_result.scalars().first()
    
    # Parse JSON values or return empty lists
    whitelist = []
    blacklist = []
    
    if whitelist_setting and whitelist_setting.value:
        try:
            whitelist = json.loads(whitelist_setting.value) if isinstance(whitelist_setting.value, str) else whitelist_setting.value
            if not isinstance(whitelist, list):
                whitelist = []
        except (json.JSONDecodeError, TypeError):
            whitelist = []
    
    if blacklist_setting and blacklist_setting.value:
        try:
            blacklist = json.loads(blacklist_setting.value) if isinstance(blacklist_setting.value, str) else blacklist_setting.value
            if not isinstance(blacklist, list):
                blacklist = []
        except (json.JSONDecodeError, TypeError):
            blacklist = []
    
    return IPListResponse(whitelist=whitelist, blacklist=blacklist)


@router.post("/ip-lists/whitelist", response_model=IPListResponse)
async def add_to_whitelist(
    request: IPAddressRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Add IP address to whitelist (admin only)"""
    # Get existing whitelist
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "security_ip_whitelist")
    )
    setting = result.scalars().first()
    
    # Parse existing list
    ip_list = []
    if setting and setting.value:
        try:
            ip_list = json.loads(setting.value) if isinstance(setting.value, str) else setting.value
            if not isinstance(ip_list, list):
                ip_list = []
        except (json.JSONDecodeError, TypeError):
            ip_list = []
    
    # Check if already exists
    if request.ip_address in ip_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="IP address already in whitelist"
        )
    
    # Add IP
    ip_list.append(request.ip_address)
    
    # Save to database
    if setting:
        setting.value = json.dumps(ip_list)
        setting.updated_by = current_user_id
    else:
        setting = SystemSetting(
            key="security_ip_whitelist",
            value=json.dumps(ip_list),
            value_type="json",
            category="security",
            display_name="IP Whitelist",
            description="List of allowed IP addresses",
            is_public=False,
            updated_by=current_user_id
        )
        db.add(setting)
    
    await db.commit()
    await db.refresh(setting)
    
    logger.info(f"Added IP {request.ip_address} to whitelist by user {current_user_id}")
    
    # Return updated lists
    return await get_ip_lists(db, current_user_id)


@router.post("/ip-lists/blacklist", response_model=IPListResponse)
async def add_to_blacklist(
    request: IPAddressRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Add IP address to blacklist (admin only)"""
    # Get existing blacklist
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "security_ip_blacklist")
    )
    setting = result.scalars().first()
    
    # Parse existing list
    ip_list = []
    if setting and setting.value:
        try:
            ip_list = json.loads(setting.value) if isinstance(setting.value, str) else setting.value
            if not isinstance(ip_list, list):
                ip_list = []
        except (json.JSONDecodeError, TypeError):
            ip_list = []
    
    # Check if already exists
    if request.ip_address in ip_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="IP address already in blacklist"
        )
    
    # Add IP
    ip_list.append(request.ip_address)
    
    # Save to database
    if setting:
        setting.value = json.dumps(ip_list)
        setting.updated_by = current_user_id
    else:
        setting = SystemSetting(
            key="security_ip_blacklist",
            value=json.dumps(ip_list),
            value_type="json",
            category="security",
            display_name="IP Blacklist",
            description="List of blocked IP addresses",
            is_public=False,
            updated_by=current_user_id
        )
        db.add(setting)
    
    await db.commit()
    await db.refresh(setting)
    
    logger.info(f"Added IP {request.ip_address} to blacklist by user {current_user_id}")
    
    # Return updated lists
    return await get_ip_lists(db, current_user_id)


@router.delete("/ip-lists/whitelist/{ip_address}", response_model=IPListResponse)
async def remove_from_whitelist(
    ip_address: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Remove IP address from whitelist (admin only)"""
    # Get existing whitelist
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "security_ip_whitelist")
    )
    setting = result.scalars().first()
    
    if not setting or not setting.value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IP address not found in whitelist"
        )
    
    # Parse existing list
    try:
        ip_list = json.loads(setting.value) if isinstance(setting.value, str) else setting.value
        if not isinstance(ip_list, list):
            ip_list = []
    except (json.JSONDecodeError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid whitelist data"
        )
    
    # Check if exists
    if ip_address not in ip_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IP address not found in whitelist"
        )
    
    # Remove IP
    ip_list.remove(ip_address)
    
    # Save to database
    setting.value = json.dumps(ip_list)
    setting.updated_by = current_user_id
    
    await db.commit()
    await db.refresh(setting)
    
    logger.info(f"Removed IP {ip_address} from whitelist by user {current_user_id}")
    
    # Return updated lists
    return await get_ip_lists(db, current_user_id)


@router.delete("/ip-lists/blacklist/{ip_address}", response_model=IPListResponse)
async def remove_from_blacklist(
    ip_address: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Remove IP address from blacklist (admin only)"""
    # Get existing blacklist
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "security_ip_blacklist")
    )
    setting = result.scalars().first()
    
    if not setting or not setting.value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IP address not found in blacklist"
        )
    
    # Parse existing list
    try:
        ip_list = json.loads(setting.value) if isinstance(setting.value, str) else setting.value
        if not isinstance(ip_list, list):
            ip_list = []
    except (json.JSONDecodeError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid blacklist data"
        )
    
    # Check if exists
    if ip_address not in ip_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IP address not found in blacklist"
        )
    
    # Remove IP
    ip_list.remove(ip_address)
    
    # Save to database
    setting.value = json.dumps(ip_list)
    setting.updated_by = current_user_id
    
    await db.commit()
    await db.refresh(setting)
    
    logger.info(f"Removed IP {ip_address} from blacklist by user {current_user_id}")
    
    # Return updated lists
    return await get_ip_lists(db, current_user_id)

