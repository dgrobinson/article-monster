const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const puppeteer = require('puppeteer');
const ConfigFetcher = require('../../src/configFetcher');

const FIXTURE_URL = process.env.FIXTURE_URL || 'https://www.newyorker.com/magazine/2025/08/18/baldwin-a-love-story-nicholas-boggs-book-review';
const FIXTURE_PATH = process.env.FIXTURE_PATH || path.join(__dirname, '..', '..', 'test-cases', 'solved', 'newyorker-baldwin.html');
const SERVICE_ORIGIN = process.env.SERVICE_ORIGIN || 'https://debug.local';
const LAUNCH_TIMEOUT = Number.parseInt(process.env.PUPPETEER_LAUNCH_TIMEOUT || '120000', 10);

async function run() {
  const html = await fs.readFile(FIXTURE_PATH, 'utf8');
  const hostname = new URL(FIXTURE_URL).hostname.replace(/^www\./, '');
  const configFetcher = new ConfigFetcher();
  const config = await configFetcher.getConfigForSite(hostname);
  const configPayload = config ? { success: true, config } : { success: false };

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : undefined,
    timeout: LAUNCH_TIMEOUT,
    protocolTimeout: LAUNCH_TIMEOUT
  });

  try {
    const bookmarkletCode = await fs.readFile(
      path.join(__dirname, '..', '..', 'public', 'bookmarklet.js'),
      'utf8'
    );

    const production = await runExtraction(browser, {
      mode: 'production',
      html,
      bookmarkletCode,
      configPayload
    });

    const debug = await runExtraction(browser, {
      mode: 'debug',
      html,
      bookmarkletCode,
      configPayload
    });

    const productionSummary = summarize(production.article);
    const debugSummary = summarize(debug.article);
    const comparison = compareSummaries(productionSummary, debugSummary);

    console.log(JSON.stringify({
      fixtureUrl: FIXTURE_URL,
      configAvailable: !!config,
      production: productionSummary,
      debug: debugSummary,
      match: comparison.ok,
      differences: comparison.diffs
    }, null, 2));

    if (!comparison.ok) {
      process.exit(1);
    }
  } finally {
    await browser.close();
  }
}

async function runExtraction(browser, { mode, html, bookmarkletCode, configPayload }) {
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  page.on('request', req => {
    if (req.isNavigationRequest() && req.url() === FIXTURE_URL) {
      req.respond({
        status: 200,
        contentType: 'text/html',
        body: html
      });
      return;
    }

    if (req.url().startsWith('data:') || req.url() === 'about:blank') {
      req.continue();
      return;
    }

    req.abort();
  });

  await page.goto(FIXTURE_URL, { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(
    ({ mode, bookmarkletCode, configPayload, serviceOrigin }) => {
      return new Promise((resolve, reject) => {
        let done = false;

        function finish(payload) {
          if (done) return;
          done = true;
          resolve(payload);
        }

        window.__BOOKMARKLET_SERVICE_URL__ = serviceOrigin + '/process-article';

        const originalFetch = window.fetch.bind(window);
        window.fetch = function(url, options) {
          const target = String(url || '');
          if (target.indexOf('/site-config/') !== -1) {
            return Promise.resolve(new Response(JSON.stringify(configPayload), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }));
          }

          if (target.indexOf('/process-article') !== -1) {
            let body = {};
            try {
              body = JSON.parse(options && options.body ? options.body : '{}');
            } catch (e) {}
            finish({ article: body.article || null });
            return Promise.resolve(new Response(JSON.stringify({
              kindle: 'sent',
              zotero: 'sent',
              article: { title: (body.article || {}).title || '' }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }));
          }

          return originalFetch(url, options);
        };

        if (mode === 'debug') {
          window.__ARTICLE_MONSTER_DEBUG_HOOK__ = function(payload) {
            finish({ article: payload && payload.article ? payload.article : null });
            return { skipSend: true };
          };
        }

        setTimeout(() => {
          if (!done) reject(new Error('Timed out waiting for extraction'));
        }, 15000);

        try {
          eval(bookmarkletCode);
        } catch (e) {
          reject(e);
        }
      });
    },
    {
      mode,
      bookmarkletCode,
      configPayload,
      serviceOrigin: SERVICE_ORIGIN
    }
  );

  await page.close();
  return result;
}

function summarize(article) {
  const html = (article && article.content) || '';
  const text = (article && article.textContent) || '';
  return {
    title: (article && article.title) || '',
    extractionMethod: (article && (article.extractionMethod || article.source)) || '',
    configSource: (article && article.configSource) || '',
    contentLength: html.length,
    textLength: text.length,
    pCount: (html.match(/<p[^>]*>/gi) || []).length,
    imgCount: (html.match(/<img\b/gi) || []).length,
    contentHash: hash(html),
    textHash: hash(text)
  };
}

function compareSummaries(production, debug) {
  const diffs = [];
  if (production.title !== debug.title) diffs.push('title');
  if (production.contentHash !== debug.contentHash) diffs.push('content');
  if (production.textHash !== debug.textHash) diffs.push('text');
  if (production.pCount !== debug.pCount) diffs.push('pCount');
  if (production.imgCount !== debug.imgCount) diffs.push('imgCount');
  return { ok: diffs.length === 0, diffs };
}

function hash(value) {
  return crypto.createHash('sha256').update(value || '').digest('hex');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
