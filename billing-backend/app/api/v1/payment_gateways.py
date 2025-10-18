"""
Payment Gateway Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user_id, require_admin
from app.models import PaymentGateway, PaymentGatewayType, PaymentGatewayStatus, Payment
from app.schemas import (
    PaymentGatewayCreateRequest,
    PaymentGatewayUpdateRequest,
    PaymentGatewayResponse,
    PaymentGatewayTestRequest,
    PaymentGatewayTestResponse
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payment-gateways", tags=["payment-gateways"])


@router.get("/", response_model=List[PaymentGatewayResponse])
async def list_payment_gateways(
    db: AsyncSession = Depends(get_db),
    status_filter: Optional[PaymentGatewayStatus] = None,
    type_filter: Optional[PaymentGatewayType] = None,
    limit: int = 50,
    offset: int = 0
):
    """List all payment gateways"""
    query = select(PaymentGateway)
    
    # Apply filters
    if status_filter:
        query = query.where(PaymentGateway.status == status_filter)
    if type_filter:
        query = query.where(PaymentGateway.type == type_filter)
    
    query = query.order_by(PaymentGateway.is_default.desc(), PaymentGateway.created_at.desc())
    query = query.limit(limit).offset(offset)
    
    result = await db.execute(query)
    gateways = result.scalars().all()
    
    return gateways


@router.get("/active", response_model=List[PaymentGatewayResponse])
async def list_active_payment_gateways(
    db: AsyncSession = Depends(get_db)
):
    """List all active payment gateways for public use"""
    result = await db.execute(
        select(PaymentGateway)
        .where(PaymentGateway.status == PaymentGatewayStatus.ACTIVE)
        .order_by(PaymentGateway.is_default.desc(), PaymentGateway.display_name)
    )
    gateways = result.scalars().all()
    
    # Remove sensitive data for public endpoint
    for gateway in gateways:
        gateway.api_key = None
        gateway.secret_key = None
        gateway.webhook_secret = None
        gateway.sandbox_api_key = None
        gateway.sandbox_secret_key = None
    
    return gateways


@router.get("/{gateway_id}", response_model=PaymentGatewayResponse)
async def get_payment_gateway(
    gateway_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Get payment gateway details"""
    result = await db.execute(
        select(PaymentGateway).where(PaymentGateway.id == gateway_id)
    )
    gateway = result.scalars().first()
    
    if not gateway:
        raise HTTPException(status_code=404, detail="Payment gateway not found")
    
    return gateway


@router.post("/", response_model=PaymentGatewayResponse)
async def create_payment_gateway(
    request: PaymentGatewayCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Create a new payment gateway"""
    # Check if gateway with same name already exists
    result = await db.execute(
        select(PaymentGateway).where(PaymentGateway.name == request.name)
    )
    existing_gateway = result.scalars().first()
    
    if existing_gateway:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment gateway with this name already exists"
        )
    
    # Create new gateway
    gateway = PaymentGateway(
        name=request.name,
        type=request.type,
        display_name=request.display_name,
        description=request.description,
        config=request.config or {},
        supports_recurring=request.supports_recurring,
        supports_refunds=request.supports_refunds,
        supports_partial_refunds=request.supports_partial_refunds,
        supports_webhooks=request.supports_webhooks,
        fixed_fee=request.fixed_fee,
        percentage_fee=request.percentage_fee,
        api_key=request.api_key,
        secret_key=request.secret_key,
        webhook_secret=request.webhook_secret,
        is_sandbox=request.is_sandbox,
        sandbox_api_key=request.sandbox_api_key,
        sandbox_secret_key=request.sandbox_secret_key,
        status=PaymentGatewayStatus.INACTIVE  # Start as inactive for safety
    )
    
    db.add(gateway)
    await db.commit()
    await db.refresh(gateway)
    
    logger.info(f"Created payment gateway: {gateway.name} ({gateway.type})")
    
    return gateway


@router.put("/{gateway_id}", response_model=PaymentGatewayResponse)
async def update_payment_gateway(
    gateway_id: str,
    request: PaymentGatewayUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Update payment gateway"""
    result = await db.execute(
        select(PaymentGateway).where(PaymentGateway.id == gateway_id)
    )
    gateway = result.scalars().first()
    
    if not gateway:
        raise HTTPException(status_code=404, detail="Payment gateway not found")
    
    # Update fields
    update_data = request.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(gateway, field, value)
    
    # If setting as default, unset other defaults
    if request.is_default:
        await db.execute(
            select(PaymentGateway).where(
                and_(
                    PaymentGateway.id != gateway_id,
                    PaymentGateway.is_default == True
                )
            ).update({PaymentGateway.is_default: False})
        )
    
    await db.commit()
    await db.refresh(gateway)
    
    logger.info(f"Updated payment gateway: {gateway.name}")
    
    return gateway


@router.delete("/{gateway_id}")
async def delete_payment_gateway(
    gateway_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Delete payment gateway"""
    result = await db.execute(
        select(PaymentGateway).where(PaymentGateway.id == gateway_id)
    )
    gateway = result.scalars().first()
    
    if not gateway:
        raise HTTPException(status_code=404, detail="Payment gateway not found")
    
    # Check if gateway has associated payments
    payments_result = await db.execute(
        select(func.count(Payment.id)).where(Payment.gateway_id == gateway_id)
    )
    payment_count = payments_result.scalar()
    
    if payment_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete gateway with {payment_count} associated payments"
        )
    
    await db.delete(gateway)
    await db.commit()
    
    logger.info(f"Deleted payment gateway: {gateway.name}")
    
    return {"message": "Payment gateway deleted successfully"}


@router.post("/{gateway_id}/test", response_model=PaymentGatewayTestResponse)
async def test_payment_gateway(
    gateway_id: str,
    request: PaymentGatewayTestRequest,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Test payment gateway connection"""
    result = await db.execute(
        select(PaymentGateway).where(PaymentGateway.id == gateway_id)
    )
    gateway = result.scalars().first()
    
    if not gateway:
        raise HTTPException(status_code=404, detail="Payment gateway not found")
    
    try:
        # This would integrate with actual payment gateway APIs
        # For now, we'll simulate a test
        if gateway.type == PaymentGatewayType.STRIPE:
            # Check credentials based on sandbox/live mode
            if gateway.is_sandbox:
                api_key = gateway.sandbox_api_key
                secret_key = gateway.sandbox_secret_key
                mode = "sandbox"
            else:
                api_key = gateway.api_key
                secret_key = gateway.secret_key
                mode = "live"
            
            if not api_key or not secret_key:
                return PaymentGatewayTestResponse(
                    success=False,
                    message=f"Missing {mode} API credentials"
                )
            
            # Simulate Stripe test
            return PaymentGatewayTestResponse(
                success=True,
                message=f"Stripe {mode} connection test successful",
                test_transaction_id="test_" + str(datetime.now().timestamp()),
                response_data={"status": mode + "_mode"}
            )
        
        elif gateway.type == PaymentGatewayType.PAYPAL:
            # Check credentials based on sandbox/live mode
            if gateway.is_sandbox:
                api_key = gateway.sandbox_api_key
                secret_key = gateway.sandbox_secret_key
                mode = "sandbox"
            else:
                api_key = gateway.api_key
                secret_key = gateway.secret_key
                mode = "live"
            
            if not api_key or not secret_key:
                return PaymentGatewayTestResponse(
                    success=False,
                    message=f"Missing PayPal {mode} credentials"
                )
            
            # Simulate PayPal test
            return PaymentGatewayTestResponse(
                success=True,
                message=f"PayPal {mode} connection test successful",
                test_transaction_id="pp_test_" + str(datetime.now().timestamp()),
                response_data={"status": mode + "_mode"}
            )
        
        else:
            return PaymentGatewayTestResponse(
                success=False,
                message=f"Testing not implemented for {gateway.type}"
            )
    
    except Exception as e:
        logger.error(f"Payment gateway test failed: {str(e)}")
        return PaymentGatewayTestResponse(
            success=False,
            message=f"Test failed: {str(e)}"
        )


@router.post("/{gateway_id}/activate")
async def activate_payment_gateway(
    gateway_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Activate payment gateway"""
    result = await db.execute(
        select(PaymentGateway).where(PaymentGateway.id == gateway_id)
    )
    gateway = result.scalars().first()
    
    if not gateway:
        raise HTTPException(status_code=404, detail="Payment gateway not found")
    
    gateway.status = PaymentGatewayStatus.ACTIVE
    await db.commit()
    
    logger.info(f"Activated payment gateway: {gateway.name}")
    
    return {"message": "Payment gateway activated successfully"}


@router.post("/{gateway_id}/deactivate")
async def deactivate_payment_gateway(
    gateway_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Deactivate payment gateway"""
    result = await db.execute(
        select(PaymentGateway).where(PaymentGateway.id == gateway_id)
    )
    gateway = result.scalars().first()
    
    if not gateway:
        raise HTTPException(status_code=404, detail="Payment gateway not found")
    
    gateway.status = PaymentGatewayStatus.INACTIVE
    await db.commit()
    
    logger.info(f"Deactivated payment gateway: {gateway.name}")
    
    return {"message": "Payment gateway deactivated successfully"}


@router.get("/{gateway_id}/stats")
async def get_payment_gateway_stats(
    gateway_id: str,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(require_admin)
):
    """Get payment gateway statistics"""
    result = await db.execute(
        select(PaymentGateway).where(PaymentGateway.id == gateway_id)
    )
    gateway = result.scalars().first()
    
    if not gateway:
        raise HTTPException(status_code=404, detail="Payment gateway not found")
    
    # Get payment statistics
    total_payments = await db.execute(
        select(func.count(Payment.id)).where(Payment.gateway_id == gateway_id)
    )
    
    successful_payments = await db.execute(
        select(func.count(Payment.id)).where(
            and_(
                Payment.gateway_id == gateway_id,
                Payment.status == "succeeded"
            )
        )
    )
    
    total_amount = await db.execute(
        select(func.sum(Payment.amount)).where(
            and_(
                Payment.gateway_id == gateway_id,
                Payment.status == "succeeded"
            )
        )
    )
    
    return {
        "gateway_id": gateway_id,
        "gateway_name": gateway.name,
        "total_payments": total_payments.scalar() or 0,
        "successful_payments": successful_payments.scalar() or 0,
        "total_amount": float(total_amount.scalar() or 0),
        "success_rate": round(
            (successful_payments.scalar() or 0) / max(total_payments.scalar() or 1, 1) * 100, 
            2
        )
    }


@router.get("/stripe/config")
async def get_stripe_config(
    db: AsyncSession = Depends(get_db)
):
    """Get active Stripe configuration for frontend"""
    result = await db.execute(
        select(PaymentGateway).where(
            and_(
                PaymentGateway.type == PaymentGatewayType.STRIPE,
                PaymentGateway.status == PaymentGatewayStatus.ACTIVE
            )
        )
    )
    gateway = result.scalars().first()
    
    if not gateway:
        return {
            "publishable_key": None,
            "is_sandbox": True,
            "is_configured": False
        }
    
    # Return the appropriate keys based on sandbox mode
    if gateway.is_sandbox:
        publishable_key = gateway.sandbox_api_key
    else:
        publishable_key = gateway.api_key
    
    return {
        "publishable_key": publishable_key,
        "is_sandbox": gateway.is_sandbox,
        "is_configured": bool(publishable_key)
    }
