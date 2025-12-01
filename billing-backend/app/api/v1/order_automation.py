"""
Order Automation API
Handles automation rules for orders
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import logging

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import (
    Order, OrderAutomationRule, User, Payment,
    AutomationAction, AutomationTrigger, AutomationRuleStatus
)
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders/{order_id}/automation", tags=["order-automation"])


# Request/Response Models
class AutomationRuleCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    
    # Trigger
    trigger_type: AutomationTrigger
    trigger_value: Optional[int] = None  # Days/hours before/after
    trigger_unit: Optional[str] = "days"  # "days", "hours", "minutes"
    
    # Action
    action_type: AutomationAction
    action_config: dict = Field(default_factory=dict)
    
    # Schedule
    is_recurring: bool = False
    recurring_interval: Optional[int] = None
    recurring_unit: Optional[str] = "days"
    max_executions: Optional[int] = None
    
    is_enabled: bool = True


class AutomationRuleUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_type: Optional[AutomationTrigger] = None
    trigger_value: Optional[int] = None
    trigger_unit: Optional[str] = None
    action_type: Optional[AutomationAction] = None
    action_config: Optional[dict] = None
    is_recurring: Optional[bool] = None
    recurring_interval: Optional[int] = None
    recurring_unit: Optional[str] = None
    max_executions: Optional[int] = None
    is_enabled: Optional[bool] = None
    status: Optional[AutomationRuleStatus] = None


class AutomationRuleResponse(BaseModel):
    id: str
    order_id: str
    name: str
    description: Optional[str]
    trigger_type: str
    trigger_value: Optional[int]
    trigger_unit: Optional[str]
    action_type: str
    action_config: dict
    is_recurring: bool
    recurring_interval: Optional[int]
    recurring_unit: Optional[str]
    max_executions: Optional[int]
    execution_count: int
    next_execution: Optional[str]
    last_execution: Optional[str]
    status: str
    is_enabled: bool
    last_result: Optional[dict]
    error_count: int
    last_error: Optional[str]
    created_at: str
    updated_at: Optional[str]
    
    model_config = {"from_attributes": True}


def calculate_next_execution(
    trigger_type: AutomationTrigger,
    trigger_value: Optional[int],
    trigger_unit: Optional[str],
    order: Order,
    is_recurring: bool = False,
    recurring_interval: Optional[int] = None,
    recurring_unit: Optional[str] = None
) -> Optional[datetime]:
    """Calculate next execution time based on trigger configuration"""
    now = datetime.utcnow()
    
    if trigger_type == AutomationTrigger.ON_CREATE:
        return now  # Execute immediately
    
    if not order.due_date:
        return None  # Can't calculate without due date
    
    due_date = order.due_date
    
    if trigger_type == AutomationTrigger.ON_DUE_DATE:
        next_exec = due_date
    elif trigger_type == AutomationTrigger.BEFORE_DUE_DATE:
        if trigger_value and trigger_unit:
            delta = timedelta(**{trigger_unit: trigger_value})
            next_exec = due_date - delta
        else:
            return None
    elif trigger_type == AutomationTrigger.AFTER_DUE_DATE:
        if trigger_value and trigger_unit:
            delta = timedelta(**{trigger_unit: trigger_value})
            next_exec = due_date + delta
        else:
            return None
    elif trigger_type == AutomationTrigger.CUSTOM_INTERVAL:
        if trigger_value and trigger_unit:
            delta = timedelta(**{trigger_unit: trigger_value})
            next_exec = now + delta
        else:
            return None
    elif trigger_type == AutomationTrigger.RECURRING:
        if recurring_interval and recurring_unit:
            delta = timedelta(**{recurring_unit: recurring_interval})
            next_exec = now + delta
        else:
            return None
    else:
        return None
    
    # If next execution is in the past, don't schedule it
    if next_exec < now and not is_recurring:
        return None
    
    return next_exec


@router.post("", response_model=AutomationRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_automation_rule(
    order_id: str,
    rule_data: AutomationRuleCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new automation rule for an order"""
    
    # Verify user is admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can create automation rules")
    
    # Get order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Calculate next execution
    next_execution = calculate_next_execution(
        rule_data.trigger_type,
        rule_data.trigger_value,
        rule_data.trigger_unit,
        order,
        rule_data.is_recurring,
        rule_data.recurring_interval,
        rule_data.recurring_unit
    )
    
    # Create rule
    new_rule = OrderAutomationRule(
        order_id=order_id,
        name=rule_data.name,
        description=rule_data.description,
        trigger_type=rule_data.trigger_type,
        trigger_value=rule_data.trigger_value,
        trigger_unit=rule_data.trigger_unit,
        action_type=rule_data.action_type,
        action_config=rule_data.action_config,
        is_recurring=rule_data.is_recurring,
        recurring_interval=rule_data.recurring_interval,
        recurring_unit=rule_data.recurring_unit,
        max_executions=rule_data.max_executions,
        next_execution=next_execution,
        is_enabled=rule_data.is_enabled,
        status=AutomationRuleStatus.ACTIVE if rule_data.is_enabled else AutomationRuleStatus.PAUSED
    )
    
    db.add(new_rule)
    await db.commit()
    await db.refresh(new_rule)
    
    logger.info(f"Created automation rule {new_rule.id} for order {order_id}")
    
    return AutomationRuleResponse.model_validate(new_rule)


@router.get("", response_model=List[AutomationRuleResponse])
async def list_automation_rules(
    order_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """List all automation rules for an order"""
    
    # Verify user is admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can view automation rules")
    
    # Get order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get rules
    result = await db.execute(
        select(OrderAutomationRule)
        .where(OrderAutomationRule.order_id == order_id)
        .order_by(OrderAutomationRule.created_at.desc())
    )
    rules = result.scalars().all()
    
    return [AutomationRuleResponse.model_validate(rule) for rule in rules]


@router.get("/payment-methods", response_model=List[dict])
async def get_order_payment_methods(
    order_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get payment methods available for an order's customer"""
    
    # Verify user is admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can view payment methods")
    
    # Get order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get customer
    result = await db.execute(select(User).where(User.id == order.customer_id))
    customer = result.scalars().first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Try to get payment methods from Stripe if customer has Stripe ID
    payment_methods = []
    
    if customer.stripe_customer_id:
        from app.services.stripe_service import StripeService
        stripe_service = StripeService()
        
        stripe_result = await stripe_service.list_payment_methods(customer.stripe_customer_id)
        
        if stripe_result.get("success"):
            for pm in stripe_result.get("payment_methods", []):
                card = pm.get("card")
                if card:
                    brand = card.get("brand", "").upper() if card.get("brand") else "Card"
                    last4 = card.get("last4", "xxxx") if card.get("last4") else "xxxx"
                    display_name = f"{brand} •••• {last4}"
                else:
                    display_name = "Payment Method"
                
                payment_methods.append({
                    "id": pm.get("id"),
                    "type": pm.get("type", "card"),
                    "brand": card.get("brand") if card else None,
                    "last4": card.get("last4") if card else None,
                    "exp_month": card.get("exp_month") if card else None,
                    "exp_year": card.get("exp_year") if card else None,
                    "display_name": display_name
                })
    
    # Also check payments related to this order for saved payment methods
    result = await db.execute(
        select(Payment)
        .where(
            and_(
                Payment.order_id == order_id,
                Payment.payment_method_id.isnot(None)
            )
        )
        .order_by(Payment.created_at.desc())
        .limit(10)
    )
    order_payments = result.scalars().all()
    
    for payment in order_payments:
        if payment.payment_method_id and payment.payment_method_id not in [pm["id"] for pm in payment_methods]:
            payment_methods.append({
                "id": payment.payment_method_id,
                "type": payment.payment_method or "card",
                "display_name": f"Saved Payment Method ({payment.payment_method_id[:20]}...)"
            })
    
    # If no payment methods found, return empty list
    return payment_methods if payment_methods else []


@router.get("/{rule_id}", response_model=AutomationRuleResponse)
async def get_automation_rule(
    order_id: str,
    rule_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific automation rule"""
    
    # Verify user is admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can view automation rules")
    
    # Get rule
    result = await db.execute(
        select(OrderAutomationRule)
        .where(
            and_(
                OrderAutomationRule.id == rule_id,
                OrderAutomationRule.order_id == order_id
            )
        )
    )
    rule = result.scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")
    
    return AutomationRuleResponse.model_validate(rule)


@router.patch("/{rule_id}", response_model=AutomationRuleResponse)
async def update_automation_rule(
    order_id: str,
    rule_id: str,
    rule_data: AutomationRuleUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update an automation rule"""
    
    # Verify user is admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can update automation rules")
    
    # Get rule
    result = await db.execute(
        select(OrderAutomationRule)
        .where(
            and_(
                OrderAutomationRule.id == rule_id,
                OrderAutomationRule.order_id == order_id
            )
        )
    )
    rule = result.scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")
    
    # Update fields
    update_data = rule_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "status" and value:
            setattr(rule, field, AutomationRuleStatus(value))
        elif field == "trigger_type" and value:
            setattr(rule, field, AutomationTrigger(value))
        elif field == "action_type" and value:
            setattr(rule, field, AutomationAction(value))
        else:
            setattr(rule, field, value)
    
    # Recalculate next execution if trigger changed
    if "trigger_type" in update_data or "trigger_value" in update_data or "trigger_unit" in update_data:
        result = await db.execute(select(Order).where(Order.id == order_id))
        order = result.scalars().first()
        if order:
            rule.next_execution = calculate_next_execution(
                rule.trigger_type,
                rule.trigger_value,
                rule.trigger_unit,
                order,
                rule.is_recurring,
                rule.recurring_interval,
                rule.recurring_unit
            )
    
    await db.commit()
    await db.refresh(rule)
    
    logger.info(f"Updated automation rule {rule_id} for order {order_id}")
    
    return AutomationRuleResponse.model_validate(rule)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_automation_rule(
    order_id: str,
    rule_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete an automation rule"""
    
    # Verify user is admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can delete automation rules")
    
    # Get rule
    result = await db.execute(
        select(OrderAutomationRule)
        .where(
            and_(
                OrderAutomationRule.id == rule_id,
                OrderAutomationRule.order_id == order_id
            )
        )
    )
    rule = result.scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")
    
    await db.delete(rule)
    await db.commit()
    
    logger.info(f"Deleted automation rule {rule_id} for order {order_id}")


@router.post("/{rule_id}/execute", status_code=status.HTTP_200_OK)
async def execute_automation_rule(
    order_id: str,
    rule_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Manually execute an automation rule"""
    
    # Verify user is admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can execute automation rules")
    
    # Get rule
    result = await db.execute(
        select(OrderAutomationRule)
        .where(
            and_(
                OrderAutomationRule.id == rule_id,
                OrderAutomationRule.order_id == order_id
            )
        )
    )
    rule = result.scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")
    
    # Get order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Execute rule
    from app.services.automation_service import AutomationService
    automation_service = AutomationService()
    result = await automation_service.execute_rule(rule, order, db)
    
    return {"success": result["success"], "message": result.get("message", ""), "data": result.get("data", {})}

