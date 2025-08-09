# Article Monster - Claude Context Instructions

## Project Overview
This is Article Monster - a cloud service that provides:
1. **Bookmarklet Service**: Sends web articles to both Kindle and Zotero with a single bookmarklet click
2. **MCP Server**: Provides Model Context Protocol access to your Zotero library for ChatGPT and Claude

## Key Technologies
- Node.js/Express backend
- Mozilla Readability.js for content extraction
- Zotero API integration
- Kindle email delivery
- EPUB generation
- MCP (Model Context Protocol) server

## Architecture
```
Browser (with auth) → Bookmarklet extracts content → Cloud Service → Kindle + Zotero
```

## Important Files to Always Read for Context

When launched in this repository, Claude should read these files to understand the project:

1. **README.md** - Complete project overview, features, setup instructions
2. **package.json** - Dependencies, scripts, project metadata
3. **src/server.js** - Main Express server and API endpoints
4. **src/epubGenerator.js** - EPUB creation for Zotero attachments
5. **src/zoteroService.js** - Zotero API integration
6. **src/emailService.js** - Kindle email delivery
7. **public/bookmarklet.js** - Client-side content extraction

## Key Context Points

### Security
- This is a defensive tool for personal research management
- Extracts content from authenticated sites user already has access to
- Only ADDS items to Zotero, never modifies existing ones
- Uses test collections to protect main Zotero library

### Main Workflows
- Bookmarklet: Extract article → Send to Kindle + Zotero simultaneously
- MCP: Provide AI assistants access to Zotero library via API

### Environment Variables
- Gmail credentials for Kindle email delivery
- Zotero API credentials
- MCP API key for AI access
- Test collection keys for safety

## Development Context
- **IMPORTANT: This service is deployed on DigitalOcean App Platform**
- **Always test in production - local testing is not the standard workflow**
- Push changes to GitHub → Auto-deploys to DigitalOcean
- No database - stateless service using external APIs
- Browser-side extraction preserves user authentication
- Uses `npm run dev` for development with --watch flag (rarely needed)

## Auto-Context Reading Instruction

**IMPORTANT**: Every time Claude is launched in this repository, automatically read the following files in this order to understand the full project context:

1. README.md
2. package.json  
3. src/server.js
4. src/epubGenerator.js
5. Current git status via `git status`

This ensures Claude always has complete context about:
- Project purpose and architecture
- Current dependencies and scripts
- API endpoints and functionality  
- EPUB generation capabilities
- Current working state

Do this automatically without being asked, then proceed with user requests.