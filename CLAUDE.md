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

## Current Known Issues (August 2025)

### 🔴 High Priority
1. **EPUB Images Not Working** - Images are not appearing in generated EPUBs despite epub-gen supporting them
   - **Root Cause**: Authentication mismatch - bookmarklet extracts HTML with image URLs from authenticated sites client-side, but server-side epub-gen cannot access auth-protected images
   - **Secondary Issues**: Relative URLs not converted to absolute, hotlink protection on some sites
   - Location: `src/epubGenerator.js`, `public/bookmarklet.js`
   - Impact: EPUBs lack visual content
   - **Fix Plan**: See "EPUB Image Fix Implementation Plan" below
   - **Status**: Phase 1 completed - relative URLs now converted to absolute

2. **Kindle Filename Formatting** - ~~Article titles appear as "ALL_CAPS_WITH_UNDERSCORES" instead of clean formatting~~
   - **FIXED**: Now uses proper capitalization with hyphens (e.g., "The-Atlantic-Article-Title.epub")
   - Location: `src/kindleSender.js`, `src/epubGenerator.js`

### 🟢 Recently Fixed
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

3. **MCP Server Implementation** (August 2025)
   - **Status**: WORKING - MCP server is fully functional and tested
   - **API Key**: `0530bf0ab5c4749e3c867d9cb7e8a5822b7dbc4b74be68c5d1d0eea54f2ce80f` (keep secret)
   - **Tested Endpoints**: Health ✅, Search ✅, Item Details ✅
   - **Known Issue**: Collections endpoint returns 400 error (needs debugging)
   - **Files**: `src/mcpServer.js`, `MCP_SETUP_GUIDE.md`
   - **URL**: https://seal-app-t4vff.ondigitalocean.app/mcp/*
   - **Next**: Set up with ChatGPT/Claude AI assistants

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

## EPUB Image Fix Implementation Plan

### Problem Analysis
The core issue is an authentication mismatch between client-side extraction and server-side EPUB generation:
- **Client-side** (bookmarklet): Has full access to authenticated images via browser cookies
- **Server-side** (epub-gen): Cannot access auth-protected images when generating EPUB

### Phased Implementation Approach

#### Phase 1: URL Fixing (Immediate - 5 min fix)
**Goal**: Fix relative URLs to ensure public images work correctly

**Implementation**:
```javascript
// Add to bookmarklet.js after article extraction
function fixImageUrls(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  const baseUrl = window.location.origin;
  
  div.querySelectorAll('img').forEach(img => {
    // Fix relative URLs to absolute
    if (!img.src.startsWith('http')) {
      img.src = new URL(img.src, baseUrl).href;
    }
    // Also fix srcset for responsive images
    if (img.srcset) {
      img.srcset = img.srcset.split(',').map(src => {
        const [url, descriptor] = src.trim().split(' ');
        if (!url.startsWith('http')) {
          return new URL(url, baseUrl).href + (descriptor ? ' ' + descriptor : '');
        }
        return src;
      }).join(', ');
    }
  });
  
  return div.innerHTML;
}
```

**Benefits**:
- Fixes all public site images immediately
- No performance impact
- No payload size increase

#### Phase 2: Critical Image Embedding (If Phase 1 insufficient)
**Goal**: Embed important images as base64 to preserve authenticated content

**Implementation**:
```javascript
// Add to bookmarklet.js
async function embedCriticalImages(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  const images = div.querySelectorAll('img');
  
  // Only process first 3 images between 50KB-500KB
  let processedCount = 0;
  for (let img of images) {
    if (processedCount >= 3) break;
    
    try {
      const response = await fetch(img.src);
      const blob = await response.blob();
      
      // Skip tiny images (icons) and huge images (performance)
      if (blob.size < 50000 || blob.size > 500000) continue;
      
      const reader = new FileReader();
      const base64 = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      
      img.src = base64;
      processedCount++;
    } catch (e) {
      console.warn('Failed to embed image:', img.src);
    }
  }
  
  return div.innerHTML;
}
```

**Benefits**:
- Preserves key images from authenticated sites
- Limited to 3 images to maintain performance
- Smart filtering avoids tracking pixels and huge files
- Graceful fallback for remaining images

#### Phase 3: Monitoring & Optimization (Optional future enhancement)
**Goal**: Track success rates and optimize thresholds

**Potential Enhancements**:
- Add telemetry for image success/failure rates
- Adjust size thresholds based on real usage
- Consider WebP conversion for smaller sizes
- Add user preference for image quality/quantity tradeoff

### Implementation Steps

1. **Test Current State** (5 min)
   - Test with WSJ/Atlantic article to confirm images missing
   - Check browser console for image URLs in extracted content

2. **Implement Phase 1** (10 min)
   - Add `fixImageUrls` function to bookmarklet
   - Call it on extracted content before sending to server
   - Deploy and test with public sites (BBC, NPR, etc.)

3. **Evaluate Phase 1 Results** (10 min)
   - Test with various sites
   - Document which sites now work
   - Identify if auth sites still need Phase 2

4. **Implement Phase 2 if Needed** (20 min)
   - Add `embedCriticalImages` function
   - Integrate with extraction flow
   - Test payload sizes and performance

5. **Production Deployment** (5 min)
   - Push to GitHub
   - Auto-deploy to DigitalOcean
   - Test in production environment

### Success Criteria
- ✅ Public site images appear in EPUBs
- ✅ At least hero/primary images from auth sites preserved
- ✅ No significant performance degradation
- ✅ Payload size remains under 10MB for typical articles

### Alternative Approaches Considered (Not Recommended)
1. **Cookie Forwarding**: Security risk, complex implementation
2. **Server-side Proxy**: Doesn't solve auth problem
3. **Full Base64 Conversion**: Too large payloads, memory issues
4. **Separate Image Upload**: Too complex for bookmarklet

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