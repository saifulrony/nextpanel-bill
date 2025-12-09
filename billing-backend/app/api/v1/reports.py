"""
Reports and Export API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, text
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import verify_admin
from app.models import Order, Invoice, Payment, Subscription, User
import csv
import io
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/orders/export")
async def export_orders_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Export orders to CSV (admin only)"""
    query = select(Order)
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.where(Order.created_at >= start)
        except:
            pass
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.where(Order.created_at <= end)
        except:
            pass
    
    if status:
        query = query.where(Order.status == status)
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        'Order ID', 'Invoice Number', 'Customer Email', 'Status', 'Subtotal', 
        'Tax', 'Total', 'Currency', 'Created At', 'Due Date'
    ])
    
    # Rows
    for order in orders:
        user_result = await db.execute(select(User).where(User.id == order.customer_id))
        user = user_result.scalars().first()
        
        writer.writerow([
            order.id,
            order.invoice_number or order.order_number or '',
            user.email if user else '',
            order.status.value if hasattr(order.status, 'value') else str(order.status),
            order.subtotal,
            order.tax,
            order.total,
            order.currency or 'USD',
            order.created_at.isoformat() if order.created_at else '',
            order.due_date.isoformat() if order.due_date else ''
        ])
    
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=orders_export.csv"}
    )


@router.get("/invoices/export")
async def export_invoices_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Export invoices to CSV (admin only)"""
    query = select(Invoice)
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.where(Invoice.invoice_date >= start)
        except:
            pass
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.where(Invoice.invoice_date <= end)
        except:
            pass
    
    if status:
        query = query.where(Invoice.status == status)
    
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        'Invoice Number', 'Customer Email', 'Status', 'Subtotal', 'Tax', 
        'Total', 'Amount Paid', 'Amount Due', 'Currency', 'Invoice Date', 'Due Date'
    ])
    
    # Rows
    for invoice in invoices:
        user_result = await db.execute(select(User).where(User.id == invoice.user_id))
        user = user_result.scalars().first()
        
        writer.writerow([
            invoice.invoice_number,
            user.email if user else '',
            invoice.status.value if hasattr(invoice.status, 'value') else str(invoice.status),
            invoice.subtotal,
            invoice.tax,
            invoice.total,
            invoice.amount_paid,
            invoice.amount_due,
            invoice.currency,
            invoice.invoice_date.isoformat() if invoice.invoice_date else '',
            invoice.due_date.isoformat() if invoice.due_date else ''
        ])
    
    output.seek(0)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=invoices_export.csv"}
    )


@router.get("/revenue-summary")
async def get_revenue_summary(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get revenue summary report (admin only)"""
    # Parse dates
    if start_date:
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except:
            start = datetime.utcnow() - timedelta(days=30)
    else:
        start = datetime.utcnow() - timedelta(days=30)
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except:
            end = datetime.utcnow()
    else:
        end = datetime.utcnow()
    
    # Get paid invoices in period
    result = await db.execute(
        select(
            func.sum(Invoice.total).label('total_revenue'),
            func.sum(Invoice.tax).label('total_tax'),
            func.count(Invoice.id).label('invoice_count')
        )
        .where(
            and_(
                Invoice.status == 'paid',
                Invoice.paid_at >= start,
                Invoice.paid_at <= end
            )
        )
    )
    stats = result.first()
    
    # Get orders in period
    order_result = await db.execute(
        select(
            func.sum(Order.total).label('total_orders'),
            func.count(Order.id).label('order_count')
        )
        .where(
            and_(
                Order.status == 'completed',
                Order.created_at >= start,
                Order.created_at <= end
            )
        )
    )
    order_stats = order_result.first()
    
    return {
        "period": {
            "start_date": start.isoformat(),
            "end_date": end.isoformat()
        },
        "revenue": {
            "total": float(stats.total_revenue or 0),
            "tax": float(stats.total_tax or 0),
            "net": float((stats.total_revenue or 0) - (stats.total_tax or 0)),
            "invoice_count": stats.invoice_count or 0
        },
        "orders": {
            "total": float(order_stats.total_orders or 0),
            "count": order_stats.order_count or 0
        }
    }

