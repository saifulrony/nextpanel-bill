"""
Auto-Charge Scheduler Service
Handles automatic charging of orders based on configuration
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.models import Order, OrderStatus
from app.services.stripe_service import StripeService

logger = logging.getLogger(__name__)

class AutoChargeScheduler:
    """Service for managing automatic charging of orders"""
    
    def __init__(self):
        self.stripe_service = StripeService()
        self.is_running = False
    
    async def start_scheduler(self):
        """Start the auto-charge scheduler"""
        if self.is_running:
            logger.warning("Auto-charge scheduler is already running")
            return
        
        self.is_running = True
        logger.info("Starting auto-charge scheduler")
        
        while self.is_running:
            try:
                await self.process_auto_charge_queue()
                # Check every 5 minutes
                await asyncio.sleep(300)
            except Exception as e:
                logger.error(f"Error in auto-charge scheduler: {str(e)}")
                await asyncio.sleep(60)  # Wait 1 minute before retrying
    
    async def stop_scheduler(self):
        """Stop the auto-charge scheduler"""
        self.is_running = False
        logger.info("Auto-charge scheduler stopped")
    
    async def process_auto_charge_queue(self):
        """Process all orders queued for automatic charging"""
        try:
            # Get database session
            async for db in get_db():
                # Find orders ready for auto-charging
                now = datetime.utcnow()
                result = await db.execute(
                    select(Order).where(
                        and_(
                            Order.status == OrderStatus.PENDING,
                            Order.auto_charge_config["enabled"].astext == "true",
                            Order.auto_charge_config["next_charge_date"].astext <= now.isoformat()
                        )
                    )
                )
                orders = result.scalars().all()
                
                if not orders:
                    logger.debug("No orders ready for auto-charging")
                    return
                
                logger.info(f"Processing {len(orders)} orders for auto-charging")
                
                processed = 0
                successful = 0
                failed = 0
                
                for order in orders:
                    try:
                        result = await self.process_order_auto_charge(order, db)
                        if result["success"]:
                            successful += 1
                        else:
                            failed += 1
                        processed += 1
                    except Exception as e:
                        logger.error(f"Error processing auto-charge for order {order.id}: {str(e)}")
                        failed += 1
                        processed += 1
                
                await db.commit()
                logger.info(f"Auto-charge processing complete: {processed} processed, {successful} successful, {failed} failed")
                break  # Exit the async generator
                
        except Exception as e:
            logger.error(f"Error in process_auto_charge_queue: {str(e)}")
    
    async def process_order_auto_charge(self, order: Order, db: AsyncSession) -> Dict[str, Any]:
        """Process auto-charge for a specific order"""
        try:
            config = order.auto_charge_config
            payment_method_id = config.get("payment_method_id")
            
            if not payment_method_id:
                logger.warning(f"No payment method configured for order {order.id}")
                return {"success": False, "error": "No payment method configured"}
            
            # Check retry attempts
            retry_attempts = config.get("retry_attempts", 0)
            max_retries = config.get("max_retry_attempts", 3)
            
            if retry_attempts >= max_retries:
                logger.warning(f"Order {order.id} has exceeded max retry attempts ({max_retries})")
                # Disable auto-charge for this order
                order.auto_charge_config["enabled"] = False
                return {"success": False, "error": "Max retry attempts exceeded"}
            
            # Process payment with Stripe
            payment_result = await self.stripe_service.create_payment_intent(
                amount=order.total,
                currency="usd",
                payment_method_id=payment_method_id,
                metadata={
                    "order_id": order.id,
                    "invoice_number": order.invoice_number or order.order_number,
                    "auto_charge": "true"
                }
            )
            
            if payment_result["success"]:
                # Payment succeeded
                order.status = OrderStatus.COMPLETED
                order.paid_at = datetime.utcnow()
                order.auto_charge_config["enabled"] = False  # Disable after successful payment
                logger.info(f"Auto-charge successful for order {order.id}")
                return {"success": True, "payment_id": payment_result["payment_intent_id"]}
            else:
                # Payment failed - schedule retry
                retry_interval_days = config.get("retry_interval_days", 3)
                next_charge_date = datetime.utcnow() + timedelta(days=retry_interval_days)
                
                order.auto_charge_config["next_charge_date"] = next_charge_date.isoformat()
                order.auto_charge_config["retry_attempts"] = retry_attempts + 1
                
                logger.warning(f"Auto-charge failed for order {order.id}: {payment_result.get('error', 'Unknown error')}")
                return {"success": False, "error": payment_result.get("error", "Payment failed")}
                
        except Exception as e:
            logger.error(f"Error processing auto-charge for order {order.id}: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_auto_charge_queue_status(self) -> Dict[str, Any]:
        """Get status of orders in auto-charge queue"""
        try:
            async for db in get_db():
                now = datetime.utcnow()
                
                # Get orders ready for charging
                result = await db.execute(
                    select(Order).where(
                        and_(
                            Order.status == OrderStatus.PENDING,
                            Order.auto_charge_config["enabled"].astext == "true",
                            Order.auto_charge_config["next_charge_date"].astext <= now.isoformat()
                        )
                    )
                )
                ready_orders = result.scalars().all()
                
                # Get all orders with auto-charge enabled
                result = await db.execute(
                    select(Order).where(
                        Order.auto_charge_config["enabled"].astext == "true"
                    )
                )
                all_auto_charge_orders = result.scalars().all()
                
                return {
                    "ready_for_charging": len(ready_orders),
                    "total_auto_charge_enabled": len(all_auto_charge_orders),
                    "scheduler_running": self.is_running,
                    "ready_orders": [
                        {
                            "id": order.id,
                            "invoice_number": order.invoice_number,
                            "total": order.total,
                            "next_charge_date": order.auto_charge_config.get("next_charge_date"),
                            "retry_attempts": order.auto_charge_config.get("retry_attempts", 0)
                        }
                        for order in ready_orders
                    ]
                }
        except Exception as e:
            logger.error(f"Error getting auto-charge queue status: {str(e)}")
            return {"error": str(e)}


# Global scheduler instance
scheduler = AutoChargeScheduler()

async def start_auto_charge_scheduler():
    """Start the global auto-charge scheduler"""
    await scheduler.start_scheduler()

async def stop_auto_charge_scheduler():
    """Stop the global auto-charge scheduler"""
    await scheduler.stop_scheduler()

async def get_auto_charge_status():
    """Get auto-charge scheduler status"""
    return await scheduler.get_auto_charge_queue_status()
