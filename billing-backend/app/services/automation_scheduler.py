"""
Automation Scheduler Service
Runs periodically to execute automation rules
"""
import asyncio
import logging
from datetime import datetime
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.database import get_db
from app.models import OrderAutomationRule, Order, AutomationRuleStatus
from app.services.automation_service import AutomationService

logger = logging.getLogger(__name__)


class AutomationScheduler:
    """Service for scheduling and executing automation rules"""
    
    def __init__(self):
        self.is_running = False
        self.automation_service = AutomationService()
        self.check_interval = 60  # Check every 60 seconds
    
    async def start_scheduler(self):
        """Start the automation scheduler"""
        if self.is_running:
            logger.warning("Automation scheduler is already running")
            return
        
        self.is_running = True
        logger.info("Starting automation scheduler")
        
        while self.is_running:
            try:
                await self.process_pending_rules()
                await asyncio.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Error in automation scheduler: {str(e)}", exc_info=True)
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    async def stop_scheduler(self):
        """Stop the automation scheduler"""
        self.is_running = False
        logger.info("Automation scheduler stopped")
    
    async def process_pending_rules(self):
        """Process all automation rules that are ready to execute"""
        try:
            async for db in get_db():
                now = datetime.utcnow()
                
                # Find rules ready to execute
                result = await db.execute(
                    select(OrderAutomationRule)
                    .where(
                        and_(
                            OrderAutomationRule.is_enabled == True,
                            OrderAutomationRule.status == AutomationRuleStatus.ACTIVE,
                            OrderAutomationRule.next_execution <= now
                        )
                    )
                    .order_by(OrderAutomationRule.next_execution.asc())
                    .limit(50)  # Process max 50 at a time
                )
                rules = result.scalars().all()
                
                if not rules:
                    logger.debug("No automation rules ready to execute")
                    return
                
                logger.info(f"Processing {len(rules)} automation rules")
                
                processed = 0
                successful = 0
                failed = 0
                
                for rule in rules:
                    try:
                        # Get order
                        result = await db.execute(select(Order).where(Order.id == rule.order_id))
                        order = result.scalars().first()
                        
                        if not order:
                            logger.warning(f"Order {rule.order_id} not found for rule {rule.id}")
                            rule.status = AutomationRuleStatus.DISABLED
                            await db.commit()
                            continue
                        
                        # Execute rule
                        result = await self.automation_service.execute_rule(rule, order, db)
                        
                        if result.get("success"):
                            successful += 1
                            logger.info(f"Successfully executed rule {rule.id} for order {rule.order_id}")
                        else:
                            failed += 1
                            logger.warning(f"Failed to execute rule {rule.id}: {result.get('message', 'Unknown error')}")
                        
                        processed += 1
                        
                    except Exception as e:
                        logger.error(f"Error processing rule {rule.id}: {str(e)}", exc_info=True)
                        failed += 1
                        processed += 1
                
                logger.info(f"Automation processing complete: {processed} processed, {successful} successful, {failed} failed")
                break  # Exit the async generator
                
        except Exception as e:
            logger.error(f"Error in process_pending_rules: {str(e)}", exc_info=True)
    
    async def get_scheduler_status(self) -> dict:
        """Get scheduler status"""
        try:
            async for db in get_db():
                now = datetime.utcnow()
                
                # Count pending rules
                result = await db.execute(
                    select(OrderAutomationRule)
                    .where(
                        and_(
                            OrderAutomationRule.is_enabled == True,
                            OrderAutomationRule.status == AutomationRuleStatus.ACTIVE,
                            OrderAutomationRule.next_execution <= now
                        )
                    )
                )
                pending_count = len(result.scalars().all())
                
                # Count total active rules
                result = await db.execute(
                    select(OrderAutomationRule)
                    .where(
                        and_(
                            OrderAutomationRule.is_enabled == True,
                            OrderAutomationRule.status == AutomationRuleStatus.ACTIVE
                        )
                    )
                )
                total_active = len(result.scalars().all())
                
                return {
                    "is_running": self.is_running,
                    "pending_rules": pending_count,
                    "total_active_rules": total_active,
                    "check_interval_seconds": self.check_interval
                }
        except Exception as e:
            logger.error(f"Error getting scheduler status: {str(e)}")
            return {"error": str(e)}


# Global scheduler instance
scheduler = AutomationScheduler()

async def start_automation_scheduler():
    """Start the global automation scheduler"""
    await scheduler.start_scheduler()

async def stop_automation_scheduler():
    """Stop the global automation scheduler"""
    await scheduler.stop_scheduler()

async def get_automation_scheduler_status():
    """Get automation scheduler status"""
    return await scheduler.get_scheduler_status()

