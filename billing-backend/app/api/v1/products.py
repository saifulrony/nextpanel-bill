"""
Products API endpoints - Alias for Plans
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import Plan, User
from app.schemas import PlanResponse
from app.api.v1.auth import get_current_user
import logging
import os
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/products", tags=["products"])

# Directory to store uploaded product files
# Get the project root directory (go up 5 levels from app/api/v1/products.py)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
PRODUCT_FILES_DIR = os.path.join(BASE_DIR, "uploads", "products")

# Try to create directory, fallback to /tmp if permission denied
try:
    os.makedirs(PRODUCT_FILES_DIR, exist_ok=True, mode=0o755)
    logger.info(f"Product files directory initialized: {PRODUCT_FILES_DIR}")
except (PermissionError, OSError) as e:
    PRODUCT_FILES_DIR = os.path.join("/tmp", "nextpanel_uploads", "products")
    try:
        os.makedirs(PRODUCT_FILES_DIR, exist_ok=True, mode=0o755)
        logger.warning(f"Using /tmp for product file uploads due to permission error: {e}")
    except Exception as e2:
        logger.error(f"Failed to create product files directory in /tmp: {e2}")
        raise


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


@router.post("/{product_id}/upload-file")
async def upload_product_file(
    product_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a file attachment for a product (e.g., software download)
    Only admins can upload files
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can upload product files"
        )
    
    # Get the product - try to find it, with retry logic for race conditions
    product = None
    for attempt in range(3):  # Try up to 3 times with small delays
        result = await db.execute(select(Plan).where(Plan.id == product_id))
        product = result.scalars().first()
        if product:
            break
        if attempt < 2:  # Don't wait on last attempt
            import asyncio
            await asyncio.sleep(0.2)  # Wait 200ms between attempts
    
    if not product:
        logger.error(f"Product not found after 3 attempts. Product ID: {product_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product not found (ID: {product_id})"
        )
    
    # Ensure directory exists
    try:
        os.makedirs(PRODUCT_FILES_DIR, exist_ok=True, mode=0o755)
        logger.info(f"Product files directory: {PRODUCT_FILES_DIR}")
    except Exception as e:
        logger.error(f"Failed to create product files directory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create upload directory: {str(e)}"
        )
    
    # Validate file size (max 500MB) - read in chunks to handle large files
    content = b""
    file_size = 0
    max_size = 500 * 1024 * 1024  # 500MB
    
    try:
        while True:
            chunk = await file.read(1024 * 1024)  # Read 1MB chunks
            if not chunk:
                break
            content += chunk
            file_size += len(chunk)
            if file_size > max_size:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File size must be less than 500MB"
                )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read file: {str(e)}"
        )
    
    # Note: We already have the content, no need to seek
    
    # Generate filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
    safe_filename = file.filename.replace(' ', '_').replace('/', '_').replace('\\', '_').replace('..', '_')
    filename = f"{product_id}_{timestamp}_{safe_filename}"
    filepath = os.path.join(PRODUCT_FILES_DIR, filename)
    
    # Save file
    try:
        with open(filepath, "wb") as buffer:
            buffer.write(content)
        logger.info(f"File saved successfully to: {filepath}")
        
        # Verify file was written
        if not os.path.exists(filepath):
            raise Exception("File was not created after write operation")
        
        file_stat = os.stat(filepath)
        if file_stat.st_size != len(content):
            raise Exception(f"File size mismatch: expected {len(content)}, got {file_stat.st_size}")
        
        logger.info(f"File verified: {file_stat.st_size} bytes written to {filepath}")
    except Exception as e:
        logger.error(f"Failed to save file to {filepath}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Update product features with file info
    try:
        if not product.features:
            product.features = {}
        
        # Store file info in features
        file_info = {
            "filename": file.filename,
            "stored_filename": filename,
            "file_path": f"/uploads/products/{filename}",
            "file_size": len(content),
            "content_type": file.content_type or "application/octet-stream",
            "uploaded_at": datetime.now().isoformat()
        }
        
        # If there's already a file, replace it (or we could support multiple files)
        product.features["download_file"] = file_info
        
        # Update the product in database
        await db.commit()
        await db.refresh(product)
        
        logger.info(f"Uploaded file for product {product_id}: {filename} (size: {len(content)} bytes)")
        logger.info(f"File info saved to product features: {file_info}")
        
        return {
            "message": "File uploaded successfully",
            "file_info": file_info
        }
    except Exception as e:
        logger.error(f"Failed to update product with file info: {e}")
        # Try to clean up the uploaded file if database update fails
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                logger.info(f"Cleaned up file after database error: {filepath}")
        except Exception as cleanup_error:
            logger.error(f"Failed to clean up file: {cleanup_error}")
        
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file information to database: {str(e)}"
        )


@router.delete("/{product_id}/file")
async def delete_product_file(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete the attached file for a product
    Only admins can delete files
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete product files"
        )
    
    # Get the product
    result = await db.execute(select(Plan).where(Plan.id == product_id))
    product = result.scalars().first()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Remove file from filesystem if it exists
    if product.features and "download_file" in product.features:
        file_info = product.features["download_file"]
        stored_filename = file_info.get("stored_filename")
        if stored_filename:
            filepath = os.path.join(PRODUCT_FILES_DIR, stored_filename)
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception as e:
                    logger.warning(f"Failed to delete file {filepath}: {e}")
    
    # Remove file info from features
    if product.features:
        product.features.pop("download_file", None)
    
    await db.commit()
    
    logger.info(f"Deleted file for product {product_id}")
    
    return {
        "message": "File deleted successfully"
    }
