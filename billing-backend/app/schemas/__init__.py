"""
Pydantic schemas for API validation and serialization
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


# Enums
class LicenseStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    SUCCEEDED = "succeeded"
    PENDING = "pending"
    FAILED = "failed"
    REFUNDED = "refunded"


# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    company_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    company_name: Optional[str] = None


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Plan Schemas
class PlanBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_monthly: float
    price_yearly: float
    max_accounts: int = 1
    max_domains: int = 1
    max_databases: int = 5
    max_emails: int = 10


class PlanCreateRequest(PlanBase):
    features: Optional[Dict[str, Any]] = None
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_yearly: Optional[str] = None


class PlanUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    max_accounts: Optional[int] = None
    max_domains: Optional[int] = None
    max_databases: Optional[int] = None
    max_emails: Optional[int] = None
    features: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    sort_order: Optional[int] = None


class PlanResponse(PlanBase):
    id: str
    features: Optional[Dict[str, Any]] = None
    is_active: bool
    is_featured: bool = False
    sort_order: int = 0
    created_at: datetime
    
    class Config:
        from_attributes = True


# License Schemas
class LicenseCreate(BaseModel):
    plan_id: str
    user_id: str


class LicenseResponse(BaseModel):
    id: str
    license_key: str
    status: LicenseStatus
    max_accounts: int
    max_domains: int
    max_databases: int
    max_emails: int
    current_accounts: int
    current_domains: int
    current_databases: int
    current_emails: int
    activation_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class LicenseValidateRequest(BaseModel):
    license_key: str
    feature: str  # e.g., "create_database", "create_domain"


class LicenseValidateResponse(BaseModel):
    valid: bool
    remaining_quota: Optional[int] = None
    error: Optional[str] = None


# Domain Schemas
class DomainCheckRequest(BaseModel):
    domain_name: str


class DomainCheckResponse(BaseModel):
    domain_name: str
    available: bool
    price: Optional[float] = None


class DomainRegisterRequest(BaseModel):
    domain_name: str
    years: int = 1
    nameservers: Optional[List[str]] = None
    license_id: Optional[str] = None
    auto_renew: bool = True
    contact_info: Optional[Dict[str, Any]] = None


class DomainRenewRequest(BaseModel):
    years: int = 1


class DomainTransferRequest(BaseModel):
    auth_code: str


class DomainUpdateNameserversRequest(BaseModel):
    nameservers: List[str]


class DomainResponse(BaseModel):
    id: str
    domain_name: str
    registrar: Optional[str] = None
    registration_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    auto_renew: bool
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Payment Schemas
class PaymentIntentRequest(BaseModel):
    plan_id: str
    billing_cycle: str = "monthly"  # or "yearly"
    currency: Optional[str] = "USD"
    payment_method: Optional[str] = None


class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_id: str
    amount: float
    currency: str


class PaymentConfirmRequest(BaseModel):
    payment_method_id: Optional[str] = None


class PaymentRefundRequest(BaseModel):
    amount: Optional[float] = None
    reason: Optional[str] = None


class PaymentWebhookEvent(BaseModel):
    type: str
    data: Dict[str, Any]


class PaymentResponse(BaseModel):
    id: str
    amount: float
    currency: str
    status: PaymentStatus
    description: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# Subscription Schemas
class SubscriptionCreateRequest(BaseModel):
    plan_id: str
    billing_cycle: str = "monthly"  # or "yearly"
    license_id: Optional[str] = None


class SubscriptionUpdateRequest(BaseModel):
    new_plan_id: str


class SubscriptionCancelRequest(BaseModel):
    cancel_at_period_end: bool = True
    reason: Optional[str] = None


class SubscriptionResponse(BaseModel):
    id: str
    license_id: str
    status: str
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Invoice Schemas
class InvoiceItemRequest(BaseModel):
    description: str
    quantity: int = 1
    amount: float
    unit_price: Optional[float] = None


class InvoiceCreateRequest(BaseModel):
    payment_id: Optional[str] = None
    subscription_id: Optional[str] = None
    license_id: Optional[str] = None
    items: List[InvoiceItemRequest]
    due_date: Optional[datetime] = None
    tax_rate: Optional[float] = 0.0
    discount_percent: Optional[float] = 0.0
    discount_amount: Optional[float] = 0.0
    currency: Optional[str] = "USD"
    notes: Optional[str] = None
    terms: Optional[str] = None
    payment_instructions: Optional[str] = None
    customer_po_number: Optional[str] = None
    billing_address: Optional[Dict[str, Any]] = None
    is_recurring: Optional[bool] = False
    recurring_interval: Optional[str] = None
    send_email: Optional[bool] = False


class InvoiceUpdateRequest(BaseModel):
    items: Optional[List[InvoiceItemRequest]] = None
    due_date: Optional[datetime] = None
    tax_rate: Optional[float] = None
    discount_percent: Optional[float] = None
    discount_amount: Optional[float] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    payment_instructions: Optional[str] = None


class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    status: str
    subtotal: float
    discount_amount: float
    discount_percent: float
    tax: float
    tax_rate: float
    total: float
    amount_paid: float
    amount_due: float
    currency: str
    invoice_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    items: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    is_recurring: bool
    recurring_interval: Optional[str] = None
    sent_to_customer: bool
    reminder_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class PartialPaymentRequest(BaseModel):
    amount: float
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class PartialPaymentResponse(BaseModel):
    id: str
    invoice_id: str
    amount: float
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class InvoiceFilterRequest(BaseModel):
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    customer_id: Optional[str] = None


class InvoiceTemplateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    items: List[InvoiceItemRequest]
    tax_rate: Optional[float] = 0.0
    discount_percent: Optional[float] = 0.0
    terms: Optional[str] = None
    notes: Optional[str] = None
    is_recurring: Optional[bool] = False
    recurring_interval: Optional[str] = None


class InvoiceTemplateResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    items: List[Dict[str, Any]]
    tax_rate: float
    discount_percent: float
    is_recurring: bool
    recurring_interval: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class BulkInvoiceRequest(BaseModel):
    user_ids: List[str]
    template_id: Optional[str] = None
    items: Optional[List[InvoiceItemRequest]] = None
    due_date: Optional[datetime] = None
    send_email: Optional[bool] = False


# Usage & Quota Schemas
class QuotaResponse(BaseModel):
    license_id: Optional[str] = None
    max_accounts: int
    current_accounts: int
    max_domains: int
    current_domains: int
    max_databases: int
    current_databases: int
    max_emails: int
    current_emails: int
    accounts_available: int
    domains_available: int
    databases_available: int
    emails_available: int


class UsageUpdateRequest(BaseModel):
    license_id: str
    resource_type: str  # accounts, domains, databases, emails
    delta: int  # +1 to increment, -1 to decrement


class UsageReportRequest(BaseModel):
    license_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class UsageReportResponse(BaseModel):
    start_date: datetime
    end_date: datetime
    licenses: List[Dict[str, Any]]
    summary: Dict[str, Any]


# Admin Schemas
class AdminUserUpdateRequest(BaseModel):
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    full_name: Optional[str] = None
    company_name: Optional[str] = None


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_licenses: int
    active_licenses: int
    total_revenue: float
    monthly_revenue: float
    total_domains: int
    total_invoices: int
    outstanding_invoices: int
    new_users_this_month: int


# Support Ticket Schemas
class TicketCreateRequest(BaseModel):
    subject: str
    description: str
    priority: Optional[str] = "medium"
    category: Optional[str] = None


class TicketUpdateRequest(BaseModel):
    priority: Optional[str] = None


class TicketReplyRequest(BaseModel):
    message: str


class TicketResponse(BaseModel):
    id: str
    ticket_number: str
    subject: str
    description: str
    status: str
    priority: str
    category: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TicketReplyResponse(BaseModel):
    id: str
    ticket_id: str
    user_id: str
    message: str
    is_staff: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Health Check
class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    timestamp: datetime

