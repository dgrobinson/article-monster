#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const puppeteer = require('puppeteer');
const { createKindleHTML } = require('../src/kindleSender');
const { getPayloadMetrics, storeKindlePayload } = require('../src/kindleArchive');

const DEFAULT_SERVICE_ORIGIN = process.env.SERVICE_ORIGIN || 'https://seal-app-t4vff.ondigitalocean.app';
const DEFAULT_MODE = 'local';
const DEFAULT_BOOKMARKLET_SOURCE = 'remote';

function printUsage() {
  console.log('Usage: node scripts/capture-bookmarklet.js --url <article-url> [options]');
  console.log('');
  console.log('Options:');
  console.log('  --mode <local|server>          Archive locally or via server endpoint (default: local)');
  console.log('  --service-origin <origin>      Service origin for configs/bookmarklet');
  console.log('  --bookmarklet-source <remote|local>  Load bookmarklet from service or local file');
  console.log('  --token <token>                Debug token for server capture endpoint');
  console.log('  --headful                      Run Chrome with a visible window');
  console.log('  --timeout-ms <ms>              Capture timeout in milliseconds (default: 20000)');
}

function parseArgs(argv) {
  const options = {
    url: null,
    mode: DEFAULT_MODE,
    serviceOrigin: DEFAULT_SERVICE_ORIGIN,
    bookmarkletSource: DEFAULT_BOOKMARKLET_SOURCE,
    token: process.env.KINDLE_ARCHIVE_DEBUG_TOKEN || '',
    headful: false,
    timeoutMs: 20000
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
    if (arg === '--url' || arg === '-u') {
      options.url = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--mode') {
      options.mode = (argv[i + 1] || '').toLowerCase();
      i += 1;
      continue;
    }
    if (arg === '--service-origin') {
      options.serviceOrigin = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--bookmarklet-source') {
      options.bookmarkletSource = (argv[i + 1] || '').toLowerCase();
      i += 1;
      continue;
    }
    if (arg === '--token') {
      options.token = argv[i + 1] || '';
      i += 1;
      continue;
    }
    if (arg === '--headful') {
      options.headful = true;
      continue;
    }
    if (arg === '--timeout-ms') {
      const parsed = Number.parseInt(argv[i + 1], 10);
      if (Number.isFinite(parsed)) {
        options.timeoutMs = parsed;
      }
      i += 1;
    }
  }

  return options;
}

function resolveExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.platform === 'darwin') {
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }
  return undefined;
}

function normalizeServiceOrigin(origin) {
  return origin.replace(/\/+$/, '');
}

function prepareArticlePayload(payload) {
  const article = payload.article || {};
  const processed = { ...article };

  if (payload.url && !processed.url) {
    processed.url = payload.url;
  }

  if (article.content_b64) {
    try {
      const decoded = Buffer.from(article.content_b64, 'base64').toString('utf8');
      const rawContent = article.content || '';
      processed.content = decoded.length > rawContent.length ? decoded : rawContent;
    } catch (error) {
      processed.content = article.content || '';
    }
  }

  return processed;
}

async function injectBookmarklet(page, { serviceOrigin, bookmarkletSource }) {
  const serviceUrl = `${serviceOrigin}/process-article`;

  await page.evaluate((url) => {
    window.__BOOKMARKLET_SERVICE_URL__ = url;
    window.__CAPTURED_PAYLOAD__ = null;
    const originalFetch = window.fetch.bind(window);
    window.fetch = (input, init) => {
      const target = typeof input === 'string' ? input : (input && input.url) || '';
      if (target.includes('/process-article') && init && init.method === 'POST') {
        try {
          window.__CAPTURED_PAYLOAD__ = JSON.parse(init.body);
        } catch (error) {
          window.__CAPTURED_PAYLOAD__ = { error: 'Failed to parse payload', message: error.message };
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, kindle: 'skipped', zotero: 'skipped' })
        });
      }
      return originalFetch(input, init);
    };
  }, serviceUrl);

  if (bookmarkletSource === 'local') {
    const code = await fs.readFile(path.join(__dirname, '..', 'public', 'bookmarklet.js'), 'utf8');
    await page.addScriptTag({ content: code });
    return { injected: 'local' };
  }

  const url = `${serviceOrigin}/bookmarklet.js?v=${Date.now()}`;
  await page.addScriptTag({ url });
  return { injected: 'remote', url };
}

async function waitForPayload(page, timeoutMs) {
  await page.waitForFunction(() => window.__CAPTURED_PAYLOAD__, { timeout: timeoutMs });
  return page.evaluate(() => window.__CAPTURED_PAYLOAD__);
}

async function archiveLocally(payload) {
  const processed = prepareArticlePayload(payload);
  const htmlContent = createKindleHTML(processed);
  const metrics = getPayloadMetrics(htmlContent);

  let hostname = null;
  if (processed.url) {
    try {
      hostname = new URL(processed.url).hostname;
    } catch {
      hostname = null;
    }
  }

  const archiveMetadata = await storeKindlePayload({
    html: htmlContent,
    title: processed.title,
    url: processed.url,
    hostname: hostname || undefined,
    metrics
  });

  return { archive: archiveMetadata, metrics };
}

async function archiveOnServer(payload, { serviceOrigin, token }) {
  const target = `${serviceOrigin}/debug/capture-article`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['x-debug-token'] = token;
  }

  const response = await fetch(target, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Server capture failed (${response.status}): ${text}`);
  }

  return response.json();
}

async function run() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.url) {
    printUsage();
    process.exit(1);
  }

  const serviceOrigin = normalizeServiceOrigin(options.serviceOrigin);
  const browser = await puppeteer.launch({
    headless: options.headful ? false : 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: resolveExecutablePath()
  });

  try {
    const page = await browser.newPage();
    await page.setBypassCSP(true);
    await page.goto(options.url, { waitUntil: 'networkidle2', timeout: 60000 });

    const injection = await injectBookmarklet(page, {
      serviceOrigin,
      bookmarkletSource: options.bookmarkletSource
    });

    const payload = await waitForPayload(page, options.timeoutMs);

    if (!payload || payload.error) {
      throw new Error(payload && payload.error ? payload.error : 'No payload captured');
    }

    let result;
    if (options.mode === 'server') {
      result = await archiveOnServer(payload, { serviceOrigin, token: options.token });
    } else {
      result = await archiveLocally(payload);
    }

    console.log(JSON.stringify({
      mode: options.mode,
      url: options.url,
      injected: injection,
      archive: result.archive || null,
      metrics: result.metrics || null
    }, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
