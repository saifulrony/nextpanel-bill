"""
Migration: Add all new feature tables
Creates tables for: coupons, credit_notes, email_templates, currencies, exchange_rates, tax_rules, tax_exemptions, affiliates, referrals, commissions
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.core.database import engine


async def run_migration():
    """Add all new feature tables"""
    
    async with engine.begin() as conn:
        print("Creating new feature tables...")
        
        # Coupons table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS coupons (
                id TEXT PRIMARY KEY,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                coupon_type TEXT NOT NULL,
                discount_value REAL NOT NULL,
                minimum_purchase REAL DEFAULT 0.0,
                maximum_discount REAL,
                usage_limit INTEGER,
                usage_count INTEGER DEFAULT 0,
                usage_limit_per_user INTEGER DEFAULT 1,
                valid_from TEXT NOT NULL,
                valid_until TEXT,
                status TEXT DEFAULT 'active',
                applicable_to_products TEXT,
                applicable_to_categories TEXT,
                first_time_customers_only INTEGER DEFAULT 0,
                created_by TEXT REFERENCES users(id),
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);"))
        print("✅ Created coupons table")
        
        # Coupon usages table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS coupon_usages (
                id TEXT PRIMARY KEY,
                coupon_id TEXT NOT NULL REFERENCES coupons(id),
                user_id TEXT NOT NULL REFERENCES users(id),
                order_id TEXT REFERENCES orders(id),
                invoice_id TEXT REFERENCES invoices(id),
                discount_amount REAL NOT NULL,
                used_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON coupon_usages(coupon_id);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON coupon_usages(user_id);"))
        print("✅ Created coupon_usages table")
        
        # Credit notes table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS credit_notes (
                id TEXT PRIMARY KEY,
                credit_note_number TEXT UNIQUE NOT NULL,
                user_id TEXT NOT NULL REFERENCES users(id),
                invoice_id TEXT REFERENCES invoices(id),
                order_id TEXT REFERENCES orders(id),
                payment_id TEXT REFERENCES payments(id),
                amount REAL NOT NULL,
                currency TEXT DEFAULT 'USD',
                status TEXT DEFAULT 'draft',
                reason TEXT NOT NULL,
                description TEXT,
                notes TEXT,
                applied_amount REAL DEFAULT 0.0,
                remaining_amount REAL NOT NULL,
                issued_date TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_credit_notes_number ON credit_notes(credit_note_number);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_credit_notes_user ON credit_notes(user_id);"))
        print("✅ Created credit_notes table")
        
        # Credit note applications table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS credit_note_applications (
                id TEXT PRIMARY KEY,
                credit_note_id TEXT NOT NULL REFERENCES credit_notes(id),
                invoice_id TEXT NOT NULL REFERENCES invoices(id),
                amount REAL NOT NULL,
                applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
                applied_by TEXT REFERENCES users(id)
            );
        """))
        print("✅ Created credit_note_applications table")
        
        # Email templates table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS email_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                template_type TEXT NOT NULL,
                subject TEXT NOT NULL,
                body_text TEXT,
                body_html TEXT,
                available_variables TEXT,
                is_active INTEGER DEFAULT 1,
                is_system INTEGER DEFAULT 0,
                created_by TEXT REFERENCES users(id),
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT
            );
        """))
        print("✅ Created email_templates table")
        
        # Currencies table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS currencies (
                id TEXT PRIMARY KEY,
                code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                symbol TEXT NOT NULL,
                symbol_position TEXT DEFAULT 'before',
                exchange_rate_to_usd REAL DEFAULT 1.0,
                is_base_currency INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                decimal_places TEXT DEFAULT '2',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies(code);"))
        print("✅ Created currencies table")
        
        # Exchange rates table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS exchange_rates (
                id TEXT PRIMARY KEY,
                from_currency TEXT NOT NULL,
                to_currency TEXT NOT NULL,
                rate REAL NOT NULL,
                date TEXT NOT NULL,
                source TEXT DEFAULT 'manual',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_exchange_rates_from ON exchange_rates(from_currency);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_exchange_rates_to ON exchange_rates(to_currency);"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(date);"))
        print("✅ Created exchange_rates table")
        
        # Tax rules table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS tax_rules (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                tax_type TEXT NOT NULL,
                rule_type TEXT NOT NULL,
                rate REAL NOT NULL,
                country_code TEXT,
                state_code TEXT,
                city TEXT,
                applicable_to_products TEXT,
                applicable_to_categories TEXT,
                customer_tax_id_required INTEGER DEFAULT 0,
                priority TEXT DEFAULT '0',
                is_active INTEGER DEFAULT 1,
                is_compound INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT
            );
        """))
        print("✅ Created tax_rules table")
        
        # Tax exemptions table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS tax_exemptions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL REFERENCES users(id),
                tax_rule_id TEXT REFERENCES tax_rules(id),
                exemption_reason TEXT,
                tax_id TEXT,
                certificate_file TEXT,
                valid_from TEXT,
                valid_until TEXT,
                is_active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT
            );
        """))
        print("✅ Created tax_exemptions table")
        
        # Affiliates table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS affiliates (
                id TEXT PRIMARY KEY,
                user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
                referral_code TEXT UNIQUE NOT NULL,
                commission_rate REAL DEFAULT 10.0,
                commission_type TEXT DEFAULT 'percentage',
                status TEXT DEFAULT 'pending',
                payment_method TEXT,
                payment_details TEXT,
                minimum_payout REAL DEFAULT 50.0,
                total_referrals INTEGER DEFAULT 0,
                total_commission_earned REAL DEFAULT 0.0,
                total_commission_paid REAL DEFAULT 0.0,
                total_commission_pending REAL DEFAULT 0.0,
                joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
                last_payout_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT
            );
        """))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(referral_code);"))
        print("✅ Created affiliates table")
        
        # Referrals table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS referrals (
                id TEXT PRIMARY KEY,
                affiliate_id TEXT NOT NULL REFERENCES affiliates(id),
                referred_user_id TEXT NOT NULL REFERENCES users(id),
                referral_code_used TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                referrer_url TEXT,
                converted INTEGER DEFAULT 0,
                conversion_date TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        """))
        print("✅ Created referrals table")
        
        # Commissions table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS commissions (
                id TEXT PRIMARY KEY,
                affiliate_id TEXT NOT NULL REFERENCES affiliates(id),
                referral_id TEXT REFERENCES referrals(id),
                order_id TEXT REFERENCES orders(id),
                payment_id TEXT REFERENCES payments(id),
                order_amount REAL NOT NULL,
                commission_rate REAL NOT NULL,
                commission_amount REAL NOT NULL,
                currency TEXT DEFAULT 'USD',
                status TEXT DEFAULT 'pending',
                earned_at TEXT DEFAULT CURRENT_TIMESTAMP,
                approved_at TEXT,
                paid_at TEXT
            );
        """))
        print("✅ Created commissions table")
        
        # Insert default currencies
        await conn.execute(text("""
            INSERT OR IGNORE INTO currencies (id, code, name, symbol, symbol_position, exchange_rate_to_usd, is_base_currency, is_active)
            VALUES 
                ('1', 'USD', 'US Dollar', '$', 'before', 1.0, 1, 1),
                ('2', 'EUR', 'Euro', '€', 'before', 0.92, 0, 1),
                ('3', 'GBP', 'British Pound', '£', 'before', 0.79, 0, 1),
                ('4', 'JPY', 'Japanese Yen', '¥', 'before', 149.50, 0, 1),
                ('5', 'CAD', 'Canadian Dollar', 'C$', 'before', 1.35, 0, 1),
                ('6', 'AUD', 'Australian Dollar', 'A$', 'before', 1.52, 0, 1);
        """))
        print("✅ Inserted default currencies")
        
        # Insert default email templates
        await conn.execute(text("""
            INSERT OR IGNORE INTO email_templates (id, name, template_type, subject, body_html, is_system, is_active)
            VALUES 
                ('1', 'Welcome Email', 'WELCOME', 'Welcome to {{company_name}}!', '<html><body><h2>Welcome!</h2><p>Hello {{customer_name}},</p><p>Welcome to {{company_name}}!</p></body></html>', 1, 1),
                ('2', 'Payment Confirmation', 'PAYMENT_CONFIRMATION', 'Payment Confirmed - {{invoice_number}}', '<html><body><h2>Payment Confirmed</h2><p>Thank you for your payment of {{amount}} {{currency}}.</p></body></html>', 1, 1),
                ('3', 'Invoice Generated', 'INVOICE_GENERATED', 'New Invoice - {{invoice_number}}', '<html><body><h2>New Invoice</h2><p>Your invoice {{invoice_number}} for {{amount}} {{currency}} is ready.</p></body></html>', 1, 1),
                ('4', 'Payment Failed', 'PAYMENT_FAILED', 'Payment Failed - Action Required', '<html><body><h2>Payment Failed</h2><p>Your payment for {{invoice_number}} failed. Please update your payment method.</p></body></html>', 1, 1),
                ('5', 'Renewal Reminder', 'RENEWAL_REMINDER', 'Renewal Reminder - {{subscription_name}}', '<html><body><h2>Renewal Reminder</h2><p>Your subscription {{subscription_name}} will renew on {{renewal_date}}.</p></body></html>', 1, 1);
        """))
        print("✅ Inserted default email templates")
        
        print("\n✅ All new feature tables created successfully!")


if __name__ == "__main__":
    asyncio.run(run_migration())

