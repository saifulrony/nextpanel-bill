"""
License Validation with Rate Limiting and Anomaly Detection
"""
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None
from app.core.database import get_db
from app.core.license_security import license_security
from app.models import License, LicenseValidationLog
from app.core.config import settings
import json


class LicenseValidator:
    """Validates licenses with rate limiting and anomaly detection"""
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
    
    async def get_redis(self):
        """Get Redis connection"""
        if not REDIS_AVAILABLE:
            return None
        if self.redis_client is None:
            try:
                self.redis_client = await redis.from_url(settings.REDIS_URL)
            except Exception:
                # If Redis unavailable, continue without caching
                pass
        return self.redis_client
    
    async def validate_license_request(
        self,
        request: Request,
        license_key: str,
        feature: str,
        timestamp: int,
        signature: str,
        additional_data: Optional[Dict] = None,
        db: AsyncSession = None
    ) -> Tuple[bool, Optional[str], Optional[Dict]]:
        """
        Comprehensive license validation with security checks
        
        Returns:
            (is_valid, error_message, license_data)
        """
        # Step 1: Validate license key structure
        if not license_security.validate_license_structure(license_key):
            await self._log_validation(
                license_key, feature, False, "Invalid license key format",
                request, db
            )
            return False, "Invalid license key format", None
        
        # Step 2: Generate and verify request signature
        fingerprint = license_security.generate_hardware_fingerprint(request)
        signature_valid = license_security.verify_request_signature(
            license_key, timestamp, fingerprint, signature, additional_data
        )
        
        if not signature_valid:
            await self._log_validation(
                license_key, feature, False, "Invalid request signature",
                request, db
            )
            return False, "Invalid request signature or expired timestamp", None
        
        # Step 3: Rate limiting check
        rate_limit_ok, rate_limit_msg = await self._check_rate_limit(
            license_key, request.client.host if request.client else "unknown"
        )
        if not rate_limit_ok:
            await self._log_validation(
                license_key, feature, False, f"Rate limit exceeded: {rate_limit_msg}",
                request, db
            )
            return False, rate_limit_msg, None
        
        # Step 4: Check for anomaly patterns
        anomaly_detected = await self._check_anomalies(license_key, request)
        if anomaly_detected:
            await self._log_validation(
                license_key, feature, False, "Anomalous usage pattern detected",
                request, db
            )
            return False, "Anomalous usage pattern detected. Account flagged for review.", None
        
        # Step 5: Database validation
        if db:
            result = await db.execute(
                select(License).where(License.license_key == license_key)
            )
            license = result.scalars().first()
            
            if not license:
                await self._log_validation(
                    license_key, feature, False, "License not found",
                    request, db
                )
                return False, "Invalid license key", None
            
            if license.status != "active":
                await self._log_validation(
                    license_key, feature, False, f"License status: {license.status}",
                    request, db
                )
                return False, f"License is {license.status}", None
            
            # Check expiry
            if license.expiry_date and license.expiry_date < datetime.utcnow():
                await self._log_validation(
                    license_key, feature, False, "License expired",
                    request, db
                )
                return False, "License has expired", None
            
            # Validate feature quotas
            is_valid, error_msg, quota_info = await self._check_feature_quota(
                license, feature
            )
            
            if not is_valid:
                await self._log_validation(
                    license_key, feature, False, error_msg,
                    request, db
                )
                return False, error_msg, None
            
            # Log successful validation
            await self._log_validation(
                license_key, feature, True, "Validation successful",
                request, db, license.id
            )
            
            # Update fingerprint if first validation
            await self._update_license_fingerprint(license, fingerprint, db)
            
            return True, None, {
                "license_id": license.id,
                "valid": True,
                "remaining_quota": quota_info.get("remaining", 0),
                "feature": feature
            }
        
        return False, "Database connection required", None
    
    async def _check_feature_quota(
        self, license: License, feature: str
    ) -> Tuple[bool, Optional[str], Dict]:
        """Check if feature quota allows the requested action"""
        quota_info = {}
        
        if feature == "create_database":
            if license.current_databases >= license.max_databases:
                return False, "Database quota exceeded", {}
            quota_info["remaining"] = license.max_databases - license.current_databases
            quota_info["current"] = license.current_databases
            quota_info["max"] = license.max_databases
        
        elif feature == "create_domain":
            if license.current_domains >= license.max_domains:
                return False, "Domain quota exceeded", {}
            quota_info["remaining"] = license.max_domains - license.current_domains
            quota_info["current"] = license.current_domains
            quota_info["max"] = license.max_domains
        
        elif feature == "create_email":
            if license.current_emails >= license.max_emails:
                return False, "Email account quota exceeded", {}
            quota_info["remaining"] = license.max_emails - license.current_emails
            quota_info["current"] = license.current_emails
            quota_info["max"] = license.max_emails
        
        elif feature == "create_account":
            if license.current_accounts >= license.max_accounts:
                return False, "Account quota exceeded", {}
            quota_info["remaining"] = license.max_accounts - license.current_accounts
            quota_info["current"] = license.current_accounts
            quota_info["max"] = license.max_accounts
        
        else:
            # Unknown feature, allow by default but log
            quota_info["remaining"] = -1  # Unlimited
            quota_info["note"] = "Unknown feature, defaulting to allowed"
        
        return True, None, quota_info
    
    async def _check_rate_limit(self, license_key: str, ip_address: str) -> Tuple[bool, str]:
        """
        Check rate limits:
        - 100 validations per minute per license
        - 1000 validations per hour per IP
        """
        redis_client = await self.get_redis()
        if not redis_client:
            # If Redis unavailable, allow (graceful degradation)
            return True, ""
        
        try:
            # Per-license rate limit (100/minute)
            license_key_limit = f"license:rate:{license_key}"
            license_count = await redis_client.incr(license_key_limit)
            if license_count == 1:
                await redis_client.expire(license_key_limit, 60)  # 1 minute window
            
            if license_count > 100:
                return False, "Rate limit exceeded: Too many validations for this license"
            
            # Per-IP rate limit (1000/hour)
            ip_key_limit = f"ip:rate:{ip_address}"
            ip_count = await redis_client.incr(ip_key_limit)
            if ip_count == 1:
                await redis_client.expire(ip_key_limit, 3600)  # 1 hour window
            
            if ip_count > 1000:
                return False, "Rate limit exceeded: Too many validations from this IP"
            
            return True, ""
        except Exception as e:
            # On error, allow (don't block legitimate requests)
            return True, ""
    
    async def _check_anomalies(self, license_key: str, request: Request) -> bool:
        """
        Detect anomalous usage patterns:
        - Unusual validation frequency
        - Multiple IP addresses
        - Suspicious time patterns
        """
        redis_client = await self.get_redis()
        if not redis_client:
            return False
        
        try:
            # Track validation timestamps
            validation_key = f"license:validations:{license_key}"
            current_time = time.time()
            
            # Add current validation timestamp
            await redis_client.zadd(validation_key, {str(current_time): current_time})
            
            # Keep only last hour of validations
            one_hour_ago = current_time - 3600
            await redis_client.zremrangebyscore(validation_key, 0, one_hour_ago)
            
            # Count validations in last hour
            count = await redis_client.zcard(validation_key)
            
            # Flag if more than 500 validations per hour (suspicious)
            if count > 500:
                return True
            
            # Track IP addresses for this license
            ip_key = f"license:ips:{license_key}"
            ip_address = request.client.host if request.client else "unknown"
            
            # Add IP to set
            await redis_client.sadd(ip_key, ip_address)
            await redis_client.expire(ip_key, 86400)  # 24 hours
            
            # Count unique IPs
            ip_count = await redis_client.scard(ip_key)
            
            # Flag if license used from more than 10 different IPs in 24h (suspicious)
            if ip_count > 10:
                return True
            
            return False
        except Exception:
            # On error, don't block
            return False
    
    async def _log_validation(
        self,
        license_key: str,
        feature: str,
        success: bool,
        message: str,
        request: Request,
        db: Optional[AsyncSession],
        license_id: Optional[str] = None
    ):
        """Log license validation attempt"""
        if not db:
            return
        
        try:
            ip_address = request.client.host if request.client else "unknown"
            user_agent = request.headers.get("user-agent", "unknown")
            
            log_entry = LicenseValidationLog(
                license_key=license_key,
                license_id=license_id,
                feature=feature,
                success=success,
                ip_address=ip_address,
                user_agent=user_agent[:255],  # Truncate if too long
                message=message,
                validated_at=datetime.utcnow()
            )
            
            db.add(log_entry)
            await db.commit()
        except Exception:
            # Don't fail validation if logging fails
            await db.rollback()
    
    async def _update_license_fingerprint(
        self,
        license: License,
        fingerprint: str,
        db: AsyncSession
    ):
        """Update or store hardware fingerprint for license"""
        # This would require adding a fingerprint field to License model
        # For now, we'll store it in a separate tracking table or Redis
        try:
            redis_client = await self.get_redis()
            if redis_client:
                fingerprint_key = f"license:fingerprint:{license.id}"
                await redis_client.set(fingerprint_key, fingerprint, ex=86400 * 30)  # 30 days
        except Exception:
            pass


# Global validator instance
license_validator = LicenseValidator()

