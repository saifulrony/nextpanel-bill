"""
Domain Provider API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.core.database import get_db
from app.models.domain_providers import DomainProvider, DomainProviderType, DomainProviderStatus
from app.schemas.domain_providers import (
    DomainProviderCreate, 
    DomainProviderUpdate, 
    DomainProviderResponse,
    DomainProviderTestRequest,
    DomainProviderTestResponse
)
from app.services.domain_provider_service import DomainProviderService
from app.core.security import require_admin

router = APIRouter()

@router.get("/", response_model=List[DomainProviderResponse])
async def list_domain_providers(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """List all domain providers"""
    result = await db.execute(select(DomainProvider))
    providers = result.scalars().all()
    return providers

@router.get("/{provider_id}", response_model=DomainProviderResponse)
async def get_domain_provider(
    provider_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Get a specific domain provider"""
    result = await db.execute(select(DomainProvider).where(DomainProvider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Domain provider not found")
    return provider

@router.post("/", response_model=DomainProviderResponse)
async def create_domain_provider(
    provider_data: DomainProviderCreate,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Create a new domain provider"""
    # Check if this will be the default provider
    if provider_data.is_default:
        # Remove default status from other providers of the same type
        result = await db.execute(
            select(DomainProvider).where(DomainProvider.type == provider_data.type)
        )
        existing_providers = result.scalars().all()
        for existing_provider in existing_providers:
            existing_provider.is_default = False
    
    provider = DomainProvider(**provider_data.dict())
    db.add(provider)
    await db.commit()
    await db.refresh(provider)
    return provider

@router.put("/{provider_id}", response_model=DomainProviderResponse)
async def update_domain_provider(
    provider_id: str,
    provider_data: DomainProviderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Update a domain provider"""
    result = await db.execute(select(DomainProvider).where(DomainProvider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Domain provider not found")
    
    # Check if this will be the default provider
    if provider_data.is_default:
        # Remove default status from other providers of the same type
        result = await db.execute(
            select(DomainProvider).where(
                DomainProvider.type == provider.type,
                DomainProvider.id != provider_id
            )
        )
        existing_providers = result.scalars().all()
        for existing_provider in existing_providers:
            existing_provider.is_default = False
    
    update_data = provider_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(provider, field, value)
    
    await db.commit()
    await db.refresh(provider)
    return provider

@router.delete("/{provider_id}")
async def delete_domain_provider(
    provider_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Delete a domain provider"""
    result = await db.execute(select(DomainProvider).where(DomainProvider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Domain provider not found")
    
    await db.delete(provider)
    await db.commit()
    return {"message": "Domain provider deleted successfully"}

@router.post("/{provider_id}/test", response_model=DomainProviderTestResponse)
async def test_domain_provider(
    provider_id: str,
    test_data: DomainProviderTestRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Test domain provider connection"""
    result = await db.execute(select(DomainProvider).where(DomainProvider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Domain provider not found")
    
    try:
        service = DomainProviderService(provider)
        result = await service.test_connection()
        
        # Update last tested timestamp
        from sqlalchemy.sql import func
        provider.last_tested_at = func.now()
        if result.success:
            provider.status = DomainProviderStatus.ACTIVE
        else:
            provider.status = DomainProviderStatus.ERROR
        await db.commit()
        
        return result
    except Exception as e:
        provider.status = DomainProviderStatus.ERROR
        await db.commit()
        return DomainProviderTestResponse(
            success=False,
            message=f"Test failed: {str(e)}"
        )

@router.post("/{provider_id}/activate")
async def activate_domain_provider(
    provider_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Activate a domain provider"""
    result = await db.execute(select(DomainProvider).where(DomainProvider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Domain provider not found")
    
    provider.status = DomainProviderStatus.ACTIVE
    await db.commit()
    return {"message": "Domain provider activated successfully"}

@router.post("/{provider_id}/deactivate")
async def deactivate_domain_provider(
    provider_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Deactivate a domain provider"""
    result = await db.execute(select(DomainProvider).where(DomainProvider.id == provider_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Domain provider not found")
    
    provider.status = DomainProviderStatus.INACTIVE
    await db.commit()
    return {"message": "Domain provider deactivated successfully"}

@router.get("/types/available")
async def get_available_provider_types():
    """Get list of available domain provider types"""
    return {
        "types": [
            {
                "value": provider_type.value,
                "label": provider_type.value.replace("_", " ").title(),
                "description": _get_provider_description(provider_type)
            }
            for provider_type in DomainProviderType
        ]
    }

def _get_provider_description(provider_type: DomainProviderType) -> str:
    """Get description for domain provider type"""
    descriptions = {
        DomainProviderType.NAMECHEAP: "Popular domain registrar with competitive pricing",
        DomainProviderType.RESELLERCLUB: "Reseller-focused domain registrar with API access",
        DomainProviderType.GODADDY: "World's largest domain registrar",
        DomainProviderType.CLOUDFLARE: "Cloudflare Registrar with transparent pricing",
        DomainProviderType.GOOGLE_DOMAINS: "Google's domain registration service",
        DomainProviderType.NAMECOM: "Domain registrar with developer-friendly API",
        DomainProviderType.ENOM: "Enterprise domain registrar with reseller programs"
    }
    return descriptions.get(provider_type, "Domain registrar service")
