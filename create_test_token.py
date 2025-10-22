#!/usr/bin/env python3
"""
Create a test JWT token for API testing
"""
import asyncio
from app.core.database import get_db
from app.models import User
from app.core.security import create_access_token
from sqlalchemy import select

async def create_test_token():
    async for db in get_db():
        # Get the first user
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        
        if user:
            # Create a token for this user
            token_data = {"sub": user.id, "email": user.email}
            token = create_access_token(token_data)
            print(f"Test token for user {user.email} (ID: {user.id}):")
            print(token)
            print(f"\nUse this in your frontend localStorage:")
            print(f"localStorage.setItem('access_token', '{token}')")
        else:
            print("No users found in database")
        break

if __name__ == "__main__":
    asyncio.run(create_test_token())
