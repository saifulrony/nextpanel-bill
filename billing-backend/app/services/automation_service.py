"""
Automation Service
Executes automation rules for orders
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import (
    Order, OrderAutomationRule, User,
    AutomationAction, AutomationTrigger, AutomationRuleStatus
)
from app.services.email_service import EmailService
from app.services.payment_service import PaymentService
from app.services.stripe_service import StripeService

logger = logging.getLogger(__name__)


class AutomationService:
    """Service for executing automation rules"""
    
    def __init__(self):
        self.email_service = EmailService()
        self.payment_service = PaymentService()
        self.stripe_service = StripeService()
    
    async def execute_rule(
        self,
        rule: OrderAutomationRule,
        order: Order,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Execute an automation rule"""
        
        try:
            # Check if rule is enabled
            if not rule.is_enabled or rule.status != AutomationRuleStatus.ACTIVE:
                return {
                    "success": False,
                    "message": "Rule is not enabled",
                    "data": {}
                }
            
            # Check max executions
            if rule.max_executions and rule.execution_count >= rule.max_executions:
                rule.status = AutomationRuleStatus.COMPLETED
                await db.commit()
                return {
                    "success": False,
                    "message": "Rule has reached max executions",
                    "data": {}
                }
            
            # Execute based on action type
            result = None
            if rule.action_type == AutomationAction.SEND_EMAIL:
                result = await self._execute_send_email(rule, order, db)
            elif rule.action_type == AutomationAction.CHARGE_PAYMENT:
                result = await self._execute_charge_payment(rule, order, db)
            elif rule.action_type == AutomationAction.SEND_REMINDER:
                result = await self._execute_send_reminder(rule, order, db)
            elif rule.action_type == AutomationAction.UPDATE_STATUS:
                result = await self._execute_update_status(rule, order, db)
            else:
                return {
                    "success": False,
                    "message": f"Unknown action type: {rule.action_type}",
                    "data": {}
                }
            
            # Update rule execution tracking
            rule.execution_count += 1
            rule.last_execution = datetime.utcnow()
            rule.last_result = result
            
            # Calculate next execution if recurring
            if rule.is_recurring:
                if rule.recurring_interval and rule.recurring_unit:
                    delta = timedelta(**{rule.recurring_unit: rule.recurring_interval})
                    rule.next_execution = datetime.utcnow() + delta
                else:
                    rule.status = AutomationRuleStatus.COMPLETED
            else:
                # One-time rule, mark as completed
                rule.status = AutomationRuleStatus.COMPLETED
            
            # Reset error count on success
            if result.get("success"):
                rule.error_count = 0
                rule.last_error = None
            else:
                rule.error_count += 1
                rule.last_error = result.get("message", "Unknown error")
            
            await db.commit()
            
            return result
            
        except Exception as e:
            logger.error(f"Error executing automation rule {rule.id}: {str(e)}", exc_info=True)
            
            # Update error tracking
            rule.error_count += 1
            rule.last_error = str(e)
            rule.last_result = {"success": False, "message": str(e)}
            await db.commit()
            
            return {
                "success": False,
                "message": f"Error executing rule: {str(e)}",
                "data": {}
            }
    
    async def _execute_send_email(
        self,
        rule: OrderAutomationRule,
        order: Order,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Execute send email action"""
        
        try:
            config = rule.action_config
            subject = config.get("subject", f"Notification for Order {order.invoice_number or order.order_number}")
            body = config.get("body", "")
            html_body = config.get("html_body")
            template = config.get("template")
            
            # Get customer email
            result = await db.execute(select(User).where(User.id == order.customer_id))
            customer = result.scalars().first()
            if not customer or not customer.email:
                return {
                    "success": False,
                    "message": "Customer email not found",
                    "data": {}
                }
            
            # Use template if provided
            if template:
                body = self._render_template(template, order, customer)
                if not html_body:
                    html_body = body.replace("\n", "<br>")
            
            # Send email
            success = await self.email_service.send_email(
                to_email=customer.email,
                subject=subject,
                body=body,
                html_body=html_body
            )
            
            if success:
                return {
                    "success": True,
                    "message": f"Email sent to {customer.email}",
                    "data": {
                        "recipient": customer.email,
                        "subject": subject
                    }
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to send email",
                    "data": {}
                }
                
        except Exception as e:
            logger.error(f"Error executing send_email action: {str(e)}", exc_info=True)
            return {
                "success": False,
                "message": f"Error sending email: {str(e)}",
                "data": {}
            }
    
    async def _execute_charge_payment(
        self,
        rule: OrderAutomationRule,
        order: Order,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Execute charge payment action"""
        
        try:
            config = rule.action_config
            payment_method_id = config.get("payment_method_id")
            amount = config.get("amount", order.total)
            retry_attempts = config.get("retry_attempts", 3)
            
            if not payment_method_id:
                return {
                    "success": False,
                    "message": "Payment method ID not configured",
                    "data": {}
                }
            
            # Charge using Stripe
            payment_result = await self.stripe_service.create_payment_intent(
                amount=float(amount),
                currency="usd",
                payment_method_id=payment_method_id,
                metadata={
                    "order_id": order.id,
                    "invoice_number": order.invoice_number or order.order_number,
                    "automation_rule_id": rule.id,
                    "auto_charge": "true"
                }
            )
            
            if payment_result.get("success"):
                # Update order status
                from app.models import OrderStatus
                order.status = OrderStatus.COMPLETED
                order.paid_at = datetime.utcnow()
                
                return {
                    "success": True,
                    "message": f"Payment charged successfully: ${amount:.2f}",
                    "data": {
                        "amount": amount,
                        "payment_intent_id": payment_result.get("payment_intent_id")
                    }
                }
            else:
                return {
                    "success": False,
                    "message": f"Payment failed: {payment_result.get('error', 'Unknown error')}",
                    "data": {
                        "error": payment_result.get("error")
                    }
                }
                
        except Exception as e:
            logger.error(f"Error executing charge_payment action: {str(e)}", exc_info=True)
            return {
                "success": False,
                "message": f"Error charging payment: {str(e)}",
                "data": {}
            }
    
    async def _execute_send_reminder(
        self,
        rule: OrderAutomationRule,
        order: Order,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Execute send reminder action"""
        
        try:
            config = rule.action_config
            subject = config.get("subject", f"Payment Reminder - Order {order.invoice_number or order.order_number}")
            body = config.get("body", "")
            template = config.get("template", "payment_reminder")
            
            # Get customer
            result = await db.execute(select(User).where(User.id == order.customer_id))
            customer = result.scalars().first()
            if not customer or not customer.email:
                return {
                    "success": False,
                    "message": "Customer email not found",
                    "data": {}
                }
            
            # Render reminder template
            if not body:
                body = self._render_reminder_template(order, customer)
            
            html_body = config.get("html_body")
            if not html_body:
                html_body = self._render_reminder_template_html(order, customer)
            
            # Send email
            success = await self.email_service.send_email(
                to_email=customer.email,
                subject=subject,
                body=body,
                html_body=html_body
            )
            
            if success:
                return {
                    "success": True,
                    "message": f"Reminder sent to {customer.email}",
                    "data": {
                        "recipient": customer.email,
                        "subject": subject
                    }
                }
            else:
                return {
                    "success": False,
                    "message": "Failed to send reminder",
                    "data": {}
                }
                
        except Exception as e:
            logger.error(f"Error executing send_reminder action: {str(e)}", exc_info=True)
            return {
                "success": False,
                "message": f"Error sending reminder: {str(e)}",
                "data": {}
            }
    
    async def _execute_update_status(
        self,
        rule: OrderAutomationRule,
        order: Order,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Execute update status action"""
        
        try:
            config = rule.action_config
            new_status = config.get("new_status")
            
            if not new_status:
                return {
                    "success": False,
                    "message": "New status not configured",
                    "data": {}
                }
            
            # Update order status
            from app.models import OrderStatus
            try:
                order.status = OrderStatus(new_status)
            except ValueError:
                return {
                    "success": False,
                    "message": f"Invalid status: {new_status}",
                    "data": {}
                }
            
            return {
                "success": True,
                "message": f"Order status updated to {new_status}",
                "data": {
                    "old_status": str(order.status),
                    "new_status": new_status
                }
            }
            
        except Exception as e:
            logger.error(f"Error executing update_status action: {str(e)}", exc_info=True)
            return {
                "success": False,
                "message": f"Error updating status: {str(e)}",
                "data": {}
            }
    
    def _render_template(self, template: str, order: Order, customer: User) -> str:
        """Render email template with order and customer data"""
        # Simple template rendering - can be enhanced with Jinja2
        template = template.replace("{{customer_name}}", customer.full_name or "Customer")
        template = template.replace("{{order_number}}", order.invoice_number or order.order_number or order.id)
        template = template.replace("{{order_total}}", f"${order.total:.2f}")
        template = template.replace("{{due_date}}", order.due_date.strftime("%Y-%m-%d") if order.due_date else "N/A")
        return template
    
    def _render_reminder_template(self, order: Order, customer: User) -> str:
        """Render payment reminder template"""
        return f"""
Hello {customer.full_name or "Customer"},

This is a reminder that payment is due for your order.

Order Details:
- Order Number: {order.invoice_number or order.order_number}
- Amount Due: ${order.total:.2f}
- Due Date: {order.due_date.strftime("%Y-%m-%d") if order.due_date else "N/A"}

Please make payment at your earliest convenience.

Thank you,
NextPanel Team
"""
    
    def _render_reminder_template_html(self, order: Order, customer: User) -> str:
        """Render payment reminder HTML template"""
        return f"""
<html>
<body>
    <h2>Payment Reminder</h2>
    <p>Hello {customer.full_name or "Customer"},</p>
    <p>This is a reminder that payment is due for your order.</p>
    <h3>Order Details:</h3>
    <ul>
        <li><strong>Order Number:</strong> {order.invoice_number or order.order_number}</li>
        <li><strong>Amount Due:</strong> ${order.total:.2f}</li>
        <li><strong>Due Date:</strong> {order.due_date.strftime("%Y-%m-%d") if order.due_date else "N/A"}</li>
    </ul>
    <p>Please make payment at your earliest convenience.</p>
    <p>Thank you,<br>NextPanel Team</p>
</body>
</html>
"""

