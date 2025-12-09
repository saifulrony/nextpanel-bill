"""
Dunning Management Service
Handles payment reminders, retry logic, and grace period management
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.models import Invoice, InvoiceStatus, Subscription, SubscriptionStatus, User
from app.services.email_service import EmailService
from app.services.invoice_service import InvoiceService

logger = logging.getLogger(__name__)


class DunningService:
    """Service for dunning management"""
    
    def __init__(self):
        self.email_service = EmailService()
        self.invoice_service = InvoiceService()
    
    async def process_dunning(self, db: AsyncSession):
        """Process all dunning workflows"""
        logger.info("Starting dunning processing...")
        
        # Process overdue invoices
        await self._process_overdue_invoices(db)
        
        # Send payment reminders
        await self._send_payment_reminders(db)
        
        # Process grace periods
        await self._process_grace_periods(db)
        
        logger.info("Dunning processing completed")
    
    async def _process_overdue_invoices(self, db: AsyncSession):
        """Mark invoices as overdue"""
        now = datetime.utcnow()
        
        result = await db.execute(
            select(Invoice)
            .where(
                and_(
                    Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.PARTIALLY_PAID]),
                    Invoice.due_date < now
                )
            )
        )
        invoices = result.scalars().all()
        
        for invoice in invoices:
            if invoice.status != InvoiceStatus.OVERDUE:
                invoice.status = InvoiceStatus.OVERDUE
                logger.info(f"Marked invoice {invoice.invoice_number} as overdue")
        
        await db.commit()
    
    async def _send_payment_reminders(self, db: AsyncSession):
        """Send payment reminder emails"""
        now = datetime.utcnow()
        
        # Reminders: 7 days before, 3 days before, 1 day before, on due date, 3 days after, 7 days after
        reminder_intervals = [
            (7, "7 days before due date"),
            (3, "3 days before due date"),
            (1, "1 day before due date"),
            (0, "on due date"),
            (-3, "3 days overdue"),
            (-7, "7 days overdue"),
            (-14, "14 days overdue")
        ]
        
        for days_offset, description in reminder_intervals:
            target_date = now + timedelta(days=days_offset)
            target_date_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
            target_date_end = target_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            # Find invoices that need this reminder
            result = await db.execute(
                select(Invoice)
                .where(
                    and_(
                        Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.OVERDUE]),
                        Invoice.due_date >= target_date_start,
                        Invoice.due_date <= target_date_end,
                        # Only send if not already sent for this interval
                        or_(
                            Invoice.last_reminder_sent.is_(None),
                            Invoice.last_reminder_sent < target_date_start
                        )
                    )
                )
            )
            invoices = result.scalars().all()
            
            for invoice in invoices:
                try:
                    user_result = await db.execute(select(User).where(User.id == invoice.user_id))
                    user = user_result.scalars().first()
                    
                    if user:
                        await self._send_reminder_email(invoice, user, description, db)
                        invoice.last_reminder_sent = now
                        await db.commit()
                except Exception as e:
                    logger.error(f"Error sending reminder for invoice {invoice.id}: {str(e)}")
    
    async def _send_reminder_email(self, invoice: Invoice, user: User, reminder_type: str, db: AsyncSession):
        """Send payment reminder email"""
        subject = f"Payment Reminder - Invoice {invoice.invoice_number}"
        
        days_overdue = (datetime.utcnow() - invoice.due_date).days if invoice.due_date else 0
        
        if days_overdue > 0:
            body = f"""
            Hello {user.full_name or user.email},
            
            This is a reminder that your invoice {invoice.invoice_number} for ${invoice.amount_due:.2f} {invoice.currency} is {days_overdue} day(s) overdue.
            
            Please make payment as soon as possible to avoid service interruption.
            
            Invoice Details:
            - Invoice Number: {invoice.invoice_number}
            - Amount Due: ${invoice.amount_due:.2f} {invoice.currency}
            - Due Date: {invoice.due_date.strftime('%Y-%m-%d') if invoice.due_date else 'N/A'}
            
            Thank you,
            NextPanel Billing Team
            """
        else:
            days_until = (invoice.due_date - datetime.utcnow()).days if invoice.due_date else 0
            body = f"""
            Hello {user.full_name or user.email},
            
            This is a friendly reminder that your invoice {invoice.invoice_number} for ${invoice.amount_due:.2f} {invoice.currency} is due in {days_until} day(s).
            
            Please ensure payment is made by the due date to avoid any interruption to your service.
            
            Invoice Details:
            - Invoice Number: {invoice.invoice_number}
            - Amount Due: ${invoice.amount_due:.2f} {invoice.currency}
            - Due Date: {invoice.due_date.strftime('%Y-%m-%d') if invoice.due_date else 'N/A'}
            
            Thank you,
            NextPanel Billing Team
            """
        
        html_body = f"""
        <html>
            <body>
                <h2>Payment Reminder</h2>
                <p>Hello {user.full_name or user.email},</p>
                <p>This is a reminder regarding your invoice <strong>{invoice.invoice_number}</strong>.</p>
                <p><strong>Amount Due:</strong> ${invoice.amount_due:.2f} {invoice.currency}</p>
                <p><strong>Due Date:</strong> {invoice.due_date.strftime('%Y-%m-%d') if invoice.due_date else 'N/A'}</p>
                <p>Please make payment as soon as possible.</p>
                <p>Thank you,<br>NextPanel Billing Team</p>
            </body>
        </html>
        """
        
        await self.email_service.send_email(
            to_email=user.email,
            subject=subject,
            body=body,
            html_body=html_body
        )
        
        logger.info(f"Sent {reminder_type} reminder for invoice {invoice.invoice_number}")
    
    async def _process_grace_periods(self, db: AsyncSession):
        """Process grace periods and suspend services"""
        now = datetime.utcnow()
        grace_period_end = now - timedelta(days=14)  # 14 days grace period
        
        # Find subscriptions with overdue invoices beyond grace period
        result = await db.execute(
            select(Subscription)
            .where(
                and_(
                    Subscription.status == SubscriptionStatus.ACTIVE,
                    Subscription.id.in_(
                        select(Invoice.subscription_id)
                        .where(
                            and_(
                                Invoice.status == InvoiceStatus.OVERDUE,
                                Invoice.due_date < grace_period_end
                            )
                        )
                    )
                )
            )
        )
        subscriptions = result.scalars().all()
        
        for subscription in subscriptions:
            try:
                # Suspend subscription
                subscription.status = SubscriptionStatus.PAST_DUE
                
                # Send suspension notice
                user_result = await db.execute(select(User).where(User.id == subscription.user_id))
                user = user_result.scalars().first()
                
                if user:
                    await self._send_suspension_notice(subscription, user)
                
                await db.commit()
                logger.info(f"Suspended subscription {subscription.id} due to overdue payment")
            except Exception as e:
                logger.error(f"Error processing grace period for subscription {subscription.id}: {str(e)}")
    
    async def _send_suspension_notice(self, subscription: Subscription, user: User):
        """Send service suspension notice"""
        subject = "Service Suspended - Payment Required"
        
        body = f"""
        Hello {user.full_name or user.email},
        
        Your subscription has been suspended due to overdue payment.
        
        To restore service, please make payment for your outstanding invoices.
        
        Thank you,
        NextPanel Billing Team
        """
        
        html_body = f"""
        <html>
            <body>
                <h2>Service Suspended</h2>
                <p>Hello {user.full_name or user.email},</p>
                <p>Your subscription has been suspended due to overdue payment.</p>
                <p>To restore service, please make payment for your outstanding invoices.</p>
                <p>Thank you,<br>NextPanel Billing Team</p>
            </body>
        </html>
        """
        
        await self.email_service.send_email(
            to_email=user.email,
            subject=subject,
            body=body,
            html_body=html_body
        )

