const express = require('express');
const axios = require('axios');

const mcpJsonRpcRouter = express.Router();

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

// JSON-RPC Error Codes
const JSONRPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603
};

// Create JSON-RPC response
function createJsonRpcResponse(id, result, error = null) {
  const response = {
    jsonrpc: '2.0',
    id
  };
  
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }
  
  return response;
}

// Create JSON-RPC error
function createJsonRpcError(code, message, data = null) {
  const error = { code, message };
  if (data) error.data = data;
  return error;
}

// MCP Tool: Search Zotero Library
async function handleSearchTool(params) {
  const { query, limit = 25 } = params;
  
  if (!query) {
    throw createJsonRpcError(JSONRPC_ERRORS.INVALID_PARAMS, 'Search query is required');
  }

  console.log(`MCP Search: "${query}"`);
  const config = getZoteroConfig();

  const response = await axios.get(`${config.baseUrl}/items`, {
    headers: config.headers,
    params: {
      q: query,
      limit: Math.min(limit, 50),
      sort: 'dateModified',
      direction: 'desc'
    }
  });

  const items = response.data.map(item => ({
    key: item.key,
    type: item.data.itemType,
    title: item.data.title || 'Untitled',
    creators: item.data.creators || [],
    date: item.data.date,
    url: item.data.url,
    abstract: item.data.abstractNote,
    tags: item.data.tags || [],
    collections: item.data.collections || []
  }));

  return {
    content: [
      {
        type: 'text',
        text: `Found ${items.length} items matching "${query}"`
      },
      {
        type: 'text', 
        text: JSON.stringify(items, null, 2)
      }
    ]
  };
}

// MCP Tool: Fetch Item Details
async function handleFetchTool(params) {
  const { identifier } = params;
  
  if (!identifier) {
    throw createJsonRpcError(JSONRPC_ERRORS.INVALID_PARAMS, 'Item identifier is required');
  }

  console.log(`MCP Fetch: ${identifier}`);
  const config = getZoteroConfig();
  
  const response = await axios.get(`${config.baseUrl}/items/${identifier}`, {
    headers: config.headers
  });

  const childrenResponse = await axios.get(`${config.baseUrl}/items/${identifier}/children`, {
    headers: config.headers
  });

  const item = response.data;
  const children = childrenResponse.data;

  const result = {
    key: item.key,
    version: item.version,
    data: item.data,
    attachments: children.filter(c => c.data.itemType === 'attachment').map(a => ({
      key: a.key,
      title: a.data.title,
      contentType: a.data.contentType,
      filename: a.data.filename
    })),
    notes: children.filter(c => c.data.itemType === 'note').map(n => ({
      key: n.key,
      note: n.data.note
    })),
    meta: {
      created: item.data.dateAdded,
      modified: item.data.dateModified,
      library: item.library
    }
  };

  return {
    content: [
      {
        type: 'text',
        text: `Item details for ${identifier}:`
      },
      {
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }
    ]
  };
}

// Handle MCP Initialize Request
function handleInitialize(params, id) {
  return createJsonRpcResponse(id, {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    },
    serverInfo: {
      name: 'zotero-mcp-server',
      version: '1.0.0'
    }
  });
}

// Handle MCP Tools/List Request  
function handleToolsList(params, id) {
  return createJsonRpcResponse(id, {
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
            }
          },
          required: ['identifier']
        }
      }
    ]
  });
}

// Handle MCP Tools/Call Request
async function handleToolsCall(params, id) {
  try {
    const { name, arguments: toolArgs } = params;
    
    let result;
    switch (name) {
      case 'search':
        result = await handleSearchTool(toolArgs);
        break;
      case 'fetch':
        result = await handleFetchTool(toolArgs);
        break;
      default:
        throw createJsonRpcError(JSONRPC_ERRORS.METHOD_NOT_FOUND, `Unknown tool: ${name}`);
    }
    
    return createJsonRpcResponse(id, result);
  } catch (error) {
    if (error.code) {
      return createJsonRpcResponse(id, null, error);
    }
    return createJsonRpcResponse(id, null, createJsonRpcError(JSONRPC_ERRORS.INTERNAL_ERROR, error.message));
  }
}

// Main JSON-RPC Handler
async function handleJsonRpcRequest(request) {
  const { jsonrpc, method, params, id } = request;
  
  // Validate JSON-RPC format
  if (jsonrpc !== '2.0') {
    return createJsonRpcResponse(id, null, createJsonRpcError(JSONRPC_ERRORS.INVALID_REQUEST, 'Invalid JSON-RPC version'));
  }
  
  try {
    switch (method) {
      case 'initialize':
        return handleInitialize(params, id);
      case 'tools/list':
        return handleToolsList(params, id);
      case 'tools/call':
        return await handleToolsCall(params, id);
      case 'initialized':
        // Notification - no response needed
        return null;
      default:
        return createJsonRpcResponse(id, null, createJsonRpcError(JSONRPC_ERRORS.METHOD_NOT_FOUND, `Method not found: ${method}`));
    }
  } catch (error) {
    return createJsonRpcResponse(id, null, createJsonRpcError(JSONRPC_ERRORS.INTERNAL_ERROR, error.message));
  }
}

// MCP HTTP Transport Endpoint
mcpJsonRpcRouter.post('/', async (req, res) => {
  try {
    // Set CORS headers for ChatGPT
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
    
    const request = req.body;
    
    // Handle single request or batch
    if (Array.isArray(request)) {
      // Batch request
      const responses = await Promise.all(
        request.map(handleJsonRpcRequest)
      );
      const validResponses = responses.filter(r => r !== null);
      res.json(validResponses.length === 1 ? validResponses[0] : validResponses);
    } else {
      // Single request
      const response = await handleJsonRpcRequest(request);
      if (response) {
        res.json(response);
      } else {
        // Notification - no response
        res.status(204).send();
      }
    }
  } catch (error) {
    console.error('MCP server error:', error);
    res.json(createJsonRpcResponse(null, null, createJsonRpcError(JSONRPC_ERRORS.PARSE_ERROR, 'Parse error')));
  }
});

// Handle OPTIONS for CORS
mcpJsonRpcRouter.options('/', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.sendStatus(200);
});

// Health check
mcpJsonRpcRouter.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'MCP JSON-RPC Zotero Server',
    protocol: 'json-rpc-2.0',
    version: '2024-11-05',
    timestamp: new Date().toISOString()
  });
});

module.exports = mcpJsonRpcRouter;