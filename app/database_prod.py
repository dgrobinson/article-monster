"""
Production-optimized database configuration with connection pooling,
caching, and performance enhancements.
"""

import os
import logging
from typing import Generator
from functools import lru_cache

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import redis
from prometheus_client import Counter, Histogram, Gauge

# Metrics
db_connections_total = Counter('db_connections_total', 'Total database connections created')
db_queries_total = Counter('db_queries_total', 'Total database queries executed', ['query_type'])
db_query_duration = Histogram('db_query_duration_seconds', 'Database query duration')
db_pool_size = Gauge('db_pool_size', 'Current database connection pool size')
db_pool_checked_out = Gauge('db_pool_checked_out', 'Currently checked out database connections')

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:password@db:5432/article_monster"
)

# Redis configuration for caching
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

# Connection pool settings
POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "20"))
MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "30"))
POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))
POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "3600"))  # 1 hour

# Create engine with optimized connection pool
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=POOL_SIZE,
    max_overflow=MAX_OVERFLOW,
    pool_timeout=POOL_TIMEOUT,
    pool_recycle=POOL_RECYCLE,
    pool_pre_ping=True,  # Verify connections before use
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",
    echo_pool=os.getenv("SQL_ECHO_POOL", "false").lower() == "true",
    connect_args={
        "options": "-c timezone=utc",
        "application_name": "article_monster",
        "connect_timeout": 10,
    }
)

# Session configuration
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine,
    expire_on_commit=False  # Prevent lazy loading issues
)

Base = declarative_base()

# Redis client for caching
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()  # Test connection
    logger.info("Redis connection established")
except Exception as e:
    logger.warning(f"Redis connection failed: {e}")
    redis_client = None

# Database event listeners for metrics
@event.listens_for(engine, "connect")
def receive_connect(dbapi_connection, connection_record):
    """Track new database connections."""
    db_connections_total.inc()
    logger.debug("New database connection established")

@event.listens_for(engine, "before_cursor_execute")
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Track query execution start."""
    context._query_start_time = time.time()

@event.listens_for(engine, "after_cursor_execute")
def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Track query execution completion."""
    total = time.time() - context._query_start_time
    db_query_duration.observe(total)
    
    # Determine query type
    query_type = statement.strip().split()[0].upper() if statement else "UNKNOWN"
    db_queries_total.labels(query_type=query_type).inc()

# Connection pool monitoring
def update_pool_metrics():
    """Update connection pool metrics."""
    pool = engine.pool
    db_pool_size.set(pool.size())
    db_pool_checked_out.set(pool.checkedout())

import time

# Dependency for getting database session
def get_db() -> Generator[Session, None, None]:
    """
    Get database session with automatic cleanup and error handling.
    """
    db = SessionLocal()
    try:
        update_pool_metrics()
        yield db
    except Exception as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# Caching utilities
class CacheManager:
    """Redis-based cache manager with fallback."""
    
    def __init__(self, redis_client=None, default_ttl=300):
        self.redis_client = redis_client
        self.default_ttl = default_ttl
        self.local_cache = {}  # Fallback in-memory cache
        self.max_local_cache_size = 1000
    
    def get(self, key: str):
        """Get value from cache."""
        if self.redis_client:
            try:
                return self.redis_client.get(key)
            except Exception as e:
                logger.warning(f"Redis get failed: {e}")
        
        # Fallback to local cache
        return self.local_cache.get(key)
    
    def set(self, key: str, value: str, ttl: int = None):
        """Set value in cache."""
        ttl = ttl or self.default_ttl
        
        if self.redis_client:
            try:
                self.redis_client.setex(key, ttl, value)
                return
            except Exception as e:
                logger.warning(f"Redis set failed: {e}")
        
        # Fallback to local cache
        if len(self.local_cache) >= self.max_local_cache_size:
            # Simple LRU: remove oldest items
            keys_to_remove = list(self.local_cache.keys())[:100]
            for k in keys_to_remove:
                del self.local_cache[k]
        
        self.local_cache[key] = value
    
    def delete(self, key: str):
        """Delete value from cache."""
        if self.redis_client:
            try:
                self.redis_client.delete(key)
            except Exception as e:
                logger.warning(f"Redis delete failed: {e}")
        
        self.local_cache.pop(key, None)
    
    def clear_pattern(self, pattern: str):
        """Clear keys matching pattern."""
        if self.redis_client:
            try:
                keys = self.redis_client.keys(pattern)
                if keys:
                    self.redis_client.delete(*keys)
            except Exception as e:
                logger.warning(f"Redis pattern clear failed: {e}")
        
        # For local cache, simple pattern matching
        keys_to_remove = [k for k in self.local_cache.keys() if pattern.replace('*', '') in k]
        for k in keys_to_remove:
            del self.local_cache[k]

# Global cache manager instance
cache_manager = CacheManager(redis_client)

# Database session with caching support
class CachedSession:
    """Database session wrapper with automatic caching."""
    
    def __init__(self, session: Session):
        self.session = session
        self.cache = cache_manager
    
    def get_cached_query(self, cache_key: str, query_func, ttl: int = 300):
        """Execute query with caching."""
        # Try cache first
        cached_result = self.cache.get(cache_key)
        if cached_result:
            try:
                import json
                return json.loads(cached_result)
            except:
                pass
        
        # Execute query
        result = query_func(self.session)
        
        # Cache the result
        try:
            import json
            self.cache.set(cache_key, json.dumps(result, default=str), ttl)
        except Exception as e:
            logger.warning(f"Failed to cache query result: {e}")
        
        return result

# Context manager for database transactions
from contextlib import contextmanager

@contextmanager
def db_transaction():
    """Context manager for database transactions with automatic rollback."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        logger.error(f"Transaction failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# Health check function
def check_database_health() -> dict:
    """Check database connection health."""
    try:
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            result.fetchone()
        
        pool = engine.pool
        pool_status = {
            "size": pool.size(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "checked_in": pool.checkedin()
        }
        
        return {
            "status": "healthy",
            "pool": pool_status
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

def check_redis_health() -> dict:
    """Check Redis connection health."""
    if not redis_client:
        return {"status": "unavailable"}
    
    try:
        redis_client.ping()
        info = redis_client.info()
        return {
            "status": "healthy",
            "used_memory": info.get("used_memory_human"),
            "connected_clients": info.get("connected_clients")
        }
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }

# Utility functions for performance optimization
def optimize_query(query):
    """Add common query optimizations."""
    # Add query hints and optimizations
    return query.execution_options(
        compiled_cache={},  # Enable compiled statement caching
        autocommit=False,
        isolation_level=None
    )

@lru_cache(maxsize=128)
def get_table_stats(table_name: str) -> dict:
    """Get cached table statistics."""
    try:
        with engine.connect() as conn:
            result = conn.execute(f"""
                SELECT 
                    schemaname,
                    tablename,
                    attname,
                    n_distinct,
                    correlation
                FROM pg_stats 
                WHERE tablename = '{table_name}'
                LIMIT 10
            """)
            return [dict(row) for row in result]
    except Exception as e:
        logger.error(f"Failed to get table stats: {e}")
        return []

# Query performance monitoring
class QueryPerformanceMonitor:
    """Monitor and log slow queries."""
    
    def __init__(self, slow_query_threshold: float = 1.0):
        self.slow_query_threshold = slow_query_threshold
    
    def monitor_query(self, query_func):
        """Decorator to monitor query performance."""
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = query_func(*args, **kwargs)
                duration = time.time() - start_time
                
                if duration > self.slow_query_threshold:
                    logger.warning(f"Slow query detected: {query_func.__name__} took {duration:.2f}s")
                
                return result
            except Exception as e:
                duration = time.time() - start_time
                logger.error(f"Query failed after {duration:.2f}s: {query_func.__name__}: {e}")
                raise
        
        return wrapper

# Global query monitor
query_monitor = QueryPerformanceMonitor()

# Database connection testing
def test_database_connection():
    """Test database connection and performance."""
    try:
        with engine.connect() as conn:
            # Test basic connectivity
            start_time = time.time()
            conn.execute("SELECT 1")
            connect_time = time.time() - start_time
            
            # Test query performance
            start_time = time.time()
            result = conn.execute("SELECT version()")
            version = result.fetchone()[0]
            query_time = time.time() - start_time
            
            logger.info(f"Database connection test successful:")
            logger.info(f"  Connection time: {connect_time:.3f}s")
            logger.info(f"  Query time: {query_time:.3f}s")
            logger.info(f"  PostgreSQL version: {version}")
            
            return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False

# Initialize database connection on import
if __name__ != "__main__":
    test_database_connection()