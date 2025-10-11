"""
Domain Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import Domain, User, License, DomainStatus
from app.schemas import (
    DomainCheckRequest, 
    DomainCheckResponse,
    DomainRegisterRequest,
    DomainResponse,
    DomainTransferRequest,
    DomainUpdateNameserversRequest,
    DomainRenewRequest
)
from app.services.domain_service import DomainService

router = APIRouter(prefix="/domains", tags=["domains"])


@router.post("/check", response_model=DomainCheckResponse)
async def check_domain_availability(
    request: DomainCheckRequest,
    db: AsyncSession = Depends(get_db)
):
    """Check if a domain is available for registration"""
    domain_service = DomainService()
    
    # Check if domain already exists in our database
    result = await db.execute(
        select(Domain).where(Domain.domain_name == request.domain_name)
    )
    existing_domain = result.scalars().first()
    
    if existing_domain:
        return DomainCheckResponse(
            domain_name=request.domain_name,
            available=False,
            price=None
        )
    
    # Check availability with registrar (mock for now)
    is_available = await domain_service.check_availability(request.domain_name)
    price = await domain_service.get_domain_price(request.domain_name) if is_available else None
    
    return DomainCheckResponse(
        domain_name=request.domain_name,
        available=is_available,
        price=price
    )


@router.post("/register", response_model=DomainResponse, status_code=status.HTTP_201_CREATED)
async def register_domain(
    request: DomainRegisterRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Register a new domain"""
    domain_service = DomainService()
    
    # Check if domain already exists
    result = await db.execute(
        select(Domain).where(Domain.domain_name == request.domain_name)
    )
    existing_domain = result.scalars().first()
    
    if existing_domain:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Domain already registered"
        )
    
    # Check if user has license quota available
    if request.license_id:
        result = await db.execute(
            select(License).where(
                and_(
                    License.id == request.license_id,
                    License.user_id == user_id
                )
            )
        )
        license = result.scalars().first()
        
        if not license:
            raise HTTPException(status_code=404, detail="License not found")
        
        if license.current_domains >= license.max_domains:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Domain quota exceeded"
            )
    
    # Register domain with registrar (mock for now)
    registration_result = await domain_service.register_domain(
        domain_name=request.domain_name,
        years=request.years,
        nameservers=request.nameservers,
        contact_info=request.contact_info
    )
    
    # Create domain record
    new_domain = Domain(
        user_id=user_id,
        license_id=request.license_id,
        domain_name=request.domain_name,
        registrar=registration_result.get("registrar", "namecheap"),
        registrar_domain_id=registration_result.get("domain_id"),
        registration_date=datetime.utcnow(),
        expiry_date=datetime.utcnow() + timedelta(days=365 * request.years),
        auto_renew=request.auto_renew,
        nameservers=request.nameservers,
        status=DomainStatus.ACTIVE
    )
    
    db.add(new_domain)
    
    # Update license quota if applicable
    if request.license_id and license:
        license.current_domains += 1
    
    await db.commit()
    await db.refresh(new_domain)
    
    return new_domain


@router.get("/", response_model=List[DomainResponse])
async def list_domains(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """List user's domains"""
    result = await db.execute(
        select(Domain).where(Domain.user_id == user_id).order_by(Domain.created_at.desc())
    )
    domains = result.scalars().all()
    return domains


@router.get("/{domain_id}", response_model=DomainResponse)
async def get_domain(
    domain_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get domain details"""
    result = await db.execute(
        select(Domain).where(
            and_(
                Domain.id == domain_id,
                Domain.user_id == user_id
            )
        )
    )
    domain = result.scalars().first()
    
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    return domain


@router.post("/{domain_id}/renew", response_model=DomainResponse)
async def renew_domain(
    domain_id: str,
    request: DomainRenewRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Renew a domain"""
    result = await db.execute(
        select(Domain).where(
            and_(
                Domain.id == domain_id,
                Domain.user_id == user_id
            )
        )
    )
    domain = result.scalars().first()
    
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    # Renew domain with registrar
    domain_service = DomainService()
    renewal_result = await domain_service.renew_domain(
        domain_name=domain.domain_name,
        years=request.years
    )
    
    # Update expiry date
    if domain.expiry_date:
        domain.expiry_date = domain.expiry_date + timedelta(days=365 * request.years)
    else:
        domain.expiry_date = datetime.utcnow() + timedelta(days=365 * request.years)
    
    domain.status = DomainStatus.ACTIVE
    
    await db.commit()
    await db.refresh(domain)
    
    return domain


@router.post("/{domain_id}/transfer", response_model=DomainResponse)
async def transfer_domain(
    domain_id: str,
    request: DomainTransferRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Initiate domain transfer"""
    result = await db.execute(
        select(Domain).where(
            and_(
                Domain.id == domain_id,
                Domain.user_id == user_id
            )
        )
    )
    domain = result.scalars().first()
    
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    # Initiate transfer with registrar
    domain_service = DomainService()
    transfer_result = await domain_service.transfer_domain(
        domain_name=domain.domain_name,
        auth_code=request.auth_code
    )
    
    domain.status = DomainStatus.PENDING
    
    await db.commit()
    await db.refresh(domain)
    
    return domain


@router.put("/{domain_id}/nameservers", response_model=DomainResponse)
async def update_nameservers(
    domain_id: str,
    request: DomainUpdateNameserversRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update domain nameservers"""
    result = await db.execute(
        select(Domain).where(
            and_(
                Domain.id == domain_id,
                Domain.user_id == user_id
            )
        )
    )
    domain = result.scalars().first()
    
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    # Update nameservers with registrar
    domain_service = DomainService()
    update_result = await domain_service.update_nameservers(
        domain_name=domain.domain_name,
        nameservers=request.nameservers
    )
    
    domain.nameservers = request.nameservers
    
    await db.commit()
    await db.refresh(domain)
    
    return domain


@router.delete("/{domain_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_domain(
    domain_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete domain (marks as cancelled)"""
    result = await db.execute(
        select(Domain).where(
            and_(
                Domain.id == domain_id,
                Domain.user_id == user_id
            )
        )
    )
    domain = result.scalars().first()
    
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    # Update license quota
    if domain.license_id:
        result = await db.execute(
            select(License).where(License.id == domain.license_id)
        )
        license = result.scalars().first()
        if license and license.current_domains > 0:
            license.current_domains -= 1
    
    # Mark as expired/cancelled instead of hard delete
    domain.status = DomainStatus.EXPIRED
    domain.auto_renew = False
    
    await db.commit()
    
    return None

