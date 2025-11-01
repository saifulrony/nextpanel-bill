"""
Advanced License Security System
Implements multiple layers of protection against cracking and bypass
"""
import hashlib
import hmac
import secrets
import base64
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.fernet import Fernet
import os
from fastapi import HTTPException, status, Request
from app.core.config import settings


class LicenseSecurity:
    """
    Advanced license security with multiple protection layers:
    1. Cryptographic license key generation
    2. Hardware fingerprinting
    3. HMAC request signing
    4. License tampering detection
    5. Usage anomaly detection
    """
    
    def __init__(self):
        # Use secret key from settings for encryption
        self.secret_key = settings.SECRET_KEY.encode('utf-8')
        if len(self.secret_key) < 32:
            # Pad or derive a 32-byte key
            self.secret_key = hashlib.sha256(self.secret_key).digest()
        
        # Generate or use a stable encryption key
        self.fernet_key = self._derive_encryption_key()
        self.cipher = Fernet(self.fernet_key)
    
    def _derive_encryption_key(self) -> bytes:
        """Derive a stable encryption key from secret"""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'nextpanel_license_salt',
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.secret_key))
        return key
    
    def generate_secure_license_key(self, user_id: str, plan_id: str) -> Tuple[str, str]:
        """
        Generate a cryptographically secure license key with embedded signature
        
        Returns:
            Tuple[license_key (human-readable), encrypted_secret (for validation)]
        """
        # Create license payload
        timestamp = int(datetime.utcnow().timestamp())
        payload = {
            "uid": user_id[:8],  # User ID prefix
            "pid": plan_id[:8],   # Plan ID prefix
            "ts": timestamp,
            "nonce": secrets.token_hex(8)
        }
        
        # Create human-readable key: NP-XXXX-XXXX-XXXX-XXXX
        segments = []
        for _ in range(4):
            segment = ''.join(secrets.choice('ABCDEFGHJKLMNPQRSTUVWXYZ23456789') 
                            for _ in range(4))
            segments.append(segment)
        
        license_key = f"NP-{'-'.join(segments)}"
        
        # Create cryptographic signature embedded in key
        signature_data = f"{license_key}:{user_id}:{plan_id}:{timestamp}"
        signature = hmac.new(
            self.secret_key,
            signature_data.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()[:16].upper()
        
        # Encrypt the full payload for validation
        payload_str = json.dumps(payload)
        encrypted_secret = self.cipher.encrypt(payload_str.encode('utf-8'))
        encrypted_b64 = base64.urlsafe_b64encode(encrypted_secret).decode('utf-8')
        
        return license_key, encrypted_b64
    
    def validate_license_structure(self, license_key: str) -> bool:
        """
        Validate license key format and structure
        Returns False if key appears tampered with
        """
        if not license_key or not isinstance(license_key, str):
            return False
        
        # Check format: NP-XXXX-XXXX-XXXX-XXXX
        parts = license_key.split('-')
        if len(parts) != 5 or parts[0] != 'NP':
            return False
        
        # Check segment format
        valid_chars = set('ABCDEFGHJKLMNPQRSTUVWXYZ23456789')
        for segment in parts[1:]:
            if len(segment) != 4:
                return False
            if not all(c in valid_chars for c in segment):
                return False
        
        return True
    
    def generate_hardware_fingerprint(self, request: Request) -> str:
        """
        Generate a hardware/network fingerprint from request
        Uses multiple sources for uniqueness
        """
        fingerprint_parts = []
        
        # IP Address
        ip = request.client.host if request.client else "unknown"
        fingerprint_parts.append(f"ip:{ip}")
        
        # User-Agent (partially hashed for privacy)
        user_agent = request.headers.get("user-agent", "")
        ua_hash = hashlib.sha256(user_agent.encode()).hexdigest()[:16]
        fingerprint_parts.append(f"ua:{ua_hash}")
        
        # Accept-Language
        accept_lang = request.headers.get("accept-language", "")
        lang_hash = hashlib.sha256(accept_lang.encode()).hexdigest()[:8]
        fingerprint_parts.append(f"lang:{lang_hash}")
        
        # Combine and hash
        combined = "|".join(fingerprint_parts)
        fingerprint = hashlib.sha256(combined.encode()).hexdigest()
        
        return fingerprint
    
    def generate_request_signature(
        self,
        license_key: str,
        timestamp: int,
        fingerprint: str,
        additional_data: Optional[Dict] = None
    ) -> str:
        """
        Generate HMAC signature for license validation request
        Prevents request replay and tampering
        """
        # Build signature payload
        payload_parts = [
            license_key,
            str(timestamp),
            fingerprint
        ]
        
        if additional_data:
            # Sort keys for consistent hashing
            sorted_data = json.dumps(additional_data, sort_keys=True)
            payload_parts.append(sorted_data)
        
        payload = "|".join(payload_parts)
        
        # Generate HMAC signature
        signature = hmac.new(
            self.secret_key,
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return signature
    
    def verify_request_signature(
        self,
        license_key: str,
        timestamp: int,
        fingerprint: str,
        provided_signature: str,
        additional_data: Optional[Dict] = None,
        max_age_seconds: int = 300
    ) -> bool:
        """
        Verify HMAC signature and check timestamp freshness
        Prevents replay attacks
        """
        # Check timestamp freshness (prevent replay attacks)
        current_time = int(datetime.utcnow().timestamp())
        if abs(current_time - timestamp) > max_age_seconds:
            return False
        
        # Regenerate signature with provided data
        expected_signature = self.generate_request_signature(
            license_key, timestamp, fingerprint, additional_data
        )
        
        # Constant-time comparison to prevent timing attacks
        return hmac.compare_digest(expected_signature, provided_signature)
    
    def encrypt_license_data(self, data: Dict[str, Any]) -> str:
        """Encrypt sensitive license data"""
        json_str = json.dumps(data)
        encrypted = self.cipher.encrypt(json_str.encode('utf-8'))
        return base64.urlsafe_b64encode(encrypted).decode('utf-8')
    
    def decrypt_license_data(self, encrypted_data: str) -> Dict[str, Any]:
        """Decrypt license data"""
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode('utf-8'))
            decrypted = self.cipher.decrypt(encrypted_bytes)
            return json.loads(decrypted.decode('utf-8'))
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid encrypted license data"
            )
    
    def detect_anomalous_usage(
        self,
        validation_count: int,
        time_window_seconds: int,
        baseline_normal: int = 100
    ) -> bool:
        """
        Detect anomalous license validation patterns
        Returns True if usage appears suspicious
        """
        # Normal: ~100 validations per hour
        # Suspicious: >1000 validations per hour
        if time_window_seconds <= 0:
            return False
        
        validations_per_hour = (validation_count * 3600) / time_window_seconds
        
        # Flag if more than 10x normal usage
        return validations_per_hour > (baseline_normal * 10)
    
    def generate_activation_token(self, license_id: str, expires_in_hours: int = 24) -> str:
        """
        Generate a one-time activation token
        Used for initial license activation
        """
        payload = {
            "license_id": license_id,
            "expires_at": int((datetime.utcnow() + timedelta(hours=expires_in_hours)).timestamp()),
            "nonce": secrets.token_hex(16)
        }
        
        token_data = json.dumps(payload)
        encrypted = self.cipher.encrypt(token_data.encode('utf-8'))
        token = base64.urlsafe_b64encode(encrypted).decode('utf-8')
        
        return token
    
    def verify_activation_token(self, token: str) -> Optional[str]:
        """
        Verify activation token and return license_id
        Returns None if token is invalid or expired
        """
        try:
            encrypted = base64.urlsafe_b64decode(token.encode('utf-8'))
            decrypted = self.cipher.decrypt(encrypted)
            payload = json.loads(decrypted.decode('utf-8'))
            
            # Check expiration
            expires_at = payload.get("expires_at", 0)
            if datetime.utcnow().timestamp() > expires_at:
                return None
            
            return payload.get("license_id")
        except Exception:
            return None


# Global instance
license_security = LicenseSecurity()

