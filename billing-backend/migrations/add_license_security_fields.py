"""
Migration: Add license security fields
Run this after updating models to add security features
"""
import asyncio
from sqlalchemy import text
from app.core.database import engine


async def upgrade():
    """Add security fields to licenses table and create validation logs table"""
    async with engine.begin() as conn:
        # Add security fields to licenses table
        await conn.execute(text("""
            ALTER TABLE licenses 
            ADD COLUMN IF NOT EXISTS encrypted_secret TEXT;
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            ADD COLUMN IF NOT EXISTS hardware_fingerprint VARCHAR(64);
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            ADD COLUMN IF NOT EXISTS allowed_fingerprints JSON;
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            ADD COLUMN IF NOT EXISTS last_validation_at TIMESTAMP WITH TIME ZONE;
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            ADD COLUMN IF NOT EXISTS validation_count INTEGER DEFAULT 0;
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            ADD COLUMN IF NOT EXISTS failed_validation_count INTEGER DEFAULT 0;
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            ADD COLUMN IF NOT EXISTS last_validation_ip VARCHAR(45);
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            ADD COLUMN IF NOT EXISTS is_suspicious BOOLEAN DEFAULT FALSE;
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            ADD COLUMN IF NOT EXISTS suspicious_reason TEXT;
        """))
        
        # Create license_validation_logs table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS license_validation_logs (
                id VARCHAR(36) PRIMARY KEY,
                license_id VARCHAR(36) REFERENCES licenses(id),
                license_key VARCHAR(100) NOT NULL,
                feature VARCHAR(50) NOT NULL,
                success BOOLEAN DEFAULT FALSE,
                ip_address VARCHAR(45),
                user_agent VARCHAR(255),
                message TEXT,
                request_signature VARCHAR(128),
                validated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # Create indexes for performance
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_license_validation_logs_license_id 
            ON license_validation_logs(license_id);
        """))
        
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_license_validation_logs_license_key 
            ON license_validation_logs(license_key);
        """))
        
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_license_validation_logs_success 
            ON license_validation_logs(success);
        """))
        
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_license_validation_logs_validated_at 
            ON license_validation_logs(validated_at);
        """))
        
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_license_validation_logs_ip_address 
            ON license_validation_logs(ip_address);
        """))
        
        print("✅ License security fields added successfully")


async def downgrade():
    """Remove security fields (if needed)"""
    async with engine.begin() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS license_validation_logs;"))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            DROP COLUMN IF EXISTS encrypted_secret;
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            DROP COLUMN IF EXISTS hardware_fingerprint;
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            DROP COLUMN IF EXISTS allowed_fingerprints;
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            DROP COLUMN IF EXISTS last_validation_at;
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            DROP COLUMN IF EXISTS validation_count;
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            DROP COLUMN IF EXISTS failed_validation_count;
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            DROP COLUMN IF EXISTS last_validation_ip;
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            DROP COLUMN IF EXISTS is_suspicious;
        """))
        
        await conn.execute(text("""
            ALTER TABLE licenses 
            DROP COLUMN IF EXISTS suspicious_reason;
        """))


if __name__ == "__main__":
    asyncio.run(upgrade())
    print("\n✅ Migration complete!")
    print("\n⚠️  Next steps:")
    print("1. Update SECRET_KEY in .env with a strong 256-bit key")
    print("2. Update license generation code to use license_security.generate_secure_license_key()")
    print("3. Update NextPanel to include HMAC signatures in validation requests")
    print("4. Review LICENSE_SECURITY_GUIDE.md for implementation details")

