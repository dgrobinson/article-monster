# MCP Server Setup Guide for AI Assistants

## 🎉 MCP Server Status: WORKING!

The MCP (Model Context Protocol) server is now live and fully functional at:
**https://seal-app-t4vff.ondigitalocean.app**

## API Key
Your MCP API Key: `0530bf0ab5c4749e3c867d9cb7e8a5822b7dbc4b74be68c5d1d0eea54f2ce80f`

**⚠️ Keep this secret! Only share with your trusted AI assistants.**

## Available Endpoints

### 1. Search Your Zotero Library
**Endpoint:** `POST /mcp/search`
**Purpose:** Search across all items in your Zotero library

**Example Request:**
```bash
curl -X POST https://seal-app-t4vff.ondigitalocean.app/mcp/search \
  -H "Authorization: Bearer 0530bf0ab5c4749e3c867d9cb7e8a5822b7dbc4b74be68c5d1d0eea54f2ce80f" \
  -H "Content-Type: application/json" \
  -d '{"query": "climate change", "limit": 10}'
```

**Response:** Returns matching items with title, authors, date, abstract, tags, and collections.

### 2. Get Item Details
**Endpoint:** `GET /mcp/item/{key}`
**Purpose:** Get full details of a specific item including attachments and notes

**Example Request:**
```bash
curl https://seal-app-t4vff.ondigitalocean.app/mcp/item/NTKVD7M7 \
  -H "Authorization: Bearer 0530bf0ab5c4749e3c867d9cb7e8a5822b7dbc4b74be68c5d1d0eea54f2ce80f"
```

**Response:** Complete item metadata, attachments (including EPUBs), and notes.

### 3. List Collections
**Endpoint:** `GET /mcp/collections`
**Purpose:** Browse your Zotero collections
*(Note: Currently experiencing a 400 error, needs debugging)*

### 4. List Items with Pagination
**Endpoint:** `GET /mcp/items`
**Purpose:** Browse items with pagination support

**Parameters:**
- `limit` - Number of items (max 50)
- `start` - Starting position for pagination
- `collection` - Filter by collection key
- `sort` - Sort field (dateModified, title, etc.)
- `direction` - asc or desc

### 5. Add New Item
**Endpoint:** `POST /mcp/item`
**Purpose:** Add new references to your Zotero library
**⚠️ Use carefully - this modifies your library!**

## AI Assistant Setup

### For ChatGPT (Connectors - 2025)

**✅ UPDATED FOR 2025 - Now uses MCP (Model Context Protocol)**

1. Go to ChatGPT Settings → Connectors
2. Click "Add custom connector" 
3. Enter the MCP server URL: `https://seal-app-t4vff.ondigitalocean.app/chatgpt`
4. Authentication: "No authentication" (personal use)
5. The connector will auto-discover the required `search` and `fetch` tools

**MCP Endpoints Available:**
- **Metadata**: `/mcp/metadata` - Tool discovery
- **Search Tool**: `/tools/search` - Search your library  
- **Fetch Tool**: `/tools/fetch` - Get item details

**No OpenAPI schema needed** - MCP handles tool discovery automatically.

### For Claude Desktop

1. Open Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add this MCP server configuration:

```json
{
  "mcpServers": {
    "zotero": {
      "command": "node",
      "args": ["-e", "console.log('MCP Server not needed - using HTTP API')"],
      "env": {
        "ZOTERO_API_URL": "https://seal-app-t4vff.ondigitalocean.app/mcp",
        "ZOTERO_API_KEY": "0530bf0ab5c4749e3c867d9cb7e8a5822b7dbc4b74be68c5d1d0eea54f2ce80f"
      }
    }
  }
}
```

*Note: Claude Desktop typically uses local MCP servers, so you may need to create a wrapper script that calls our HTTP API.*

## Tested Features ✅

- ✅ **Authentication**: Bearer token working perfectly
- ✅ **Health Check**: Service is online and responsive  
- ✅ **Search**: Full-text search across your library working
- ✅ **Item Details**: Retrieving complete item metadata with attachments
- ✅ **EPUB Attachments**: Shows EPUB files created by the bookmarklet
- ✅ **Security**: API key authentication protecting your data

## Known Issues ⚠️

- ❌ **Collections Endpoint**: Returns 400 error, needs debugging
- ❌ **Add Item Endpoint**: Currently failing with "Item creation failed" 
  - May be Zotero API key permissions issue
  - Needs debugging of request format
  - Read-only operations work perfectly

## Usage Examples

### Search for Climate Research
"Search my Zotero library for articles about climate change and carbon pricing"

### Get Paper Details  
"Get the full details of this research paper [provide item key from search]"

### Browse Recent Items
"Show me the 10 most recently added items in my library"

## Security Notes

- Your API key provides full access to your Zotero library
- Only share with trusted AI assistants
- Monitor usage through Zotero web interface
- Can regenerate API key anytime if compromised

## Troubleshooting

1. **401 Unauthorized**: Check API key is correct
2. **404 Not Found**: Verify item key exists
3. **500 Server Error**: Check Zotero API limits
4. **Rate Limits**: Zotero has API rate limits - requests may be queued

---

**Status**: Production ready! 🚀  
**Last Updated**: August 11, 2025  
**Service URL**: https://seal-app-t4vff.ondigitalocean.app