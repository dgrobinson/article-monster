import os
import re
from datetime import datetime
from pathlib import Path
import yaml
from app.database import SessionLocal
from app.models import Article
import logging
from urllib.parse import urlparse
import unicodedata

logger = logging.getLogger(__name__)

class MarkdownService:
    def __init__(self, articles_dir: str = "/app/articles"):
        self.articles_dir = Path(articles_dir)
        self.articles_dir.mkdir(exist_ok=True)

    def save_article_as_markdown(self, article_id: int):
        """Save article as markdown file with YAML frontmatter"""
        db = SessionLocal()
        
        try:
            article = db.query(Article).filter(Article.id == article_id).first()
            if not article:
                logger.error(f"Article {article_id} not found")
                return None
            
            # Generate filename
            filename = self.generate_filename(article)
            file_path = self.articles_dir / filename
            
            # Create markdown content with YAML frontmatter
            markdown_content = self.create_markdown_with_frontmatter(article)
            
            # Save to file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(markdown_content)
            
            # Update article with file path and markdown content
            article.file_path = str(file_path)
            article.markdown_content = markdown_content
            db.commit()
            
            logger.info(f"Saved article {article_id} to {file_path}")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Error saving article {article_id} as markdown: {e}")
            return None
        finally:
            db.close()

    def generate_filename(self, article: Article) -> str:
        """Generate a safe filename for the article"""
        # Start with publication date if available
        if article.publication_date:
            date_prefix = article.publication_date.strftime("%Y-%m-%d")
        else:
            date_prefix = article.created_at.strftime("%Y-%m-%d")
        
        # Clean title for filename
        title = article.title or "untitled"
        safe_title = self.sanitize_filename(title)
        
        # Limit length
        if len(safe_title) > 100:
            safe_title = safe_title[:100]
        
        filename = f"{date_prefix}_{safe_title}.md"
        
        # Ensure uniqueness
        counter = 1
        original_filename = filename
        while (self.articles_dir / filename).exists():
            name, ext = os.path.splitext(original_filename)
            filename = f"{name}_{counter}{ext}"
            counter += 1
        
        return filename

    def sanitize_filename(self, filename: str) -> str:
        """Convert string to safe filename"""
        # Normalize unicode
        filename = unicodedata.normalize('NFKD', filename)
        
        # Convert to ASCII, ignore non-ASCII chars
        filename = filename.encode('ascii', 'ignore').decode('ascii')
        
        # Replace spaces and special chars with underscores
        filename = re.sub(r'[^\w\s-]', '', filename)
        filename = re.sub(r'[\s_-]+', '_', filename)
        
        # Remove leading/trailing underscores
        filename = filename.strip('_')
        
        return filename.lower()

    def create_markdown_with_frontmatter(self, article: Article) -> str:
        """Create markdown content with YAML frontmatter"""
        
        # Create frontmatter data
        frontmatter = {
            'title': article.title,
            'url': article.url,
            'created_at': article.created_at.isoformat(),
            'processed_at': datetime.now().isoformat(),
            'source': article.source or 'unknown'
        }
        
        if article.author:
            frontmatter['author'] = article.author
        
        if article.publication_date:
            frontmatter['published'] = article.publication_date.isoformat()
        
        if article.tags:
            frontmatter['tags'] = [tag.strip() for tag in article.tags.split(',')]
        
        if article.summary:
            frontmatter['summary'] = article.summary
        
        # Convert to YAML
        yaml_content = yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True)
        
        # Create markdown content
        markdown = f"---\n{yaml_content}---\n\n"
        
        # Add title as H1
        markdown += f"# {article.title}\n\n"
        
        # Add metadata
        if article.author:
            markdown += f"**Author:** {article.author}  \n"
        
        if article.publication_date:
            markdown += f"**Published:** {article.publication_date.strftime('%B %d, %Y')}  \n"
        
        markdown += f"**Source:** [{self.get_domain(article.url)}]({article.url})  \n\n"
        
        # Add horizontal rule
        markdown += "---\n\n"
        
        # Add content (convert to markdown if needed)
        content = article.content or ""
        markdown_content = self.convert_to_markdown(content)
        markdown += markdown_content
        
        # Add original URL at bottom
        markdown += f"\n\n---\n\n**Original Article:** {article.url}\n"
        
        return markdown

    def get_domain(self, url: str) -> str:
        """Extract domain from URL"""
        try:
            parsed = urlparse(url)
            return parsed.netloc
        except:
            return url

    def convert_to_markdown(self, content: str) -> str:
        """Convert plain text content to markdown format"""
        if not content:
            return ""
        
        # Split into paragraphs
        paragraphs = content.split('\n\n')
        
        markdown_paragraphs = []
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            # Simple paragraph formatting
            # You could add more sophisticated formatting here
            markdown_paragraphs.append(para)
        
        return '\n\n'.join(markdown_paragraphs)

    def load_article_from_markdown(self, file_path: str) -> dict:
        """Load article data from markdown file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Split frontmatter and content
            if content.startswith('---\n'):
                parts = content.split('---\n', 2)
                if len(parts) >= 3:
                    frontmatter_str = parts[1]
                    markdown_content = parts[2]
                    
                    frontmatter = yaml.safe_load(frontmatter_str)
                    
                    return {
                        'frontmatter': frontmatter,
                        'content': markdown_content,
                        'raw': content
                    }
            
            return {'content': content, 'raw': content}
            
        except Exception as e:
            logger.error(f"Error loading markdown from {file_path}: {e}")
            return {}

# Global markdown service instance
markdown_service = MarkdownService()