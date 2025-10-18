#!/usr/bin/env python3
"""
Script to create domain pricing tables in the database
"""

import sys
import os
import asyncio
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base
from app.models.domain_pricing import DomainPricingConfig, TLDPricing
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_domain_pricing_tables():
    """Create domain pricing tables"""
    try:
        logger.info("Creating domain pricing tables...")
        
        # Create all tables using async engine
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all, tables=[
                DomainPricingConfig.__table__,
                TLDPricing.__table__
            ])
        
        logger.info("✅ Domain pricing tables created successfully!")
        
        # Create a default configuration
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy.orm import sessionmaker
        
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        
        async with async_session() as session:
            try:
                # Check if there's already a configuration
                from sqlalchemy import select
                result = await session.execute(
                    select(DomainPricingConfig).limit(1)
                )
                existing_config = result.scalar_one_or_none()
                
                if not existing_config:
                    # Create default configuration
                    default_config = DomainPricingConfig(
                        name="Default Pricing Configuration",
                        description="Default domain pricing configuration with 20% markup",
                        default_markup_percentage=20.0,
                        is_active=True
                    )
                    session.add(default_config)
                    await session.commit()
                    await session.refresh(default_config)
                    
                    # Add some common TLD pricing
                    common_tlds = [
                        {'tld': 'com', 'wholesale_price': 7.50, 'markup_percentage': 20.0},
                        {'tld': 'net', 'wholesale_price': 9.00, 'markup_percentage': 20.0},
                        {'tld': 'org', 'wholesale_price': 10.00, 'markup_percentage': 20.0},
                        {'tld': 'info', 'wholesale_price': 11.00, 'markup_percentage': 20.0},
                        {'tld': 'biz', 'wholesale_price': 12.00, 'markup_percentage': 20.0},
                        {'tld': 'co', 'wholesale_price': 13.00, 'markup_percentage': 20.0},
                        {'tld': 'io', 'wholesale_price': 30.00, 'markup_percentage': 20.0},
                        {'tld': 'dev', 'wholesale_price': 12.00, 'markup_percentage': 20.0},
                        {'tld': 'app', 'wholesale_price': 15.00, 'markup_percentage': 20.0},
                    ]
                    
                    for tld_data in common_tlds:
                        tld_pricing = TLDPricing(
                            config_id=default_config.id,
                            tld=tld_data['tld'],
                            wholesale_price=tld_data['wholesale_price'],
                            markup_percentage=tld_data['markup_percentage']
                        )
                        session.add(tld_pricing)
                    
                    await session.commit()
                    logger.info("✅ Default pricing configuration created with common TLDs")
                else:
                    logger.info("ℹ️  Pricing configuration already exists, skipping default creation")
                    
            except Exception as e:
                logger.error(f"Error creating default configuration: {e}")
                await session.rollback()
            
    except Exception as e:
        logger.error(f"Error creating domain pricing tables: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(create_domain_pricing_tables())
