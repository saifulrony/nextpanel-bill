"""
Automated Billing Scheduler
Handles recurring invoice generation, overdue checking, and payment reminders
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, and_
from app.models import Invoice, User, InvoiceStatus, RecurringInterval
from app.services.invoice_service import InvoiceService
from app.core.config import settings
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class BillingScheduler:
    """Automated billing scheduler"""
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.invoice_service = InvoiceService()
    
    async def check_and_mark_overdue(self):
        """Check for overdue invoices and update their status"""
        logger.info("Checking for overdue invoices...")
        
        count = await self.invoice_service.check_overdue_invoices(self.db)
        
        logger.info(f"Marked {count} invoices as overdue")
        return count
    
    async def generate_recurring_invoices(self):
        """Generate new invoices from recurring invoices that are due"""
        logger.info("Checking for recurring invoices to generate...")
        
        now = datetime.utcnow()
        generated_count = 0
        
        # Find recurring invoices that need to be generated
        result = await self.db.execute(
            select(Invoice).where(
                and_(
                    Invoice.is_recurring == True,
                    Invoice.status == InvoiceStatus.PAID,  # Only generate from paid invoices
                    Invoice.recurring_next_date <= now
                )
            )
        )
        recurring_invoices = result.scalars().all()
        
        for parent_invoice in recurring_invoices:
            try:
                # Generate new invoice
                new_invoice = await self.invoice_service.generate_recurring_invoice(
                    parent_invoice=parent_invoice,
                    db=self.db
                )
                
                # Update parent's next generation date
                if parent_invoice.recurring_interval == RecurringInterval.MONTHLY:
                    parent_invoice.recurring_next_date = now + timedelta(days=30)
                elif parent_invoice.recurring_interval == RecurringInterval.QUARTERLY:
                    parent_invoice.recurring_next_date = now + timedelta(days=90)
                elif parent_invoice.recurring_interval == RecurringInterval.YEARLY:
                    parent_invoice.recurring_next_date = now + timedelta(days=365)
                
                await self.db.commit()
                
                # Get user and send invoice
                result = await self.db.execute(
                    select(User).where(User.id == new_invoice.user_id)
                )
                user = result.scalars().first()
                
                if user:
                    await self.invoice_service.send_invoice_email(new_invoice, user, self.db)
                
                generated_count += 1
                logger.info(f"Generated recurring invoice: {new_invoice.invoice_number}")
                
            except Exception as e:
                logger.error(f"Failed to generate recurring invoice from {parent_invoice.invoice_number}: {str(e)}")
                continue
        
        logger.info(f"Generated {generated_count} recurring invoices")
        return generated_count
    
    async def send_payment_reminders(self, days_before: int = 3):
        """Send payment reminders for invoices due soon"""
        logger.info(f"Sending payment reminders for invoices due in {days_before} days...")
        
        now = datetime.utcnow()
        target_date = now + timedelta(days=days_before)
        sent_count = 0
        
        # Find invoices due soon that haven't had a reminder recently
        result = await self.db.execute(
            select(Invoice).where(
                and_(
                    Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.PARTIALLY_PAID]),
                    Invoice.due_date <= target_date,
                    Invoice.due_date > now,
                    # Only send if no reminder in last 24 hours
                    (Invoice.last_reminder_sent.is_(None) | (Invoice.last_reminder_sent < now - timedelta(hours=24)))
                )
            )
        )
        invoices = result.scalars().all()
        
        for invoice in invoices:
            try:
                # Get user
                result = await self.db.execute(
                    select(User).where(User.id == invoice.user_id)
                )
                user = result.scalars().first()
                
                if user:
                    await self.invoice_service.send_payment_reminder(invoice, user, self.db)
                    sent_count += 1
                
            except Exception as e:
                logger.error(f"Failed to send reminder for invoice {invoice.invoice_number}: {str(e)}")
                continue
        
        logger.info(f"Sent {sent_count} payment reminders")
        return sent_count
    
    async def send_overdue_reminders(self):
        """Send reminders for overdue invoices"""
        logger.info("Sending reminders for overdue invoices...")
        
        now = datetime.utcnow()
        sent_count = 0
        
        # Find overdue invoices that need reminders
        result = await self.db.execute(
            select(Invoice).where(
                and_(
                    Invoice.status.in_([InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID]),
                    Invoice.due_date < now,
                    # Send reminder every 7 days for overdue invoices
                    (Invoice.last_reminder_sent.is_(None) | (Invoice.last_reminder_sent < now - timedelta(days=7)))
                )
            )
        )
        invoices = result.scalars().all()
        
        for invoice in invoices:
            try:
                # Get user
                result = await self.db.execute(
                    select(User).where(User.id == invoice.user_id)
                )
                user = result.scalars().first()
                
                if user:
                    await self.invoice_service.send_payment_reminder(invoice, user, self.db)
                    sent_count += 1
                
            except Exception as e:
                logger.error(f"Failed to send overdue reminder for invoice {invoice.invoice_number}: {str(e)}")
                continue
        
        logger.info(f"Sent {sent_count} overdue reminders")
        return sent_count
    
    async def run_all_tasks(self):
        """Run all automated billing tasks"""
        logger.info("="*60)
        logger.info("Starting automated billing tasks")
        logger.info("="*60)
        
        try:
            # Check and mark overdue invoices
            await self.check_and_mark_overdue()
            
            # Generate recurring invoices
            await self.generate_recurring_invoices()
            
            # Send payment reminders (3 days before due)
            await self.send_payment_reminders(days_before=3)
            
            # Send overdue reminders
            await self.send_overdue_reminders()
            
            logger.info("="*60)
            logger.info("All automated billing tasks completed successfully")
            logger.info("="*60)
            
        except Exception as e:
            logger.error(f"Error running automated billing tasks: {str(e)}")
            raise


async def main():
    """Main entry point"""
    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://') if settings.DATABASE_URL.startswith('postgresql://') else settings.DATABASE_URL,
        echo=False
    )
    
    # Create async session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        scheduler = BillingScheduler(session)
        await scheduler.run_all_tasks()


if __name__ == "__main__":
    """
    Run this script via cron job or scheduler:
    
    # Run daily at 2 AM
    0 2 * * * cd /path/to/billing-backend && python scripts/billing_scheduler.py
    
    # Or run every hour
    0 * * * * cd /path/to/billing-backend && python scripts/billing_scheduler.py
    """
    asyncio.run(main())

