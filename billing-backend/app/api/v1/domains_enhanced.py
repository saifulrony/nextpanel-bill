"""
Enhanced Domain API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.services.domain_service import DomainService
from app.services.namecheap_service import NamecheapService
from app.core.security import get_current_user_id
from app.core.config import settings

router = APIRouter()

class AuctionSearchRequest(BaseModel):
    keyword: str
    page: int = 1
    page_size: int = 20

class PremiumDomainRequest(BaseModel):
    keyword: str
    tlds: Optional[List[str]] = None

class DomainSuggestionsRequest(BaseModel):
    keyword: str
    count: int = 20

class BulkSearchRequest(BaseModel):
    keywords: List[str]
    tlds: Optional[List[str]] = None

@router.post("/auctions/search")
async def search_auction_domains(
    request: AuctionSearchRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Search for auction domains"""
    try:
        # Use NamecheapService for proper pricing integration
        namecheap_service = NamecheapService(
            api_user=settings.NAMECHEAP_API_USER,
            api_key=settings.NAMECHEAP_API_KEY,
            username=settings.NAMECHEAP_USERNAME,
            client_ip=settings.NAMECHEAP_CLIENT_IP,
            sandbox=settings.NAMECHEAP_SANDBOX
        )
        
        result = await namecheap_service.search_auction_domains(
            keyword=request.keyword,
            page=request.page,
            page_size=request.page_size
        )
        
        return {
            "success": True,
            "data": result,
            "message": "Auction domains retrieved successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search auction domains: {str(e)}")

@router.post("/premium/search")
async def search_premium_domains(
    request: PremiumDomainRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Search for premium domains"""
    try:
        # Use NamecheapService for proper pricing integration
        namecheap_service = NamecheapService(
            api_user=settings.NAMECHEAP_API_USER,
            api_key=settings.NAMECHEAP_API_KEY,
            username=settings.NAMECHEAP_USERNAME,
            client_ip=settings.NAMECHEAP_CLIENT_IP,
            sandbox=settings.NAMECHEAP_SANDBOX
        )
        
        result = await namecheap_service.get_premium_domains(
            keyword=request.keyword,
            tlds=request.tlds
        )
        
        return {
            "success": True,
            "data": result,
            "message": "Premium domains retrieved successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search premium domains: {str(e)}")

@router.post("/suggestions/generate")
async def generate_domain_suggestions(
    request: DomainSuggestionsRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Generate domain name suggestions"""
    try:
        # Use NamecheapService for proper pricing integration
        namecheap_service = NamecheapService(
            api_user=settings.NAMECHEAP_API_USER,
            api_key=settings.NAMECHEAP_API_KEY,
            username=settings.NAMECHEAP_USERNAME,
            client_ip=settings.NAMECHEAP_CLIENT_IP,
            sandbox=settings.NAMECHEAP_SANDBOX
        )
        
        result = await namecheap_service.generate_domain_suggestions(
            keyword=request.keyword,
            count=request.count
        )
        
        return {
            "success": True,
            "data": result,
            "message": "Domain suggestions generated successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate domain suggestions: {str(e)}")

@router.post("/bulk/search")
async def bulk_domain_search(
    request: BulkSearchRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Beast mode: Bulk domain search and analysis"""
    try:
        domain_service = DomainService(db)
        result = await domain_service.bulk_domain_search(
            keywords=request.keywords,
            tlds=request.tlds
        )
        
        if not result.get('success', False):
            raise HTTPException(status_code=400, detail=result.get('message', 'Bulk search failed'))
        
        return {
            "success": True,
            "data": result,
            "message": "Bulk domain search completed successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to perform bulk domain search: {str(e)}")
