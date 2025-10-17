#!/usr/bin/env python3
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path('.').absolute()))
from app.core.database import AsyncSessionLocal
from app.models import Order, OrderStatus
from sqlalchemy import select, update

async def update_orders():
    async with AsyncSessionLocal() as session:
        # Get all pending orders
        result = await session.execute(select(Order).where(Order.status == OrderStatus.PENDING))
        orders = result.scalars().all()
        
        print(f'Found {len(orders)} pending orders')
        
        # Update them to completed
        for order in orders:
            print(f'Updating order {order.invoice_number} from {order.status} to COMPLETED')
            order.status = OrderStatus.COMPLETED
        
        await session.commit()
        print('All orders updated to COMPLETED status')

if __name__ == "__main__":
    asyncio.run(update_orders())
