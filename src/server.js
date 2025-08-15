// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Log environment status immediately
console.log('Environment variables loaded:', {
  EMAIL_USER: process.env.EMAIL_USER ? 'YES' : 'NO',
  EMAIL_PASS: process.env.EMAIL_PASS ? 'YES (hidden)' : 'NO',
  KINDLE_EMAIL: process.env.KINDLE_EMAIL || 'NOT SET',
  ZOTERO_USER_ID: process.env.ZOTERO_USER_ID || 'NOT SET',
  NODE_ENV: process.env.NODE_ENV || 'development'
});
const express = require('express');
const axios = require('axios');
const { extractArticle } = require('./articleExtractor');
const { sendToKindle } = require('./kindleSender');
const { sendToZotero } = require('./zoteroSender');
const mcpRouter = require('./mcpServer');
const ConfigFetcher = require('./configFetcher');
const FastMCPLauncher = require('./fastmcpLauncher');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize config fetcher and preload popular sites
const configFetcher = new ConfigFetcher();
configFetcher.preloadConfigs();

// Initialize FastMCP launcher (only if not running under router)
const isUnderRouter = process.env.FASTMCP_PORT ? true : false;
const fastmcpLauncher = isUnderRouter ? null : new FastMCPLauncher();

// Middleware
app.use(express.json({ limit: '10mb' })); // Increase limit for large articles (was default 100kb)
app.use(express.static('public'));

// CORS middleware - allow requests from any origin
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Mount MCP server routes (with authentication)
app.use('/mcp', mcpRouter);

// Mount ChatGPT MCP-compliant routes (no auth required for personal use)
app.use('/chatgpt', require('./mcpChatGPT').router);

// Mount JSON-RPC MCP server for ChatGPT connectors
app.use('/mcp-jsonrpc', require('./mcpJsonRpc'));

// Mount Official MCP SDK server for ChatGPT compatibility
app.use('/mcp-official', require('./mcpServerOfficial'));
app.use('/mcp-chatgpt', require('./mcpServerOfficialChatGPT'));

// FastMCP proxy routes for ChatGPT integration
app.use('/chatgpt/fastmcp', async (req, res, next) => {
  if (!fastmcpLauncher || !fastmcpLauncher.isHealthy()) {
    return res.status(503).json({
      error: 'FastMCP server not available',
      message: 'FastMCP subprocess is not running'
    });
  }
  
  // Proxy request to FastMCP server
  try {
    const fastmcpUrl = isUnderRouter 
      ? `http://localhost:${process.env.FASTMCP_PORT}${req.path}`
      : `${fastmcpLauncher.getBaseUrl()}${req.path}`;
    console.log(`[FastMCP Proxy] ${req.method} ${fastmcpUrl}`);
    
    // Forward all headers except host, and add MCP-specific headers
    const forwardHeaders = {
      ...req.headers,
      host: undefined, // Remove host header to avoid conflicts
      'content-type': req.headers['content-type'] || 'application/json',
      'accept': req.headers['accept'] || 'application/json'
    };
    
    console.log(`[FastMCP Proxy] Headers:`, JSON.stringify(forwardHeaders, null, 2));
    
    const response = await axios({
      method: req.method,
      url: fastmcpUrl,
      headers: forwardHeaders,
      data: req.body,
      params: req.query,
      responseType: 'stream'
    });
    
    // Forward response headers
    Object.keys(response.headers).forEach(key => {
      res.set(key, response.headers[key]);
    });
    
    res.status(response.status);
    response.data.pipe(res);
    
  } catch (error) {
    console.error('[FastMCP Proxy Error]:', error.message);
    res.status(500).json({
      error: 'FastMCP proxy failed',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    services: {
      bookmarklet: 'active',
      mcp: process.env.MCP_API_KEY ? 'active' : 'disabled',
      fastmcp: (fastmcpLauncher && fastmcpLauncher.isHealthy()) || isUnderRouter ? 'active' : 'inactive'
    },
    timestamp: new Date().toISOString(),
    debug: {
      mcpApiKeySet: !!process.env.MCP_API_KEY,
      mcpApiKeyLength: process.env.MCP_API_KEY ? process.env.MCP_API_KEY.length : 0,
      fastmcpPort: fastmcpLauncher ? fastmcpLauncher.getPort() : (process.env.FASTMCP_PORT || 'N/A'),
      fastmcpUrl: fastmcpLauncher ? fastmcpLauncher.getBaseUrl() : (isUnderRouter ? `http://localhost:${process.env.FASTMCP_PORT}` : 'N/A')
    }
  });
});

// Site configuration endpoint - provides dynamic FiveFilters configs to bookmarklet
app.get('/site-config/:hostname', async (req, res) => {
  try {
    const hostname = req.params.hostname;
    const config = await configFetcher.getConfigForSite(hostname);
    
    if (config) {
      res.json({
        success: true,
        hostname: hostname,
        config: config,
        source: 'fivefilters',
        updatedAt: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No configuration found for this site',
        hostname: hostname
      });
    }
  } catch (error) {
    console.error('Error fetching site config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch site configuration',
      message: error.message
    });
  }
});

// Main bookmarklet endpoint
app.post('/process-article', async (req, res) => {
  try {
    const { url, article } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!article) {
      return res.status(400).json({ error: 'Extracted article content is required' });
    }

    // Prefer base64 content if present (robust against proxy/UTF-8 issues)
    if (article.content_b64) {
      console.log('Received content_b64, decoding...');
      try {
        const decodedContent = Buffer.from(article.content_b64, 'base64').toString('utf8');
        console.log(`Decoded content length: ${decodedContent.length} (was ${article.content?.length || 0})`);
        
        // Debug: Check for line breaks and br tags
        const brCount = (decodedContent.match(/<br>/gi) || []).length;
        const newlineCount = (decodedContent.match(/\n/g) || []).length;
        console.log(`Decoded content has ${brCount} <br> tags and ${newlineCount} newlines`);
        
        article.content = decodedContent;
      } catch (e) {
        console.warn('Failed to decode content_b64:', e.message);
      }
    } else {
      console.log('No content_b64 received, using raw content');
      
      // Debug: Check raw content for comparison
      if (article.content) {
        const brCount = (article.content.match(/<br>/gi) || []).length;
        const newlineCount = (article.content.match(/\n/g) || []).length;
        console.log(`Raw content has ${brCount} <br> tags and ${newlineCount} newlines`);
      }
    }

    console.log(`Processing article: ${article.title || url}`);
    
    // Log article size for debugging
    console.log('Article extraction stats:', {
      title: article.title,
      contentLength: article.content?.length || 0,
      textContentLength: article.textContent?.length || 0,
      hasContent: !!article.content
    });
    
    // Log content preview to check for truncation
    if (article.content && article.content.length > 1000) {
      const plainEnd = article.content.substring(Math.max(0, article.content.length - 500)).replace(/<[^>]*>/g, '').trim();
      console.log('Content ends with:', plainEnd.substring(plainEnd.length - 200));
    }

    // Article content is already extracted by the bookmarklet
    const processedArticle = {
      ...article,
      url: url,
      processedAt: new Date().toISOString()
    };
    
    // Send to both platforms (in parallel for speed)
    const results = await Promise.allSettled([
      sendToKindle(processedArticle),
      sendToZotero(processedArticle)
    ]);

    const response = {
      success: true,
      article: {
        title: processedArticle.title,
        url: processedArticle.url
      },
      kindle: results[0].status === 'fulfilled' ? 'sent' : 'failed',
      zotero: results[1].status === 'fulfilled' ? 'sent' : 'failed'
    };

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const platform = index === 0 ? 'Kindle' : 'Zotero';
        console.error(`${platform} failed:`, result.reason);
      }
    });

    res.json(response);

  } catch (error) {
    console.error('Error processing article:', error);
    res.status(500).json({ 
      error: 'Failed to process article',
      message: error.message 
    });
  }
});

// Test endpoint for article extraction only
app.post('/test-extract', async (req, res) => {
  try {
    const { url } = req.body;
    const article = await extractArticle(url);
    res.json(article);
  } catch (error) {
    console.error('Extraction test failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to generate and save EPUB locally for comparison
app.post('/debug-epub', async (req, res) => {
  try {
    const { url, article } = req.body;
    
    if (!article) {
      return res.status(400).json({ error: 'Article content is required' });
    }
    
    console.log('='.repeat(80));
    console.log('DEBUG EPUB GENERATION - START');
    console.log('='.repeat(80));
    
    // Import EPUB generator
    const { generateEpub } = require('./epubGenerator');
    
    // Generate EPUB
    const epubResult = await generateEpub({
      ...article,
      url: url || article.url
    });
    
    // Save debug copy
    const fs = require('fs').promises;
    const path = require('path');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const debugFilename = `debug_${timestamp}_${epubResult.filename}`;
    const debugPath = path.join('/tmp', debugFilename);
    
    await fs.writeFile(debugPath, epubResult.buffer);
    
    console.log('DEBUG EPUB saved to:', debugPath);
    console.log('='.repeat(80));
    console.log('DEBUG EPUB GENERATION - COMPLETE');
    console.log('='.repeat(80));
    
    res.json({
      success: true,
      filename: epubResult.filename,
      debugPath: debugPath,
      sizeKB: (epubResult.size / 1024).toFixed(2),
      message: `EPUB saved to ${debugPath} for comparison`
    });
    
  } catch (error) {
    console.error('Debug EPUB generation failed:', error);
    res.status(500).json({ 
      error: 'Failed to generate debug EPUB',
      message: error.message 
    });
  }
});

const server = app.listen(PORT, async () => {
  console.log(`Article bookmarklet service running on port ${PORT}`);
  console.log('Environment check:', {
    EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
    KINDLE_EMAIL: process.env.KINDLE_EMAIL ? 'SET' : 'NOT SET',
    ZOTERO_USER_ID: process.env.ZOTERO_USER_ID ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'not set'
  });
  
  // Start FastMCP server (unless running under router)
  if (!isUnderRouter && fastmcpLauncher) {
    try {
      await fastmcpLauncher.start();
      console.log(`FastMCP integration ready at:`);
      console.log(`  SSE: https://yourapp.ondigitalocean.app/chatgpt/fastmcp/sse`);
      console.log(`  Tools: https://yourapp.ondigitalocean.app/chatgpt/tools/`);  
    } catch (error) {
      console.error('FastMCP startup failed:', error.message);
      console.log('Continuing without FastMCP - custom MCP endpoints still available');
    }
  } else if (isUnderRouter) {
    console.log('Running under router - FastMCP managed externally on port', process.env.FASTMCP_PORT);
  }
});

// Add WebSocket support for ChatGPT MCP bidirectional communication
const WebSocket = require('ws');
const wss = new WebSocket.Server({ 
  server, 
  path: '/chatgpt/ws',
  verifyClient: (info) => {
    console.log('=== WebSocket Connection Attempt ===');
    console.log('Origin:', info.origin);
    console.log('Headers:', JSON.stringify(info.req.headers, null, 2));
    return true; // Allow all connections for now
  }
});

// WebSocket MCP handler
wss.on('connection', (ws, req) => {
  console.log('=== ChatGPT WebSocket Connected ===');
  console.log('IP:', req.socket.remoteAddress);
  console.log('User-Agent:', req.headers['user-agent']);
  
  // Send MCP initialization
  const initResponse = {
    jsonrpc: '2.0',
    id: 'init',
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
  };
  
  console.log('Sending WebSocket MCP init');
  ws.send(JSON.stringify(initResponse));
  
  // Handle incoming messages (tool calls from ChatGPT)
  ws.on('message', async (message) => {
    try {
      console.log('=== WebSocket Message Received ===');
      console.log('Raw message:', message.toString());
      
      const request = JSON.parse(message.toString());
      console.log('Parsed request:', JSON.stringify(request, null, 2));
      
      // Handle different MCP request types
      if (request.method === 'tools/list') {
        const toolsResponse = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
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
          }
        };
        
        console.log('Sending tools list response');
        ws.send(JSON.stringify(toolsResponse));
        
      } else if (request.method === 'tools/call') {
        console.log('=== Tool Call Request ===');
        console.log('Tool:', request.params.name);
        console.log('Arguments:', JSON.stringify(request.params.arguments, null, 2));
        
        // Import the functions we need
        const { getZoteroConfig } = require('./mcpChatGPT');
        
        // Handle tool execution
        let result;
        try {
          if (request.params.name === 'search') {
            const { query, limit = 25 } = request.params.arguments;
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
            
            result = response.data.map(item => ({
              id: item.key,
              title: item.data.title || 'Untitled',
              text: item.data.abstractNote || `${item.data.itemType} by ${item.data.creators?.map(c => `${c.firstName} ${c.lastName}`).join(', ') || 'Unknown'} (${item.data.date || 'No date'})`,
              url: item.data.url || `https://www.zotero.org/dgrobinson/items/${item.key}`
            }));
            
          } else if (request.params.name === 'fetch') {
            const { id: identifier } = request.params.arguments;
            const config = getZoteroConfig();
            
            const [itemResponse, childrenResponse] = await Promise.all([
              axios.get(`${config.baseUrl}/items/${identifier}`, { headers: config.headers }),
              axios.get(`${config.baseUrl}/items/${identifier}/children`, { headers: config.headers })
            ]);
            
            const item = itemResponse.data;
            const children = childrenResponse.data;
            const attachments = children.filter(c => c.data.itemType === 'attachment');
            const notes = children.filter(c => c.data.itemType === 'note');
            
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
            
            result = {
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
          }
          
          const toolResponse = {
            jsonrpc: '2.0',
            id: request.id,
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }]
            }
          };
          
          console.log('Sending tool response');
          ws.send(JSON.stringify(toolResponse));
          
        } catch (error) {
          console.error('Tool execution error:', error.message);
          
          const errorResponse = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32603,
              message: 'Tool execution failed',
              data: error.message
            }
          };
          
          ws.send(JSON.stringify(errorResponse));
        }
      }
      
    } catch (error) {
      console.error('WebSocket message handling error:', error.message);
      console.error('Raw message was:', message.toString());
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log('=== ChatGPT WebSocket Disconnected ===');
    console.log('Code:', code);
    console.log('Reason:', reason.toString());
  });
  
  ws.on('error', (error) => {
    console.error('=== WebSocket Error ===');
    console.error(error);
  });
});

console.log('WebSocket server listening on /chatgpt/ws');

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  
  // Stop FastMCP server
  try {
    await fastmcpLauncher.stop();
    console.log('FastMCP server stopped');
  } catch (error) {
    console.error('Error stopping FastMCP:', error.message);
  }
  
  // Close main server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  
  // Stop FastMCP server
  try {
    await fastmcpLauncher.stop();
    console.log('FastMCP server stopped');
  } catch (error) {
    console.error('Error stopping FastMCP:', error.message);
  }
  
  // Close main server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});