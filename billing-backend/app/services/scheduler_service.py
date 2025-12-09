"""
Background Task Scheduler Service
Runs recurring billing, dunning, and other automated tasks
"""
import asyncio
import logging
from datetime import datetime
from app.core.database import get_db
from app.services.recurring_billing_service import RecurringBillingService
from app.services.dunning_service import DunningService

logger = logging.getLogger(__name__)


class SchedulerService:
    """Background task scheduler"""
    
    def __init__(self):
        self.running = False
        self.recurring_service = RecurringBillingService()
        self.dunning_service = DunningService()
    
    async def start(self):
        """Start the scheduler"""
        self.running = True
        logger.info("Scheduler service started")
        
        while self.running:
            try:
                # Run every hour
                await self._run_scheduled_tasks()
                await asyncio.sleep(3600)  # Wait 1 hour
            except Exception as e:
                logger.error(f"Error in scheduler: {str(e)}", exc_info=True)
                await asyncio.sleep(60)  # Wait 1 minute on error
    
    async def _run_scheduled_tasks(self, db):
        """Run all scheduled tasks"""
        logger.info("Running scheduled tasks...")
        
        try:
            # Process recurring billing
            await self.recurring_service.process_renewals(db)
            
            # Process dunning
            await self.dunning_service.process_dunning(db)
            
            # Process payment retries
            await self.recurring_service.process_payment_retries(db)
            
            logger.info("Scheduled tasks completed")
        except Exception as e:
            logger.error(f"Error running scheduled tasks: {str(e)}", exc_info=True)
    
    async def start_with_db(self, get_db_func):
        """Start scheduler with database access"""
        self.running = True
        logger.info("Scheduler service started")
        
        while self.running:
            try:
                async for db in get_db_func():
                    await self._run_scheduled_tasks(db)
                    break
                await asyncio.sleep(3600)  # Wait 1 hour
            except Exception as e:
                logger.error(f"Error in scheduler: {str(e)}", exc_info=True)
                await asyncio.sleep(60)  # Wait 1 minute on error
    
    def stop(self):
        """Stop the scheduler"""
        self.running = False
        logger.info("Scheduler service stopped")


# Global scheduler instance
scheduler = SchedulerService()

