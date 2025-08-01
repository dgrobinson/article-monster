from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional, List

class ArticleBase(BaseModel):
    title: str
    url: HttpUrl
    author: Optional[str] = None
    source: Optional[str] = None
    tags: Optional[str] = None

class ArticleCreate(ArticleBase):
    pass

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    ai_summary_brief: Optional[str] = None
    ai_summary_standard: Optional[str] = None
    ai_summary_detailed: Optional[str] = None
    author: Optional[str] = None
    tags: Optional[str] = None
    processed: Optional[bool] = None
    sent_to_kindle: Optional[bool] = None

class Article(ArticleBase):
    id: int
    content: Optional[str] = None
    summary: Optional[str] = None
    ai_summary_brief: Optional[str] = None
    ai_summary_standard: Optional[str] = None
    ai_summary_detailed: Optional[str] = None
    ai_summary_provider: Optional[str] = None
    ai_summary_model: Optional[str] = None
    ai_summary_generated_at: Optional[datetime] = None
    publication_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    processed: bool
    sent_to_kindle: bool
    newsletter_id: Optional[int] = None

    class Config:
        from_attributes = True

class NewsletterBase(BaseModel):
    name: str
    email: str
    subject: Optional[str] = None
    sender: Optional[str] = None

class NewsletterCreate(NewsletterBase):
    raw_content: str

class Newsletter(NewsletterBase):
    id: int
    received_at: datetime
    created_at: datetime
    processed: bool
    articles: List[Article] = []

    class Config:
        from_attributes = True

class WeeklyDigestBase(BaseModel):
    week_start: datetime
    week_end: datetime
    summary: Optional[str] = None
    article_count: int

class WeeklyDigestCreate(WeeklyDigestBase):
    pass

class WeeklyDigest(WeeklyDigestBase):
    id: int
    created_at: datetime
    sent: bool
    sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProcessUrlRequest(BaseModel):
    url: HttpUrl
    send_to_kindle: bool = False
    tags: Optional[str] = None

class AISummaryRequest(BaseModel):
    provider: Optional[str] = None
    regenerate: bool = False

class BatchAISummaryRequest(BaseModel):
    provider: Optional[str] = None
    limit: int = 50
    skip: int = 0
    only_missing: bool = True

class AISummaryResponse(BaseModel):
    article_id: int
    title: str
    summaries: dict
    ai_metadata: dict