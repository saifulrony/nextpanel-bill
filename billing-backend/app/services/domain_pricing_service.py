from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.domain_pricing import DomainPricingConfig, TLDPricing
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

class DomainPricingService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_active_config(self) -> Optional[DomainPricingConfig]:
        """Get the active pricing configuration"""
        result = await self.db.execute(
            select(DomainPricingConfig).filter(
                DomainPricingConfig.is_active == True
            )
        )
        return result.scalar_one_or_none()
    
    async def get_tld_pricing(self, tld: str) -> Optional[TLDPricing]:
        """Get pricing configuration for a specific TLD"""
        config = await self.get_active_config()
        if not config:
            return None
            
        result = await self.db.execute(
            select(TLDPricing).filter(
                TLDPricing.config_id == config.id,
                TLDPricing.tld == tld.lstrip('.'),
                TLDPricing.is_active == True
            )
        )
        return result.scalar_one_or_none()
    
    async def calculate_domain_price(self, tld: str, wholesale_price: float = None) -> float:
        """Calculate the final price for a domain based on configuration"""
        config = await self.get_active_config()
        if not config:
            # Fallback to default pricing
            return self._get_default_price(tld)
        
        tld_pricing = await self.get_tld_pricing(tld)
        
        # If custom price is set, use it
        if tld_pricing and tld_pricing.custom_price:
            return tld_pricing.custom_price
        
        # Calculate price based on markup
        base_price = wholesale_price or tld_pricing.wholesale_price if tld_pricing else wholesale_price
        
        if not base_price:
            # Fallback to default wholesale price
            base_price = self._get_default_wholesale_price(tld)
        
        # Use custom markup percentage or default
        markup_percentage = (
            tld_pricing.markup_percentage if tld_pricing and tld_pricing.markup_percentage 
            else config.default_markup_percentage
        )
        
        return round(base_price * (1 + markup_percentage / 100), 2)
    
    def _get_default_price(self, tld: str) -> float:
        """Fallback default pricing"""
        default_prices = {
            'com': 8.99,
            'net': 10.99,
            'org': 11.99,
            'info': 12.99,
            'biz': 13.99,
            'co': 14.99,
            'io': 34.99,
            'dev': 14.99,
            'app': 17.99,
        }
        return default_prices.get(tld.lstrip('.'), 15.99)
    
    def _get_default_wholesale_price(self, tld: str) -> float:
        """Default wholesale prices for calculation"""
        wholesale_prices = {
            'com': 7.50,
            'net': 9.00,
            'org': 10.00,
            'info': 11.00,
            'biz': 12.00,
            'co': 13.00,
            'io': 30.00,
            'dev': 12.00,
            'app': 15.00,
        }
        return wholesale_prices.get(tld.lstrip('.'), 13.00)
    
    async def create_config(self, name: str, description: str = None, 
                     default_markup_percentage: float = 20.0) -> DomainPricingConfig:
        """Create a new pricing configuration"""
        # Deactivate existing configs
        await self.db.execute(
            update(DomainPricingConfig).values({"is_active": False})
        )
        
        config = DomainPricingConfig(
            name=name,
            description=description,
            default_markup_percentage=default_markup_percentage,
            is_active=True
        )
        self.db.add(config)
        await self.db.commit()
        await self.db.refresh(config)
        return config
    
    async def update_config(self, config_id: str, **kwargs) -> DomainPricingConfig:
        """Update pricing configuration"""
        result = await self.db.execute(
            select(DomainPricingConfig).filter(
                DomainPricingConfig.id == config_id
            )
        )
        config = result.scalar_one_or_none()
        
        if not config:
            raise ValueError("Configuration not found")
        
        for key, value in kwargs.items():
            if hasattr(config, key):
                setattr(config, key, value)
        
        await self.db.commit()
        await self.db.refresh(config)
        return config
    
    async def set_tld_pricing(self, config_id: str, tld: str, 
                       custom_price: float = None,
                       markup_percentage: float = None,
                       wholesale_price: float = None) -> TLDPricing:
        """Set pricing for a specific TLD"""
        tld = tld.lstrip('.')
        
        # Check if TLD pricing already exists
        result = await self.db.execute(
            select(TLDPricing).filter(
                TLDPricing.config_id == config_id,
                TLDPricing.tld == tld
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            # Update existing
            if custom_price is not None:
                existing.custom_price = custom_price
            if markup_percentage is not None:
                existing.markup_percentage = markup_percentage
            if wholesale_price is not None:
                existing.wholesale_price = wholesale_price
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
        else:
            # Create new
            tld_pricing = TLDPricing(
                config_id=config_id,
                tld=tld,
                custom_price=custom_price,
                markup_percentage=markup_percentage,
                wholesale_price=wholesale_price
            )
            self.db.add(tld_pricing)
            await self.db.commit()
            await self.db.refresh(tld_pricing)
            return tld_pricing
    
    async def get_all_tld_pricing(self, config_id: str = None) -> List[TLDPricing]:
        """Get all TLD pricing configurations"""
        if config_id:
            result = await self.db.execute(
                select(TLDPricing).filter(
                    TLDPricing.config_id == config_id,
                    TLDPricing.is_active == True
                )
            )
            return result.scalars().all()
        else:
            config = await self.get_active_config()
            if not config:
                return []
            result = await self.db.execute(
                select(TLDPricing).filter(
                    TLDPricing.config_id == config.id,
                    TLDPricing.is_active == True
                )
            )
            return result.scalars().all()
    
    async def bulk_update_tld_pricing(self, config_id: str, tld_prices: List[Dict[str, Any]]) -> List[TLDPricing]:
        """Bulk update TLD pricing configurations"""
        results = []
        for tld_data in tld_prices:
            tld = tld_data.get('tld', '').lstrip('.')
            if not tld:
                continue
                
            result = await self.set_tld_pricing(
                config_id=config_id,
                tld=tld,
                custom_price=tld_data.get('custom_price'),
                markup_percentage=tld_data.get('markup_percentage'),
                wholesale_price=tld_data.get('wholesale_price')
            )
            results.append(result)
        
        return results
