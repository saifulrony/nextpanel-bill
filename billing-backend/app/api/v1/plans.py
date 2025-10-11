"""
Enhanced Plans/Products Management API
Supports hosting, domain, and software products
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import Plan
from app.schemas import (
    PlanResponse,
    PlanCreateRequest,
    PlanUpdateRequest
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("/", response_model=List[PlanResponse])
async def list_plans(
    db: AsyncSession = Depends(get_db),
    category: Optional[str] = None,
    is_active: Optional[bool] = True
):
    """
    List all plans/products
    Filter by category: hosting, domain, software, email, ssl
    """
    query = select(Plan)
    
    if is_active is not None:
        query = query.where(Plan.is_active == is_active)
    
    if category:
        # Filter by features JSON if category is specified
        query = query.where(Plan.features.contains({'category': category}))
    
    query = query.order_by(Plan.price_monthly.asc())
    
    result = await db.execute(query)
    plans = result.scalars().all()
    
    return plans


@router.get("/categories")
async def get_plan_categories(db: AsyncSession = Depends(get_db)):
    """Get available product categories"""
    return {
        "categories": [
            {"id": "hosting", "name": "Hosting", "icon": "server"},
            {"id": "domain", "name": "Domains", "icon": "globe"},
            {"id": "software", "name": "Software & Licenses", "icon": "code"},
            {"id": "email", "name": "Email Services", "icon": "mail"},
            {"id": "ssl", "name": "SSL Certificates", "icon": "lock"},
            {"id": "backup", "name": "Backup Solutions", "icon": "database"},
            {"id": "cdn", "name": "CDN Services", "icon": "zap"}
        ]
    }


@router.get("/{plan_id}", response_model=PlanResponse)
async def get_plan(plan_id: str, db: AsyncSession = Depends(get_db)):
    """Get a specific plan/product details"""
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalars().first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    return plan


@router.post("/", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    request: PlanCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new plan/product
    Admin only functionality
    """
    # TODO: Add admin check
    
    plan = Plan(
        name=request.name,
        description=request.description,
        price_monthly=request.price_monthly,
        price_yearly=request.price_yearly,
        features=request.features or {},
        max_accounts=request.max_accounts,
        max_domains=request.max_domains,
        max_databases=request.max_databases,
        max_emails=request.max_emails,
        stripe_price_id_monthly=request.stripe_price_id_monthly,
        stripe_price_id_yearly=request.stripe_price_id_yearly,
        is_active=True
    )
    
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    
    logger.info(f"Created plan: {plan.name}")
    return plan


@router.put("/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: str,
    request: PlanUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an existing plan/product
    Admin only functionality
    """
    # TODO: Add admin check
    
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalars().first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Update fields
    if request.name is not None:
        plan.name = request.name
    if request.description is not None:
        plan.description = request.description
    if request.price_monthly is not None:
        plan.price_monthly = request.price_monthly
    if request.price_yearly is not None:
        plan.price_yearly = request.price_yearly
    if request.features is not None:
        plan.features = request.features
    if request.max_accounts is not None:
        plan.max_accounts = request.max_accounts
    if request.max_domains is not None:
        plan.max_domains = request.max_domains
    if request.max_databases is not None:
        plan.max_databases = request.max_databases
    if request.max_emails is not None:
        plan.max_emails = request.max_emails
    if request.is_active is not None:
        plan.is_active = request.is_active
    
    await db.commit()
    await db.refresh(plan)
    
    logger.info(f"Updated plan: {plan.name}")
    return plan


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a plan/product (soft delete by marking inactive)
    Admin only functionality
    """
    # TODO: Add admin check
    
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalars().first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Soft delete - mark as inactive
    plan.is_active = False
    
    await db.commit()
    
    logger.info(f"Deleted plan: {plan.name}")


@router.get("/stats/summary")
async def get_plan_stats(db: AsyncSession = Depends(get_db)):
    """Get plan statistics"""
    # Total active plans
    result = await db.execute(
        select(func.count(Plan.id)).where(Plan.is_active == True)
    )
    total_active = result.scalar() or 0
    
    # Plans by category
    result = await db.execute(select(Plan).where(Plan.is_active == True))
    plans = result.scalars().all()
    
    categories = {}
    for plan in plans:
        category = plan.features.get('category', 'other') if plan.features else 'other'
        categories[category] = categories.get(category, 0) + 1
    
    # Price ranges
    if plans:
        prices = [p.price_monthly for p in plans]
        avg_price = sum(prices) / len(prices)
        min_price = min(prices)
        max_price = max(prices)
    else:
        avg_price = min_price = max_price = 0
    
    return {
        "total_active_plans": total_active,
        "plans_by_category": categories,
        "average_price": round(avg_price, 2),
        "min_price": round(min_price, 2),
        "max_price": round(max_price, 2)
    }
