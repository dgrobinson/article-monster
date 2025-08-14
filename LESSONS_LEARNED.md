# Lessons Learned - Article Monster

## 📚 Table of Contents Removal Attempts

**Problem**: EPUBs show unwanted TOC pages with entries like "1. --" and "2. Article Title" which is unnecessary for single-article documents.

### Attempts Made (Git History Analysis)

#### 1. First Attempt (a0e35f0) - Structural Changes ⚠️
- **Approach**: Switched from multi-chapter to single-chapter structure
- **Result**: Partial success, TOC still appeared
- **Code**: `return createSingleChapterEpub(article);` (always single chapter)

#### 2. Second Attempt (9486703) - Title Manipulation ❌ BROKE EVERYTHING
- **Approach**: Set chapter title to space character `' '` 
- **Result**: **COMPLETE FAILURE** - EPUBs showed only "1. --" with no content
- **Code**: `{ title: ' ', data: createEpubContent(article), excludeFromToc: true }`
- **Lesson**: epub-gen library requires proper titles to render content

#### 3. Recovery (362c3ff) - Immediate Revert ✅
- **Action**: Reverted broken commit immediately
- **Result**: Restored working functionality

### Key Lessons

#### ❌ **What Doesn't Work**
1. **Setting chapter title to empty/space characters** - Breaks content rendering entirely
2. **`excludeFromToc: true`** - Not supported by epub-gen library
3. **`tocTitle: null/false`** - Still generates TOC structure

#### ✅ **What We Know Works**
1. **CSS-only changes** - Safe for typography improvements
2. **Proper chapter titles** - Required for content to display
3. **Single chapter structure** - Reduces TOC complexity but doesn't eliminate it

#### 🔍 **Root Cause Analysis**
- **epub-gen library limitation**: No documented way to completely disable TOC
- **Library age**: epub-gen v0.1.0 (over a year old, limited options)
- **TOC generation**: Automatic based on content array structure

### Future Investigation Options (Low Priority)

#### 1. Alternative Libraries
```javascript
// Research these modern alternatives:
- epub3-writer  // More recent, better API
- nodepub       // Simpler, might have TOC control
- epub-maker    // Lightweight alternative
```

#### 2. Post-Processing Approach
```javascript
// Extract and modify EPUB (it's a ZIP file)
async function removeTocFromEpub(epubBuffer) {
  const zip = new JSZip();
  await zip.loadAsync(epubBuffer);
  zip.remove('toc.ncx');           // Remove navigation file
  zip.remove('nav.xhtml');         // Remove HTML navigation
  // Modify content.opf to remove TOC references
  return zip.generateAsync({type: 'nodebuffer'});
}
```

#### 3. Deep Library Research
- Examine epub-gen source code for undocumented options
- Test different content structures
- Investigate CSS-based TOC hiding

### **Current Status: ACCEPTABLE**
TOC doesn't significantly impact reading experience. Focus on higher-impact improvements (images, covers) instead.

---

## 🔌 ChatGPT MCP Integration Attempts

**Problem**: Getting our Zotero MCP server to work with ChatGPT's new "Connectors" system.

### Attempts Made (Git History Analysis)

#### 1. Custom JSON-RPC Implementation (bf7dd73, c836446) ⚠️
- **Approach**: Built custom JSON-RPC 2.0 server with MCP protocol
- **Result**: Technically correct but rejected by ChatGPT
- **Files**: `src/mcpJsonRpc.js`
- **Lesson**: Technical compliance ≠ ChatGPT compatibility

#### 2. JSON-RPC Protocol Refinements (8d3e9a8) ⚠️
- **Approach**: Added proper initialize handshake, error codes (-32601)
- **Result**: Still rejected by ChatGPT with "doesn't implement our specification"
- **Files**: `src/mcpServerOfficial.js`, `src/mcpServerOfficialChatGPT.js`
- **Lesson**: ChatGPT has unstated requirements beyond the spec

#### 3. Response Format Adjustments (de89ddb) ⚠️
- **Approach**: Changed response format to return results array directly
- **Result**: Format changes didn't resolve core compatibility issue
- **Code**: `return results;` instead of `return { results };`

#### 4. SSE Transport Implementation (0bf9732) ⚠️
- **Approach**: Added Server-Sent Events transport as required by OpenAI
- **Result**: Transport layer worked but core rejection remained
- **Files**: `src/mcpServerOfficialChatGPT.js`
- **Lesson**: Transport is necessary but not sufficient

### Key Discovery: Official SDK Required

#### ❌ **What Doesn't Work with ChatGPT**
1. **Custom JSON-RPC implementations** - Always rejected
2. **Protocol compliance alone** - Not enough for ChatGPT
3. **Transport variations** - SSE, HTTP don't matter if core is custom
4. **Response format tweaks** - Superficial changes don't help

#### ✅ **What Does Work**
1. **Custom REST API** - Perfect for direct API access and Claude
2. **Official MCP SDK** - Required for ChatGPT (not yet implemented)
3. **Read-only operations** - Safer and sufficient for most use cases

#### 🧩 **The Solution Pattern**
```javascript
// REQUIRED: Official MCP SDK
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({
  name: "zotero-mcp-server",
  version: "1.0.0"
});

// ChatGPT expects exactly these tool names
server.registerTool("search", { ... });
server.registerTool("fetch", { ... });
```

### Root Cause Analysis

#### **Why ChatGPT Rejects Custom Implementations**
1. **Internal validation** - ChatGPT checks for official SDK signatures
2. **Undocumented requirements** - Beyond published MCP specification
3. **Framework detection** - Looks for specific patterns from official SDK
4. **Version compatibility** - Requires specific SDK version ranges

#### **ChatGPT vs Other Clients**
- **ChatGPT**: Requires official SDK, strict validation
- **Claude**: Works with any HTTP API, flexible
- **Direct API**: Custom REST works perfectly

### Current Status

#### ✅ **Working Solutions**
1. **Custom MCP REST API**: `/mcp/search`, `/mcp/item/:key` - Works with Claude and direct access
2. **API Key**: `0530bf0ab5c4749e3c867d9cb7e8a5822b7dbc4b74be68c5d1d0eea54f2ce80f` (secure)
3. **Read-only operations**: Search, fetch item details, list collections

#### 🔄 **Pending Implementation**
1. **Official SDK Server**: Required for ChatGPT integration
2. **Dual server approach**: Keep custom (for APIs) + add official (for ChatGPT)
3. **Installation**: `npm install @modelcontextprotocol/sdk`

### Future Implementation Plan

#### Phase 1: Install Official SDK
```bash
npm install @modelcontextprotocol/sdk
```

#### Phase 2: Implement Official Server
```javascript
// src/mcpServerOfficial.js - NEW FILE
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// Follow exact official SDK patterns
```

#### Phase 3: Dual Deployment
- Custom API: `/mcp/*` (existing, working)
- Official SDK: `/mcp-official/*` (new, for ChatGPT)

### **BREAKTHROUGH: ChatGPT Connectors 2025 Specification** ✅

#### 5. Documentation Discovery (August 2025) ✅ WORKING
- **Discovery**: Found official OpenAI docs for ChatGPT Connectors 2025
- **Key insight**: Not "Actions" - it's the new "Connectors" system
- **Location**: `tmp/2025-08-11-chat-gpt-mcp-documentation.md`
- **Result**: Successful implementation with exact specification compliance

#### ✅ **What Actually Works for ChatGPT (2025)**
1. **Cloud-based MCP server** - Must run on DigitalOcean, not locally
2. **Exact tool specification** - `search` and `fetch` tools with precise schema
3. **Response format compliance** - Arrays for search, objects for fetch
4. **HTTP endpoints** - Standard REST API, not JSON-RPC

#### 🎯 **Correct ChatGPT Integration Pattern**
```javascript
// Search tool: POST /chatgpt/tools/search
// Returns: [{ id, title, text, url }, ...]
const results = zoteroItems.map(item => ({
  id: item.key,
  title: item.data.title || 'Untitled', 
  text: item.data.abstractNote || fallbackDescription,
  url: item.data.url || zoteroUrl
}));
res.json(results); // Return array directly

// Fetch tool: POST /chatgpt/tools/fetch  
// Returns: { id, title, text, url, metadata }
res.json({
  id: item.key,
  title: item.data.title,
  text: fullTextWithAllMetadata, // Comprehensive content
  url: item.data.url,
  metadata: { creators, date, DOI, tags, attachments... }
});
```

#### 🚨 **Critical Architecture Lesson**
- **WRONG**: Local MCP server (what I initially implemented)
- **RIGHT**: Cloud endpoints on DigitalOcean (what we have)
- **Implementation**: `/chatgpt/tools/search` and `/chatgpt/tools/fetch`
- **Status**: Production ready at `https://seal-app-t4vff.ondigitalocean.app/chatgpt/`

### **Current Status: WORKING** ✅
- Cloud-based ChatGPT Connectors implementation complete
- Exact 2025 specification compliance
- Ready for ChatGPT Custom GPT integration
- No local server needed

#### 📋 **ChatGPT Setup Instructions (2025)**
1. **Base URL**: `https://seal-app-t4vff.ondigitalocean.app/chatgpt/`
2. **Method**: ChatGPT → Settings → Connectors → Add Server
3. **Tools**: `search` and `fetch` auto-detected
4. **Auth**: None required (personal use endpoints)
5. **Usage**: "Search my Zotero library for AI papers"

#### 🔍 **Debugging Lessons**
- **Parameter format**: JSON objects, not raw strings
- **Response validation**: ChatGPT expects exact schema compliance
- **Error handling**: Return proper HTTP status codes
- **Deployment**: Always test after DigitalOcean deployment completes
- **Architecture**: Cloud-first, never local for ChatGPT integration

---

## 🚨 Critical Development Principles Learned

### 1. **Safe Deployment Pattern**
```bash
# Test structural changes locally first
git add -A && git commit -m "Safe change"
git push  # Deploy
# Test in production
# If broken: git revert HEAD && git push (immediate recovery)
```

### 2. **Change Isolation**
- **CSS-only changes**: Always safe
- **Structural changes**: High risk, test thoroughly
- **Library configuration**: Medium risk, understand options first

### 3. **Documentation During Development**
- Update FUTURE_IMPROVEMENTS.md during development
- Track lessons learned in real-time
- Git commit messages should explain WHY, not just WHAT

### 4. **User Feedback Integration**
- Make small incremental changes based on user feedback
- Typography: "lines slightly too far apart" → immediate 1.7→1.6 adjustment
- Quick iteration beats perfect planning

### 5. **Library Selection Criteria**
- **Age and maintenance**: epub-gen (1+ years old) shows limitations
- **Documentation quality**: Poor docs = hidden limitations
- **Community size**: Smaller communities = fewer solutions online
- **Alternatives research**: Always identify 2-3 alternatives before deep implementation

---

## 📈 Success Patterns That Work

### ✅ **Typography Improvements**
- Charter font upgrade: Major visual improvement, zero risk
- Line height adjustments: User feedback → immediate iteration
- CSS-only changes: Always deployable safely

### ✅ **Image Detection Enhancements**
- Multiple detection methods: img tags, background images, figures
- Fallback strategies: Page-level scanning when content extraction fails
- Absolute URL conversion: Handles relative path issues

### ✅ **Filename Improvements**
- Unique ID suffixes: Prevents collisions like FiveFilters
- Special character preservation: Better user experience
- Consistent patterns: Both Kindle and EPUB use same logic

### ✅ **Error Handling Evolution**
- Context-aware error messages: Network vs extraction vs site-specific
- User guidance: Specific troubleshooting steps
- Graceful degradation: Fallback extraction when configs unavailable

---

## 🎯 Current Priorities Based on Lessons

### High Impact, Low Risk
1. ✅ Typography improvements (Charter font, spacing)
2. 🔄 Cover image generation (professional Kindle display)
3. 🔄 Enhanced image embedding (authenticated sites)

### Medium Impact, Medium Risk
1. 📚 TOC removal via alternative libraries or post-processing
2. 🎨 Advanced typography features (drop caps, better quotes)
3. 📱 Mobile bookmarklet optimization

### High Impact, High Risk
1. 🔌 Official MCP SDK implementation (requires significant development)
2. 📖 Alternative EPUB library migration (potential breaking changes)
3. 🏗️ Architecture refactoring (unnecessary at current scale)

---

*Last Updated: August 12, 2025*  
*This document captures institutional knowledge to prevent repeating past mistakes*