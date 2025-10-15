"""
Page Builder API
Manages dynamic pages with components
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from uuid import UUID
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.page import Page
from app.schemas.page import PageCreate, PageUpdate, PageResponse
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pages", tags=["pages"])


@router.get("/", response_model=List[PageResponse])
async def list_pages(
    db: AsyncSession = Depends(get_db),
    is_active: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """List all pages"""
    try:
        query = select(Page)
        
        if is_active:
            query = query.where(Page.is_active == is_active)
        
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        pages = result.scalars().all()
        
        # Use custom from_orm to parse JSON strings
        return [PageResponse.from_orm(page) for page in pages]
    except Exception as e:
        logger.error(f"Error listing pages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list pages"
        )


@router.get("/homepage", response_model=Optional[PageResponse])
async def get_homepage(
    db: AsyncSession = Depends(get_db)
):
    """Get the current homepage"""
    try:
        result = await db.execute(
            select(Page).where(Page.is_homepage == True)
        )
        page = result.scalar_one_or_none()
        
        if not page:
            return None
        
        return PageResponse.from_orm(page)
    except Exception as e:
        logger.error(f"Error getting homepage: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get homepage"
        )


@router.post("/homepage/{slug}", response_model=PageResponse)
async def set_homepage(
    slug: str,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Set a page as the homepage"""
    try:
        # First, unset any existing homepage
        await db.execute(
            update(Page).where(Page.is_homepage == True).values(is_homepage=False)
        )
        
        # Find the page to set as homepage
        result = await db.execute(
            select(Page).where(Page.slug == slug)
        )
        page = result.scalar_one_or_none()
        
        if not page:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Page with slug '{slug}' not found"
            )
        
        # Set as homepage
        page.is_homepage = True
        await db.commit()
        await db.refresh(page)
        
        logger.info(f"Homepage set to: {slug} by user {user_id}")
        return PageResponse.from_orm(page)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting homepage: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set homepage"
        )


@router.delete("/homepage", status_code=status.HTTP_204_NO_CONTENT)
async def unset_homepage(
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Remove homepage setting (revert to default homepage)"""
    try:
        await db.execute(
            update(Page).where(Page.is_homepage == True).values(is_homepage=False)
        )
        await db.commit()
        
        logger.info(f"Homepage unset by user {user_id}")
        return None
    except Exception as e:
        logger.error(f"Error unsetting homepage: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unset homepage"
        )


@router.get("/{slug}", response_model=PageResponse)
async def get_page_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a page by slug"""
    try:
        result = await db.execute(
            select(Page).where(Page.slug == slug)
        )
        page = result.scalar_one_or_none()
        
        if not page:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Page with slug '{slug}' not found"
            )
        
        # Use custom from_orm to parse JSON strings
        return PageResponse.from_orm(page)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting page: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get page"
        )


@router.post("/", response_model=PageResponse, status_code=status.HTTP_201_CREATED)
async def create_page(
    page_data: PageCreate,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Create a new page"""
    try:
        # Check if slug already exists
        existing = await db.execute(
            select(Page).where(Page.slug == page_data.slug)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Page with slug '{page_data.slug}' already exists"
            )
        
        # Create new page (convert components to JSON string for SQLite)
        import json
        page_dict = page_data.model_dump()
        page_dict['components'] = json.dumps(page_dict['components'])
        page_dict['page_metadata'] = json.dumps(page_dict.get('metadata', {}))
        
        page = Page(**page_dict)
        db.add(page)
        await db.commit()
        await db.refresh(page)
        
        logger.info(f"Page created: {page.slug} by user {user_id}")
        return PageResponse.from_orm(page)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating page: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create page"
        )


@router.put("/{slug}", response_model=PageResponse)
async def update_page(
    slug: str,
    page_data: PageUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Update a page"""
    try:
        result = await db.execute(
            select(Page).where(Page.slug == slug)
        )
        page = result.scalar_one_or_none()
        
        if not page:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Page with slug '{slug}' not found"
            )
        
        # Update fields (convert components to JSON string for SQLite)
        import json
        update_data = page_data.model_dump(exclude_unset=True)
        if 'components' in update_data:
            update_data['components'] = json.dumps(update_data['components'])
        if 'metadata' in update_data:
            update_data['page_metadata'] = json.dumps(update_data['metadata'])
            del update_data['metadata']
        
        for field, value in update_data.items():
            setattr(page, field, value)
        
        await db.commit()
        await db.refresh(page)
        
        logger.info(f"Page updated: {page.slug} by user {user_id}")
        return PageResponse.from_orm(page)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating page: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update page"
        )


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page(
    slug: str,
    db: AsyncSession = Depends(get_db),
    user_id: UUID = Depends(get_current_user_id)
):
    """Delete a page"""
    try:
        result = await db.execute(
            select(Page).where(Page.slug == slug)
        )
        page = result.scalar_one_or_none()
        
        if not page:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Page with slug '{slug}' not found"
            )
        
        await db.delete(page)
        await db.commit()
        
        logger.info(f"Page deleted: {slug} by user {user_id}")
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting page: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete page"
        )