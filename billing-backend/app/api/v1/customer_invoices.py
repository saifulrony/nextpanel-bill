"""
Customer Invoice Management API
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from typing import List, Optional
from datetime import datetime, timedelta

from ...core.database import get_db
from ...core.security import get_current_user_id
from ...models import Invoice, Payment, User, Order
from ...schemas import InvoiceResponse, PaymentResponse

router = APIRouter()

@router.get("/invoices", response_model=List[dict])
async def get_customer_invoices(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    status: Optional[str] = Query(None, description="Filter by invoice status"),
    due_only: Optional[bool] = Query(False, description="Show only due invoices")
):
    """Get all invoices for the current customer"""
    try:
        # Build query
        query = select(Invoice).where(Invoice.user_id == user_id)
        
        # Apply status filter
        if status:
            query = query.where(Invoice.status == status)
        
        # Apply due only filter
        if due_only:
            today = datetime.utcnow().date()
            query = query.where(
                and_(
                    Invoice.due_date <= today,
                    Invoice.status.in_(['pending', 'overdue'])
                )
            )
        
        # Order by due date (most urgent first)
        query = query.order_by(Invoice.due_date.asc())
        
        result = await db.execute(query)
        invoices = result.scalars().all()
        
        # Transform to response format
        invoice_list = []
        for invoice in invoices:
            # Calculate days until due
            days_until_due = None
            if invoice.due_date:
                today = datetime.utcnow().date()
                delta = invoice.due_date - today
                days_until_due = delta.days
            
            # Determine if overdue
            is_overdue = (
                invoice.due_date and 
                invoice.due_date < datetime.utcnow().date() and 
                invoice.status in ['pending', 'overdue']
            )
            
            invoice_data = {
                "id": invoice.id,
                "number": invoice.invoice_number,
                "date": invoice.created_at.isoformat(),
                "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
                "amount": float(invoice.total_amount),
                "status": "overdue" if is_overdue else invoice.status,
                "description": invoice.description or "Service Invoice",
                "days_until_due": days_until_due,
                "is_overdue": is_overdue,
                "items": invoice.items or [],
                "tax_amount": float(invoice.tax_amount) if invoice.tax_amount else 0,
                "discount_amount": float(invoice.discount_amount) if invoice.discount_amount else 0,
                "subtotal": float(invoice.subtotal) if invoice.subtotal else 0,
                "created_at": invoice.created_at.isoformat(),
                "updated_at": invoice.updated_at.isoformat() if invoice.updated_at else None
            }
            
            invoice_list.append(invoice_data)
        
        return invoice_list
        
    except Exception as e:
        print(f"Error fetching customer invoices: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch invoices")

@router.get("/invoices/{invoice_id}", response_model=dict)
async def get_invoice_details(
    invoice_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed information about a specific invoice"""
    try:
        query = select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == user_id
            )
        )
        
        result = await db.execute(query)
        invoice = result.scalar_one_or_none()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Get related payments
        payments_query = select(Payment).where(Payment.invoice_id == invoice_id)
        payments_result = await db.execute(payments_query)
        payments = payments_result.scalars().all()
        
        # Calculate days until due
        days_until_due = None
        if invoice.due_date:
            today = datetime.utcnow().date()
            delta = invoice.due_date - today
            days_until_due = delta.days
        
        # Determine if overdue
        is_overdue = (
            invoice.due_date and 
            invoice.due_date < datetime.utcnow().date() and 
            invoice.status in ['pending', 'overdue']
        )
        
        invoice_data = {
            "id": invoice.id,
            "number": invoice.invoice_number,
            "date": invoice.created_at.isoformat(),
            "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
            "amount": float(invoice.total_amount),
            "status": "overdue" if is_overdue else invoice.status,
            "description": invoice.description or "Service Invoice",
            "days_until_due": days_until_due,
            "is_overdue": is_overdue,
            "items": invoice.items or [],
            "tax_amount": float(invoice.tax_amount) if invoice.tax_amount else 0,
            "discount_amount": float(invoice.discount_amount) if invoice.discount_amount else 0,
            "subtotal": float(invoice.subtotal) if invoice.subtotal else 0,
            "created_at": invoice.created_at.isoformat(),
            "updated_at": invoice.updated_at.isoformat() if invoice.updated_at else None,
            "payments": [
                {
                    "id": payment.id,
                    "amount": float(payment.amount),
                    "status": payment.status,
                    "payment_method": payment.payment_method,
                    "created_at": payment.created_at.isoformat(),
                    "processed_at": payment.processed_at.isoformat() if payment.processed_at else None
                }
                for payment in payments
            ]
        }
        
        return invoice_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching invoice details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch invoice details")

@router.get("/payment-methods", response_model=List[dict])
async def get_customer_payment_methods(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get payment methods for the current customer"""
    try:
        # For now, return mock data since we don't have a payment methods table
        # In a real implementation, this would query a payment_methods table
        payment_methods = [
            {
                "id": "pm_1",
                "type": "card",
                "last4": "4242",
                "brand": "Visa",
                "expiry_month": 12,
                "expiry_year": 2025,
                "is_default": True,
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "id": "pm_2", 
                "type": "card",
                "last4": "5555",
                "brand": "Mastercard",
                "expiry_month": 8,
                "expiry_year": 2026,
                "is_default": False,
                "created_at": "2024-01-15T00:00:00Z"
            }
        ]
        
        return payment_methods
        
    except Exception as e:
        print(f"Error fetching payment methods: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment methods")

@router.get("/billing-summary")
async def get_billing_summary(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get billing summary for the customer"""
    try:
        # Get all invoices for the user
        query = select(Invoice).where(Invoice.user_id == user_id)
        result = await db.execute(query)
        invoices = result.scalars().all()
        
        # Calculate summary statistics
        total_paid = sum(
            float(inv.total_amount) for inv in invoices 
            if inv.status == 'paid'
        )
        
        total_pending = sum(
            float(inv.total_amount) for inv in invoices 
            if inv.status == 'pending'
        )
        
        total_overdue = sum(
            float(inv.total_amount) for inv in invoices 
            if inv.due_date and inv.due_date < datetime.utcnow().date() and inv.status in ['pending', 'overdue']
        )
        
        # Count invoices by status
        paid_count = len([inv for inv in invoices if inv.status == 'paid'])
        pending_count = len([inv for inv in invoices if inv.status == 'pending'])
        overdue_count = len([
            inv for inv in invoices 
            if inv.due_date and inv.due_date < datetime.utcnow().date() and inv.status in ['pending', 'overdue']
        ])
        
        return {
            "total_paid": total_paid,
            "total_pending": total_pending,
            "total_overdue": total_overdue,
            "paid_count": paid_count,
            "pending_count": pending_count,
            "overdue_count": overdue_count,
            "total_invoices": len(invoices)
        }
        
    except Exception as e:
        print(f"Error fetching billing summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch billing summary")

@router.post("/invoices/{invoice_id}/pay")
async def pay_invoice(
    invoice_id: str,
    payment_method_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Process payment for an invoice"""
    try:
        # Get the invoice
        query = select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == user_id
            )
        )
        
        result = await db.execute(query)
        invoice = result.scalar_one_or_none()
        
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        if invoice.status == 'paid':
            raise HTTPException(status_code=400, detail="Invoice is already paid")
        
        # Create payment record
        payment = Payment(
            user_id=user_id,
            invoice_id=invoice_id,
            amount=invoice.total_amount,
            currency="USD",
            status="pending",
            payment_method="card",
            payment_method_id=payment_method_id,
            description=f"Payment for invoice {invoice.invoice_number}"
        )
        
        db.add(payment)
        
        # Update invoice status
        invoice.status = "paid"
        invoice.paid_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(payment)
        
        return {
            "message": "Payment processed successfully",
            "payment_id": payment.id,
            "status": "success"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing payment: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to process payment")
