#!/usr/bin/env python3
"""
Script to update Stripe sandbox keys in the PaymentGateway table
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models import PaymentGateway
from sqlalchemy import select, update

async def update_stripe_keys():
    engine = create_async_engine('sqlite+aiosqlite:///./billing.db')
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Find the Stripe gateway
        result = await session.execute(
            select(PaymentGateway).where(PaymentGateway.name == "Stripe2")
        )
        gateway = result.scalars().first()
        
        if not gateway:
            print("❌ Stripe gateway not found!")
            return
        
        print(f"📋 Current Stripe Gateway: {gateway.name}")
        print(f"   Type: {gateway.type}")
        print(f"   Status: {gateway.status}")
        print(f"   Is Sandbox: {gateway.is_sandbox}")
        print(f"   Sandbox API Key: {gateway.sandbox_api_key[:20] if gateway.sandbox_api_key else 'EMPTY'}...")
        print(f"   Sandbox Secret Key: {gateway.sandbox_secret_key[:20] if gateway.sandbox_secret_key else 'EMPTY'}...")
        print()
        
        # Get keys from user
        print("🔑 Please enter your Stripe sandbox keys:")
        print("   Get them from: https://dashboard.stripe.com/test/apikeys")
        print()
        
        sandbox_api_key = input("Enter Sandbox Publishable Key (pk_test_...): ").strip()
        sandbox_secret_key = input("Enter Sandbox Secret Key (sk_test_...): ").strip()
        
        if not sandbox_api_key.startswith('pk_test_'):
            print("❌ Invalid publishable key format. Should start with 'pk_test_'")
            return
            
        if not sandbox_secret_key.startswith('sk_test_'):
            print("❌ Invalid secret key format. Should start with 'sk_test_'")
            return
        
        # Update the gateway
        await session.execute(
            update(PaymentGateway)
            .where(PaymentGateway.id == gateway.id)
            .values(
                sandbox_api_key=sandbox_api_key,
                sandbox_secret_key=sandbox_secret_key
            )
        )
        
        await session.commit()
        
        print("✅ Stripe sandbox keys updated successfully!")
        print("🔄 Please restart the backend: docker-compose restart backend")
        print("🧪 Then test a payment - you should see it in your Stripe dashboard!")

if __name__ == "__main__":
    asyncio.run(update_stripe_keys())
