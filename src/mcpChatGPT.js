const express = require('express');
const axios = require('axios');
const WebSocket = require('ws');

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
    console.log('=== ChatGPT SEARCH REQUEST ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('IP:', req.ip || req.connection.remoteAddress);
    console.log('User-Agent:', req.get('User-Agent'));
    
    const { query, limit = 25 } = req.body;
    
    if (!query) {
      console.log('ERROR: Missing query parameter');
      return res.status(400).json({ 
        error: 'Search query required',
        tool: 'search'
      });
    }

    console.log(`MCP ChatGPT Search: "${query}" (limit: ${limit})`);
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

    // Format for ChatGPT Connectors - exact specification
    const results = response.data.map(item => ({
      id: item.key,
      title: item.data.title || 'Untitled',
      text: item.data.abstractNote || `${item.data.itemType} by ${item.data.creators?.map(c => `${c.firstName} ${c.lastName}`).join(', ') || 'Unknown'} (${item.data.date || 'No date'})`,
      url: item.data.url || `https://www.zotero.org/dgrobinson/items/${item.key}`
    }));

    // Return array as per ChatGPT Connectors specification
    console.log(`Search complete: returning ${results.length} results`);
    console.log('Response:', JSON.stringify(results.slice(0, 2), null, 2)); // Log first 2 results
    res.json(results);

  } catch (error) {
    console.error('=== ChatGPT SEARCH ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
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
    console.log('=== ChatGPT FETCH REQUEST ===');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('IP:', req.ip || req.connection.remoteAddress);
    
    const { id: identifier } = req.body;
    
    if (!identifier) {
      console.log('ERROR: Missing id parameter');
      return res.status(400).json({ 
        error: 'Resource id required',
        tool: 'fetch'
      });
    }

    console.log(`MCP ChatGPT Fetch: ${identifier}`);
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

    // Format for ChatGPT Connectors - exact specification
    const attachments = children.filter(c => c.data.itemType === 'attachment');
    const notes = children.filter(c => c.data.itemType === 'note');
    
    // Build comprehensive text content
    let fullText = `Title: ${item.data.title || 'Untitled'}\n\n`;
    
    if (item.data.creators?.length) {
      fullText += `Authors: ${item.data.creators.map(c => `${c.firstName} ${c.lastName}`).join(', ')}\n\n`;
    }
    
    if (item.data.date) {
      fullText += `Date: ${item.data.date}\n\n`;
    }
    
    if (item.data.abstractNote) {
      fullText += `Abstract: ${item.data.abstractNote}\n\n`;
    }
    
    if (item.data.DOI) {
      fullText += `DOI: ${item.data.DOI}\n\n`;
    }
    
    if (item.data.tags?.length) {
      fullText += `Tags: ${item.data.tags.map(t => t.tag).join(', ')}\n\n`;
    }
    
    if (attachments.length) {
      fullText += `Attachments: ${attachments.map(a => a.data.title).join(', ')}\n\n`;
    }
    
    if (notes.length) {
      fullText += `Notes:\n${notes.map(n => n.data.note).join('\n\n')}\n\n`;
    }

    // Return single object as per ChatGPT Connectors specification
    const result = {
      id: item.key,
      title: item.data.title || 'Untitled',
      text: fullText.trim(),
      url: item.data.url || `https://www.zotero.org/dgrobinson/items/${item.key}`,
      metadata: {
        itemType: item.data.itemType,
        creators: item.data.creators || [],
        date: item.data.date,
        DOI: item.data.DOI,
        tags: item.data.tags || [],
        attachmentCount: attachments.length,
        noteCount: notes.length,
        dateAdded: item.data.dateAdded,
        dateModified: item.data.dateModified
      }
    };
    
    console.log('Fetch complete: returning item details');
    console.log('Result preview:', JSON.stringify({
      id: result.id,
      title: result.title,
      textLength: result.text.length,
      url: result.url
    }, null, 2));
    
    res.json(result);

  } catch (error) {
    console.error('=== ChatGPT FETCH ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
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
              id: {
                type: 'string',
                description: 'Item key/ID from search results'
              }
            },
            required: ['id']
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

// SSE endpoint for ChatGPT Connectors - MCP over SSE (FastMCP pattern)
mcpChatGPTRouter.get('/sse', (req, res) => {
  console.log('=== ChatGPT SSE CONNECTION ATTEMPT ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('IP:', req.ip || req.connection.remoteAddress);
  console.log('User-Agent:', req.get('User-Agent'));
  console.log('Query params:', JSON.stringify(req.query, null, 2));
  
  // FastMCP-style SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  console.log('SSE headers sent, connection established');
  
  // Send immediate connection confirmation (FastMCP pattern)
  res.write(': connected\n\n');
  
  // Send MCP initialization (matching FastMCP format)
  const initResponse = {
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'zotero-mcp-server',
        version: '1.0.0'
      }
    }
  };
  
  console.log('Sending MCP init (FastMCP style):', JSON.stringify(initResponse, null, 2));
  res.write(`data: ${JSON.stringify(initResponse)}\n\n`);
  
  // Send tools list notification (FastMCP pattern)
  const toolsResponse = {
    jsonrpc: '2.0',
    method: 'tools/list_changed',
    params: {
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
              id: {
                type: 'string',
                description: 'Item key/ID from search results'
              }
            },
            required: ['id']
          }
        }
      ]
    }
  };
  
  setTimeout(() => {
    console.log('Sending tools notification (FastMCP style):', JSON.stringify(toolsResponse, null, 2));
    res.write(`data: ${JSON.stringify(toolsResponse)}\n\n`);
  }, 100);
  
  // Send ready notification
  setTimeout(() => {
    const readyResponse = {
      jsonrpc: '2.0',
      method: 'server/ready',
      params: {
        serverInfo: {
          name: 'zotero-mcp-server',
          version: '1.0.0'
        }
      }
    };
    console.log('Sending ready notification');
    res.write(`data: ${JSON.stringify(readyResponse)}\n\n`);
  }, 200);
  
  // Keep connection alive with heartbeat (FastMCP pattern)
  const heartbeat = setInterval(() => {
    const ping = {
      jsonrpc: '2.0',
      method: 'ping',
      params: { timestamp: Date.now() }
    };
    res.write(`data: ${JSON.stringify(ping)}\n\n`);
  }, 30000);
  
  req.on('close', () => {
    console.log('ChatGPT SSE connection closed');
    clearInterval(heartbeat);
  });
  
  req.on('error', (error) => {
    console.error('SSE connection error:', error);
    clearInterval(heartbeat);
  });
});

// Root discovery endpoint for ChatGPT Connectors - Redirect to SSE
mcpChatGPTRouter.get('/', (req, res) => {
  console.log('=== ChatGPT ROOT DISCOVERY REQUEST ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('IP:', req.ip || req.connection.remoteAddress);
  console.log('User-Agent:', req.get('User-Agent'));
  
  // ChatGPT expects direct SSE endpoints, not discovery JSON
  // Redirect to our enhanced SSE endpoint instead of FastMCP
  console.log('Redirecting to enhanced SSE endpoint for ChatGPT compatibility');
  res.redirect(301, '/chatgpt/sse');
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

module.exports = { 
  router: mcpChatGPTRouter,
  getZoteroConfig 
};