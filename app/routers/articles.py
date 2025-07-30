from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.services.article_extractor import extract_article_content
from app.services.email_service import send_to_kindle

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