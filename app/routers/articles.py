from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.services.article_extractor import extract_article_content, regenerate_ai_summaries
from app.services.email_service import send_to_kindle
from app.services.ai_summarization_service import AIProvider

router = APIRouter(prefix="/articles", tags=["articles"])

@router.post("/", response_model=schemas.Article)
async def create_article(
    article: schemas.ArticleCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Check if article already exists
    existing = db.query(models.Article).filter(
        models.Article.url == str(article.url)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Article already exists")
    
    # Create article record
    db_article = models.Article(**article.dict())
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    
    # Extract content in background
    background_tasks.add_task(extract_article_content, db_article.id)
    
    return db_article

@router.get("/", response_model=List[schemas.Article])
async def list_articles(
    skip: int = 0,
    limit: int = 100,
    processed: bool = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Article)
    
    if processed is not None:
        query = query.filter(models.Article.processed == processed)
    
    articles = query.offset(skip).limit(limit).all()
    return articles

@router.get("/{article_id}", response_model=schemas.Article)
async def get_article(article_id: int, db: Session = Depends(get_db)):
    article = db.query(models.Article).filter(
        models.Article.id == article_id
    ).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return article

@router.post("/process-url")
async def process_url(
    request: schemas.ProcessUrlRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Check if URL already processed
    existing = db.query(models.Article).filter(
        models.Article.url == str(request.url)
    ).first()
    
    if existing:
        if request.send_to_kindle and not existing.sent_to_kindle:
            background_tasks.add_task(send_to_kindle, existing.id)
        return {"message": "Article already exists", "article_id": existing.id}
    
    # Create new article
    article_data = {
        "title": "Processing...",
        "url": str(request.url),
        "source": "url",
        "tags": request.tags
    }
    
    db_article = models.Article(**article_data)
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    
    # Process in background
    background_tasks.add_task(
        extract_article_content, 
        db_article.id, 
        request.send_to_kindle
    )
    
    return {
        "message": "Article processing started",
        "article_id": db_article.id
    }

@router.post("/{article_id}/send-to-kindle")
async def send_article_to_kindle(
    article_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    article = db.query(models.Article).filter(
        models.Article.id == article_id
    ).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if not article.processed:
        raise HTTPException(
            status_code=400, 
            detail="Article not yet processed"
        )
    
    background_tasks.add_task(send_to_kindle, article_id)
    
    return {"message": "Sending article to Kindle"}

@router.post("/{article_id}/regenerate-ai-summaries")
async def regenerate_article_ai_summaries(
    article_id: int,
    background_tasks: BackgroundTasks,
    provider: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Regenerate AI summaries for an existing article"""
    article = db.query(models.Article).filter(
        models.Article.id == article_id
    ).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    if not article.processed or not article.content:
        raise HTTPException(
            status_code=400, 
            detail="Article must be processed and have content before generating AI summaries"
        )
    
    # Validate provider if specified
    ai_provider = None
    if provider:
        try:
            ai_provider = AIProvider(provider.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid provider. Must be one of: {[p.value for p in AIProvider]}"
            )
    
    # Regenerate summaries in background
    background_tasks.add_task(regenerate_ai_summaries, article_id, ai_provider)
    
    return {
        "message": "AI summary regeneration started",
        "article_id": article_id,
        "provider": provider or "default"
    }

@router.post("/batch-regenerate-ai-summaries")
async def batch_regenerate_ai_summaries(
    background_tasks: BackgroundTasks,
    provider: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    only_missing: bool = True,
    db: Session = Depends(get_db)
):
    """Batch regenerate AI summaries for multiple articles"""
    
    # Validate provider if specified
    ai_provider = None
    if provider:
        try:
            ai_provider = AIProvider(provider.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid provider. Must be one of: {[p.value for p in AIProvider]}"
            )
    
    # Build query
    query = db.query(models.Article).filter(
        models.Article.processed == True,
        models.Article.content.isnot(None)
    )
    
    # If only_missing is True, only process articles without AI summaries
    if only_missing:
        query = query.filter(
            models.Article.ai_summary_brief.is_(None)
        )
    
    articles = query.offset(skip).limit(limit).all()
    
    if not articles:
        return {
            "message": "No articles found matching criteria",
            "count": 0
        }
    
    # Add background tasks for each article
    for article in articles:
        background_tasks.add_task(regenerate_ai_summaries, article.id, ai_provider)
    
    return {
        "message": f"AI summary regeneration started for {len(articles)} articles",
        "count": len(articles),
        "provider": provider or "default"
    }

@router.get("/{article_id}/summaries")
async def get_article_summaries(
    article_id: int,
    db: Session = Depends(get_db)
):
    """Get all available summaries for an article"""
    article = db.query(models.Article).filter(
        models.Article.id == article_id
    ).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return {
        "article_id": article_id,
        "title": article.title,
        "summaries": {
            "basic": article.summary,
            "ai_brief": article.ai_summary_brief,
            "ai_standard": article.ai_summary_standard,
            "ai_detailed": article.ai_summary_detailed
        },
        "ai_metadata": {
            "provider": article.ai_summary_provider,
            "model": article.ai_summary_model,
            "generated_at": article.ai_summary_generated_at
        }
    }