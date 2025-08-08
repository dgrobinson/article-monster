# MCP Integration Plan for Zotero Access

## Overview
This document captures the complete plan for integrating MCP (Model Context Protocol) server functionality into the Article Bookmarklet Service, enabling ChatGPT and Claude to access your Zotero library from anywhere.

## Architecture Decision
We're using **Option 1: Single DigitalOcean App** containing both:
- Article Bookmarklet Service (existing)
- Zotero MCP Server (new)

## Key Design Decisions (Important for Sonnet)

### 1. Code Adaptation Strategy
- **NOT cloning** the zotero-mcp repo directly
- **Adapting** the core functionality into our Express server
- **Reasoning**: Better integration, shared Zotero client, single deployment

### 2. MCP Implementation Approach
Based on https://github.com/54yyyu/zotero-mcp, we need to implement:

```javascript
// MCP endpoints to implement
POST /mcp/search         - Search Zotero library
GET  /mcp/item/:key      - Get specific item details  
GET  /mcp/collections    - List all collections
POST /mcp/item           - Add new item (careful!)
GET  /mcp/items          - List items with pagination
```

### 3. Authentication Strategy
- Simple Bearer token authentication
- Single API key in environment: `MCP_API_KEY`
- All MCP endpoints require: `Authorization: Bearer <token>`

### 4. Shared Zotero Client
- Reuse existing Zotero configuration from bookmarklet
- Same API key and User ID
- Benefit: Single source of truth for Zotero access

## Implementation Sequence (Critical for Sonnet)

### Phase 1: Documentation and Structure
1. Create comprehensive docs (this file)
2. Update README with MCP section
3. Design unified API structure

### Phase 2: MCP Core Implementation
1. Create `src/mcpServer.js` with MCP endpoints
2. Add authentication middleware
3. Implement search functionality first (read-only, safe)
4. Test thoroughly before write operations

### Phase 3: Integration Points
1. Modify `src/server.js` to include MCP routes
2. Share Zotero client between bookmarklet and MCP
3. Add MCP-specific error handling

### Phase 4: Testing Strategy
1. Test search endpoint with various queries
2. Verify authentication works correctly
3. Test with actual ChatGPT/Claude connections
4. Monitor rate limits and performance

## Technical Details for Implementation

### MCP Server Specifics
The original zotero-mcp uses the official MCP SDK. For our cloud deployment:
- Implement MCP protocol over HTTP/REST
- Format responses to match MCP expectations
- Handle streaming responses for large result sets

### Environment Variables to Add
```
# MCP Configuration
MCP_API_KEY=generated-secure-token-here
MCP_RATE_LIMIT=100  # requests per minute
MCP_MAX_RESULTS=50  # max items per search
```

### Security Considerations
1. **Read vs Write**: Start with read-only operations
2. **Rate Limiting**: Implement per-IP rate limiting
3. **Query Validation**: Sanitize all search inputs
4. **Audit Logging**: Log all MCP operations

### ChatGPT Integration
- ChatGPT will use "Actions" with our API
- Provide OpenAPI schema for easy setup
- Test with ChatGPT's new Projects feature

### Claude Integration  
- Claude Desktop uses standard MCP
- May need slight response format adjustments
- Test with both Claude.ai and Claude Desktop

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

## Important Notes for Sonnet

1. **Current State**: As of this writing, only the bookmarklet service exists
2. **Dependencies**: The MCP implementation depends on the existing Zotero client
3. **Testing Critical**: Each MCP endpoint must be tested thoroughly before enabling
4. **Security First**: Start with read-only operations, add write operations carefully

## Next Steps
1. Implement basic MCP structure
2. Add search endpoint
3. Test with ChatGPT
4. Add remaining endpoints incrementally
5. Deploy to production

---
*This document created by Claude 3 Opus for Claude 3.5 Sonnet handoff*
*Date: August 2025*