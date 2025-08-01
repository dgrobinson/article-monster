"""
Production-optimized FastAPI application with monitoring, caching,
performance optimizations, and comprehensive error handling.
"""

import os
import time
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import structlog
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from dotenv import load_dotenv

# Import database and routers
from app.database_prod import engine, Base, check_database_health, check_redis_health
from app.routers import articles, newsletters, health, email, testing, archive

# Load environment variables
load_dotenv()

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Prometheus metrics
http_requests_total = Counter(
    'http_requests_total', 
    'Total HTTP requests', 
    ['method', 'endpoint', 'status_code']
)
http_request_duration = Histogram(
    'http_request_duration_seconds', 
    'HTTP request duration',
    ['method', 'endpoint']
)
http_requests_in_progress = Gauge(
    'http_requests_in_progress', 
    'HTTP requests currently being processed'
)
application_info = Gauge(
    'application_info',
    'Application information',
    ['version', 'environment']
)

# Application configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
ENABLE_GZIP = os.getenv("ENABLE_GZIP", "true").lower() == "true"
GZIP_MINIMUM_SIZE = int(os.getenv("GZIP_MINIMUM_SIZE", "1024"))

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management."""
    logger.info("Starting Article Monster application", environment=ENVIRONMENT, version=APP_VERSION)
    
    # Initialize database
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified successfully")
    except Exception as e:
        logger.error("Failed to initialize database", error=str(e))
        raise
    
    # Set application info metric
    application_info.labels(version=APP_VERSION, environment=ENVIRONMENT).set(1)
    
    # Startup health checks
    db_health = check_database_health()
    redis_health = check_redis_health()
    
    logger.info("Startup health check", database=db_health, redis=redis_health)
    
    if db_health["status"] != "healthy":
        logger.error("Database health check failed at startup")
        raise RuntimeError("Database is not healthy")
    
    logger.info("Application startup completed successfully")
    
    yield
    
    # Cleanup
    logger.info("Shutting down Article Monster application")

# Create FastAPI application
app = FastAPI(
    title="Article Monster",
    description="Production-ready article and newsletter management system with comprehensive monitoring",
    version=APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if ENVIRONMENT != "production" else None,
    openapi_url="/openapi.json" if ENVIRONMENT != "production" else None,
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=ALLOWED_HOSTS + ["*"] if ENVIRONMENT != "production" else ALLOWED_HOSTS
)

# Performance middleware
if ENABLE_GZIP:
    app.add_middleware(
        GZipMiddleware, 
        minimum_size=GZIP_MINIMUM_SIZE
    )

# CORS middleware (restrictive in production)
if ENVIRONMENT == "production":
    allowed_origins = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else []
else:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Custom middleware for metrics and logging
class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware for request metrics and structured logging."""
    
    async def dispatch(self, request: Request, call_next):
        # Extract request information
        method = request.method
        path = request.url.path
        start_time = time.time()
        
        # Increment in-progress requests
        http_requests_in_progress.inc()
        
        # Log request start
        logger.info(
            "Request started",
            method=method,
            path=path,
            client_ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration = time.time() - start_time
            
            # Update metrics
            http_requests_total.labels(
                method=method, 
                endpoint=path, 
                status_code=response.status_code
            ).inc()
            
            http_request_duration.labels(
                method=method, 
                endpoint=path
            ).observe(duration)
            
            # Log request completion
            logger.info(
                "Request completed",
                method=method,
                path=path,
                status_code=response.status_code,
                duration=duration,
            )
            
            # Add custom headers
            response.headers["X-Process-Time"] = str(duration)
            response.headers["X-App-Version"] = APP_VERSION
            
            return response
            
        except Exception as e:
            duration = time.time() - start_time
            
            # Update metrics for errors
            http_requests_total.labels(
                method=method, 
                endpoint=path, 
                status_code=500
            ).inc()
            
            # Log error
            logger.error(
                "Request failed",
                method=method,
                path=path,
                duration=duration,
                error=str(e),
                exc_info=True,
            )
            
            raise
        
        finally:
            # Decrement in-progress requests
            http_requests_in_progress.dec()

# Add metrics middleware
app.add_middleware(MetricsMiddleware)

# Custom exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler with structured logging."""
    logger.warning(
        "HTTP exception",
        status_code=exc.status_code,
        detail=exc.detail,
        path=request.url.path,
        method=request.method,
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": time.time(),
            "path": str(request.url.path),
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """General exception handler for unhandled errors."""
    logger.error(
        "Unhandled exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        exc_info=True,
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "timestamp": time.time(),
            "path": str(request.url.path),
        }
    )

# Health check endpoints
@app.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": APP_VERSION,
        "environment": ENVIRONMENT,
    }

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with database and Redis status."""
    db_health = check_database_health()
    redis_health = check_redis_health()
    
    overall_status = "healthy"
    if db_health["status"] != "healthy":
        overall_status = "unhealthy"
    
    return {
        "status": overall_status,
        "timestamp": time.time(),
        "version": APP_VERSION,
        "environment": ENVIRONMENT,
        "components": {
            "database": db_health,
            "redis": redis_health,
        }
    }

# Metrics endpoint
@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

# Include routers with prefix
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(articles.router, prefix="/api/v1", tags=["Articles"])
app.include_router(newsletters.router, prefix="/api/v1", tags=["Newsletters"])
app.include_router(email.router, prefix="/api/v1", tags=["Email"])
app.include_router(testing.router, prefix="/api/v1", tags=["Testing"])
app.include_router(archive.router, prefix="/api/v1", tags=["Archive"])

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with application information."""
    return {
        "message": "Article Monster API",
        "version": APP_VERSION,
        "environment": ENVIRONMENT,
        "status": "running",
        "timestamp": time.time(),
        "docs": "/docs" if ENVIRONMENT != "production" else "disabled",
    }

# Startup event for additional initialization
@app.on_event("startup")
async def startup_event():
    """Additional startup tasks."""
    logger.info("Performing additional startup tasks")
    
    # Warm up connection pools
    try:
        db_health = check_database_health()
        logger.info("Connection pool warmed up", database_health=db_health)
    except Exception as e:
        logger.warning("Connection pool warmup failed", error=str(e))

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup tasks on shutdown."""
    logger.info("Performing shutdown cleanup")
    
    # Close database connections
    try:
        engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error("Error closing database connections", error=str(e))

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses."""
    response = await call_next(request)
    
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    if ENVIRONMENT == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    
    return response

# Rate limiting (basic implementation)
from collections import defaultdict
from datetime import datetime, timedelta

class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self, max_requests: int = 100, window_minutes: int = 1):
        self.max_requests = max_requests
        self.window = timedelta(minutes=window_minutes)
        self.requests = defaultdict(list)
    
    def is_allowed(self, client_ip: str) -> bool:
        """Check if client is within rate limit."""
        now = datetime.now()
        client_requests = self.requests[client_ip]
        
        # Remove old requests
        cutoff = now - self.window
        self.requests[client_ip] = [req_time for req_time in client_requests if req_time > cutoff]
        
        # Check current rate
        if len(self.requests[client_ip]) >= self.max_requests:
            return False
        
        # Add current request
        self.requests[client_ip].append(now)
        return True

# Global rate limiter
rate_limiter = RateLimiter(
    max_requests=int(os.getenv("RATE_LIMIT_REQUESTS", "100")),
    window_minutes=int(os.getenv("RATE_LIMIT_WINDOW", "1"))
)

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    """Rate limiting middleware."""
    client_ip = request.client.host if request.client else "unknown"
    
    if not rate_limiter.is_allowed(client_ip):
        logger.warning("Rate limit exceeded", client_ip=client_ip, path=request.url.path)
        return JSONResponse(
            status_code=429,
            content={
                "error": "Rate limit exceeded",
                "status_code": 429,
                "timestamp": time.time(),
            }
        )
    
    return await call_next(request)

if __name__ == "__main__":
    import uvicorn
    
    # Development server configuration
    uvicorn.run(
        "app.main_prod:app",
        host="0.0.0.0",
        port=8000,
        reload=ENVIRONMENT != "production",
        workers=1 if ENVIRONMENT != "production" else int(os.getenv("WORKERS", "4")),
        log_level="info",
        access_log=True,
    )