"""
Products API endpoints - Alias for Plans
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import Plan
from app.schemas import PlanResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=List[PlanResponse])
async def list_products(
    db: AsyncSession = Depends(get_db),
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_featured: Optional[bool] = None
):
    """List all products (alias for plans)"""
    try:
        query = select(Plan)
        
        # Apply filters
        if category:
            query = query.where(Plan.category == category)
        if is_active is not None:
            query = query.where(Plan.is_active == is_active)
        if is_featured is not None:
            query = query.where(Plan.is_featured == is_featured)
        
        # Order by featured first, then by name
        query = query.order_by(Plan.is_featured.desc(), Plan.name.asc())
        
        result = await db.execute(query)
        plans = result.scalars().all()
        
        logger.info(f"Retrieved {len(plans)} products")
        return plans
        
    except Exception as e:
        logger.error(f"Error retrieving products: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve products"
        )


@router.get("/{product_id}", response_model=PlanResponse)
async def get_product(
    product_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific product by ID"""
    try:
        result = await db.execute(select(Plan).where(Plan.id == product_id))
        plan = result.scalars().first()
        
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        return plan
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving product {product_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve product"
        )
