import smtplib
import imaplib
import email
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging
from typing import List, Dict, Optional
import os
from app.services.email_service import email_service

logger = logging.getLogger(__name__)

class TestEmailService:
    """Service for generating and sending test emails to improve processing"""
    
    def __init__(self):
        self.test_emails = {
            "fivefilters": self._create_fivefilters_test_email,
            "newsletter": self._create_newsletter_test_email,
            "forwarded_url": self._create_forwarded_url_test_email,
            "forwarded_newsletter": self._create_forwarded_newsletter_test_email,
            "complex_newsletter": self._create_complex_newsletter_test_email,
        }

    async def send_test_email(self, email_type: str, custom_data: Optional[Dict] = None) -> bool:
        """Send a test email of specified type"""
        if email_type not in self.test_emails:
            logger.error(f"Unknown test email type: {email_type}")
            return False
        
        try:
            # Generate test email
            msg = self.test_emails[email_type](custom_data or {})
            
            # Send to processing email (yourself)
            return await self._send_test_email(msg)
            
        except Exception as e:
            logger.error(f"Error sending test email: {e}")
            return False

    def _create_fivefilters_test_email(self, data: Dict) -> MIMEMultipart:
        """Create a test FiveFilters email"""
        msg = MIMEMultipart()
        msg['From'] = data.get('from', 'push@fivefilters.org')
        msg['To'] = email_service.smtp_username
        msg['Subject'] = data.get('subject', 'Test Article from FiveFilters')
        
        body = f"""
Test article from FiveFilters Full-Text RSS

Original URL: {data.get('url', 'https://example.com/test-article')}

This is a test email to verify FiveFilters processing.

Article content would normally be here...

--
Sent by FiveFilters.org Full-Text RSS
        """.strip()
        
        msg.attach(MIMEText(body, 'plain'))
        return msg

    def _create_newsletter_test_email(self, data: Dict) -> MIMEMultipart:
        """Create a test newsletter email"""
        msg = MIMEMultipart()
        msg['From'] = data.get('from', 'Morning Brew <crew@morningbrew.com>')
        msg['To'] = email_service.smtp_username
        msg['Subject'] = data.get('subject', 'Morning Brew Newsletter - Test Edition')
        
        body = f"""
<!DOCTYPE html>
<html>
<body>
<h1>Morning Brew - Test Edition</h1>
<p>Your daily dose of business news</p>

<h2>Today's Stories</h2>

<div>
<h3><a href="https://example.com/story1">Tech Company Raises $100M in Series B</a></h3>
<p>A promising startup just closed a major funding round...</p>
<a href="https://example.com/story1">Read more</a>
</div>

<div>
<h3><a href="https://example.com/story2">Market Update: Stocks Rise on Good News</a></h3>
<p>Markets are up today following positive economic indicators...</p>
<a href="https://example.com/story2">Continue reading</a>
</div>

<div>
<h3><a href="https://example.com/story3">New AI Breakthrough in Healthcare</a></h3>
<p>Researchers have developed a new AI system that can...</p>
<a href="https://example.com/story3">Full article</a>
</div>

<p><a href="https://unsubscribe.example.com">Unsubscribe</a> | <a href="https://facebook.com/morningbrew">Facebook</a></p>
</body>
</html>
        """.strip()
        
        msg.attach(MIMEText(body, 'html'))
        return msg

    def _create_forwarded_url_test_email(self, data: Dict) -> MIMEMultipart:
        """Create a test forwarded URL email"""
        msg = MIMEMultipart()
        msg['From'] = data.get('from', email_service.smtp_username)
        msg['To'] = email_service.smtp_username
        msg['Subject'] = data.get('subject', 'Fwd: Interesting Article')
        
        body = f"""
Check out this interesting article I found:

{data.get('url', 'https://example.com/interesting-article')}

Thought you might find it useful!
        """.strip()
        
        msg.attach(MIMEText(body, 'plain'))
        return msg

    def _create_forwarded_newsletter_test_email(self, data: Dict) -> MIMEMultipart:
        """Create a test forwarded newsletter"""
        msg = MIMEMultipart()
        msg['From'] = data.get('from', email_service.smtp_username)
        msg['To'] = email_service.smtp_username
        msg['Subject'] = data.get('subject', 'Fwd: The Hustle Daily Newsletter')
        
        body = """
---------- Forwarded message ---------
From: The Hustle <hello@thehustle.co>
Date: Mon, Mar 15, 2024 at 6:00 AM
Subject: The Hustle - Your daily business newsletter

# The Hustle Daily

## Today's big stories

**1. Meta's new AI model beats GPT-4**
Meta just released their latest AI model and it's impressive...
Read more: https://example.com/meta-ai-breakthrough

**2. Tesla stock jumps 15% on delivery numbers** 
Tesla delivered more cars than expected this quarter...
Full story: https://example.com/tesla-delivery-surge

**3. Startup of the day: GreenTech Solutions**
This company is revolutionizing solar energy...
Learn more: https://example.com/greentech-startup

## Market wrap
- S&P 500: +1.2%
- NASDAQ: +2.1%
- Bitcoin: $67,000 (+3.4%)

---
The Hustle Team
        """.strip()
        
        msg.attach(MIMEText(body, 'plain'))
        return msg

    def _create_complex_newsletter_test_email(self, data: Dict) -> MIMEMultipart:
        """Create a complex newsletter with multiple formats"""
        msg = MIMEMultipart('alternative')
        msg['From'] = data.get('from', 'TechCrunch <newsletter@techcrunch.com>')
        msg['To'] = email_service.smtp_username
        msg['Subject'] = data.get('subject', 'TechCrunch Daily Roundup')
        
        # Plain text version
        text_body = """
TechCrunch Daily Roundup

TOP STORIES:

1. OpenAI announces GPT-5 with revolutionary capabilities
   https://techcrunch.com/gpt5-announcement
   
2. Apple's secret AR project finally revealed  
   https://techcrunch.com/apple-ar-project
   
3. Startup Spotlight: EcoLogistics raises $50M
   https://techcrunch.com/ecologistics-funding

TRENDING:
- Crypto market analysis: https://techcrunch.com/crypto-analysis
- New iPhone rumors: https://techcrunch.com/iphone-rumors

Unsubscribe: https://techcrunch.com/unsubscribe
        """.strip()
        
        # HTML version
        html_body = """
<!DOCTYPE html>
<html>
<head><title>TechCrunch Daily</title></head>
<body>
<div style="max-width: 600px; margin: 0 auto;">
    <h1 style="color: #333;">TechCrunch Daily Roundup</h1>
    
    <h2>🔥 Top Stories</h2>
    
    <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
        <h3><a href="https://techcrunch.com/gpt5-announcement" style="color: #0066cc;">OpenAI announces GPT-5 with revolutionary capabilities</a></h3>
        <p>The latest version promises unprecedented reasoning abilities and multimodal understanding...</p>
        <a href="https://techcrunch.com/gpt5-announcement" style="color: #0066cc;">Read full article →</a>
    </div>
    
    <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
        <h3><a href="https://techcrunch.com/apple-ar-project" style="color: #0066cc;">Apple's secret AR project finally revealed</a></h3>
        <p>After years of speculation, Apple has confirmed their augmented reality initiative...</p>
        <a href="https://techcrunch.com/apple-ar-project" style="color: #0066cc;">Continue reading →</a>
    </div>
    
    <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
        <h3><a href="https://techcrunch.com/ecologistics-funding" style="color: #0066cc;">Startup Spotlight: EcoLogistics raises $50M</a></h3>
        <p>The green supply chain startup plans to expand across Europe...</p>
        <a href="https://techcrunch.com/ecologistics-funding" style="color: #0066cc;">Learn more →</a>
    </div>
    
    <h2>📈 Trending Now</h2>
    <ul>
        <li><a href="https://techcrunch.com/crypto-analysis">Crypto market shows signs of recovery</a></li>
        <li><a href="https://techcrunch.com/iphone-rumors">iPhone 16 rumors heat up</a></li>
    </ul>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
        <p>Follow us: <a href="https://twitter.com/techcrunch">Twitter</a> | <a href="https://facebook.com/techcrunch">Facebook</a></p>
        <p><a href="https://techcrunch.com/unsubscribe">Unsubscribe</a> | <a href="https://techcrunch.com/preferences">Manage preferences</a></p>
    </div>
</div>
</body>
</html>
        """.strip()
        
        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))
        return msg

    async def _send_test_email(self, msg: MIMEMultipart) -> bool:
        """Send the test email"""
        try:
            server = smtplib.SMTP(email_service.smtp_server, email_service.smtp_port)
            server.starttls()
            server.login(email_service.smtp_username, email_service.smtp_password)
            
            text = msg.as_string()
            server.sendmail(
                email_service.from_email, 
                [email_service.smtp_username], 
                text
            )
            server.quit()
            
            logger.info(f"Test email sent successfully: {msg['Subject']}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending test email: {e}")
            return False

    def get_available_test_types(self) -> List[str]:
        """Get list of available test email types"""
        return list(self.test_emails.keys())

    def get_test_type_description(self, email_type: str) -> str:
        """Get description of test email type"""
        descriptions = {
            "fivefilters": "Simple FiveFilters email with article URL",
            "newsletter": "HTML newsletter with multiple article links",
            "forwarded_url": "Forwarded email with single article URL",
            "forwarded_newsletter": "Forwarded newsletter (plain text format)",
            "complex_newsletter": "Complex HTML newsletter with mixed content",
        }
        return descriptions.get(email_type, "Unknown test type")

# Global test email service instance
test_email_service = TestEmailService()