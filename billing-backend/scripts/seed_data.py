"""
Seed initial data for development
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import AsyncSessionLocal, init_db
from app.models import Plan, User
from app.core.security import hash_password


async def seed_plans():
    """Seed initial pricing plans"""
    async with AsyncSessionLocal() as session:
        # Check if plans exist
        from sqlalchemy import select
        result = await session.execute(select(Plan))
        existing_plans = result.scalars().all()
        
        if existing_plans:
            print("Plans already exist. Skipping...")
            return
        
        plans = [
            Plan(
                name="Starter",
                description="Perfect for individuals and small projects",
                price_monthly=29.00,
                price_yearly=290.00,  # ~20% discount
                max_accounts=1,
                max_domains=3,
                max_databases=5,
                max_emails=10,
                features={
                    "support": "email",
                    "ssl": True,
                    "backups": "weekly"
                }
            ),
            Plan(
                name="Professional",
                description="Best for growing businesses",
                price_monthly=99.00,
                price_yearly=990.00,
                max_accounts=5,
                max_domains=25,
                max_databases=50,
                max_emails=100,
                features={
                    "support": "priority",
                    "ssl": True,
                    "backups": "daily",
                    "staging": True
                }
            ),
            Plan(
                name="Enterprise",
                description="For large organizations",
                price_monthly=299.00,
                price_yearly=2990.00,
                max_accounts=999,
                max_domains=999,
                max_databases=999,
                max_emails=999,
                features={
                    "support": "24/7_phone",
                    "ssl": True,
                    "backups": "hourly",
                    "staging": True,
                    "dedicated_support": True,
                    "white_label": True
                }
            ),
        ]
        
        for plan in plans:
            session.add(plan)
        
        await session.commit()
        print(f"✅ Created {len(plans)} plans")


async def seed_test_user():
    """Seed a test user for development"""
    async with AsyncSessionLocal() as session:
        # Check if user exists
        from sqlalchemy import select
        result = await session.execute(select(User).where(User.email == "test@example.com"))
        existing_user = result.scalars().first()
        
        if existing_user:
            print("Test user already exists. Skipping...")
            return
        
        user = User(
            email="test@example.com",
            password_hash=hash_password("password123"),
            full_name="Test User",
            company_name="Test Company"
        )
        
        session.add(user)
        await session.commit()
        print("✅ Created test user (email: test@example.com, password: password123)")


async def main():
    """Main seeding function"""
    print("🌱 Seeding database...")
    
    # Initialize database
    await init_db()
    print("✅ Database initialized")
    
    # Seed data
    await seed_plans()
    await seed_test_user()
    
    print("✅ Seeding complete!")


if __name__ == "__main__":
    asyncio.run(main())

