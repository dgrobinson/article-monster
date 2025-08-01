import httpx
from newspaper import Article as NewspaperArticle
from bs4 import BeautifulSoup
from app.database import SessionLocal
from app.models import Article
import logging
from datetime import datetime
from urllib.parse import urlparse
from app.services.ai_summarization_service import generate_ai_summaries, SummaryType, AIProvider

logger = logging.getLogger(__name__)

async def extract_article_content(article_id: int, send_to_kindle: bool = False):
    """Extract full content from article URL"""
    db = SessionLocal()
    
    try:
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            logger.error(f"Article {article_id} not found")
            return
        
        # Try newspaper3k first
        content, title, author, pub_date = await extract_with_newspaper(article.url)
        
        # Fallback to BeautifulSoup if newspaper fails
        if not content:
            content, title = await extract_with_beautifulsoup(article.url)
        
        # Update article with extracted content
        if content:
            article.content = content
            article.title = title or article.title
            article.author = author or article.author
            article.publication_date = pub_date
            article.processed = True
            
            # Generate simple summary (first 200 words)
            article.summary = generate_summary(content)
            
            # Generate AI summaries
            await generate_ai_summaries_for_article(article, content)
            
            db.commit()
            
            # Save as markdown file
            from app.services.markdown_service import markdown_service
            markdown_service.save_article_as_markdown(article_id)
            
            # Send to Kindle if requested
            if send_to_kindle:
                from app.services.email_service import send_to_kindle
                await send_to_kindle(article_id)
                
        else:
            logger.error(f"Failed to extract content for article {article_id}")
            
    except Exception as e:
        logger.error(f"Error processing article {article_id}: {e}")
    finally:
        db.close()

async def extract_with_newspaper(url: str):
    """Extract content using newspaper3k"""
    try:
        article = NewspaperArticle(url)
        article.download()
        article.parse()
        
        return (
            article.text,
            article.title,
            ', '.join(article.authors) if article.authors else None,
            article.publish_date
        )
    except Exception as e:
        logger.warning(f"Newspaper extraction failed for {url}: {e}")
        return None, None, None, None

async def extract_with_beautifulsoup(url: str):
    """Fallback extraction using BeautifulSoup"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Try to find title
        title = None
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.get_text().strip()
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "header", "footer"]):
            script.decompose()
        
        # Try common article selectors
        content_selectors = [
            'article',
            '[role="main"]',
            '.content',
            '.article-content',
            '.post-content',
            '.entry-content',
            'main'
        ]
        
        content = None
        for selector in content_selectors:
            element = soup.select_one(selector)
            if element:
                content = element.get_text()
                break
        
        # Fallback to body if no specific content found
        if not content:
            body = soup.find('body')
            if body:
                content = body.get_text()
        
        # Clean up content
        if content:
            lines = (line.strip() for line in content.splitlines())
            content = '\n'.join(line for line in lines if line)
        
        return content, title
        
    except Exception as e:
        logger.error(f"BeautifulSoup extraction failed for {url}: {e}")
        return None, None

def generate_summary(content: str, max_words: int = 200) -> str:
    """Generate a simple summary by taking first N words"""
    if not content:
        return ""
    
    words = content.split()
    if len(words) <= max_words:
        return content
    
    summary_words = words[:max_words]
    summary = ' '.join(summary_words)
    
    # Try to end at a sentence
    last_period = summary.rfind('.')
    if last_period > len(summary) * 0.8:  # If period is in last 20%
        summary = summary[:last_period + 1]
    else:
        summary += "..."
    
    return summary

async def generate_ai_summaries_for_article(article: Article, content: str):
    """Generate AI summaries for an article and update the database record"""
    try:
        logger.info(f"Generating AI summaries for article {article.id}")
        
        # Generate AI summaries
        summaries = await generate_ai_summaries(content, article.title)
        
        # Update article with AI summaries
        article.ai_summary_brief = summaries.get(SummaryType.BRIEF)
        article.ai_summary_standard = summaries.get(SummaryType.STANDARD)
        article.ai_summary_detailed = summaries.get(SummaryType.DETAILED)
        
        # Set provider info
        from app.services.ai_summarization_service import AISummarizationService
        service = AISummarizationService()
        provider, model = service.get_provider_info()
        article.ai_summary_provider = provider
        article.ai_summary_model = model
        article.ai_summary_generated_at = datetime.now()
        
        logger.info(f"Successfully generated AI summaries for article {article.id}")
        
    except Exception as e:
        logger.error(f"Failed to generate AI summaries for article {article.id}: {e}")
        # Don't fail the entire process if AI summarization fails
        pass

async def regenerate_ai_summaries(article_id: int, provider: AIProvider = None):
    """Regenerate AI summaries for an existing article"""
    db = SessionLocal()
    
    try:
        article = db.query(Article).filter(Article.id == article_id).first()
        if not article:
            logger.error(f"Article {article_id} not found")
            return False
        
        if not article.content:
            logger.error(f"Article {article_id} has no content to summarize")
            return False
        
        logger.info(f"Regenerating AI summaries for article {article_id}")
        
        # Generate AI summaries with specific provider if requested
        summaries = await generate_ai_summaries(article.content, article.title, provider)
        
        # Update article with new AI summaries
        article.ai_summary_brief = summaries.get(SummaryType.BRIEF)
        article.ai_summary_standard = summaries.get(SummaryType.STANDARD)
        article.ai_summary_detailed = summaries.get(SummaryType.DETAILED)
        
        # Set provider info
        from app.services.ai_summarization_service import AISummarizationService
        service = AISummarizationService()
        provider_name, model = service.get_provider_info(provider)
        article.ai_summary_provider = provider_name
        article.ai_summary_model = model
        article.ai_summary_generated_at = datetime.now()
        
        db.commit()
        
        logger.info(f"Successfully regenerated AI summaries for article {article_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error regenerating AI summaries for article {article_id}: {e}")
        return False
    finally:
        db.close()