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
    summary = Column(Text)
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