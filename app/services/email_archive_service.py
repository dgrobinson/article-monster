import json
import email
from email.message import EmailMessage
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging
from app.database import SessionLocal
from app.models import EmailArchive
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class EmailArchiveService:
    """Service for archiving and replaying emails for testing and debugging"""
    
    def archive_email(self, email_message: email.message.EmailMessage, email_type: str = "unknown") -> Optional[int]:
        """Archive an incoming email for future replay and debugging"""
        db = SessionLocal()
        
        try:
            # Extract email components
            message_id = email_message.get('Message-ID', f"no-id-{datetime.now().isoformat()}")
            sender = email_message.get('From', '')
            recipient = email_message.get('To', '')
            subject = email_message.get('Subject', '')
            
            # Get raw email
            raw_email = str(email_message)
            
            # Extract headers as JSON
            headers = dict(email_message.items())
            headers_json = json.dumps(headers, default=str)
            
            # Extract body content
            body_text, body_html = self._extract_body_content(email_message)
            
            # Extract attachment info
            attachments = self._extract_attachment_info(email_message)
            attachments_json = json.dumps(attachments)
            
            # Check if already archived
            existing = db.query(EmailArchive).filter(
                EmailArchive.message_id == message_id
            ).first()
            
            if existing:
                logger.info(f"Email {message_id} already archived")
                return existing.id
            
            # Create archive record
            archive_record = EmailArchive(
                message_id=message_id,
                sender=sender,
                recipient=recipient,
                subject=subject,
                raw_email=raw_email,
                headers=headers_json,
                body_text=body_text,
                body_html=body_html,
                attachments=attachments_json,
                email_type=email_type,
                received_at=datetime.now()
            )
            
            db.add(archive_record)
            db.commit()
            db.refresh(archive_record)
            
            logger.info(f"Archived email {message_id} with ID {archive_record.id}")
            return archive_record.id
            
        except Exception as e:
            logger.error(f"Error archiving email: {e}")
            return None
        finally:
            db.close()

    def get_archived_emails(
        self, 
        limit: int = 50, 
        email_type: Optional[str] = None,
        sender: Optional[str] = None,
        days_back: Optional[int] = None
    ) -> List[Dict]:
        """Get archived emails for analysis"""
        db = SessionLocal()
        
        try:
            query = db.query(EmailArchive)
            
            if email_type:
                query = query.filter(EmailArchive.email_type == email_type)
            
            if sender:
                query = query.filter(EmailArchive.sender.ilike(f"%{sender}%"))
            
            if days_back:
                cutoff_date = datetime.now() - timedelta(days=days_back)
                query = query.filter(EmailArchive.received_at >= cutoff_date)
            
            archives = query.order_by(EmailArchive.received_at.desc()).limit(limit).all()
            
            return [
                {
                    "id": archive.id,
                    "message_id": archive.message_id,
                    "sender": archive.sender,
                    "subject": archive.subject,
                    "email_type": archive.email_type,
                    "received_at": archive.received_at.isoformat(),
                    "processed": archive.processed,
                    "replay_count": archive.replay_count,
                    "tags": archive.tags
                }
                for archive in archives
            ]
            
        except Exception as e:
            logger.error(f"Error retrieving archived emails: {e}")
            return []
        finally:
            db.close()

    def get_archived_email_details(self, archive_id: int) -> Optional[Dict]:
        """Get full details of an archived email"""
        db = SessionLocal()
        
        try:
            archive = db.query(EmailArchive).filter(EmailArchive.id == archive_id).first()
            
            if not archive:
                return None
            
            return {
                "id": archive.id,
                "message_id": archive.message_id,
                "sender": archive.sender,
                "recipient": archive.recipient,
                "subject": archive.subject,
                "email_type": archive.email_type,
                "received_at": archive.received_at.isoformat(),
                "processed": archive.processed,
                "replay_count": archive.replay_count,
                "last_replayed_at": archive.last_replayed_at.isoformat() if archive.last_replayed_at else None,
                "tags": archive.tags,
                "raw_email": archive.raw_email,
                "headers": json.loads(archive.headers) if archive.headers else {},
                "body_text": archive.body_text,
                "body_html": archive.body_html,
                "attachments": json.loads(archive.attachments) if archive.attachments else [],
                "processing_result": json.loads(archive.processing_result) if archive.processing_result else None
            }
            
        except Exception as e:
            logger.error(f"Error getting archived email details: {e}")
            return None
        finally:
            db.close()

    async def replay_archived_email(self, archive_id: int) -> Dict:
        """Replay an archived email through the processing pipeline"""
        db = SessionLocal()
        
        try:
            archive = db.query(EmailArchive).filter(EmailArchive.id == archive_id).first()
            
            if not archive:
                return {"success": False, "error": "Archived email not found"}
            
            # Reconstruct email message
            email_message = email.message_from_string(archive.raw_email)
            
            # Process through email service
            from app.services.email_service import email_service
            
            # Create a mock IMAP connection context
            processing_result = await self._replay_email_processing(email_message, archive.email_type)
            
            # Update archive record
            archive.replay_count += 1
            archive.last_replayed_at = datetime.now()
            archive.processing_result = json.dumps(processing_result, default=str)
            
            db.commit()
            
            logger.info(f"Replayed archived email {archive_id}")
            
            return {
                "success": True,
                "archive_id": archive_id,
                "replay_count": archive.replay_count,
                "processing_result": processing_result
            }
            
        except Exception as e:
            logger.error(f"Error replaying archived email: {e}")
            return {"success": False, "error": str(e)}
        finally:
            db.close()

    async def _replay_email_processing(self, email_message: email.message.EmailMessage, email_type: str) -> Dict:
        """Replay email through processing pipeline"""
        try:
            db = SessionLocal()
            
            # Import here to avoid circular imports
            from app.services.email_service import email_service
            
            subject = email_message.get('Subject', '')
            sender = email_message.get('From', '')
            
            # Process based on email type
            if email_service._is_fivefilters_email(sender, subject):
                await email_service._process_fivefilters_content(email_message, db)
                return {"type": "fivefilters", "processed": True}
            elif email_service._is_newsletter_email(sender, subject):
                await email_service._process_newsletter_content(email_message, db)
                return {"type": "newsletter", "processed": True}
            else:
                await email_service._process_generic_email(email_message, db)
                return {"type": "generic", "processed": True}
                
        except Exception as e:
            return {"type": "error", "processed": False, "error": str(e)}
        finally:
            db.close()

    def update_processing_result(self, archive_id: int, processing_result: Dict):
        """Update the processing result for an archived email"""
        db = SessionLocal()
        
        try:
            archive = db.query(EmailArchive).filter(EmailArchive.id == archive_id).first()
            
            if archive:
                archive.processing_result = json.dumps(processing_result, default=str)
                archive.processed = True
                db.commit()
                
        except Exception as e:
            logger.error(f"Error updating processing result: {e}")
        finally:
            db.close()

    def add_tags_to_email(self, archive_id: int, tags: List[str]):
        """Add tags to an archived email for categorization"""
        db = SessionLocal()
        
        try:
            archive = db.query(EmailArchive).filter(EmailArchive.id == archive_id).first()
            
            if archive:
                existing_tags = archive.tags.split(',') if archive.tags else []
                all_tags = list(set(existing_tags + tags))
                archive.tags = ','.join(tag.strip() for tag in all_tags if tag.strip())
                db.commit()
                
        except Exception as e:
            logger.error(f"Error adding tags: {e}")
        finally:
            db.close()

    def get_email_statistics(self) -> Dict:
        """Get statistics about archived emails"""
        db = SessionLocal()
        
        try:
            total_emails = db.query(EmailArchive).count()
            processed_emails = db.query(EmailArchive).filter(EmailArchive.processed == True).count()
            
            # Count by email type
            type_counts = {}
            types = db.query(EmailArchive.email_type).distinct().all()
            for (email_type,) in types:
                if email_type:
                    count = db.query(EmailArchive).filter(EmailArchive.email_type == email_type).count()
                    type_counts[email_type] = count
            
            # Recent activity (last 7 days)
            from datetime import timedelta
            week_ago = datetime.now() - timedelta(days=7)
            recent_count = db.query(EmailArchive).filter(EmailArchive.received_at >= week_ago).count()
            
            return {
                "total_emails": total_emails,
                "processed_emails": processed_emails,
                "processing_rate": f"{(processed_emails/total_emails*100):.1f}%" if total_emails > 0 else "0%",
                "by_type": type_counts,
                "recent_week": recent_count
            }
            
        except Exception as e:
            logger.error(f"Error getting email statistics: {e}")
            return {}
        finally:
            db.close()

    def _extract_body_content(self, email_message: email.message.EmailMessage) -> tuple:
        """Extract plain text and HTML body content"""
        body_text = ""
        body_html = ""
        
        if email_message.is_multipart():
            for part in email_message.walk():
                content_type = part.get_content_type()
                try:
                    payload = part.get_payload(decode=True)
                    if payload:
                        decoded = payload.decode('utf-8', errors='ignore')
                        if content_type == "text/plain":
                            body_text += decoded + "\n"
                        elif content_type == "text/html":
                            body_html += decoded + "\n"
                except:
                    continue
        else:
            try:
                payload = email_message.get_payload(decode=True)
                if payload:
                    content = payload.decode('utf-8', errors='ignore')
                    content_type = email_message.get_content_type()
                    if content_type == "text/plain":
                        body_text = content
                    elif content_type == "text/html":
                        body_html = content
                    else:
                        body_text = content  # Default to text
            except:
                body_text = str(email_message.get_payload())
        
        return body_text.strip(), body_html.strip()

    def _extract_attachment_info(self, email_message: email.message.EmailMessage) -> List[Dict]:
        """Extract information about email attachments"""
        attachments = []
        
        if email_message.is_multipart():
            for part in email_message.walk():
                if part.get_content_disposition() == 'attachment':
                    filename = part.get_filename()
                    if filename:
                        attachments.append({
                            "filename": filename,
                            "content_type": part.get_content_type(),
                            "size": len(part.get_payload(decode=True)) if part.get_payload(decode=True) else 0
                        })
        
        return attachments

# Global email archive service
email_archive_service = EmailArchiveService()