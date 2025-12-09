"""
Credit Notes Models
"""
from sqlalchemy import Column, String, Float, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class CreditNoteStatus(str, enum.Enum):
    DRAFT = "draft"
    ISSUED = "issued"
    APPLIED = "applied"
    VOID = "void"


class CreditNoteReason(str, enum.Enum):
    REFUND = "refund"
    ADJUSTMENT = "adjustment"
    DISPUTE = "dispute"
    CANCELLATION = "cancellation"
    OTHER = "other"


class CreditNote(Base):
    """Credit Notes for refunds and adjustments"""
    __tablename__ = "credit_notes"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    credit_note_number = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Related records
    invoice_id = Column(String(36), ForeignKey("invoices.id"))
    order_id = Column(String(36), ForeignKey("orders.id"))
    payment_id = Column(String(36), ForeignKey("payments.id"))
    
    # Amounts
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    status = Column(Enum(CreditNoteStatus), default=CreditNoteStatus.DRAFT)
    
    # Details
    reason = Column(Enum(CreditNoteReason), nullable=False)
    description = Column(Text)
    notes = Column(Text)
    
    # Application tracking
    applied_amount = Column(Float, default=0.0)  # Amount applied to invoices
    remaining_amount = Column(Float, nullable=False)  # Available to apply
    
    # Dates
    issued_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    invoice = relationship("Invoice")
    order = relationship("Order")
    payment = relationship("Payment")
    applications = relationship("CreditNoteApplication", back_populates="credit_note", cascade="all, delete-orphan")


class CreditNoteApplication(Base):
    """Track where credit notes are applied"""
    __tablename__ = "credit_note_applications"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    credit_note_id = Column(String(36), ForeignKey("credit_notes.id"), nullable=False)
    invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=False)
    amount = Column(Float, nullable=False)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    applied_by = Column(String(36), ForeignKey("users.id"))
    
    # Relationships
    credit_note = relationship("CreditNote", back_populates="applications")
    invoice = relationship("Invoice")
    applier = relationship("User", foreign_keys=[applied_by])

