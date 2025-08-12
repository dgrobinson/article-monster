/**
 * Official MCP SDK Server Implementation for ChatGPT Integration
 * 
 * This server uses the official @modelcontextprotocol/sdk package to ensure
 * compatibility with ChatGPT Connectors. It implements the required "search"
 * and "fetch" tools with OpenAI-compliant response formats.
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const express = require('express');
const axios = require('axios');

// Environment variables
const ZOTERO_API_KEY = process.env.ZOTERO_API_KEY;
const ZOTERO_USER_ID = process.env.ZOTERO_USER_ID;
const MCP_API_KEY = process.env.MCP_API_KEY;

// Create Express router for HTTP transport
const router = express.Router();

// Initialize MCP server
const mcpServer = new McpServer({
  name: 'zotero-mcp-server',
  version: '1.0.0'
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

// Register the "search" tool (required by ChatGPT)
mcpServer.registerTool(
  'search',
  {
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
  async ({ query, limit }) => {
    try {
      const results = await searchZotero(query, limit || 25);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ results }, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ 
              error: error.message,
              details: 'Failed to search Zotero library'
            })
          }
        ],
        isError: true
      };
    }
  }
);

// Register the "fetch" tool (required by ChatGPT)
mcpServer.registerTool(
  'fetch',
  {
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
  },
  async ({ identifier }) => {
    try {
      const item = await fetchZoteroItem(identifier);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(item, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ 
              error: error.message,
              details: 'Failed to fetch Zotero item'
            })
          }
        ],
        isError: true
      };
    }
  }
);

// HTTP Transport for ChatGPT (Express middleware)
router.use(express.json());

// Authentication middleware
const authenticateMCP = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  
  const token = authHeader.substring(7);
  
  if (token !== MCP_API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  next();
};

// Apply authentication to all routes
router.use(authenticateMCP);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'active',
    server: 'zotero-mcp-official',
    version: '1.0.0',
    sdk: '@modelcontextprotocol/sdk',
    tools: ['search', 'fetch']
  });
});

// Main MCP endpoint for HTTP transport
// This endpoint bridges HTTP requests to the MCP server
router.post('/', async (req, res) => {
  try {
    const { method, params } = req.body;
    
    // Handle tool listing
    if (method === 'tools/list') {
      // Return the available tools
      res.json({
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
      });
      return;
    }
    
    // Handle tool calls
    if (method === 'tools/call') {
      const { name, arguments: args } = params;
      
      if (name === 'search') {
        const results = await searchZotero(args.query, args.limit);
        res.json({
          content: [
            {
              type: 'text',
              text: JSON.stringify({ results }, null, 2)
            }
          ]
        });
        return;
      }
      
      if (name === 'fetch') {
        const item = await fetchZoteroItem(args.identifier);
        res.json({
          content: [
            {
              type: 'text',
              text: JSON.stringify(item, null, 2)
            }
          ]
        });
        return;
      }
      
      res.status(400).json({ error: `Unknown tool: ${name}` });
      return;
    }
    
    res.status(400).json({ error: `Unknown method: ${method}` });
  } catch (error) {
    console.error('MCP request error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Internal server error processing MCP request'
    });
  }
});

// SSE endpoint for Server-Sent Events transport (if needed by ChatGPT)
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

// Export the router for use in main server
module.exports = router;

// If running standalone (for testing with stdio transport)
if (require.main === module) {
  // For standalone testing with stdio transport
  const runStandalone = async () => {
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error('MCP server running on stdio transport');
  };
  
  // Check if we should run stdio or HTTP mode
  if (process.argv.includes('--stdio')) {
    runStandalone().catch(console.error);
  } else {
    // HTTP mode
    const app = express();
    app.use('/mcp-official', router);
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`MCP Official SDK Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/mcp-official/health`);
    });
  }
}