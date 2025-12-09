"""
Currency and Exchange Rate API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_user_id, verify_admin
from app.models import Currency, ExchangeRate
from app.schemas import BaseModel
from pydantic import Field
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/currencies", tags=["currencies"])


# Schemas
class CurrencyCreateRequest(BaseModel):
    code: str = Field(..., max_length=3, min_length=3)
    name: str = Field(..., max_length=100)
    symbol: str = Field(..., max_length=10)
    symbol_position: str = Field(default="before")
    exchange_rate_to_usd: float = Field(default=1.0, gt=0)
    is_base_currency: bool = False
    decimal_places: str = Field(default="2")


class CurrencyUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    symbol: Optional[str] = Field(None, max_length=10)
    symbol_position: Optional[str] = None
    exchange_rate_to_usd: Optional[float] = Field(None, gt=0)
    is_active: Optional[bool] = None
    decimal_places: Optional[str] = None


class CurrencyResponse(BaseModel):
    id: str
    code: str
    name: str
    symbol: str
    symbol_position: str
    exchange_rate_to_usd: float
    is_base_currency: bool
    is_active: bool
    decimal_places: str
    created_at: datetime
    updated_at: Optional[datetime]


class ExchangeRateCreateRequest(BaseModel):
    from_currency: str = Field(..., max_length=3)
    to_currency: str = Field(..., max_length=3)
    rate: float = Field(..., gt=0)
    date: datetime
    source: str = Field(default="manual")


class ConvertCurrencyRequest(BaseModel):
    amount: float = Field(..., gt=0)
    from_currency: str = Field(..., max_length=3)
    to_currency: str = Field(..., max_length=3)


@router.post("/", response_model=CurrencyResponse, status_code=status.HTTP_201_CREATED)
async def create_currency(
    request: CurrencyCreateRequest,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create currency (admin only)"""
    # Check if code exists
    result = await db.execute(select(Currency).where(Currency.code == request.code.upper()))
    existing = result.scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="Currency code already exists")
    
    # If setting as base, unset others
    if request.is_base_currency:
        await db.execute(
            select(Currency).where(Currency.is_base_currency == True)
            .update({"is_base_currency": False})
        )
    
    currency = Currency(
        code=request.code.upper(),
        name=request.name,
        symbol=request.symbol,
        symbol_position=request.symbol_position,
        exchange_rate_to_usd=request.exchange_rate_to_usd,
        is_base_currency=request.is_base_currency,
        decimal_places=request.decimal_places,
        is_active=True
    )
    
    db.add(currency)
    await db.commit()
    await db.refresh(currency)
    
    logger.info(f"Currency created: {currency.code} by user {user_id}")
    return currency


@router.get("/", response_model=List[CurrencyResponse])
async def list_currencies(
    is_active: Optional[bool] = Query(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """List all currencies"""
    query = select(Currency)
    
    if is_active is not None:
        query = query.where(Currency.is_active == is_active)
    
    query = query.order_by(Currency.code)
    
    result = await db.execute(query)
    currencies = result.scalars().all()
    return currencies


@router.get("/{currency_id}", response_model=CurrencyResponse)
async def get_currency(
    currency_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get currency details"""
    result = await db.execute(select(Currency).where(Currency.id == currency_id))
    currency = result.scalars().first()
    
    if not currency:
        raise HTTPException(status_code=404, detail="Currency not found")
    
    return currency


@router.put("/{currency_id}", response_model=CurrencyResponse)
async def update_currency(
    currency_id: str,
    request: CurrencyUpdateRequest,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update currency (admin only)"""
    result = await db.execute(select(Currency).where(Currency.id == currency_id))
    currency = result.scalars().first()
    
    if not currency:
        raise HTTPException(status_code=404, detail="Currency not found")
    
    # Update fields
    if request.name is not None:
        currency.name = request.name
    if request.symbol is not None:
        currency.symbol = request.symbol
    if request.symbol_position is not None:
        currency.symbol_position = request.symbol_position
    if request.exchange_rate_to_usd is not None:
        currency.exchange_rate_to_usd = request.exchange_rate_to_usd
    if request.is_active is not None:
        currency.is_active = request.is_active
    if request.decimal_places is not None:
        currency.decimal_places = request.decimal_places
    
    await db.commit()
    await db.refresh(currency)
    
    logger.info(f"Currency updated: {currency.code} by user {user_id}")
    return currency


@router.post("/convert", response_model=dict)
async def convert_currency(
    request: ConvertCurrencyRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Convert amount between currencies"""
    # Get both currencies
    from_curr_result = await db.execute(select(Currency).where(Currency.code == request.from_currency.upper()))
    from_currency = from_curr_result.scalars().first()
    
    to_curr_result = await db.execute(select(Currency).where(Currency.code == request.to_currency.upper()))
    to_currency = to_curr_result.scalars().first()
    
    if not from_currency:
        raise HTTPException(status_code=404, detail=f"Currency {request.from_currency} not found")
    if not to_currency:
        raise HTTPException(status_code=404, detail=f"Currency {request.to_currency} not found")
    
    # Convert via USD
    # From currency -> USD -> To currency
    amount_in_usd = request.amount / from_currency.exchange_rate_to_usd
    converted_amount = amount_in_usd * to_currency.exchange_rate_to_usd
    
    return {
        "from_currency": request.from_currency.upper(),
        "to_currency": request.to_currency.upper(),
        "original_amount": request.amount,
        "converted_amount": round(converted_amount, 2),
        "exchange_rate": to_currency.exchange_rate_to_usd / from_currency.exchange_rate_to_usd
    }


@router.post("/exchange-rates", response_model=dict)
async def create_exchange_rate(
    request: ExchangeRateCreateRequest,
    user_id: str = Depends(verify_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create exchange rate record (admin only)"""
    exchange_rate = ExchangeRate(
        from_currency=request.from_currency.upper(),
        to_currency=request.to_currency.upper(),
        rate=request.rate,
        date=request.date,
        source=request.source
    )
    
    db.add(exchange_rate)
    await db.commit()
    await db.refresh(exchange_rate)
    
    logger.info(f"Exchange rate created: {request.from_currency} -> {request.to_currency} by user {user_id}")
    return {
        "id": exchange_rate.id,
        "from_currency": exchange_rate.from_currency,
        "to_currency": exchange_rate.to_currency,
        "rate": exchange_rate.rate,
        "date": exchange_rate.date
    }


@router.get("/exchange-rates/history", response_model=List[dict])
async def get_exchange_rate_history(
    from_currency: str = Query(...),
    to_currency: str = Query(...),
    days: int = Query(30, ge=1, le=365),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get exchange rate history"""
    from_date = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(
        select(ExchangeRate)
        .where(
            and_(
                ExchangeRate.from_currency == from_currency.upper(),
                ExchangeRate.to_currency == to_currency.upper(),
                ExchangeRate.date >= from_date
            )
        )
        .order_by(desc(ExchangeRate.date))
    )
    rates = result.scalars().all()
    
    return [
        {
            "id": rate.id,
            "from_currency": rate.from_currency,
            "to_currency": rate.to_currency,
            "rate": rate.rate,
            "date": rate.date,
            "source": rate.source
        }
        for rate in rates
    ]

