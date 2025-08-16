# Article Monster - Claude Context Instructions

## 🚨 CRITICAL: Documentation-First Methodology

**BEFORE doing ANY work in this repo, Claude MUST:**

1. **📖 Read root documentation first** - Root .md files in the repo (README.md, etc.)
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
- **Primary**: FastMCP Python server (v2.11.3) for MCP integration
- **Fallback**: Node.js/Express backend for bookmarklet service
- Mozilla Readability.js for content extraction
- Zotero API integration (Python async + Node.js)
- Kindle email delivery
- EPUB generation
- Server-Sent Events (SSE) for real-time MCP communication

## Architecture
```
Browser (with auth) → Bookmarklet extracts content → Cloud Service → Kindle + Zotero
                                                           ↓
ChatGPT/Claude ←→ FastMCP Python Server ←→ Zotero API (search, fetch tools)
```

## Important Files to Always Read for Context

When launched in this repository, Claude should read these files to understand the project:

1. **README.md** - Complete project overview, features, setup instructions
2. **package.json** - Dependencies, scripts, project metadata  
3. **src/mcpFastMCP.py** - **PRIMARY**: Pure FastMCP server for ChatGPT/Claude integration
4. **start.sh** - Startup script (FastMCP first, Node.js fallback)
5. **src/bookmarkletOnly.js** - Fallback Node.js server (bookmarklet-only mode)
6. **src/epubGenerator.js** - EPUB creation for Zotero attachments
7. **public/bookmarklet.js** - Client-side content extraction

## Key Context Points

### CRITICAL DESIGN PRINCIPLES

#### Publication-Agnostic Content Extraction
**NEVER write publication-specific code for content extraction!** 
- This service must remain publication-agnostic for content
- ALL site-specific extraction logic comes from FiveFilters configs
- We maintain feature parity with FiveFilters Full-Text RSS
- The fivefilters-config submodule provides all site-specific rules
- If a site doesn't extract properly, the fix belongs in FiveFilters configs, NOT in our code

#### Leverage Existing Tools for Metadata (Key Learning August 2025)
**ALWAYS prefer proven, community-maintained solutions over custom implementations**
- **For Content**: Use FiveFilters - they excel at site-specific content extraction
- **For Metadata**: Use Zotero translators - they excel at bibliographic metadata extraction
- **Strategic Insight**: Don't duplicate work - integrate strengths from existing tools
- **Example**: Rather than building custom DOI extraction, port Zotero's Embedded Metadata translator
- **Benefit**: Battle-tested extraction logic with community maintenance and constant improvement

#### Pure FastMCP Architecture (Critical Learning August 2025)
**ALWAYS use FastMCP for ChatGPT integration - custom implementations fail validation**
- **Architecture Rule**: FastMCP Python server on main port, Node.js fallback for bookmarklet
- **ChatGPT Requirement**: Proven FastMCP patterns eliminate connection abort issues
- **Key Discovery**: Custom MCP implementations fail ChatGPT validation despite protocol compliance
- **Implementation**: Pure FastMCP v2.11.3 with zero custom code on cloud endpoints
- **Transport**: Server-Sent Events (SSE) with built-in MCP protocol handling
- **Fallback Strategy**: Smart startup script tries FastMCP first, falls back to bookmarklet-only Node.js
- **Current Deployment**: FastMCP on port 8080, accessible at `/sse` endpoint

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
- **NEVER run the service locally** - development workflow is cloud-first
- Push changes to GitHub → Auto-deploys to DigitalOcean
- No database - stateless service using external APIs
- Browser-side extraction preserves user authentication
- Local `npm run dev` exists but is not used in standard workflow

### Testing Framework (Added August 2025)
- **Test Scripts**: 
  - `test-extraction.js` - Basic Readability.js testing
  - `test-extraction-with-fivefilters.js` - Tests with FiveFilters config loading
  - `test-epub-generation.js` - Tests full EPUB generation pipeline
- **Test Folders**: 
  - `test-cases/unsolved/` - articles with known extraction issues
  - `test-cases/solved/` - regression tests for previously fixed articles
- **Test Format**: HTML file + JSON metadata with expected phrases and minimum length
- **Workflow**: Fix extraction → move test case from unsolved/ to solved/ folder
- **CI/CD**: GitHub Actions runs tests automatically on every push
- **Automated Deployment**: `deploy-and-test.sh` - commits, pushes, monitors deployment

### Bookmarklet Updates (Key Learning August 2025)
- **Bookmarklet does NOT need to be deleted/recreated** when code changes
- The bookmarklet is just a link that loads JavaScript from the server
- Updates to `public/bookmarklet.js` take effect immediately on next click
- User can keep existing bookmarklet indefinitely - it always gets latest code

## Available CLI Tools
Claude has access to these CLI tools for managing this project:

### GitHub CLI (`gh`)
- Check workflow status: `gh workflow list`
- View workflow runs: `gh run list`
- Check test results: `gh run view <run-id> --log`
- Trigger deployments via GitHub Actions if needed
- Manage pull requests and issues

### GitHub Actions CI/CD (Added August 2025)
- **Extraction Tests**: `.github/workflows/extraction-tests.yml`
- **Runs automatically** on every push to main
- **Tests both** basic extraction and FiveFilters extraction
- **Validates** site configs exist for test cases
- **Reports** results in GitHub UI with summary

### DigitalOcean CLI (`doctl`)
- Check app status: `doctl apps list`
- Monitor deployments: `doctl apps get-deployment <app-id> <deployment-id>`
- View logs: `doctl apps logs <app-id>`
- App ID: `214fb1d0-54f7-4a28-ba39-7db566e8a8e6`
- App URL: https://seal-app-t4vff.ondigitalocean.app

## Known Issues & Solutions

### Zero-Hardcoding Principle (Fixed August 2025)
- **Issue**: Bookmarklet had hardcoded configs for sites, violating zero-hardcoding principle
- **Solution**: Removed all hardcoded configs, everything now fetched from server/site-configs
- **Fix**: Bookmarklet now synchronously fetches FiveFilters config before extraction
- **Status**: ✅ RESOLVED - Dynamic config loading working correctly
- **Key Learning**: Site configs MUST come from FiveFilters, never hardcoded in our codebase

### EPUB Table of Contents (Resolved August 2025)
- **Current Solution**: Enhanced CSS-based hiding - TOC content hidden, minimal blank page remains
- **Implementation**: `nav[epub:type="toc"], .toc, #toc` hidden with `display: none !important`
- **Status**: ✅ WORKING - TOC content invisible in readers, user feedback confirms improvement
- **Alternative Evaluated**: nodepub library migration would require complete API rewrite
- **Decision Rationale**: CSS solution solves user problem with minimal risk vs high-complexity migration
- **Library Limitation**: epub-gen v0.1.0 architectural constraint cannot be fully overcome
- **Reference**: See LESSONS_LEARNED.md for detailed investigation history

## MCP Integration Status (August 2025)

### Current Architecture: Pure FastMCP Deployment ✅
- **Base URL**: `https://seal-app-t4vff.ondigitalocean.app/sse`
- **Implementation**: Pure FastMCP Python server (v2.11.3) running on main port
- **Transport**: Server-Sent Events (SSE) with built-in MCP protocol compliance
- **Tools**: `search` and `fetch` with full Zotero library integration
- **Zero Custom Code**: Eliminated all custom MCP endpoints to test FastMCP directly

### Key Architectural Discovery: FastMCP vs Custom Implementation 
**Critical Insight**: After extensive testing of hybrid approaches, we discovered that **custom MCP implementations consistently fail ChatGPT validation** despite protocol compliance. Our pure FastMCP approach eliminates:
- Connection abort issues (ECONNRESET errors)
- Custom SSE stream formatting problems  
- Proxy layer interference
- Bidirectional communication complexity

### FastMCP Benefits
- **Battle-tested protocol compliance** - thousands of working implementations
- **Built-in logging** - comprehensive request/response tracking
- **Automatic schema generation** - from Python type hints
- **Community support** - proven ChatGPT compatibility patterns

### FastMCP Deployment Details
- **Startup Process**: `start.sh` script tries FastMCP first, falls back to bookmarklet-only Node.js
- **Production URL**: `https://seal-app-t4vff.ondigitalocean.app/sse`
- **Built-in Logging**: FastMCP provides comprehensive HTTP and MCP protocol logs
- **Dependencies**: Automatically installed via `requirements.txt` in build process
- **Failover**: If Python/FastMCP unavailable, gracefully falls back to `src/bookmarkletOnly.js`

### Connection Testing Status
- **Previous Hybrid Issues**: Connection established but aborted during tool transmission (ECONNRESET)
- **Root Cause Discovery**: Custom MCP implementations fail ChatGPT validation despite technical compliance
- **Current Pure FastMCP**: Clean startup confirmed, zero custom code interference
- **Status**: Ready for ChatGPT testing with proven FastMCP patterns

## Current Known Issues (August 2025)

### 🔴 High Priority
1. **EPUB Truncation Issue** - RESOLVED via base64 encoding
   - **Root Cause**: Proxy/transport layer was truncating UTF-8 content
   - **Solution**: Base64 encode content in bookmarklet before transmission
   - **Status**: ✅ FIXED - Articles now transmit completely without truncation

2. **EPUB Images Not Working** - Images are not appearing in generated EPUBs despite epub-gen supporting them
   - **Root Cause**: Authentication mismatch - bookmarklet extracts HTML with image URLs from authenticated sites client-side, but server-side epub-gen cannot access auth-protected images
   - **Secondary Issues**: Relative URLs not converted to absolute, hotlink protection on some sites
   - Location: `src/epubGenerator.js`, `public/bookmarklet.js`
   - Impact: EPUBs lack visual content
   - **Status**: Phase 1 completed - relative URLs now converted to absolute

3. **Submodule Sync Workflow** - PR #3 pending review
   - **Issue**: Workflow wants to enable automatic submodule updates with Slack notifications
   - **Concern**: No Slack integration exists in current workflow
   - **Status**: On hold - needs clarification on notification strategy
   - **PR Link**: https://github.com/dgrobinson/article-monster/pull/3

### 🟢 Recently Fixed & Improvements
1. **Enhanced Bibliographic Metadata Extraction** (August 2025)
   - **Improvements Made**:
     - Extended metadata selectors to include Twitter Cards, Dublin Core, Schema.org
     - Added DOM fallbacks for author extraction (class names, itemprop, rel attributes)
     - Added DOM fallbacks for date extraction (time elements, common class patterns)
     - Improved author parsing for Zotero (splits first/last names, handles multiple authors)
   - **Files Updated**: `public/bookmarklet.js`, `src/zoteroSender.js`
   - **Impact**: Better citation quality in Zotero with more complete metadata

2. **EPUB Image URL Fixing** (August 2025)
   - **Problem**: Images not appearing in EPUBs due to relative URLs and auth issues
   - **Solution**: Added `fixImageUrls()` function to bookmarklet that converts relative URLs to absolute
   - **Status**: Phase 1 complete - public site images now work
   - **Files Updated**: `public/bookmarklet.js`
   - **Next**: Phase 2 (base64 embedding for auth sites) if needed

3. **MCP Server Integration Evolution** (August 2025) - PURE FASTMCP BREAKTHROUGH
   - **Custom REST API**: WORKING ✅ - Fully functional for direct API access and Claude
     - **API Key**: `0530bf0ab5c4749e3c867d9cb7e8a5822b7dbc4b74be68c5d1d0eea54f2ce80f` (keep secret)
     - **URL**: https://seal-app-t4vff.ondigitalocean.app/mcp/*
     - **Use Cases**: Direct API access, Claude integration, debugging
   - **FastMCP Python Server**: DEPLOYED ✅ - Pure implementation for ChatGPT
     - **Major Architectural Shift**: Moved from hybrid Node.js+Python to pure FastMCP
     - **URL**: https://seal-app-t4vff.ondigitalocean.app/sse
     - **Key Discovery**: Custom MCP implementations fail ChatGPT validation despite protocol compliance
     - **Solution**: Pure FastMCP eliminates connection abort issues and proxy interference
     - **Implementation**: FastMCP v2.11.3 with zero custom code, running on main port (8080)
     - **Files**: `src/mcpFastMCP.py` (pure FastMCP), `start.sh` (startup script)

4. **Deployment Recovery** (August 2025)
   - **Problem**: Deployment failures after attempted re-architecture changes
   - **Solution**: Reset to last known good commit (3d10c9a) using git reset --hard
   - **Lesson**: Always verify deployment success before continuing development
   - **Recovery Command**: `git reset --hard 3d10c9a && git push --force origin main`

5. **Paragraph Structure Fix** (August 2025)
   - **Problem**: Articles from JSON-LD extraction had paragraphs merged into single blocks
   - **Root Cause**: JSON-LD uses single newlines, but `_textToHtml` was splitting on double newlines
   - **Investigation**: Initially blamed on base64, but was actually JSON-LD extraction issue
   - **Solution**: Modified `_textToHtml` to split on any newline(s) and filter empty results
   - **Files Updated**: `public/bookmarklet.js` (_textToHtml function)
   - **Status**: ✅ FIXED - Proper paragraph separation for all content types

6. **Site-Config Loading Fix** (August 2025)
   - **Problem**: FiveFilters configs weren't being used, JSON-LD took precedence
   - **Root Cause**: Hardcoded configs were commented out, async fetch wasn't blocking
   - **Solution**: Made config fetching synchronous so it actually gets used
   - **Impact**: New Yorker now uses FiveFilters config, includes lead paragraph
   - **Files Updated**: `public/bookmarklet.js` (_extractWithSiteConfig function)
   - **Status**: ✅ FIXED - FiveFilters configs properly loaded and used

7. **Enhanced EPUB TOC Hiding** (August 2025)
   - **Problem**: Unwanted TOC pages showing "1. --" and "2. Article Title" in single-article EPUBs
   - **Investigation**: Comprehensive analysis of epub-gen library limitations and nodepub migration
   - **CSS Solution**: Enhanced selectors targeting all TOC elements with `display: none !important`
   - **CSS Result**: Successfully hides TOC content, leaves blank navigation page (minimal impact)
   - **nodepub Investigation**: Alternative library requires mandatory cover, strict fields, complete API rewrite
   - **Migration Complexity**: nodepub would require significant refactoring with uncertain benefits
   - **Final Decision**: CSS approach is optimal - solves main user problem with minimal risk
   - **Files Updated**: `src/epubGenerator.js` (CSS enhancement)
   - **Status**: Deployed and working - blank page is acceptable vs complex library migration

## Future Enhancement Roadmap

For detailed future improvement plans, see **[METADATA_ROADMAP.md](./METADATA_ROADMAP.md)**

### Upcoming Priorities:
1. **Zotero Translator Integration** (Current Session):
   - Port Zotero's Embedded Metadata.js translator logic
   - Focus on DOI extraction, journal metadata, author parsing
   - Leverage battle-tested, community-maintained extraction
   - Immediate gains for academic and news articles

2. **EPUB Metadata Analysis** (Future Session):
   - Use `epub-metadata-parser` npm package for validation
   - Cross-reference Dublin Core metadata with extracted data
   - Gap detection and quality improvement

3. **Advanced Features** (Long-term):
   - ORCID identifier support
   - Author role detection (Editor, Translator, etc.)
   - Metadata confidence scoring
   - Duplicate prevention

## Referenced Documentation

### Additional Technical Documentation
- **[EPUB Image Fix Implementation Plan](./docs/EPUB_IMAGE_FIX.md)** - Detailed phased approach for fixing EPUB image authentication issues

## Critical Lessons Learned (August 2025)

### EPUB Debugging Methodology
- **Test locally first**: Use `test-epub-generation.js` to verify EPUB generation
- **Compare file sizes**: Production EPUB (11KB) vs Test EPUB (50KB) revealed issue
- **Trace content flow**: Bookmarklet → Server → EPUB generation
- **Check transmission limits**: Express default JSON limit is 100KB
- **Use debug EPUBs**: Save and inspect EPUB contents with AdmZip

### Deployment Must Be Verified
- **Always check deployment logs** after pushing changes
- **If deployment fails**, immediately reset to last known good commit
- **Never continue development** with broken deployments

### Test-Driven Development for Extraction
- **Create test cases first** for problematic articles
- **Use local testing** (`test-extraction.js`) before deploying
- **Move tests to solved/** once extraction is fixed for regression testing

### Extraction Complexity
- **Multi-section articles** require combining multiple containers
- **Related articles** can pollute extraction if selectors are too broad
- **Ending detection** is critical for validating complete extraction

### Critical Debugging Lessons (August 2025)
- **Correlation ≠ Causation**: Base64 implementation coincided with paragraph issues but didn't cause them
- **Track extraction method**: Always log which extraction method was used (site-config, JSON-LD, DOM)
- **Order matters**: Extraction tries site-config → JSON-LD → DOM fallback
- **JSON-LD limitations**: Often missing lead paragraphs or formatting - site configs preferred
- **FiveFilters configs are authoritative**: Never hardcode site-specific logic in our code (including Substack)
- **Embedded diagnostics**: EPUBs now contain hidden metadata (git commit, extraction method, content stats)
- **Test with actual data**: JSON-LD may use single newlines vs double, affecting paragraph splitting

## Auto-Context Reading Instruction

**IMPORTANT**: Every time Claude is launched in this repository, automatically read the following files in this order to understand the full project context:

1. **README.md** - Project overview and features
2. **package.json** - Dependencies and startup configuration  
3. **src/mcpFastMCP.py** - Primary FastMCP server implementation
4. **start.sh** - Current startup approach (FastMCP with Node.js fallback)
5. **Current git status** via `git status` - Working state

This ensures Claude always has complete context about:
- Project purpose and dual-architecture setup
- Current dependencies and startup scripts
- Primary FastMCP implementation vs fallback Node.js
- MCP server capabilities and Zotero integration
- Current working state and recent changes

Do this automatically without being asked, then proceed with user requests.