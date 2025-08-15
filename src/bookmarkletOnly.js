// Only load .env in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Log environment status immediately
console.log('PURE FASTMCP FALLBACK: Node.js bookmarklet-only server');
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
const ConfigFetcher = require('./configFetcher');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize config fetcher and preload popular sites
const configFetcher = new ConfigFetcher();
configFetcher.preloadConfigs();

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mode: 'bookmarklet-only (Pure FastMCP deployment)',
    services: {
      bookmarklet: 'active',
      mcp: 'handled by FastMCP Python server',
      fastmcp: 'primary server on this port'
    },
    timestamp: new Date().toISOString()
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
    
    // Prefer base64 content if present (robust against proxy/UTF-8 issues)
    if (article?.content_b64) {
      console.log('Received content_b64, decoding...');
      try {
        const decodedContent = Buffer.from(article.content_b64, 'base64').toString('utf8');
        console.log(`Decoded content length: ${decodedContent.length} (was ${article.content?.length || 0})`);
        article.content = decodedContent;
      } catch (e) {
        console.warn('Failed to decode content_b64:', e.message);
      }
    } else {
      console.log('No content_b64 received, using raw content');
    }
    
    // Log incoming content size for debugging truncation issues
    console.log(`Received article: "${article?.title || 'Unknown'}" - Content length: ${article?.content?.length || 0} bytes`);
    if (article?.content) {
      const plainEnd = article.content.substring(Math.max(0, article.content.length - 200)).replace(/<[^>]*>/g, '').trim();
      console.log('Content ends with:', plainEnd.substring(Math.max(0, plainEnd.length - 100)));
    }
    
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

app.listen(PORT, () => {
  console.log(`Bookmarklet-only server running on port ${PORT}`);
  console.log('MCP functionality handled by FastMCP Python server');
  console.log('Environment check:', {
    EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
    KINDLE_EMAIL: process.env.KINDLE_EMAIL ? 'SET' : 'NOT SET',
    ZOTERO_USER_ID: process.env.ZOTERO_USER_ID ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'not set'
  });
});