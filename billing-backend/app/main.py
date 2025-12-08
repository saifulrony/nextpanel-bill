"""
FastAPI Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
from datetime import datetime
import socket
import os

from app.core.config import settings as config_settings
from app.core.database import init_db
from app.api.v1 import auth, licenses, plans, products, domains, domain_providers, domain_pricing, payments, subscriptions, invoices, usage, admin, notifications, analytics, support, events, customers, dashboard, nextpanel, payment_gateways, marketplace, orders, customization, pages, customer_domains, customer_subscriptions, customer_invoices, customer_profile, order_automation, staff
from app.api.v1 import settings as settings_api
from app.schemas import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if config_settings.DEBUG else logging.INFO,
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
    if config_settings.CORS_ALLOWED_HOSTS:
        env_hosts = [h.strip() for h in config_settings.CORS_ALLOWED_HOSTS.split(',') if h.strip()]
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
    title=config_settings.APP_NAME,
    version=config_settings.VERSION,
    description="Billing and License Management API for NextPanel",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# Add CORS middleware - Allow requests from same server IPs
allowed_origins = get_allowed_origins()
origin_regex = r"http(s)?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)(:\d+)?"
logger.info(f"CORS allowed origins: {len(allowed_origins)} origins")
logger.info(f"CORS origin regex: {origin_regex}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add exception handler to ensure CORS headers are included in error responses
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import re

def is_origin_allowed(origin: str) -> bool:
    """Check if origin is in allowed list or matches regex"""
    if not origin:
        return False
    # Check exact match
    if origin in allowed_origins:
        return True
    # Check regex match
    if re.match(origin_regex, origin):
        return True
    return False

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Ensure CORS headers are included in HTTP exception responses"""
    response = JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
    # Add CORS headers manually - always set them
    origin = request.headers.get("origin")
    if origin and is_origin_allowed(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    else:
        # Fallback to * if origin not in allowed list (for development)
        response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Ensure CORS headers are included in validation error responses"""
    # Log validation errors for debugging
    logger.error(f"Validation error on {request.url.path}: {exc.errors()}")
    logger.error(f"Request body: {exc.body}")
    
    response = JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body}
    )
    # Add CORS headers manually
    origin = request.headers.get("origin")
    if origin and is_origin_allowed(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Ensure CORS headers are included in all error responses"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    response = JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )
    # Add CORS headers manually - always set them
    origin = request.headers.get("origin")
    if origin and is_origin_allowed(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    else:
        # Fallback to * if origin not in allowed list (for development)
        response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response


# Mount static files for uploads
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version=config_settings.VERSION,
        database="connected",
        timestamp=datetime.utcnow()
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "NextPanel Billing API",
        "version": config_settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }


# Include routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(licenses.router, prefix="/api/v1")
app.include_router(plans.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(domains.router, prefix="/api/v1")
app.include_router(domain_providers.router, prefix="/api/v1/domain-providers", tags=["domain-providers"])
app.include_router(domain_pricing.router, prefix="/api/v1/domain-pricing", tags=["domain-pricing"])
app.include_router(payments.router, prefix="/api/v1", tags=["payments"])
app.include_router(payment_gateways.router, prefix="/api/v1")
app.include_router(subscriptions.router, prefix="/api/v1")
app.include_router(invoices.router, prefix="/api/v1")
app.include_router(usage.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(support.router, prefix="/api/v1")
app.include_router(marketplace.router, prefix="/api/v1")
app.include_router(settings_api.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(customers.router, prefix="/api/v1/customers", tags=["customers"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["orders"])
app.include_router(order_automation.router, prefix="/api/v1", tags=["order-automation"])
app.include_router(customer_domains.router, prefix="/api/v1/customer/domains", tags=["customer-domains"])
app.include_router(customer_subscriptions.router, prefix="/api/v1/customer/subscriptions", tags=["customer-subscriptions"])
app.include_router(customer_invoices.router, prefix="/api/v1/customer/billing", tags=["customer-billing"])
app.include_router(customer_profile.router, prefix="/api/v1/customer", tags=["customer-profile"])
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(nextpanel.router, prefix="/api/v1")
app.include_router(customization.router, prefix="/api/v1")
app.include_router(pages.router, prefix="/api/v1")
app.include_router(staff.router, prefix="/api/v1")

# Load and register installed addon routes dynamically
from app.core.addon_loader import AddonLoader
import os
addons_dir = os.path.join(os.path.dirname(__file__), "addons")
addon_loader = AddonLoader(addons_dir)
addon_loader.register_all_addons(app)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=config_settings.DEBUG,
        log_level="debug" if config_settings.DEBUG else "info"
    )

