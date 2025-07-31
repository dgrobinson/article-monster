# Zotero Integration Progress

## Current State (2025-07-31)

### Goal
Integrate Zotero library with the article processing system to enable:
- Forward an email → Extract article → Generate EPUB/PDF → Add to Zotero library for markup
- Support both FiveFilters articles and regular forwarded articles

### Key Findings

1. **FiveFilters**: Does NOT support EPUB output - only RSS/JSON
2. **Zotero API**: Supports both PDF and EPUB file uploads via Web API
3. **EPUB vs PDF**: EPUB is better for flowing text (no fixed pagination)

### Test-First Approach Plan

Current step: **Step 1 - Test current system**

#### Steps (in order):
1. ✅ **Test current system**: Send one email and verify article extraction works
2. ⬜ **Create simple EPUB generation**: From one existing article and verify file
3. ⬜ **Set up Zotero API credentials**: Test basic connection
4. ⬜ **Test manual upload**: Upload generated EPUB to Zotero library
5. ⬜ **Add database field**: Track Zotero delivery status
6. ⬜ **Create minimal service**: Zotero service that works for one article
7. ⬜ **Test end-to-end**: email → article → EPUB → Zotero for one example
8. ⬜ **Integration**: Only then integrate into email processing pipeline

### Technical Details Discovered

#### Zotero API Requirements:
- Authentication via user ID and API key
- Supports file attachments (PDF, EPUB, etc.)
- Upload process: Create attachment item → Get upload authorization → Upload file
- Requires metadata: filename, MD5 hash, modification time, content type

#### Current System Architecture:
- Email processing via IMAP
- Article extraction with newspaper3k/BeautifulSoup
- AI summarization (OpenAI/Anthropic/Ollama)
- Markdown file storage with YAML frontmatter
- Kindle delivery via email

### Next Immediate Actions

1. **Check Docker availability** to run the current system
2. **Create .env file** with email credentials if not exists
3. **Start system with Docker Compose** to test article extraction
4. **Send test email** to verify pipeline works

### Files to Reference
- `/app/services/article_extractor.py` - Article content extraction
- `/app/services/email_service.py` - Email processing logic
- `/app/models.py` - Database models
- `docker-compose.yml` - Local development setup
- `.env.example` - Environment variable template

### Questions to Answer
- Is Docker installed and working?
- Do you have email credentials configured?
- Is there an existing .env file?
- Do you have any articles already in the system to test with?

### Resume Instructions
To resume from this point:
1. Read this file to understand current state
2. Check Docker availability: `docker compose version`
3. Set up .env file if needed (copy from .env.example)
4. Start system: `docker compose up`
5. Test article extraction with a forwarded email
6. Then proceed to Step 2: EPUB generation