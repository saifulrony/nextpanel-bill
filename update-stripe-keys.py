#!/usr/bin/env python3
"""
Script to update Stripe API keys in the database
Usage: python update-stripe-keys.py <publishable_key> <secret_key>
"""

import sys
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update
from app.core.config import settings
from app.models import PaymentGateway

DATABASE_URL = settings.DATABASE_URL

async def update_stripe_keys(publishable_key: str, secret_key: str):
    """Update Stripe API keys in the database"""
    engine = create_async_engine(DATABASE_URL, echo=True)
    AsyncSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        class_=AsyncSession,
    )

    async with AsyncSessionLocal() as session:
        # Find the Stripe gateway
        result = await session.execute(
            select(PaymentGateway).filter_by(name="Stripe")
        )
        stripe_gateway = result.scalar_one_or_none()

        if stripe_gateway:
            # Update the gateway with sandbox keys
            await session.execute(
                update(PaymentGateway)
                .where(PaymentGateway.id == stripe_gateway.id)
                .values(
                    sandbox_api_key=publishable_key,
                    sandbox_secret_key=secret_key,
                    is_sandbox=True,
                    status='active'
                )
            )
            await session.commit()
            print("✅ Updated Stripe sandbox keys successfully!")
            print(f"   Publishable Key: {publishable_key[:20]}...")
            print(f"   Secret Key: {secret_key[:20]}...")
        else:
            print("❌ Stripe gateway not found in database")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python update-stripe-keys.py <publishable_key> <secret_key>")
        print("Example: python update-stripe-keys.py pk_test_... sk_test_...")
        sys.exit(1)
    
    publishable_key = sys.argv[1]
    secret_key = sys.argv[2]
    
    # Validate key formats
    if not publishable_key.startswith('pk_test_'):
        print("❌ Invalid publishable key format. Should start with 'pk_test_'")
        sys.exit(1)
    
    if not secret_key.startswith('sk_test_'):
        print("❌ Invalid secret key format. Should start with 'sk_test_'")
        sys.exit(1)
    
    asyncio.run(update_stripe_keys(publishable_key, secret_key))