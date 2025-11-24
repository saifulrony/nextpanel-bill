"""
Customization API endpoints for managing system appearance
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import os
import base64
from datetime import datetime

from app.core.database import get_db
from app.models import User
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/api/customization", tags=["customization"])

# Get the base directory (where the script is located)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Directory to store uploaded logos
LOGO_DIR = os.path.join(BASE_DIR, "uploads", "logos")
try:
    os.makedirs(LOGO_DIR, exist_ok=True, mode=0o755)
except (PermissionError, OSError) as e:
    # If permission denied, try to create in /tmp
    LOGO_DIR = os.path.join("/tmp", "nextpanel_uploads", "logos")
    os.makedirs(LOGO_DIR, exist_ok=True, mode=0o755)
    print(f"Warning: Using /tmp for logo uploads due to permission error: {e}")

# Directory to store uploaded images for page builder
IMAGES_DIR = os.path.join(BASE_DIR, "uploads", "images")
try:
    os.makedirs(IMAGES_DIR, exist_ok=True, mode=0o755)
except (PermissionError, OSError) as e:
    # If permission denied, try to create in /tmp
    IMAGES_DIR = os.path.join("/tmp", "nextpanel_uploads", "images")
    os.makedirs(IMAGES_DIR, exist_ok=True, mode=0o755)
    print(f"Warning: Using /tmp for image uploads due to permission error: {e}")


class CustomizationSettings(BaseModel):
    logo: Optional[str] = None
    font_family: str = "Inter"
    primary_color: str = "#4F46E5"
    secondary_color: str = "#818CF8"
    background_color: str = "#FFFFFF"
    text_color: str = "#1F2937"
    layout: str = "default"
    custom_css: str = ""
    custom_js: str = ""
    custom_html: str = ""


class ThemeCreate(BaseModel):
    name: str
    settings: CustomizationSettings


class ThemeResponse(BaseModel):
    id: int
    name: str
    settings: dict
    created_at: datetime
    created_by: int

    class Config:
        from_attributes = True


@router.get("/settings")
async def get_customization_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current customization settings
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can access customization settings")
    
    # For now, return default settings
    # In production, you would fetch from database
    return {
        "logo": None,
        "font_family": "Inter",
        "primary_color": "#4F46E5",
        "secondary_color": "#818CF8",
        "background_color": "#FFFFFF",
        "text_color": "#1F2937",
        "layout": "default",
        "custom_css": "",
        "custom_js": "",
        "custom_html": ""
    }


@router.post("/settings")
async def update_customization_settings(
    settings: CustomizationSettings,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update customization settings
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can update customization settings")
    
    # In production, save to database
    # For now, just return the settings
    return {
        "message": "Settings updated successfully",
        "settings": settings.dict()
    }


@router.post("/logo")
async def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a logo file
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can upload logos")
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = file.filename.split('.')[-1]
    filename = f"logo_{timestamp}.{file_extension}"
    filepath = os.path.join(LOGO_DIR, filename)
    
    # Save file
    with open(filepath, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Return the file URL
    logo_url = f"/uploads/logos/{filename}"
    
    return {
        "message": "Logo uploaded successfully",
        "logo_url": logo_url,
        "filename": filename
    }


@router.delete("/logo")
async def delete_logo(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete the current logo
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can delete logos")
    
    # In production, delete from database and filesystem
    return {
        "message": "Logo deleted successfully"
    }


@router.get("/themes")
async def get_themes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all saved themes
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can access themes")
    
    # In production, fetch from database
    return {
        "themes": []
    }


@router.post("/themes")
async def create_theme(
    theme: ThemeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new theme
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can create themes")
    
    # In production, save to database
    return {
        "message": "Theme created successfully",
        "theme": {
            "id": 1,
            "name": theme.name,
            "settings": theme.settings.dict(),
            "created_at": datetime.now(),
            "created_by": current_user.id
        }
    }


@router.delete("/themes/{theme_id}")
async def delete_theme(
    theme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a theme
    """
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can delete themes")
    
    # In production, delete from database
    return {
        "message": "Theme deleted successfully"
    }


@router.get("/fonts")
async def get_available_fonts():
    """
    Get list of available fonts
    """
    fonts = [
        "Inter",
        "Roboto",
        "Open Sans",
        "Lato",
        "Montserrat",
        "Poppins",
        "Nunito",
        "Raleway",
        "Ubuntu",
        "Playfair Display"
    ]
    
    return {
        "fonts": fonts
    }

