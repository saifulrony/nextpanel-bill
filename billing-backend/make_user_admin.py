#!/usr/bin/env python3
"""
Script to make a user admin
"""
import asyncio
import sys
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.core.database import engine
from app.models import User

async def make_user_admin(email: str):
    """Make a user admin by email"""
    async with AsyncSession(engine) as db:
        # Find user by email
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if not user:
            print(f"❌ User with email '{email}' not found")
            return False
        
        if user.is_admin:
            print(f"✅ User '{email}' is already an admin")
            return True
        
        # Update user to admin
        await db.execute(
            update(User)
            .where(User.email == email)
            .values(is_admin=True)
        )
        await db.commit()
        
        print(f"✅ User '{email}' is now an admin")
        return True

async def list_users():
    """List all users"""
    async with AsyncSession(engine) as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        print("\n📋 All Users:")
        print("-" * 80)
        for user in users:
            admin_status = "✅ Admin" if user.is_admin else "👤 User"
            active_status = "🟢 Active" if user.is_active else "🔴 Inactive"
            print(f"{admin_status} | {active_status} | {user.full_name} ({user.email})")
        print("-" * 80)

async def main():
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python3 make_user_admin.py <email>           - Make user admin")
        print("  python3 make_user_admin.py --list           - List all users")
        print("  python3 make_user_admin.py --list-admins    - List admin users only")
        return
    
    if sys.argv[1] == "--list":
        await list_users()
    elif sys.argv[1] == "--list-admins":
        async with AsyncSession(engine) as db:
            result = await db.execute(select(User).where(User.is_admin == True))
            admins = result.scalars().all()
            
            print("\n👑 Admin Users:")
            print("-" * 50)
            for admin in admins:
                active_status = "🟢" if admin.is_active else "🔴"
                print(f"{active_status} {admin.full_name} ({admin.email})")
            print("-" * 50)
    else:
        email = sys.argv[1]
        await make_user_admin(email)

if __name__ == "__main__":
    asyncio.run(main())

