"""
Payment Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import stripe
import logging

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.config import settings
from app.models import Order, OrderStatus, User, Payment, PaymentStatus, PaymentGatewayType
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments")

# Initialize Stripe
if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY


# Schemas
class PaymentIntentRequest(BaseModel):
    order_id: str
    amount: float
    currency: str = "USD"
    payment_method: Optional[str] = None
    customer_email: Optional[str] = None
    description: Optional[str] = None


class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount: int
    currency: str
    status: str


class ManualChargeRequest(BaseModel):
    order_id: str
    amount: float
    currency: str = "USD"
    payment_method: str
    description: Optional[str] = None
    save_payment_method: bool = False


class AutoChargeConfig(BaseModel):
    order_id: str
    enabled: bool
    payment_method_id: Optional[str] = None
    retry_attempts: int = 3
    retry_interval_days: int = 3
    next_charge_date: Optional[datetime] = None


class PaymentHistoryResponse(BaseModel):
    id: str
    order_id: str
    amount: float
    currency: str
    status: str
    payment_method: str
    gateway_transaction_id: Optional[str]
    created_at: datetime
    failure_reason: Optional[str] = None


@router.post("/intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    request: PaymentIntentRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a Stripe payment intent for manual charging"""
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get order
    result = await db.execute(select(Order).where(Order.id == request.order_id))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status == OrderStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Order is already paid")
    
    try:
        # Create Stripe payment intent
        intent = stripe.PaymentIntent.create(
            amount=int(request.amount * 100),  # Convert to cents
            currency=request.currency.lower(),
            metadata={
                "order_id": request.order_id,
                "invoice_number": order.invoice_number or order.order_number,
                "admin_user_id": user_id
            },
            description=request.description or f"Payment for Order {order.invoice_number or order.order_number}",
            customer_email=request.customer_email or order.customer.email if hasattr(order, 'customer') else None
        )
        
        return PaymentIntentResponse(
            client_secret=intent.client_secret,
            payment_intent_id=intent.id,
            amount=intent.amount,
            currency=intent.currency,
            status=intent.status
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating payment intent: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Payment processing error: {str(e)}")
    except Exception as e:
        logger.error(f"Error creating payment intent: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create payment intent")


@router.post("/manual-charge")
async def process_manual_charge(
    request: ManualChargeRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Process a manual charge for an order"""
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get order
    result = await db.execute(select(Order).where(Order.id == request.order_id))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.status == OrderStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Order is already paid")
    
    try:
        # Create Stripe payment intent
        intent = stripe.PaymentIntent.create(
            amount=int(request.amount * 100),
            currency=request.currency.lower(),
            payment_method=request.payment_method,
            confirm=True,
            metadata={
                "order_id": request.order_id,
                "invoice_number": order.invoice_number or order.order_number,
                "admin_user_id": user_id,
                "manual_charge": "true"
            },
            description=request.description or f"Manual charge for Order {order.invoice_number or order.order_number}"
        )
        
        # Create payment record
        payment = Payment(
            order_id=request.order_id,
            amount=request.amount,
            currency=request.currency,
            status=PaymentStatus.SUCCEEDED if intent.status == "succeeded" else PaymentStatus.PENDING,
            payment_method=request.payment_method,
            gateway_type=PaymentGatewayType.STRIPE,
            gateway_transaction_id=intent.id,
            gateway_response=intent.to_dict()
        )
        
        db.add(payment)
        
        # Update order status if payment succeeded
        if intent.status == "succeeded":
            order.status = OrderStatus.COMPLETED
            order.paid_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(payment)
        
        return {
            "success": True,
            "payment_id": payment.id,
            "status": intent.status,
            "message": "Payment processed successfully" if intent.status == "succeeded" else "Payment is processing"
        }
        
    except stripe.error.CardError as e:
        logger.error(f"Card error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Card error: {e.user_message}")
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Payment processing error: {str(e)}")
    except Exception as e:
        logger.error(f"Error processing manual charge: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process payment")


@router.post("/auto-charge/{order_id}")
async def configure_auto_charge(
    order_id: str,
    config: AutoChargeConfig,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Configure automatic charging for an order"""
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order with auto-charge configuration
    if not hasattr(order, 'auto_charge_config'):
        # Add auto_charge_config field to order if it doesn't exist
        order.auto_charge_config = {}
    
    order.auto_charge_config = {
        "enabled": config.enabled,
        "payment_method_id": config.payment_method_id,
        "retry_attempts": config.retry_attempts,
        "retry_interval_days": config.retry_interval_days,
        "next_charge_date": config.next_charge_date.isoformat() if config.next_charge_date else None,
        "configured_by": user_id,
        "configured_at": datetime.utcnow().isoformat()
    }
    
    await db.commit()
    await db.refresh(order)
    
    return {
        "success": True,
        "message": "Auto-charge configuration updated",
        "config": order.auto_charge_config
    }


@router.get("/history/{order_id}", response_model=List[PaymentHistoryResponse])
async def get_payment_history(
    order_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get payment history for an order"""
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get payment history
    result = await db.execute(
        select(Payment).where(Payment.order_id == order_id).order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()
    
    return [
        PaymentHistoryResponse(
            id=payment.id,
            order_id=payment.order_id,
            amount=payment.amount,
            currency=payment.currency,
            status=payment.status.value,
            payment_method=payment.payment_method,
            gateway_transaction_id=payment.gateway_transaction_id,
            created_at=payment.created_at,
            failure_reason=payment.gateway_response.get("failure_reason") if payment.gateway_response else None
        )
        for payment in payments
    ]


@router.post("/retry/{payment_id}")
async def retry_payment(
    payment_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Retry a failed payment"""
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get payment
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalars().first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.status != PaymentStatus.FAILED:
        raise HTTPException(status_code=400, detail="Can only retry failed payments")
    
    try:
        # Retry with Stripe
        if payment.gateway_type == PaymentGatewayType.STRIPE and payment.gateway_transaction_id:
            intent = stripe.PaymentIntent.retrieve(payment.gateway_transaction_id)
            intent = stripe.PaymentIntent.confirm(intent.id)
            
            # Update payment status
            payment.status = PaymentStatus.SUCCEEDED if intent.status == "succeeded" else PaymentStatus.PENDING
            payment.gateway_response = intent.to_dict()
            
            # Update order status if payment succeeded
            if intent.status == "succeeded":
                result = await db.execute(select(Order).where(Order.id == payment.order_id))
                order = result.scalars().first()
                if order:
                    order.status = OrderStatus.COMPLETED
                    order.paid_at = datetime.utcnow()
            
            await db.commit()
            
            return {
                "success": True,
                "status": intent.status,
                "message": "Payment retry successful" if intent.status == "succeeded" else "Payment is processing"
            }
        else:
            raise HTTPException(status_code=400, detail="Cannot retry this payment type")
            
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error retrying payment: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Payment retry failed: {str(e)}")
    except Exception as e:
        logger.error(f"Error retrying payment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retry payment")


@router.get("/auto-charge/queue")
async def get_auto_charge_queue(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get orders queued for automatic charging"""
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get orders with auto-charge enabled and due for charging
    now = datetime.utcnow()
    result = await db.execute(
        select(Order).where(
            Order.status == OrderStatus.PENDING,
            Order.auto_charge_config["enabled"].astext == "true",
            Order.auto_charge_config["next_charge_date"].astext <= now.isoformat()
        )
    )
    orders = result.scalars().all()
    
    return {
        "orders": [
            {
                "id": order.id,
                "invoice_number": order.invoice_number,
                "total": order.total,
                "next_charge_date": order.auto_charge_config.get("next_charge_date"),
                "retry_attempts": order.auto_charge_config.get("retry_attempts", 0)
            }
            for order in orders
        ],
        "count": len(orders)
    }


@router.post("/auto-charge/process")
async def process_auto_charge_queue(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Process all orders in the auto-charge queue"""
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get orders queued for auto-charging
    now = datetime.utcnow()
    result = await db.execute(
        select(Order).where(
            Order.status == OrderStatus.PENDING,
            Order.auto_charge_config["enabled"].astext == "true",
            Order.auto_charge_config["next_charge_date"].astext <= now.isoformat()
        )
    )
    orders = result.scalars().all()
    
    processed = 0
    successful = 0
    failed = 0
    
    for order in orders:
        try:
            config = order.auto_charge_config
            payment_method_id = config.get("payment_method_id")
            
            if not payment_method_id:
                logger.warning(f"No payment method configured for order {order.id}")
                continue
            
            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=int(order.total * 100),
                currency="usd",
                payment_method=payment_method_id,
                confirm=True,
                metadata={
                    "order_id": order.id,
                    "invoice_number": order.invoice_number or order.order_number,
                    "auto_charge": "true"
                }
            )
            
            # Create payment record
            payment = Payment(
                order_id=order.id,
                amount=order.total,
                currency="USD",
                status=PaymentStatus.SUCCEEDED if intent.status == "succeeded" else PaymentStatus.PENDING,
                payment_method=payment_method_id,
                gateway_type=PaymentGatewayType.STRIPE,
                gateway_transaction_id=intent.id,
                gateway_response=intent.to_dict()
            )
            
            db.add(payment)
            
            # Update order status if payment succeeded
            if intent.status == "succeeded":
                order.status = OrderStatus.COMPLETED
                order.paid_at = datetime.utcnow()
                successful += 1
            else:
                # Schedule retry
                retry_interval = config.get("retry_interval_days", 3)
                next_charge_date = now + timedelta(days=retry_interval)
                order.auto_charge_config["next_charge_date"] = next_charge_date.isoformat()
                order.auto_charge_config["retry_attempts"] = config.get("retry_attempts", 0) + 1
                failed += 1
            
            processed += 1
            
        except Exception as e:
            logger.error(f"Error processing auto-charge for order {order.id}: {str(e)}")
            failed += 1
    
    await db.commit()
    
    return {
        "success": True,
        "processed": processed,
        "successful": successful,
        "failed": failed,
        "message": f"Processed {processed} orders: {successful} successful, {failed} failed"
    }


@router.get("/stats/summary")
async def get_payment_stats_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get payment statistics summary"""
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get all payments
    result = await db.execute(select(Payment))
    payments = result.scalars().all()
    
    # Calculate stats
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    
    total_spent = sum(p.amount for p in payments if p.status == PaymentStatus.SUCCEEDED)
    monthly_spent = sum(p.amount for p in payments if p.status == PaymentStatus.SUCCEEDED and p.created_at >= thirty_days_ago)
    
    successful_payments = sum(1 for p in payments if p.status == PaymentStatus.SUCCEEDED)
    failed_payments = sum(1 for p in payments if p.status == PaymentStatus.FAILED)
    pending_payments = sum(1 for p in payments if p.status == PaymentStatus.PENDING)
    
    return {
        "total_spent": total_spent,
        "monthly_spent": monthly_spent,
        "successful_count": successful_payments,
        "failed_count": failed_payments,
        "pending_count": pending_payments,
        "total_count": len(payments)
    }


@router.get("", response_model=List[PaymentHistoryResponse])
async def list_payments(
    limit: int = 50,
    offset: int = 0,
    status: Optional[str] = None,
    gateway_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """List all payments with optional filtering"""
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Build query
    query = select(Payment)
    
    # Apply filters
    if status:
        query = query.where(Payment.status == PaymentStatus[status.upper()])
    if gateway_id:
        query = query.where(Payment.gateway_transaction_id == gateway_id)
    if min_amount:
        query = query.where(Payment.amount >= min_amount)
    if max_amount:
        query = query.where(Payment.amount <= max_amount)
    if date_from:
        try:
            date_from_obj = datetime.fromisoformat(date_from)
            query = query.where(Payment.created_at >= date_from_obj)
        except ValueError:
            pass
    if date_to:
        try:
            date_to_obj = datetime.fromisoformat(date_to)
            query = query.where(Payment.created_at <= date_to_obj)
        except ValueError:
            pass
    
    # Apply pagination
    query = query.offset(offset).limit(limit).order_by(Payment.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    payments = result.scalars().all()
    
    return [
        PaymentHistoryResponse(
            id=payment.id,
            order_id=payment.order_id,
            amount=payment.amount,
            currency=payment.currency,
            status=payment.status.value,
            payment_method=payment.payment_method,
            gateway_transaction_id=payment.gateway_transaction_id,
            created_at=payment.created_at,
            failure_reason=payment.gateway_response.get("failure_reason") if payment.gateway_response else None
        )
        for payment in payments
    ]


@router.get("/{payment_id}", response_model=PaymentHistoryResponse)
async def get_payment(
    payment_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific payment by ID"""
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get payment
    result = await db.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalars().first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return PaymentHistoryResponse(
        id=payment.id,
        order_id=payment.order_id,
        amount=payment.amount,
        currency=payment.currency,
        status=payment.status.value,
        payment_method=payment.payment_method,
        gateway_transaction_id=payment.gateway_transaction_id,
        created_at=payment.created_at,
        failure_reason=payment.gateway_response.get("failure_reason") if payment.gateway_response else None
    )