-- Migration to add AI summary fields to articles table
-- Run this SQL script against your PostgreSQL database to add the new AI summary columns

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