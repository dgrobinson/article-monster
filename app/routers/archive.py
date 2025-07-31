from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel
from typing import Optional, List
from app.services.email_archive_service import email_archive_service

router = APIRouter(prefix="/archive", tags=["email-archive"])

class AddTagsRequest(BaseModel):
    tags: List[str]

@router.get("/emails")
async def get_archived_emails(
    limit: int = Query(50, description="Number of emails to return"),
    email_type: Optional[str] = Query(None, description="Filter by email type"),
    sender: Optional[str] = Query(None, description="Filter by sender"),
    days_back: Optional[int] = Query(None, description="Only emails from N days back")
):
    """Get list of archived emails"""
    emails = email_archive_service.get_archived_emails(
        limit=limit,
        email_type=email_type,
        sender=sender,
        days_back=days_back
    )
    
    return {
        "emails": emails,
        "count": len(emails),
        "filters_applied": {
            "email_type": email_type,
            "sender": sender,
            "days_back": days_back,
            "limit": limit
        }
    }

@router.get("/emails/{archive_id}")
async def get_archived_email_details(archive_id: int):
    """Get full details of a specific archived email"""
    details = email_archive_service.get_archived_email_details(archive_id)
    
    if not details:
        raise HTTPException(status_code=404, detail="Archived email not found")
    
    return details

@router.post("/emails/{archive_id}/replay")
async def replay_archived_email(
    archive_id: int,
    background_tasks: BackgroundTasks
):
    """Replay an archived email through the processing pipeline"""
    
    # Check if email exists
    details = email_archive_service.get_archived_email_details(archive_id)
    if not details:
        raise HTTPException(status_code=404, detail="Archived email not found")
    
    # Run replay in background
    background_tasks.add_task(email_archive_service.replay_archived_email, archive_id)
    
    return {
        "message": f"Replay started for archived email {archive_id}",
        "archive_id": archive_id,
        "email_subject": details["subject"],
        "email_type": details["email_type"]
    }

@router.post("/emails/{archive_id}/tags")
async def add_tags_to_email(archive_id: int, request: AddTagsRequest):
    """Add tags to an archived email for categorization"""
    
    # Check if email exists
    details = email_archive_service.get_archived_email_details(archive_id)
    if not details:
        raise HTTPException(status_code=404, detail="Archived email not found")
    
    email_archive_service.add_tags_to_email(archive_id, request.tags)
    
    return {
        "message": f"Tags added to archived email {archive_id}",
        "added_tags": request.tags
    }

@router.get("/statistics")
async def get_archive_statistics():
    """Get statistics about archived emails"""
    stats = email_archive_service.get_email_statistics()
    return stats

@router.get("/email-types")
async def get_email_types():
    """Get available email types for filtering"""
    return {
        "available_types": [
            "fivefilters",
            "newsletter", 
            "forwarded",
            "unknown"
        ],
        "descriptions": {
            "fivefilters": "Emails from FiveFilters service",
            "newsletter": "Detected newsletter emails",
            "forwarded": "Forwarded emails or generic content",
            "unknown": "Unclassified emails"
        }
    }

@router.post("/batch-replay")
async def batch_replay_emails(
    background_tasks: BackgroundTasks,
    email_type: Optional[str] = Query(None, description="Replay only emails of this type"),
    sender: Optional[str] = Query(None, description="Replay only emails from this sender"),
    limit: int = Query(10, description="Maximum number of emails to replay")
):
    """Replay multiple archived emails for batch testing"""
    
    # Get emails matching criteria
    emails = email_archive_service.get_archived_emails(
        limit=limit,
        email_type=email_type,
        sender=sender
    )
    
    if not emails:
        return {
            "message": "No emails found matching criteria",
            "replayed_count": 0
        }
    
    # Start replay tasks
    for email in emails:
        background_tasks.add_task(
            email_archive_service.replay_archived_email, 
            email["id"]
        )
    
    return {
        "message": f"Batch replay started for {len(emails)} emails",
        "replayed_count": len(emails),
        "criteria": {
            "email_type": email_type,
            "sender": sender,
            "limit": limit
        }
    }

@router.get("/recent-activity")
async def get_recent_archive_activity():
    """Get recent archiving and replay activity"""
    recent_emails = email_archive_service.get_archived_emails(limit=20, days_back=7)
    
    # Group by email type
    activity_by_type = {}
    replay_activity = []
    
    for email in recent_emails:
        email_type = email.get("email_type", "unknown")
        if email_type not in activity_by_type:
            activity_by_type[email_type] = 0
        activity_by_type[email_type] += 1
        
        if email.get("replay_count", 0) > 0:
            replay_activity.append({
                "id": email["id"],
                "subject": email["subject"],
                "replay_count": email["replay_count"],
                "sender": email["sender"]
            })
    
    return {
        "recent_emails_count": len(recent_emails),
        "activity_by_type": activity_by_type,
        "recent_replays": replay_activity,
        "time_period": "last_7_days"
    }

@router.get("/debug-info/{archive_id}")
async def get_debug_info(archive_id: int):
    """Get detailed debugging information for an archived email"""
    details = email_archive_service.get_archived_email_details(archive_id)
    
    if not details:
        raise HTTPException(status_code=404, detail="Archived email not found")
    
    # Add debugging insights
    debug_info = {
        "basic_info": {
            "id": details["id"],
            "subject": details["subject"],
            "sender": details["sender"],
            "email_type": details["email_type"],
            "received_at": details["received_at"]
        },
        "processing_info": {
            "processed": details["processed"],
            "replay_count": details["replay_count"],
            "last_replayed_at": details["last_replayed_at"],
            "processing_result": details["processing_result"]
        },
        "content_analysis": {
            "has_html": bool(details["body_html"]),
            "has_text": bool(details["body_text"]),
            "attachment_count": len(details["attachments"]),
            "text_length": len(details["body_text"]) if details["body_text"] else 0,
            "html_length": len(details["body_html"]) if details["body_html"] else 0
        },
        "headers": details["headers"],
        "raw_email_preview": details["raw_email"][:1000] + "..." if len(details["raw_email"]) > 1000 else details["raw_email"]
    }
    
    return debug_info