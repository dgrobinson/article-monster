from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Article(Base):
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    url = Column(String, nullable=False, unique=True)
    content = Column(Text)
    markdown_content = Column(Text)  # Markdown with YAML frontmatter
    summary = Column(Text)  # Simple text summary (first 200 words)
    ai_summary_brief = Column(Text)  # AI-generated brief summary (1-2 sentences)
    ai_summary_standard = Column(Text)  # AI-generated standard summary (paragraph)
    ai_summary_detailed = Column(Text)  # AI-generated detailed summary (multiple paragraphs)
    ai_summary_provider = Column(String)  # Which AI provider was used
    ai_summary_model = Column(String)  # Which model was used
    ai_summary_generated_at = Column(DateTime)  # When AI summaries were generated
    author = Column(String)
    publication_date = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    processed = Column(Boolean, default=False)
    sent_to_kindle = Column(Boolean, default=False)
    source = Column(String)  # 'url', 'rss', 'email'
    tags = Column(String)  # comma-separated tags
    file_path = Column(String)  # Path to markdown file
    
    # Relationship to newsletter if article came from newsletter
    newsletter_id = Column(Integer, ForeignKey("newsletters.id"), nullable=True)
    newsletter = relationship("Newsletter", back_populates="articles")

class Newsletter(Base):
    __tablename__ = "newsletters"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    subject = Column(String)
    sender = Column(String)
    received_at = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())
    processed = Column(Boolean, default=False)
    raw_content = Column(Text)
    
    # Relationship to extracted articles
    articles = relationship("Article", back_populates="newsletter")

class WeeklyDigest(Base):
    __tablename__ = "weekly_digests"
    
    id = Column(Integer, primary_key=True, index=True)
    week_start = Column(DateTime, nullable=False)
    week_end = Column(DateTime, nullable=False)
    summary = Column(Text)
    article_count = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime)

class EmailQueue(Base):
    __tablename__ = "email_queue"
    
    id = Column(Integer, primary_key=True, index=True)
    to_email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    email_type = Column(String)  # 'article', 'digest', 'newsletter'
    priority = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())
    sent = Column(Boolean, default=False)
    sent_at = Column(DateTime)
    error_message = Column(Text)

class EmailArchive(Base):
    __tablename__ = "email_archive"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String, unique=True, index=True)  # Email Message-ID header
    sender = Column(String, nullable=False)
    recipient = Column(String, nullable=False)
    subject = Column(String)
    raw_email = Column(Text, nullable=False)  # Complete raw email
    headers = Column(Text)  # JSON string of headers
    body_text = Column(Text)  # Plain text body
    body_html = Column(Text)  # HTML body
    attachments = Column(Text)  # JSON string of attachment info
    received_at = Column(DateTime, server_default=func.now())
    processed = Column(Boolean, default=False)
    processing_result = Column(Text)  # JSON string of processing results
    email_type = Column(String)  # 'fivefilters', 'newsletter', 'forwarded', 'unknown'
    
    # For replay and debugging
    replay_count = Column(Integer, default=0)
    last_replayed_at = Column(DateTime)
    tags = Column(String)  # comma-separated tags for categorization