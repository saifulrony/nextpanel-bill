"""
Orders API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date, text
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import Order, OrderStatus, User, Domain, DomainStatus, License, Plan, Invoice, InvoiceStatus
from pydantic import BaseModel, Field

router = APIRouter()
logger = logging.getLogger(__name__)


async def generate_invoice_number(db: AsyncSession) -> str:
    """Generate sequential invoice number like INV-0008"""
    from datetime import datetime
    
    # Find the highest invoice number
    result = await db.execute(
        select(func.max(Order.invoice_number))
        .where(Order.invoice_number.like('INV-%'))
    )
    max_invoice = result.scalar()
    
    if max_invoice:
        # Extract the number part and increment
        try:
            # Handle both old format (INV-2024-0001) and new format (INV-0008)
            parts = max_invoice.split('-')
            if len(parts) == 3:
                # Old format: INV-2024-0001
                number = int(parts[-1])
            else:
                # New format: INV-0008
                number = int(parts[-1])
            next_number = number + 1
        except (ValueError, IndexError):
            next_number = 1
    else:
        # First invoice
        next_number = 1
    
    # Format: INV-0008
    return f"INV-{next_number:04d}"


async def provision_services_from_order(order: Order, db: AsyncSession):
    """Provision services (domains, hosting, dedicated servers) based on order items"""
    try:
        from app.models.dedicated_server import DedicatedServerProduct, DedicatedServerInstance, ServerStatus
        from app.services.provisioning.factory import ProvisioningModuleFactory
        from sqlalchemy import select
        
        for item in order.items:
            product_name = item.get('product_name', '').lower()
            product_id = item.get('product_id', '')
            
            # Check if this is a dedicated server/VPS product
            is_server_product = False
            server_product = None
            
            # Try to find dedicated server product by name
            if any(keyword in product_name for keyword in ['dedicated', 'vps', 'server', 'cloud']):
                result = await db.execute(
                    select(DedicatedServerProduct).where(
                        DedicatedServerProduct.name.ilike(f"%{item.get('product_name', '')}%")
                    ).limit(1)
                )
                server_product = result.scalar_one_or_none()
                if server_product:
                    is_server_product = True
            
            # Handle dedicated server/VPS products
            if is_server_product and server_product:
                try:
                    # Get provisioning module
                    module = ProvisioningModuleFactory.get_module(
                        server_product.provisioning_module or "manual",
                        server_product.module_config or {}
                    )
                    
                    # Generate hostname
                    hostname = f"server-{order.customer_id[:8]}-{order.id}"
                    
                    # Provision server
                    provision_result = module.create_account({
                        "order_id": order.id,
                        "customer_id": order.customer_id,
                        "product_specs": {
                            "cpu_cores": server_product.cpu_cores,
                            "ram_gb": server_product.ram_gb,
                            "storage_gb": server_product.storage_gb,
                            "bandwidth_tb": server_product.bandwidth_tb
                        },
                        "hostname": hostname,
                        "os": server_product.available_os[0] if server_product.available_os else "ubuntu-22.04",
                        "datacenter": server_product.datacenter_location or "default"
                    })
                    
                    # Create server instance record
                    server = DedicatedServerInstance(
                        customer_id=order.customer_id,
                        order_id=order.id,
                        product_id=server_product.id,
                        hostname=hostname,
                        ip_address=provision_result.get("ip_address"),
                        provider=server_product.provider,
                        provider_server_id=str(provision_result.get("server_id")) if provision_result.get("server_id") else None,
                        status=ServerStatus.PROVISIONING if not provision_result.get("requires_manual_setup") else ServerStatus.PENDING_PROVISIONING,
                        cpu_cores=server_product.cpu_cores,
                        ram_gb=server_product.ram_gb,
                        storage_gb=server_product.storage_gb,
                        storage_type=server_product.storage_type,
                        bandwidth_tb=server_product.bandwidth_tb,
                        operating_system=server_product.available_os[0] if server_product.available_os else None,
                        datacenter_location=server_product.datacenter_location,
                        region=server_product.region,
                        provider_api_response=provision_result,
                        meta_data={
                            "provisioned_via": server_product.provisioning_module or "manual",
                            "auto_provisioned": True
                        }
                    )
                    db.add(server)
                    
                    # Update product order count
                    server_product.current_orders += 1
                    
                    print(f"Provisioned server: {hostname} for order {order.id}")
                    continue  # Skip other provisioning logic for server products
                except Exception as e:
                    print(f"Error provisioning server for order {order.id}: {e}")
                    # Continue to try other provisioning methods
            
            # Handle domain products - check for .com, .net, .org etc in product name
            if ('.com' in product_name or '.net' in product_name or '.org' in product_name or 
                '.info' in product_name or '.biz' in product_name or 
                'domain' in product_name or product_id == 'domain'):
                
                # Use product name as domain name if it looks like a domain
                if '.' in product_name:
                    # Clean up domain name - remove "Domain: " prefix if present
                    domain_name = product_name
                    if domain_name.lower().startswith('domain:'):
                        domain_name = domain_name.split(':', 1)[1].strip()
                else:
                    domain_name = f'{product_name}-{order.id[:8]}.com'
                
                # Create domain record
                domain = Domain(
                    user_id=order.customer_id,
                    domain_name=domain_name,
                    registrar='ResellerClub',  # Default registrar
                    registration_date=datetime.utcnow(),
                    expiry_date=datetime.utcnow() + timedelta(days=365),  # 1 year
                    auto_renew=True,
                    status=DomainStatus.ACTIVE,
                    nameservers=['ns1.example.com', 'ns2.example.com']
                )
                db.add(domain)
                print(f"Created domain: {domain_name}")
            
            # Handle hosting products - create a license for any non-domain product
            elif not ('.com' in product_name or '.net' in product_name or '.org' in product_name):
                # Find the corresponding plan or create a default one
                plan_result = await db.execute(
                    select(Plan).where(Plan.name.ilike(f'%{product_name}%')).limit(1)
                )
                plan = plan_result.scalars().first()
                
                # If no plan found, create a default plan
                if not plan:
                    plan = Plan(
                        name=product_name,
                        description=f'Service: {product_name}',
                        price_monthly=item.get('price', 0),
                        price_yearly=item.get('price', 0) * 12,
                        max_accounts=1,
                        max_domains=1,
                        max_databases=1,
                        max_emails=1,
                        is_active=True
                    )
                    db.add(plan)
                    await db.flush()  # Get the plan ID
                
                # Generate secure license key
                try:
                    from app.core.license_security import license_security
                    license_key, encrypted_secret = license_security.generate_secure_license_key(
                        order.customer_id, plan.id
                    )
                except Exception as e:
                    print(f"Warning: Could not generate secure license key, using simple key: {e}")
                    # Fallback to simple license key if license_security is not available
                    import secrets
                    license_key = f"NP-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}-{secrets.token_hex(4).upper()}"
                    encrypted_secret = None
                
                # Create license record for hosting/service
                # Build license data
                license_kwargs = {
                    'user_id': order.customer_id,
                    'plan_id': plan.id,
                    'license_key': license_key,
                    'status': 'active',
                    'max_accounts': plan.max_accounts or 1,
                    'max_domains': plan.max_domains or 1,
                    'max_databases': plan.max_databases or 1,
                    'max_emails': plan.max_emails or 1,
                    'current_accounts': 0,
                    'current_domains': 0,
                    'current_databases': 0,
                    'current_emails': 0,
                    'activation_date': datetime.utcnow(),
                    'expiry_date': datetime.utcnow() + timedelta(days=365),  # 1 year
                    'auto_renew': True
                }
                
                # Add encrypted_secret if available (column should exist after migration)
                if encrypted_secret is not None:
                    license_kwargs['encrypted_secret'] = encrypted_secret
                
                # Create license
                license = License(**license_kwargs)
                db.add(license)
                print(f"Created license for: {product_name}")
        
        await db.commit()
        order_id = str(order.id) if hasattr(order, 'id') and order.id else 'unknown'
        print(f"Successfully provisioned services for order {order_id}")
        
    except Exception as e:
        # Get order ID safely before any rollback
        order_id = str(order.id) if hasattr(order, 'id') and order.id else 'unknown'
        print(f"Error provisioning services for order {order_id}: {e}")
        # Rollback any partial changes
        try:
            await db.rollback()
        except Exception:
            pass
        # Don't raise the exception to avoid breaking the order creation


# Schemas
class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float


class OrderCreateRequest(BaseModel):
    customer_id: str
    items: List[OrderItem]
    subtotal: float
    tax: float
    total: float
    payment_method: str
    billing_info: dict
    billing_period: Optional[str] = "monthly"  # monthly, yearly, one-time
    billing_periods: Optional[int] = 1  # Number of billing periods ordered at once
    due_date: Optional[str] = None  # ISO format date string
    discount_amount: Optional[float] = 0.0
    discount_percent: Optional[float] = 0.0
    coupon_code: Optional[str] = None


class CustomerInfo(BaseModel):
    id: str
    email: str
    full_name: str
    company_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: str
    customer_id: str
    status: str
    invoice_number: Optional[str]
    order_number: Optional[str]
    items: List[dict]
    subtotal: float
    tax: float
    total: float
    payment_method: Optional[str]
    billing_info: Optional[dict]
    billing_period: Optional[str]
    due_date: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    customer: Optional[CustomerInfo] = None
    
    class Config:
        from_attributes = True


@router.get("/stats")
async def get_order_stats(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get order statistics"""
    from datetime import datetime, timedelta
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build query
    query = select(Order)
    
    # If not admin, only count user's own orders
    if not user.is_admin:
        query = query.where(Order.customer_id == user_id)
    
    # Get all orders
    result = await db.execute(query)
    orders = result.scalars().all()
    
    # Calculate stats
    now = datetime.utcnow()
    first_day_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    
    total_invoiced = sum(order.total for order in orders)
    total_paid = sum(order.total for order in orders if order.status == OrderStatus.COMPLETED)
    total_outstanding = sum(order.total for order in orders if order.status == OrderStatus.PENDING)
    overdue_amount = 0  # Can be enhanced with due dates
    
    open_orders = sum(1 for order in orders if order.status == OrderStatus.PENDING)
    completed_orders = sum(1 for order in orders if order.status == OrderStatus.COMPLETED)
    cancelled_orders = sum(1 for order in orders if order.status == OrderStatus.CANCELLED)
    
    return {
        "total_invoiced": total_invoiced,
        "total_paid": total_paid,
        "total_outstanding": total_outstanding,
        "overdue_amount": overdue_amount,
        "open_invoices": open_orders,
        "paid_invoices": completed_orders,
        "overdue_invoices": 0,
        "partially_paid_invoices": 0
    }


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Create a new order"""
    from datetime import timedelta
    import logging
    
    logger = logging.getLogger(__name__)
    
    try:
        # Verify customer exists and matches authenticated user
        result = await db.execute(select(User).where(User.id == order_data.customer_id))
        customer = result.scalars().first()
        
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        # Ensure the authenticated user is the same as the customer_id
        if user_id != order_data.customer_id:
            raise HTTPException(status_code=403, detail="You can only create orders for yourself")
        
        # Calculate due date based on billing period
        due_date = None
        if order_data.due_date:
            # If due date is provided, use it
            try:
                due_date = datetime.fromisoformat(order_data.due_date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid due_date format")
        elif order_data.billing_period:
            # Calculate due date based on billing period
            now = datetime.utcnow()
            if order_data.billing_period == 'monthly':
                due_date = now + timedelta(days=30)
            elif order_data.billing_period == 'yearly':
                due_date = now + timedelta(days=365)
            elif order_data.billing_period == 'one-time':
                # For one-time purchases, due date is 30 days from now
                due_date = now + timedelta(days=30)
            else:
                # Default to 30 days
                due_date = now + timedelta(days=30)
        
        # Generate invoice number
        try:
            invoice_number = await generate_invoice_number(db)
            # Extract the number part from invoice (e.g., INV-0008 -> 0008)
            invoice_num = invoice_number.split('-')[1]
            order_number = f"ORD-{invoice_num}"
        except Exception as e:
            logger.error(f"Error generating invoice number: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to generate invoice number: {str(e)}")
        
        # Create order
        try:
            # Store coupon info in billing_info if coupon was applied
            billing_info = order_data.billing_info.copy() if order_data.billing_info else {}
            if order_data.coupon_code:
                billing_info['coupon_code'] = order_data.coupon_code
                billing_info['discount_amount'] = order_data.discount_amount or 0.0
                billing_info['discount_percent'] = order_data.discount_percent or 0.0
            
            new_order = Order(
                customer_id=order_data.customer_id,
                status=OrderStatus.COMPLETED,
                invoice_number=invoice_number,
                order_number=order_number,
                items=[item.dict() for item in order_data.items],
                subtotal=order_data.subtotal,
                tax=order_data.tax,
                total=order_data.total,
                payment_method=order_data.payment_method,
                billing_info=billing_info,
                billing_period=order_data.billing_period,
                due_date=due_date
            )
            
            db.add(new_order)
            await db.commit()
            await db.refresh(new_order)
        except Exception as e:
            logger.error(f"Error creating order: {e}")
            await db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")
        
        # Create linked Invoice record for this order
        try:
            invoice = Invoice(
                user_id=order_data.customer_id,
                order_id=new_order.id,  # Link invoice to order
                invoice_number=invoice_number,  # Use same invoice number
                status=InvoiceStatus.OPEN if new_order.status == OrderStatus.PENDING else InvoiceStatus.PAID,
                subtotal=order_data.subtotal,
                discount_amount=order_data.discount_amount or 0.0,
                discount_percent=order_data.discount_percent or 0.0,
                tax=order_data.tax,
                total=order_data.total,
                amount_due=order_data.total if new_order.status == OrderStatus.PENDING else 0.0,
                items=[item.dict() for item in order_data.items],
                due_date=due_date,
                is_recurring=(order_data.billing_period and order_data.billing_period != 'one-time')
            )
            db.add(invoice)
            await db.commit()
            logger.info(f"Created invoice {invoice_number} linked to order {new_order.id}")
        except Exception as e:
            logger.warning(f"Failed to create invoice for order {new_order.id}: {e}")
            # Don't fail order creation if invoice creation fails
            # Invoice can be created manually later if needed
        
        # Provision services based on order items (don't fail order creation if this fails)
        try:
            await provision_services_from_order(new_order, db)
        except Exception as e:
            # Get order ID before logging (in case of session issues)
            order_id = str(new_order.id) if hasattr(new_order, 'id') and new_order.id else 'unknown'
            logger.error(f"Error provisioning services for order {order_id}: {e}")
            # Don't raise the exception - order is already created, services can be provisioned later
        
        # Return order with customer details
        return OrderResponse(
            id=new_order.id,
            customer_id=new_order.customer_id,
            status=new_order.status.value,
            invoice_number=new_order.invoice_number,
            order_number=new_order.order_number,
            items=new_order.items,
            subtotal=new_order.subtotal,
            tax=new_order.tax,
            total=new_order.total,
            payment_method=new_order.payment_method,
            billing_info=new_order.billing_info,
            billing_period=new_order.billing_period,
            due_date=new_order.due_date,
            created_at=new_order.created_at,
            updated_at=new_order.updated_at,
            customer=CustomerInfo(
                id=customer.id,
                email=customer.email,
                full_name=customer.full_name,
                company_name=customer.company_name
            )
        )
    except HTTPException:
        # Re-raise HTTP exceptions (they already have proper status codes)
        raise
    except Exception as e:
        logger.error(f"Unexpected error creating order: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("", response_model=List[OrderResponse])
async def list_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """List orders (admin or customer's own orders)"""
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build query
    query = select(Order)
    
    # If not admin, only show user's own orders
    if not user.is_admin:
        query = query.where(Order.customer_id == user_id)
    
    # Apply filters
    if customer_id:
        query = query.where(Order.customer_id == customer_id)
    
    if status:
        try:
            order_status = OrderStatus(status)
            query = query.where(Order.status == order_status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    # Date range filters
    from datetime import timezone
    
    if start_date:
        try:
            # Handle both date-only (YYYY-MM-DD) and datetime formats
            if len(start_date) == 10:  # Date only format YYYY-MM-DD
                # Use func.date() which works with SQLite and extracts date part
                # Compare date part as string (YYYY-MM-DD format)
                query = query.where(func.date(Order.created_at) >= start_date)
                logger.info(f"Date filter: start_date '{start_date}' filtering orders from {start_date}")
            else:
                # Full datetime format
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                if start.tzinfo is None:
                    start = start.replace(tzinfo=timezone.utc)
                query = query.where(Order.created_at >= start)
                logger.info(f"Date filter: start_date '{start_date}' parsed as {start}")
        except (ValueError, AttributeError) as e:
            logger.error(f"Error parsing start_date '{start_date}': {e}")
            raise HTTPException(status_code=400, detail=f"Invalid start_date format: {str(e)}")
    
    if end_date:
        try:
            # Handle both date-only (YYYY-MM-DD) and datetime formats
            if len(end_date) == 10:  # Date only format YYYY-MM-DD
                # Use func.date() which works with SQLite and extracts date part
                # Compare date part as string (YYYY-MM-DD format)
                query = query.where(func.date(Order.created_at) <= end_date)
                logger.info(f"Date filter: end_date '{end_date}' filtering orders until {end_date}")
            else:
                # Full datetime format
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                if end.tzinfo is None:
                    end = end.replace(tzinfo=timezone.utc)
                query = query.where(Order.created_at <= end)
                logger.info(f"Date filter: end_date '{end_date}' parsed as {end}")
        except (ValueError, AttributeError) as e:
            logger.error(f"Error parsing end_date '{end_date}': {e}")
            raise HTTPException(status_code=400, detail=f"Invalid end_date format: {str(e)}")
    
    # Amount range filters
    if min_amount is not None:
        query = query.where(Order.total >= min_amount)
    
    if max_amount is not None:
        query = query.where(Order.total <= max_amount)
    
    # Get orders with customer details
    query = query.offset(skip).limit(limit).order_by(Order.created_at.desc())
    result = await db.execute(query)
    orders = result.scalars().all()
    
    # Fetch customer details for each order
    orders_with_customers = []
    for order in orders:
        result = await db.execute(select(User).where(User.id == order.customer_id))
        customer = result.scalars().first()
        
        order_response = OrderResponse(
            id=order.id,
            customer_id=order.customer_id,
            status=order.status.value,
            invoice_number=order.invoice_number,
            order_number=order.order_number,
            items=order.items,
            subtotal=order.subtotal,
            tax=order.tax,
            total=order.total,
            payment_method=order.payment_method,
            billing_info=order.billing_info,
            billing_period=order.billing_period,
            due_date=order.due_date,
            created_at=order.created_at,
            updated_at=order.updated_at,
            customer=CustomerInfo(
                id=customer.id,
                email=customer.email,
                full_name=customer.full_name,
                company_name=customer.company_name
            ) if customer else None
        )
        orders_with_customers.append(order_response)
    
    return orders_with_customers


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get order details"""
    
    # Get order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user has access to this order
    if not user.is_admin and order.customer_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Fetch customer details
    result = await db.execute(select(User).where(User.id == order.customer_id))
    customer = result.scalars().first()
    
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        status=order.status.value,
        invoice_number=order.invoice_number,
        order_number=order.order_number,
        items=order.items,
        subtotal=order.subtotal,
        tax=order.tax,
        total=order.total,
        payment_method=order.payment_method,
        billing_info=order.billing_info,
        billing_period=order.billing_period,
        due_date=order.due_date,
        created_at=order.created_at,
        updated_at=order.updated_at,
        customer=CustomerInfo(
            id=customer.id,
            email=customer.email,
            full_name=customer.full_name,
            company_name=customer.company_name
        ) if customer else None
    )


@router.patch("/{order_id}", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    status: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update order status (admin only)"""
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update status
    try:
        order.status = OrderStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    await db.commit()
    await db.refresh(order)
    
    # Fetch customer details
    result = await db.execute(select(User).where(User.id == order.customer_id))
    customer = result.scalars().first()
    
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        status=order.status.value,
        invoice_number=order.invoice_number,
        order_number=order.order_number,
        items=order.items,
        subtotal=order.subtotal,
        tax=order.tax,
        total=order.total,
        payment_method=order.payment_method,
        billing_info=order.billing_info,
        billing_period=order.billing_period,
        due_date=order.due_date,
        created_at=order.created_at,
        updated_at=order.updated_at,
        customer=CustomerInfo(
            id=customer.id,
            email=customer.email,
            full_name=customer.full_name,
            company_name=customer.company_name
        ) if customer else None
    )


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: str,
    order_data: dict,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Update order details (admin or order owner)"""
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if user has permission to update this order
    # Admin can update any order, regular users can only update their own orders
    if not user.is_admin and order.customer_id != user_id:
        raise HTTPException(status_code=403, detail="You don't have permission to update this order")
    
    # Update order fields
    if 'items' in order_data:
        order.items = order_data['items']
    
    if 'subtotal' in order_data:
        order.subtotal = order_data['subtotal']
    
    if 'tax' in order_data:
        order.tax = order_data['tax']
    
    if 'total' in order_data:
        order.total = order_data['total']
    
    if 'status' in order_data:
        try:
            order.status = OrderStatus(order_data['status'])
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {order_data['status']}")
    
    if 'payment_method' in order_data:
        order.payment_method = order_data['payment_method']
    
    if 'billing_info' in order_data:
        order.billing_info = order_data['billing_info']
    
    if 'billing_period' in order_data:
        order.billing_period = order_data['billing_period']
    
    if 'due_date' in order_data:
        try:
            order.due_date = datetime.fromisoformat(order_data['due_date'].replace('Z', '+00:00'))
        except (ValueError, TypeError):
            raise HTTPException(status_code=400, detail="Invalid due_date format")
    
    await db.commit()
    await db.refresh(order)
    
    # Fetch customer details
    result = await db.execute(select(User).where(User.id == order.customer_id))
    customer = result.scalars().first()
    
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        status=order.status.value,
        invoice_number=order.invoice_number,
        order_number=order.order_number,
        items=order.items,
        subtotal=order.subtotal,
        tax=order.tax,
        total=order.total,
        payment_method=order.payment_method,
        billing_info=order.billing_info,
        billing_period=order.billing_period,
        due_date=order.due_date,
        created_at=order.created_at,
        updated_at=order.updated_at,
        customer=CustomerInfo(
            id=customer.id,
            email=customer.email,
            full_name=customer.full_name,
            company_name=customer.company_name
        ) if customer else None
    )


@router.post("/{order_id}/pay")
async def mark_order_as_paid(
    order_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Mark order as paid (admin only)"""
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update status to completed
    order.status = OrderStatus.COMPLETED
    
    await db.commit()
    await db.refresh(order)
    
    return {"message": "Order marked as paid", "order_id": order.id}


@router.post("/{order_id}/void")
async def void_order(
    order_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Void an order (admin only)"""
    
    # Get user to check if admin
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update status to cancelled (void)
    order.status = OrderStatus.CANCELLED
    
    await db.commit()
    await db.refresh(order)
    
    return {"message": "Order voided", "order_id": order.id}


@router.options("/{order_id}/pdf")
async def download_order_pdf_options(order_id: str):
    """Handle OPTIONS preflight request for PDF download"""
    from fastapi.responses import Response
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "3600",
        }
    )

@router.get("/{order_id}/pdf")
async def download_order_pdf(
    order_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Download order as PDF (admin or order owner)"""
    
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check permission
    if not user.is_admin and order.customer_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Generate PDF using invoice service
    from fastapi.responses import Response
    from app.services.invoice_service import InvoiceService
    from app.models import InvoiceStatus
    from datetime import datetime, timedelta
    
    # Convert order to invoice format for PDF generation
    # Create a minimal invoice-like object that InvoiceService can use
    class OrderInvoice:
        def __init__(self, order):
            self.id = order.id
            self.invoice_number = order.invoice_number or order.order_number or f"ORD-{order.id[:8]}"
            self.user_id = order.customer_id
            self.status = InvoiceStatus.OPEN if order.status.value == 'pending' else InvoiceStatus.PAID
            self.subtotal = order.subtotal
            self.tax = order.tax
            self.total = order.total
            self.discount_amount = 0
            self.discount_percent = 0
            self.tax_rate = 0
            self.amount_paid = order.total if order.status.value == 'completed' else 0
            self.amount_due = order.total if order.status.value != 'completed' else 0
            self.customer_po_number = None
            self.notes = None
            self.terms = None
            self.payment_instructions = None
            self.invoice_date = order.created_at
            self.created_at = order.created_at
            self.due_date = order.due_date or (order.created_at + timedelta(days=30) if isinstance(order.created_at, datetime) else datetime.utcnow() + timedelta(days=30))
            self.billing_address = order.billing_info.get('billing_address', {}) if order.billing_info else {}
            # Convert order items to invoice items format
            self.items = []
            for item in (order.items or []):
                self.items.append({
                    'description': item.get('product_name', item.get('description', 'Item')),
                    'quantity': item.get('quantity', 1),
                    'unit_price': item.get('price', 0),
                    'amount': item.get('price', 0) * item.get('quantity', 1)
                })
    
    order_invoice = OrderInvoice(order)
    
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
    
    try:
        logger.info(f"Generating PDF for order {order_id}, invoice {order_invoice.invoice_number}")
        logger.info(f"User info: id={user.id}, email={getattr(user, 'email', 'N/A')}, full_name={getattr(user, 'full_name', 'N/A')}")
        logger.info(f"Order info: id={order.id}, customer_id={order.customer_id}, items_count={len(order.items or [])}")
        
        pdf_content = await invoice_service.generate_pdf(order_invoice, user, company_info)
        
        if not pdf_content or len(pdf_content) == 0:
            logger.error("PDF generation returned empty content")
            raise HTTPException(status_code=500, detail="PDF generation returned empty content")
        
        logger.info(f"PDF generated successfully, size: {len(pdf_content)} bytes")
        
        # Add CORS headers explicitly for PDF response
        # Note: CORS middleware should handle this, but we set explicit headers for blob responses
        response = Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=invoice-{order_invoice.invoice_number}.pdf",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Expose-Headers": "Content-Disposition, Content-Type",
            }
        )
        return response
    except HTTPException:
        # Re-raise HTTPExceptions as-is (they'll be handled by the exception handler)
        raise
    except Exception as e:
        logger.error(f"Error generating PDF: {e}", exc_info=True)
        logger.error(f"Error type: {type(e).__name__}", exc_info=True)
        # Return proper error response instead of fallback text
        # The exception handler in main.py will add CORS headers
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PDF: {str(e)}"
        )


@router.post("/{order_id}/send")
async def send_order_email(
    order_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Send order via email (admin or order owner)"""
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    import os
    
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get order
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check permission
    if not user.is_admin and order.customer_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get customer details
    result = await db.execute(select(User).where(User.id == order.customer_id))
    customer = result.scalars().first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get SMTP settings from environment variables
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME", "")
    smtp_password = os.getenv("SMTP_PASSWORD", "")
    
    # If no SMTP credentials, just log the email content
    if not smtp_username or not smtp_password:
        print("=" * 50)
        print("EMAIL WOULD BE SENT (SMTP not configured)")
        print("=" * 50)
        print(f"To: {customer.email}")
        print(f"Subject: Order Confirmation - Order #{order.id}")
        print(f"\nBody:")
        print(f"Dear {customer.full_name},")
        print(f"\nThank you for your order!")
        print(f"\nOrder Details:")
        print(f"- Order ID: {order.id}")
        print(f"- Date: {order.created_at}")
        print(f"- Total: ${order.total}")
        print(f"\nItems:")
        for item in order.items:
            print(f"- {item.get('description', 'Item')}: ${item.get('price', 0)}")
        print(f"\nTotal: ${order.total}")
        print("\nThank you for your business!")
        print("=" * 50)
        
        return {
            "message": "Order email prepared (check console for details)",
            "order_id": order.id,
            "note": "SMTP not configured. Email content printed to console."
        }
    
    # Try to send email via SMTP
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = customer.email
        msg['Subject'] = f"Order Confirmation - Order #{order.id}"
        
        # Create email body
        body = f"""
Dear {customer.full_name},

Thank you for your order!

Order Details:
- Order ID: {order.id}
- Date: {order.created_at}
- Total: ${order.total}

Items:
"""
        for item in order.items:
            body += f"- {item.get('description', 'Item')}: ${item.get('price', 0)}\n"
        
        body += f"""
Total: ${order.total}

Thank you for your business!

Best regards,
NextPanel Team
"""
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        return {
            "message": "Order email sent successfully",
            "order_id": order.id,
            "to": customer.email
        }
        
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )

