"""
Comprehensive Invoice Management API endpoints
Supports: manual & automated invoicing, recurring billing, partial payments, bulk operations
"""
from fastapi import APIRouter, Depends, HTTPException, Response, Query
from fastapi import status as http_status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import (
    Invoice, Payment, User, InvoiceStatus, PaymentStatus,
    PartialPayment, InvoiceTemplate, RecurringInterval
)
from app.schemas import (
    InvoiceCreateRequest,
    InvoiceResponse,
    InvoiceUpdateRequest,
    InvoiceItemRequest,
    PartialPaymentRequest,
    PartialPaymentResponse,
    InvoiceTemplateRequest,
    InvoiceTemplateResponse,
    BulkInvoiceRequest
)
from app.services.invoice_service import InvoiceService
from app.api.v1.events import broadcast_event
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.post("/", response_model=InvoiceResponse, status_code=http_status.HTTP_201_CREATED)
async def create_invoice(
    request: InvoiceCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new invoice with support for:
    - Multiple line items
    - Tax calculations
    - Discounts (percentage or fixed amount)
    - Recurring billing setup
    - Optional email sending
    """
    invoice_service = InvoiceService()
    
    # Calculate totals
    totals = await invoice_service.calculate_invoice_totals(
        items=[item.dict() for item in request.items],
        tax_rate=request.tax_rate or 0.0,
        discount_percent=request.discount_percent or 0.0,
        discount_amount=request.discount_amount or 0.0
    )
    
    # Generate invoice number
    invoice_number = await invoice_service.generate_invoice_number(db)
    
    # Create invoice
    invoice = Invoice(
        user_id=user_id,
        payment_id=request.payment_id,
        subscription_id=request.subscription_id,
        license_id=request.license_id,
        invoice_number=invoice_number,
        status=InvoiceStatus.OPEN,
        subtotal=totals['subtotal'],
        discount_amount=totals['discount_amount'],
        discount_percent=totals['discount_percent'],
        tax=totals['tax'],
        tax_rate=totals['tax_rate'],
        total=totals['total'],
        amount_due=totals['amount_due'],
        currency=request.currency or "USD",
        due_date=request.due_date or datetime.utcnow() + timedelta(days=30),
        items=[item.dict() for item in request.items],
        notes=request.notes,
        terms=request.terms,
        payment_instructions=request.payment_instructions,
        customer_po_number=request.customer_po_number,
        billing_address=request.billing_address,
        is_recurring=request.is_recurring or False,
        recurring_interval=RecurringInterval(request.recurring_interval) if request.recurring_interval else None
    )
    
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    
    # Broadcast real-time event to user
    await broadcast_event(user_id, "order_created", {
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "total": float(invoice.total),
        "status": invoice.status.value
    })
    
    # Send email if requested
    if request.send_email:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        if user:
            await invoice_service.send_invoice_email(invoice, user, db)
    
    logger.info(f"Created invoice {invoice.invoice_number} for user {user_id}")
    return invoice


@router.get("/", response_model=List[InvoiceResponse])
async def list_invoices(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    status_filter: Optional[str] = Query(None, alias="status"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    is_recurring: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    List user's invoices with advanced filtering:
    - Filter by status
    - Filter by date range
    - Filter by amount range
    - Filter recurring vs one-time
    - Pagination support
    - If user is admin, returns all invoices
    """
    try:
        logger.info(f"Listing invoices for user {user_id}")
        
        # Get user to check if admin
        try:
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalars().first()
            
            if not user:
                logger.error(f"User {user_id} not found")
                raise HTTPException(status_code=404, detail="User not found")
            
            logger.info(f"User {user_id} is admin: {user.is_admin}")
        except Exception as user_err:
            logger.error(f"Error fetching user: {user_err}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error fetching user: {str(user_err)}")
        
        # Build query - if admin, show all invoices; otherwise, filter by user_id
        try:
            if user.is_admin:
                query = select(Invoice)
                logger.info("Admin user - fetching all invoices")
            else:
                query = select(Invoice).where(Invoice.user_id == user_id)
                logger.info(f"Regular user - fetching invoices for user {user_id}")
        except Exception as query_err:
            logger.error(f"Error building query: {query_err}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error building query: {str(query_err)}")
        
        # Apply filters
        if status_filter:
            # Convert status string to InvoiceStatus enum
            try:
                status_enum = InvoiceStatus(status_filter.lower())
                query = query.where(Invoice.status == status_enum)
            except (ValueError, KeyError):
                # If invalid status, skip the filter (don't raise error)
                logger.warning(f"Invalid status filter: {status_filter}")
                pass
        
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.where(Invoice.created_at >= start_dt)
            except ValueError:
                logger.warning(f"Invalid start_date format: {start_date}")
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.where(Invoice.created_at <= end_dt)
            except ValueError:
                logger.warning(f"Invalid end_date format: {end_date}")
        
        if min_amount is not None:
            query = query.where(Invoice.total >= min_amount)
        
        if max_amount is not None:
            query = query.where(Invoice.total <= max_amount)
        
        if is_recurring is not None:
            query = query.where(Invoice.is_recurring == is_recurring)
        
        query = query.order_by(Invoice.created_at.desc()).limit(limit).offset(offset)
        
        try:
            logger.info("Executing invoice query...")
            result = await db.execute(query)
            invoices = result.scalars().all()
            logger.info(f"Query executed successfully, found {len(invoices)} invoices")
        except Exception as query_exec_err:
            logger.error(f"Error executing query: {query_exec_err}", exc_info=True)
            import traceback
            logger.error(f"Query execution traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "Database query failed",
                    "message": str(query_exec_err),
                    "type": type(query_exec_err).__name__
                }
            )
        
        logger.info(f"Found {len(invoices)} invoices for user {user_id} (admin: {user.is_admin})")
        
        # If no invoices, return empty list
        if not invoices:
            logger.info("No invoices found, returning empty list")
            return []
        
        # Manually serialize invoices to avoid FastAPI serialization issues with enums
        invoice_list = []
        for invoice in invoices:
            try:
                # Convert enum values to strings for JSON serialization
                status_value = invoice.status.value if hasattr(invoice.status, 'value') else str(invoice.status)
                recurring_interval_value = None
                if invoice.recurring_interval:
                    if hasattr(invoice.recurring_interval, 'value'):
                        recurring_interval_value = invoice.recurring_interval.value
                    else:
                        recurring_interval_value = str(invoice.recurring_interval)
                
                invoice_dict = {
                    "id": invoice.id,
                    "invoice_number": invoice.invoice_number,
                    "status": status_value,
                    "subtotal": float(invoice.subtotal) if invoice.subtotal is not None else 0.0,
                    "discount_amount": float(invoice.discount_amount) if invoice.discount_amount is not None else 0.0,
                    "discount_percent": float(invoice.discount_percent) if invoice.discount_percent is not None else 0.0,
                    "tax": float(invoice.tax) if invoice.tax is not None else 0.0,
                    "tax_rate": float(invoice.tax_rate) if invoice.tax_rate is not None else 0.0,
                    "total": float(invoice.total) if invoice.total is not None else 0.0,
                    "amount_paid": float(invoice.amount_paid) if invoice.amount_paid is not None else 0.0,
                    "amount_due": float(invoice.amount_due) if invoice.amount_due is not None else 0.0,
                    "currency": invoice.currency or "USD",
                    "invoice_date": invoice.invoice_date,
                    "due_date": invoice.due_date,
                    "paid_at": invoice.paid_at,
                    "items": invoice.items if invoice.items is not None else [],
                    "notes": invoice.notes,
                    "terms": invoice.terms,
                    "is_recurring": bool(invoice.is_recurring) if invoice.is_recurring is not None else False,
                    "recurring_interval": recurring_interval_value,
                    "sent_to_customer": bool(invoice.sent_to_customer) if invoice.sent_to_customer is not None else False,
                    "reminder_count": int(invoice.reminder_count) if invoice.reminder_count is not None else 0,
                    "created_at": invoice.created_at,
                }
                # Create InvoiceResponse object - FastAPI will handle validation
                try:
                    invoice_response = InvoiceResponse(**invoice_dict)
                    invoice_list.append(invoice_response)
                except Exception as validation_err:
                    logger.error(f"Validation error for invoice {invoice.id}: {validation_err}")
                    logger.error(f"Problematic invoice dict keys: {list(invoice_dict.keys())}")
                    logger.error(f"Problematic invoice dict values: {invoice_dict}")
                    # Skip this invoice if validation fails
                    continue
            except Exception as inv_err:
                logger.error(f"Error serializing invoice {invoice.id}: {inv_err}", exc_info=True)
                continue
        
        return invoice_list
        
    except HTTPException as http_err:
        # Re-raise HTTP exceptions as-is
        logger.error(f"HTTP Exception: {http_err.status_code} - {http_err.detail}")
        raise
    except Exception as e:
        # Log the full error with traceback
        import traceback
        error_traceback = traceback.format_exc()
        logger.error(f"Error listing invoices: {e}", exc_info=True)
        logger.error(f"Full traceback: {error_traceback}")
        
        # Return error as string to avoid serialization issues
        error_message = str(e)
        error_type = type(e).__name__
        
        logger.error(f"Error type: {error_type}, Message: {error_message}")
        
        # Return detailed error in response for debugging
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list invoices: {error_type} - {error_message}"
        )


@router.get("/overdue", response_model=List[InvoiceResponse])
async def list_overdue_invoices(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get all overdue invoices for the current user"""
    now = datetime.utcnow()
    
    result = await db.execute(
        select(Invoice).where(
            and_(
                Invoice.user_id == user_id,
                Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID]),
                Invoice.due_date < now
            )
        ).order_by(Invoice.due_date.asc())
    )
    invoices = result.scalars().all()
    
    return invoices


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed invoice information"""
    result = await db.execute(
        select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == user_id
            )
        )
    )
    invoice = result.scalars().first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return invoice


@router.put("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: str,
    request: InvoiceUpdateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update invoice (only draft and open invoices can be updated)"""
    result = await db.execute(
        select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == user_id
            )
        )
    )
    invoice = result.scalars().first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Only allow updates to draft and open invoices
    if invoice.status not in [InvoiceStatus.DRAFT, InvoiceStatus.OPEN]:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Cannot update paid, void, or partially paid invoices"
        )
    
    # Update fields
    invoice_service = InvoiceService()
    
    if request.items is not None:
        totals = await invoice_service.calculate_invoice_totals(
            items=[item.dict() for item in request.items],
            tax_rate=request.tax_rate if request.tax_rate is not None else invoice.tax_rate,
            discount_percent=request.discount_percent if request.discount_percent is not None else invoice.discount_percent,
            discount_amount=request.discount_amount if request.discount_amount is not None else invoice.discount_amount
        )
        invoice.items = [item.dict() for item in request.items]
        invoice.subtotal = totals['subtotal']
        invoice.discount_amount = totals['discount_amount']
        invoice.discount_percent = totals['discount_percent']
        invoice.tax = totals['tax']
        invoice.tax_rate = totals['tax_rate']
        invoice.total = totals['total']
        invoice.amount_due = totals['amount_due']
    
    if request.due_date is not None:
        invoice.due_date = request.due_date
    
    if request.notes is not None:
        invoice.notes = request.notes
    
    if request.terms is not None:
        invoice.terms = request.terms
    
    if request.payment_instructions is not None:
        invoice.payment_instructions = request.payment_instructions
    
    await db.commit()
    await db.refresh(invoice)
    
    logger.info(f"Updated invoice {invoice.invoice_number}")
    return invoice


@router.delete("/{invoice_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Delete a draft invoice"""
    result = await db.execute(
        select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == user_id
            )
        )
    )
    invoice = result.scalars().first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Only allow deletion of draft invoices
    if invoice.status != InvoiceStatus.DRAFT:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Can only delete draft invoices"
        )
    
    await db.delete(invoice)
    await db.commit()
    
    logger.info(f"Deleted draft invoice {invoice.invoice_number}")


@router.post("/{invoice_id}/pay", response_model=InvoiceResponse)
async def mark_invoice_paid(
    invoice_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Mark invoice as fully paid"""
    result = await db.execute(
        select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == user_id
            )
        )
    )
    invoice = result.scalars().first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    invoice.status = InvoiceStatus.PAID
    invoice.paid_at = datetime.utcnow()
    invoice.amount_paid = invoice.total
    invoice.amount_due = 0.0
    
    await db.commit()
    await db.refresh(invoice)
    
    logger.info(f"Marked invoice {invoice.invoice_number} as paid")
    return invoice


@router.post("/{invoice_id}/partial-payment", response_model=InvoiceResponse)
async def add_partial_payment(
    invoice_id: str,
    request: PartialPaymentRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Record a partial payment for an invoice
    Supports multiple partial payments until fully paid
    """
    result = await db.execute(
        select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == user_id
            )
        )
    )
    invoice = result.scalars().first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Invoice is already fully paid"
        )
    
    if request.amount <= 0:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Payment amount must be greater than 0"
        )
    
    if request.amount > invoice.amount_due:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Payment amount cannot exceed amount due ({invoice.amount_due})"
        )
    
    # Process partial payment
    invoice_service = InvoiceService()
    await invoice_service.process_partial_payment(
        invoice=invoice,
        amount=request.amount,
        payment_method=request.payment_method or "manual",
        notes=request.notes,
        db=db
    )
    
    await db.refresh(invoice)
    
    logger.info(f"Added partial payment of ${request.amount} to invoice {invoice.invoice_number}")
    return invoice


@router.get("/{invoice_id}/partial-payments", response_model=List[PartialPaymentResponse])
async def list_partial_payments(
    invoice_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get all partial payments for an invoice"""
    # Verify invoice belongs to user
    result = await db.execute(
        select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == user_id
            )
        )
    )
    invoice = result.scalars().first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get partial payments
    result = await db.execute(
        select(PartialPayment).where(PartialPayment.invoice_id == invoice_id)
        .order_by(PartialPayment.created_at.desc())
    )
    payments = result.scalars().all()
    
    return payments


@router.post("/{invoice_id}/void", response_model=InvoiceResponse)
async def void_invoice(
    invoice_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Void an invoice (cannot void paid invoices)"""
    result = await db.execute(
        select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == user_id
            )
        )
    )
    invoice = result.scalars().first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Cannot void a paid invoice. Create a credit memo instead."
        )
    
    invoice.status = InvoiceStatus.VOID
    
    await db.commit()
    await db.refresh(invoice)
    
    logger.info(f"Voided invoice {invoice.invoice_number}")
    return invoice


@router.get("/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Download invoice as PDF
    Generates a professional PDF invoice with company branding
    """
    result = await db.execute(
        select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == user_id
            )
        )
    )
    invoice = result.scalars().first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get user info
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    # Generate PDF
    invoice_service = InvoiceService()
    
    # Company info for PDF header
    company_info = {
        'name': 'NextPanel Billing',
        'address': '123 Business Street',
        'city': 'Tech City',
        'state': 'TC',
        'zip': '12345',
        'phone': '+1 (555) 123-4567',
        'email': 'billing@nextpanel.com'
    }
    
    pdf_content = await invoice_service.generate_pdf(invoice, user, company_info)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=invoice-{invoice.invoice_number}.pdf"
        }
    )


@router.post("/{invoice_id}/send", status_code=http_status.HTTP_200_OK)
async def send_invoice_email(
    invoice_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Send invoice via email with PDF attachment"""
    result = await db.execute(
        select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == user_id
            )
        )
    )
    invoice = result.scalars().first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get user info
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    # Send email
    invoice_service = InvoiceService()
    success = await invoice_service.send_invoice_email(invoice, user, db)
    
    if not success:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send invoice email"
        )
    
    logger.info(f"Sent invoice {invoice.invoice_number} via email")
    return {"status": "success", "message": "Invoice sent via email"}


@router.post("/{invoice_id}/send-reminder", status_code=http_status.HTTP_200_OK)
async def send_payment_reminder(
    invoice_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Send payment reminder email for an invoice"""
    result = await db.execute(
        select(Invoice).where(
            and_(
                Invoice.id == invoice_id,
                Invoice.user_id == user_id
            )
        )
    )
    invoice = result.scalars().first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status == InvoiceStatus.PAID:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Cannot send reminder for paid invoice"
        )
    
    # Get user info
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    # Send reminder
    invoice_service = InvoiceService()
    success = await invoice_service.send_payment_reminder(invoice, user, db)
    
    if not success:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send payment reminder"
        )
    
    logger.info(f"Sent payment reminder for invoice {invoice.invoice_number}")
    return {"status": "success", "message": "Payment reminder sent"}


@router.get("/stats/summary")
async def get_invoice_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive invoice statistics"""
    # Total invoiced
    result = await db.execute(
        select(func.sum(Invoice.total))
        .where(Invoice.user_id == user_id)
    )
    total_invoiced = result.scalar() or 0.0
    
    # Total paid
    result = await db.execute(
        select(func.sum(Invoice.amount_paid))
        .where(Invoice.user_id == user_id)
    )
    total_paid = result.scalar() or 0.0
    
    # Outstanding (total amount due)
    result = await db.execute(
        select(func.sum(Invoice.amount_due))
        .where(
            and_(
                Invoice.user_id == user_id,
                Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID])
            )
        )
    )
    total_outstanding = result.scalar() or 0.0
    
    # Overdue amount
    now = datetime.utcnow()
    result = await db.execute(
        select(func.sum(Invoice.amount_due))
        .where(
            and_(
                Invoice.user_id == user_id,
                Invoice.status.in_([InvoiceStatus.OVERDUE, InvoiceStatus.OPEN, InvoiceStatus.PARTIALLY_PAID]),
                Invoice.due_date < now
            )
        )
    )
    overdue_amount = result.scalar() or 0.0
    
    # Count by status
    result = await db.execute(
        select(func.count(Invoice.id))
        .where(
            and_(
                Invoice.user_id == user_id,
                Invoice.status == InvoiceStatus.OPEN
            )
        )
    )
    open_count = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Invoice.id))
        .where(
            and_(
                Invoice.user_id == user_id,
                Invoice.status == InvoiceStatus.PAID
            )
        )
    )
    paid_count = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Invoice.id))
        .where(
            and_(
                Invoice.user_id == user_id,
                Invoice.status == InvoiceStatus.OVERDUE
            )
        )
    )
    overdue_count = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Invoice.id))
        .where(
            and_(
                Invoice.user_id == user_id,
                Invoice.status == InvoiceStatus.PARTIALLY_PAID
            )
        )
    )
    partially_paid_count = result.scalar() or 0
    
    return {
        "total_invoiced": round(total_invoiced, 2),
        "total_paid": round(total_paid, 2),
        "total_outstanding": round(total_outstanding, 2),
        "overdue_amount": round(overdue_amount, 2),
        "open_invoices": open_count,
        "paid_invoices": paid_count,
        "overdue_invoices": overdue_count,
        "partially_paid_invoices": partially_paid_count
    }


@router.get("/stats/aging-report")
async def get_aging_report(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Get accounts receivable aging report
    Shows outstanding amounts by age (current, 1-30, 31-60, 61-90, 90+ days)
    """
    invoice_service = InvoiceService()
    aging_report = await invoice_service.get_aging_report(db)
    
    return aging_report


# Invoice Templates
@router.post("/templates", response_model=InvoiceTemplateResponse, status_code=http_status.HTTP_201_CREATED)
async def create_invoice_template(
    request: InvoiceTemplateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create an invoice template for recurring or standardized invoices"""
    template = InvoiceTemplate(
        name=request.name,
        description=request.description,
        items=[item.dict() for item in request.items],
        tax_rate=request.tax_rate or 0.0,
        discount_percent=request.discount_percent or 0.0,
        terms=request.terms,
        notes=request.notes,
        is_recurring=request.is_recurring or False,
        recurring_interval=RecurringInterval(request.recurring_interval) if request.recurring_interval else None
    )
    
    db.add(template)
    await db.commit()
    await db.refresh(template)
    
    logger.info(f"Created invoice template: {template.name}")
    return template


@router.get("/templates", response_model=List[InvoiceTemplateResponse])
async def list_invoice_templates(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """List all active invoice templates"""
    result = await db.execute(
        select(InvoiceTemplate).where(InvoiceTemplate.is_active == True)
        .order_by(InvoiceTemplate.created_at.desc())
    )
    templates = result.scalars().all()
    
    return templates


@router.post("/templates/{template_id}/generate", response_model=InvoiceResponse)
async def generate_invoice_from_template(
    template_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    send_email: bool = False
):
    """Generate a new invoice from a template"""
    # Get template
    result = await db.execute(
        select(InvoiceTemplate).where(InvoiceTemplate.id == template_id)
    )
    template = result.scalars().first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Create invoice request from template
    items = [InvoiceItemRequest(**item) for item in template.items]
    
    request = InvoiceCreateRequest(
        items=items,
        tax_rate=template.tax_rate,
        discount_percent=template.discount_percent,
        notes=template.notes,
        terms=template.terms,
        is_recurring=template.is_recurring,
        recurring_interval=template.recurring_interval.value if template.recurring_interval else None,
        send_email=send_email
    )
    
    # Create invoice using template
    return await create_invoice(request, user_id, db)


# Bulk Operations
@router.post("/bulk/send-reminders", status_code=http_status.HTTP_200_OK)
async def bulk_send_reminders(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
    days_before_due: int = 3
):
    """
    Send payment reminders for all upcoming or overdue invoices
    By default, sends reminders for invoices due within 3 days
    """
    now = datetime.utcnow()
    target_date = now + timedelta(days=days_before_due)
    
    # Get invoices that need reminders
    result = await db.execute(
        select(Invoice).where(
            and_(
                Invoice.user_id == user_id,
                Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.OVERDUE, InvoiceStatus.PARTIALLY_PAID]),
                or_(
                    Invoice.due_date <= target_date,
                    Invoice.due_date < now
                )
            )
        )
    )
    invoices = result.scalars().all()
    
    # Get user info
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    # Send reminders
    invoice_service = InvoiceService()
    sent_count = 0
    
    for invoice in invoices:
        try:
            await invoice_service.send_payment_reminder(invoice, user, db)
            sent_count += 1
        except Exception as e:
            logger.error(f"Failed to send reminder for invoice {invoice.invoice_number}: {str(e)}")
    
    logger.info(f"Sent {sent_count} payment reminders")
    return {
        "status": "success",
        "message": f"Sent {sent_count} payment reminders",
        "count": sent_count
    }


@router.post("/bulk/mark-overdue", status_code=http_status.HTTP_200_OK)
async def bulk_mark_overdue(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Check and mark all overdue invoices"""
    invoice_service = InvoiceService()
    count = await invoice_service.check_overdue_invoices(db)
    
    logger.info(f"Marked {count} invoices as overdue")
    return {
        "status": "success",
        "message": f"Marked {count} invoices as overdue",
        "count": count
    }
