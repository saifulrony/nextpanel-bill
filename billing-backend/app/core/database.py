"""
Database configuration and session management
"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings

# Determine engine configuration based on database type
engine_kwargs = {
    "echo": settings.DEBUG,
    "future": True,
}

# Add pooling options only for PostgreSQL
if "postgresql" in settings.DATABASE_URL:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
    })
elif "sqlite" in settings.DATABASE_URL:
    engine_kwargs.update({
        "connect_args": {"check_same_thread": False}
    })

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def get_db():
    """Dependency for getting database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        # Add migration for order_id column if it doesn't exist
        from sqlalchemy import text
        try:
            # Check if order_id column exists
            result = await conn.execute(text("PRAGMA table_info(payments)"))
            columns = [row[1] for row in result.fetchall()]
            
            if 'order_id' not in columns:
                # Add order_id column to payments table
                await conn.execute(text("ALTER TABLE payments ADD COLUMN order_id TEXT REFERENCES orders(id)"))
                print("✅ Added order_id column to payments table")
        except Exception as e:
            print(f"⚠️ Migration warning: {e}")

