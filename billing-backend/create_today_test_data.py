#!/usr/bin/env python3
"""
Create test orders for today to verify dashboard filtering works
"""
import asyncio
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import uuid

from app.models import Payment, User, PaymentStatus

DATABASE_URL = "sqlite+aiosqlite:///./billing.db"

async def create_test_payments():
    """Create test payments for today and yesterday"""
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Get a user to assign payments to
        result = await session.execute(
            select(User).where(User.is_admin == False).limit(1)
        )
        user = result.scalars().first()
        
        if not user:
            print("❌ No customer user found. Please create a user first.")
            return
        
        print(f"✅ Found user: {user.email} (ID: {user.id})")
        
        now = datetime.utcnow()
        today_midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_midnight = today_midnight - timedelta(days=1)
        
        # Create payments for today
        today_payments = [
            Payment(
                id=str(uuid.uuid4()),
                user_id=user.id,
                amount=49.99,
                currency="USD",
                status=PaymentStatus.SUCCEEDED,
                payment_method="credit_card",
                created_at=now - timedelta(hours=2),  # 2 hours ago
            ),
            Payment(
                id=str(uuid.uuid4()),
                user_id=user.id,
                amount=99.99,
                currency="USD",
                status=PaymentStatus.SUCCEEDED,
                payment_method="credit_card",
                created_at=now - timedelta(minutes=30),  # 30 minutes ago
            ),
        ]
        
        # Create payment for yesterday
        yesterday_payment = Payment(
            id=str(uuid.uuid4()),
            user_id=user.id,
            amount=29.99,
            currency="USD",
            status=PaymentStatus.SUCCEEDED,
            payment_method="credit_card",
            created_at=yesterday_midnight + timedelta(hours=14),  # Yesterday at 2 PM
        )
        
        # Add all payments
        session.add_all(today_payments + [yesterday_payment])
        await session.commit()
        
        print(f"\n✅ Created test data:")
        print(f"   📅 Today ({now.strftime('%Y-%m-%d')}): 2 payments ($49.99 + $99.99 = $149.98)")
        print(f"   📅 Yesterday ({(now - timedelta(days=1)).strftime('%Y-%m-%d')}): 1 payment ($29.99)")
        print(f"\n🎉 Total revenue created: $179.97")
        print(f"\n💡 Now refresh your dashboard and try:")
        print(f"   - Select 'Today' → Should show 2 orders, $149.98 revenue")
        print(f"   - Select 'Yesterday' → Should show 1 order, $29.99 revenue")
        print(f"   - Select 'Week' → Should show all recent orders")
    
    await engine.dispose()

if __name__ == "__main__":
    print("🔧 Creating test data for today and yesterday...")
    asyncio.run(create_test_payments())

