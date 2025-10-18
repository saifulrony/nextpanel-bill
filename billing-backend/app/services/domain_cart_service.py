"""
Domain Cart Service
"""
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from sqlalchemy.orm import selectinload

from app.models.domain_cart import DomainCart, DomainCartItem
from app.models import User

logger = logging.getLogger(__name__)

class DomainCartService:
    """Service for managing domain cart operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_or_create_cart(self, user_id: str, session_id: str = None) -> DomainCart:
        """Get existing cart or create new one"""
        try:
            # Try to find existing cart
            if user_id:
                result = await self.db.execute(
                    select(DomainCart)
                    .where(DomainCart.user_id == user_id)
                    .options(selectinload(DomainCart.items))
                )
                cart = result.scalar_one_or_none()
            else:
                # For guest users, use session_id
                result = await self.db.execute(
                    select(DomainCart)
                    .where(DomainCart.session_id == session_id)
                    .options(selectinload(DomainCart.items))
                )
                cart = result.scalar_one_or_none()
            
            if not cart:
                # Create new cart
                cart = DomainCart(
                    user_id=user_id,
                    session_id=session_id
                )
                self.db.add(cart)
                await self.db.commit()
                await self.db.refresh(cart)
            
            return cart
            
        except Exception as e:
            logger.error(f"Failed to get or create cart: {str(e)}")
            raise
    
    async def add_domain_to_cart(
        self, 
        user_id: str, 
        domain_name: str, 
        domain_type: str = "regular",
        price: float = 0.0,
        currency: str = "USD",
        registration_period: int = 1,
        session_id: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Add domain to cart"""
        try:
            # Get or create cart
            cart = await self.get_or_create_cart(user_id, session_id)
            
            # Check if domain already in cart
            existing_item = await self.db.execute(
                select(DomainCartItem)
                .where(
                    DomainCartItem.cart_id == cart.id,
                    DomainCartItem.domain_name == domain_name
                )
            )
            
            if existing_item.scalar_one_or_none():
                return {
                    "success": False,
                    "message": "Domain already in cart"
                }
            
            # Create cart item
            cart_item = DomainCartItem(
                cart_id=cart.id,
                user_id=user_id,
                domain_name=domain_name,
                domain_type=domain_type,
                price=price,
                currency=currency,
                registration_period=registration_period,
                **kwargs
            )
            
            self.db.add(cart_item)
            
            # Update cart totals
            await self._update_cart_totals(cart.id)
            
            await self.db.commit()
            
            return {
                "success": True,
                "message": "Domain added to cart successfully",
                "cart_item": cart_item
            }
            
        except Exception as e:
            logger.error(f"Failed to add domain to cart: {str(e)}")
            await self.db.rollback()
            return {
                "success": False,
                "message": str(e)
            }
    
    async def remove_domain_from_cart(
        self, 
        user_id: str, 
        domain_name: str,
        session_id: str = None
    ) -> Dict[str, Any]:
        """Remove domain from cart"""
        try:
            cart = await self.get_or_create_cart(user_id, session_id)
            
            # Find and delete the item
            result = await self.db.execute(
                delete(DomainCartItem)
                .where(
                    DomainCartItem.cart_id == cart.id,
                    DomainCartItem.domain_name == domain_name
                )
            )
            
            if result.rowcount == 0:
                return {
                    "success": False,
                    "message": "Domain not found in cart"
                }
            
            # Update cart totals
            await self._update_cart_totals(cart.id)
            
            await self.db.commit()
            
            return {
                "success": True,
                "message": "Domain removed from cart successfully"
            }
            
        except Exception as e:
            logger.error(f"Failed to remove domain from cart: {str(e)}")
            await self.db.rollback()
            return {
                "success": False,
                "message": str(e)
            }
    
    async def get_cart_contents(
        self, 
        user_id: str,
        session_id: str = None
    ) -> Dict[str, Any]:
        """Get cart contents"""
        try:
            cart = await self.get_or_create_cart(user_id, session_id)
            
            # Get cart items
            result = await self.db.execute(
                select(DomainCartItem)
                .where(DomainCartItem.cart_id == cart.id)
                .order_by(DomainCartItem.added_at.desc())
            )
            items = result.scalars().all()
            
            return {
                "success": True,
                "cart": cart,
                "items": items,
                "total_items": len(items),
                "total_price": sum(item.price for item in items)
            }
            
        except Exception as e:
            logger.error(f"Failed to get cart contents: {str(e)}")
            return {
                "success": False,
                "message": str(e),
                "items": [],
                "total_items": 0,
                "total_price": 0.0
            }
    
    async def clear_cart(
        self, 
        user_id: str,
        session_id: str = None
    ) -> Dict[str, Any]:
        """Clear all items from cart"""
        try:
            cart = await self.get_or_create_cart(user_id, session_id)
            
            # Delete all items
            await self.db.execute(
                delete(DomainCartItem)
                .where(DomainCartItem.cart_id == cart.id)
            )
            
            # Reset cart totals
            cart.total_items = 0
            cart.total_price = 0.0
            
            await self.db.commit()
            
            return {
                "success": True,
                "message": "Cart cleared successfully"
            }
            
        except Exception as e:
            logger.error(f"Failed to clear cart: {str(e)}")
            await self.db.rollback()
            return {
                "success": False,
                "message": str(e)
            }
    
    async def _update_cart_totals(self, cart_id: str):
        """Update cart totals"""
        try:
            # Count items and calculate total
            result = await self.db.execute(
                select(
                    func.count(DomainCartItem.id).label('total_items'),
                    func.sum(DomainCartItem.price).label('total_price')
                )
                .where(DomainCartItem.cart_id == cart_id)
            )
            
            totals = result.first()
            
            # Update cart
            cart_result = await self.db.execute(
                select(DomainCart)
                .where(DomainCart.id == cart_id)
            )
            cart = cart_result.scalar_one()
            
            cart.total_items = totals.total_items or 0
            cart.total_price = float(totals.total_price or 0)
            
        except Exception as e:
            logger.error(f"Failed to update cart totals: {str(e)}")
            raise
