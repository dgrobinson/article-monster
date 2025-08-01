"""
Enhanced Articles Router with Markdown File Support

This router provides endpoints for managing articles stored as markdown files
while maintaining database indexes for fast querying.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pathlib import Path
import logging

from app.database import get_db
from app.services.article_service_enhanced import enhanced_article_service
from app.schemas import ArticleBase, ArticleCreate, ArticleResponse
from app.models import Article

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/articles/import", response_model=ArticleResponse)
async def import_article(
    url: str,
    source: str = "url",
    newsletter_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Import article from URL and save as markdown file."""
    try:
        article = enhanced_article_service.import_article_from_url(
            url=url,
            db=db,
            source=source,
            newsletter_id=newsletter_id
        )
        
        if not article:
            raise HTTPException(status_code=400, detail="Failed to import article")
        
        return article
    
    except Exception as e:
        logger.error(f"Error importing article: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/articles", response_model=List[ArticleResponse])
async def list_articles(
    status: Optional[str] = Query(None, description="Filter by status: inbox, processed, sent"),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """List articles with optional status filter."""
    try:
        articles = enhanced_article_service.list_articles(
            db=db,
            status=status,
            limit=limit,
            offset=offset
        )
        return articles
    
    except Exception as e:
        logger.error(f"Error listing articles: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/articles/{article_id}", response_model=ArticleResponse)
async def get_article(article_id: int, db: Session = Depends(get_db)):
    """Get article by ID."""
    article = enhanced_article_service.get_article_by_id(article_id, db)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return article

@router.get("/articles/{article_id}/content")
async def get_article_content(article_id: int, db: Session = Depends(get_db)):
    """Get full article content from markdown file."""
    article = enhanced_article_service.get_article_by_id(article_id, db)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    content = enhanced_article_service.get_article_content(article)
    if not content:
        raise HTTPException(status_code=404, detail="Article content not found")
    
    return {
        "id": article.id,
        "title": article.title,
        "url": article.url,
        "content": content,
        "file_path": article.file_path
    }

@router.put("/articles/{article_id}", response_model=ArticleResponse)
async def update_article(
    article_id: int,
    updates: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Update article in both database and markdown file."""
    article = enhanced_article_service.update_article(article_id, updates, db)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return article

@router.post("/articles/{article_id}/process", response_model=ArticleResponse)
async def mark_article_processed(article_id: int, db: Session = Depends(get_db)):
    """Mark article as processed and move to processed directory."""
    article = enhanced_article_service.mark_as_processed(article_id, db)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return article

@router.post("/articles/{article_id}/send-to-kindle", response_model=ArticleResponse)
async def mark_article_sent_to_kindle(article_id: int, db: Session = Depends(get_db)):
    """Mark article as sent to Kindle and move to sent directory."""
    article = enhanced_article_service.mark_as_sent_to_kindle(article_id, db)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return article

@router.post("/articles/{article_id}/archive", response_model=ArticleResponse)
async def archive_article(article_id: int, db: Session = Depends(get_db)):
    """Archive article by moving to archive directory."""
    article = enhanced_article_service.archive_article(article_id, db)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    return article

@router.get("/articles/search")
async def search_articles(
    q: str = Query(..., description="Search query"),
    in_content: bool = Query(False, description="Search in article content"),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db)
):
    """Search articles by title, tags, author, and optionally content."""
    try:
        articles = enhanced_article_service.search_articles(q, db, in_content)
        
        # Apply limit
        if limit:
            articles = articles[:limit]
        
        return {
            "query": q,
            "results": articles,
            "count": len(articles),
            "searched_content": in_content
        }
    
    except Exception as e:
        logger.error(f"Error searching articles: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/articles/stats")
async def get_article_statistics(db: Session = Depends(get_db)):
    """Get comprehensive article statistics."""
    try:
        stats = enhanced_article_service.get_article_statistics(db)
        return stats
    
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/articles/sync")
async def sync_database_with_files(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Sync database with markdown files."""
    try:
        # Run sync in background
        background_tasks.add_task(
            enhanced_article_service.sync_database_with_files,
            db
        )
        
        return {
            "message": "Database sync started in background",
            "status": "processing"
        }
    
    except Exception as e:
        logger.error(f"Error starting sync: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/articles/regenerate-indexes")
async def regenerate_indexes(background_tasks: BackgroundTasks):
    """Regenerate all index files."""
    try:
        background_tasks.add_task(enhanced_article_service.regenerate_indexes)
        
        return {
            "message": "Index regeneration started in background",
            "status": "processing"
        }
    
    except Exception as e:
        logger.error(f"Error regenerating indexes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/articles/cleanup")
async def cleanup_system(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Perform system cleanup tasks."""
    try:
        background_tasks.add_task(enhanced_article_service.cleanup_system, db)
        
        return {
            "message": "System cleanup started in background",
            "status": "processing"
        }
    
    except Exception as e:
        logger.error(f"Error starting cleanup: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/articles/files/browse")
async def browse_files(
    path: str = Query("", description="Directory path to browse"),
    db: Session = Depends(get_db)
):
    """Browse article files in the file system."""
    try:
        base_path = Path("/app/articles")
        if path:
            browse_path = base_path / path.lstrip("/")
        else:
            browse_path = base_path
        
        if not browse_path.exists() or not browse_path.is_dir():
            raise HTTPException(status_code=404, detail="Directory not found")
        
        # Security check - ensure path is within articles directory
        try:
            browse_path.resolve().relative_to(base_path.resolve())
        except ValueError:
            raise HTTPException(status_code=403, detail="Access denied")
        
        items = []
        for item in sorted(browse_path.iterdir()):
            if item.is_dir():
                items.append({
                    "name": item.name,
                    "type": "directory",
                    "path": str(item.relative_to(base_path)),
                    "size": None,
                    "modified": item.stat().st_mtime
                })
            elif item.suffix == ".md":
                items.append({
                    "name": item.name,
                    "type": "file",
                    "path": str(item.relative_to(base_path)),
                    "size": item.stat().st_size,
                    "modified": item.stat().st_mtime
                })
        
        return {
            "current_path": path,
            "items": items,
            "count": len(items)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error browsing files: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/articles/files/read")
async def read_file(
    path: str = Query(..., description="File path to read"),
    db: Session = Depends(get_db)
):
    """Read markdown file content."""
    try:
        base_path = Path("/app/articles")
        file_path = base_path / path.lstrip("/")
        
        if not file_path.exists() or not file_path.is_file():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Security check
        try:
            file_path.resolve().relative_to(base_path.resolve())
        except ValueError:
            raise HTTPException(status_code=403, detail="Access denied")
        
        if file_path.suffix != ".md":
            raise HTTPException(status_code=400, detail="Only markdown files are supported")
        
        # Load article using markdown manager
        metadata, content = enhanced_article_service.markdown_manager.load_article(file_path)
        
        return {
            "path": path,
            "metadata": metadata.to_dict(),
            "content": content,
            "file_size": file_path.stat().st_size,
            "modified": file_path.stat().st_mtime
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/articles/{article_id}")
async def delete_article(article_id: int, db: Session = Depends(get_db)):
    """Delete article from both database and file system."""
    try:
        article = enhanced_article_service.get_article_by_id(article_id, db)
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        
        # Delete file if it exists
        if article.file_path:
            file_path = Path(article.file_path)
            if file_path.exists():
                file_path.unlink()
                logger.info(f"Deleted file: {file_path}")
        
        # Delete from database
        db.delete(article)
        db.commit()
        
        logger.info(f"Deleted article: {article.title}")
        
        return {
            "message": "Article deleted successfully",
            "id": article_id,
            "title": article.title
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting article: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Health check for the enhanced service
@router.get("/articles/health")
async def articles_health_check(db: Session = Depends(get_db)):
    """Health check for the enhanced article service."""
    try:
        stats = enhanced_article_service.get_article_statistics(db)
        
        return {
            "status": "healthy",
            "service": "enhanced_article_service",
            "statistics": stats,
            "markdown_manager": {
                "base_path": str(enhanced_article_service.markdown_manager.base_path),
                "directories_exist": enhanced_article_service.markdown_manager.base_path.exists()
            }
        }
    
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "enhanced_article_service",
            "error": str(e)
        }