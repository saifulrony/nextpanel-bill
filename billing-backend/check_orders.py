#!/usr/bin/env python3
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path('.').absolute()))
from app.core.database import AsyncSessionLocal
from app.models import Order, User
from sqlalchemy import select, func

async def check_orders():
    async with AsyncSessionLocal() as session:
        # Check total orders
        result = await session.execute(select(func.count(Order.id)))
        total_orders = result.scalar()
        print(f'Total orders in database: {total_orders}')
        
        # Get recent orders
        result = await session.execute(select(Order).order_by(Order.created_at.desc()).limit(5))
        orders = result.scalars().all()
        
        print(f'Recent orders:')
        for order in orders:
            print(f'  - Order ID: {order.id}')
            print(f'    Invoice: {order.invoice_number}')
            print(f'    Total: ${order.total}')
            print(f'    Status: {order.status}')
            print(f'    Created: {order.created_at}')
            print(f'    Customer: {order.customer_id}')
            print()
        
        # Check users
        result = await session.execute(select(func.count(User.id)))
        total_users = result.scalar()
        print(f'Total users in database: {total_users}')

if __name__ == "__main__":
    asyncio.run(check_orders())
