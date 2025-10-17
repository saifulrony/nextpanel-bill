#!/usr/bin/env python3
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path('.').absolute()))
from app.core.database import AsyncSessionLocal
from app.models import PaymentGateway
from sqlalchemy import select

async def check_gateways():
    async with AsyncSessionLocal() as session:
        # Get all payment gateways
        result = await session.execute(select(PaymentGateway))
        gateways = result.scalars().all()
        
        print(f'Found {len(gateways)} payment gateways:')
        print()
        
        for gateway in gateways:
            print(f'Gateway: {gateway.name}')
            print(f'  Type: {gateway.type}')
            print(f'  Status: {gateway.status}')
            print(f'  API Key: {"✅ Set" if gateway.api_key else "❌ Missing"}')
            print(f'  Secret Key: {"✅ Set" if gateway.secret_key else "❌ Missing"}')
            print(f'  Sandbox: {gateway.is_sandbox}')
            print(f'  Created: {gateway.created_at}')
            print()

if __name__ == "__main__":
    asyncio.run(check_gateways())
