from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from app.services.email_service import email_service

router = APIRouter(prefix="/email", tags=["email"])

class EmailTestRequest(BaseModel):
    article_id: int

class ProcessEmailsRequest(BaseModel):
    force_check: bool = False

@router.post("/check-emails")
async def check_emails(
    request: ProcessEmailsRequest,
    background_tasks: BackgroundTasks
):
    """Manually trigger email checking"""
    background_tasks.add_task(email_service.check_for_incoming_emails)
    return {"message": "Email check started"}

@router.post("/send-to-kindle")
async def send_test_to_kindle(
    request: EmailTestRequest,
    background_tasks: BackgroundTasks
):
    """Test sending an article to Kindle"""
    background_tasks.add_task(email_service.send_to_kindle, request.article_id)
    return {"message": f"Sending article {request.article_id} to Kindle"}

@router.get("/status")
async def email_status():
    """Get email service configuration status"""
    return {
        "smtp_configured": bool(email_service.smtp_username),
        "kindle_email_configured": bool(email_service.kindle_email),
        "processing_email": email_service.smtp_username,
        "kindle_email": email_service.kindle_email
    }