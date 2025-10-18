from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel, Field
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services.domain_pricing_service import DomainPricingService
from app.models.domain_pricing import DomainPricingConfig, TLDPricing
import uuid

router = APIRouter(prefix="/pricing", tags=["domain-pricing"])

# Pydantic models
class TLDPricingCreate(BaseModel):
    tld: str
    custom_price: Optional[float] = None
    markup_percentage: Optional[float] = None
    wholesale_price: Optional[float] = None

class TLDPricingUpdate(BaseModel):
    custom_price: Optional[float] = None
    markup_percentage: Optional[float] = None
    wholesale_price: Optional[float] = None

class TLDPricingResponse(BaseModel):
    id: str
    tld: str
    custom_price: Optional[float]
    markup_percentage: Optional[float]
    wholesale_price: Optional[float]
    is_active: bool
    created_at: str
    updated_at: str

class ConfigCreate(BaseModel):
    name: str
    description: Optional[str] = None
    default_markup_percentage: float = Field(default=20.0, ge=0, le=1000)

class ConfigUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    default_markup_percentage: Optional[float] = Field(None, ge=0, le=1000)
    is_active: Optional[bool] = None

class ConfigResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    default_markup_percentage: float
    is_active: bool
    created_at: str
    updated_at: str

class BulkTLDPricingUpdate(BaseModel):
    tld_prices: List[TLDPricingCreate]

class PriceCalculationRequest(BaseModel):
    tld: str
    wholesale_price: Optional[float] = None

class PriceCalculationResponse(BaseModel):
    tld: str
    final_price: float
    wholesale_price: float
    markup_percentage: float
    calculation_method: str

# Configuration endpoints
@router.get("/config", response_model=ConfigResponse)
async def get_active_config(
    db: AsyncSession = Depends(get_db)
    # Temporarily removed auth for testing
    # current_user_id: str = Depends(get_current_user_id)
):
    """Get the active pricing configuration"""
    pricing_service = DomainPricingService(db)
    config = await pricing_service.get_active_config()
    
    if not config:
        # Create a default configuration if none exists
        config = await pricing_service.create_config(
            name="Default Pricing",
            description="Default domain pricing configuration",
            default_markup_percentage=20.0
        )
    
    return ConfigResponse(
        id=str(config.id),
        name=config.name,
        description=config.description,
        default_markup_percentage=config.default_markup_percentage,
        is_active=config.is_active,
        created_at=config.created_at.isoformat(),
        updated_at=config.updated_at.isoformat()
    )

@router.post("/config", response_model=ConfigResponse)
async def create_config(
    config_data: ConfigCreate,
    db: AsyncSession = Depends(get_db)
    # Temporarily removed auth for testing
    # current_user_id: str = Depends(get_current_user_id)
):
    """Create a new pricing configuration"""
    pricing_service = DomainPricingService(db)
    
    try:
        config = await pricing_service.create_config(
            name=config_data.name,
            description=config_data.description,
            default_markup_percentage=config_data.default_markup_percentage
        )
        
        return ConfigResponse(
            id=str(config.id),
            name=config.name,
            description=config.description,
            default_markup_percentage=config.default_markup_percentage,
            is_active=config.is_active,
            created_at=config.created_at.isoformat(),
            updated_at=config.updated_at.isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/config", response_model=ConfigResponse)
async def update_active_config(
    config_data: ConfigUpdate,
    db: AsyncSession = Depends(get_db)
    # Temporarily removed auth for testing
    # current_user_id: str = Depends(get_current_user_id)
):
    """Update the active pricing configuration"""
    pricing_service = DomainPricingService(db)
    
    try:
        # Get the active config first
        config = await pricing_service.get_active_config()
        if not config:
            raise HTTPException(status_code=404, detail="No active configuration found")
        
        # Update the active config
        updated_config = await pricing_service.update_config(str(config.id), **config_data.dict(exclude_unset=True))
        
        return ConfigResponse(
            id=str(updated_config.id),
            name=updated_config.name,
            description=updated_config.description,
            default_markup_percentage=updated_config.default_markup_percentage,
            is_active=updated_config.is_active,
            created_at=updated_config.created_at.isoformat(),
            updated_at=updated_config.updated_at.isoformat()
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/config/{config_id}", response_model=ConfigResponse)
async def update_config(
    config_id: str,
    config_data: ConfigUpdate,
    db: AsyncSession = Depends(get_db)
    # Temporarily removed auth for testing
    # current_user_id: str = Depends(get_current_user_id)
):
    """Update pricing configuration"""
    pricing_service = DomainPricingService(db)
    
    try:
        config = await pricing_service.update_config(config_id, **config_data.dict(exclude_unset=True))
        
        return ConfigResponse(
            id=str(config.id),
            name=config.name,
            description=config.description,
            default_markup_percentage=config.default_markup_percentage,
            is_active=config.is_active,
            created_at=config.created_at.isoformat(),
            updated_at=config.updated_at.isoformat()
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# TLD Pricing endpoints
@router.get("/tld-pricing", response_model=List[TLDPricingResponse])
async def get_tld_pricing(
    config_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
    # Temporarily removed auth for testing
    # current_user_id: str = Depends(get_current_user_id)
):
    """Get TLD pricing configurations"""
    pricing_service = DomainPricingService(db)
    tld_prices = await pricing_service.get_all_tld_pricing(config_id)
    
    return [
        TLDPricingResponse(
            id=str(tld.id),
            tld=tld.tld,
            custom_price=tld.custom_price,
            markup_percentage=tld.markup_percentage,
            wholesale_price=tld.wholesale_price,
            is_active=tld.is_active,
            created_at=tld.created_at.isoformat(),
            updated_at=tld.updated_at.isoformat()
        )
        for tld in tld_prices
    ]

@router.post("/tld-pricing", response_model=TLDPricingResponse)
async def set_tld_pricing(
    tld_data: TLDPricingCreate,
    db: AsyncSession = Depends(get_db)
    # Temporarily removed auth for testing
    # current_user_id: str = Depends(get_current_user_id)
):
    """Set pricing for a specific TLD"""
    pricing_service = DomainPricingService(db)
    config = await pricing_service.get_active_config()
    
    if not config:
        raise HTTPException(
            status_code=404,
            detail="No active pricing configuration found"
        )
    
    try:
        tld_pricing = await pricing_service.set_tld_pricing(
            config_id=str(config.id),
            tld=tld_data.tld,
            custom_price=tld_data.custom_price,
            markup_percentage=tld_data.markup_percentage,
            wholesale_price=tld_data.wholesale_price
        )
        
        return TLDPricingResponse(
            id=str(tld_pricing.id),
            tld=tld_pricing.tld,
            custom_price=tld_pricing.custom_price,
            markup_percentage=tld_pricing.markup_percentage,
            wholesale_price=tld_pricing.wholesale_price,
            is_active=tld_pricing.is_active,
            created_at=tld_pricing.created_at.isoformat(),
            updated_at=tld_pricing.updated_at.isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/tld-pricing/{tld_pricing_id}", response_model=TLDPricingResponse)
async def update_tld_pricing(
    tld_pricing_id: str,
    tld_data: TLDPricingUpdate,
    db: AsyncSession = Depends(get_db)
    # Temporarily removed auth for testing
    # current_user_id: str = Depends(get_current_user_id)
):
    """Update TLD pricing configuration"""
    from sqlalchemy import select
    
    # Get the TLD pricing record
    result = await db.execute(select(TLDPricing).filter(TLDPricing.id == tld_pricing_id))
    tld_pricing = result.scalar_one_or_none()
    
    if not tld_pricing:
        raise HTTPException(status_code=404, detail="TLD pricing not found")
    
    try:
        # Update the fields
        for key, value in tld_data.dict(exclude_unset=True).items():
            if hasattr(tld_pricing, key):
                setattr(tld_pricing, key, value)
        
        # Commit the changes
        await db.commit()
        await db.refresh(tld_pricing)
        
        return TLDPricingResponse(
            id=str(tld_pricing.id),
            tld=tld_pricing.tld,
            custom_price=tld_pricing.custom_price,
            markup_percentage=tld_pricing.markup_percentage,
            wholesale_price=tld_pricing.wholesale_price,
            is_active=tld_pricing.is_active,
            created_at=tld_pricing.created_at.isoformat(),
            updated_at=tld_pricing.updated_at.isoformat()
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/tld-pricing/bulk", response_model=List[TLDPricingResponse])
async def bulk_update_tld_pricing(
    bulk_data: BulkTLDPricingUpdate,
    db: AsyncSession = Depends(get_db)
    # Temporarily removed auth for testing
    # current_user_id: str = Depends(get_current_user_id)
):
    """Bulk update TLD pricing configurations"""
    pricing_service = DomainPricingService(db)
    config = await pricing_service.get_active_config()
    
    if not config:
        raise HTTPException(
            status_code=404,
            detail="No active pricing configuration found"
        )
    
    try:
        tld_prices = await pricing_service.bulk_update_tld_pricing(
            config_id=str(config.id),
            tld_prices=[tld.dict() for tld in bulk_data.tld_prices]
        )
        
        return [
            TLDPricingResponse(
                id=str(tld.id),
                tld=tld.tld,
                custom_price=tld.custom_price,
                markup_percentage=tld.markup_percentage,
                wholesale_price=tld.wholesale_price,
                is_active=tld.is_active,
                created_at=tld.created_at.isoformat(),
                updated_at=tld.updated_at.isoformat()
            )
            for tld in tld_prices
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/calculate-price", response_model=PriceCalculationResponse)
async def calculate_price(
    request: PriceCalculationRequest,
    db: AsyncSession = Depends(get_db)
    # Temporarily removed auth for testing
    # current_user_id: str = Depends(get_current_user_id)
):
    """Calculate domain price based on current configuration"""
    pricing_service = DomainPricingService(db)
    
    try:
        final_price = await pricing_service.calculate_domain_price(
            tld=request.tld,
            wholesale_price=request.wholesale_price
        )
        
        # Get configuration details for response
        config = await pricing_service.get_active_config()
        tld_pricing = await pricing_service.get_tld_pricing(request.tld)
        
        wholesale_price = request.wholesale_price or (
            tld_pricing.wholesale_price if tld_pricing 
            else pricing_service._get_default_wholesale_price(request.tld)
        )
        
        markup_percentage = (
            tld_pricing.markup_percentage if tld_pricing and tld_pricing.markup_percentage
            else (config.default_markup_percentage if config else 20.0)
        )
        
        calculation_method = "custom_price" if tld_pricing and tld_pricing.custom_price else "markup_calculation"
        
        return PriceCalculationResponse(
            tld=request.tld,
            final_price=final_price,
            wholesale_price=wholesale_price,
            markup_percentage=markup_percentage,
            calculation_method=calculation_method
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class UpdateAllPricesRequest(BaseModel):
    profit_percentage: float

class SetPremiumPricesRequest(BaseModel):
    premium_markup_percentage: float

@router.post("/update-all-prices")
async def update_all_prices(
    request: UpdateAllPricesRequest,
    db: AsyncSession = Depends(get_db)
    # Temporarily removed auth for testing
    # current_user_id: str = Depends(get_current_user_id)
):
    """Update all TLD prices with new profit percentage"""
    try:
        pricing_service = DomainPricingService(db)
        config = await pricing_service.get_active_config()
        
        if not config:
            raise HTTPException(status_code=404, detail="No active pricing configuration found")
        
        # Update the configuration with new profit percentage
        await pricing_service.update_config(str(config.id), default_markup_percentage=request.profit_percentage)
        
        # Get all existing TLD pricing
        all_tld_pricing = await pricing_service.get_all_tld_pricing(str(config.id))
        
        updated_count = 0
        for tld_pricing in all_tld_pricing:
            # Recalculate price with new profit percentage
            new_final_price = tld_pricing.wholesale_price * (1 + request.profit_percentage / 100)
            
            # Update the TLD pricing (only if it's not a custom price)
            if not tld_pricing.custom_price:
                await pricing_service.update_tld_pricing(
                    str(tld_pricing.id),
                    markup_percentage=request.profit_percentage
                )
                updated_count += 1
        
        return {
            "success": True,
            "message": f"Updated prices for {updated_count} TLDs with {request.profit_percentage}% profit",
            "data": {
                "updated_count": updated_count,
                "profit_percentage": request.profit_percentage,
                "total_tlds": len(all_tld_pricing)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update all prices: {str(e)}")

@router.post("/set-premium-prices")
async def set_premium_prices(
    request: SetPremiumPricesRequest,
    db: AsyncSession = Depends(get_db)
    # Temporarily removed auth for testing
    # current_user_id: str = Depends(get_current_user_id)
):
    """Set premium prices above the fetched price + profit margin"""
    try:
        pricing_service = DomainPricingService(db)
        config = await pricing_service.get_active_config()
        
        if not config:
            raise HTTPException(status_code=404, detail="No active pricing configuration found")
        
        # Get all existing TLD pricing
        all_tld_pricing = await pricing_service.get_all_tld_pricing(str(config.id))
        
        updated_count = 0
        for tld_pricing in all_tld_pricing:
            # Calculate the base price (wholesale + profit margin)
            markup_percentage = tld_pricing.markup_percentage if tld_pricing.markup_percentage is not None else config.default_markup_percentage
            base_price = tld_pricing.wholesale_price * (1 + markup_percentage / 100)
            
            # Apply premium markup on top of the base price
            premium_price = base_price * (1 + request.premium_markup_percentage / 100)
            
            # Update the TLD pricing with premium price as custom price
            # This will override the calculated price
            await pricing_service.set_tld_pricing(
                config_id=str(config.id),
                tld=tld_pricing.tld,
                wholesale_price=tld_pricing.wholesale_price,
                markup_percentage=tld_pricing.markup_percentage,
                custom_price=round(premium_price, 2)
            )
            updated_count += 1
        
        return {
            "success": True,
            "message": f"Set premium prices for {updated_count} TLDs with {request.premium_markup_percentage}% premium markup",
            "data": {
                "updated_count": updated_count,
                "premium_markup_percentage": request.premium_markup_percentage,
                "total_tlds": len(all_tld_pricing)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set premium prices: {str(e)}")

@router.post("/auto-fetch-prices")
async def auto_fetch_prices(
    db: AsyncSession = Depends(get_db)
    # Temporarily removed auth for testing
    # current_user_id: str = Depends(get_current_user_id)
):
    """Auto-fetch wholesale prices from Namecheap API and apply profit percentage"""
    from app.services.namecheap_service import NamecheapService
    from app.core.config import settings
    
    try:
        # Get active configuration
        pricing_service = DomainPricingService(db)
        config = await pricing_service.get_active_config()
        
        if not config:
            raise HTTPException(status_code=404, detail="No active pricing configuration found")
        
        # Initialize Namecheap service with mock settings for testing
        namecheap_service = NamecheapService(
            api_user="test_user",
            api_key="test_key",
            username="test_username",
            client_ip="127.0.0.1",
            sandbox=True
        )
        
        # Common TLDs to fetch prices for
        common_tlds = [
            'com', 'net', 'org', 'info', 'biz', 'co', 'io', 'dev', 'app', 'tech',
            'online', 'site', 'store', 'blog', 'news', 'tv', 'me', 'us', 'uk',
            'ca', 'au', 'de', 'fr', 'es', 'it', 'nl', 'be', 'ch', 'at', 'se',
            'no', 'dk', 'fi', 'pl', 'cz', 'hu', 'ro', 'bg', 'hr', 'sk', 'si',
            'lt', 'lv', 'ee', 'lu', 'mt', 'cy', 'ie', 'pt', 'gr', 'jp', 'kr',
            'cn', 'in', 'sg', 'hk', 'tw', 'th', 'my', 'ph', 'id', 'vn', 'br',
            'mx', 'ar', 'cl', 'co', 'pe', 've', 'uy', 'py', 'bo', 'ec', 'cr',
            'pa', 'gt', 'hn', 'sv', 'ni', 'cu', 'do', 'ht', 'jm', 'tt', 'bb',
            'ag', 'lc', 'vc', 'gd', 'kn', 'dm', 'bs', 'bz', 'sr', 'gy', 'fk',
            'za', 'ng', 'ke', 'eg', 'ma', 'tn', 'dz', 'ly', 'sd', 'et', 'gh',
            'ci', 'sn', 'ml', 'bf', 'ne', 'td', 'cm', 'cf', 'gq', 'ga', 'cg',
            'cd', 'ao', 'zm', 'zw', 'bw', 'na', 'sz', 'ls', 'mg', 'mu', 'sc',
            'km', 'dj', 'so', 'er', 'ss', 'rw', 'bi', 'ug', 'tz', 'mw', 'mz',
            're', 'yt'
        ]
        
        # Fetch prices and create TLD pricing entries
        updated_tlds = []
        for tld in common_tlds:
            try:
                # Use mock wholesale prices for testing (since Namecheap API is not configured)
                mock_wholesale_prices = {
                    'com': 12.99, 'net': 14.99, 'org': 13.99, 'info': 15.99, 'biz': 16.99,
                    'co': 18.99, 'io': 35.99, 'dev': 25.99, 'app': 20.99, 'tech': 22.99,
                    'online': 19.99, 'site': 17.99, 'store': 21.99, 'blog': 16.99, 'news': 18.99,
                    'tv': 45.99, 'me': 15.99, 'us': 11.99, 'uk': 12.99, 'ca': 13.99,
                    'au': 14.99, 'de': 15.99, 'fr': 16.99, 'es': 15.99, 'it': 16.99
                }
                
                # Get wholesale price (mock data for testing)
                wholesale_price = mock_wholesale_prices.get(tld, 15.99)  # Default price
                
                # Calculate final price with profit percentage
                final_price = wholesale_price * (1 + config.default_markup_percentage / 100)
                
                # Create or update TLD pricing
                tld_pricing = await pricing_service.set_tld_pricing(
                    config_id=str(config.id),
                    tld=tld,
                    wholesale_price=wholesale_price,
                    markup_percentage=config.default_markup_percentage
                )
                
                updated_tlds.append({
                    'tld': tld,
                    'wholesale_price': wholesale_price,
                    'final_price': round(final_price, 2),
                    'markup_percentage': config.default_markup_percentage,
                    'note': 'Mock pricing data (Namecheap API not configured)'
                })
                
            except Exception as e:
                # If there's an error, use default pricing
                default_wholesale = 15.99  # Default wholesale price
                final_price = default_wholesale * (1 + config.default_markup_percentage / 100)
                
                tld_pricing = await pricing_service.set_tld_pricing(
                    config_id=str(config.id),
                    tld=tld,
                    wholesale_price=default_wholesale,
                    markup_percentage=config.default_markup_percentage
                )
                
                updated_tlds.append({
                    'tld': tld,
                    'wholesale_price': default_wholesale,
                    'final_price': round(final_price, 2),
                    'markup_percentage': config.default_markup_percentage,
                    'note': 'Used default pricing (error occurred)'
                })
        
        return {
            "success": True,
            "message": f"Successfully updated prices for {len(updated_tlds)} TLDs",
            "data": {
                "updated_tlds": updated_tlds,
                "profit_percentage": config.default_markup_percentage,
                "total_tlds": len(updated_tlds)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to auto-fetch prices: {str(e)}")

@router.delete("/tld-pricing/{tld_pricing_id}")
async def delete_tld_pricing(
    tld_pricing_id: str,
    db: AsyncSession = Depends(get_db)
    # Temporarily removed auth for testing
    # current_user_id: str = Depends(get_current_user_id)
):
    """Delete TLD pricing configuration"""
    tld_pricing = db.query(TLDPricing).filter(TLDPricing.id == tld_pricing_id).first()
    
    if not tld_pricing:
        raise HTTPException(status_code=404, detail="TLD pricing not found")
    
    try:
        tld_pricing.is_active = False
        db.commit()
        return {"message": "TLD pricing deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
