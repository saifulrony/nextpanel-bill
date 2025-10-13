"""
FastAPI Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from datetime import datetime
import socket

from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import auth, licenses, plans, domains, payments, subscriptions, invoices, usage, admin, notifications, analytics, support, events, customers, dashboard, nextpanel, payment_gateways, chat
from app.schemas import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_allowed_origins():
    """Get all allowed origins based on server IPs and environment config"""
    origins = [
        'http://localhost',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4000',
        'http://127.0.0.1',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:4000',
    ]
    
    detected_ips = set()
    
    # Add IPs from environment variable (for Docker deployments)
    if settings.CORS_ALLOWED_HOSTS:
        env_hosts = [h.strip() for h in settings.CORS_ALLOWED_HOSTS.split(',') if h.strip()]
        detected_ips.update(env_hosts)
        logger.info(f"IPs from CORS_ALLOWED_HOSTS env: {env_hosts}")
    
    try:
        # Method 1: Get IP from hostname
        hostname = socket.gethostname()
        local_ips = socket.gethostbyname_ex(hostname)[2]
        detected_ips.update(local_ips)
        logger.info(f"IPs from hostname '{hostname}': {local_ips}")
    except Exception as e:
        logger.warning(f"Could not get IPs from hostname: {e}")
    
    try:
        # Method 2: Try to detect IP by connecting to external address
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        detected_ips.add(local_ip)
        logger.info(f"IP from socket connection: {local_ip}")
    except Exception as e:
        logger.warning(f"Could not get IP from socket: {e}")
    
    try:
        # Method 3: Check all network interfaces using netifaces if available
        import netifaces
        for interface in netifaces.interfaces():
            try:
                addrs = netifaces.ifaddresses(interface)
                if netifaces.AF_INET in addrs:
                    for addr in addrs[netifaces.AF_INET]:
                        ip = addr.get('addr')
                        if ip and not ip.startswith('127.'):
                            detected_ips.add(ip)
            except Exception:
                pass
        logger.info(f"IPs from netifaces: {detected_ips}")
    except ImportError:
        logger.debug("netifaces not available, skipping network interface detection")
    except Exception as e:
        logger.warning(f"Could not get IPs from netifaces: {e}")
    
    # Add all detected IPs to origins with various port combinations
    for ip in detected_ips:
        origins.extend([
            f'http://{ip}',
            f'http://{ip}:3000',
            f'http://{ip}:3001',
            f'http://{ip}:4000',
            f'https://{ip}',
            f'https://{ip}:3000',
            f'https://{ip}:3001',
            f'https://{ip}:4000',
        ])
    
    logger.info(f"Total detected IPs: {detected_ips}")
    logger.info(f"Allowed CORS origins count: {len(origins)}")
    
    return origins


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting NextPanel Billing API...")
    
    # Initialize database
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down NextPanel Billing API...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Billing and License Management API for NextPanel",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add CORS middleware - Allow requests from same server IPs
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        database="connected",
        timestamp=datetime.utcnow()
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NextPanel Billing API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }


# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(licenses.router, prefix="/api/v1")
app.include_router(plans.router, prefix="/api/v1")
app.include_router(domains.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(payment_gateways.router, prefix="/api/v1")
app.include_router(subscriptions.router, prefix="/api/v1")
app.include_router(invoices.router, prefix="/api/v1")
app.include_router(usage.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(support.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(customers.router, prefix="/api/v1/customers", tags=["customers"])
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(nextpanel.router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info"
    )

