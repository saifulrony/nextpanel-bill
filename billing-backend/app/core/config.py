"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # App
    APP_NAME: str = "NextPanel Billing"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    ENV: str = "development"
    
    # Database - Using SQLite for local development
    DATABASE_URL: str = "sqlite+aiosqlite:///./billing.db"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    
    # Security
    SECRET_KEY: str = "change_this_secret_key_to_something_random"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS - Configured dynamically in main.py based on server IPs
    # This ensures only requests from the same server are allowed
    CORS_ALLOWED_HOSTS: str = ""  # Comma-separated list of additional IPs/domains to allow
    
    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # Domain Registrar (ResellerClub)
    RESELLERCLUB_USER_ID: Optional[str] = None
    RESELLERCLUB_API_KEY: Optional[str] = None
    RESELLERCLUB_SANDBOX: bool = True
    
    # NextPanel Integration
    NEXTPANEL_API_URL: str = "http://localhost:9000/api"
    NEXTPANEL_API_KEY: Optional[str] = None
    
    # Email
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@billing.local"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

