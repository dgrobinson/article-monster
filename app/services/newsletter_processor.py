import re
from bs4 import BeautifulSoup
from app.database import SessionLocal
from app.models import Newsletter, Article
from app.services.article_extractor import extract_article_content
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

async def process_newsletter(newsletter_id: int):
    """Process newsletter content and extract articles"""
    db = SessionLocal()
    
    try:
        newsletter = db.query(Newsletter).filter(Newsletter.id == newsletter_id).first()
        if not newsletter:
            logger.error(f"Newsletter {newsletter_id} not found")
            return
        
        # Extract URLs from newsletter content
        urls = extract_urls_from_newsletter(newsletter.raw_content)
        
        # Create articles for each URL
        for url in urls:
            # Check if article already exists
            existing = db.query(Article).filter(Article.url == url).first()
            
            if not existing:
                article = Article(
                    title=f"Article from {newsletter.name}",
                    url=url,
                    source="newsletter",
                    newsletter_id=newsletter.id,
                    created_at=datetime.now()
                )
                db.add(article)
                db.commit()
                db.refresh(article)
                
                # Extract content in background
                await extract_article_content(article.id)
        
        # Mark newsletter as processed
        newsletter.processed = True
        db.commit()
        
        logger.info(f"Processed newsletter {newsletter_id}, found {len(urls)} articles")
        
    except Exception as e:
        logger.error(f"Error processing newsletter {newsletter_id}: {e}")
    finally:
        db.close()

def extract_urls_from_newsletter(content: str) -> list:
    """Extract article URLs from newsletter content"""
    urls = []
    
    # Parse HTML content
    soup = BeautifulSoup(content, 'html.parser')
    
    # Find all links
    links = soup.find_all('a', href=True)
    
    for link in links:
        href = link['href']
        
        # Skip if not a proper URL
        if not href.startswith(('http://', 'https://')):
            continue
        
        # Skip common newsletter links (unsubscribe, social, etc.)
        if any(skip in href.lower() for skip in ['unsubscribe', 'facebook.com', 'twitter.com', 'linkedin.com']):
            continue
        
        # Check if link text suggests it's an article
        link_text = link.get_text().strip().lower()
        if is_likely_article_link(link_text, href):
            urls.append(href)
    
    # Also extract URLs from plain text using regex
    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    text_urls = re.findall(url_pattern, content)
    
    for url in text_urls:
        if url not in urls and is_likely_article_url(url):
            urls.append(url)
    
    return list(set(urls))  # Remove duplicates

def is_likely_article_link(link_text: str, url: str) -> bool:
    """Determine if a link is likely to be an article"""
    
    # Check link text for article indicators
    article_indicators = [
        'read more', 'full article', 'continue reading', 'view article',
        'read full', 'more info', 'learn more', 'full story'
    ]
    
    for indicator in article_indicators:
        if indicator in link_text:
            return True
    
    # Check if link text is substantial (likely article title)
    if len(link_text) > 20 and not any(skip in link_text for skip in ['subscribe', 'follow', 'share']):
        return True
    
    return is_likely_article_url(url)

def is_likely_article_url(url: str) -> bool:
    """Check if URL pattern suggests it's an article"""
    
    # Common article URL patterns
    article_patterns = [
        r'/article/',
        r'/post/',
        r'/blog/',
        r'/news/',
        r'/story/',
        r'/\d{4}/\d{2}/',  # Date patterns
        r'\.html$',
        r'/[a-z-]+-[a-z-]+',  # Hyphenated titles
    ]
    
    for pattern in article_patterns:
        if re.search(pattern, url.lower()):
            return True
    
    # Exclude common non-article URLs
    exclude_patterns = [
        'unsubscribe', 'preferences', 'profile', 'account',
        'facebook.com', 'twitter.com', 'linkedin.com', 'instagram.com',
        'youtube.com', 'ads?', 'tracking', 'analytics'
    ]
    
    for exclude in exclude_patterns:
        if re.search(exclude, url.lower()):
            return False
    
    return True