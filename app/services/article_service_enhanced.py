"""
Enhanced Article Service with Markdown File Storage

This service combines database metadata with markdown file storage for the best
of both worlds: fast querying and browsable file structure.
"""

import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from pathlib import Path
from sqlalchemy.orm import Session

from app.models import Article, Newsletter
from app.services.article_extractor import ArticleExtractor
from app.services.markdown_file_manager import MarkdownFileManager, ArticleMetadata
from app.database import get_db

logger = logging.getLogger(__name__)

class EnhancedArticleService:
    """Enhanced article service with markdown file storage."""
    
    def __init__(self):
        self.extractor = ArticleExtractor()
        self.markdown_manager = MarkdownFileManager()
        self.markdown_manager.create_index_files()
    
    def import_article_from_url(self, url: str, db: Session, source: str = "url", 
                               newsletter_id: Optional[int] = None) -> Optional[Article]:
        """Import article from URL and save as markdown file."""
        try:
            # Check if article already exists
            existing = self.get_article_by_url(url, db)
            if existing:
                logger.info(f"Article already exists: {url}")
                return existing
            
            # Extract article content
            extracted_data = self.extractor.extract_article(url)
            if not extracted_data:
                logger.error(f"Failed to extract article from URL: {url}")
                return None
            
            # Create article metadata
            metadata = ArticleMetadata(
                title=extracted_data.get('title', 'Untitled'),
                url=url,
                author=extracted_data.get('author'),
                publication_date=extracted_data.get('publish_date'),
                source=source,
                newsletter_id=newsletter_id,
                tags=extracted_data.get('tags', [])
            )
            
            # Convert content to markdown
            content = self._convert_to_markdown(extracted_data.get('text', ''))
            
            # Save as markdown file
            file_path = self.markdown_manager.save_article(metadata, content, "inbox")
            
            # Create database record for fast querying
            db_article = Article(
                title=metadata.title,
                url=url,
                author=metadata.author,
                publication_date=metadata.publication_date,
                source=source,
                newsletter_id=newsletter_id,
                tags=','.join(metadata.tags) if metadata.tags else '',
                file_path=str(file_path),
                markdown_content=f"---\n{metadata.to_dict()}\n---\n\n{content}",
                created_at=metadata.created_at,
                updated_at=metadata.updated_at
            )
            
            db.add(db_article)
            db.commit()
            db.refresh(db_article)
            
            logger.info(f"Article imported successfully: {metadata.title}")
            return db_article
            
        except Exception as e:
            logger.error(f"Error importing article from {url}: {e}")
            db.rollback()
            return None
    
    def get_article_by_url(self, url: str, db: Session) -> Optional[Article]:
        """Get article by URL from database."""
        return db.query(Article).filter(Article.url == url).first()
    
    def get_article_by_id(self, article_id: int, db: Session) -> Optional[Article]:
        """Get article by ID from database."""
        return db.query(Article).filter(Article.id == article_id).first()
    
    def get_article_content(self, article: Article) -> Optional[str]:
        """Get full article content from markdown file."""
        if not article.file_path:
            return article.markdown_content
        
        try:
            file_path = Path(article.file_path)
            if file_path.exists():
                metadata, content = self.markdown_manager.load_article(file_path)
                return content
        except Exception as e:
            logger.warning(f"Failed to load content from file {article.file_path}: {e}")
        
        # Fallback to database content
        return article.markdown_content
    
    def update_article(self, article_id: int, updates: Dict[str, Any], db: Session) -> Optional[Article]:
        """Update article in both database and markdown file."""
        article = self.get_article_by_id(article_id, db)
        if not article:
            return None
        
        try:
            # Update database record
            for key, value in updates.items():
                if hasattr(article, key):
                    setattr(article, key, value)
            
            article.updated_at = datetime.now(timezone.utc)
            
            # Update markdown file if it exists
            if article.file_path and Path(article.file_path).exists():
                file_path = Path(article.file_path)
                metadata, content = self.markdown_manager.load_article(file_path)
                
                # Update metadata
                for key, value in updates.items():
                    if hasattr(metadata, key):
                        setattr(metadata, key, value)
                
                # Save updated file
                self.markdown_manager.update_article(file_path, metadata, content)
                
                # Update database with new markdown content
                updated_content = f"---\n{metadata.to_dict()}\n---\n\n{content}"
                article.markdown_content = updated_content
            
            db.commit()
            db.refresh(article)
            
            logger.info(f"Article updated: {article.title}")
            return article
            
        except Exception as e:
            logger.error(f"Error updating article {article_id}: {e}")
            db.rollback()
            return None
    
    def mark_as_processed(self, article_id: int, db: Session) -> Optional[Article]:
        """Mark article as processed and move to processed directory."""
        article = self.get_article_by_id(article_id, db)
        if not article:
            return None
        
        try:
            # Move markdown file
            if article.file_path and Path(article.file_path).exists():
                old_path = Path(article.file_path)
                new_path = self.markdown_manager.move_article(old_path, "processed")
                article.file_path = str(new_path)
            
            # Update database
            article.processed = True
            article.updated_at = datetime.now(timezone.utc)
            
            db.commit()
            db.refresh(article)
            
            logger.info(f"Article marked as processed: {article.title}")
            return article
            
        except Exception as e:
            logger.error(f"Error marking article as processed {article_id}: {e}")
            db.rollback()
            return None
    
    def mark_as_sent_to_kindle(self, article_id: int, db: Session) -> Optional[Article]:
        """Mark article as sent to Kindle and move to sent directory."""
        article = self.get_article_by_id(article_id, db)
        if not article:
            return None
        
        try:
            # Move markdown file
            if article.file_path and Path(article.file_path).exists():
                old_path = Path(article.file_path)
                new_path = self.markdown_manager.move_article(old_path, "sent")
                article.file_path = str(new_path)
            
            # Update database
            article.sent_to_kindle = True
            article.updated_at = datetime.now(timezone.utc)
            
            db.commit()
            db.refresh(article)
            
            logger.info(f"Article marked as sent to Kindle: {article.title}")
            return article
            
        except Exception as e:
            logger.error(f"Error marking article as sent to Kindle {article_id}: {e}")
            db.rollback()
            return None
    
    def archive_article(self, article_id: int, db: Session) -> Optional[Article]:
        """Archive article by moving to archive directory."""
        article = self.get_article_by_id(article_id, db)
        if not article:
            return None
        
        try:
            # Move markdown file
            if article.file_path and Path(article.file_path).exists():
                old_path = Path(article.file_path)
                new_path = self.markdown_manager.move_article(old_path, "archive")
                article.file_path = str(new_path)
            
            # Update database
            article.updated_at = datetime.now(timezone.utc)
            
            db.commit()
            db.refresh(article)
            
            logger.info(f"Article archived: {article.title}")
            return article
            
        except Exception as e:
            logger.error(f"Error archiving article {article_id}: {e}")
            db.rollback()
            return None
    
    def list_articles(self, db: Session, status: Optional[str] = None, 
                     limit: int = 50, offset: int = 0) -> List[Article]:
        """List articles with optional status filter."""
        query = db.query(Article)
        
        if status == "processed":
            query = query.filter(Article.processed == True)
        elif status == "sent":
            query = query.filter(Article.sent_to_kindle == True)
        elif status == "inbox":
            query = query.filter(Article.processed == False, Article.sent_to_kindle == False)
        
        return query.order_by(Article.created_at.desc()).offset(offset).limit(limit).all()
    
    def search_articles(self, query: str, db: Session, in_content: bool = False) -> List[Article]:
        """Search articles in database and optionally in markdown content."""
        # Database search
        db_results = db.query(Article).filter(
            Article.title.ilike(f"%{query}%") |
            Article.tags.ilike(f"%{query}%") |
            Article.author.ilike(f"%{query}%")
        ).all()
        
        if not in_content:
            return db_results
        
        # File content search
        file_results = self.markdown_manager.search_articles(query, in_content=True)
        
        # Combine results (avoid duplicates)
        db_urls = {article.url for article in db_results}
        additional_articles = []
        
        for file_path, metadata in file_results:
            if metadata.url not in db_urls:
                # This shouldn't happen if we're maintaining sync, but handle gracefully
                article = self.get_article_by_url(metadata.url, db)
                if article:
                    additional_articles.append(article)
        
        return db_results + additional_articles
    
    def get_article_statistics(self, db: Session) -> Dict[str, Any]:
        """Get comprehensive article statistics."""
        db_stats = {
            'total_articles': db.query(Article).count(),
            'processed_articles': db.query(Article).filter(Article.processed == True).count(),
            'sent_articles': db.query(Article).filter(Article.sent_to_kindle == True).count(),
            'inbox_articles': db.query(Article).filter(
                Article.processed == False, 
                Article.sent_to_kindle == False
            ).count(),
        }
        
        file_stats = self.markdown_manager.get_statistics()
        
        return {
            'database': db_stats,
            'files': file_stats,
            'sync_status': self._check_sync_status(db)
        }
    
    def _check_sync_status(self, db: Session) -> Dict[str, Any]:
        """Check if database and file system are in sync."""
        db_count = db.query(Article).count()
        file_count = self.markdown_manager.get_statistics()['total_articles']
        
        return {
            'database_articles': db_count,
            'file_articles': file_count,
            'in_sync': db_count == file_count,
            'difference': abs(db_count - file_count)
        }
    
    def sync_database_with_files(self, db: Session) -> Dict[str, int]:
        """Sync database with markdown files."""
        stats = {'created': 0, 'updated': 0, 'errors': 0}
        
        # Get all markdown files
        articles_from_files = self.markdown_manager.list_articles()
        
        for file_path, metadata in articles_from_files:
            try:
                # Check if article exists in database
                existing = self.get_article_by_url(metadata.url, db)
                
                if not existing:
                    # Create new database record
                    _, content = self.markdown_manager.load_article(file_path)
                    
                    db_article = Article(
                        title=metadata.title,
                        url=metadata.url,
                        author=metadata.author,
                        publication_date=metadata.publication_date,
                        source=metadata.source,
                        newsletter_id=metadata.newsletter_id,
                        tags=','.join(metadata.tags) if metadata.tags else '',
                        file_path=str(file_path),
                        markdown_content=f"---\n{metadata.to_dict()}\n---\n\n{content}",
                        processed=metadata.processed,
                        sent_to_kindle=metadata.sent_to_kindle,
                        created_at=metadata.created_at,
                        updated_at=metadata.updated_at
                    )
                    
                    db.add(db_article)
                    stats['created'] += 1
                    
                else:
                    # Update existing record if file is newer
                    if metadata.updated_at > existing.updated_at:
                        _, content = self.markdown_manager.load_article(file_path)
                        
                        existing.title = metadata.title
                        existing.author = metadata.author
                        existing.publication_date = metadata.publication_date
                        existing.tags = ','.join(metadata.tags) if metadata.tags else ''
                        existing.file_path = str(file_path)
                        existing.markdown_content = f"---\n{metadata.to_dict()}\n---\n\n{content}"
                        existing.processed = metadata.processed
                        existing.sent_to_kindle = metadata.sent_to_kindle
                        existing.updated_at = metadata.updated_at
                        
                        stats['updated'] += 1
                
            except Exception as e:
                logger.error(f"Error syncing article from {file_path}: {e}")
                stats['errors'] += 1
        
        try:
            db.commit()
            logger.info(f"Database sync completed: {stats}")
        except Exception as e:
            logger.error(f"Error committing database sync: {e}")
            db.rollback()
            stats['errors'] += stats['created'] + stats['updated']
            stats['created'] = 0
            stats['updated'] = 0
        
        return stats
    
    def _convert_to_markdown(self, html_content: str) -> str:
        """Convert HTML content to markdown format."""
        try:
            from markdownify import markdownify as md
            return md(html_content, heading_style="ATX")
        except ImportError:
            logger.warning("markdownify not available, returning raw content")
            return html_content
    
    def regenerate_indexes(self):
        """Regenerate all index files."""
        self.markdown_manager.create_index_files()
        self.markdown_manager.create_main_index()
        self.markdown_manager.export_metadata_json()
        logger.info("Index files regenerated")
    
    def cleanup_system(self, db: Session):
        """Perform system cleanup tasks."""
        # Remove empty directories
        self.markdown_manager.cleanup_empty_directories()
        
        # Update indexes
        self.regenerate_indexes()
        
        # Check for orphaned database records
        orphaned_count = 0
        articles = db.query(Article).all()
        
        for article in articles:
            if article.file_path and not Path(article.file_path).exists():
                logger.warning(f"Orphaned database record (missing file): {article.title}")
                orphaned_count += 1
        
        logger.info(f"Cleanup completed. Found {orphaned_count} orphaned database records")
        
        return {
            'orphaned_records': orphaned_count,
            'statistics': self.get_article_statistics(db)
        }

# Global service instance
enhanced_article_service = EnhancedArticleService()