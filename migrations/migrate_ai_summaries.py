#!/usr/bin/env python3
"""
Migration script to add AI summary fields to the articles table.
Run this script to update your database schema for AI summarization support.

Usage:
    python migrations/migrate_ai_summaries.py
"""

import os
import sys
import logging
from pathlib import Path

# Add the parent directory to Python path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from app.database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    """Run the AI summary fields migration"""
    
    migration_sql = """
    -- Add AI summary columns to articles table
    ALTER TABLE articles 
    ADD COLUMN IF NOT EXISTS ai_summary_brief TEXT,
    ADD COLUMN IF NOT EXISTS ai_summary_standard TEXT,
    ADD COLUMN IF NOT EXISTS ai_summary_detailed TEXT,
    ADD COLUMN IF NOT EXISTS ai_summary_provider VARCHAR,
    ADD COLUMN IF NOT EXISTS ai_summary_model VARCHAR,
    ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMP;

    -- Add indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_articles_ai_summary_provider ON articles(ai_summary_provider);
    CREATE INDEX IF NOT EXISTS idx_articles_ai_summary_generated_at ON articles(ai_summary_generated_at);

    -- Add comments to document the columns
    COMMENT ON COLUMN articles.ai_summary_brief IS 'AI-generated brief summary (1-2 sentences)';
    COMMENT ON COLUMN articles.ai_summary_standard IS 'AI-generated standard summary (paragraph)';
    COMMENT ON COLUMN articles.ai_summary_detailed IS 'AI-generated detailed summary (multiple paragraphs)';
    COMMENT ON COLUMN articles.ai_summary_provider IS 'AI provider used (openai, anthropic, local)';
    COMMENT ON COLUMN articles.ai_summary_model IS 'Specific AI model used for generation';
    COMMENT ON COLUMN articles.ai_summary_generated_at IS 'Timestamp when AI summaries were generated';
    """
    
    try:
        logger.info("Starting AI summary fields migration...")
        
        with engine.connect() as connection:
            # Execute the migration in a transaction
            with connection.begin():
                connection.execute(text(migration_sql))
                logger.info("Migration completed successfully!")
                
        logger.info("AI summary fields have been added to the articles table.")
        logger.info("New columns added:")
        logger.info("  - ai_summary_brief: AI-generated brief summary")
        logger.info("  - ai_summary_standard: AI-generated standard summary")
        logger.info("  - ai_summary_detailed: AI-generated detailed summary")
        logger.info("  - ai_summary_provider: AI provider used")
        logger.info("  - ai_summary_model: AI model used")
        logger.info("  - ai_summary_generated_at: Generation timestamp")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        sys.exit(1)

def check_migration_needed():
    """Check if the migration is needed by looking for existing columns"""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'articles' 
                AND column_name IN ('ai_summary_brief', 'ai_summary_standard', 'ai_summary_detailed')
            """))
            
            existing_columns = [row[0] for row in result]
            
            if len(existing_columns) >= 3:
                logger.info("AI summary columns already exist. Migration not needed.")
                return False
            elif len(existing_columns) > 0:
                logger.warning(f"Some AI summary columns exist: {existing_columns}")
                logger.info("Running migration to ensure all columns are present...")
                return True
            else:
                logger.info("AI summary columns not found. Migration needed.")
                return True
                
    except Exception as e:
        logger.error(f"Error checking migration status: {e}")
        logger.info("Proceeding with migration...")
        return True

if __name__ == "__main__":
    logger.info("AI Summary Fields Migration Script")
    logger.info("=" * 40)
    
    if check_migration_needed():
        run_migration()
    else:
        logger.info("No migration needed. Exiting.")