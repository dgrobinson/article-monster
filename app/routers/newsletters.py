from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.services.newsletter_processor import process_newsletter

router = APIRouter(prefix="/newsletters", tags=["newsletters"])

@router.post("/", response_model=schemas.Newsletter)
async def create_newsletter(
    newsletter: schemas.NewsletterCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Create newsletter record
    db_newsletter = models.Newsletter(**newsletter.dict())
    db.add(db_newsletter)
    db.commit()
    db.refresh(db_newsletter)
    
    # Process newsletter content in background
    background_tasks.add_task(process_newsletter, db_newsletter.id)
    
    return db_newsletter

@router.get("/", response_model=List[schemas.Newsletter])
async def list_newsletters(
    skip: int = 0,
    limit: int = 100,
    processed: bool = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Newsletter)
    
    if processed is not None:
        query = query.filter(models.Newsletter.processed == processed)
    
    newsletters = query.offset(skip).limit(limit).all()
    return newsletters

@router.get("/{newsletter_id}", response_model=schemas.Newsletter)
async def get_newsletter(newsletter_id: int, db: Session = Depends(get_db)):
    newsletter = db.query(models.Newsletter).filter(
        models.Newsletter.id == newsletter_id
    ).first()
    
    if not newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")
    
    return newsletter