# Article Monster - Claude Context Instructions

## 🚨 CRITICAL: Documentation-First Methodology

**BEFORE doing ANY work in this repo, Claude MUST:**

1. **📖 Read ALL documentation first** - Every .md file in the repo
2. **🔍 Audit actual functionality** - Test what's really working vs what's documented
3. **📊 Reconcile discrepancies** - Note where docs are stale or missing
4. **✅ Verify production state** - Check deployed environment, not just local code
5. **📝 Update docs BEFORE adding new ones** - Fix existing before creating new

**Why this matters:**
- Documentation goes stale quickly
- Planned features get documented but never implemented  
- Code exists but isn't integrated or tested
- Production environment may differ from code

**When creating new documentation:**
- First audit what exists and its accuracy
- Update/fix existing docs before adding new ones
- Always test actual functionality, don't assume from code presence
- Coordinate all .md files for consistency

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

### CRITICAL DESIGN PRINCIPLE
**NEVER write publication-specific code!** 
- This service must remain publication-agnostic
- ALL site-specific extraction logic comes from FiveFilters configs
- We maintain feature parity with FiveFilters Full-Text RSS
- The fivefilters-config submodule provides all site-specific rules
- If a site doesn't extract properly, the fix belongs in FiveFilters configs, NOT in our code

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

## Available CLI Tools
Claude has access to these CLI tools for managing this project:

### GitHub CLI (`gh`)
- Check workflow status: `gh workflow list`
- View workflow runs: `gh run list`
- Trigger deployments via GitHub Actions if needed
- Manage pull requests and issues

### DigitalOcean CLI (`doctl`)
- Check app status: `doctl apps list`
- Monitor deployments: `doctl apps get-deployment <app-id> <deployment-id>`
- View logs: `doctl apps logs <app-id>`
- App ID: `214fb1d0-54f7-4a28-ba39-7db566e8a8e6`
- App URL: https://seal-app-t4vff.ondigitalocean.app

## Known Issues & Solutions

### WSJ Content Extraction
- **Root Cause**: Bookmarklet fetches FiveFilters config asynchronously but doesn't wait for it
- **What Happens**:
  1. Bookmarklet checks for cached site config (not found)
  2. Fetches config from server but continues immediately (async)
  3. Falls back to simplified extraction which fails on WSJ
  4. Config gets stored for "next time" but current extraction already failed
- **The Fix**: Bookmarklet must wait for FiveFilters config before attempting extraction
- **Note**: WSJ has a full FiveFilters config at `site-configs/wsj.com.txt` that would work if used

### EPUB Table of Contents
- epub-gen library always includes a basic TOC structure
- Setting empty titles or excludeFromToc can break EPUB generation
- Current approach: Minimal TOC with single entry for the article

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