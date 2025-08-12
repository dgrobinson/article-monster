/**
 * ChatGPT-specific MCP Server (No Authentication)
 * 
 * This provides the same MCP functionality as mcpServerOfficial.js but without
 * authentication requirements, since ChatGPT Connectors only support OAuth or No Auth.
 */

const express = require('express');
const axios = require('axios');

// Environment variables
const ZOTERO_API_KEY = process.env.ZOTERO_API_KEY;
const ZOTERO_USER_ID = process.env.ZOTERO_USER_ID;

// Create Express router for ChatGPT (no auth required)
const router = express.Router();
router.use(express.json());

// Add CORS headers for ChatGPT
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/**
 * Helper function to search Zotero library
 */
async function searchZotero(query, limit = 25) {
  try {
    const response = await axios.get(
      `https://api.zotero.org/users/${ZOTERO_USER_ID}/items`,
      {
        headers: {
          'Zotero-API-Version': '3',
          'Zotero-API-Key': ZOTERO_API_KEY
        },
        params: {
          q: query,
          limit: limit,
          format: 'json'
        }
      }
    );

    return response.data.map(item => ({
      id: item.key,
      title: item.data.title || 'Untitled',
      text: item.data.abstractNote || 
            `${item.data.itemType}: ${item.data.title || 'Untitled'}`,
      url: item.data.url || undefined
    }));
  } catch (error) {
    console.error('Zotero search error:', error.message);
    throw error;
  }
}

/**
 * Helper function to fetch a specific Zotero item
 */
async function fetchZoteroItem(key) {
  try {
    const response = await axios.get(
      `https://api.zotero.org/users/${ZOTERO_USER_ID}/items/${key}`,
      {
        headers: {
          'Zotero-API-Version': '3',
          'Zotero-API-Key': ZOTERO_API_KEY
        },
        params: {
          format: 'json'
        }
      }
    );

    const item = response.data;
    
    // Build comprehensive text content
    const textParts = [];
    
    if (item.data.abstractNote) {
      textParts.push(`Abstract: ${item.data.abstractNote}`);
    }
    
    if (item.data.creators && item.data.creators.length > 0) {
      const authors = item.data.creators
        .filter(c => c.creatorType === 'author')
        .map(c => `${c.firstName || ''} ${c.lastName || ''}`.trim())
        .join(', ');
      if (authors) textParts.push(`Authors: ${authors}`);
    }
    
    if (item.data.date) {
      textParts.push(`Date: ${item.data.date}`);
    }
    
    if (item.data.publicationTitle) {
      textParts.push(`Publication: ${item.data.publicationTitle}`);
    }
    
    if (item.data.DOI) {
      textParts.push(`DOI: ${item.data.DOI}`);
    }
    
    if (item.data.tags && item.data.tags.length > 0) {
      const tags = item.data.tags.map(t => t.tag).join(', ');
      textParts.push(`Tags: ${tags}`);
    }
    
    if (item.data.notes && item.data.notes.length > 0) {
      textParts.push(`Notes: ${item.data.notes.join(' ')}`);
    }

    return {
      id: item.key,
      title: item.data.title || 'Untitled',
      text: textParts.join('\n\n') || `${item.data.itemType}: ${item.data.title || 'Untitled'}`,
      url: item.data.url || undefined
    };
  } catch (error) {
    console.error('Zotero fetch error:', error.message);
    throw error;
  }
}

// Manifest endpoint for ChatGPT Connector discovery
router.get('/manifest.json', (req, res) => {
  res.json({
    name: 'Zotero Research Library',
    description: 'Access your personal Zotero research library for searching and retrieving academic papers, articles, and references',
    version: '1.0.0',
    protocol: 'mcp',
    capabilities: {
      tools: ['search', 'fetch']
    },
    authentication: {
      type: 'none'
    },
    endpoints: {
      mcp: 'https://seal-app-t4vff.ondigitalocean.app/mcp-chatgpt/',
      health: 'https://seal-app-t4vff.ondigitalocean.app/mcp-chatgpt/health'
    },
    server_info: {
      name: 'zotero-mcp-server',
      version: '1.0.0'
    }
  });
});

// Health check for ChatGPT
router.get('/health', (req, res) => {
  res.json({
    status: 'active',
    server: 'zotero-mcp-chatgpt',
    version: '1.0.0',
    protocol: 'mcp-jsonrpc-2.0',
    tools: ['search', 'fetch'],
    auth: 'none'
  });
});

// Main MCP JSON-RPC endpoint for ChatGPT
router.post('/', async (req, res) => {
  try {
    const { method, params, id } = req.body;
    
    // Handle MCP initialization
    if (method === 'initialize') {
      res.json({
        jsonrpc: '2.0',
        id: id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'zotero-mcp-server',
            version: '1.0.0'
          }
        }
      });
      return;
    }
    
    // Handle tool listing
    if (method === 'tools/list') {
      res.json({
        jsonrpc: '2.0',
        id: id,
        result: {
          tools: [
            {
              name: 'search',
              description: 'Search the Zotero library for references and articles',
              inputSchema: {
                type: 'object',
                properties: {
                  query: {
                    type: 'string',
                    description: 'Search query for finding items in Zotero'
                  },
                  limit: {
                    type: 'number',
                    description: 'Maximum number of results to return',
                    default: 25
                  }
                },
                required: ['query']
              }
            },
            {
              name: 'fetch',
              description: 'Fetch detailed information about a specific Zotero item',
              inputSchema: {
                type: 'object',
                properties: {
                  identifier: {
                    type: 'string',
                    description: 'The Zotero item key/identifier'
                  }
                },
                required: ['identifier']
              }
            }
          ]
        }
      });
      return;
    }
    
    // Handle tool calls
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      
      if (name === 'search') {
        const results = await searchZotero(args.query, args.limit);
        res.json({
          jsonrpc: '2.0',
          id: id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ results }, null, 2)
              }
            ]
          }
        });
        return;
      }
      
      if (name === 'fetch') {
        const item = await fetchZoteroItem(args.identifier);
        res.json({
          jsonrpc: '2.0',
          id: id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(item, null, 2)
              }
            ]
          }
        });
        return;
      }
      
      res.status(400).json({ 
        jsonrpc: '2.0',
        id: id,
        error: { 
          code: -32601,
          message: `Unknown tool: ${name}` 
        }
      });
      return;
    }
    
    res.status(400).json({ 
      jsonrpc: '2.0',
      id: id,
      error: { 
        code: -32601,
        message: `Unknown method: ${method}` 
      }
    });
  } catch (error) {
    console.error('MCP ChatGPT request error:', error);
    res.status(500).json({ 
      jsonrpc: '2.0',
      id: req.body.id,
      error: { 
        code: -32603,
        message: error.message,
        data: 'Internal server error processing MCP request'
      }
    });
  }
});

// SSE endpoint for ChatGPT (no auth)
router.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send initial connection message
  res.write('data: {"type":"connection","status":"connected"}\n\n');
  
  // Keep connection alive
  const heartbeat = setInterval(() => {
    res.write('data: {"type":"heartbeat"}\n\n');
  }, 30000);
  
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

module.exports = router;