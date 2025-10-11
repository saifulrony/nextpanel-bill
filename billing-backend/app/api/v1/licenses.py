"""
License API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models import License, Plan, User
from app.schemas import LicenseResponse, LicenseValidateRequest, LicenseValidateResponse
import secrets
import string

router = APIRouter(prefix="/licenses", tags=["licenses"])


def generate_license_key() -> str:
    """Generate a unique license key"""
    # Format: NP-XXXX-XXXX-XXXX
    segments = []
    for _ in range(3):
        segment = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
        segments.append(segment)
    return f"NP-{'-'.join(segments)}"


@router.get("/", response_model=List[LicenseResponse])
async def list_licenses(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """List user's licenses"""
    result = await db.execute(select(License).where(License.user_id == user_id))
    licenses = result.scalars().all()
    return licenses


@router.get("/{license_id}", response_model=LicenseResponse)
async def get_license(
    license_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific license"""
    result = await db.execute(
        select(License).where(
            License.id == license_id,
            License.user_id == user_id
        )
    )
    license = result.scalars().first()
    
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    
    return license


@router.post("/validate", response_model=LicenseValidateResponse)
async def validate_license(
    request: LicenseValidateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Validate a license for a specific feature (used by NextPanel)"""
    # Find license
    result = await db.execute(select(License).where(License.license_key == request.license_key))
    license = result.scalars().first()
    
    if not license:
        return LicenseValidateResponse(valid=False, error="Invalid license key")
    
    if license.status != "active":
        return LicenseValidateResponse(valid=False, error=f"License is {license.status}")
    
    # Check quota based on feature
    if request.feature == "create_database":
        if license.current_databases >= license.max_databases:
            return LicenseValidateResponse(
                valid=False,
                error="Database quota exceeded"
            )
        remaining = license.max_databases - license.current_databases
        return LicenseValidateResponse(valid=True, remaining_quota=remaining)
    
    elif request.feature == "create_domain":
        if license.current_domains >= license.max_domains:
            return LicenseValidateResponse(
                valid=False,
                error="Domain quota exceeded"
            )
        remaining = license.max_domains - license.current_domains
        return LicenseValidateResponse(valid=True, remaining_quota=remaining)
    
    elif request.feature == "create_email":
        if license.current_emails >= license.max_emails:
            return LicenseValidateResponse(
                valid=False,
                error="Email account quota exceeded"
            )
        remaining = license.max_emails - license.current_emails
        return LicenseValidateResponse(valid=True, remaining_quota=remaining)
    
    # Default: allow
    return LicenseValidateResponse(valid=True)

