"""
Credit Notes API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user_id, verify_admin
from app.models import CreditNote, CreditNoteApplication, CreditNoteStatus, CreditNoteReason, Invoice, User
from app.schemas import BaseModel
from pydantic import Field
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/credit-notes", tags=["credit-notes"])


# Schemas
class CreditNoteCreateRequest(BaseModel):
    user_id: str
    invoice_id: Optional[str] = None
    order_id: Optional[str] = None
    payment_id: Optional[str] = None
    amount: float = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=3)
    reason: CreditNoteReason
    description: Optional[str] = None
    notes: Optional[str] = None


class CreditNoteResponse(BaseModel):
    id: str
    credit_note_number: str
    user_id: str
    invoice_id: Optional[str]
    order_id: Optional[str]
    payment_id: Optional[str]
    amount: float
    currency: str
    status: CreditNoteStatus
    reason: CreditNoteReason
    description: Optional[str]
    notes: Optional[str]
    applied_amount: float
    remaining_amount: float
    issued_date: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]


class ApplyCreditNoteRequest(BaseModel):
    invoice_id: str
    amount: float = Field(..., gt=0)


@router.post("/", response_model=CreditNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_credit_note(
    request: CreditNoteCreateRequest,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a credit note (admin only)"""
    # Generate credit note number
    now = datetime.utcnow()
    credit_note_number = f"CN-{now.strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    credit_note = CreditNote(
        credit_note_number=credit_note_number,
        user_id=request.user_id,
        invoice_id=request.invoice_id,
        order_id=request.order_id,
        payment_id=request.payment_id,
        amount=request.amount,
        currency=request.currency,
        reason=request.reason,
        description=request.description,
        notes=request.notes,
        remaining_amount=request.amount,
        status=CreditNoteStatus.ISSUED,
        issued_date=now
    )
    
    db.add(credit_note)
    await db.commit()
    await db.refresh(credit_note)
    
    logger.info(f"Credit note created: {credit_note_number} by admin {user_id}")
    return credit_note


@router.get("/", response_model=List[CreditNoteResponse])
async def list_credit_notes(
    user_id_filter: Optional[str] = Query(None, alias="user_id"),
    status_filter: Optional[CreditNoteStatus] = Query(None, alias="status"),
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all credit notes (admin only)"""
    query = select(CreditNote)
    
    if user_id_filter:
        query = query.where(CreditNote.user_id == user_id_filter)
    
    if status_filter:
        query = query.where(CreditNote.status == status_filter)
    
    query = query.order_by(CreditNote.created_at.desc())
    
    result = await db.execute(query)
    credit_notes = result.scalars().all()
    return credit_notes


@router.get("/{credit_note_id}", response_model=CreditNoteResponse)
async def get_credit_note(
    credit_note_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get credit note details"""
    result = await db.execute(select(CreditNote).where(CreditNote.id == credit_note_id))
    credit_note = result.scalars().first()
    
    if not credit_note:
        raise HTTPException(status_code=404, detail="Credit note not found")
    
    # Check access - user can only see their own, admin can see all
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    is_admin = user and getattr(user, 'is_admin', False)
    
    if not is_admin and credit_note.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return credit_note


@router.post("/{credit_note_id}/apply", response_model=dict)
async def apply_credit_note(
    credit_note_id: str,
    request: ApplyCreditNoteRequest,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Apply credit note to an invoice (admin only)"""
    # Get credit note
    result = await db.execute(select(CreditNote).where(CreditNote.id == credit_note_id))
    credit_note = result.scalars().first()
    
    if not credit_note:
        raise HTTPException(status_code=404, detail="Credit note not found")
    
    if credit_note.status != CreditNoteStatus.ISSUED:
        raise HTTPException(status_code=400, detail="Credit note is not in issued status")
    
    if request.amount > credit_note.remaining_amount:
        raise HTTPException(status_code=400, detail="Amount exceeds remaining credit")
    
    # Get invoice
    invoice_result = await db.execute(select(Invoice).where(Invoice.id == request.invoice_id))
    invoice = invoice_result.scalars().first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Create application record
    application = CreditNoteApplication(
        credit_note_id=credit_note_id,
        invoice_id=request.invoice_id,
        amount=request.amount,
        applied_by=user_id
    )
    db.add(application)
    
    # Update credit note
    credit_note.applied_amount += request.amount
    credit_note.remaining_amount -= request.amount
    
    if credit_note.remaining_amount <= 0:
        credit_note.status = CreditNoteStatus.APPLIED
    
    # Update invoice
    invoice.amount_due = max(0, invoice.amount_due - request.amount)
    invoice.amount_paid += request.amount
    
    if invoice.amount_due <= 0:
        invoice.status = "paid"
        invoice.paid_at = datetime.utcnow()
    
    await db.commit()
    
    logger.info(f"Credit note {credit_note.credit_note_number} applied to invoice {invoice.invoice_number}")
    return {
        "message": "Credit note applied successfully",
        "credit_note_id": credit_note_id,
        "invoice_id": request.invoice_id,
        "amount_applied": request.amount,
        "remaining_credit": credit_note.remaining_amount
    }


@router.get("/{credit_note_id}/applications", response_model=List[dict])
async def get_credit_note_applications(
    credit_note_id: str,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get credit note application history (admin only)"""
    result = await db.execute(
        select(CreditNoteApplication)
        .where(CreditNoteApplication.credit_note_id == credit_note_id)
        .order_by(CreditNoteApplication.applied_at.desc())
    )
    applications = result.scalars().all()
    
    return [
        {
            "id": app.id,
            "invoice_id": app.invoice_id,
            "amount": app.amount,
            "applied_at": app.applied_at,
            "applied_by": app.applied_by
        }
        for app in applications
    ]

