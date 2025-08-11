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

  // Format according to OpenAI MCP specification
  const results = response.data.map(item => ({
    id: item.key,
    title: item.data.title || 'Untitled',
    text: item.data.abstractNote || `${item.data.itemType}: ${item.data.title || 'Untitled'}`,
    url: item.data.url || undefined
  }));

  return { results };
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

  // Build full text content from item data
  const creators = item.data.creators || [];
  const creatorsText = creators.map(c => 
    c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.name || 'Unknown'
  ).join(', ');

  const attachments = children.filter(c => c.data.itemType === 'attachment');
  const notes = children.filter(c => c.data.itemType === 'note');

  let fullText = `Title: ${item.data.title || 'Untitled'}\n`;
  if (creatorsText) fullText += `Authors: ${creatorsText}\n`;
  if (item.data.date) fullText += `Date: ${item.data.date}\n`;
  if (item.data.itemType) fullText += `Type: ${item.data.itemType}\n`;
  if (item.data.url) fullText += `URL: ${item.data.url}\n`;
  if (item.data.abstractNote) fullText += `\nAbstract:\n${item.data.abstractNote}\n`;
  
  if (attachments.length > 0) {
    fullText += `\nAttachments:\n`;
    attachments.forEach(att => {
      fullText += `- ${att.data.title} (${att.data.contentType || 'unknown type'})\n`;
    });
  }

  if (notes.length > 0) {
    fullText += `\nNotes:\n`;
    notes.forEach(note => {
      fullText += `- ${note.data.note}\n`;
    });
  }

  // Tags
  if (item.data.tags && item.data.tags.length > 0) {
    const tagList = item.data.tags.map(t => t.tag || t).join(', ');
    fullText += `\nTags: ${tagList}\n`;
  }

  // Format according to OpenAI MCP specification
  return {
    id: identifier,
    title: item.data.title || 'Untitled',
    text: fullText,
    url: item.data.url || undefined
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
        description: 'Search across all items in your Zotero library to find relevant research papers, articles, and documents.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query string. Natural language queries work best for finding relevant documents.'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'fetch',
        description: 'Retrieve the complete details and content of a specific library item.',
        inputSchema: {
          type: 'object',
          properties: {
            identifier: {
              type: 'string', 
              description: 'Unique identifier (ID) from search results'
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

// SSE Transport Endpoint - Required by OpenAI MCP specification
mcpJsonRpcRouter.get('/sse', async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

  // Send initial connected event
  res.write('event: connected\n');
  res.write('data: {"type": "connected"}\n\n');

  // Handle MCP protocol over SSE
  req.on('close', () => {
    console.log('SSE connection closed');
  });

  // Keep connection alive with periodic ping
  const heartbeat = setInterval(() => {
    res.write('event: ping\n');
    res.write('data: {"type": "ping"}\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// SSE Endpoint for handling JSON-RPC messages via POST
mcpJsonRpcRouter.post('/sse', async (req, res) => {
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
    console.error('MCP SSE server error:', error);
    res.json(createJsonRpcResponse(null, null, createJsonRpcError(JSONRPC_ERRORS.PARSE_ERROR, 'Parse error')));
  }
});

// Handle OPTIONS for CORS on SSE endpoint
mcpJsonRpcRouter.options('/sse', (req, res) => {
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
    transport: 'sse',
    version: '2024-11-05',
    timestamp: new Date().toISOString()
  });
});

module.exports = mcpJsonRpcRouter;