"""
License API endpoints with enhanced security
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.license_security import license_security
from app.core.license_validation import license_validator
from app.models import License, Plan, User
from app.schemas import LicenseResponse, LicenseValidateRequest, LicenseValidateResponse
import secrets
import string
import time

router = APIRouter(prefix="/licenses", tags=["licenses"])


def generate_license_key(user_id: str, plan_id: str) -> tuple[str, str]:
    """
    Generate a secure license key with cryptographic signature
    Returns: (license_key, encrypted_secret)
    """
    return license_security.generate_secure_license_key(user_id, plan_id)


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
    request_body: LicenseValidateRequest,
    http_request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Secure license validation with multiple security layers:
    1. License key structure validation
    2. HMAC request signature verification
    3. Rate limiting
    4. Anomaly detection
    5. Database validation
    6. Quota checking
    
    Required request format (from NextPanel):
    {
        "license_key": "NP-XXXX-XXXX-XXXX-XXXX",
        "feature": "create_database",
        "timestamp": 1234567890,
        "signature": "hmac_signature_here",
        "additional_data": {}  // optional
    }
    """
    # Extract signature and timestamp from request body or headers
    # For backward compatibility, check both
    timestamp = getattr(request_body, 'timestamp', None)
    signature = getattr(request_body, 'signature', None)
    additional_data = getattr(request_body, 'additional_data', None)
    
    if timestamp is None:
        timestamp = int(time.time())
    
    # Generate fingerprint for this request
    fingerprint = license_security.generate_hardware_fingerprint(http_request)
    
    # If signature provided, verify it
    if signature:
        signature_valid = license_security.verify_request_signature(
            request_body.license_key,
            timestamp,
            fingerprint,
            signature,
            additional_data
        )
        if not signature_valid:
            return LicenseValidateResponse(
                valid=False,
                error="Invalid request signature or expired timestamp"
            )
    
    # Use comprehensive validator
    is_valid, error_msg, license_data = await license_validator.validate_license_request(
        request=http_request,
        license_key=request_body.license_key,
        feature=request_body.feature,
        timestamp=timestamp,
        signature=signature or "",
        additional_data=additional_data,
        db=db
    )
    
    if not is_valid:
        return LicenseValidateResponse(valid=False, error=error_msg or "Validation failed")
    
    # Update license stats
    if license_data and license_data.get("license_id"):
        license_id = license_data["license_id"]
        result = await db.execute(select(License).where(License.id == license_id))
        license = result.scalars().first()
        
        if license:
            license.validation_count = (license.validation_count or 0) + 1
            license.last_validation_at = datetime.utcnow()
            license.last_validation_ip = http_request.client.host if http_request.client else None
            await db.commit()
    
    return LicenseValidateResponse(
        valid=True,
        remaining_quota=license_data.get("remaining_quota", 0) if license_data else 0
    )

