from app.celery_app import celery_app
from app.services.digest_service import generate_weekly_digest

@celery_app.task
def generate_weekly_digest():
    """Celery task to generate weekly digest"""
    return generate_weekly_digest()