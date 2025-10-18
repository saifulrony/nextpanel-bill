"""
Domain Cart API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.services.domain_cart_service import DomainCartService
from app.core.security import get_current_user_id

router = APIRouter()

class AddToCartRequest(BaseModel):
    domain_name: str
    domain_type: str = "regular"
    price: float
    currency: str = "USD"
    registration_period: int = 1
    auction_end_time: Optional[str] = None
    current_bid: Optional[float] = None
    premium_type: Optional[str] = None
    description: Optional[str] = None

class RemoveFromCartRequest(BaseModel):
    domain_name: str

@router.get("/")
async def get_cart(
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get cart contents"""
    try:
        # Get session ID for guest users
        session_id = request.cookies.get('session_id')
        
        cart_service = DomainCartService(db)
        result = await cart_service.get_cart_contents(user_id, session_id)
        
        if not result.get('success', False):
            raise HTTPException(status_code=400, detail=result.get('message', 'Failed to get cart'))
        
        return {
            "success": True,
            "data": result,
            "message": "Cart retrieved successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get cart: {str(e)}")

@router.post("/add")
async def add_to_cart(
    request: AddToCartRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Add domain to cart"""
    try:
        cart_service = DomainCartService(db)
        
        # Prepare additional data
        additional_data = {}
        if request.auction_end_time:
            additional_data['auction_end_time'] = request.auction_end_time
        if request.current_bid:
            additional_data['current_bid'] = request.current_bid
        if request.premium_type:
            additional_data['premium_type'] = request.premium_type
        if request.description:
            additional_data['description'] = request.description
        
        result = await cart_service.add_domain_to_cart(
            user_id=user_id,
            domain_name=request.domain_name,
            domain_type=request.domain_type,
            price=request.price,
            currency=request.currency,
            registration_period=request.registration_period,
            **additional_data
        )
        
        if not result.get('success', False):
            raise HTTPException(status_code=400, detail=result.get('message', 'Failed to add to cart'))
        
        return {
            "success": True,
            "data": result,
            "message": "Domain added to cart successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add to cart: {str(e)}")

@router.post("/remove")
async def remove_from_cart(
    request: RemoveFromCartRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Remove domain from cart"""
    try:
        cart_service = DomainCartService(db)
        result = await cart_service.remove_domain_from_cart(
            user_id=user_id,
            domain_name=request.domain_name
        )
        
        if not result.get('success', False):
            raise HTTPException(status_code=400, detail=result.get('message', 'Failed to remove from cart'))
        
        return {
            "success": True,
            "data": result,
            "message": "Domain removed from cart successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove from cart: {str(e)}")

@router.delete("/clear")
async def clear_cart(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Clear all items from cart"""
    try:
        cart_service = DomainCartService(db)
        result = await cart_service.clear_cart(user_id)
        
        if not result.get('success', False):
            raise HTTPException(status_code=400, detail=result.get('message', 'Failed to clear cart'))
        
        return {
            "success": True,
            "data": result,
            "message": "Cart cleared successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cart: {str(e)}")
