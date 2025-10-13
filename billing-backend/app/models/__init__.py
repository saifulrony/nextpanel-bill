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


class PaymentGatewayType(str, enum.Enum):
    STRIPE = "stripe"
    PAYPAL = "paypal"
    RAZORPAY = "razorpay"
    SQUARE = "square"
    BRAINTREE = "braintree"
    AUTHORIZE_NET = "authorize_net"
    PAYU = "payu"
    MOLLIE = "mollie"


class PaymentGatewayStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TESTING = "testing"


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
    is_featured = Column(Boolean, default=False)  # Show on homepage
    sort_order = Column(Integer, default=0)  # Display order on homepage
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


class PaymentGateway(Base):
    """Payment gateway configurations"""
    __tablename__ = "payment_gateways"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    type = Column(Enum(PaymentGatewayType), nullable=False)
    display_name = Column(String(100), nullable=False)
    description = Column(Text)
    status = Column(Enum(PaymentGatewayStatus), default=PaymentGatewayStatus.INACTIVE)
    is_default = Column(Boolean, default=False)
    
    # Configuration settings (encrypted in production)
    config = Column(JSON)  # Gateway-specific configuration
    
    # Supported features
    supports_recurring = Column(Boolean, default=False)
    supports_refunds = Column(Boolean, default=True)
    supports_partial_refunds = Column(Boolean, default=True)
    supports_webhooks = Column(Boolean, default=True)
    
    # Fee structure
    fixed_fee = Column(Float, default=0.0)
    percentage_fee = Column(Float, default=0.0)
    
    # API credentials (encrypted in production)
    api_key = Column(String(500))
    secret_key = Column(String(500))
    webhook_secret = Column(String(500))
    
    # Environment settings
    is_sandbox = Column(Boolean, default=True)
    sandbox_api_key = Column(String(500))
    sandbox_secret_key = Column(String(500))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    payments = relationship("Payment", back_populates="gateway")


class Payment(Base):
    """Payment transactions"""
    __tablename__ = "payments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    license_id = Column(String(36), ForeignKey("licenses.id"))
    gateway_id = Column(String(36), ForeignKey("payment_gateways.id"))
    stripe_payment_intent_id = Column(String(255), unique=True)
    gateway_transaction_id = Column(String(255))  # Gateway-specific transaction ID
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    payment_method = Column(String(50))
    description = Column(Text)
    payment_metadata = Column(JSON)  # Renamed from 'metadata' (reserved in SQLAlchemy)
    gateway_response = Column(JSON)  # Store gateway response data
    failure_reason = Column(Text)  # Store failure details
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="payments")
    license = relationship("License", back_populates="payments")
    gateway = relationship("PaymentGateway", back_populates="payments")


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


class ChatSessionStatus(str, enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    ARCHIVED = "archived"


class ChatSession(Base):
    """Live chat sessions"""
    __tablename__ = "chat_sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"))
    guest_email = Column(String(255))  # For non-logged-in users - REQUIRED for guests
    guest_name = Column(String(255))
    guest_phone = Column(String(50))  # Phone number - REQUIRED for guests
    session_token = Column(String(255), unique=True)  # For guest tracking
    status = Column(String(20), default="active")
    assigned_to = Column(String(36), ForeignKey("users.id"))  # Admin assigned
    subject = Column(String(255))
    rating = Column(Integer)  # 1-5 star rating after chat
    feedback = Column(Text)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    closed_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    assigned_admin = relationship("User", foreign_keys=[assigned_to])
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class MessageSender(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"
    BOT = "bot"
    SYSTEM = "system"


class ChatMessage(Base):
    """Chat messages in a session"""
    __tablename__ = "chat_messages"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("chat_sessions.id"), nullable=False)
    sender_type = Column(Enum(MessageSender), nullable=False)
    sender_id = Column(String(36), ForeignKey("users.id"))  # Null for bot/system
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True))
    message_metadata = Column(JSON)  # For attachments, links, etc. (renamed from 'metadata' - reserved in SQLAlchemy)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])


class AddonCategory(str, enum.Enum):
    COMMUNICATION = "communication"
    PAYMENT = "payment"
    ANALYTICS = "analytics"
    SECURITY = "security"
    MARKETING = "marketing"
    INTEGRATION = "integration"
    PRODUCTIVITY = "productivity"
    OTHER = "other"


class AddonStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BETA = "beta"
    DEPRECATED = "deprecated"


class Addon(Base):
    """Available addons/plugins in marketplace"""
    __tablename__ = "addons"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(100), nullable=False)
    description = Column(Text)
    category = Column(String(50), default="other")
    version = Column(String(20), default="1.0.0")
    author = Column(String(100))
    icon = Column(String(50))  # Emoji or icon class
    status = Column(String(20), default="active")
    is_premium = Column(Boolean, default=False)
    price = Column(Float, default=0.0)
    
    # Features and requirements
    features = Column(JSON)  # List of features this addon provides
    requirements = Column(JSON)  # Dependencies on other addons
    settings_schema = Column(JSON)  # Configuration options
    
    # Installation stats
    install_count = Column(Integer, default=0)
    rating_average = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    
    # URLs and resources
    homepage_url = Column(String(500))
    documentation_url = Column(String(500))
    support_url = Column(String(500))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    installations = relationship("AddonInstallation", back_populates="addon")


class AddonInstallation(Base):
    """Installed addons per system (not per user - system-wide)"""
    __tablename__ = "addon_installations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    addon_id = Column(String(36), ForeignKey("addons.id"), nullable=False)
    installed_by = Column(String(36), ForeignKey("users.id"))  # Admin who installed
    is_enabled = Column(Boolean, default=True)
    settings = Column(JSON)  # Addon-specific settings
    installed_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    addon = relationship("Addon", back_populates="installations")
    installed_by_user = relationship("User", foreign_keys=[installed_by])


class SystemSetting(Base):
    """System-wide settings"""
    __tablename__ = "system_settings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    key = Column(String(100), nullable=False, unique=True)
    value = Column(Text)
    value_type = Column(String(20), default="string")  # string, number, boolean, json
    category = Column(String(50))  # general, appearance, email, time, etc.
    display_name = Column(String(100))
    description = Column(Text)
    is_public = Column(Boolean, default=False)  # Can non-admins see this?
    updated_by = Column(String(36), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    updated_by_user = relationship("User", foreign_keys=[updated_by])


# Import NextPanel models to ensure tables are created
from app.models.nextpanel_server import NextPanelServer, NextPanelAccount

