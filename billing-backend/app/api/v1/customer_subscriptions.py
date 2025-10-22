"""
Customer Subscription Management API
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta

from ...core.database import get_db
from ...core.security import get_current_user_id
from ...models import License, Subscription, Plan, User
from ...schemas import LicenseResponse, SubscriptionResponse

router = APIRouter()

@router.get("/hosting", response_model=List[dict])
async def get_customer_hosting_subscriptions(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = Query(None, description="Filter by subscription status")
):
    """Get all hosting subscriptions for the current customer"""
    try:
        # Build query to get licenses with their plans (no subscriptions for now)
        query = select(License, Plan).join(
            Plan, License.plan_id == Plan.id
        ).where(
            License.user_id == user_id
        )
        
        result = await db.execute(query)
        rows = result.all()
        
        hosting_subscriptions = []
        for license_row, plan_row in rows:
            # Calculate usage (mock data for now - in real implementation, 
            # this would come from NextPanel API)
            current_accounts = 2  # Mock: would be fetched from NextPanel
            current_domains = 1   # Mock: would be fetched from NextPanel
            current_databases = 3 # Mock: would be fetched from NextPanel
            current_emails = 5    # Mock: would be fetched from NextPanel
            
            # Calculate expiry status
            is_expired = license_row.expiry_date and license_row.expiry_date < datetime.utcnow()
            is_expiring_soon = (
                license_row.expiry_date and 
                license_row.expiry_date <= datetime.utcnow() + timedelta(days=30) and
                license_row.expiry_date > datetime.utcnow()
            )
            
            # Determine status
            if is_expired:
                status_value = 'expired'
            elif is_expiring_soon:
                status_value = 'expiring'
            elif license_row.status.value == 'active':
                status_value = 'active'
            else:
                status_value = 'pending'
            
            hosting_subscription = {
                "id": license_row.id,
                "name": plan_row.name,
                "description": plan_row.description,
                "price_monthly": plan_row.price_monthly,
                "price_yearly": plan_row.price_yearly,
                "category": "hosting",  # Default category since Plan doesn't have category field
                "status": status_value,
                "max_accounts": plan_row.max_accounts,
                "max_domains": plan_row.max_domains,
                "max_databases": plan_row.max_databases,
                "max_emails": plan_row.max_emails,
                "current_accounts": current_accounts,
                "current_domains": current_domains,
                "current_databases": current_databases,
                "current_emails": current_emails,
                "nextpanel_url": f"https://panel.{license_row.id[:8]}.example.com",  # Mock URL
                "nextpanel_username": f"user_{license_row.id[:8]}",
                "purchased_at": license_row.created_at.isoformat(),
                "expiry_date": license_row.expiry_date.isoformat() if license_row.expiry_date else None,
                "auto_renew": license_row.auto_renew,
                "features": plan_row.features or {},
                "subscription_id": None,
                "subscription_status": None,
                "current_period_start": None,
                "current_period_end": None,
            }
            
            # Apply status filter if provided
            if not status or hosting_subscription["status"] == status:
                hosting_subscriptions.append(hosting_subscription)
        
        return hosting_subscriptions
        
    except Exception as e:
        print(f"Error fetching hosting subscriptions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch hosting subscriptions")

@router.get("/stats/summary")
async def get_subscription_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get subscription statistics for the customer"""
    try:
        # Get all licenses for the user
        query = select(License, Plan).join(Plan, License.plan_id == Plan.id).where(License.user_id == user_id)
        result = await db.execute(query)
        rows = result.all()
        
        # Calculate statistics
        total_subscriptions = len(rows)
        active_subscriptions = len([r for r in rows if r[0].expiry_date and r[0].expiry_date > datetime.utcnow()])
        expiring_soon = len([
            r for r in rows 
            if r[0].expiry_date and 
            r[0].expiry_date <= datetime.utcnow() + timedelta(days=30) and
            r[0].expiry_date > datetime.utcnow()
        ])
        expired_subscriptions = len([r for r in rows if r[0].expiry_date and r[0].expiry_date < datetime.utcnow()])
        
        # Group by plan name (since we don't have categories)
        categories = {}
        for license_row, plan_row in rows:
            plan_name = plan_row.name
            if plan_name not in categories:
                categories[plan_name] = 0
            categories[plan_name] += 1
        
        return {
            "total_subscriptions": total_subscriptions,
            "active_subscriptions": active_subscriptions,
            "expiring_soon": expiring_soon,
            "expired_subscriptions": expired_subscriptions,
            "categories": categories
        }
        
    except Exception as e:
        print(f"Error fetching subscription stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch subscription statistics")

@router.get("/usage/{license_id}")
async def get_license_usage(
    license_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed usage information for a specific license"""
    try:
        # Verify the license belongs to the user
        query = select(License, Plan).join(Plan, License.plan_id == Plan.id).where(
            and_(
                License.id == license_id,
                License.user_id == user_id
            )
        )
        
        result = await db.execute(query)
        license_row, plan_row = result.first()
        
        if not license_row:
            raise HTTPException(status_code=404, detail="License not found")
        
        # Mock usage data - in real implementation, this would come from NextPanel API
        usage_data = {
            "license_id": license_id,
            "plan_name": plan_row.name,
            "accounts": {
                "current": 2,
                "max": plan_row.max_accounts,
                "percentage": round((2 / plan_row.max_accounts) * 100) if plan_row.max_accounts > 0 else 0
            },
            "domains": {
                "current": 1,
                "max": plan_row.max_domains,
                "percentage": round((1 / plan_row.max_domains) * 100) if plan_row.max_domains > 0 else 0
            },
            "databases": {
                "current": 3,
                "max": plan_row.max_databases,
                "percentage": round((3 / plan_row.max_databases) * 100) if plan_row.max_databases > 0 else 0
            },
            "emails": {
                "current": 5,
                "max": plan_row.max_emails,
                "percentage": round((5 / plan_row.max_emails) * 100) if plan_row.max_emails > 0 else 0
            },
            "last_updated": datetime.utcnow().isoformat()
        }
        
        return usage_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching license usage: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch license usage")
