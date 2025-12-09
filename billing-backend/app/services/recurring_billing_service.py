"""
Recurring Billing Automation Service
Handles automatic subscription renewals, invoice generation, and payment processing
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.models import Subscription, Invoice, InvoiceStatus, Payment, Order, SubscriptionStatus, User
from app.services.invoice_service import InvoiceService
from app.services.email_service import EmailService
from app.services.payment_service import PaymentService

logger = logging.getLogger(__name__)


class RecurringBillingService:
    """Service for automated recurring billing"""
    
    def __init__(self):
        self.invoice_service = InvoiceService()
        self.email_service = EmailService()
        self.payment_service = PaymentService()
    
    async def process_renewals(self, db: AsyncSession):
        """Process all subscriptions due for renewal"""
        logger.info("Starting recurring billing processing...")
        
        # Find subscriptions due for renewal (within next 24 hours)
        # Use current_period_end to determine renewal
        now = datetime.utcnow()
        tomorrow = now + timedelta(days=1)
        
        result = await db.execute(
            select(Subscription)
            .where(
                and_(
                    Subscription.status == SubscriptionStatus.ACTIVE,
                    Subscription.current_period_end <= tomorrow,
                    Subscription.current_period_end >= now
                )
            )
        )
        subscriptions = result.scalars().all()
        
        logger.info(f"Found {len(subscriptions)} subscriptions due for renewal")
        
        for subscription in subscriptions:
            try:
                await self._process_subscription_renewal(subscription, db)
            except Exception as e:
                logger.error(f"Error processing renewal for subscription {subscription.id}: {str(e)}", exc_info=True)
        
        logger.info("Recurring billing processing completed")
    
    async def _process_subscription_renewal(self, subscription: Subscription, db: AsyncSession):
        """Process renewal for a single subscription"""
        logger.info(f"Processing renewal for subscription {subscription.id}")
        
        # Generate invoice
        invoice = await self._generate_renewal_invoice(subscription, db)
        
        # Try to charge payment
        payment_success = await self._charge_subscription(subscription, invoice, db)
        
        if payment_success:
            # Update subscription - extend current_period_end
            if subscription.current_period_end:
                from app.models import RecurringInterval
                # Calculate period based on current_period_start and current_period_end
                period_days = (subscription.current_period_end - subscription.current_period_start).days if subscription.current_period_start else 30
                subscription.current_period_start = subscription.current_period_end
                subscription.current_period_end = subscription.current_period_end + timedelta(days=period_days)
            else:
                # Fallback: use default 30 days
                subscription.current_period_start = datetime.utcnow()
                subscription.current_period_end = datetime.utcnow() + timedelta(days=30)
            
            subscription.status = SubscriptionStatus.ACTIVE
            invoice.status = InvoiceStatus.PAID
            invoice.paid_at = datetime.utcnow()
            
            # Send confirmation email
            await self._send_renewal_confirmation(subscription, invoice, db)
        else:
            # Payment failed
            subscription.status = SubscriptionStatus.PAST_DUE
            invoice.status = InvoiceStatus.OVERDUE
            
            # Send failure notification
            await self._send_payment_failed_notification(subscription, invoice, db)
        
        await db.commit()
        logger.info(f"Renewal processed for subscription {subscription.id}")
    
    async def _generate_renewal_invoice(self, subscription: Subscription, db: AsyncSession) -> Invoice:
        """Generate renewal invoice"""
        from app.models import InvoiceStatus, RecurringInterval
        
        invoice_number = await self.invoice_service.generate_invoice_number(db)
        
        # Get subscription plan price
        plan_price = subscription.amount or 0.0
        
        invoice = Invoice(
            user_id=subscription.user_id,
            subscription_id=subscription.id,
            invoice_number=invoice_number,
            status=InvoiceStatus.OPEN,
            subtotal=plan_price,
            tax=0.0,
            tax_rate=0.0,
            total=plan_price,
            amount_due=plan_price,
            currency=subscription.currency or "USD",
            due_date=datetime.utcnow() + timedelta(days=7),
            items=[{
                "description": f"Subscription renewal - {subscription.plan_name or 'Plan'}",
                "quantity": 1,
                "unit_price": plan_price,
                "amount": plan_price
            }],
            is_recurring=True,
            recurring_interval=RecurringInterval(subscription.billing_interval.value) if subscription.billing_interval else None
        )
        
        db.add(invoice)
        await db.commit()
        await db.refresh(invoice)
        
        # Send invoice email
        user_result = await db.execute(select(User).where(User.id == subscription.user_id))
        user = user_result.scalars().first()
        if user:
            await self.invoice_service.send_invoice_email(invoice, user, db)
        
        return invoice
    
    async def _charge_subscription(self, subscription: Subscription, invoice: Invoice, db: AsyncSession) -> bool:
        """Attempt to charge subscription payment"""
        try:
            # Get payment method from subscription or user
            # For now, try to create payment intent
            payment_intent = await self.payment_service.create_payment_intent(
                amount=invoice.total,
                currency=invoice.currency,
                metadata={
                    "subscription_id": subscription.id,
                    "invoice_id": invoice.id
                }
            )
            
            # In a real implementation, you would:
            # 1. Get saved payment method
            # 2. Charge it
            # 3. Handle 3D Secure if needed
            
            # For now, return True if payment intent created
            return payment_intent is not None
        except Exception as e:
            logger.error(f"Payment failed for subscription {subscription.id}: {str(e)}")
            return False
    
    async def _send_renewal_confirmation(self, subscription: Subscription, invoice: Invoice, db: AsyncSession):
        """Send renewal confirmation email"""
        try:
            user_result = await db.execute(select(User).where(User.id == subscription.user_id))
            user = user_result.scalars().first()
            
            if user:
                await self.email_service.send_payment_receipt_email(
                    user_email=user.email,
                    user_name=user.full_name or user.email,
                    amount=invoice.total,
                    currency=invoice.currency,
                    invoice_number=invoice.invoice_number,
                    payment_date=datetime.utcnow()
                )
        except Exception as e:
            logger.error(f"Failed to send renewal confirmation: {str(e)}")
    
    async def _send_payment_failed_notification(self, subscription: Subscription, invoice: Invoice, db: AsyncSession):
        """Send payment failed notification"""
        try:
            user_result = await db.execute(select(User).where(User.id == subscription.user_id))
            user = user_result.scalars().first()
            
            if user:
                await self.email_service.send_payment_failed_email(
                    user_email=user.email,
                    user_name=user.full_name or user.email,
                    invoice_number=invoice.invoice_number,
                    amount=invoice.total,
                    currency=invoice.currency
                )
        except Exception as e:
            logger.error(f"Failed to send payment failed notification: {str(e)}")
    
    async def process_payment_retries(self, db: AsyncSession):
        """Retry failed payments"""
        logger.info("Processing payment retries...")
        
        # Find invoices with failed payments that need retry
        now = datetime.utcnow()
        retry_date = now - timedelta(days=3)  # Retry after 3 days
        
        result = await db.execute(
            select(Invoice)
            .where(
                and_(
                    Invoice.status == InvoiceStatus.OVERDUE,
                    Invoice.due_date <= retry_date,
                    Invoice.last_reminder_sent.isnot(None)
                )
            )
        )
        invoices = result.scalars().all()
        
        logger.info(f"Found {len(invoices)} invoices for retry")
        
        for invoice in invoices:
            try:
                # Get subscription if exists
                if invoice.subscription_id:
                    sub_result = await db.execute(
                        select(Subscription).where(Subscription.id == invoice.subscription_id)
                    )
                    subscription = sub_result.scalars().first()
                    
                    if subscription:
                        payment_success = await self._charge_subscription(subscription, invoice, db)
                        if payment_success:
                            invoice.status = InvoiceStatus.PAID
                            invoice.paid_at = datetime.utcnow()
                            subscription.status = SubscriptionStatus.ACTIVE
                            await db.commit()
            except Exception as e:
                logger.error(f"Error retrying payment for invoice {invoice.id}: {str(e)}")
        
        logger.info("Payment retry processing completed")

