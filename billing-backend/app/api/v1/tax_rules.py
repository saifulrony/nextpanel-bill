"""
Tax Rules API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user_id, verify_admin
from app.models import TaxRule, TaxExemption, TaxType, TaxRuleType, User
from app.schemas import BaseModel
from pydantic import Field
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tax-rules", tags=["tax-rules"])


# Schemas
class TaxRuleCreateRequest(BaseModel):
    name: str = Field(..., max_length=255)
    tax_type: TaxType
    rule_type: TaxRuleType
    rate: float = Field(..., gt=0, le=100)
    country_code: Optional[str] = Field(None, max_length=2)
    state_code: Optional[str] = Field(None, max_length=10)
    city: Optional[str] = Field(None, max_length=100)
    applicable_to_products: Optional[str] = None
    applicable_to_categories: Optional[str] = None
    customer_tax_id_required: bool = False
    priority: str = Field(default="0")
    is_compound: bool = False


class TaxRuleResponse(BaseModel):
    id: str
    name: str
    tax_type: TaxType
    rule_type: TaxRuleType
    rate: float
    country_code: Optional[str]
    state_code: Optional[str]
    city: Optional[str]
    applicable_to_products: Optional[str]
    applicable_to_categories: Optional[str]
    customer_tax_id_required: bool
    priority: str
    is_active: bool
    is_compound: bool
    created_at: datetime
    updated_at: Optional[datetime]


class TaxExemptionCreateRequest(BaseModel):
    user_id: str
    tax_rule_id: Optional[str] = None
    exemption_reason: Optional[str] = None
    tax_id: Optional[str] = Field(None, max_length=100)
    certificate_file: Optional[str] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None


@router.post("/", response_model=TaxRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_tax_rule(
    request: TaxRuleCreateRequest,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create tax rule (admin only)"""
    tax_rule = TaxRule(
        name=request.name,
        tax_type=request.tax_type,
        rule_type=request.rule_type,
        rate=request.rate,
        country_code=request.country_code,
        state_code=request.state_code,
        city=request.city,
        applicable_to_products=request.applicable_to_products,
        applicable_to_categories=request.applicable_to_categories,
        customer_tax_id_required=request.customer_tax_id_required,
        priority=request.priority,
        is_compound=request.is_compound,
        is_active=True
    )
    
    db.add(tax_rule)
    await db.commit()
    await db.refresh(tax_rule)
    
    logger.info(f"Tax rule created: {tax_rule.name} by user {user_id}")
    return tax_rule


@router.get("/", response_model=List[TaxRuleResponse])
async def list_tax_rules(
    tax_type: Optional[TaxType] = Query(None),
    rule_type: Optional[TaxRuleType] = Query(None),
    country_code: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """List tax rules (admin only)"""
    query = select(TaxRule)
    
    if tax_type:
        query = query.where(TaxRule.tax_type == tax_type)
    if rule_type:
        query = query.where(TaxRule.rule_type == rule_type)
    if country_code:
        query = query.where(TaxRule.country_code == country_code.upper())
    if is_active is not None:
        query = query.where(TaxRule.is_active == is_active)
    
    query = query.order_by(TaxRule.priority.desc(), TaxRule.created_at.desc())
    
    result = await db.execute(query)
    rules = result.scalars().all()
    return rules


@router.get("/calculate", response_model=dict)
async def calculate_tax(
    amount: float = Query(..., gt=0),
    country_code: Optional[str] = Query(None),
    state_code: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    product_ids: Optional[str] = Query(None),
    user_auth_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Calculate tax for an amount based on applicable rules"""
    query = select(TaxRule).where(TaxRule.is_active == True)
    
    # Build conditions
    conditions = []
    if country_code:
        conditions.append(
            or_(
                TaxRule.country_code == country_code.upper(),
                TaxRule.country_code.is_(None)
            )
        )
    if state_code:
        conditions.append(
            or_(
                TaxRule.state_code == state_code,
                TaxRule.state_code.is_(None)
            )
        )
    if city:
        conditions.append(
            or_(
                TaxRule.city == city,
                TaxRule.city.is_(None)
            )
        )
    
    if conditions:
        from sqlalchemy import and_
        query = query.where(and_(*conditions))
    
    # Order by priority
    query = query.order_by(TaxRule.priority.desc())
    
    result = await db.execute(query)
    applicable_rules = result.scalars().all()
    
    if not applicable_rules:
        return {
            "tax_amount": 0.0,
            "tax_rate": 0.0,
            "applicable_rules": []
        }
    
    # Check for exemptions
    if user_id:
        exemption_result = await db.execute(
            select(TaxExemption)
            .where(
                and_(
                    TaxExemption.user_id == user_id,
                    TaxExemption.is_active == True
                )
            )
        )
        exemptions = exemption_result.scalars().all()
        exempt_rule_ids = {ex.tax_rule_id for ex in exemptions if ex.tax_rule_id}
        
        # Filter out exempt rules
        applicable_rules = [r for r in applicable_rules if r.id not in exempt_rule_ids]
    
    if not applicable_rules:
        return {
            "tax_amount": 0.0,
            "tax_rate": 0.0,
            "applicable_rules": []
        }
    
    # Calculate tax (use highest priority rule, or compound if enabled)
    total_tax = 0.0
    taxable_amount = amount
    
    for rule in applicable_rules:
        rule_tax = taxable_amount * (rule.rate / 100)
        total_tax += rule_tax
        
        if rule.is_compound:
            taxable_amount += rule_tax  # Tax on tax
    
    return {
        "tax_amount": round(total_tax, 2),
        "tax_rate": sum(r.rate for r in applicable_rules),
        "applicable_rules": [
            {
                "id": r.id,
                "name": r.name,
                "rate": r.rate,
                "tax_type": r.tax_type.value
            }
            for r in applicable_rules
        ]
    }


@router.post("/exemptions", response_model=dict)
async def create_tax_exemption(
    request: TaxExemptionCreateRequest,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create tax exemption (admin only)"""
    exemption = TaxExemption(
        user_id=request.user_id,
        tax_rule_id=request.tax_rule_id,
        exemption_reason=request.exemption_reason,
        tax_id=request.tax_id,
        certificate_file=request.certificate_file,
        valid_from=request.valid_from or datetime.utcnow(),
        valid_until=request.valid_until,
        is_active=True
    )
    
    db.add(exemption)
    await db.commit()
    await db.refresh(exemption)
    
    logger.info(f"Tax exemption created for user {request.user_id} by admin {user_id}")
    return {
        "id": exemption.id,
        "user_id": exemption.user_id,
        "tax_rule_id": exemption.tax_rule_id,
        "is_active": exemption.is_active
    }


@router.get("/exemptions", response_model=List[dict])
async def list_tax_exemptions(
    user_id_filter: Optional[str] = Query(None, alias="user_id"),
    admin_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """List tax exemptions (admin only)"""
    query = select(TaxExemption)
    
    if user_id_filter:
        query = query.where(TaxExemption.user_id == user_id_filter)
    
    query = query.order_by(TaxExemption.created_at.desc())
    
    result = await db.execute(query)
    exemptions = result.scalars().all()
    
    return [
        {
            "id": ex.id,
            "user_id": ex.user_id,
            "tax_rule_id": ex.tax_rule_id,
            "exemption_reason": ex.exemption_reason,
            "tax_id": ex.tax_id,
            "valid_from": ex.valid_from,
            "valid_until": ex.valid_until,
            "is_active": ex.is_active
        }
        for ex in exemptions
    ]

