from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import Article, WeeklyDigest
from app.services.ai_summarization_service import generate_ai_summaries, SummaryType
import logging

logger = logging.getLogger(__name__)

async def generate_weekly_digest():
    """Generate weekly digest of articles with AI-enhanced summary"""
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
        
        # Generate enhanced summary with AI
        summary = await create_digest_summary(articles)
        
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

async def create_digest_summary(articles) -> str:
    """Create an AI-enhanced summary of articles for the digest"""
    
    # Start with basic digest structure
    summary = f"# Weekly Article Digest\n\n"
    summary += f"**Period:** {articles[0].created_at.strftime('%B %d')} - {articles[-1].created_at.strftime('%B %d, %Y')}\n"
    summary += f"**Total Articles:** {len(articles)}\n\n"
    
    # Create AI summary of the week's content
    try:
        # Collect article summaries for AI processing
        article_summaries = []
        for article in articles:
            # Prefer AI summaries, fall back to basic summary
            article_summary = (
                article.ai_summary_standard or 
                article.ai_summary_brief or 
                article.summary or 
                f"Article: {article.title}"
            )
            article_summaries.append(f"- {article.title}: {article_summary}")
        
        # Create content for AI summarization
        content_for_ai = "\n".join(article_summaries)
        
        if len(content_for_ai) > 100:  # Only if we have meaningful content
            # Generate AI overview of the week
            ai_overview_prompt = f"""Based on these articles from this week, provide a brief overview of the main themes and topics covered:

{content_for_ai}

Please provide a 2-3 sentence overview of the key themes and insights from this week's articles."""
            
            ai_summaries = await generate_ai_summaries(ai_overview_prompt, "Weekly Article Overview")
            week_overview = ai_summaries.get(SummaryType.BRIEF)
            
            if week_overview:
                summary += f"## Week Overview\n{week_overview}\n\n"
                
    except Exception as e:
        logger.warning(f"Failed to generate AI overview for weekly digest: {e}")
    
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
            
            # Use AI summary if available, otherwise fall back to basic summary
            article_summary = (
                article.ai_summary_standard or 
                article.ai_summary_brief or 
                article.summary
            )
            
            if article_summary:
                # Truncate if too long
                if len(article_summary) > 300:
                    article_summary = article_summary[:300] + "..."
                summary += f"{article_summary}\n\n"
            
            summary += f"[Read Article]({article.url})\n\n"
            
            # Add AI summary metadata if available
            if article.ai_summary_provider:
                summary += f"*AI Summary by {article.ai_summary_provider}*\n\n"
            
            summary += "---\n\n"
    
    return summary

def create_basic_digest_summary(articles) -> str:
    """Create a basic summary of articles for the digest (fallback)"""
    
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