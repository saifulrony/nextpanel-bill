"""
Orders API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import Order, OrderStatus, User
from pydantic import BaseModel, Field

router = APIRouter()


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
    due_date: Optional[str] = None  # ISO format date string


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
    db: AsyncSession = Depends(get_db)
):
    """Create a new order"""
    from datetime import timedelta
    
    # Verify customer exists
    result = await db.execute(select(User).where(User.id == order_data.customer_id))
    customer = result.scalars().first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
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
    invoice_number = await generate_invoice_number(db)
    # Extract the number part from invoice (e.g., INV-0008 -> 0008)
    invoice_num = invoice_number.split('-')[1]
    order_number = f"ORD-{invoice_num}"
    
    # Create order
    new_order = Order(
        customer_id=order_data.customer_id,
        status=OrderStatus.PENDING,
        invoice_number=invoice_number,
        order_number=order_number,
        items=[item.dict() for item in order_data.items],
        subtotal=order_data.subtotal,
        tax=order_data.tax,
        total=order_data.total,
        payment_method=order_data.payment_method,
        billing_info=order_data.billing_info,
        billing_period=order_data.billing_period,
        due_date=due_date
    )
    
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)
    
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
    if start_date:
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.where(Order.created_at >= start)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.where(Order.created_at <= end)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")
    
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
    
    # For now, return a simple text response
    # In production, you would generate a PDF using a library like reportlab or weasyprint
    from fastapi.responses import Response
    
    pdf_content = f"""
    ORDER INVOICE
    =============
    
    Order ID: {order.id}
    Date: {order.created_at}
    
    Items:
    """
    
    for item in order.items:
        pdf_content += f"- {item.get('description', 'Item')}: ${item.get('price', 0)}\n"
    
    pdf_content += f"""
    Subtotal: ${order.subtotal}
    Tax: ${order.tax}
    Total: ${order.total}
    """
    
    return Response(
        content=pdf_content,
        media_type="text/plain",
        headers={
            "Content-Disposition": f"attachment; filename=order-{order.id}.txt"
        }
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

