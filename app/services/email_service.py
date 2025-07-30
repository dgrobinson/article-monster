import smtplib
import imaplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
import os
from datetime import datetime
import logging
from app.database import SessionLocal
from app.models import Article, Newsletter, EmailQueue
import re
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        
        self.imap_server = os.getenv("IMAP_SERVER", "imap.gmail.com")
        self.imap_port = int(os.getenv("IMAP_PORT", "993"))
        
        self.kindle_email = os.getenv("KINDLE_EMAIL")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_username)

    async def send_to_kindle(self, article_id: int):
        """Send article to Kindle via email"""
        db = SessionLocal()
        
        try:
            article = db.query(Article).filter(Article.id == article_id).first()
            if not article or not article.processed:
                logger.error(f"Article {article_id} not found or not processed")
                return
            
            if not self.kindle_email:
                logger.error("Kindle email not configured")
                return
            
            # Create email with article content
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = self.kindle_email
            msg['Subject'] = f"Article: {article.title[:100]}"
            
            # Format content for Kindle
            kindle_content = self.format_for_kindle(article)
            body = MIMEText(kindle_content, 'plain', 'utf-8')
            msg.attach(body)
            
            # Send email
            success = await self._send_email(msg)
            
            if success:
                article.sent_to_kindle = True
                db.commit()
                logger.info(f"Article {article_id} sent to Kindle")
            
        except Exception as e:
            logger.error(f"Error sending article {article_id} to Kindle: {e}")
        finally:
            db.close()

    def format_for_kindle(self, article: Article) -> str:
        """Format article content for optimal Kindle reading"""
        content = f"# {article.title}\n\n"
        
        if article.author:
            content += f"**By: {article.author}**\n\n"
        
        if article.url:
            content += f"**Source:** {article.url}\n\n"
        
        if article.publication_date:
            content += f"**Published:** {article.publication_date.strftime('%Y-%m-%d')}\n\n"
        
        content += "---\n\n"
        content += article.content or ""
        
        return content

    async def check_for_fivefilters_emails(self):
        """Check for incoming emails from FiveFilters and process them"""
        try:
            mail = imaplib.IMAP4_SSL(self.imap_server, self.imap_port)
            mail.login(self.smtp_username, self.smtp_password)
            mail.select('inbox')
            
            # Search for unread emails from FiveFilters
            status, messages = mail.search(None, 'UNSEEN FROM "fivefilters"')
            
            if status == 'OK':
                for num in messages[0].split():
                    await self._process_fivefilters_email(mail, num)
            
            mail.close()
            mail.logout()
            
        except Exception as e:
            logger.error(f"Error checking emails: {e}")

    async def _process_fivefilters_email(self, mail, email_num):
        """Process a single FiveFilters email"""
        db = SessionLocal()
        
        try:
            status, msg_data = mail.fetch(email_num, '(RFC822)')
            
            if status == 'OK':
                email_body = msg_data[0][1]
                email_message = email.message_from_bytes(email_body)
                
                subject = email_message['Subject']
                sender = email_message['From']
                
                # Extract URLs from email content
                urls = self._extract_urls_from_email(email_message)
                
                for url in urls:
                    # Check if article already exists
                    existing = db.query(Article).filter(Article.url == url).first()
                    
                    if not existing:
                        # Create new article
                        article = Article(
                            title=subject or "Article from FiveFilters",
                            url=url,
                            source="fivefilters_email",
                            created_at=datetime.now()
                        )
                        db.add(article)
                        db.commit()
                        db.refresh(article)
                        
                        # Process article content
                        from app.services.article_extractor import extract_article_content
                        await extract_article_content(article.id, send_to_kindle=True)
                
                # Mark email as read
                mail.store(email_num, '+FLAGS', '\\Seen')
                
        except Exception as e:
            logger.error(f"Error processing FiveFilters email: {e}")
        finally:
            db.close()

    def _extract_urls_from_email(self, email_message) -> list:
        """Extract URLs from email content"""
        urls = []
        
        # Get email body
        body = ""
        if email_message.is_multipart():
            for part in email_message.walk():
                if part.get_content_type() == "text/plain":
                    body += part.get_payload(decode=True).decode('utf-8', errors='ignore')
        else:
            body = email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
        
        # Extract URLs using regex
        url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        found_urls = re.findall(url_pattern, body)
        
        # Filter out email tracking and common non-article URLs
        for url in found_urls:
            if self._is_article_url(url):
                urls.append(url)
        
        return urls

    def _is_article_url(self, url: str) -> bool:
        """Check if URL is likely an article (filter out tracking, social, etc.)"""
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        
        # Filter out common non-article domains
        exclude_domains = [
            'google.com', 'facebook.com', 'twitter.com', 'linkedin.com',
            'instagram.com', 'youtube.com', 'unsubscribe', 'tracking'
        ]
        
        for exclude in exclude_domains:
            if exclude in domain:
                return False
        
        return True

    async def _send_email(self, msg) -> bool:
        """Send email via SMTP"""
        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            
            text = msg.as_string()
            server.sendmail(self.from_email, [self.kindle_email], text)
            server.quit()
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False

# Global email service instance
email_service = EmailService()

# Convenience functions for background tasks
async def send_to_kindle(article_id: int):
    await email_service.send_to_kindle(article_id)

async def check_emails():
    await email_service.check_for_fivefilters_emails()