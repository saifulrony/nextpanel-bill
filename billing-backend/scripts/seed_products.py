#!/usr/bin/env python3
"""
Seed comprehensive product catalog
Includes hosting, domain, software, and other products
"""
import sys
import os
import asyncio
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models import Plan
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Product catalog data
PRODUCTS = [
    # Hosting Products
    {
        "name": "Shared Hosting - Starter",
        "description": "Perfect for personal websites and blogs",
        "price_monthly": 4.99,
        "price_yearly": 49.99,
        "max_accounts": 1,
        "max_domains": 1,
        "max_databases": 5,
        "max_emails": 10,
        "features": {
            "category": "hosting",
            "type": "shared",
            "storage": "10 GB SSD",
            "bandwidth": "100 GB",
            "ssl": True,
            "backups": "Weekly",
            "support": "24/7 Email",
            "uptime": "99.9%"
        }
    },
    {
        "name": "Shared Hosting - Business",
        "description": "Great for small businesses and growing sites",
        "price_monthly": 9.99,
        "price_yearly": 99.99,
        "max_accounts": 5,
        "max_domains": 5,
        "max_databases": 25,
        "max_emails": 50,
        "features": {
            "category": "hosting",
            "type": "shared",
            "storage": "50 GB SSD",
            "bandwidth": "500 GB",
            "ssl": True,
            "backups": "Daily",
            "support": "24/7 Phone & Email",
            "uptime": "99.9%",
            "staging": True
        }
    },
    {
        "name": "Shared Hosting - Premium",
        "description": "For high-traffic websites and multiple sites",
        "price_monthly": 19.99,
        "price_yearly": 199.99,
        "max_accounts": 25,
        "max_domains": 25,
        "max_databases": 100,
        "max_emails": 200,
        "features": {
            "category": "hosting",
            "type": "shared",
            "storage": "100 GB SSD",
            "bandwidth": "Unlimited",
            "ssl": True,
            "backups": "Daily",
            "support": "24/7 Priority",
            "uptime": "99.9%",
            "staging": True,
            "cdn": True
        }
    },
    
    # VPS Hosting
    {
        "name": "VPS - Entry",
        "description": "Entry-level VPS for growing applications",
        "price_monthly": 29.99,
        "price_yearly": 299.99,
        "max_accounts": 50,
        "max_domains": 50,
        "max_databases": 200,
        "max_emails": 500,
        "features": {
            "category": "hosting",
            "type": "vps",
            "cpu": "2 vCPU",
            "ram": "4 GB",
            "storage": "80 GB SSD",
            "bandwidth": "2 TB",
            "ssl": True,
            "backups": "Daily",
            "support": "24/7 Priority",
            "root_access": True,
            "snapshots": True
        }
    },
    {
        "name": "VPS - Business",
        "description": "Powerful VPS for business applications",
        "price_monthly": 59.99,
        "price_yearly": 599.99,
        "max_accounts": 100,
        "max_domains": 100,
        "max_databases": 500,
        "max_emails": 1000,
        "features": {
            "category": "hosting",
            "type": "vps",
            "cpu": "4 vCPU",
            "ram": "8 GB",
            "storage": "160 GB SSD",
            "bandwidth": "4 TB",
            "ssl": True,
            "backups": "Daily",
            "support": "24/7 Priority",
            "root_access": True,
            "snapshots": True,
            "monitoring": True
        }
    },
    {
        "name": "VPS - Enterprise",
        "description": "High-performance VPS for mission-critical apps",
        "price_monthly": 119.99,
        "price_yearly": 1199.99,
        "max_accounts": 200,
        "max_domains": 200,
        "max_databases": 1000,
        "max_emails": 2000,
        "features": {
            "category": "hosting",
            "type": "vps",
            "cpu": "8 vCPU",
            "ram": "16 GB",
            "storage": "320 GB SSD",
            "bandwidth": "8 TB",
            "ssl": True,
            "backups": "Hourly",
            "support": "24/7 Dedicated",
            "root_access": True,
            "snapshots": True,
            "monitoring": True,
            "ddos_protection": True
        }
    },
    
    # Domain Products
    {
        "name": "Domain Registration - .com",
        "description": "Register a .com domain for 1 year",
        "price_monthly": 1.25,
        "price_yearly": 14.99,
        "max_accounts": 1,
        "max_domains": 1,
        "max_databases": 0,
        "max_emails": 0,
        "features": {
            "category": "domain",
            "type": "registration",
            "tld": ".com",
            "dns_management": True,
            "email_forwarding": True,
            "transfer_lock": True,
            "auto_renewal": True
        }
    },
    {
        "name": "Domain Privacy Protection",
        "description": "WHOIS privacy for your domain",
        "price_monthly": 0.83,
        "price_yearly": 9.99,
        "max_accounts": 0,
        "max_domains": 0,
        "max_databases": 0,
        "max_emails": 0,
        "features": {
            "category": "domain",
            "type": "addon",
            "whois_privacy": True,
            "spam_protection": True
        }
    },
    
    # Software/Licenses
    {
        "name": "cPanel License - Solo",
        "description": "cPanel control panel for single server",
        "price_monthly": 15.99,
        "price_yearly": 159.99,
        "max_accounts": 1,
        "max_domains": 100,
        "max_databases": 500,
        "max_emails": 1000,
        "features": {
            "category": "software",
            "type": "control_panel",
            "software": "cPanel/WHM",
            "accounts": "Up to 5",
            "support": "Email",
            "updates": True
        }
    },
    {
        "name": "cPanel License - Admin",
        "description": "cPanel for up to 100 accounts",
        "price_monthly": 45.99,
        "price_yearly": 459.99,
        "max_accounts": 100,
        "max_domains": 1000,
        "max_databases": 5000,
        "max_emails": 10000,
        "features": {
            "category": "software",
            "type": "control_panel",
            "software": "cPanel/WHM",
            "accounts": "Up to 100",
            "support": "Priority",
            "updates": True,
            "branding": True
        }
    },
    
    # SSL Certificates
    {
        "name": "SSL Certificate - Basic",
        "description": "Domain validated SSL certificate",
        "price_monthly": 4.99,
        "price_yearly": 49.99,
        "max_accounts": 0,
        "max_domains": 1,
        "max_databases": 0,
        "max_emails": 0,
        "features": {
            "category": "ssl",
            "type": "dv",
            "validation": "Domain Validated",
            "warranty": "$10,000",
            "issuance": "Minutes",
            "green_bar": False
        }
    },
    {
        "name": "SSL Certificate - Wildcard",
        "description": "Secure unlimited subdomains",
        "price_monthly": 12.49,
        "price_yearly": 124.99,
        "max_accounts": 0,
        "max_domains": 1,
        "max_databases": 0,
        "max_emails": 0,
        "features": {
            "category": "ssl",
            "type": "wildcard",
            "validation": "Domain Validated",
            "warranty": "$50,000",
            "issuance": "Minutes",
            "subdomains": "Unlimited",
            "green_bar": False
        }
    },
    {
        "name": "SSL Certificate - EV",
        "description": "Extended validation with green bar",
        "price_monthly": 24.99,
        "price_yearly": 249.99,
        "max_accounts": 0,
        "max_domains": 1,
        "max_databases": 0,
        "max_emails": 0,
        "features": {
            "category": "ssl",
            "type": "ev",
            "validation": "Extended Validated",
            "warranty": "$1,000,000",
            "issuance": "1-3 days",
            "green_bar": True,
            "trust_seal": True
        }
    },
    
    # Email Services
    {
        "name": "Professional Email - Basic",
        "description": "Professional email hosting",
        "price_monthly": 2.99,
        "price_yearly": 29.99,
        "max_accounts": 0,
        "max_domains": 1,
        "max_databases": 0,
        "max_emails": 10,
        "features": {
            "category": "email",
            "type": "hosted",
            "storage": "10 GB per mailbox",
            "spam_filter": True,
            "virus_protection": True,
            "webmail": True,
            "mobile_sync": True
        }
    },
    {
        "name": "Professional Email - Business",
        "description": "Advanced email for businesses",
        "price_monthly": 5.99,
        "price_yearly": 59.99,
        "max_accounts": 0,
        "max_domains": 5,
        "max_databases": 0,
        "max_emails": 50,
        "features": {
            "category": "email",
            "type": "hosted",
            "storage": "50 GB per mailbox",
            "spam_filter": True,
            "virus_protection": True,
            "webmail": True,
            "mobile_sync": True,
            "calendar": True,
            "contacts": True,
            "archiving": True
        }
    },
    
    # Backup Solutions
    {
        "name": "Cloud Backup - Standard",
        "description": "Automated cloud backup solution",
        "price_monthly": 9.99,
        "price_yearly": 99.99,
        "max_accounts": 0,
        "max_domains": 0,
        "max_databases": 0,
        "max_emails": 0,
        "features": {
            "category": "backup",
            "type": "cloud",
            "storage": "100 GB",
            "frequency": "Daily",
            "retention": "30 days",
            "encryption": True,
            "restore": "Self-service"
        }
    },
    {
        "name": "Cloud Backup - Pro",
        "description": "Advanced backup with longer retention",
        "price_monthly": 19.99,
        "price_yearly": 199.99,
        "max_accounts": 0,
        "max_domains": 0,
        "max_databases": 0,
        "max_emails": 0,
        "features": {
            "category": "backup",
            "type": "cloud",
            "storage": "500 GB",
            "frequency": "Hourly",
            "retention": "90 days",
            "encryption": True,
            "restore": "Priority support",
            "versioning": True
        }
    },
    
    # CDN Services
    {
        "name": "CDN Service - Starter",
        "description": "Content delivery network",
        "price_monthly": 14.99,
        "price_yearly": 149.99,
        "max_accounts": 0,
        "max_domains": 5,
        "max_databases": 0,
        "max_emails": 0,
        "features": {
            "category": "cdn",
            "type": "standard",
            "bandwidth": "1 TB",
            "ssl": True,
            "ddos_protection": True,
            "caching": True,
            "analytics": True
        }
    }
]


async def seed_products():
    """Seed product catalog"""
    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://') if settings.DATABASE_URL.startswith('postgresql://') else settings.DATABASE_URL,
        echo=False
    )
    
    # Create async session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        logger.info("Starting product catalog seeding...")
        
        created_count = 0
        skipped_count = 0
        
        for product_data in PRODUCTS:
            try:
                # Check if product already exists
                from sqlalchemy import select
                result = await session.execute(
                    select(Plan).where(Plan.name == product_data['name'])
                )
                existing = result.scalars().first()
                
                if existing:
                    logger.info(f"Product already exists: {product_data['name']}")
                    skipped_count += 1
                    continue
                
                # Create new product
                product = Plan(
                    name=product_data['name'],
                    description=product_data['description'],
                    price_monthly=product_data['price_monthly'],
                    price_yearly=product_data['price_yearly'],
                    max_accounts=product_data['max_accounts'],
                    max_domains=product_data['max_domains'],
                    max_databases=product_data['max_databases'],
                    max_emails=product_data['max_emails'],
                    features=product_data['features'],
                    is_active=True
                )
                
                session.add(product)
                created_count += 1
                logger.info(f"Created: {product_data['name']}")
                
            except Exception as e:
                logger.error(f"Error creating product {product_data['name']}: {str(e)}")
                continue
        
        await session.commit()
        
        logger.info("="*60)
        logger.info(f"Product seeding complete!")
        logger.info(f"Created: {created_count} products")
        logger.info(f"Skipped: {skipped_count} products")
        logger.info("="*60)


if __name__ == "__main__":
    asyncio.run(seed_products())

