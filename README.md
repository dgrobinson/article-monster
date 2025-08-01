# Article Monster 🦾

Enhanced cloud-native article and newsletter management system that improves upon FiveFilters functionality.

## Features

- **Multi-source ingestion**: URLs, RSS feeds, email newsletters
- **Enhanced content processing**: Better extraction and cleaning
- **Markdown storage**: Articles saved as markdown with YAML frontmatter
- **Email integration**: Receive from FiveFilters, send to Kindle
- **Weekly digests**: Automated summaries via email
- **Background processing**: Celery tasks for scalability
- **Cloud-ready**: Docker containerized with PostgreSQL

## Quick Start

### Local Development
1. **Clone and setup**:
   ```bash
   git clone <your-repo>
   cd article-monster
   cp .env.example .env
   # Edit .env with your email credentials
   ```

2. **Deploy locally**:
   ```bash
   docker-compose up -d
   ```

3. **Test the API**:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

### Cloud Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed cloud deployment instructions.

**Quick cloud setup**:
1. Create dedicated Gmail account for processing
2. Deploy to DigitalOcean/Railway/Render
3. Configure environment variables
4. Start forwarding newsletters and articles!

## Email Workflows

### 1. Newsletter Forwarding
Forward any newsletter to your processing email:
```
To: your-processing-email@gmail.com
Subject: Fwd: Morning Brew Newsletter
```
System extracts articles → Processes content → Sends to Kindle

### 2. FiveFilters Integration  
Configure FiveFilters to send to your processing email instead of Kindle:
- **Before**: FiveFilters → Kindle
- **After**: FiveFilters → Your System → Enhanced Processing → Kindle

### 3. Manual Article Processing
Forward URLs or articles directly:
```
To: your-processing-email@gmail.com
Subject: Interesting Article
Body: https://example.com/great-article
```

## Architecture

### Core Components

- **FastAPI**: REST API for article management
- **PostgreSQL**: Article/newsletter storage
- **Redis**: Task queue and caching
- **Celery**: Background task processing
- **Docker**: Containerized deployment

### Data Flow

1. **FiveFilters → Your System**: Emails processed automatically
2. **Content Extraction**: Full-text extraction with multiple fallbacks
3. **Markdown Storage**: Articles saved with YAML frontmatter
4. **Kindle Delivery**: Enhanced formatting for e-readers
5. **Weekly Digests**: Automated summaries and highlights

## API Endpoints

### Articles
- `POST /api/v1/articles/process-url` - Process a new article URL
- `GET /api/v1/articles/` - List articles
- `GET /api/v1/articles/{id}` - Get specific article
- `POST /api/v1/articles/{id}/send-to-kindle` - Send to Kindle

### Newsletters
- `POST /api/v1/newsletters/` - Process newsletter
- `GET /api/v1/newsletters/` - List newsletters

### Health
- `GET /api/v1/health` - System health check

## Configuration

### Environment Variables

```bash
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
KINDLE_EMAIL=your-kindle@kindle.com

# Database (optional)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### Email Setup

1. **Gmail App Password**:
   - Enable 2FA on Gmail
   - Generate app-specific password
   - Use this password (not your regular password)

2. **Kindle Email**:
   - Find your Kindle email in Amazon account settings
   - Add your sending email to approved senders list

## Usage Examples

### Process a single URL
```bash
curl -X POST "http://localhost:8000/api/v1/articles/process-url" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/article",
    "send_to_kindle": true,
    "tags": "tech,ai"
  }'
```

### FiveFilters Integration

1. **Current Flow**: FiveFilters → Kindle
2. **New Flow**: FiveFilters → Your System → Enhanced Processing → Kindle

Configure FiveFilters to send emails to a dedicated address that your system monitors.

## File Structure

```
articles/               # Stored markdown files
├── 2024-01-15_article-title.md
└── 2024-01-16_another-article.md

app/
├── main.py            # FastAPI application
├── models.py          # Database models
├── services/          # Business logic
│   ├── article_extractor.py
│   ├── email_service.py
│   └── markdown_service.py
└── tasks/             # Celery background tasks
```

## Markdown Format

Articles are stored as markdown with YAML frontmatter:

```yaml
---
title: "Article Title"
url: "https://example.com/article"
author: "Author Name"
published: "2024-01-15T10:00:00"
tags: ["tech", "ai"]
summary: "Brief summary..."
---

# Article Title

**Author:** Author Name  
**Published:** January 15, 2024  
**Source:** [example.com](https://example.com/article)

---

Article content in markdown format...
```

## Development

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run database migrations
# (Auto-created on startup)

# Start the API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Start Celery worker (separate terminal)
celery -A app.celery_app worker --loglevel=info

# Start Celery beat scheduler (separate terminal)
celery -A app.celery_app beat --loglevel=info
```

### Docker Development
```bash
# Build and start all services
docker-compose up --build

# View logs
docker-compose logs -f app

# Run database shell
docker-compose exec db psql -U postgres -d article_monster
```

## Monitoring

- **Health Check**: `GET /api/v1/health`
- **Database**: Check PostgreSQL connectivity
- **Redis**: Task queue status
- **Celery**: Background task processing

## Testing and Debugging

### Automated Testing
- **Synthetic email generation**: Creates realistic test emails automatically
- **External service integration**: Uses Mailinator, Webhook.site for validation
- **RSS feed testing**: Validates article extraction from real feeds
- **Continuous testing**: Runs tests at regular intervals

### Email Archive System
- **Complete email storage**: Archives all incoming emails with full metadata
- **Replay capability**: Re-process archived emails for debugging
- **Batch operations**: Test improvements on historical data
- **Categorization**: Tag and organize emails by type and source

### API Endpoints for Testing
```bash
# Run automated tests
curl -X POST "http://localhost:8000/api/v1/testing/run-automated-tests"

# Send test email
curl -X POST "http://localhost:8000/api/v1/testing/send-test-email" \
  -H "Content-Type: application/json" \
  -d '{"test_type": "newsletter"}'

# Get archived emails
curl "http://localhost:8000/api/v1/archive/emails?limit=10&email_type=newsletter"

# Replay archived email
curl -X POST "http://localhost:8000/api/v1/archive/emails/123/replay"
```

## Roadmap

- [x] Email archiving and replay system
- [x] Automated testing framework
- [ ] AI-powered article summarization
- [ ] Advanced content categorization
- [ ] Web dashboard for article management
- [ ] RSS feed generation for processed articles
- [ ] Integration with read-later services
- [ ] Mobile app for article management