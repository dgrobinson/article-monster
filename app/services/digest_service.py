from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import Article, WeeklyDigest
import logging

logger = logging.getLogger(__name__)

def generate_weekly_digest():
    """Generate weekly digest of articles"""
    db = SessionLocal()
    
    try:
        # Check if we need to generate a digest
        now = datetime.now()
        week_start = now - timedelta(days=7)
        
        # Check if digest already exists for this week
        existing = db.query(WeeklyDigest).filter(
            WeeklyDigest.week_start >= week_start
        ).first()
        
        if existing:
            logger.info("Weekly digest already exists for this period")
            return
        
        # Get articles from the past week
        articles = db.query(Article).filter(
            Article.created_at >= week_start,
            Article.processed == True
        ).all()
        
        if not articles:
            logger.info("No articles to include in weekly digest")
            return
        
        # Generate summary
        summary = create_digest_summary(articles)
        
        # Create digest record
        digest = WeeklyDigest(
            week_start=week_start,
            week_end=now,
            summary=summary,
            article_count=len(articles)
        )
        
        db.add(digest)
        db.commit()
        
        logger.info(f"Generated weekly digest with {len(articles)} articles")
        
        # TODO: Send digest via email
        
    except Exception as e:
        logger.error(f"Error generating weekly digest: {e}")
    finally:
        db.close()

def create_digest_summary(articles) -> str:
    """Create a summary of articles for the digest"""
    
    summary = f"# Weekly Article Digest\n\n"
    summary += f"**Period:** {articles[0].created_at.strftime('%B %d')} - {articles[-1].created_at.strftime('%B %d, %Y')}\n"
    summary += f"**Total Articles:** {len(articles)}\n\n"
    
    # Group by source
    sources = {}
    for article in articles:
        source = article.source or 'unknown'
        if source not in sources:
            sources[source] = []
        sources[source].append(article)
    
    for source, source_articles in sources.items():
        summary += f"## {source.title()} ({len(source_articles)} articles)\n\n"
        
        for article in source_articles[:10]:  # Limit to 10 per source
            summary += f"### {article.title}\n"
            if article.author:
                summary += f"*By {article.author}*\n\n"
            if article.summary:
                summary += f"{article.summary[:200]}...\n\n"
            summary += f"[Read Article]({article.url})\n\n"
            summary += "---\n\n"
    
    return summary