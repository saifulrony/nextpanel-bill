"""
Marketplace and Addons API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user_id, require_admin
from app.models import Addon, AddonInstallation, AddonStatus, AddonCategory
from app.schemas import (
    AddonResponse,
    AddonInstallRequest,
    AddonInstallationResponse
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/marketplace", tags=["marketplace"])


@router.get("/addons", response_model=List[AddonResponse])
async def list_addons(
    db: AsyncSession = Depends(get_db),
    category: Optional[AddonCategory] = None,
    status_filter: Optional[AddonStatus] = None,
    is_premium: Optional[bool] = None
):
    """List all available addons in marketplace"""
    query = select(Addon)
    
    # Apply filters
    if category:
        query = query.where(Addon.category == category)
    if status_filter:
        query = query.where(Addon.status == status_filter)
    # Note: Removed default status filter to show all addons initially
    # else:
    #     query = query.where(Addon.status.in_([AddonStatus.ACTIVE, AddonStatus.BETA]))
    if is_premium is not None:
        query = query.where(Addon.is_premium == is_premium)
    
    query = query.order_by(Addon.install_count.desc(), Addon.rating_average.desc())
    
    result = await db.execute(query)
    addons = result.scalars().all()
    
    # Check which addons are installed
    installations_result = await db.execute(select(AddonInstallation))
    installations = installations_result.scalars().all()
    installed_addon_ids = {installation.addon_id for installation in installations}
    
    # Add is_installed flag
    for addon in addons:
        addon.is_installed = addon.id in installed_addon_ids
    
    return addons


@router.get("/addons/{addon_id}", response_model=AddonResponse)
async def get_addon(
    addon_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get addon details"""
    result = await db.execute(
        select(Addon).where(Addon.id == addon_id)
    )
    addon = result.scalars().first()
    
    if not addon:
        raise HTTPException(status_code=404, detail="Addon not found")
    
    # Check if installed
    installation_result = await db.execute(
        select(AddonInstallation).where(AddonInstallation.addon_id == addon_id)
    )
    installation = installation_result.scalars().first()
    addon.is_installed = installation is not None
    
    return addon


@router.get("/installed", response_model=List[AddonInstallationResponse])
async def list_installed_addons(
    db: AsyncSession = Depends(get_db)
):
    """List all installed addons"""
    result = await db.execute(
        select(AddonInstallation).where(AddonInstallation.is_enabled == True)
    )
    installations = result.scalars().all()
    
    # Load addon details for each installation
    for installation in installations:
        addon_result = await db.execute(
            select(Addon).where(Addon.id == installation.addon_id)
        )
        installation.addon = addon_result.scalars().first()
    
    return installations


@router.post("/install", response_model=AddonInstallationResponse)
async def install_addon(
    request: AddonInstallRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Install an addon (admin only) - Downloads and installs plugin files"""
    # Check if addon exists
    result = await db.execute(
        select(Addon).where(Addon.id == request.addon_id)
    )
    addon = result.scalars().first()
    
    if not addon:
        raise HTTPException(status_code=404, detail="Addon not found")
    
    # Check if already installed
    result = await db.execute(
        select(AddonInstallation).where(AddonInstallation.addon_id == request.addon_id)
    )
    existing = result.scalars().first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Addon is already installed"
        )
    
    try:
        # Install plugin files (download from local/remote source)
        from app.core.plugin_installer import PluginInstaller
        installer = PluginInstaller()
        install_result = await installer.install(addon.name, addon.version)
        
        # Create installation record in database
        installation = AddonInstallation(
            addon_id=request.addon_id,
            installed_by=current_user_id,
            settings=request.settings or {},
            is_enabled=True
        )
        
        # Update install count
        addon.install_count += 1
        
        db.add(installation)
        await db.commit()
        await db.refresh(installation)
        
        # Load addon details
        installation.addon = addon
        
        logger.info(f"Installed addon: {addon.name} by user {current_user_id}")
        
        return installation
        
    except Exception as e:
        logger.error(f"Failed to install addon {addon.name}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Installation failed: {str(e)}"
        )


@router.delete("/uninstall/{addon_id}")
async def uninstall_addon(
    addon_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Uninstall an addon (admin only) - Removes plugin files and database tables"""
    result = await db.execute(
        select(AddonInstallation).where(AddonInstallation.addon_id == addon_id)
    )
    installation = result.scalars().first()
    
    if not installation:
        raise HTTPException(status_code=404, detail="Addon is not installed")
    
    # Get addon for logging
    addon_result = await db.execute(
        select(Addon).where(Addon.id == addon_id)
    )
    addon = addon_result.scalars().first()
    
    try:
        # Uninstall plugin files and drop tables
        from app.core.plugin_installer import PluginInstaller
        installer = PluginInstaller()
        await installer.uninstall(addon.name if addon else addon_id)
        
        # Update install count
        if addon:
            addon.install_count = max(0, addon.install_count - 1)
        
        # Delete installation record
        await db.delete(installation)
        await db.commit()
        
        logger.info(f"Uninstalled addon: {addon.name if addon else addon_id}")
        
        return {"message": "Addon uninstalled successfully. Please restart the application."}
        
    except Exception as e:
        logger.error(f"Failed to uninstall addon: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Uninstallation failed: {str(e)}"
        )


@router.post("/toggle/{addon_id}")
async def toggle_addon(
    addon_id: str,
    enable: bool,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Enable or disable an installed addon"""
    result = await db.execute(
        select(AddonInstallation).where(AddonInstallation.addon_id == addon_id)
    )
    installation = result.scalars().first()
    
    if not installation:
        raise HTTPException(status_code=404, detail="Addon is not installed")
    
    installation.is_enabled = enable
    await db.commit()
    
    return {"message": f"Addon {'enabled' if enable else 'disabled'} successfully"}

