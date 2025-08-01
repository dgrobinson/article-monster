"""
Markdown File Manager for Article Library

This service manages articles as markdown files with YAML frontmatter,
organized in a browsable directory structure.
"""

import os
import re
import json
import yaml
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urlparse
import hashlib
import logging
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

@dataclass
class ArticleMetadata:
    """Article metadata structure for YAML frontmatter."""
    title: str
    url: str
    author: Optional[str] = None
    publication_date: Optional[datetime] = None
    created_at: datetime = None
    updated_at: datetime = None
    processed: bool = False
    sent_to_kindle: bool = False
    source: str = 'url'  # 'url', 'rss', 'email'
    tags: List[str] = None
    summary: Optional[str] = None
    ai_summary_brief: Optional[str] = None
    ai_summary_standard: Optional[str] = None
    ai_summary_detailed: Optional[str] = None
    ai_summary_provider: Optional[str] = None
    ai_summary_model: Optional[str] = None
    ai_summary_generated_at: Optional[datetime] = None
    newsletter_id: Optional[int] = None
    file_id: Optional[str] = None  # Unique file identifier
    word_count: Optional[int] = None
    reading_time_minutes: Optional[int] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(timezone.utc)
        if self.updated_at is None:
            self.updated_at = self.created_at
        if self.tags is None:
            self.tags = []
        if self.file_id is None:
            self.file_id = self._generate_file_id()

    def _generate_file_id(self) -> str:
        """Generate a unique file ID based on URL and timestamp."""
        content = f"{self.url}_{self.created_at.isoformat()}"
        return hashlib.md5(content.encode()).hexdigest()[:12]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for YAML serialization."""
        data = asdict(self)
        # Convert datetime objects to ISO strings
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ArticleMetadata':
        """Create from dictionary (YAML deserialization)."""
        # Convert ISO strings back to datetime objects
        datetime_fields = [
            'publication_date', 'created_at', 'updated_at', 'ai_summary_generated_at'
        ]
        for field in datetime_fields:
            if field in data and data[field]:
                if isinstance(data[field], str):
                    data[field] = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
        
        return cls(**data)

class MarkdownFileManager:
    """Manages articles as markdown files with YAML frontmatter."""
    
    def __init__(self, base_path: str = "/app/articles"):
        self.base_path = Path(base_path)
        self.ensure_directory_structure()
    
    def ensure_directory_structure(self):
        """Create necessary directory structure."""
        directories = [
            "inbox",      # Newly imported articles
            "processed",  # Articles ready for consumption
            "archive",    # Older articles
            "drafts",     # Articles being edited
            "newsletters",# Newsletter-extracted articles
            "rss",        # RSS feed articles
            "sent",       # Articles sent to Kindle
            "templates",  # Template files
            "metadata",   # Index files and metadata
        ]
        
        for directory in directories:
            (self.base_path / directory).mkdir(parents=True, exist_ok=True)
        
        # Create year/month subdirectories for better organization
        current_year = datetime.now().year
        for year in range(current_year - 1, current_year + 2):
            for month in range(1, 13):
                for directory in ["processed", "archive"]:
                    path = self.base_path / directory / str(year) / f"{month:02d}"
                    path.mkdir(parents=True, exist_ok=True)
    
    def sanitize_filename(self, title: str, max_length: int = 100) -> str:
        """Convert title to safe filename."""
        # Remove or replace problematic characters
        filename = re.sub(r'[<>:"/\\|?*]', '', title)
        filename = re.sub(r'\s+', '_', filename.strip())
        filename = re.sub(r'[^\w\-_\.]', '', filename)
        
        # Truncate if too long
        if len(filename) > max_length:
            filename = filename[:max_length].rstrip('_-.')
        
        return filename or "untitled"
    
    def generate_file_path(self, metadata: ArticleMetadata, status: str = "inbox") -> Path:
        """Generate file path based on metadata and status."""
        date = metadata.created_at or datetime.now(timezone.utc)
        year = date.year
        month = f"{date.month:02d}"
        
        # Determine subdirectory based on status and source
        if status == "processed":
            base_dir = self.base_path / "processed" / str(year) / month
        elif status == "archive":
            base_dir = self.base_path / "archive" / str(year) / month
        elif status == "sent":
            base_dir = self.base_path / "sent" / str(year) / month
        elif metadata.source == "newsletter":
            base_dir = self.base_path / "newsletters" / str(year) / month
        elif metadata.source == "rss":
            base_dir = self.base_path / "rss" / str(year) / month
        else:
            base_dir = self.base_path / status
        
        base_dir.mkdir(parents=True, exist_ok=True)
        
        # Create filename
        safe_title = self.sanitize_filename(metadata.title)
        filename = f"{date.strftime('%Y%m%d')}_{metadata.file_id}_{safe_title}.md"
        
        return base_dir / filename
    
    def save_article(self, metadata: ArticleMetadata, content: str, status: str = "inbox") -> Path:
        """Save article as markdown file with YAML frontmatter."""
        file_path = self.generate_file_path(metadata, status)
        
        # Update metadata
        metadata.updated_at = datetime.now(timezone.utc)
        metadata.word_count = len(content.split())
        metadata.reading_time_minutes = max(1, metadata.word_count // 200)  # ~200 WPM
        
        # Create YAML frontmatter
        yaml_data = metadata.to_dict()
        frontmatter = yaml.dump(yaml_data, default_flow_style=False, allow_unicode=True)
        
        # Create full markdown content
        full_content = f"---\n{frontmatter}---\n\n{content}"
        
        # Save file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(full_content)
        
        logger.info(f"Article saved: {file_path}")
        return file_path
    
    def load_article(self, file_path: Path) -> Tuple[ArticleMetadata, str]:
        """Load article from markdown file."""
        if not file_path.exists():
            raise FileNotFoundError(f"Article file not found: {file_path}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Split frontmatter and content
        if content.startswith('---\n'):
            parts = content.split('---\n', 2)
            if len(parts) >= 3:
                yaml_content = parts[1]
                markdown_content = parts[2].strip()
                
                # Parse YAML frontmatter
                yaml_data = yaml.safe_load(yaml_content)
                metadata = ArticleMetadata.from_dict(yaml_data)
                
                return metadata, markdown_content
        
        # Fallback if no proper frontmatter
        return ArticleMetadata(title="Untitled", url=""), content
    
    def update_article(self, file_path: Path, metadata: ArticleMetadata = None, content: str = None) -> Path:
        """Update existing article."""
        current_metadata, current_content = self.load_article(file_path)
        
        # Update metadata if provided
        if metadata:
            for field, value in asdict(metadata).items():
                if value is not None:
                    setattr(current_metadata, field, value)
        
        current_metadata.updated_at = datetime.now(timezone.utc)
        
        # Update content if provided
        if content is not None:
            current_content = content
            current_metadata.word_count = len(content.split())
            current_metadata.reading_time_minutes = max(1, current_metadata.word_count // 200)
        
        # Save updated article
        return self.save_article(current_metadata, current_content, self._get_status_from_path(file_path))
    
    def move_article(self, file_path: Path, new_status: str) -> Path:
        """Move article to different status directory."""
        metadata, content = self.load_article(file_path)
        
        # Update metadata based on status
        if new_status == "sent":
            metadata.sent_to_kindle = True
        elif new_status == "processed":
            metadata.processed = True
        
        # Save to new location
        new_path = self.save_article(metadata, content, new_status)
        
        # Remove old file
        if file_path != new_path and file_path.exists():
            file_path.unlink()
        
        return new_path
    
    def _get_status_from_path(self, file_path: Path) -> str:
        """Determine status from file path."""
        path_parts = file_path.parts
        if "processed" in path_parts:
            return "processed"
        elif "archive" in path_parts:
            return "archive"
        elif "sent" in path_parts:
            return "sent"
        elif "newsletters" in path_parts:
            return "newsletters"
        elif "rss" in path_parts:
            return "rss"
        elif "drafts" in path_parts:
            return "drafts"
        else:
            return "inbox"
    
    def list_articles(self, status: str = None, limit: int = None, offset: int = 0) -> List[Tuple[Path, ArticleMetadata]]:
        """List articles, optionally filtered by status."""
        articles = []
        
        if status:
            search_dirs = [self.base_path / status]
        else:
            search_dirs = [
                self.base_path / "inbox",
                self.base_path / "processed",
                self.base_path / "archive",
                self.base_path / "sent",
                self.base_path / "newsletters",
                self.base_path / "rss",
                self.base_path / "drafts",
            ]
        
        for search_dir in search_dirs:
            if not search_dir.exists():
                continue
            
            for md_file in search_dir.rglob("*.md"):
                try:
                    metadata, _ = self.load_article(md_file)
                    articles.append((md_file, metadata))
                except Exception as e:
                    logger.warning(f"Failed to load article {md_file}: {e}")
        
        # Sort by created_at (newest first)
        articles.sort(key=lambda x: x[1].created_at or datetime.min, reverse=True)
        
        # Apply pagination
        if limit:
            articles = articles[offset:offset + limit]
        
        return articles
    
    def search_articles(self, query: str, in_content: bool = True) -> List[Tuple[Path, ArticleMetadata]]:
        """Search articles by title, content, or tags."""
        results = []
        query_lower = query.lower()
        
        for md_file in self.base_path.rglob("*.md"):
            try:
                metadata, content = self.load_article(md_file)
                
                # Search in title
                if query_lower in metadata.title.lower():
                    results.append((md_file, metadata))
                    continue
                
                # Search in tags
                if any(query_lower in tag.lower() for tag in metadata.tags):
                    results.append((md_file, metadata))
                    continue
                
                # Search in content if requested
                if in_content and query_lower in content.lower():
                    results.append((md_file, metadata))
                    continue
                    
            except Exception as e:
                logger.warning(f"Failed to search in article {md_file}: {e}")
        
        return results
    
    def get_article_by_url(self, url: str) -> Optional[Tuple[Path, ArticleMetadata]]:
        """Find article by URL."""
        for md_file in self.base_path.rglob("*.md"):
            try:
                metadata, _ = self.load_article(md_file)
                if metadata.url == url:
                    return md_file, metadata
            except Exception as e:
                logger.warning(f"Failed to check article {md_file}: {e}")
        
        return None
    
    def create_index_files(self):
        """Create index files for browsing."""
        # Create README files for each directory
        directories = {
            "inbox": "Newly imported articles awaiting processing",
            "processed": "Articles ready for reading, organized by date",
            "archive": "Older articles for reference",
            "sent": "Articles that have been sent to Kindle",
            "newsletters": "Articles extracted from newsletters",
            "rss": "Articles from RSS feeds",
            "drafts": "Articles being edited or reviewed",
        }
        
        for directory, description in directories.items():
            readme_path = self.base_path / directory / "README.md"
            if not readme_path.exists():
                with open(readme_path, 'w', encoding='utf-8') as f:
                    f.write(f"# {directory.title()}\n\n{description}\n\n")
        
        # Create main index
        self.create_main_index()
    
    def create_main_index(self):
        """Create main index file with article statistics."""
        stats = self.get_statistics()
        
        index_content = f"""# Article Library

This library contains {stats['total_articles']} articles organized into different categories.

## Directory Structure

- **inbox/**: {stats['inbox']} new articles awaiting processing
- **processed/**: {stats['processed']} articles ready for reading
- **archive/**: {stats['archive']} older articles
- **sent/**: {stats['sent']} articles sent to Kindle
- **newsletters/**: {stats['newsletters']} articles from newsletters
- **rss/**: {stats['rss']} articles from RSS feeds
- **drafts/**: {stats['drafts']} articles being edited

## Recent Articles

"""
        
        # Add recent articles
        recent_articles = self.list_articles(limit=10)
        for file_path, metadata in recent_articles:
            relative_path = file_path.relative_to(self.base_path)
            date_str = metadata.created_at.strftime("%Y-%m-%d") if metadata.created_at else "Unknown"
            index_content += f"- [{metadata.title}]({relative_path}) ({date_str})\n"
        
        index_content += f"\n\nLast updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        
        index_path = self.base_path / "README.md"
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(index_content)
    
    def get_statistics(self) -> Dict[str, int]:
        """Get article statistics by directory."""
        stats = {
            'total_articles': 0,
            'inbox': 0,
            'processed': 0,
            'archive': 0,
            'sent': 0,
            'newsletters': 0,
            'rss': 0,
            'drafts': 0,
        }
        
        for directory in stats.keys():
            if directory == 'total_articles':
                continue
            
            dir_path = self.base_path / directory
            if dir_path.exists():
                count = len(list(dir_path.rglob("*.md")))
                stats[directory] = count
                stats['total_articles'] += count
        
        return stats
    
    def cleanup_empty_directories(self):
        """Remove empty directories."""
        for root, dirs, files in os.walk(self.base_path, topdown=False):
            for directory in dirs:
                dir_path = Path(root) / directory
                try:
                    if not any(dir_path.iterdir()):
                        dir_path.rmdir()
                        logger.info(f"Removed empty directory: {dir_path}")
                except OSError:
                    pass  # Directory not empty or permission issues
    
    def export_metadata_json(self) -> Path:
        """Export all article metadata to JSON for external tools."""
        articles_data = []
        
        for file_path, metadata in self.list_articles():
            article_data = metadata.to_dict()
            article_data['file_path'] = str(file_path.relative_to(self.base_path))
            article_data['status'] = self._get_status_from_path(file_path)
            articles_data.append(article_data)
        
        export_path = self.base_path / "metadata" / "articles_export.json"
        with open(export_path, 'w', encoding='utf-8') as f:
            json.dump(articles_data, f, indent=2, default=str)
        
        logger.info(f"Metadata exported to: {export_path}")
        return export_path

# Global instance
markdown_manager = MarkdownFileManager()