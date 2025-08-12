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
const { extractArticle } = require('./articleExtractor');
const { sendToKindle } = require('./kindleSender');
const { sendToZotero } = require('./zoteroSender');
const mcpRouter = require('./mcpServer');
const ConfigFetcher = require('./configFetcher');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize config fetcher and preload popular sites
const configFetcher = new ConfigFetcher();
configFetcher.preloadConfigs();

// Middleware
app.use(express.json());
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
app.use('/chatgpt', require('./mcpChatGPT'));

// Mount JSON-RPC MCP server for ChatGPT connectors
app.use('/mcp-jsonrpc', require('./mcpJsonRpc'));

// Mount Official MCP SDK server for ChatGPT compatibility
app.use('/mcp-official', require('./mcpServerOfficial'));
app.use('/mcp-chatgpt', require('./mcpServerOfficialChatGPT'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    services: {
      bookmarklet: 'active',
      mcp: process.env.MCP_API_KEY ? 'active' : 'disabled'
    },
    timestamp: new Date().toISOString(),
    debug: {
      mcpApiKeySet: !!process.env.MCP_API_KEY,
      mcpApiKeyLength: process.env.MCP_API_KEY ? process.env.MCP_API_KEY.length : 0
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

    console.log(`Processing article: ${article.title || url}`);

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

app.listen(PORT, () => {
  console.log(`Article bookmarklet service running on port ${PORT}`);
  console.log('Environment check:', {
    EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
    KINDLE_EMAIL: process.env.KINDLE_EMAIL ? 'SET' : 'NOT SET',
    ZOTERO_USER_ID: process.env.ZOTERO_USER_ID ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'not set'
  });
});