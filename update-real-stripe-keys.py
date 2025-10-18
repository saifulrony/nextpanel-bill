#!/usr/bin/env python3
"""
Script to update with real Stripe sandbox keys
Replace the keys below with your actual Stripe sandbox keys
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models import PaymentGateway
from sqlalchemy import update

async def update_real_stripe_keys():
    engine = create_async_engine('sqlite+aiosqlite:///./billing.db')
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # REPLACE THESE WITH YOUR REAL STRIPE SANDBOX KEYS
        # Get them from: https://dashboard.stripe.com/test/apikeys
        sandbox_api_key = "pk_test_YOUR_REAL_PUBLISHABLE_KEY_HERE"
        sandbox_secret_key = "sk_test_YOUR_REAL_SECRET_KEY_HERE"
        
        if sandbox_api_key == "pk_test_YOUR_REAL_PUBLISHABLE_KEY_HERE":
            print("❌ Please edit this script and replace with your real Stripe keys!")
            print("   Get them from: https://dashboard.stripe.com/test/apikeys")
            print()
            print("   Current test keys:")
            result = await session.execute(select(PaymentGateway).where(PaymentGateway.name == 'Stripe2'))
            gateway = result.scalars().first()
            if gateway:
                print(f"   Sandbox API Key: {gateway.sandbox_api_key[:20]}...")
                print(f"   Sandbox Secret Key: {gateway.sandbox_secret_key[:20]}...")
            return
        
        # Update the Stripe gateway
        await session.execute(
            update(PaymentGateway)
            .where(PaymentGateway.name == 'Stripe2')
            .values(
                sandbox_api_key=sandbox_api_key,
                sandbox_secret_key=sandbox_secret_key
            )
        )
        
        await session.commit()
        
        print("✅ Real Stripe sandbox keys updated!")
        print("🔄 Please restart the backend: docker-compose restart backend")
        print("🧪 Then test a payment - you should see it in your Stripe dashboard!")

if __name__ == "__main__":
    asyncio.run(update_real_stripe_keys())