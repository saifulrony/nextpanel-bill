"""
Domain Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import Domain, User
from app.services.domain_service import DomainService
from app.services.namecheap_service import NamecheapService
from pydantic import BaseModel

router = APIRouter(prefix="/domains", tags=["domains"])

# Schemas
class DomainSearchRequest(BaseModel):
    domain_name: str
    tlds: Optional[List[str]] = None

class DomainSearchResult(BaseModel):
    domain: str
    available: bool
    price: Optional[float] = None
    currency: str = "USD"
    registrar: str
    registration_period: int = 1

class DomainSearchResponse(BaseModel):
    results: List[DomainSearchResult]
    search_term: str
    total_found: int
    available_count: int

class DomainRegisterRequest(BaseModel):
    domain_name: str
    years: int = 1
    registrant_info: Dict[str, str]

class DomainInfoResponse(BaseModel):
    domain: str
    status: str
    created_date: Optional[str] = None
    expired_date: Optional[str] = None
    auto_renew: bool
    is_locked: bool
    nameservers: List[str] = []
    whois_guard: bool = False

@router.post("/search", response_model=DomainSearchResponse)
async def search_domains(
    request: DomainSearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """Search for domain availability and pricing"""
    try:
        # Initialize domain service with database session
        domain_service = DomainService(db)
        await domain_service._initialize_services()
        
        # Get TLDs to search
        tlds = request.tlds or ['.com', '.net', '.org', '.io', '.co', '.dev']
        
        # Generate domain names to search
        base_name = request.domain_name.lower().strip()
        if not base_name:
            raise HTTPException(status_code=400, detail="Domain name is required")
        
        # Remove TLD if user included it
        if '.' in base_name:
            base_name = base_name.split('.')[0]
        
        domains_to_search = [f"{base_name}{tld}" for tld in tlds]
        
        # Check availability using domain service
        availability_results = {}
        pricing_results = {}
        
        for domain in domains_to_search:
            try:
                # Check availability
                is_available = await domain_service.check_availability(domain)
                availability_results[domain] = is_available
                
                # Get pricing if available
                if is_available:
                    try:
                        price_info = await domain_service.get_domain_price(domain)
                        pricing_results[domain] = price_info.get('price', 0.0)
                    except:
                        pricing_results[domain] = 0.0
                else:
                    pricing_results[domain] = 0.0
                    
            except Exception as e:
                print(f"Error checking domain {domain}: {str(e)}")
                availability_results[domain] = False
                pricing_results[domain] = 0.0
        
        # Build results
        results = []
        available_count = 0
        
        for domain in domains_to_search:
            is_available = availability_results.get(domain, False)
            price = pricing_results.get(domain, 0.0)
            
            if is_available:
                available_count += 1
            
            results.append(DomainSearchResult(
                domain=domain,
                available=is_available,
                price=price if is_available else None,
                currency="USD",
                registrar="namecheap",  # Default registrar
                registration_period=1
            ))
        
        return DomainSearchResponse(
            results=results,
            search_term=request.domain_name,
            total_found=len(results),
            available_count=available_count
        )
        
    except Exception as e:
        print(f"Domain search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Domain search failed: {str(e)}")

@router.get("/pricing/{domain_name}")
async def get_domain_pricing(
    domain_name: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed pricing for a specific domain"""
    try:
        domain_service = DomainService()
        pricing = await domain_service.get_domain_price(domain_name)
        
        return {
            "domain": domain_name,
            "pricing": pricing,
            "currency": "USD"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get pricing: {str(e)}")

@router.post("/register")
async def register_domain(
    request: DomainRegisterRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Register a domain (placeholder - requires real API integration)"""
    try:
        # This would integrate with actual domain registrar APIs
        # For now, return a mock response
        
        return {
            "success": True,
            "domain": request.domain_name,
            "order_id": f"DOM-{int(datetime.now().timestamp())}",
            "message": "Domain registration initiated (mock response)",
            "status": "pending"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Domain registration failed: {str(e)}")

@router.get("/my-domains", response_model=List[DomainInfoResponse])
async def get_my_domains(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get user's registered domains"""
    try:
        result = await db.execute(
            select(Domain).where(Domain.user_id == user_id)
        )
        domains = result.scalars().all()
        
        domain_info = []
        for domain in domains:
            domain_info.append(DomainInfoResponse(
                domain=domain.domain_name,
                status=domain.status.value,
                created_date=domain.registration_date.isoformat() if domain.registration_date else None,
                expired_date=domain.expiry_date.isoformat() if domain.expiry_date else None,
                auto_renew=domain.auto_renew,
                is_locked=False,  # Would need to fetch from registrar
                nameservers=domain.nameservers or [],
                whois_guard=False  # Would need to fetch from registrar
            ))
        
        return domain_info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get domains: {str(e)}")

@router.get("/info/{domain_name}")
async def get_domain_info(
    domain_name: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed information about a domain"""
    try:
        domain_service = DomainService()
        info = await domain_service.get_domain_info(domain_name)
        
        return info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get domain info: {str(e)}")

@router.post("/nameservers/{domain_name}")
async def update_nameservers(
    domain_name: str,
    nameservers: List[str],
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update domain nameservers"""
    try:
        if len(nameservers) < 2:
            raise HTTPException(status_code=400, detail="At least 2 nameservers required")
        
        domain_service = DomainService()
        result = await domain_service.update_nameservers(domain_name, nameservers)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update nameservers: {str(e)}")

@router.get("/suggestions")
async def get_domain_suggestions(
    query: str = Query(..., description="Base domain name"),
    limit: int = Query(10, description="Number of suggestions"),
    user_id: str = Depends(get_current_user_id)
):
    """Get domain name suggestions"""
    try:
        if not query or len(query) < 2:
            return {"suggestions": []}
        
        base_name = query.lower().strip()
        
        # Common TLDs for suggestions
        common_tlds = ['.com', '.net', '.org', '.io', '.co', '.dev', '.app', '.tech', '.online']
        
        # Generate suggestions
        suggestions = []
        for tld in common_tlds[:limit]:
            suggestions.append({
                "domain": f"{base_name}{tld}",
                "tld": tld,
                "base_name": base_name
            })
        
        return {"suggestions": suggestions}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")