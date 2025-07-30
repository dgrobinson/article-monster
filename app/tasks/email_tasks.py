from app.celery_app import celery_app
from app.services.email_service import check_emails

@celery_app.task
def check_fivefilters_emails():
    """Celery task to check for FiveFilters emails"""
    return check_emails()