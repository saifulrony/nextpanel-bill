#!/usr/bin/env python3
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path('.').absolute()))
from app.core.database import AsyncSessionLocal
from app.models import PaymentGateway, PaymentGatewayType
from app.api.v1.payment_gateways import test_payment_gateway
from app.schemas import PaymentGatewayTestRequest
from sqlalchemy import select

async def test_gateway():
    async with AsyncSessionLocal() as session:
        # Get the first Stripe gateway
        result = await session.execute(
            select(PaymentGateway).where(PaymentGateway.type == PaymentGatewayType.STRIPE).limit(1)
        )
        gateway = result.scalars().first()
        
        if not gateway:
            print("No Stripe gateway found")
            return
        
        print(f"Testing gateway: {gateway.name}")
        print(f"API Key: {'Set' if gateway.api_key else 'Missing'}")
        print(f"Secret Key: {'Set' if gateway.secret_key else 'Missing'}")
        
        # Test the gateway
        try:
            request = PaymentGatewayTestRequest(
                gateway_id=gateway.id,
                test_amount=1.00,
                test_currency="USD"
            )
            
            # Simulate the test logic
            if gateway.type == PaymentGatewayType.STRIPE:
                if not gateway.api_key or not gateway.secret_key:
                    print("❌ Test failed: Missing API credentials")
                else:
                    print("✅ Test would succeed: API credentials are set")
            else:
                print(f"❌ Test not implemented for {gateway.type}")
                
        except Exception as e:
            print(f"❌ Test error: {e}")

if __name__ == "__main__":
    asyncio.run(test_gateway())
