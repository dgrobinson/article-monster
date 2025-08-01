# AI Summarization Setup Guide

This guide explains how to set up and configure the AI-powered summarization features in the Article Library system.

## Overview

The AI summarization system provides three types of summaries for each article:
- **Brief**: 1-2 sentence summary highlighting the main point
- **Standard**: Single paragraph (3-5 sentences) with key insights
- **Detailed**: Multiple paragraphs with comprehensive coverage

## Supported AI Providers

### 1. OpenAI (GPT models)
- **Models**: GPT-3.5-turbo, GPT-4, GPT-4-turbo, etc.
- **Pros**: High quality, fast, reliable
- **Cons**: Requires API key, costs money per request

### 2. Anthropic (Claude models)
- **Models**: Claude-3-haiku, Claude-3-sonnet, Claude-3-opus
- **Pros**: High quality, good at following instructions
- **Cons**: Requires API key, costs money per request

### 3. Local Models (Ollama/Self-hosted)
- **Models**: Llama2, Mistral, Code Llama, etc.
- **Pros**: Free, private, no API limits
- **Cons**: Requires local setup, slower, potentially lower quality

## Environment Variables Configuration

Add these environment variables to your `.env` file:

```bash
# AI Provider Selection (choose one: openai, anthropic, local)
AI_PROVIDER=openai

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_BASE_URL=https://api.openai.com/v1

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-haiku-20240307
ANTHROPIC_BASE_URL=https://api.anthropic.com/v1

# Local Model Configuration (Ollama)
LOCAL_MODEL_URL=http://localhost:11434/api/generate
LOCAL_MODEL_NAME=llama2

# General AI Configuration
AI_MAX_RETRIES=3
AI_TIMEOUT=60
AI_ENABLE_FALLBACK=true
```

## Setup Instructions

### Option 1: OpenAI Setup

1. Get an OpenAI API key from https://platform.openai.com/api-keys
2. Add to your `.env` file:
   ```bash
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your-key-here
   OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4 for better quality
   ```

### Option 2: Anthropic Setup

1. Get an Anthropic API key from https://console.anthropic.com/
2. Add to your `.env` file:
   ```bash
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ANTHROPIC_MODEL=claude-3-haiku-20240307
   ```

### Option 3: Local Model Setup (Ollama)

1. Install Ollama: https://ollama.ai/
2. Pull a model: `ollama pull llama2`
3. Start Ollama: `ollama serve`
4. Add to your `.env` file:
   ```bash
   AI_PROVIDER=local
   LOCAL_MODEL_NAME=llama2
   LOCAL_MODEL_URL=http://localhost:11434/api/generate
   ```

## Database Migration

After setting up your AI provider, run the database migration to add the new fields:

```bash
# Option 1: Run the Python migration script
python migrations/migrate_ai_summaries.py

# Option 2: Run the SQL script directly
psql -d your_database -f migrations/add_ai_summary_fields.sql
```

## API Usage

### Generate AI Summaries for New Articles

AI summaries are automatically generated when processing new articles. No additional configuration needed.

### Regenerate AI Summaries for Existing Articles

```bash
# Regenerate for a specific article
curl -X POST "http://localhost:8000/api/v1/articles/123/regenerate-ai-summaries"

# Regenerate for multiple articles (batch)
curl -X POST "http://localhost:8000/api/v1/articles/batch-regenerate-ai-summaries" \\
  -H "Content-Type: application/json" \\
  -d '{"limit": 50, "only_missing": true}'

# Use a specific provider for regeneration
curl -X POST "http://localhost:8000/api/v1/articles/123/regenerate-ai-summaries?provider=anthropic"
```

### Get Article Summaries

```bash
# Get all summaries for an article
curl "http://localhost:8000/api/v1/articles/123/summaries"
```

Example response:
```json
{
  "article_id": 123,
  "title": "Article Title",
  "summaries": {
    "basic": "First 200 words of the article...",
    "ai_brief": "AI-generated 1-2 sentence summary",
    "ai_standard": "AI-generated paragraph summary",
    "ai_detailed": "AI-generated detailed multi-paragraph summary"
  },
  "ai_metadata": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "generated_at": "2024-01-15T10:30:00Z"
  }
}
```

## Cost Considerations

### OpenAI Pricing (approximate)
- GPT-3.5-turbo: ~$0.001-0.002 per summary
- GPT-4: ~$0.01-0.03 per summary

### Anthropic Pricing (approximate)
- Claude-3-haiku: ~$0.001-0.002 per summary
- Claude-3-sonnet: ~$0.005-0.01 per summary

### Local Models
- Free after initial setup
- Requires computational resources

## Monitoring and Troubleshooting

### Check AI Service Status

```bash
# Check if articles have AI summaries
curl "http://localhost:8000/api/v1/articles?limit=10" | jq '.[] | {id, title, has_ai_brief: (.ai_summary_brief != null)}'
```

### Common Issues

1. **API Key Issues**
   - Verify your API key is correct
   - Check that your account has credits/quota
   - Ensure the key has proper permissions

2. **Local Model Issues**
   - Verify Ollama is running: `curl http://localhost:11434/api/tags`
   - Check that the model is pulled: `ollama list`
   - Ensure the model name matches your configuration

3. **Timeout Issues**
   - Increase `AI_TIMEOUT` for slower responses
   - Check your network connection
   - Consider using a faster model

4. **Quality Issues**
   - Try different models (GPT-4 > GPT-3.5, Claude-3-sonnet > Claude-3-haiku)
   - Check input content quality and length
   - Verify prompts are appropriate for your content

### Logs

Check application logs for AI summarization status:
```bash
# Look for AI summarization logs
docker-compose logs app | grep -i "ai_summary"
```

## Advanced Configuration

### Custom Prompts

You can modify prompts in `/app/services/ai_summarization_service.py`:

```python
def _get_prompts(self) -> Dict[SummaryType, str]:
    return {
        SummaryType.BRIEF: "Your custom brief prompt here...",
        SummaryType.STANDARD: "Your custom standard prompt here...",
        SummaryType.DETAILED: "Your custom detailed prompt here..."
    }
```

### Fallback Configuration

The system includes fallback mechanisms:
1. If AI summarization fails, it falls back to simple text extraction
2. If one provider fails, you can configure fallback to another
3. Retry logic with exponential backoff for temporary failures

### Performance Optimization

- Use brief summaries for fast overviews
- Generate detailed summaries only for important articles
- Consider batch processing during off-peak hours
- Monitor API usage and costs regularly

## Security Considerations

- Store API keys securely (use environment variables, not code)
- Consider using API key rotation
- Monitor API usage for unexpected spikes
- Be aware of data privacy when sending content to external APIs
- Local models provide better privacy but require more resources

## Integration with Weekly Digests

AI summaries are automatically used in weekly digests when available:
- Digest overview uses AI to summarize the week's themes
- Individual articles use AI summaries instead of basic truncation
- Falls back gracefully if AI summaries aren't available