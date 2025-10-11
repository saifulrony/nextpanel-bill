"""
Script to make a user an admin
"""
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
            print(f"User with email '{email}' not found.")
            return
        
        if user.is_admin:
            print(f"User '{email}' is already an admin.")
            return
        
        # Make user admin
        user.is_admin = True
        await db.commit()
        print(f"User '{email}' is now an admin!")


async def list_users():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        print("\nCurrent users:")
        print("-" * 80)
        for user in users:
            admin_status = "✓ Admin" if user.is_admin else "  User"
            print(f"{admin_status} | {user.email:30} | {user.full_name:25} | ID: {user.id}")
        print("-" * 80)


if __name__ == "__main__":
    print("User Management Script")
    print("=" * 80)
    
    # List all users first
    asyncio.run(list_users())
    
    # Prompt for user email to make admin
    email = input("\nEnter the email address of the user to make admin (or press Enter to skip): ").strip()
    
    if email:
        asyncio.run(make_admin(email))
        print("\nUpdated user list:")
        asyncio.run(list_users())
    else:
        print("No changes made.")

