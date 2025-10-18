"""
Payment and Billing API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import Payment, User, License, Plan, PaymentStatus
from app.schemas import (
    PaymentIntentRequest,
    PaymentIntentResponse,
    PaymentResponse,
    PaymentConfirmRequest,
    PaymentRefundRequest,
    PaymentWebhookEvent
)
from app.services.payment_service import PaymentService
from app.api.v1.events import broadcast_event
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("/intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    request: PaymentIntentRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a payment intent for a plan purchase"""
    # Get plan details
    result = await db.execute(select(Plan).where(Plan.id == request.plan_id))
    plan = result.scalars().first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Calculate amount based on billing cycle
    if request.billing_cycle == "yearly":
        amount = plan.price_yearly
    else:
        amount = plan.price_monthly
    
    # Create payment intent with Stripe
    payment_service = PaymentService(db=db)
    intent = await payment_service.create_payment_intent(
        amount=amount,
        currency=request.currency or "USD",
        metadata={
            "user_id": user_id,
            "plan_id": request.plan_id,
            "billing_cycle": request.billing_cycle
        }
    )
    
    # Create payment record
    payment = Payment(
        user_id=user_id,
        stripe_payment_intent_id=intent.get("id"),
        amount=amount,
        currency=request.currency or "USD",
        status=PaymentStatus.PENDING,
        payment_method=request.payment_method,
        description=f"{plan.name} - {request.billing_cycle}",
        payment_metadata={
            "plan_id": request.plan_id,
            "billing_cycle": request.billing_cycle
        }
    )
    
    db.add(payment)
    await db.commit()
    
    # Broadcast real-time event
    await broadcast_event(user_id, "order_created", {
        "payment_id": payment.id,
        "amount": amount,
        "plan_name": plan.name,
        "billing_cycle": request.billing_cycle
    })
    
    return PaymentIntentResponse(
        client_secret=intent.get("client_secret"),
        payment_id=payment.id,
        amount=amount,
        currency=request.currency or "USD"
    )


@router.post("/intent/general", response_model=PaymentIntentResponse)
async def create_general_payment_intent(
    request: dict,
    user_id: str = "test_user",  # Temporary: bypass authentication for testing
    db: AsyncSession = Depends(get_db)
):
    """Create a payment intent for general payments (orders, etc.)"""
    amount = request.get("amount")
    currency = request.get("currency", "USD")
    metadata = request.get("metadata", {})
    
    if not amount:
        raise HTTPException(status_code=400, detail="Amount is required")
    
    # Create payment intent with Stripe
    payment_service = PaymentService(db=db)
    intent = await payment_service.create_payment_intent(
        amount=amount,
        currency=currency,
        metadata=metadata
    )
    
    return PaymentIntentResponse(
        client_secret=intent.get("client_secret"),
        payment_id=None,  # No payment record created yet
        amount=amount,
        currency=currency
    )


@router.post("/{payment_id}/confirm", response_model=PaymentResponse)
async def confirm_payment(
    payment_id: str,
    request: PaymentConfirmRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Confirm a payment"""
    # Get payment
    result = await db.execute(
        select(Payment).where(
            and_(
                Payment.id == payment_id,
                Payment.user_id == user_id
            )
        )
    )
    payment = result.scalars().first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Confirm payment with Stripe
    payment_service = PaymentService(db=db)
    confirmation = await payment_service.confirm_payment(
        payment_intent_id=payment.stripe_payment_intent_id
    )
    
    # Update payment status
    if confirmation.get("status") == "succeeded":
        payment.status = PaymentStatus.SUCCEEDED
        
        # Broadcast real-time event for payment received
        await broadcast_event(user_id, "payment_received", {
            "payment_id": payment.id,
            "amount": float(payment.amount),
            "currency": payment.currency
        })
        
        # TODO: Trigger license creation/activation here
        
    elif confirmation.get("status") == "failed":
        payment.status = PaymentStatus.FAILED
    
    await db.commit()
    await db.refresh(payment)
    
    return payment


@router.get("/", response_model=List[PaymentResponse])
async def list_payments(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0
):
    """List user's payment history"""
    result = await db.execute(
        select(Payment)
        .where(Payment.user_id == user_id)
        .order_by(Payment.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    payments = result.scalars().all()
    return payments


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get payment details"""
    result = await db.execute(
        select(Payment).where(
            and_(
                Payment.id == payment_id,
                Payment.user_id == user_id
            )
        )
    )
    payment = result.scalars().first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return payment


@router.post("/{payment_id}/refund", response_model=PaymentResponse)
async def refund_payment(
    payment_id: str,
    request: PaymentRefundRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Request a refund for a payment"""
    # Get payment
    result = await db.execute(
        select(Payment).where(
            and_(
                Payment.id == payment_id,
                Payment.user_id == user_id
            )
        )
    )
    payment = result.scalars().first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.status != PaymentStatus.SUCCEEDED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only refund succeeded payments"
        )
    
    # Process refund with Stripe
    payment_service = PaymentService(db=db)
    refund = await payment_service.refund_payment(
        payment_intent_id=payment.stripe_payment_intent_id,
        amount=request.amount if request.amount else payment.amount,
        reason=request.reason
    )
    
    # Update payment status
    payment.status = PaymentStatus.REFUNDED
    
    await db.commit()
    await db.refresh(payment)
    
    return payment


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    event: PaymentWebhookEvent,
    stripe_signature: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    """Handle Stripe webhook events"""
    logger.info(f"Received Stripe webhook: {event.type}")
    
    payment_service = PaymentService(db=db)
    
    # Verify webhook signature
    if stripe_signature:
        is_valid = await payment_service.verify_webhook_signature(
            payload=event.dict(),
            signature=stripe_signature
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature"
            )
    
    # Handle different event types
    if event.type == "payment_intent.succeeded":
        payment_intent_id = event.data.get("id")
        
        # Update payment status
        result = await db.execute(
            select(Payment).where(
                Payment.stripe_payment_intent_id == payment_intent_id
            )
        )
        payment = result.scalars().first()
        
        if payment:
            payment.status = PaymentStatus.SUCCEEDED
            await db.commit()
            
            # Broadcast real-time event
            await broadcast_event(payment.user_id, "payment_received", {
                "payment_id": payment.id,
                "amount": float(payment.amount),
                "currency": payment.currency
            })
            
            logger.info(f"Payment succeeded: {payment.id}")
    
    elif event.type == "payment_intent.payment_failed":
        payment_intent_id = event.data.get("id")
        
        # Update payment status
        result = await db.execute(
            select(Payment).where(
                Payment.stripe_payment_intent_id == payment_intent_id
            )
        )
        payment = result.scalars().first()
        
        if payment:
            payment.status = PaymentStatus.FAILED
            await db.commit()
            
            logger.info(f"Payment failed: {payment.id}")
    
    return {"status": "success"}


@router.get("/stats/summary")
async def get_payment_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get user's payment statistics"""
    from sqlalchemy import func
    
    # Total spent
    result = await db.execute(
        select(func.sum(Payment.amount))
        .where(
            and_(
                Payment.user_id == user_id,
                Payment.status == PaymentStatus.SUCCEEDED
            )
        )
    )
    total_spent = result.scalar() or 0.0
    
    # Payment count
    result = await db.execute(
        select(func.count(Payment.id))
        .where(Payment.user_id == user_id)
    )
    total_payments = result.scalar() or 0
    
    # Successful payments
    result = await db.execute(
        select(func.count(Payment.id))
        .where(
            and_(
                Payment.user_id == user_id,
                Payment.status == PaymentStatus.SUCCEEDED
            )
        )
    )
    successful_payments = result.scalar() or 0
    
    return {
        "total_spent": total_spent,
        "total_payments": total_payments,
        "successful_payments": successful_payments,
        "failed_payments": total_payments - successful_payments
    }

