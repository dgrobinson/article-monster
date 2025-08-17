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
    services: {
      bookmarklet: 'active'
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
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!article) {
      return res.status(400).json({ error: 'Extracted article content is required' });
    }

    // Compare raw content with base64 decoded content to debug paragraph issue
    const rawContent = article.content;
    let decodedContent = null;
    
    if (article.content_b64) {
      console.log('Received both raw and base64 content, comparing...');
      try {
        // Decode base64
        decodedContent = Buffer.from(article.content_b64, 'base64').toString('utf8');
        
        // Compare structures
        const rawBrCount = (rawContent.match(/<br>/gi) || []).length;
        const rawNewlineCount = (rawContent.match(/\n/g) || []).length;
        const rawPCount = (rawContent.match(/<p>/gi) || []).length;
        
        const decodedBrCount = (decodedContent.match(/<br>/gi) || []).length;
        const decodedNewlineCount = (decodedContent.match(/\n/g) || []).length;
        const decodedPCount = (decodedContent.match(/<p>/gi) || []).length;
        
        console.log(`RAW content: ${rawPCount} <p> tags, ${rawBrCount} <br> tags, ${rawNewlineCount} newlines, ${rawContent.length} chars`);
        console.log(`B64 decoded: ${decodedPCount} <p> tags, ${decodedBrCount} <br> tags, ${decodedNewlineCount} newlines, ${decodedContent.length} chars`);
        
        if (rawContent.length !== decodedContent.length) {
          console.warn(`Content length mismatch! Raw: ${rawContent.length}, Decoded: ${decodedContent.length}`);
        }
        
        if (rawNewlineCount !== decodedNewlineCount) {
          console.warn(`Newline count mismatch! Raw: ${rawNewlineCount}, Decoded: ${decodedNewlineCount}`);
        }
        
        // Use decoded content if it's complete (longer than raw, indicating raw was truncated)
        if (decodedContent.length > rawContent.length) {
          console.log('Using base64 decoded content (longer, likely complete)');
          article.content = decodedContent;
        } else {
          console.log('Using raw content (same or longer than decoded)');
          article.content = rawContent;
        }
      } catch (e) {
        console.warn('Failed to decode content_b64:', e.message);
        article.content = rawContent;
      }
    } else if (rawContent) {
      // Only raw content available
      const brCount = (rawContent.match(/<br>/gi) || []).length;
      const newlineCount = (rawContent.match(/\n/g) || []).length;
      const pCount = (rawContent.match(/<p>/gi) || []).length;
      console.log(`Raw content only: ${pCount} <p> tags, ${brCount} <br> tags, ${newlineCount} newlines`);
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
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});