#!/usr/bin/env python3
"""
Script to set test Stripe sandbox keys in the PaymentGateway table
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models import PaymentGateway
from sqlalchemy import update

async def set_test_stripe_keys():
    engine = create_async_engine('sqlite+aiosqlite:///./billing.db')
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Update the Stripe gateway with test keys
        await session.execute(
            update(PaymentGateway)
            .where(PaymentGateway.name == "Stripe2")
            .values(
                sandbox_api_key="pk_test_51234567890abcdef_test_key",
                sandbox_secret_key="sk_test_51234567890abcdef_test_key"
            )
        )
        
        await session.commit()
        
        print("✅ Test Stripe sandbox keys set!")
        print("🔧 Now you can:")
        print("   1. Go to /admin/payments/gateways")
        print("   2. Edit the Stripe gateway")
        print("   3. Replace with your real sandbox keys")
        print("   4. Save and test payments")

if __name__ == "__main__":
    asyncio.run(set_test_stripe_keys())
