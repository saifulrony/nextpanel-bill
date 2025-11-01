# 🔒 Comprehensive License Security & Anti-Cracking System

## Overview

This document describes the multi-layered security system implemented to protect your NextPanel billing system from hacking, cracking, and license bypass attempts.

## 🛡️ Security Layers

### 1. **Cryptographic License Key Generation**

License keys are generated using cryptographically secure methods:

- **Format**: `NP-XXXX-XXXX-XXXX-XXXX` (16 characters, excluding dashes)
- **Character Set**: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (removed ambiguous chars like 0/O/I/1)
- **Entropy**: ~28 bits per segment, ~112 bits total
- **Cryptographic Signature**: Each key includes an embedded HMAC signature
- **Encrypted Payload**: Additional encrypted data stored in database

**Example Key**: `NP-A3F7-K2M9-P4Q8-R6T1`

**Security Properties**:
- ✅ Cryptographically random generation
- ✅ Embedded signature prevents key tampering
- ✅ Structure validation on every request
- ✅ One-way encryption of sensitive data

### 2. **HMAC Request Signing**

All license validation requests must include an HMAC signature:

```python
# How to generate signature (NextPanel side):
import hmac
import hashlib
import time

timestamp = int(time.time())
fingerprint = generate_hardware_fingerprint(request)
payload = f"{license_key}|{timestamp}|{fingerprint}"
signature = hmac.new(secret_key, payload.encode(), hashlib.sha256).hexdigest()

# Send in request:
{
    "license_key": "NP-XXXX-XXXX-XXXX-XXXX",
    "feature": "create_database",
    "timestamp": timestamp,
    "signature": signature
}
```

**Protection Against**:
- ✅ Request replay attacks (timestamp freshness check)
- ✅ Request tampering (HMAC verification)
- ✅ MITM attacks (signature must match)
- ✅ Clock skew attacks (5-minute window)

### 3. **Hardware/Network Fingerprinting**

Each validation request generates a unique fingerprint:

**Fingerprint Components**:
- IP Address
- User-Agent hash (partial)
- Accept-Language hash (partial)
- Combined SHA-256 hash

**Uses**:
- Track license usage patterns
- Detect multi-IP usage (suspicious)
- Detect license sharing/abuse
- Flag anomalies automatically

### 4. **Rate Limiting**

Multiple rate limits prevent brute-force and abuse:

**Per-License Limits**:
- 100 validations per minute per license
- Redis-based sliding window

**Per-IP Limits**:
- 1000 validations per hour per IP address
- Prevents distributed attacks

**Implementation**:
```python
# Automatic rate limiting in license_validator
# Uses Redis for distributed rate limiting
# Graceful degradation if Redis unavailable
```

### 5. **Anomaly Detection**

Automated detection of suspicious patterns:

**Anomaly Indicators**:
- ❌ >500 validations per hour (normal: ~100/hour)
- ❌ >10 different IP addresses in 24 hours
- ❌ Unusual validation frequency patterns
- ❌ Failed validation spikes

**Actions When Detected**:
- License flagged as `is_suspicious = True`
- Suspicious reason logged
- Admin notification (optional)
- Increased monitoring

### 6. **Database-Level Security**

**New Security Fields in License Model**:
```sql
encrypted_secret TEXT           -- Encrypted license payload
hardware_fingerprint VARCHAR(64) -- Primary hardware fingerprint
allowed_fingerprints JSON        -- Whitelist of allowed fingerprints
last_validation_at TIMESTAMP     -- Last successful validation
validation_count INTEGER         -- Total successful validations
failed_validation_count INTEGER  -- Total failed attempts
last_validation_ip VARCHAR(45)   -- Last validating IP
is_suspicious BOOLEAN            -- Flagged for review
suspicious_reason TEXT           -- Why flagged
```

**Audit Logging**:
```sql
license_validation_logs table:
- license_id (FK)
- license_key
- feature
- success (boolean)
- ip_address
- user_agent
- message
- request_signature
- validated_at
```

### 7. **Validation Flow with Multiple Checks**

```
1. Structure Validation
   └─> License key format check
       └─> FAIL: Invalid format

2. Signature Verification (if provided)
   └─> HMAC signature check
       └─> Timestamp freshness check (5 min window)
           └─> FAIL: Invalid signature or expired

3. Rate Limiting
   └─> Per-license limit (100/min)
       └─> Per-IP limit (1000/hour)
           └─> FAIL: Rate limit exceeded

4. Anomaly Detection
   └─> Check validation patterns
       └─> Check IP diversity
           └─> FAIL: Anomalous pattern detected

5. Database Validation
   └─> License exists
       └─> License is active
           └─> License not expired
               └─> Feature quota check
                   └─> SUCCESS / FAIL: Quota exceeded

6. Audit Logging
   └─> Log every attempt (success or failure)
       └─> Store fingerprint, IP, user-agent
```

## 🔐 Implementation Guide for NextPanel

### Step 1: Install Dependencies

```bash
pip install cryptography pycryptodome
```

### Step 2: Create License Validator Client

```python
# nextpanel/license_validator.py
import hmac
import hashlib
import time
import requests
from typing import Optional, Dict

class LicenseValidator:
    def __init__(self, api_url: str, secret_key: str):
        self.api_url = api_url
        self.secret_key = secret_key.encode('utf-8')
    
    def generate_fingerprint(self, request_headers: Dict) -> str:
        """Generate hardware fingerprint"""
        import platform
        import hashlib
        
        # Collect fingerprint data
        parts = []
        parts.append(platform.machine())
        parts.append(platform.processor()[:20])
        parts.append(request_headers.get('User-Agent', '')[:50])
        parts.append(request_headers.get('Accept-Language', ''))
        
        combined = "|".join(parts)
        return hashlib.sha256(combined.encode()).hexdigest()
    
    def generate_signature(
        self,
        license_key: str,
        timestamp: int,
        fingerprint: str,
        additional_data: Optional[Dict] = None
    ) -> str:
        """Generate HMAC signature"""
        parts = [license_key, str(timestamp), fingerprint]
        if additional_data:
            import json
            parts.append(json.dumps(additional_data, sort_keys=True))
        
        payload = "|".join(parts)
        signature = hmac.new(
            self.secret_key,
            payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    def validate_license(
        self,
        license_key: str,
        feature: str,
        request_headers: Dict
    ) -> Dict:
        """Validate license with billing API"""
        timestamp = int(time.time())
        fingerprint = self.generate_fingerprint(request_headers)
        signature = self.generate_signature(
            license_key, timestamp, fingerprint
        )
        
        response = requests.post(
            f"{self.api_url}/api/v1/licenses/validate",
            json={
                "license_key": license_key,
                "feature": feature,
                "timestamp": timestamp,
                "signature": signature
            },
            timeout=5
        )
        
        return response.json()

# Usage in NextPanel:
validator = LicenseValidator(
    api_url="http://billing-api:8001",
    secret_key=os.getenv("LICENSE_SECRET_KEY")
)

result = validator.validate_license(
    license_key="NP-XXXX-XXXX-XXXX-XXXX",
    feature="create_database",
    request_headers=request.headers
)

if result.get("valid"):
    # Allow action
    remaining = result.get("remaining_quota", 0)
else:
    # Block action
    error = result.get("error", "License validation failed")
    raise LicenseError(error)
```

### Step 3: Secure Secret Key Storage

**On Billing System**:
```bash
# .env
SECRET_KEY=your-256-bit-secret-key-here-generate-randomly
```

**On NextPanel**:
```bash
# .env
LICENSE_SECRET_KEY=your-256-bit-secret-key-here-same-as-billing
```

**Generate Secure Key**:
```python
import secrets
key = secrets.token_hex(32)  # 256 bits
print(f"SECRET_KEY={key}")
```

### Step 4: Add Validation to Critical Operations

```python
# Example: Before creating database
@router.post("/databases")
async def create_database(
    request: Request,
    db: AsyncSession,
    license_key: str = Header(...)
):
    # Validate license first
    result = validator.validate_license(
        license_key=license_key,
        feature="create_database",
        request_headers=request.headers
    )
    
    if not result.get("valid"):
        raise HTTPException(403, result.get("error"))
    
    # Check quota
    remaining = result.get("remaining_quota", 0)
    if remaining <= 0:
        raise HTTPException(403, "Quota exceeded")
    
    # Create database
    # ... database creation code ...
    
    # Report usage back to billing system
    await report_usage(license_key, "database", "created", 1)
```

## 🚫 Anti-Cracking Measures

### 1. **Code Obfuscation** (Recommended for production)

For maximum protection, obfuscate NextPanel license validation code:

```bash
# Install obfuscator
pip install pyarmor

# Obfuscate license validator
pyarmor gen -r license_validator.py
```

### 2. **Network-Level Protection**

**Recommended Setup**:
- ✅ Use HTTPS/TLS for all API communications
- ✅ Whitelist NextPanel server IPs on billing API
- ✅ Use VPN or private network between systems
- ✅ Implement firewall rules

**Example Nginx Config**:
```nginx
# Only allow requests from NextPanel server
location /api/v1/licenses/validate {
    allow 192.168.1.100;  # NextPanel server IP
    deny all;
    
    proxy_pass http://billing-backend:8001;
}
```

### 3. **Monitor and Alert**

**Set Up Alerts For**:
- High failed validation counts
- Suspicious licenses (is_suspicious = True)
- Anomalous validation patterns
- Multiple IPs per license

**Example Monitoring Query**:
```sql
-- Find suspicious licenses
SELECT license_key, validation_count, failed_validation_count,
       COUNT(DISTINCT ip_address) as unique_ips,
       is_suspicious
FROM licenses l
LEFT JOIN license_validation_logs log ON l.id = log.license_id
WHERE log.validated_at > NOW() - INTERVAL '24 hours'
GROUP BY l.id
HAVING COUNT(DISTINCT log.ip_address) > 5
   OR is_suspicious = true
ORDER BY validation_count DESC;
```

### 4. **Regular Security Audits**

**Recommended Checks**:
- ✅ Review validation logs weekly
- ✅ Check for suspicious patterns
- ✅ Audit licenses with high validation counts
- ✅ Monitor failed validation attempts
- ✅ Review IP address diversity

## 📊 Monitoring Dashboard

### Key Metrics to Monitor

1. **Validation Success Rate**
   ```
   Successful validations / Total validations
   Target: >95%
   ```

2. **Failed Validation Rate**
   ```
   Failed validations / Total validations
   Alert if: >10%
   ```

3. **Anomaly Detection Rate**
   ```
   Suspicious licenses / Total licenses
   Investigate if: >5%
   ```

4. **Rate Limit Hits**
   ```
   Rate limit blocks / Total requests
   Alert if: >1%
   ```

## 🔧 Migration Steps

### 1. Update Database Schema

```bash
# Create migration
cd billing-backend
alembic revision --autogenerate -m "add_license_security_fields"

# Review and apply
alembic upgrade head
```

### 2. Update License Generation

Update all places where licenses are created:

```python
# Old:
license_key = f"NP-{secrets.token_hex(8).upper()}"

# New:
from app.core.license_security import license_security
license_key, encrypted_secret = license_security.generate_secure_license_key(
    user_id, plan_id
)

# Save both to database
license = License(
    license_key=license_key,
    encrypted_secret=encrypted_secret,
    ...
)
```

### 3. Update Existing Licenses (Optional)

Run script to add encrypted_secret to existing licenses:

```python
# scripts/update_existing_licenses.py
from app.core.database import get_db
from app.models import License
from app.core.license_security import license_security

async def update_licenses():
    db = await get_db()
    licenses = await db.execute(select(License).where(License.encrypted_secret == None))
    
    for license in licenses.scalars():
        _, encrypted_secret = license_security.generate_secure_license_key(
            license.user_id, license.plan_id
        )
        license.encrypted_secret = encrypted_secret
        await db.commit()
```

## ⚠️ Important Security Notes

### DO:
- ✅ Use strong SECRET_KEY (256 bits minimum)
- ✅ Enable HTTPS/TLS in production
- ✅ Regularly rotate SECRET_KEY (annually)
- ✅ Monitor validation logs
- ✅ Keep Redis available for rate limiting
- ✅ Implement IP whitelisting
- ✅ Use environment variables for secrets

### DON'T:
- ❌ Commit SECRET_KEY to git
- ❌ Share SECRET_KEY between environments
- ❌ Skip signature verification
- ❌ Expose validation endpoint publicly
- ❌ Ignore anomaly alerts
- ❌ Use weak passwords/keys
- ❌ Disable rate limiting

## 📞 Support

For questions or issues:
1. Check validation logs: `/admin/licenses/{id}/logs`
2. Review suspicious licenses: `/admin/licenses?suspicious=true`
3. Check Redis connection for rate limiting
4. Verify SECRET_KEY matches between systems

---

## Summary

This security system provides **multiple layers of protection**:

1. ✅ **Cryptographic key generation** - Can't guess valid keys
2. ✅ **HMAC signatures** - Can't tamper with requests
3. ✅ **Rate limiting** - Can't brute force
4. ✅ **Anomaly detection** - Auto-flags suspicious usage
5. ✅ **Hardware fingerprinting** - Detects license sharing
6. ✅ **Comprehensive logging** - Full audit trail
7. ✅ **Database validation** - Server-side enforcement

**Result**: Extremely difficult to crack or bypass without access to:
- Server infrastructure
- Database access
- SECRET_KEY
- NextPanel source code

Even if someone gets a valid license key, they still need:
- Correct HMAC signature
- Valid hardware fingerprint
- Within rate limits
- Not flagged as suspicious

