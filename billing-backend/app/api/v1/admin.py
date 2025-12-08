"""
Admin Panel API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, or_
from typing import List
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user_id, hash_password
from app.models import (
    User, License, Plan, Payment, Domain, 
    Subscription, Invoice, PaymentStatus,
    LicenseStatus, InvoiceStatus
)
from app.schemas import (
    UserResponse,
    PlanResponse,
    PlanCreateRequest,
    PlanUpdateRequest,
    LicenseResponse,
    AdminStatsResponse,
    AdminUserCreateRequest,
    AdminUserUpdateRequest
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


async def verify_admin(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    """Verify user has admin privileges"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return user_id


# User Management
@router.get("/users", response_model=List[UserResponse])
async def list_users(
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
    search: str = None
):
    """List all users (admin only)"""
    query = select(User)
    
    if search:
        query = query.where(
            or_(
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%"),
                User.company_name.ilike(f"%{search}%")
            )
        )
    
    query = query.order_by(User.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_details(
    user_id: str,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get user details (admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    request: AdminUserUpdateRequest,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update user (admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if request.is_active is not None:
        user.is_active = request.is_active
    
    if request.is_admin is not None:
        user.is_admin = request.is_admin
    
    if request.full_name is not None:
        user.full_name = request.full_name
    
    if request.company_name is not None:
        user.company_name = request.company_name
    
    if request.password is not None:
        user.password_hash = hash_password(request.password)
    
    await db.commit()
    await db.refresh(user)
    
    return user


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    request: AdminUserCreateRequest,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new user (admin only)"""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == request.email))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    new_user = User(
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        company_name=request.company_name,
        is_active=request.is_active if request.is_active is not None else True,
        is_admin=request.is_admin if request.is_admin is not None else False
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete/deactivate user (admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Don't allow deleting admin users
    if user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete admin users"
        )
    
    # Soft delete - just deactivate
    user.is_active = False
    
    await db.commit()
    
    return None


# Plan Management
@router.post("/plans", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
async def create_plan(
    request: PlanCreateRequest,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new plan (admin only)"""
    plan = Plan(
        name=request.name,
        description=request.description,
        price_monthly=request.price_monthly,
        price_yearly=request.price_yearly,
        features=request.features,
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
    
    logger.info(f"Plan created: {plan.name} (ID: {plan.id})")
    
    return plan


@router.put("/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: str,
    request: PlanUpdateRequest,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update a plan (admin only)"""
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalars().first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
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
    
    logger.info(f"Plan updated: {plan.name} (ID: {plan.id})")
    
    return plan


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plan(
    plan_id: str,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate a plan (admin only)"""
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalars().first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Check if any active licenses use this plan
    result = await db.execute(
        select(func.count(License.id))
        .where(
            and_(
                License.plan_id == plan_id,
                License.status == LicenseStatus.ACTIVE
            )
        )
    )
    active_licenses = result.scalar() or 0
    
    if active_licenses > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete plan with {active_licenses} active licenses"
        )
    
    # Soft delete
    plan.is_active = False
    
    await db.commit()
    
    return None


# License Management
@router.get("/licenses", response_model=List[LicenseResponse])
async def list_all_licenses(
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
    status: str = None,
    limit: int = 50,
    offset: int = 0
):
    """List all licenses (admin only)"""
    query = select(License)
    
    if status:
        query = query.where(License.status == status)
    
    query = query.order_by(License.created_at.desc()).limit(limit).offset(offset)
    
    result = await db.execute(query)
    licenses = result.scalars().all()
    
    return licenses


@router.put("/licenses/{license_id}/status")
async def update_license_status(
    license_id: str,
    new_status: str,
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update license status (admin only)"""
    result = await db.execute(select(License).where(License.id == license_id))
    license = result.scalars().first()
    
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    
    # Validate status
    try:
        status_enum = LicenseStatus(new_status)
        license.status = status_enum
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status: {new_status}"
        )
    
    await db.commit()
    await db.refresh(license)
    
    logger.info(f"License {license.license_key} status updated to {new_status}")
    
    return license


# System Statistics
@router.get("/stats", response_model=AdminStatsResponse)
async def get_system_stats(
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get system statistics (admin only)"""
    # Total users
    result = await db.execute(select(func.count(User.id)))
    total_users = result.scalar() or 0
    
    # Active users
    result = await db.execute(
        select(func.count(User.id)).where(User.is_active == True)
    )
    active_users = result.scalar() or 0
    
    # Total licenses
    result = await db.execute(select(func.count(License.id)))
    total_licenses = result.scalar() or 0
    
    # Active licenses
    result = await db.execute(
        select(func.count(License.id)).where(License.status == LicenseStatus.ACTIVE)
    )
    active_licenses = result.scalar() or 0
    
    # Total revenue
    result = await db.execute(
        select(func.sum(Payment.amount))
        .where(Payment.status == PaymentStatus.SUCCEEDED)
    )
    total_revenue = result.scalar() or 0.0
    
    # Monthly revenue (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    result = await db.execute(
        select(func.sum(Payment.amount))
        .where(
            and_(
                Payment.status == PaymentStatus.SUCCEEDED,
                Payment.created_at >= thirty_days_ago
            )
        )
    )
    monthly_revenue = result.scalar() or 0.0
    
    # Total domains
    result = await db.execute(select(func.count(Domain.id)))
    total_domains = result.scalar() or 0
    
    # Total invoices
    result = await db.execute(select(func.count(Invoice.id)))
    total_invoices = result.scalar() or 0
    
    # Outstanding invoices
    result = await db.execute(
        select(func.count(Invoice.id)).where(Invoice.status == InvoiceStatus.OPEN)
    )
    outstanding_invoices = result.scalar() or 0
    
    # New users this month
    result = await db.execute(
        select(func.count(User.id))
        .where(User.created_at >= thirty_days_ago)
    )
    new_users_this_month = result.scalar() or 0
    
    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        total_licenses=total_licenses,
        active_licenses=active_licenses,
        total_revenue=total_revenue,
        monthly_revenue=monthly_revenue,
        total_domains=total_domains,
        total_invoices=total_invoices,
        outstanding_invoices=outstanding_invoices,
        new_users_this_month=new_users_this_month
    )


@router.get("/stats/revenue-chart")
async def get_revenue_chart(
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db),
    days: int = 30
):
    """Get daily revenue data for chart (admin only)"""
    # TODO: Implement actual daily revenue aggregation
    # For now, return mock data
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        select(func.sum(Payment.amount))
        .where(
            and_(
                Payment.status == PaymentStatus.SUCCEEDED,
                Payment.created_at >= start_date
            )
        )
    )
    total = result.scalar() or 0.0
    
    return {
        "period": f"Last {days} days",
        "total_revenue": total,
        "note": "Daily breakdown to be implemented"
    }

