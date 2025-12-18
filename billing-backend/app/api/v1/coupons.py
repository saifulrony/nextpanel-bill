"""
Coupon/Promotional Code API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user_id, verify_admin
from app.models import Coupon, CouponUsage, CouponType, CouponStatus, User, Order, Invoice
from app.schemas import BaseModel
from pydantic import Field
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/coupons", tags=["coupons"])


# Schemas
class CouponCreateRequest(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    coupon_type: CouponType
    discount_value: float = Field(..., gt=0)
    minimum_purchase: float = Field(default=0.0, ge=0)
    maximum_discount: Optional[float] = None
    usage_limit: Optional[int] = Field(None, gt=0)
    usage_limit_per_user: int = Field(default=1, gt=0)
    valid_from: datetime
    valid_until: Optional[datetime] = None
    applicable_to_products: Optional[str] = None
    applicable_to_categories: Optional[str] = None
    first_time_customers_only: bool = False
    first_billing_period_only: bool = False


class CouponUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    discount_value: Optional[float] = Field(None, gt=0)
    minimum_purchase: Optional[float] = Field(None, ge=0)
    maximum_discount: Optional[float] = None
    usage_limit: Optional[int] = Field(None, gt=0)
    usage_limit_per_user: Optional[int] = Field(None, gt=0)
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    status: Optional[CouponStatus] = None
    applicable_to_products: Optional[str] = None
    applicable_to_categories: Optional[str] = None
    first_time_customers_only: Optional[bool] = None
    first_billing_period_only: Optional[bool] = None


class CouponResponse(BaseModel):
    id: str
    code: str
    name: str
    description: Optional[str]
    coupon_type: CouponType
    discount_value: float
    minimum_purchase: float
    maximum_discount: Optional[float]
    usage_limit: Optional[int]
    usage_count: int
    usage_limit_per_user: int
    valid_from: datetime
    valid_until: Optional[datetime]
    status: CouponStatus
    applicable_to_products: Optional[str]
    applicable_to_categories: Optional[str]
    first_time_customers_only: bool
    first_billing_period_only: bool
    created_at: datetime
    updated_at: Optional[datetime]


class CouponValidateRequest(BaseModel):
    code: str
    order_amount: float = Field(..., ge=0)
    user_id: Optional[str] = None
    product_ids: Optional[List[str]] = None


class CouponValidateResponse(BaseModel):
    valid: bool
    coupon: Optional[CouponResponse] = None
    discount_amount: float = 0.0
    message: str


@router.post("/", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
async def create_coupon(
    request: CouponCreateRequest,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new coupon (admin only)"""
    # Check if code already exists
    result = await db.execute(select(Coupon).where(Coupon.code == request.code.upper()))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon = Coupon(
        code=request.code.upper(),
        name=request.name,
        description=request.description,
        coupon_type=request.coupon_type,
        discount_value=request.discount_value,
        minimum_purchase=request.minimum_purchase,
        maximum_discount=request.maximum_discount,
        usage_limit=request.usage_limit,
        usage_limit_per_user=request.usage_limit_per_user,
        valid_from=request.valid_from,
        valid_until=request.valid_until,
        applicable_to_products=request.applicable_to_products,
        applicable_to_categories=request.applicable_to_categories,
        first_time_customers_only=request.first_time_customers_only,
        first_billing_period_only=request.first_billing_period_only,
        created_by=user_id,
        status=CouponStatus.ACTIVE
    )
    
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    
    logger.info(f"Coupon created: {coupon.code} by user {user_id}")
    return coupon


@router.get("/", response_model=List[CouponResponse])
async def list_coupons(
    status_filter: Optional[CouponStatus] = Query(None, alias="status"),
    search: Optional[str] = None,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all coupons (admin only)"""
    query = select(Coupon)
    
    if status_filter:
        query = query.where(Coupon.status == status_filter)
    
    if search:
        query = query.where(
            or_(
                Coupon.code.ilike(f"%{search}%"),
                Coupon.name.ilike(f"%{search}%")
            )
        )
    
    query = query.order_by(Coupon.created_at.desc())
    
    result = await db.execute(query)
    coupons = result.scalars().all()
    return coupons


@router.get("/{coupon_id}", response_model=CouponResponse)
async def get_coupon(
    coupon_id: str,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get coupon details (admin only)"""
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalars().first()
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    return coupon


@router.put("/{coupon_id}", response_model=CouponResponse)
async def update_coupon(
    coupon_id: str,
    request: CouponUpdateRequest,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update coupon (admin only)"""
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalars().first()
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    # Update fields
    if request.name is not None:
        coupon.name = request.name
    if request.description is not None:
        coupon.description = request.description
    if request.discount_value is not None:
        coupon.discount_value = request.discount_value
    if request.minimum_purchase is not None:
        coupon.minimum_purchase = request.minimum_purchase
    if request.maximum_discount is not None:
        coupon.maximum_discount = request.maximum_discount
    if request.usage_limit is not None:
        coupon.usage_limit = request.usage_limit
    if request.usage_limit_per_user is not None:
        coupon.usage_limit_per_user = request.usage_limit_per_user
    if request.valid_from is not None:
        coupon.valid_from = request.valid_from
    if request.valid_until is not None:
        coupon.valid_until = request.valid_until
    if request.status is not None:
        coupon.status = request.status
    if request.applicable_to_products is not None:
        coupon.applicable_to_products = request.applicable_to_products
    if request.applicable_to_categories is not None:
        coupon.applicable_to_categories = request.applicable_to_categories
    if request.first_time_customers_only is not None:
        coupon.first_time_customers_only = request.first_time_customers_only
    if request.first_billing_period_only is not None:
        coupon.first_billing_period_only = request.first_billing_period_only
    
    await db.commit()
    await db.refresh(coupon)
    
    logger.info(f"Coupon updated: {coupon.code} by user {user_id}")
    return coupon


@router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_coupon(
    coupon_id: str,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete coupon (admin only)"""
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalars().first()
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    await db.delete(coupon)
    await db.commit()
    
    logger.info(f"Coupon deleted: {coupon.code} by user {user_id}")


@router.post("/validate", response_model=CouponValidateResponse)
async def validate_coupon(
    request: CouponValidateRequest,
    user_id: Optional[str] = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Validate and calculate discount for a coupon code"""
    # Find coupon
    result = await db.execute(select(Coupon).where(Coupon.code == request.code.upper()))
    coupon = result.scalars().first()
    
    if not coupon:
        return CouponValidateResponse(
            valid=False,
            message="Invalid coupon code"
        )
    
    # Check status
    if coupon.status != CouponStatus.ACTIVE:
        return CouponValidateResponse(
            valid=False,
            message="Coupon is not active"
        )
    
    # Check validity dates
    now = datetime.utcnow()
    if coupon.valid_from > now:
        return CouponValidateResponse(
            valid=False,
            message="Coupon is not yet valid"
        )
    
    if coupon.valid_until and coupon.valid_until < now:
        return CouponValidateResponse(
            valid=False,
            message="Coupon has expired"
        )
    
    # Check usage limit
    if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
        return CouponValidateResponse(
            valid=False,
            message="Coupon usage limit reached"
        )
    
    # Check minimum purchase
    if request.order_amount < coupon.minimum_purchase:
        return CouponValidateResponse(
            valid=False,
            message=f"Minimum purchase amount of ${coupon.minimum_purchase:.2f} required"
        )
    
    # Check user-specific limits
    if user_id:
        # Check if user has already used this coupon
        usage_count = await db.execute(
            select(func.count(CouponUsage.id))
            .where(
                and_(
                    CouponUsage.coupon_id == coupon.id,
                    CouponUsage.user_id == user_id
                )
            )
        )
        user_usage_count = usage_count.scalar() or 0
        
        if user_usage_count >= coupon.usage_limit_per_user:
            return CouponValidateResponse(
                valid=False,
                message="You have already used this coupon"
            )
        
        # Check first-time customers only
        if coupon.first_time_customers_only:
            # Check if user has any previous orders
            order_count = await db.execute(
                select(func.count(Order.id))
                .where(Order.customer_id == user_id)
            )
            if (order_count.scalar() or 0) > 0:
                return CouponValidateResponse(
                    valid=False,
                    message="This coupon is only for first-time customers"
                )
    
    # Calculate discount
    if coupon.coupon_type == CouponType.PERCENTAGE:
        discount_amount = request.order_amount * (coupon.discount_value / 100)
        if coupon.maximum_discount:
            discount_amount = min(discount_amount, coupon.maximum_discount)
    elif coupon.coupon_type == CouponType.FIXED_AMOUNT:
        discount_amount = min(coupon.discount_value, request.order_amount)
    else:  # FREE_SHIPPING
        discount_amount = 0.0  # Would need shipping amount
    
    # Convert coupon to response
    coupon_response = CouponResponse(
        id=coupon.id,
        code=coupon.code,
        name=coupon.name,
        description=coupon.description,
        coupon_type=coupon.coupon_type,
        discount_value=coupon.discount_value,
        minimum_purchase=coupon.minimum_purchase,
        maximum_discount=coupon.maximum_discount,
        usage_limit=coupon.usage_limit,
        usage_count=coupon.usage_count,
        usage_limit_per_user=coupon.usage_limit_per_user,
        valid_from=coupon.valid_from,
        valid_until=coupon.valid_until,
        status=coupon.status,
        applicable_to_products=coupon.applicable_to_products,
        applicable_to_categories=coupon.applicable_to_categories,
        first_time_customers_only=coupon.first_time_customers_only,
        first_billing_period_only=coupon.first_billing_period_only,
        created_at=coupon.created_at,
        updated_at=coupon.updated_at
    )
    
    return CouponValidateResponse(
        valid=True,
        coupon=coupon_response,
        discount_amount=round(discount_amount, 2),
        message="Coupon is valid"
    )


@router.get("/{coupon_id}/usage", response_model=List[dict])
async def get_coupon_usage(
    coupon_id: str,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get coupon usage history (admin only)"""
    result = await db.execute(
        select(CouponUsage)
        .where(CouponUsage.coupon_id == coupon_id)
        .order_by(CouponUsage.used_at.desc())
    )
    usages = result.scalars().all()
    
    return [
        {
            "id": usage.id,
            "user_id": usage.user_id,
            "order_id": usage.order_id,
            "invoice_id": usage.invoice_id,
            "discount_amount": usage.discount_amount,
            "used_at": usage.used_at
        }
        for usage in usages
    ]

