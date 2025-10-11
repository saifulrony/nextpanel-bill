"""
Subscription Management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import (
    Subscription, 
    License, 
    Plan, 
    User,
    SubscriptionStatus,
    LicenseStatus
)
from app.schemas import (
    SubscriptionCreateRequest,
    SubscriptionResponse,
    SubscriptionUpdateRequest,
    SubscriptionCancelRequest
)
from app.services.payment_service import PaymentService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.post("/", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    request: SubscriptionCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new subscription"""
    # Get plan
    result = await db.execute(select(Plan).where(Plan.id == request.plan_id))
    plan = result.scalars().first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    # Create or get Stripe customer
    payment_service = PaymentService()
    
    if not user.stripe_customer_id:
        customer = await payment_service.create_customer(
            email=user.email,
            name=user.full_name,
            metadata={"user_id": user.id}
        )
        user.stripe_customer_id = customer.get("id")
    
    # Get price ID based on billing cycle
    if request.billing_cycle == "yearly":
        price_id = plan.stripe_price_id_yearly
    else:
        price_id = plan.stripe_price_id_monthly
    
    if not price_id:
        # Mock price ID for development
        price_id = f"price_mock_{plan.id}_{request.billing_cycle}"
    
    # Create subscription with Stripe
    stripe_subscription = await payment_service.create_subscription(
        customer_id=user.stripe_customer_id,
        price_id=price_id,
        metadata={
            "user_id": user.id,
            "plan_id": plan.id
        }
    )
    
    # Create license if needed
    if request.license_id:
        # Use existing license
        result = await db.execute(
            select(License).where(
                and_(
                    License.id == request.license_id,
                    License.user_id == user_id
                )
            )
        )
        license = result.scalars().first()
        
        if not license:
            raise HTTPException(status_code=404, detail="License not found")
    else:
        # Create new license
        from app.api.v1.licenses import generate_license_key
        
        license = License(
            user_id=user_id,
            plan_id=plan.id,
            license_key=generate_license_key(),
            status=LicenseStatus.ACTIVE,
            features=plan.features,
            max_accounts=plan.max_accounts,
            max_domains=plan.max_domains,
            max_databases=plan.max_databases,
            max_emails=plan.max_emails,
            activation_date=datetime.utcnow(),
            expiry_date=datetime.utcnow() + timedelta(days=365 if request.billing_cycle == "yearly" else 30),
            auto_renew=True
        )
        db.add(license)
        await db.flush()
    
    # Create subscription record
    subscription = Subscription(
        license_id=license.id,
        stripe_subscription_id=stripe_subscription.get("id"),
        status=SubscriptionStatus.ACTIVE,
        current_period_start=datetime.fromtimestamp(stripe_subscription.get("current_period_start", datetime.utcnow().timestamp())),
        current_period_end=datetime.fromtimestamp(stripe_subscription.get("current_period_end", (datetime.utcnow() + timedelta(days=30)).timestamp())),
        cancel_at_period_end=False
    )
    
    db.add(subscription)
    await db.commit()
    await db.refresh(subscription)
    
    return subscription


@router.get("/", response_model=List[SubscriptionResponse])
async def list_subscriptions(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """List user's subscriptions"""
    # Get user's licenses first
    result = await db.execute(
        select(License).where(License.user_id == user_id)
    )
    licenses = result.scalars().all()
    license_ids = [lic.id for lic in licenses]
    
    # Get subscriptions for those licenses
    result = await db.execute(
        select(Subscription)
        .where(Subscription.license_id.in_(license_ids))
        .order_by(Subscription.created_at.desc())
    )
    subscriptions = result.scalars().all()
    
    return subscriptions


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
async def get_subscription(
    subscription_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get subscription details"""
    result = await db.execute(
        select(Subscription).where(Subscription.id == subscription_id)
    )
    subscription = result.scalars().first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Verify user owns this subscription
    result = await db.execute(
        select(License).where(
            and_(
                License.id == subscription.license_id,
                License.user_id == user_id
            )
        )
    )
    license = result.scalars().first()
    
    if not license:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    return subscription


@router.put("/{subscription_id}", response_model=SubscriptionResponse)
async def update_subscription(
    subscription_id: str,
    request: SubscriptionUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update subscription (upgrade/downgrade plan)"""
    # Get subscription
    result = await db.execute(
        select(Subscription).where(Subscription.id == subscription_id)
    )
    subscription = result.scalars().first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Verify ownership
    result = await db.execute(
        select(License).where(
            and_(
                License.id == subscription.license_id,
                License.user_id == user_id
            )
        )
    )
    license = result.scalars().first()
    
    if not license:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Get new plan
    result = await db.execute(select(Plan).where(Plan.id == request.new_plan_id))
    new_plan = result.scalars().first()
    
    if not new_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Update subscription with Stripe
    payment_service = PaymentService()
    
    new_price_id = new_plan.stripe_price_id_monthly or f"price_mock_{new_plan.id}"
    
    updated_subscription = await payment_service.update_subscription(
        subscription_id=subscription.stripe_subscription_id,
        new_price_id=new_price_id
    )
    
    # Update license
    license.plan_id = new_plan.id
    license.max_accounts = new_plan.max_accounts
    license.max_domains = new_plan.max_domains
    license.max_databases = new_plan.max_databases
    license.max_emails = new_plan.max_emails
    
    await db.commit()
    await db.refresh(subscription)
    
    return subscription


@router.post("/{subscription_id}/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    subscription_id: str,
    request: SubscriptionCancelRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Cancel subscription"""
    # Get subscription
    result = await db.execute(
        select(Subscription).where(Subscription.id == subscription_id)
    )
    subscription = result.scalars().first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Verify ownership
    result = await db.execute(
        select(License).where(
            and_(
                License.id == subscription.license_id,
                License.user_id == user_id
            )
        )
    )
    license = result.scalars().first()
    
    if not license:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Cancel with Stripe
    payment_service = PaymentService()
    
    cancelled_subscription = await payment_service.cancel_subscription(
        subscription_id=subscription.stripe_subscription_id,
        cancel_at_period_end=request.cancel_at_period_end
    )
    
    # Update subscription
    subscription.cancel_at_period_end = request.cancel_at_period_end
    
    if not request.cancel_at_period_end:
        subscription.status = SubscriptionStatus.CANCELLED
        license.status = LicenseStatus.CANCELLED
        license.auto_renew = False
    
    await db.commit()
    await db.refresh(subscription)
    
    return subscription


@router.post("/{subscription_id}/reactivate", response_model=SubscriptionResponse)
async def reactivate_subscription(
    subscription_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Reactivate a cancelled subscription"""
    # Get subscription
    result = await db.execute(
        select(Subscription).where(Subscription.id == subscription_id)
    )
    subscription = result.scalars().first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Verify ownership
    result = await db.execute(
        select(License).where(
            and_(
                License.id == subscription.license_id,
                License.user_id == user_id
            )
        )
    )
    license = result.scalars().first()
    
    if not license:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Reactivate subscription
    subscription.cancel_at_period_end = False
    subscription.status = SubscriptionStatus.ACTIVE
    license.status = LicenseStatus.ACTIVE
    license.auto_renew = True
    
    await db.commit()
    await db.refresh(subscription)
    
    return subscription

