"""
Dashboard API endpoint - Comprehensive stats  
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import (
    User, License, Plan, Payment, Domain, Invoice, Subscription, Order,
    LicenseStatus, PaymentStatus, InvoiceStatus, SubscriptionStatus, OrderStatus
)
from pydantic import BaseModel

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardStatsResponse(BaseModel):
    # Customer Stats
    total_customers: int
    active_customers: int
    new_customers_this_month: int
    new_customers_this_week: int
    
    # Product Stats
    total_products: int
    active_products: int
    
    # License Stats
    total_licenses: int
    active_licenses: int
    suspended_licenses: int
    expired_licenses: int
    
    # Subscription Stats
    total_subscriptions: int
    active_subscriptions: int
    cancelled_subscriptions: int
    
    # Order/Payment Stats
    total_orders: int
    pending_orders: int
    completed_orders: int
    
    # Revenue Stats
    total_revenue: float
    monthly_revenue: float
    weekly_revenue: float
    
    # Invoice Stats
    total_invoices: int
    paid_invoices: int
    unpaid_invoices: int
    overdue_invoices: int
    
    # Domain Stats
    total_domains: int
    active_domains: int
    
    # Recent activity
    recent_signups: int  # Last 24 hours
    recent_payments: int  # Last 24 hours
    recent_orders: int  # Last 24 hours


class TopProductResponse(BaseModel):
    product_id: str
    product_name: str
    total_sales: int
    total_revenue: float
    active_licenses: int
    percentage: float


class ProductSalesChartData(BaseModel):
    product_name: str
    sales: int
    revenue: float
    color: str


class ProductAnalyticsResponse(BaseModel):
    top_products: List[TopProductResponse]
    product_chart_data: List[ProductSalesChartData]
    product_pie_data: List[Dict[str, Any]]
    time_period: str
    start_date: datetime
    end_date: datetime


class TopCustomerResponse(BaseModel):
    customer_id: str
    customer_name: str
    customer_email: str
    total_orders: int
    total_spent: float
    active_licenses: int
    percentage: float


class CustomerAnalyticsResponse(BaseModel):
    top_customers: List[TopCustomerResponse]
    customer_chart_data: List[Dict[str, Any]]
    time_period: str
    start_date: datetime
    end_date: datetime


async def verify_user_or_admin(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify user is authenticated and check if they're admin.
    Returns (user_id, is_admin)
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user_id, user.is_admin


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    period: str = Query("week", regex="^(today|yesterday|week|month|year|custom)$"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user_info: tuple = Depends(verify_user_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive dashboard statistics - accessible to all authenticated users"""
    
    user_id, is_admin = user_info
    
    # Calculate date ranges based on selected period
    now = datetime.utcnow()
    
    # Determine the filter period for the main stats
    if period == "today":
        period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        period_end = now
    elif period == "yesterday":
        yesterday = now - timedelta(days=1)
        period_start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        period_end = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif period == "week":
        period_start = now - timedelta(days=7)
        period_end = now
    elif period == "month":
        period_start = now - timedelta(days=30)
        period_end = now
    elif period == "year":
        period_start = now - timedelta(days=365)
        period_end = now
    elif period == "custom":
        if not start_date or not end_date:
            raise HTTPException(status_code=400, detail="start_date and end_date required for custom period")
        period_start = start_date
        period_end = end_date
    else:
        period_start = now - timedelta(days=7)
        period_end = now
    
    # Also keep these for specific calculations
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    day_ago = now - timedelta(days=1)
    
    # Customer Stats (customers with activity in the period)
    # Count unique customers who placed orders during the period
    result = await db.execute(
        select(func.count(func.distinct(Payment.user_id))).where(
            Payment.created_at.between(period_start, period_end)
        )
    )
    total_customers = result.scalar() or 0
    
    # Count unique active customers who placed orders during the period
    result = await db.execute(
        select(func.count(func.distinct(Payment.user_id)))
        .select_from(Payment)
        .join(User, Payment.user_id == User.id)
        .where(
            and_(
                User.is_admin == False,
                User.is_active == True,
                Payment.created_at.between(period_start, period_end)
            )
        )
    )
    active_customers = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(User.id)).where(
            and_(User.is_admin == False, User.created_at >= first_day_of_month)
        )
    )
    new_customers_this_month = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(User.id)).where(
            and_(User.is_admin == False, User.created_at >= week_ago)
        )
    )
    new_customers_this_week = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(User.id)).where(
            and_(User.is_admin == False, User.created_at >= day_ago)
        )
    )
    recent_signups = result.scalar() or 0
    
    # Product Stats
    result = await db.execute(select(func.count(Plan.id)))
    total_products = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Plan.id)).where(Plan.is_active == True)
    )
    active_products = result.scalar() or 0
    
    # License Stats (filtered by period)
    result = await db.execute(
        select(func.count(License.id)).where(
            License.created_at.between(period_start, period_end)
        )
    )
    total_licenses = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(License.id)).where(
            and_(
                License.status == LicenseStatus.ACTIVE,
                License.created_at.between(period_start, period_end)
            )
        )
    )
    active_licenses = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(License.id)).where(
            and_(
                License.status == LicenseStatus.SUSPENDED,
                License.created_at.between(period_start, period_end)
            )
        )
    )
    suspended_licenses = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(License.id)).where(
            and_(
                License.status == LicenseStatus.EXPIRED,
                License.created_at.between(period_start, period_end)
            )
        )
    )
    expired_licenses = result.scalar() or 0
    
    # Subscription Stats (filtered by period)
    result = await db.execute(
        select(func.count(Subscription.id)).where(
            Subscription.created_at.between(period_start, period_end)
        )
    )
    total_subscriptions = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Subscription.id)).where(
            and_(
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.created_at.between(period_start, period_end)
            )
        )
    )
    active_subscriptions = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Subscription.id)).where(
            and_(
                Subscription.status == SubscriptionStatus.CANCELLED,
                Subscription.created_at.between(period_start, period_end)
            )
        )
    )
    cancelled_subscriptions = result.scalar() or 0
    
    # Order Stats (from Order table, filtered by period)
    result = await db.execute(
        select(func.count(Order.id)).where(
            Order.created_at.between(period_start, period_end)
        )
    )
    total_orders = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Order.id)).where(
            and_(
                Order.status == OrderStatus.PENDING,
                Order.created_at.between(period_start, period_end)
            )
        )
    )
    pending_orders = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Order.id)).where(
            and_(
                Order.status == OrderStatus.COMPLETED,
                Order.created_at.between(period_start, period_end)
            )
        )
    )
    completed_orders = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Order.id)).where(
            and_(
                Order.created_at >= day_ago,
                Order.created_at.between(period_start, period_end)
            )
        )
    )
    recent_orders = result.scalar() or 0
    
    # Revenue Stats (from Order table, filtered by period)
    result = await db.execute(
        select(func.sum(Order.total)).where(
            and_(
                Order.status == OrderStatus.COMPLETED,
                Order.created_at.between(period_start, period_end)
            )
        )
    )
    total_revenue = result.scalar() or 0.0
    
    # For monthly and weekly revenue, we'll use the selected period's total
    # These fields now represent revenue within the selected period
    result = await db.execute(
        select(func.sum(Order.total)).where(
            and_(
                Order.status == OrderStatus.COMPLETED,
                Order.created_at.between(period_start, period_end)
            )
        )
    )
    monthly_revenue = result.scalar() or 0.0
    
    result = await db.execute(
        select(func.sum(Order.total)).where(
            and_(
                Order.status == OrderStatus.COMPLETED,
                Order.created_at.between(period_start, period_end)
            )
        )
    )
    weekly_revenue = result.scalar() or 0.0
    
    result = await db.execute(
        select(func.count(Payment.id)).where(
            and_(
                Payment.status == PaymentStatus.SUCCEEDED,
                Payment.created_at >= day_ago,
                Payment.created_at.between(period_start, period_end)
            )
        )
    )
    recent_payments = result.scalar() or 0
    
    # Invoice Stats (filtered by period)
    result = await db.execute(
        select(func.count(Invoice.id)).where(
            Invoice.created_at.between(period_start, period_end)
        )
    )
    total_invoices = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Invoice.id)).where(
            and_(
                Invoice.status == InvoiceStatus.PAID,
                Invoice.created_at.between(period_start, period_end)
            )
        )
    )
    paid_invoices = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Invoice.id)).where(
            and_(
                Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.DRAFT]),
                Invoice.created_at.between(period_start, period_end)
            )
        )
    )
    unpaid_invoices = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Invoice.id)).where(
            and_(
                Invoice.status == InvoiceStatus.OVERDUE,
                Invoice.created_at.between(period_start, period_end)
            )
        )
    )
    overdue_invoices = result.scalar() or 0
    
    # Domain Stats (filtered by period)
    result = await db.execute(
        select(func.count(Domain.id)).where(
            Domain.created_at.between(period_start, period_end)
        )
    )
    total_domains = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Domain.id)).where(
            and_(
                Domain.status == "active",
                Domain.created_at.between(period_start, period_end)
            )
        )
    )
    active_domains = result.scalar() or 0
    
    return DashboardStatsResponse(
        total_customers=total_customers,
        active_customers=active_customers,
        new_customers_this_month=new_customers_this_month,
        new_customers_this_week=new_customers_this_week,
        total_products=total_products,
        active_products=active_products,
        total_licenses=total_licenses,
        active_licenses=active_licenses,
        suspended_licenses=suspended_licenses,
        expired_licenses=expired_licenses,
        total_subscriptions=total_subscriptions,
        active_subscriptions=active_subscriptions,
        cancelled_subscriptions=cancelled_subscriptions,
        total_orders=total_orders,
        pending_orders=pending_orders,
        completed_orders=completed_orders,
        total_revenue=total_revenue,
        monthly_revenue=monthly_revenue,
        weekly_revenue=weekly_revenue,
        total_invoices=total_invoices,
        paid_invoices=paid_invoices,
        unpaid_invoices=unpaid_invoices,
        overdue_invoices=overdue_invoices,
        total_domains=total_domains,
        active_domains=active_domains,
        recent_signups=recent_signups,
        recent_payments=recent_payments,
        recent_orders=recent_orders
    )


@router.get("/products/analytics", response_model=ProductAnalyticsResponse)
async def get_product_analytics(
    period: str = Query("week", regex="^(today|yesterday|week|month|year|custom)$"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user_info: tuple = Depends(verify_user_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get product sales analytics with time filtering"""
    
    user_id, is_admin = user_info
    
    # Calculate date range based on period
    now = datetime.utcnow()
    
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "yesterday":
        yesterday = now - timedelta(days=1)
        start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        end = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif period == "week":
        start = now - timedelta(days=7)
        end = now
    elif period == "month":
        start = now - timedelta(days=30)
        end = now
    elif period == "year":
        start = now - timedelta(days=365)
        end = now
    elif period == "custom":
        if not start_date or not end_date:
            raise HTTPException(status_code=400, detail="start_date and end_date required for custom period")
        start = start_date
        end = end_date
    else:
        start = now - timedelta(days=7)
        end = now
    
    # Get top products by sales (licenses created)
    # Group licenses by plan and count
    result = await db.execute(
        select(
            Plan.id,
            Plan.name,
            func.count(License.id).label('total_sales'),
            func.sum(Plan.price_monthly).label('total_revenue')
        )
        .join(License, License.plan_id == Plan.id)
        .where(License.created_at.between(start, end))
        .group_by(Plan.id, Plan.name)
        .order_by(desc('total_sales'))
        .limit(10)
    )
    product_sales = result.all()
    
    # Calculate total sales for percentage
    total_sales = sum(row[2] for row in product_sales)
    
    # Get active licenses count per product
    top_products = []
    product_chart_data = []
    product_pie_data = []
    
    colors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
        '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4'
    ]
    
    for idx, row in enumerate(product_sales):
        product_id, product_name, sales, revenue = row
        
        # Get active licenses for this product
        result = await db.execute(
            select(func.count(License.id))
            .where(
                and_(
                    License.plan_id == product_id,
                    License.status == LicenseStatus.ACTIVE
                )
            )
        )
        active_licenses = result.scalar() or 0
        
        percentage = (sales / total_sales * 100) if total_sales > 0 else 0
        
        top_products.append(TopProductResponse(
            product_id=product_id,
            product_name=product_name,
            total_sales=sales,
            total_revenue=revenue or 0.0,
            active_licenses=active_licenses,
            percentage=percentage
        ))
        
        # Chart data
        product_chart_data.append(ProductSalesChartData(
            product_name=product_name,
            sales=sales,
            revenue=revenue or 0.0,
            color=colors[idx % len(colors)]
        ))
        
        # Pie chart data
        product_pie_data.append({
            'name': product_name,
            'value': sales,
            'color': colors[idx % len(colors)],
            'percentage': percentage
        })
    
    return ProductAnalyticsResponse(
        top_products=top_products,
        product_chart_data=product_chart_data,
        product_pie_data=product_pie_data,
        time_period=period,
        start_date=start,
        end_date=end
    )


@router.get("/customers/analytics", response_model=CustomerAnalyticsResponse)
async def get_customer_analytics(
    period: str = Query("week", regex="^(today|yesterday|week|month|year|custom)$"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    user_info: tuple = Depends(verify_user_or_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get top customers by orders with time filtering"""
    
    user_id, is_admin = user_info
    
    # Calculate date range based on period
    now = datetime.utcnow()
    
    if period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "yesterday":
        yesterday = now - timedelta(days=1)
        start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        end = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif period == "week":
        start = now - timedelta(days=7)
        end = now
    elif period == "month":
        start = now - timedelta(days=30)
        end = now
    elif period == "year":
        start = now - timedelta(days=365)
        end = now
    elif period == "custom":
        if not start_date or not end_date:
            raise HTTPException(status_code=400, detail="start_date and end_date required for custom period")
        start = start_date
        end = end_date
    else:
        start = now - timedelta(days=7)
        end = now
    
    # Get top customers by number of payments/orders
    result = await db.execute(
        select(
            User.id,
            User.full_name,
            User.email,
            func.count(Payment.id).label('total_orders'),
            func.sum(Payment.amount).label('total_spent')
        )
        .join(Payment, Payment.user_id == User.id)
        .where(
            and_(
                Payment.created_at.between(start, end),
                Payment.status == PaymentStatus.SUCCEEDED
            )
        )
        .group_by(User.id, User.full_name, User.email)
        .order_by(desc('total_orders'))
        .limit(10)
    )
    customer_orders = result.all()
    
    # Calculate total orders for percentage
    total_orders = sum(row[3] for row in customer_orders)
    
    # Get top customers data
    top_customers = []
    customer_chart_data = []
    
    colors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
        '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#06b6d4'
    ]
    
    for idx, row in enumerate(customer_orders):
        customer_id, customer_name, customer_email, orders, spent = row
        
        # Get active licenses for this customer
        result = await db.execute(
            select(func.count(License.id))
            .where(
                and_(
                    License.user_id == customer_id,
                    License.status == LicenseStatus.ACTIVE
                )
            )
        )
        active_licenses = result.scalar() or 0
        
        percentage = (orders / total_orders * 100) if total_orders > 0 else 0
        
        top_customers.append(TopCustomerResponse(
            customer_id=customer_id,
            customer_name=customer_name,
            customer_email=customer_email,
            total_orders=orders,
            total_spent=spent or 0.0,
            active_licenses=active_licenses,
            percentage=percentage
        ))
        
        # Chart data for bar chart
        customer_chart_data.append({
            'name': customer_name[:20] + '...' if len(customer_name) > 20 else customer_name,
            'orders': orders,
            'revenue': spent or 0.0,
            'color': colors[idx % len(colors)]
        })
    
    return CustomerAnalyticsResponse(
        top_customers=top_customers,
        customer_chart_data=customer_chart_data,
        time_period=period,
        start_date=start,
        end_date=end
    )
