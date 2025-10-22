"""
Customer Domain Management API
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import datetime, timedelta

from ...core.database import get_db
from ...core.security import get_current_user_id
from ...models import Domain, DomainStatus
from ...schemas import DomainResponse, DomainCreateRequest

router = APIRouter()

@router.get("/", response_model=List[DomainResponse])
async def get_customer_domains(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = Query(None, description="Filter by domain status"),
    expiring_soon: Optional[bool] = Query(None, description="Show domains expiring in 30 days")
):
    """Get all domains for the current customer"""
    try:
        # Build query
        query = select(Domain).where(Domain.user_id == user_id)
        
        # Apply status filter
        if status:
            try:
                domain_status = DomainStatus(status)
                query = query.where(Domain.status == domain_status)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid status value")
        
        # Apply expiring soon filter
        if expiring_soon:
            thirty_days_from_now = datetime.utcnow() + timedelta(days=30)
            query = query.where(
                and_(
                    Domain.expiry_date <= thirty_days_from_now,
                    Domain.status == DomainStatus.ACTIVE
                )
            )
        
        # Order by expiry date (expiring soon first)
        query = query.order_by(Domain.expiry_date.asc())
        
        result = await db.execute(query)
        domains = result.scalars().all()
        
        return [DomainResponse.from_orm(domain) for domain in domains]
        
    except Exception as e:
        print(f"Error fetching customer domains: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch domains")

@router.get("/{domain_id}", response_model=DomainResponse)
async def get_domain_details(
    domain_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed information about a specific domain"""
    try:
        query = select(Domain).where(
            and_(
                Domain.id == domain_id,
                Domain.user_id == user_id
            )
        )
        
        result = await db.execute(query)
        domain = result.scalar_one_or_none()
        
        if not domain:
            raise HTTPException(status_code=404, detail="Domain not found")
        
        return DomainResponse.from_orm(domain)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching domain details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch domain details")

@router.post("/", response_model=DomainResponse)
async def register_domain(
    request: DomainCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Register a new domain for the customer"""
    try:
        # Check if domain already exists
        existing_domain = await db.execute(
            select(Domain).where(Domain.domain_name == request.domain_name)
        )
        if existing_domain.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Domain already registered")
        
        # Create new domain record
        domain = Domain(
            user_id=user_id,
            domain_name=request.domain_name,
            registrar=request.registrar or "resellerclub",
            registration_date=datetime.utcnow(),
            expiry_date=datetime.utcnow() + timedelta(days=365 * request.years),
            auto_renew=request.auto_renew,
            nameservers=request.nameservers or ["ns1.example.com", "ns2.example.com"],
            status=DomainStatus.PENDING
        )
        
        db.add(domain)
        await db.commit()
        await db.refresh(domain)
        
        return DomainResponse.from_orm(domain)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error registering domain: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to register domain")

@router.put("/{domain_id}/auto-renew", response_model=DomainResponse)
async def update_auto_renew(
    domain_id: str,
    auto_renew: bool,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update auto-renewal setting for a domain"""
    try:
        query = select(Domain).where(
            and_(
                Domain.id == domain_id,
                Domain.user_id == user_id
            )
        )
        
        result = await db.execute(query)
        domain = result.scalar_one_or_none()
        
        if not domain:
            raise HTTPException(status_code=404, detail="Domain not found")
        
        domain.auto_renew = auto_renew
        await db.commit()
        await db.refresh(domain)
        
        return DomainResponse.from_orm(domain)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating auto-renewal: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update auto-renewal setting")

@router.put("/{domain_id}/nameservers", response_model=DomainResponse)
async def update_nameservers(
    domain_id: str,
    nameservers: List[str],
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update nameservers for a domain"""
    try:
        query = select(Domain).where(
            and_(
                Domain.id == domain_id,
                Domain.user_id == user_id
            )
        )
        
        result = await db.execute(query)
        domain = result.scalar_one_or_none()
        
        if not domain:
            raise HTTPException(status_code=404, detail="Domain not found")
        
        domain.nameservers = nameservers
        await db.commit()
        await db.refresh(domain)
        
        return DomainResponse.from_orm(domain)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating nameservers: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update nameservers")

@router.get("/stats/summary")
async def get_domain_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get domain statistics for the customer"""
    try:
        # Get all domains for the user
        query = select(Domain).where(Domain.user_id == user_id)
        result = await db.execute(query)
        domains = result.scalars().all()
        
        # Calculate statistics
        total_domains = len(domains)
        active_domains = len([d for d in domains if d.status == DomainStatus.ACTIVE])
        expiring_soon = len([
            d for d in domains 
            if d.status == DomainStatus.ACTIVE and 
            d.expiry_date and 
            d.expiry_date <= datetime.utcnow() + timedelta(days=30)
        ])
        expired_domains = len([d for d in domains if d.status == DomainStatus.EXPIRED])
        
        return {
            "total_domains": total_domains,
            "active_domains": active_domains,
            "expiring_soon": expiring_soon,
            "expired_domains": expired_domains,
            "auto_renew_enabled": len([d for d in domains if d.auto_renew])
        }
        
    except Exception as e:
        print(f"Error fetching domain stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch domain statistics")
