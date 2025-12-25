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
  NODE_ENV: process.env.NODE_ENV || 'development',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN ? 'YES (hidden)' : 'NO',
  GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY || 'NOT SET',
  ENABLE_DEBUG_CAPTURE: process.env.ENABLE_DEBUG_CAPTURE || 'NOT SET',
  ENABLE_KINDLE_ARCHIVE_DEBUG: process.env.ENABLE_KINDLE_ARCHIVE_DEBUG || 'NOT SET'
});
const express = require('express');
const { extractArticle } = require('./articleExtractor');
const { sendToKindle, createKindleHTML } = require('./kindleSender');
const { sendToZotero } = require('./zoteroSender');
const {
  listKindlePayloads,
  getKindlePayload,
  storeKindlePayload,
  getPayloadMetrics
} = require('./kindleArchive');
const ConfigFetcher = require('./configFetcher');
const DebugLogger = require('./debugLogger');
const GitHubIssues = require('./githubIssues');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting (important for DigitalOcean App Platform)
app.set('trust proxy', true);

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

// Simple rate limiting store (in-memory)
const rateLimitStore = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 3; // Max 3 issues per 15 minutes per IP

  const key = `rate_limit_${ip}`;
  const requests = rateLimitStore.get(key) || [];

  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < windowMs);

  if (validRequests.length >= maxRequests) {
    return true;
  }

  // Add current request
  validRequests.push(now);
  rateLimitStore.set(key, validRequests);

  // Clean up old entries periodically
  if (Math.random() < 0.1) {
    for (const [k, v] of rateLimitStore.entries()) {
      const validTimes = v.filter(time => now - time < windowMs);
      if (validTimes.length === 0) {
        rateLimitStore.delete(k);
      } else {
        rateLimitStore.set(k, validTimes);
      }
    }
  }

  return false;
}

function getBlockedWebApp(hostname) {
  const normalized = (hostname || '').toLowerCase();
  if (!normalized) return null;
  if (normalized === 'docs.google.com' || normalized === 'drive.google.com') {
    return 'Google Docs or Drive';
  }
  if (normalized === 'notion.so' || normalized.endsWith('.notion.so')) {
    return 'Notion';
  }
  if (normalized === 'app.slack.com' || normalized.endsWith('.slack.com')) {
    return 'Slack';
  }
  if (normalized === 'myworkday.com' || normalized.endsWith('.myworkday.com')) {
    return 'Workday';
  }
  return null;
}

function validateReportUrl(url) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  // Only allow HTTP/HTTPS
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are allowed');
  }

  // Block private/internal networks to prevent SSRF
  const hostname = parsedUrl.hostname.toLowerCase();

  // Block localhost and loopback
  if (['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    throw new Error('Localhost URLs are not allowed');
  }

  // Block private IP ranges (basic check)
  if (hostname.match(/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/)) {
    throw new Error('Private IP addresses are not allowed');
  }

  // Block common internal domains
  if (hostname.includes('.local') || hostname.includes('.internal')) {
    throw new Error('Internal domains are not allowed');
  }

  return parsedUrl;
}

function compactWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function summarizeHtmlContent(html, tailLength) {
  const safeHtml = typeof html === 'string' ? html : '';
  const text = compactWhitespace(safeHtml.replace(/<[^>]*>/g, ' '));
  const limit = Number.isFinite(tailLength) ? tailLength : 200;
  const tailPreview = text.slice(Math.max(0, text.length - limit));
  return {
    htmlLength: safeHtml.length,
    textLength: text.length,
    paragraphCount: (safeHtml.match(/<p[^>]*>/gi) || []).length,
    lineBreakCount: (safeHtml.match(/<br[^>]*>/gi) || []).length,
    newlineCount: (safeHtml.match(/\n/g) || []).length,
    tailPreview
  };
}

function buildContentDiagnosticsFromPayload(article) {
  const rawStats = summarizeHtmlContent(article?.content || '');
  let decodedStats = null;
  let selectedStats = rawStats;

  if (article?.content_b64) {
    try {
      const decoded = Buffer.from(article.content_b64, 'base64').toString('utf8');
      decodedStats = summarizeHtmlContent(decoded);
      if (decodedStats.htmlLength > rawStats.htmlLength) {
        selectedStats = decodedStats;
      }
    } catch {
      decodedStats = null;
      selectedStats = rawStats;
    }
  }

  return {
    raw: rawStats,
    decoded: decodedStats,
    selected: selectedStats
  };
}

function authorizeKindleArchive(req, res) {
  if (process.env.ENABLE_KINDLE_ARCHIVE_DEBUG !== 'true') {
    res.status(404).json({ error: 'Not found' });
    return false;
  }

  const token = process.env.KINDLE_ARCHIVE_DEBUG_TOKEN;
  if (token) {
    const provided = req.get('x-debug-token') || req.query.token;
    if (provided !== token) {
      res.status(401).json({ error: 'Unauthorized' });
      return false;
    }
  }

  return true;
}

// Endpoint to report a broken extraction which opens a GitHub issue
app.post('/report-issue', async (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    // Rate limiting
    if (isRateLimited(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait before submitting another report.'
      });
    }

    const { url, notes } = req.body || {};

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'url is required' });
    }

    // Validate URL for security
    let parsedUrl;
    try {
      parsedUrl = validateReportUrl(url);
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const issues = new GitHubIssues();

    const title = `Broken extraction: ${parsedUrl.hostname}`;
    const body = [
      `URL: ${url}`,
      '',
      notes ? `Notes:\n${notes}` : 'Notes:',
      '',
      `Reported at: ${new Date().toISOString()}`,
      `Reported from: ${clientIp}`,
      '',
      'Agent fill-in: logs, config, repro, and comparison notes.'
    ].filter(Boolean).join('\n');

    const issue = await issues.createIssue({
      title,
      body,
      labels: ['bug', 'extraction']
    });

    return res.json({ success: true, issueUrl: issue.html_url, number: issue.number });
  } catch (error) {
    console.error('Failed to create GitHub issue:', error.message);
    return res.status(500).json({ success: false, error: 'Failed to create issue' });
  }
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
  const debugLogger = new DebugLogger();

  try {
    const {
      url,
      article,
      debugInfo,
      page_html: pageHtml,
      title: titleOverride,
      debug_capture_only: debugCaptureOnlyRaw
    } = req.body || {};
    const debugCaptureOnly = debugCaptureOnlyRaw === true;
    const articlePayload = article || {};

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const blockedApp = getBlockedWebApp(parsedUrl.hostname);
    if (blockedApp) {
      debugLogger.log('request', 'Blocked authenticated web app extraction', {
        url,
        hostname: parsedUrl.hostname,
        app: blockedApp,
        debugCaptureOnly
      });
      return res.status(403).json({
        error: 'Blocked for safety',
        blocked: true,
        app: blockedApp,
        hostname: parsedUrl.hostname
      });
    }

    // Store bookmarklet debug info if provided
    const bookmarkletLog = debugInfo || [];

    // Mirror client logs into server-side logger for unified visibility
    if (Array.isArray(bookmarkletLog)) {
      bookmarkletLog.slice(0, 500).forEach((entry) => {
        try {
          const level = entry.level || entry.category || 'log';
          const message = entry.message || (Array.isArray(entry.args) ? entry.args.join(' ') : '');
          debugLogger.log('client:' + level, message, entry);
        } catch {
          // Best-effort only
        }
      });
    }

    if (!article && !debugCaptureOnly) {
      return res.status(400).json({ error: 'Extracted article content is required' });
    }

    if (!articlePayload.title && titleOverride) {
      articlePayload.title = titleOverride;
    }

    debugLogger.log('request', 'Article processing started', {
      url,
      title: articlePayload.title,
      hasContent: !!articlePayload.content,
      hasBase64: !!articlePayload.content_b64,
      debugCaptureOnly
    });

    // Compare raw content with base64 decoded content to debug paragraph issue
    const rawContent = articlePayload.content;
    let decodedContent = null;
    const rawStats = summarizeHtmlContent(rawContent);
    let decodedStats = null;
    let selectedStats = null;

    debugLogger.log('content', 'raw-content-stats', rawStats);

    if (articlePayload.content_b64) {
      console.log('Received both raw and base64 content, comparing...');
      try {
        // Decode base64
        decodedContent = Buffer.from(articlePayload.content_b64, 'base64').toString('utf8');
        decodedStats = summarizeHtmlContent(decodedContent);
        debugLogger.log('content', 'decoded-content-stats', decodedStats);

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
          debugLogger.log('content', 'content-length-mismatch', {
            rawLength: rawContent.length,
            decodedLength: decodedContent.length
          });
        }

        if (rawNewlineCount !== decodedNewlineCount) {
          console.warn(`Newline count mismatch! Raw: ${rawNewlineCount}, Decoded: ${decodedNewlineCount}`);
          debugLogger.log('content', 'newline-count-mismatch', {
            rawNewlineCount,
            decodedNewlineCount
          });
        }

        // Use decoded content if it's complete (longer than raw, indicating raw was truncated)
        if (decodedContent.length > rawContent.length) {
          console.log('Using base64 decoded content (longer, likely complete)');
          articlePayload.content = decodedContent;
        } else {
          console.log('Using raw content (same or longer than decoded)');
          articlePayload.content = rawContent;
        }
      } catch (e) {
        console.warn('Failed to decode content_b64:', e.message);
        articlePayload.content = rawContent;
      }
    } else if (rawContent) {
      // Only raw content available
      debugLogger.log('content', 'raw-only-content', rawStats);
    }

    selectedStats = summarizeHtmlContent(articlePayload.content);
    debugLogger.log('content', 'selected-content-stats', selectedStats);
    const contentDiagnostics = {
      raw: rawStats,
      decoded: decodedStats,
      selected: selectedStats
    };

    debugLogger.log('processing', `Processing article: ${articlePayload.title || url}`);

    // Log article size for debugging
    debugLogger.log('extraction', 'Article extraction stats', {
      title: articlePayload.title,
      contentLength: articlePayload.content?.length || 0,
      textContentLength: articlePayload.textContent?.length || 0,
      hasContent: !!articlePayload.content,
      paragraphCount: selectedStats.paragraphCount,
      lineBreakCount: selectedStats.lineBreakCount,
      newlineCount: selectedStats.newlineCount,
      tailPreview: selectedStats.tailPreview
    });

    // Log content preview to check for truncation
    if (selectedStats.tailPreview) {
      debugLogger.log('content', 'content-tail-preview', {
        tailPreview: selectedStats.tailPreview
      });
    }

    // Article content is already extracted by the bookmarklet
    const processedArticle = {
      ...articlePayload,
      url: url,
      processedAt: new Date().toISOString()
    };

    // Store config used (if any)
    let configUsed = null;
    const hostname = new URL(url).hostname;
    try {
      configUsed = await configFetcher.getConfigForSite(hostname);
    } catch {
      debugLogger.log('config', 'No site config found', { hostname });
    }

    const pageHtmlLength = typeof pageHtml === 'string' ? pageHtml.length : 0;
    if (pageHtmlLength > 0) {
      debugLogger.log('debug', 'Captured page HTML', { length: pageHtmlLength });
    }

    if (debugCaptureOnly) {
      const response = {
        success: true,
        debugOnly: true,
        article: {
          title: processedArticle.title,
          url: processedArticle.url
        },
        kindle: 'skipped',
        zotero: 'skipped'
      };

      const extractionData = {
        url,
        title: processedArticle.title || url || 'Unknown',
        success: true,
        extraction_status: 'debug-only',
        kindle_status: response.kindle,
        zotero_status: response.zotero,
        bookmarklet_log: bookmarkletLog,
        payload: req.body,
        config_used: configUsed,
        content_diagnostics: contentDiagnostics,
        email_content: '',
        epub_base64: ''
      };

      debugLogger.captureToGitHub(extractionData).catch(err => {
        console.error('Debug capture failed (non-blocking):', err.message);
      });

      return res.json(response);
    }

    debugLogger.log('sending', 'Sending to platforms', { kindle: true, zotero: true });

    // Send to both platforms (in parallel for speed)
    const results = await Promise.allSettled([
      sendToKindle(processedArticle, debugLogger),
      sendToZotero(processedArticle, debugLogger)
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
        debugLogger.log('error', `${platform} failed`, { error: result.reason.message });
      }
    });

    // Capture debug output to GitHub if enabled
    const extractionData = {
      url,
      title: processedArticle.title,
      success: response.kindle === 'sent' || response.zotero === 'sent',
      extraction_status: 'success',
      kindle_status: response.kindle,
      zotero_status: response.zotero,
      bookmarklet_log: bookmarkletLog,
      payload: req.body,
      config_used: configUsed,
      content_diagnostics: contentDiagnostics,
      email_content: results[0].value?.emailContent || '',
      epub_base64: results[1].value?.epubBase64 || results[0].value?.epubBase64 || ''
    };

    // Capture debug asynchronously - don't block the response
    debugLogger.captureToGitHub(extractionData).catch(err => {
      console.error('Debug capture failed (non-blocking):', err.message);
    });

    res.json(response);

  } catch (error) {
    debugLogger.log('error', 'Error processing article', { error: error.message, stack: error.stack });

    // Still try to capture debug on error
    const errorContentDiagnostics = buildContentDiagnosticsFromPayload(req.body.article || {});
    const extractionData = {
      url: req.body.url,
      title: req.body.article?.title || 'Unknown',
      success: false,
      extraction_status: 'error',
      kindle_status: 'error',
      zotero_status: 'error',
      bookmarklet_log: bookmarkletLog,
      payload: req.body,
      config_used: null,
      content_diagnostics: errorContentDiagnostics,
      email_content: '',
      epub_base64: '',
      error: error.message
    };

    // Capture debug even on error (non-blocking)
    debugLogger.captureToGitHub(extractionData).catch(err => {
      console.error('Debug capture failed (non-blocking):', err.message);
    });

    res.status(500).json({
      error: 'Failed to process article',
      message: error.message
    });
  }
});

// Debug endpoints for archived Kindle payloads (gated)
app.get('/debug/kindle-payloads', async (req, res) => {
  if (!authorizeKindleArchive(req, res)) return;

  try {
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 200)
      : 50;

    const payloads = await listKindlePayloads({ limit });
    res.json({
      success: true,
      count: payloads.length,
      payloads
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to list Kindle payloads',
      message: error.message
    });
  }
});

app.get('/debug/kindle-payloads/:id', async (req, res) => {
  if (!authorizeKindleArchive(req, res)) return;

  try {
    const { id } = req.params;
    const { html, metadata } = await getKindlePayload(id);

    if (req.query.format === 'json') {
      return res.json({
        success: true,
        metadata,
        html
      });
    }

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('X-Kindle-Archive-Id', metadata.id || id);
    res.set('X-Kindle-Archive-Hash', metadata.hash || '');
    res.set('X-Kindle-Archive-Timestamp', metadata.timestamp || '');
    return res.send(html);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Archive entry not found' });
    }
    return res.status(500).json({
      error: 'Failed to fetch Kindle payload',
      message: error.message
    });
  }
});

app.post('/debug/capture-article', async (req, res) => {
  if (!authorizeKindleArchive(req, res)) return;

  try {
    const { url, article } = req.body || {};

    if (!article) {
      return res.status(400).json({ error: 'Article content is required' });
    }

    const processedArticle = { ...article };
    if (url && !processedArticle.url) {
      processedArticle.url = url;
    }

    if (article.content_b64) {
      try {
        const decoded = Buffer.from(article.content_b64, 'base64').toString('utf8');
        const rawContent = article.content || '';
        processedArticle.content = decoded.length > rawContent.length ? decoded : rawContent;
      } catch (error) {
        processedArticle.content = article.content || '';
      }
    }

    const htmlContent = createKindleHTML(processedArticle);
    const metrics = getPayloadMetrics(htmlContent);

    let hostname = null;
    if (processedArticle.url) {
      try {
        hostname = new URL(processedArticle.url).hostname;
      } catch {
        hostname = null;
      }
    }

    const archiveMetadata = await storeKindlePayload({
      html: htmlContent,
      title: processedArticle.title,
      url: processedArticle.url,
      hostname: hostname || undefined,
      metrics
    });

    res.json({
      success: true,
      archive: archiveMetadata,
      metrics
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to capture article payload',
      message: error.message
    });
  }
});

// Test endpoint for debug system
app.post('/test-debug', async (req, res) => {
  const debugLogger = new DebugLogger();

  try {
    debugLogger.log('test', 'Debug system test initiated');

    // Create test data
    const testData = {
      url: 'https://example.com/test-article',
      title: 'Test Debug Capture',
      success: true,
      extraction_status: 'test',
      kindle_status: 'test',
      zotero_status: 'test',
      bookmarklet_log: [
        { timestamp: Date.now(), category: 'test', message: 'Test log entry' }
      ],
      payload: { test: true, timestamp: new Date().toISOString() },
      config_used: null,
      email_content: '<h1>Test Email Content</h1>',
      epub_base64: Buffer.from('Test EPUB content').toString('base64')
    };

    debugLogger.log('test', 'Attempting to capture to GitHub');

    // For testing, we'll wait for the capture to complete
    // But add a timeout to prevent hanging
    const capturePromise = debugLogger.captureToGitHub(testData);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Debug capture timed out after 10s')), 10000)
    );

    try {
      await Promise.race([capturePromise, timeoutPromise]);
      res.json({
        success: true,
        message: 'Debug test completed - check latest-outputs-debug branch',
        timestamp: new Date().toISOString()
      });
    } catch (timeoutError) {
      // If it times out, still return success but note the timeout
      res.json({
        success: true,
        message: 'Debug test initiated but timed out - check logs',
        warning: timeoutError.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Debug test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
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
