"""
Database models
"""
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Float, Enum, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class LicenseStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELLED = "cancelled"
    TRIALING = "trialing"


class PaymentStatus(str, enum.Enum):
    SUCCEEDED = "succeeded"
    PENDING = "pending"
    FAILED = "failed"
    REFUNDED = "refunded"


class DomainStatus(str, enum.Enum):
    ACTIVE = "active"
    PENDING = "pending"
    EXPIRED = "expired"
    TRANSFERRED = "transferred"


class User(Base):
    """User model - customers who buy licenses"""
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    company_name = Column(String(255))
    stripe_customer_id = Column(String(255), unique=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    licenses = relationship("License", back_populates="user")
    payments = relationship("Payment", back_populates="user")
    domains = relationship("Domain", back_populates="user")


class Plan(Base):
    """Pricing plans"""
    __tablename__ = "plans"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price_monthly = Column(Float, nullable=False)
    price_yearly = Column(Float, nullable=False)
    features = Column(JSON)  # Flexible feature flags
    max_accounts = Column(Integer, default=1)
    max_domains = Column(Integer, default=1)
    max_databases = Column(Integer, default=5)
    max_emails = Column(Integer, default=10)
    stripe_price_id_monthly = Column(String(255))
    stripe_price_id_yearly = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    licenses = relationship("License", back_populates="plan")


class License(Base):
    """NextPanel licenses"""
    __tablename__ = "licenses"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    plan_id = Column(String(36), ForeignKey("plans.id"), nullable=False)
    license_key = Column(String(100), unique=True, index=True, nullable=False)
    status = Column(Enum(LicenseStatus), default=LicenseStatus.ACTIVE)
    features = Column(JSON)  # Flexible feature flags
    max_accounts = Column(Integer, default=1)
    max_domains = Column(Integer, default=1)
    max_databases = Column(Integer, default=5)
    max_emails = Column(Integer, default=10)
    current_accounts = Column(Integer, default=0)
    current_domains = Column(Integer, default=0)
    current_databases = Column(Integer, default=0)
    current_emails = Column(Integer, default=0)
    nextpanel_user_id = Column(String(36))  # FK to NextPanel system
    activation_date = Column(DateTime(timezone=True))
    expiry_date = Column(DateTime(timezone=True))
    auto_renew = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="licenses")
    plan = relationship("Plan", back_populates="licenses")
    subscription = relationship("Subscription", back_populates="license", uselist=False)
    payments = relationship("Payment", back_populates="license")


class Subscription(Base):
    """Recurring billing subscriptions"""
    __tablename__ = "subscriptions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    license_id = Column(String(36), ForeignKey("licenses.id"), nullable=False)
    stripe_subscription_id = Column(String(255), unique=True)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    current_period_start = Column(DateTime(timezone=True))
    current_period_end = Column(DateTime(timezone=True))
    cancel_at_period_end = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    license = relationship("License", back_populates="subscription")


class Domain(Base):
    """Registered domains"""
    __tablename__ = "domains"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    license_id = Column(String(36), ForeignKey("licenses.id"))
    domain_name = Column(String(255), unique=True, index=True, nullable=False)
    registrar = Column(String(50))  # resellerclub, namecheap, etc.
    registrar_domain_id = Column(String(255))
    registration_date = Column(DateTime(timezone=True))
    expiry_date = Column(DateTime(timezone=True))
    auto_renew = Column(Boolean, default=True)
    nameservers = Column(JSON)
    status = Column(Enum(DomainStatus), default=DomainStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="domains")


class Payment(Base):
    """Payment transactions"""
    __tablename__ = "payments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    license_id = Column(String(36), ForeignKey("licenses.id"))
    stripe_payment_intent_id = Column(String(255), unique=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    payment_method = Column(String(50))
    description = Column(Text)
    payment_metadata = Column(JSON)  # Renamed from 'metadata' (reserved in SQLAlchemy)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="payments")
    license = relationship("License", back_populates="payments")


class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    OPEN = "open"
    PAID = "paid"
    PARTIALLY_PAID = "partially_paid"
    OVERDUE = "overdue"
    VOID = "void"
    UNCOLLECTIBLE = "uncollectible"


class RecurringInterval(str, enum.Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class Invoice(Base):
    """Invoices for payments"""
    __tablename__ = "invoices"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    payment_id = Column(String(36), ForeignKey("payments.id"))
    subscription_id = Column(String(36), ForeignKey("subscriptions.id"))
    license_id = Column(String(36), ForeignKey("licenses.id"))
    invoice_number = Column(String(50), unique=True, nullable=False)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT)
    
    # Amounts
    subtotal = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0)
    discount_percent = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    tax_rate = Column(Float, default=0.0)
    total = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    amount_due = Column(Float, default=0.0)
    currency = Column(String(3), default="USD")
    
    # Dates
    invoice_date = Column(DateTime(timezone=True), server_default=func.now())
    due_date = Column(DateTime(timezone=True))
    paid_at = Column(DateTime(timezone=True))
    last_reminder_sent = Column(DateTime(timezone=True))
    
    # Items and details
    items = Column(JSON)  # Invoice line items
    notes = Column(Text)
    terms = Column(Text)
    
    # Recurring billing
    is_recurring = Column(Boolean, default=False)
    recurring_interval = Column(Enum(RecurringInterval))
    recurring_next_date = Column(DateTime(timezone=True))
    recurring_parent_id = Column(String(36), ForeignKey("invoices.id"))
    
    # Additional fields
    payment_method = Column(String(50))
    payment_instructions = Column(Text)
    customer_po_number = Column(String(100))
    billing_address = Column(JSON)
    sent_to_customer = Column(Boolean, default=False)
    reminder_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User")
    payment = relationship("Payment")
    subscription = relationship("Subscription")
    license = relationship("License")
    recurring_parent = relationship("Invoice", remote_side=[id])
    partial_payments = relationship("PartialPayment", back_populates="invoice")


class PartialPayment(Base):
    """Track partial payments for invoices"""
    __tablename__ = "partial_payments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    invoice_id = Column(String(36), ForeignKey("invoices.id"), nullable=False)
    payment_id = Column(String(36), ForeignKey("payments.id"))
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    invoice = relationship("Invoice", back_populates="partial_payments")


class InvoiceTemplate(Base):
    """Templates for recurring or standardized invoices"""
    __tablename__ = "invoice_templates"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    items = Column(JSON)  # Template line items
    tax_rate = Column(Float, default=0.0)
    discount_percent = Column(Float, default=0.0)
    terms = Column(Text)
    notes = Column(Text)
    is_recurring = Column(Boolean, default=False)
    recurring_interval = Column(Enum(RecurringInterval))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING_FOR_CUSTOMER = "waiting_for_customer"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class SupportTicket(Base):
    """Support tickets"""
    __tablename__ = "support_tickets"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    ticket_number = Column(String(50), unique=True, nullable=False)
    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN)
    priority = Column(Enum(TicketPriority), default=TicketPriority.MEDIUM)
    category = Column(String(50))  # billing, technical, general
    assigned_to = Column(String(36), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    assigned_admin = relationship("User", foreign_keys=[assigned_to])
    replies = relationship("TicketReply", back_populates="ticket")


class TicketReply(Base):
    """Replies to support tickets"""
    __tablename__ = "ticket_replies"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    ticket_id = Column(String(36), ForeignKey("support_tickets.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    is_staff = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    ticket = relationship("SupportTicket", back_populates="replies")
    user = relationship("User")

