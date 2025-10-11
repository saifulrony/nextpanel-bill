"""
Analytics and Reporting API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, extract
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import (
    User, License, Payment, Domain, Invoice,
    PaymentStatus, LicenseStatus, InvoiceStatus
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/revenue/summary")
async def get_revenue_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    days: int = 30
):
    """Get revenue summary for user"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total revenue
    result = await db.execute(
        select(func.sum(Payment.amount))
        .where(
            and_(
                Payment.user_id == user_id,
                Payment.status == PaymentStatus.SUCCEEDED
            )
        )
    )
    total_revenue = result.scalar() or 0.0
    
    # Revenue in period
    result = await db.execute(
        select(func.sum(Payment.amount))
        .where(
            and_(
                Payment.user_id == user_id,
                Payment.status == PaymentStatus.SUCCEEDED,
                Payment.created_at >= start_date
            )
        )
    )
    period_revenue = result.scalar() or 0.0
    
    # Average transaction
    result = await db.execute(
        select(func.avg(Payment.amount))
        .where(
            and_(
                Payment.user_id == user_id,
                Payment.status == PaymentStatus.SUCCEEDED
            )
        )
    )
    avg_transaction = result.scalar() or 0.0
    
    # Payment count
    result = await db.execute(
        select(func.count(Payment.id))
        .where(
            and_(
                Payment.user_id == user_id,
                Payment.status == PaymentStatus.SUCCEEDED
            )
        )
    )
    payment_count = result.scalar() or 0
    
    return {
        "total_revenue": total_revenue,
        "period_revenue": period_revenue,
        "period_days": days,
        "average_transaction": avg_transaction,
        "total_payments": payment_count
    }


@router.get("/revenue/monthly")
async def get_monthly_revenue(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    months: int = 12
):
    """Get monthly revenue breakdown"""
    # TODO: Implement proper monthly aggregation
    # For now, return summary
    
    result = await db.execute(
        select(
            func.date_trunc('month', Payment.created_at).label('month'),
            func.sum(Payment.amount).label('revenue'),
            func.count(Payment.id).label('count')
        )
        .where(
            and_(
                Payment.user_id == user_id,
                Payment.status == PaymentStatus.SUCCEEDED
            )
        )
        .group_by('month')
        .order_by('month')
        .limit(months)
    )
    
    monthly_data = []
    for row in result:
        monthly_data.append({
            "month": row.month.strftime('%Y-%m') if row.month else None,
            "revenue": float(row.revenue or 0),
            "payment_count": row.count or 0
        })
    
    return {
        "data": monthly_data,
        "note": "Monthly revenue breakdown"
    }


@router.get("/licenses/stats")
async def get_license_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get license statistics"""
    # Total licenses
    result = await db.execute(
        select(func.count(License.id))
        .where(License.user_id == user_id)
    )
    total_licenses = result.scalar() or 0
    
    # Active licenses
    result = await db.execute(
        select(func.count(License.id))
        .where(
            and_(
                License.user_id == user_id,
                License.status == LicenseStatus.ACTIVE
            )
        )
    )
    active_licenses = result.scalar() or 0
    
    # Licenses by status
    result = await db.execute(
        select(License.status, func.count(License.id))
        .where(License.user_id == user_id)
        .group_by(License.status)
    )
    
    by_status = {}
    for row in result:
        by_status[row[0].value] = row[1]
    
    # Total resource usage
    result = await db.execute(
        select(
            func.sum(License.current_accounts).label('accounts'),
            func.sum(License.current_domains).label('domains'),
            func.sum(License.current_databases).label('databases'),
            func.sum(License.current_emails).label('emails')
        )
        .where(License.user_id == user_id)
    )
    
    row = result.first()
    total_usage = {
        "accounts": row.accounts or 0,
        "domains": row.domains or 0,
        "databases": row.databases or 0,
        "emails": row.emails or 0
    }
    
    return {
        "total_licenses": total_licenses,
        "active_licenses": active_licenses,
        "by_status": by_status,
        "total_usage": total_usage
    }


@router.get("/domains/stats")
async def get_domain_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get domain statistics"""
    # Total domains
    result = await db.execute(
        select(func.count(Domain.id))
        .where(Domain.user_id == user_id)
    )
    total_domains = result.scalar() or 0
    
    # Domains by status
    result = await db.execute(
        select(Domain.status, func.count(Domain.id))
        .where(Domain.user_id == user_id)
        .group_by(Domain.status)
    )
    
    by_status = {}
    for row in result:
        by_status[row[0].value] = row[1]
    
    # Domains registered this month
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    result = await db.execute(
        select(func.count(Domain.id))
        .where(
            and_(
                Domain.user_id == user_id,
                Domain.created_at >= thirty_days_ago
            )
        )
    )
    recent_registrations = result.scalar() or 0
    
    # Expiring soon (next 30 days)
    thirty_days_future = datetime.utcnow() + timedelta(days=30)
    result = await db.execute(
        select(func.count(Domain.id))
        .where(
            and_(
                Domain.user_id == user_id,
                Domain.expiry_date <= thirty_days_future,
                Domain.expiry_date >= datetime.utcnow()
            )
        )
    )
    expiring_soon = result.scalar() or 0
    
    return {
        "total_domains": total_domains,
        "by_status": by_status,
        "registered_this_month": recent_registrations,
        "expiring_in_30_days": expiring_soon
    }


@router.get("/invoices/stats")
async def get_invoice_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get invoice statistics"""
    # Total invoices
    result = await db.execute(
        select(func.count(Invoice.id))
        .where(Invoice.user_id == user_id)
    )
    total_invoices = result.scalar() or 0
    
    # Invoices by status
    result = await db.execute(
        select(Invoice.status, func.count(Invoice.id))
        .where(Invoice.user_id == user_id)
        .group_by(Invoice.status)
    )
    
    by_status = {}
    for row in result:
        by_status[row[0].value] = row[1]
    
    # Total amount invoiced
    result = await db.execute(
        select(func.sum(Invoice.total))
        .where(Invoice.user_id == user_id)
    )
    total_invoiced = result.scalar() or 0.0
    
    # Paid amount
    result = await db.execute(
        select(func.sum(Invoice.total))
        .where(
            and_(
                Invoice.user_id == user_id,
                Invoice.status == InvoiceStatus.PAID
            )
        )
    )
    total_paid = result.scalar() or 0.0
    
    # Outstanding amount
    result = await db.execute(
        select(func.sum(Invoice.total))
        .where(
            and_(
                Invoice.user_id == user_id,
                Invoice.status == InvoiceStatus.OPEN
            )
        )
    )
    total_outstanding = result.scalar() or 0.0
    
    # Overdue invoices
    result = await db.execute(
        select(func.count(Invoice.id))
        .where(
            and_(
                Invoice.user_id == user_id,
                Invoice.status == InvoiceStatus.OPEN,
                Invoice.due_date < datetime.utcnow()
            )
        )
    )
    overdue_count = result.scalar() or 0
    
    return {
        "total_invoices": total_invoices,
        "by_status": by_status,
        "total_invoiced": total_invoiced,
        "total_paid": total_paid,
        "total_outstanding": total_outstanding,
        "overdue_invoices": overdue_count
    }


@router.get("/dashboard")
async def get_dashboard_data(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive dashboard data"""
    # Get all stats in parallel
    
    # Active licenses
    result = await db.execute(
        select(func.count(License.id))
        .where(
            and_(
                License.user_id == user_id,
                License.status == LicenseStatus.ACTIVE
            )
        )
    )
    active_licenses = result.scalar() or 0
    
    # Active domains
    result = await db.execute(
        select(func.count(Domain.id))
        .where(Domain.user_id == user_id)
    )
    total_domains = result.scalar() or 0
    
    # Total spent
    result = await db.execute(
        select(func.sum(Payment.amount))
        .where(
            and_(
                Payment.user_id == user_id,
                Payment.status == PaymentStatus.SUCCEEDED
            )
        )
    )
    total_spent = result.scalar() or 0.0
    
    # Outstanding invoices
    result = await db.execute(
        select(func.count(Invoice.id), func.sum(Invoice.total))
        .where(
            and_(
                Invoice.user_id == user_id,
                Invoice.status == InvoiceStatus.OPEN
            )
        )
    )
    row = result.first()
    outstanding_invoices = row[0] or 0
    outstanding_amount = row[1] or 0.0
    
    # Recent activity (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    result = await db.execute(
        select(func.count(Payment.id))
        .where(
            and_(
                Payment.user_id == user_id,
                Payment.created_at >= seven_days_ago
            )
        )
    )
    recent_payments = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Domain.id))
        .where(
            and_(
                Domain.user_id == user_id,
                Domain.created_at >= seven_days_ago
            )
        )
    )
    recent_domains = result.scalar() or 0
    
    return {
        "overview": {
            "active_licenses": active_licenses,
            "total_domains": total_domains,
            "total_spent": total_spent,
            "outstanding_invoices": outstanding_invoices,
            "outstanding_amount": outstanding_amount
        },
        "recent_activity": {
            "period": "Last 7 days",
            "payments": recent_payments,
            "domains_registered": recent_domains
        }
    }


@router.get("/growth-metrics")
async def get_growth_metrics(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get growth metrics over time"""
    # TODO: Implement detailed growth tracking
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    sixty_days_ago = datetime.utcnow() - timedelta(days=60)
    
    # Current period licenses
    result = await db.execute(
        select(func.count(License.id))
        .where(
            and_(
                License.user_id == user_id,
                License.created_at >= thirty_days_ago
            )
        )
    )
    current_licenses = result.scalar() or 0
    
    # Previous period licenses
    result = await db.execute(
        select(func.count(License.id))
        .where(
            and_(
                License.user_id == user_id,
                License.created_at >= sixty_days_ago,
                License.created_at < thirty_days_ago
            )
        )
    )
    previous_licenses = result.scalar() or 0
    
    # Calculate growth
    license_growth = 0.0
    if previous_licenses > 0:
        license_growth = ((current_licenses - previous_licenses) / previous_licenses) * 100
    
    return {
        "period": "Last 30 days vs Previous 30 days",
        "licenses": {
            "current": current_licenses,
            "previous": previous_licenses,
            "growth_percent": license_growth
        },
        "note": "Additional growth metrics to be implemented"
    }

