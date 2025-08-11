const express = require('express');
const axios = require('axios');

const mcpChatGPTRouter = express.Router();

// Base Zotero API configuration
function getZoteroConfig() {
  const userId = process.env.ZOTERO_USER_ID;
  const apiKey = process.env.ZOTERO_API_KEY;

  if (!userId || !apiKey) {
    throw new Error('Zotero credentials not configured');
  }

  return {
    baseUrl: `https://api.zotero.org/users/${userId}`,
    headers: {
      'Zotero-API-Key': apiKey,
      'Content-Type': 'application/json'
    }
  };
}

// MCP Tools Implementation - Required for ChatGPT Connectors 2025

// Required Tool 1: search
mcpChatGPTRouter.post('/tools/search', async (req, res) => {
  try {
    const { query, limit = 25 } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        error: 'Search query required',
        tool: 'search'
      });
    }

    console.log(`MCP ChatGPT Search: "${query}"`);
    const config = getZoteroConfig();

    // Search Zotero library
    const response = await axios.get(`${config.baseUrl}/items`, {
      headers: config.headers,
      params: {
        q: query,
        limit: Math.min(limit, 50),
        sort: 'dateModified',
        direction: 'desc'
      }
    });

    // Format for MCP response
    const items = response.data.map(item => ({
      key: item.key,
      type: item.data.itemType,
      title: item.data.title || 'Untitled',
      creators: item.data.creators || [],
      date: item.data.date,
      url: item.data.url,
      abstract: item.data.abstractNote,
      tags: item.data.tags || [],
      collections: item.data.collections || [],
      // MCP-specific metadata
      _mcpId: item.key,
      _mcpType: 'zotero_item'
    }));

    res.json({
      tool: 'search',
      query,
      results: items,
      count: items.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('MCP search error:', error.message);
    res.status(500).json({ 
      error: 'Search failed',
      tool: 'search',
      message: error.response?.data?.message || error.message 
    });
  }
});

// Required Tool 2: fetch
mcpChatGPTRouter.post('/tools/fetch', async (req, res) => {
  try {
    const { identifier, type } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ 
        error: 'Resource identifier required',
        tool: 'fetch'
      });
    }

    console.log(`MCP ChatGPT Fetch: ${identifier} (type: ${type || 'auto'})`);
    const config = getZoteroConfig();
    
    // Fetch specific Zotero item
    const response = await axios.get(`${config.baseUrl}/items/${identifier}`, {
      headers: config.headers
    });

    // Get children (attachments, notes)
    const childrenResponse = await axios.get(`${config.baseUrl}/items/${identifier}/children`, {
      headers: config.headers
    });

    const item = response.data;
    const children = childrenResponse.data;

    // Format detailed MCP response
    res.json({
      tool: 'fetch',
      identifier,
      resource: {
        key: item.key,
        version: item.version,
        data: item.data,
        attachments: children.filter(c => c.data.itemType === 'attachment').map(a => ({
          key: a.key,
          title: a.data.title,
          contentType: a.data.contentType,
          filename: a.data.filename,
          url: a.data.url
        })),
        notes: children.filter(c => c.data.itemType === 'note').map(n => ({
          key: n.key,
          note: n.data.note
        })),
        meta: {
          created: item.data.dateAdded,
          modified: item.data.dateModified,
          library: item.library,
          _mcpId: item.key,
          _mcpType: 'zotero_item_detailed'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('MCP fetch error:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Resource not found',
        tool: 'fetch',
        identifier 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch resource',
      tool: 'fetch',
      message: error.message 
    });
  }
});

// MCP Metadata endpoint - describes available tools
mcpChatGPTRouter.get('/mcp/metadata', (req, res) => {
  res.json({
    name: 'Personal Zotero Library Access',
    version: '1.0.0',
    description: 'MCP-compliant access to your personal Zotero research library',
    protocol: 'mcp',
    capabilities: {
      tools: [
        {
          name: 'search',
          description: 'Search across all items in your Zotero library',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search terms (title, author, keywords, etc.)'
              },
              limit: {
                type: 'integer',
                default: 25,
                maximum: 50,
                description: 'Maximum number of results'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'fetch',
          description: 'Fetch detailed information about a specific library item',
          inputSchema: {
            type: 'object',
            properties: {
              identifier: {
                type: 'string',
                description: 'Item key/ID from search results'
              },
              type: {
                type: 'string',
                description: 'Resource type (optional)',
                default: 'zotero_item'
              }
            },
            required: ['identifier']
          }
        }
      ]
    },
    authentication: 'none',
    endpoints: {
      search: '/tools/search',
      fetch: '/tools/fetch',
      metadata: '/mcp/metadata'
    },
    server: {
      name: 'Article Monster Zotero MCP',
      version: '1.0.0'
    }
  });
});

// Health check for MCP ChatGPT
mcpChatGPTRouter.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'MCP ChatGPT Zotero Integration',
    protocol: 'mcp',
    authentication: 'none',
    tools: ['search', 'fetch'],
    timestamp: new Date().toISOString()
  });
});

module.exports = mcpChatGPTRouter;