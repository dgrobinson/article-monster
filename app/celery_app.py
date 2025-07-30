from celery import Celery
import os

# Create Celery app
celery_app = Celery(
    "article_library",
    broker=os.getenv("REDIS_URL", "redis://redis:6379"),
    backend=os.getenv("REDIS_URL", "redis://redis:6379"),
    include=[
        "app.tasks.email_tasks",
        "app.tasks.article_tasks"
    ]
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "check-emails": {
            "task": "app.tasks.email_tasks.check_fivefilters_emails",
            "schedule": 300.0,  # Every 5 minutes
        },
        "generate-weekly-digest": {
            "task": "app.tasks.article_tasks.generate_weekly_digest",
            "schedule": 86400.0,  # Daily check for weekly digest
        },
    },
)