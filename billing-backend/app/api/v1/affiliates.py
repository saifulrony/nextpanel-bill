"""
Affiliate and Referral System API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user_id, verify_admin
from app.models import Affiliate, Referral, Commission, AffiliateStatus, CommissionStatus, User, Order, Payment
from app.schemas import BaseModel
from pydantic import Field
import logging
import uuid
import secrets

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/affiliates", tags=["affiliates"])


# Schemas
class AffiliateCreateRequest(BaseModel):
    user_id: str
    commission_rate: float = Field(default=10.0, ge=0, le=100)
    commission_type: str = Field(default="percentage")
    payment_method: Optional[str] = None
    payment_details: Optional[str] = None
    minimum_payout: float = Field(default=50.0, ge=0)


class AffiliateResponse(BaseModel):
    id: str
    user_id: str
    referral_code: str
    commission_rate: float
    commission_type: str
    status: AffiliateStatus
    payment_method: Optional[str]
    minimum_payout: float
    total_referrals: int
    total_commission_earned: float
    total_commission_paid: float
    total_commission_pending: float
    joined_at: datetime
    created_at: datetime


class RegisterAffiliateRequest(BaseModel):
    payment_method: Optional[str] = None
    payment_details: Optional[str] = None


@router.post("/register", response_model=AffiliateResponse)
async def register_affiliate(
    request: RegisterAffiliateRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Register as an affiliate"""
    # Check if already registered
    result = await db.execute(select(Affiliate).where(Affiliate.user_id == user_id))
    existing = result.scalars().first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You are already registered as an affiliate")
    
    # Generate unique referral code
    referral_code = f"REF{secrets.token_hex(4).upper()}"
    
    # Ensure uniqueness
    while True:
        check_result = await db.execute(select(Affiliate).where(Affiliate.referral_code == referral_code))
        if not check_result.scalars().first():
            break
        referral_code = f"REF{secrets.token_hex(4).upper()}"
    
    affiliate = Affiliate(
        user_id=user_id,
        referral_code=referral_code,
        commission_rate=10.0,
        commission_type="percentage",
        status=AffiliateStatus.PENDING,
        payment_method=request.payment_method,
        payment_details=request.payment_details,
        minimum_payout=50.0
    )
    
    db.add(affiliate)
    await db.commit()
    await db.refresh(affiliate)
    
    logger.info(f"Affiliate registered: {referral_code} for user {user_id}")
    return affiliate


@router.get("/me", response_model=AffiliateResponse)
async def get_my_affiliate(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's affiliate information"""
    result = await db.execute(select(Affiliate).where(Affiliate.user_id == user_id))
    affiliate = result.scalars().first()
    
    if not affiliate:
        raise HTTPException(status_code=404, detail="You are not registered as an affiliate")
    
    return affiliate


@router.post("/track-referral", response_model=dict)
async def track_referral(
    referral_code: str = Query(...),
    user_id: Optional[str] = Depends(get_current_user_id),
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    referrer_url: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Track a referral (can be called by anyone)"""
    # Find affiliate
    result = await db.execute(select(Affiliate).where(Affiliate.referral_code == referral_code.upper()))
    affiliate = result.scalars().first()
    
    if not affiliate or affiliate.status != AffiliateStatus.ACTIVE:
        raise HTTPException(status_code=404, detail="Invalid referral code")
    
    # If user is logged in, create referral record
    if user_id:
        # Check if referral already exists
        existing_result = await db.execute(
            select(Referral).where(
                and_(
                    Referral.affiliate_id == affiliate.id,
                    Referral.referred_user_id == user_id
                )
            )
        )
        if existing_result.scalars().first():
            return {"message": "Referral already tracked", "referral_code": referral_code}
        
        referral = Referral(
            affiliate_id=affiliate.id,
            referred_user_id=user_id,
            referral_code_used=referral_code.upper(),
            ip_address=ip_address,
            user_agent=user_agent,
            referrer_url=referrer_url
        )
        
        db.add(referral)
        affiliate.total_referrals += 1
        await db.commit()
        
        logger.info(f"Referral tracked: {referral_code} -> user {user_id}")
        return {"message": "Referral tracked successfully", "referral_code": referral_code}
    
    return {"message": "Referral code valid", "referral_code": referral_code}


@router.post("/{affiliate_id}/approve", response_model=AffiliateResponse)
async def approve_affiliate(
    affiliate_id: str,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve affiliate (admin only)"""
    result = await db.execute(select(Affiliate).where(Affiliate.id == affiliate_id))
    affiliate = result.scalars().first()
    
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    
    affiliate.status = AffiliateStatus.ACTIVE
    await db.commit()
    await db.refresh(affiliate)
    
    logger.info(f"Affiliate approved: {affiliate.referral_code} by admin {user_id}")
    return affiliate


@router.get("/", response_model=List[AffiliateResponse])
async def list_affiliates(
    status_filter: Optional[AffiliateStatus] = Query(None, alias="status"),
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all affiliates (admin only)"""
    query = select(Affiliate)
    
    if status_filter:
        query = query.where(Affiliate.status == status_filter)
    
    query = query.order_by(Affiliate.created_at.desc())
    
    result = await db.execute(query)
    affiliates = result.scalars().all()
    return affiliates


@router.get("/{affiliate_id}/commissions", response_model=List[dict])
async def get_affiliate_commissions(
    affiliate_id: str,
    status_filter: Optional[CommissionStatus] = Query(None, alias="status"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get affiliate commissions"""
    # Check access
    result = await db.execute(select(Affiliate).where(Affiliate.id == affiliate_id))
    affiliate = result.scalars().first()
    
    if not affiliate:
        raise HTTPException(status_code=404, detail="Affiliate not found")
    
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalars().first()
    is_admin = user and getattr(user, 'is_admin', False)
    
    if not is_admin and affiliate.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = select(Commission).where(Commission.affiliate_id == affiliate_id)
    
    if status_filter:
        query = query.where(Commission.status == status_filter)
    
    query = query.order_by(Commission.earned_at.desc())
    
    result = await db.execute(query)
    commissions = result.scalars().all()
    
    return [
        {
            "id": c.id,
            "order_id": c.order_id,
            "order_amount": c.order_amount,
            "commission_rate": c.commission_rate,
            "commission_amount": c.commission_amount,
            "currency": c.currency,
            "status": c.status.value,
            "earned_at": c.earned_at,
            "paid_at": c.paid_at
        }
        for c in commissions
    ]


@router.post("/process-commission", response_model=dict)
async def process_commission(
    order_id: str,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Process commission for an order (called after payment)"""
    # Get order
    order_result = await db.execute(select(Order).where(Order.id == order_id))
    order = order_result.scalars().first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if order has a referral
    referral_result = await db.execute(
        select(Referral).where(Referral.referred_user_id == order.customer_id)
    )
    referral = referral_result.scalars().first()
    
    if not referral or not referral.converted:
        return {"message": "No referral found for this order"}
    
    # Get affiliate
    affiliate_result = await db.execute(select(Affiliate).where(Affiliate.id == referral.affiliate_id))
    affiliate = affiliate_result.scalars().first()
    
    if not affiliate or affiliate.status != AffiliateStatus.ACTIVE:
        return {"message": "Affiliate not active"}
    
    # Check if commission already exists
    existing_result = await db.execute(
        select(Commission).where(Commission.order_id == order_id)
    )
    if existing_result.scalars().first():
        return {"message": "Commission already processed"}
    
    # Calculate commission
    if affiliate.commission_type == "percentage":
        commission_amount = order.total * (affiliate.commission_rate / 100)
    else:
        commission_amount = affiliate.commission_rate  # Fixed amount
    
    # Create commission
    commission = Commission(
        affiliate_id=affiliate.id,
        referral_id=referral.id,
        order_id=order_id,
        order_amount=order.total,
        commission_rate=affiliate.commission_rate,
        commission_amount=commission_amount,
        currency=order.currency or "USD",
        status=CommissionStatus.PENDING
    )
    
    db.add(commission)
    
    # Update affiliate stats
    affiliate.total_commission_earned += commission_amount
    affiliate.total_commission_pending += commission_amount
    
    await db.commit()
    
    logger.info(f"Commission processed: ${commission_amount} for affiliate {affiliate.referral_code}")
    return {
        "message": "Commission processed",
        "commission_id": commission.id,
        "commission_amount": commission_amount
    }

