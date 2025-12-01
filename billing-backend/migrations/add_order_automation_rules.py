"""
Migration: Add order_automation_rules table
Date: 2024
"""
import asyncio
from sqlalchemy import text
from app.core.database import engine


async def run_migration():
    """Add order_automation_rules table"""
    async with engine.begin() as conn:
        # Create enum types
        await conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE automationaction AS ENUM ('send_email', 'charge_payment', 'send_reminder', 'update_status');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        
        await conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE automationtrigger AS ENUM ('on_due_date', 'before_due_date', 'after_due_date', 'on_create', 'custom_interval', 'recurring');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        
        await conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE automationrulestatus AS ENUM ('active', 'paused', 'completed', 'disabled');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        
        # Create table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS order_automation_rules (
                id VARCHAR(36) PRIMARY KEY,
                order_id VARCHAR(36) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                trigger_type automationtrigger NOT NULL,
                trigger_value INTEGER,
                trigger_unit VARCHAR(20),
                action_type automationaction NOT NULL,
                action_config JSONB,
                is_recurring BOOLEAN DEFAULT FALSE,
                recurring_interval INTEGER,
                recurring_unit VARCHAR(20),
                max_executions INTEGER,
                execution_count INTEGER DEFAULT 0,
                next_execution TIMESTAMP WITH TIME ZONE,
                last_execution TIMESTAMP WITH TIME ZONE,
                status automationrulestatus DEFAULT 'active',
                is_enabled BOOLEAN DEFAULT TRUE,
                last_result JSONB,
                error_count INTEGER DEFAULT 0,
                last_error TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE,
                CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            );
        """))
        
        # Create indexes
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_order_automation_rules_order_id 
            ON order_automation_rules(order_id);
        """))
        
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_order_automation_rules_next_execution 
            ON order_automation_rules(next_execution);
        """))
        
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_order_automation_rules_status 
            ON order_automation_rules(status);
        """))
        
        print("✅ Migration completed: order_automation_rules table created")


if __name__ == "__main__":
    asyncio.run(run_migration())

