"""
Customer management API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user_id, hash_password
from app.models import (
    User, License, Subscription, Payment, Domain, Invoice, 
    LicenseStatus, SubscriptionStatus, PaymentStatus, InvoiceStatus, Plan
)
from app.schemas import (
    UserResponse,
    LicenseResponse,
    SubscriptionResponse,
    DomainResponse,
    PaymentResponse
)
from pydantic import BaseModel, EmailStr, Field
from typing import Dict, Any
import secrets

router = APIRouter()


# Helper function to verify admin access
async def verify_admin(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    """Verify user has admin privileges"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return user


# Customer-specific schemas
class GuestCustomerCreateRequest(BaseModel):
    email: EmailStr
    full_name: str
    company_name: Optional[str] = None


class CustomerCreateRequest(BaseModel):
    email: EmailStr
    full_name: str
    company_name: Optional[str] = None
    password: str = Field(min_length=8)
    is_active: bool = True


class CustomerUpdateRequest(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class CustomerDetailResponse(UserResponse):
    is_admin: bool
    total_licenses: int = 0
    active_licenses: int = 0
    total_subscriptions: int = 0
    active_subscriptions: int = 0
    total_domains: int = 0
    total_payments: float = 0.0
    total_invoices: int = 0
    outstanding_invoices: int = 0
    last_payment_date: Optional[datetime] = None
    licenses: List[LicenseResponse] = []
    
    class Config:
        from_attributes = True


class CustomerStatsResponse(BaseModel):
    total_customers: int
    active_customers: int
    inactive_customers: int
    customers_with_licenses: int
    customers_with_subscriptions: int
    new_customers_this_month: int
    new_customers_this_week: int
    total_revenue: float
    average_customer_value: float


class AddProductToCustomerRequest(BaseModel):
    plan_id: str
    license_id: Optional[str] = None
    billing_cycle: str = "monthly"
    create_subscription: bool = True


class ModifyLicenseRequest(BaseModel):
    plan_id: Optional[str] = None
    extend_days: Optional[int] = None  # Number of days to extend expiry
    set_expiry_date: Optional[datetime] = None  # Or set specific expiry date
    status: Optional[str] = None  # active, suspended, expired, cancelled
    max_accounts: Optional[int] = None
    max_domains: Optional[int] = None
    max_databases: Optional[int] = None
    max_emails: Optional[int] = None
    auto_renew: Optional[bool] = None


class ModifySubscriptionRequest(BaseModel):
    status: Optional[str] = None  # active, past_due, cancelled, trialing
    extend_period_days: Optional[int] = None
    cancel_at_period_end: Optional[bool] = None


@router.get("/stats", response_model=CustomerStatsResponse)
async def get_customer_stats(
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get customer statistics (admin only)"""
    
    # Calculate dates
    now = datetime.utcnow()
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    
    # Total customers
    result = await db.execute(
        select(func.count(User.id)).where(User.is_admin == False)
    )
    total_customers = result.scalar() or 0
    
    # Active customers
    result = await db.execute(
        select(func.count(User.id)).where(
            and_(User.is_admin == False, User.is_active == True)
        )
    )
    active_customers = result.scalar() or 0
    
    inactive_customers = total_customers - active_customers
    
    # Customers with licenses
    result = await db.execute(
        select(func.count(func.distinct(License.user_id)))
    )
    customers_with_licenses = result.scalar() or 0
    
    # Customers with subscriptions
    result = await db.execute(
        select(func.count(func.distinct(License.user_id))).select_from(License).join(Subscription)
    )
    customers_with_subscriptions = result.scalar() or 0
    
    # New customers this month
    result = await db.execute(
        select(func.count(User.id)).where(
            and_(
                User.is_admin == False,
                User.created_at >= first_day_of_month
            )
        )
    )
    new_customers_this_month = result.scalar() or 0
    
    # New customers this week
    result = await db.execute(
        select(func.count(User.id)).where(
            and_(
                User.is_admin == False,
                User.created_at >= week_ago
            )
        )
    )
    new_customers_this_week = result.scalar() or 0
    
    # Total revenue
    result = await db.execute(
        select(func.sum(Payment.amount)).where(Payment.status == PaymentStatus.SUCCEEDED)
    )
    total_revenue = result.scalar() or 0.0
    
    # Average customer value
    average_customer_value = total_revenue / total_customers if total_customers > 0 else 0.0
    
    return CustomerStatsResponse(
        total_customers=total_customers,
        active_customers=active_customers,
        inactive_customers=inactive_customers,
        customers_with_licenses=customers_with_licenses,
        customers_with_subscriptions=customers_with_subscriptions,
        new_customers_this_month=new_customers_this_month,
        new_customers_this_week=new_customers_this_week,
        total_revenue=total_revenue,
        average_customer_value=average_customer_value
    )


@router.get("", response_model=List[CustomerDetailResponse])
async def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    has_licenses: Optional[bool] = None,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get list of all customers with their details (admin only)"""
    
    query = select(User).where(User.is_admin == False)
    
    # Apply filters
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                User.email.ilike(search_pattern),
                User.full_name.ilike(search_pattern),
                User.company_name.ilike(search_pattern)
            )
        )
    
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    
    if has_licenses is not None:
        if has_licenses:
            query = query.join(License)
        else:
            query = query.outerjoin(License).where(License.id == None)
    
    # Get customers
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    customers = result.scalars().all()
    
    # Enrich with statistics
    customer_list = []
    for customer in customers:
        # Get licenses
        result = await db.execute(
            select(License).where(License.user_id == customer.id)
        )
        licenses = result.scalars().all()
        
        active_licenses = sum(1 for lic in licenses if lic.status == LicenseStatus.ACTIVE)
        
        # Get subscriptions
        result = await db.execute(
            select(func.count(Subscription.id)).select_from(Subscription).join(License).where(
                License.user_id == customer.id
            )
        )
        subscription_count = result.scalar() or 0
        
        result = await db.execute(
            select(func.count(Subscription.id)).select_from(Subscription).join(License).where(
                and_(
                    License.user_id == customer.id,
                    Subscription.status == SubscriptionStatus.ACTIVE
                )
            )
        )
        active_subscription_count = result.scalar() or 0
        
        # Get domains
        result = await db.execute(
            select(func.count(Domain.id)).where(Domain.user_id == customer.id)
        )
        domain_count = result.scalar() or 0
        
        # Get payments
        result = await db.execute(
            select(func.sum(Payment.amount)).where(
                and_(
                    Payment.user_id == customer.id,
                    Payment.status == PaymentStatus.SUCCEEDED
                )
            )
        )
        total_payments = result.scalar() or 0.0
        
        result = await db.execute(
            select(Payment).where(
                and_(
                    Payment.user_id == customer.id,
                    Payment.status == PaymentStatus.SUCCEEDED
                )
            ).order_by(Payment.created_at.desc()).limit(1)
        )
        last_payment = result.scalars().first()
        
        # Get invoices
        result = await db.execute(
            select(func.count(Invoice.id)).where(Invoice.user_id == customer.id)
        )
        total_invoices = result.scalar() or 0
        
        result = await db.execute(
            select(func.count(Invoice.id)).where(
                and_(
                    Invoice.user_id == customer.id,
                    Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.OVERDUE])
                )
            )
        )
        outstanding_invoices = result.scalar() or 0
        
        # Convert licenses to response format
        license_responses = [
            LicenseResponse(
                id=lic.id,
                license_key=lic.license_key,
                status=lic.status,
                max_accounts=lic.max_accounts,
                max_domains=lic.max_domains,
                max_databases=lic.max_databases,
                max_emails=lic.max_emails,
                current_accounts=lic.current_accounts,
                current_domains=lic.current_domains,
                current_databases=lic.current_databases,
                current_emails=lic.current_emails,
                activation_date=lic.activation_date,
                expiry_date=lic.expiry_date,
                created_at=lic.created_at
            )
            for lic in licenses
        ]
        
        customer_detail = CustomerDetailResponse(
            id=customer.id,
            email=customer.email,
            full_name=customer.full_name,
            company_name=customer.company_name,
            is_active=customer.is_active,
            is_admin=customer.is_admin,
            created_at=customer.created_at,
            total_licenses=len(licenses),
            active_licenses=active_licenses,
            total_subscriptions=subscription_count,
            active_subscriptions=active_subscription_count,
            total_domains=domain_count,
            total_payments=total_payments,
            total_invoices=total_invoices,
            outstanding_invoices=outstanding_invoices,
            last_payment_date=last_payment.created_at if last_payment else None,
            licenses=license_responses
        )
        
        customer_list.append(customer_detail)
    
    return customer_list


@router.get("/{customer_id}", response_model=CustomerDetailResponse)
async def get_customer(
    customer_id: str,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed customer information (admin only)"""
    
    result = await db.execute(select(User).where(User.id == customer_id))
    customer = result.scalars().first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get all related data
    result = await db.execute(select(License).where(License.user_id == customer.id))
    licenses = result.scalars().all()
    active_licenses = sum(1 for lic in licenses if lic.status == LicenseStatus.ACTIVE)
    
    result = await db.execute(
        select(func.count(Subscription.id)).select_from(Subscription).join(License).where(
            License.user_id == customer.id
        )
    )
    subscription_count = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Subscription.id)).select_from(Subscription).join(License).where(
            and_(
                License.user_id == customer.id,
                Subscription.status == SubscriptionStatus.ACTIVE
            )
        )
    )
    active_subscription_count = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Domain.id)).where(Domain.user_id == customer.id)
    )
    domain_count = result.scalar() or 0
    
    result = await db.execute(
        select(func.sum(Payment.amount)).where(
            and_(
                Payment.user_id == customer.id,
                Payment.status == PaymentStatus.SUCCEEDED
            )
        )
    )
    total_payments = result.scalar() or 0.0
    
    result = await db.execute(
        select(Payment).where(
            and_(
                Payment.user_id == customer.id,
                Payment.status == PaymentStatus.SUCCEEDED
            )
        ).order_by(Payment.created_at.desc()).limit(1)
    )
    last_payment = result.scalars().first()
    
    result = await db.execute(
        select(func.count(Invoice.id)).where(Invoice.user_id == customer.id)
    )
    total_invoices = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Invoice.id)).where(
            and_(
                Invoice.user_id == customer.id,
                Invoice.status.in_([InvoiceStatus.OPEN, InvoiceStatus.OVERDUE])
            )
        )
    )
    outstanding_invoices = result.scalar() or 0
    
    license_responses = [
        LicenseResponse(
            id=lic.id,
            license_key=lic.license_key,
            status=lic.status,
            max_accounts=lic.max_accounts,
            max_domains=lic.max_domains,
            max_databases=lic.max_databases,
            max_emails=lic.max_emails,
            current_accounts=lic.current_accounts,
            current_domains=lic.current_domains,
            current_databases=lic.current_databases,
            current_emails=lic.current_emails,
            activation_date=lic.activation_date,
            expiry_date=lic.expiry_date,
            created_at=lic.created_at
        )
        for lic in licenses
    ]
    
    return CustomerDetailResponse(
        id=customer.id,
        email=customer.email,
        full_name=customer.full_name,
        company_name=customer.company_name,
        is_active=customer.is_active,
        is_admin=customer.is_admin,
        created_at=customer.created_at,
        total_licenses=len(licenses),
        active_licenses=active_licenses,
        total_subscriptions=subscription_count,
        active_subscriptions=active_subscription_count,
        total_domains=domain_count,
        total_payments=total_payments,
        total_invoices=total_invoices,
        outstanding_invoices=outstanding_invoices,
        last_payment_date=last_payment.created_at if last_payment else None,
        licenses=license_responses
    )


@router.post("/guest", response_model=UserResponse)
async def create_guest_customer(
    customer_data: GuestCustomerCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Create a guest customer (no auth required, for checkout)"""
    
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == customer_data.email))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate a random password for guest customers
    guest_password = secrets.token_urlsafe(16)
    
    # Create new customer
    new_customer = User(
        email=customer_data.email,
        password_hash=hash_password(guest_password),
        full_name=customer_data.full_name,
        company_name=customer_data.company_name,
        is_active=True,
        is_admin=False
    )
    
    db.add(new_customer)
    await db.commit()
    await db.refresh(new_customer)
    
    return UserResponse(
        id=new_customer.id,
        email=new_customer.email,
        full_name=new_customer.full_name,
        company_name=new_customer.company_name,
        is_active=new_customer.is_active,
        created_at=new_customer.created_at
    )


@router.post("", response_model=CustomerDetailResponse)
async def create_customer(
    customer_data: CustomerCreateRequest,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new customer (admin only)"""
    
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == customer_data.email))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new customer
    new_customer = User(
        email=customer_data.email,
        password_hash=hash_password(customer_data.password),
        full_name=customer_data.full_name,
        company_name=customer_data.company_name,
        is_active=customer_data.is_active,
        is_admin=False
    )
    
    db.add(new_customer)
    await db.commit()
    await db.refresh(new_customer)
    
    return CustomerDetailResponse(
        id=new_customer.id,
        email=new_customer.email,
        full_name=new_customer.full_name,
        company_name=new_customer.company_name,
        is_active=new_customer.is_active,
        is_admin=new_customer.is_admin,
        created_at=new_customer.created_at,
        total_licenses=0,
        active_licenses=0,
        total_subscriptions=0,
        active_subscriptions=0,
        total_domains=0,
        total_payments=0.0,
        total_invoices=0,
        outstanding_invoices=0,
        last_payment_date=None,
        licenses=[]
    )


@router.put("/{customer_id}", response_model=CustomerDetailResponse)
async def update_customer(
    customer_id: str,
    customer_data: CustomerUpdateRequest,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update customer information (admin only)"""
    
    result = await db.execute(select(User).where(User.id == customer_id))
    customer = result.scalars().first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Update fields
    if customer_data.email is not None:
        # Check if new email is already taken
        result = await db.execute(
            select(User).where(and_(User.email == customer_data.email, User.id != customer_id))
        )
        existing = result.scalars().first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        customer.email = customer_data.email
    
    if customer_data.full_name is not None:
        customer.full_name = customer_data.full_name
    
    if customer_data.company_name is not None:
        customer.company_name = customer_data.company_name
    
    if customer_data.is_active is not None:
        customer.is_active = customer_data.is_active
    
    if customer_data.password is not None:
        customer.password_hash = hash_password(customer_data.password)
    
    await db.commit()
    await db.refresh(customer)
    
    # Return full customer details
    return await get_customer(customer_id, admin, db)


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: str,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a customer (admin only)"""
    
    result = await db.execute(select(User).where(User.id == customer_id))
    customer = result.scalars().first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Check if customer has active subscriptions or licenses
    result = await db.execute(
        select(func.count(License.id)).where(
            and_(
                License.user_id == customer_id,
                License.status == LicenseStatus.ACTIVE
            )
        )
    )
    active_licenses = result.scalar() or 0
    
    if active_licenses > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete customer with {active_licenses} active licenses. Please cancel them first."
        )
    
    await db.delete(customer)
    await db.commit()
    
    return {"message": "Customer deleted successfully"}


@router.get("/{customer_id}/licenses", response_model=List[LicenseResponse])
async def get_customer_licenses(
    customer_id: str,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all licenses for a customer (admin only)"""
    
    result = await db.execute(select(License).where(License.user_id == customer_id))
    licenses = result.scalars().all()
    
    return [
        LicenseResponse(
            id=lic.id,
            license_key=lic.license_key,
            status=lic.status,
            max_accounts=lic.max_accounts,
            max_domains=lic.max_domains,
            max_databases=lic.max_databases,
            max_emails=lic.max_emails,
            current_accounts=lic.current_accounts,
            current_domains=lic.current_domains,
            current_databases=lic.current_databases,
            current_emails=lic.current_emails,
            activation_date=lic.activation_date,
            expiry_date=lic.expiry_date,
            created_at=lic.created_at
        )
        for lic in licenses
    ]


@router.post("/{customer_id}/licenses")
async def add_license_to_customer(
    customer_id: str,
    request: AddProductToCustomerRequest,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Add a license/product to a customer (admin only)"""
    
    # Verify customer exists
    result = await db.execute(select(User).where(User.id == customer_id))
    customer = result.scalars().first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Verify plan exists
    result = await db.execute(select(Plan).where(Plan.id == request.plan_id))
    plan = result.scalars().first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Generate secure license key with cryptographic signature
    from app.core.license_security import license_security
    license_key, encrypted_secret = license_security.generate_secure_license_key(
        customer_id, request.plan_id
    )
    
    # Create license
    new_license = License(
        user_id=customer_id,
        plan_id=request.plan_id,
        license_key=license_key,
        encrypted_secret=encrypted_secret,
        status=LicenseStatus.ACTIVE,
        max_accounts=plan.max_accounts,
        max_domains=plan.max_domains,
        max_databases=plan.max_databases,
        max_emails=plan.max_emails,
        activation_date=datetime.utcnow(),
        expiry_date=datetime.utcnow() + timedelta(days=365 if request.billing_cycle == "yearly" else 30),
        auto_renew=True
    )
    
    db.add(new_license)
    await db.commit()
    await db.refresh(new_license)
    
    # Create subscription if requested
    if request.create_subscription:
        subscription = Subscription(
            license_id=new_license.id,
            status=SubscriptionStatus.ACTIVE,
            current_period_start=datetime.utcnow(),
            current_period_end=new_license.expiry_date
        )
        db.add(subscription)
        await db.commit()
    
    return {
        "message": "License added successfully",
        "license_id": new_license.id,
        "license_key": new_license.license_key
    }


@router.put("/{customer_id}/licenses/{license_id}")
async def modify_license(
    customer_id: str,
    license_id: str,
    request: ModifyLicenseRequest,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Modify a customer's license (admin only)"""
    
    result = await db.execute(
        select(License).where(
            and_(License.id == license_id, License.user_id == customer_id)
        )
    )
    license = result.scalars().first()
    
    if not license:
        raise HTTPException(status_code=404, detail="License not found for this customer")
    
    # Update plan if specified
    if request.plan_id:
        result = await db.execute(select(Plan).where(Plan.id == request.plan_id))
        plan = result.scalars().first()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        license.plan_id = request.plan_id
        license.max_accounts = plan.max_accounts
        license.max_domains = plan.max_domains
        license.max_databases = plan.max_databases
        license.max_emails = plan.max_emails
    
    # Extend expiry date
    if request.extend_days:
        if license.expiry_date:
            license.expiry_date = license.expiry_date + timedelta(days=request.extend_days)
        else:
            license.expiry_date = datetime.utcnow() + timedelta(days=request.extend_days)
    
    # Or set specific expiry date
    if request.set_expiry_date:
        license.expiry_date = request.set_expiry_date
    
    # Update status
    if request.status:
        try:
            license.status = LicenseStatus(request.status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {request.status}")
    
    # Update quotas if specified
    if request.max_accounts is not None:
        license.max_accounts = request.max_accounts
    if request.max_domains is not None:
        license.max_domains = request.max_domains
    if request.max_databases is not None:
        license.max_databases = request.max_databases
    if request.max_emails is not None:
        license.max_emails = request.max_emails
    if request.auto_renew is not None:
        license.auto_renew = request.auto_renew
    
    await db.commit()
    await db.refresh(license)
    
    return {
        "message": "License updated successfully",
        "license": LicenseResponse(
            id=license.id,
            license_key=license.license_key,
            status=license.status,
            max_accounts=license.max_accounts,
            max_domains=license.max_domains,
            max_databases=license.max_databases,
            max_emails=license.max_emails,
            current_accounts=license.current_accounts,
            current_domains=license.current_domains,
            current_databases=license.current_databases,
            current_emails=license.current_emails,
            activation_date=license.activation_date,
            expiry_date=license.expiry_date,
            created_at=license.created_at
        )
    }


@router.delete("/{customer_id}/licenses/{license_id}")
async def remove_license_from_customer(
    customer_id: str,
    license_id: str,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Remove a license from a customer (admin only)"""
    
    result = await db.execute(
        select(License).where(
            and_(License.id == license_id, License.user_id == customer_id)
        )
    )
    license = result.scalars().first()
    
    if not license:
        raise HTTPException(status_code=404, detail="License not found for this customer")
    
    # Cancel subscription if exists
    result = await db.execute(
        select(Subscription).where(Subscription.license_id == license_id)
    )
    subscription = result.scalars().first()
    
    if subscription:
        subscription.status = SubscriptionStatus.CANCELLED
        subscription.cancel_at_period_end = True
    
    # Update license status
    license.status = LicenseStatus.CANCELLED
    
    await db.commit()
    
    return {"message": "License cancelled successfully"}


@router.get("/{customer_id}/subscriptions", response_model=List[SubscriptionResponse])
async def get_customer_subscriptions(
    customer_id: str,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all subscriptions for a customer (admin only)"""
    
    result = await db.execute(
        select(Subscription).join(License).where(License.user_id == customer_id)
    )
    subscriptions = result.scalars().all()
    
    return [
        SubscriptionResponse(
            id=sub.id,
            license_id=sub.license_id,
            status=sub.status.value,
            current_period_start=sub.current_period_start,
            current_period_end=sub.current_period_end,
            cancel_at_period_end=sub.cancel_at_period_end,
            created_at=sub.created_at
        )
        for sub in subscriptions
    ]


@router.put("/{customer_id}/subscriptions/{subscription_id}")
async def modify_subscription(
    customer_id: str,
    subscription_id: str,
    request: ModifySubscriptionRequest,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Modify a customer's subscription (admin only)"""
    
    # Verify subscription belongs to customer
    result = await db.execute(
        select(Subscription).join(License).where(
            and_(
                Subscription.id == subscription_id,
                License.user_id == customer_id
            )
        )
    )
    subscription = result.scalars().first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found for this customer")
    
    # Update status
    if request.status:
        try:
            subscription.status = SubscriptionStatus(request.status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {request.status}")
    
    # Extend subscription period
    if request.extend_period_days:
        if subscription.current_period_end:
            subscription.current_period_end = subscription.current_period_end + timedelta(days=request.extend_period_days)
        else:
            subscription.current_period_end = datetime.utcnow() + timedelta(days=request.extend_period_days)
    
    # Set cancel at period end
    if request.cancel_at_period_end is not None:
        subscription.cancel_at_period_end = request.cancel_at_period_end
        if request.cancel_at_period_end and subscription.status == SubscriptionStatus.ACTIVE:
            subscription.status = SubscriptionStatus.CANCELLED
    
    await db.commit()
    await db.refresh(subscription)
    
    return {
        "message": "Subscription updated successfully",
        "subscription": SubscriptionResponse(
            id=subscription.id,
            license_id=subscription.license_id,
            status=subscription.status.value,
            current_period_start=subscription.current_period_start,
            current_period_end=subscription.current_period_end,
            cancel_at_period_end=subscription.cancel_at_period_end,
            created_at=subscription.created_at
        )
    }


@router.get("/{customer_id}/domains", response_model=List[DomainResponse])
async def get_customer_domains(
    customer_id: str,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all domains for a customer (admin only)"""
    
    result = await db.execute(select(Domain).where(Domain.user_id == customer_id))
    domains = result.scalars().all()
    
    return [
        DomainResponse(
            id=domain.id,
            domain_name=domain.domain_name,
            registrar=domain.registrar,
            registration_date=domain.registration_date,
            expiry_date=domain.expiry_date,
            auto_renew=domain.auto_renew,
            status=domain.status.value,
            created_at=domain.created_at
        )
        for domain in domains
    ]


@router.get("/{customer_id}/payments", response_model=List[PaymentResponse])
async def get_customer_payments(
    customer_id: str,
    admin: User = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all payments for a customer (admin only)"""
    
    result = await db.execute(
        select(Payment).where(Payment.user_id == customer_id).order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()
    
    return [
        PaymentResponse(
            id=payment.id,
            amount=payment.amount,
            currency=payment.currency,
            status=payment.status,
            description=payment.description,
            created_at=payment.created_at
        )
        for payment in payments
    ]
