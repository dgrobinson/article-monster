# MCP Integration Plan for Zotero Access

## 🚨 CRITICAL UPDATE (August 2025): Official SDK Required for ChatGPT

**BREAKING DISCOVERY**: ChatGPT Connectors require servers built with official MCP frameworks, NOT custom JSON-RPC implementations.

## Current Status
- ✅ **Custom MCP Server**: Implemented but rejected by ChatGPT ("doesn't implement our specification")
- ✅ **REST API**: Working perfectly for direct API access
- 🔄 **Official SDK Rewrite**: Required for ChatGPT compatibility

## Architecture Decision - UPDATED
We're using **Option 1: Single DigitalOcean App** containing:
- Article Bookmarklet Service (existing) ✅
- Zotero MCP Server (custom implementation) ✅ - works for direct API access
- **NEW**: Official MCP SDK Server (pending) - required for ChatGPT integration

## Key Design Decisions - REVISED

### 1. Dual Implementation Strategy (Updated Aug 2025)
- **Keep existing custom MCP server** at `/mcp/*` for direct API access
- **Add official SDK MCP server** at `/mcp-official/*` for ChatGPT integration
- **Reasoning**: Custom server works great for APIs, official SDK needed for ChatGPT

### 2. MCP Implementation - Two Approaches

#### A) Custom REST API (WORKING)
```javascript
// Current working endpoints
POST /mcp/search         - Search Zotero library ✅
GET  /mcp/item/:key      - Get specific item details ✅  
GET  /mcp/collections    - List all collections ⚠️ (needs debugging)
POST /mcp/item           - Add new item ⚠️ (needs debugging)
GET  /mcp/items          - List items with pagination ✅
```

#### B) Official SDK (REQUIRED FOR CHATGPT)
```typescript
// Official MCP SDK approach - REQUIRED
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

server.registerTool("search", {
  description: "Search Zotero library",
  inputSchema: { query: string, limit?: number }
}, async ({ query, limit }) => ({
  content: [{ 
    type: "text", 
    text: JSON.stringify({ results: [...] }) // Must match OpenAI format
  }]
}));
```

### 3. Authentication Strategy
- Simple Bearer token authentication
- Single API key in environment: `MCP_API_KEY`
- All MCP endpoints require: `Authorization: Bearer <token>`

### 4. Shared Zotero Client
- Reuse existing Zotero configuration from bookmarklet
- Same API key and User ID
- Benefit: Single source of truth for Zotero access

## Implementation Sequence - UPDATED (August 2025)

### Phase 1: COMPLETED ✅
1. ✅ Create comprehensive docs (this file)
2. ✅ Custom MCP server implementation (`src/mcpServer.js`)
3. ✅ Custom JSON-RPC implementation (`src/mcpJsonRpc.js`) 
4. ✅ Authentication middleware
5. ✅ Search functionality (read-only, safe)

### Phase 2: DISCOVERY & DEBUGGING ✅
1. ✅ Tested with ChatGPT - discovered incompatibility
2. ✅ Found custom implementations rejected by ChatGPT
3. ✅ Researched official MCP SDK requirement
4. ✅ Updated documentation with findings

### Phase 3: OFFICIAL SDK IMPLEMENTATION (CURRENT)
1. 🔄 Install `@modelcontextprotocol/sdk` (v1.17.2)
2. 🔄 Create `src/mcpServerOfficial.js` with official SDK
3. 🔄 Implement required `search` and `fetch` tools
4. 🔄 Set up HTTP transport for ChatGPT compatibility
5. 🔄 Test with ChatGPT Connectors

### Phase 4: PRODUCTION DEPLOYMENT
1. 🔄 Deploy official SDK server alongside custom server
2. 🔄 Update ChatGPT connector URL to official endpoint
3. 🔄 Monitor performance and compatibility
4. 🔄 Document final integration steps

## Technical Details - UPDATED

### Official SDK Requirements (CRITICAL)
Based on August 2025 research and testing:

#### Required Dependencies
```bash
npm install @modelcontextprotocol/sdk
# Requires Node.js 18+
```

#### Official SDK Server Structure
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "zotero-mcp-server", 
  version: "1.0.0"
});

// REQUIRED: ChatGPT expects exactly these tool names
server.registerTool("search", {...});
server.registerTool("fetch", {...});
```

#### Transport Options for ChatGPT
1. **HTTP Transport** (recommended for cloud deployment)
2. **SSE Transport** (legacy, being phased out)
3. **Stdio Transport** (local only)

### Environment Variables - CURRENT
```
# Existing (working for custom API)
MCP_API_KEY=0530bf0ab5c4749e3c867d9cb7e8a5822b7dbc4b74be68c5d1d0eea54f2ce80f

# Additional for official SDK
MCP_RATE_LIMIT=100  # requests per minute  
MCP_MAX_RESULTS=50  # max items per search
```

### Security Considerations
1. **Read vs Write**: Start with read-only operations
2. **Rate Limiting**: Implement per-IP rate limiting
3. **Query Validation**: Sanitize all search inputs
4. **Audit Logging**: Log all MCP operations

### ChatGPT Integration - UPDATED
**2025 Update: ChatGPT now uses "Connectors" (not "Actions")**
- ❌ **Custom JSON-RPC**: Rejected with "doesn't implement our specification"
- ✅ **Official SDK Required**: Must use `@modelcontextprotocol/sdk`
- ✅ **Tool Names**: Must implement exactly `search` and `fetch` tools
- ✅ **Response Format**: Must match OpenAI specification exactly

### Claude Integration - WORKING
- ✅ **Custom API**: Works perfectly with existing `/mcp/*` endpoints
- ✅ **Direct HTTP**: Claude can use REST API directly
- 🔄 **Official SDK**: May also work with official SDK (untested)

## Testing Approach

### Local Testing
1. Test MCP endpoints with curl
2. Mock ChatGPT/Claude requests
3. Verify Zotero API interactions

### Production Testing
1. Deploy with MCP disabled initially
2. Enable for specific IP only
3. Test with real AI assistants
4. Monitor logs carefully

## Error Handling Strategy
- Never expose Zotero API errors directly
- Implement graceful degradation
- Return helpful error messages for AI assistants

## Performance Considerations
- Cache frequently accessed collections
- Implement pagination for large libraries
- Consider Redis for session management later

## Important Notes for Future Development

### Current State (August 2025)
1. ✅ **Bookmarklet Service**: Fully operational
2. ✅ **Custom MCP Server**: Working for direct API access
3. ✅ **Custom JSON-RPC**: Implemented but incompatible with ChatGPT
4. 🔄 **Official SDK Server**: Required for ChatGPT, implementation pending

### Critical Discoveries
1. **ChatGPT Compatibility**: ONLY official MCP SDK works with ChatGPT Connectors
2. **Dual Implementation**: Need both custom (for APIs) and official (for ChatGPT)
3. **Tool Naming**: ChatGPT expects exactly `search` and `fetch` tools
4. **Transport**: HTTP transport recommended for cloud deployment

### Deployment URLs
- **Custom API**: `https://seal-app-t4vff.ondigitalocean.app/mcp/*`
- **Custom JSON-RPC**: `https://seal-app-t4vff.ondigitalocean.app/mcp-jsonrpc/sse`
- **Official SDK** (pending): `https://seal-app-t4vff.ondigitalocean.app/mcp-official/*`

## Next Steps - CURRENT PRIORITY
1. 🔄 Install `@modelcontextprotocol/sdk` package
2. 🔄 Implement official SDK server in `src/mcpServerOfficial.js`
3. 🔄 Test with ChatGPT Connectors
4. 🔄 Update production deployment

## Files to Review
- `src/mcpServer.js` - Custom REST API implementation (working)
- `src/mcpJsonRpc.js` - Custom JSON-RPC implementation (ChatGPT incompatible)  
- `MCP_SETUP_GUIDE.md` - Setup instructions and API documentation

---
*This document tracks the complete MCP integration journey*
*Original: Claude 3 Opus | Updated: Claude 3.5 Sonnet 4*
*Last Update: August 11, 2025*