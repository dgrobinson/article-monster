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
4. **FiveFilters Limitation**: Only allows sending to kindle.com addresses - we may need to clone/replicate this infrastructure

### Additional Requirements

**Bookmarklet Strategy**: Need to create a bookmarklet that:
- Sends articles to Kindle (like FiveFilters does)
- ALSO sends to our system for Zotero library integration
- This gives dual functionality: reading on Kindle + markup in Zotero

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
- Email processing via IMAP (Celery checks every 5 minutes)
- Article extraction with newspaper3k/BeautifulSoup
- AI summarization (OpenAI/Anthropic/Ollama)
- Markdown file storage with YAML frontmatter
- Kindle delivery via email
- **Real-time processing**: Uses FastAPI BackgroundTasks for immediate async processing
- **Event-driven**: When email arrives or API called, extraction/delivery happens immediately

### Architecture Considerations

Since FiveFilters only allows sending to kindle.com addresses, we have several options:

1. **Use FiveFilters API directly** (if available) to get article content, then process ourselves
2. **Clone/replicate FiveFilters functionality** using open-source alternatives
3. **Create our own article extraction service** (we already have this with newspaper3k/BeautifulSoup)
4. **Bookmarklet approach**: Direct submission to our API, bypassing email entirely

### Bookmarklet Implementation Plan

The bookmarklet should:
1. Capture current page URL and title
2. Send to our API endpoint (`/api/v1/articles/process-url` - already exists!)
3. Our system then (in real-time via BackgroundTasks):
   - Extracts article content immediately
   - Generates EPUB for Zotero (NEW)
   - Sends formatted version to Kindle (already works)
   - Updates Zotero library (NEW)
   - Returns success/failure status

**Good news**: 
- We already have the `/api/v1/articles/process-url` endpoint that accepts URLs directly
- The system already processes articles in real-time using FastAPI BackgroundTasks
- Email checking runs every 5 minutes via Celery (can be made more frequent if needed)

**What needs to be added for Zotero**:
- EPUB generation step in the processing pipeline
- Zotero API integration in the background task
- New field in ProcessUrlRequest schema for `send_to_zotero`

### Sample Bookmarklet Code

```javascript
javascript:(function(){
  const apiUrl = 'https://articles.robinsonian.com/api/v1/articles/process-url';
  const data = {
    url: window.location.href,
    send_to_kindle: true,
    send_to_zotero: true  // New field we'll add
  };
  
  fetch(apiUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data)
  })
  .then(r => r.json())
  .then(d => alert('Article sent for processing!'))
  .catch(e => alert('Error: ' + e));
})();
```

### Next Immediate Actions

1. **Check Docker availability** to run the current system
2. **Create .env file** with email credentials if not exists
3. **Start system with Docker Compose** to test article extraction
4. **Send test email** to verify pipeline works
5. **Research FiveFilters alternatives** or API access
6. **Design bookmarklet** for direct article submission

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