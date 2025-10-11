"""
Script to make a user an admin - pass email as argument
"""
import sys
import asyncio
from app.core.database import AsyncSessionLocal
from app.models import User
from sqlalchemy import select


async def make_admin(email: str):
    async with AsyncSessionLocal() as db:
        # Find user by email
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if not user:
            print(f"❌ User with email '{email}' not found.")
            return False
        
        if user.is_admin:
            print(f"✓ User '{email}' is already an admin.")
            return True
        
        # Make user admin
        user.is_admin = True
        await db.commit()
        print(f"✓ User '{email}' is now an admin!")
        return True


async def list_users():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        print("\nCurrent users:")
        print("-" * 80)
        for user in users:
            admin_status = "✓ Admin" if user.is_admin else "  User"
            print(f"{admin_status} | {user.email:30} | {user.full_name:25}")
        print("-" * 80)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m scripts.make_admin_simple <email>")
        asyncio.run(list_users())
        sys.exit(1)
    
    email = sys.argv[1]
    asyncio.run(make_admin(email))

