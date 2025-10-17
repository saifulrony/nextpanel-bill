#!/usr/bin/env python3
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path('.').absolute()))
from app.core.database import AsyncSessionLocal
from app.models import PaymentGateway, PaymentGatewayType
from sqlalchemy import select, update

async def setup_credentials():
    async with AsyncSessionLocal() as session:
        # Get all Stripe gateways
        result = await session.execute(
            select(PaymentGateway).where(PaymentGateway.type == PaymentGatewayType.STRIPE)
        )
        gateways = result.scalars().all()
        
        print(f'Found {len(gateways)} Stripe gateways')
        
        for gateway in gateways:
            print(f'Updating {gateway.name}...')
            
            # Set test credentials for Stripe
            gateway.api_key = "pk_test_51234567890abcdef"  # Stripe test publishable key
            gateway.secret_key = "sk_test_51234567890abcdef"  # Stripe test secret key
            gateway.sandbox_api_key = "pk_test_51234567890abcdef"
            gateway.sandbox_secret_key = "sk_test_51234567890abcdef"
            gateway.is_sandbox = True
            gateway.status = "active"  # Activate the gateway
            
            print(f'  ✅ Set test API credentials for {gateway.name}')
        
        await session.commit()
        print('✅ All gateways updated with test credentials')

if __name__ == "__main__":
    asyncio.run(setup_credentials())
