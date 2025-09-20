const puppeteer = require('puppeteer');

async function run() {
  const serviceOrigin = process.env.SERVICE_ORIGIN || 'https://seal-app-t4vff.ondigitalocean.app';
  const url = 'https://www.sapienism.com/post/burning-bridges-skipping-stones';

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : undefined
  });
  const page = await browser.newPage();

  let payload = null;
  await page.setRequestInterception(true);
  page.on('request', req => {
    if (req.url().startsWith(serviceOrigin + '/process-article') && req.method() === 'POST') {
      try {
        payload = JSON.parse(req.postData() || '{}');
      } catch {}
    }
    req.continue();
  });

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Inject production loader (no embedded code)
  const injected = await page.evaluate((origin) => {
    try {
      window.__BOOKMARKLET_SERVICE_URL__ = origin + '/process-article';
      var id = 'article-monster-script';
      var s = document.getElementById(id);
      if (s && s.parentNode) s.parentNode.removeChild(s);
      s = document.createElement('script');
      s.id = id;
      s.src = origin + '/bookmarklet.js?v=' + Date.now();
      document.body.appendChild(s);
      return true;
    } catch (e) {
      return { error: e && e.message };
    }
  }, serviceOrigin);

  // Wait for the request to be sent
  const start = Date.now();
  while (!payload && Date.now() - start < 15000) {
    await new Promise(r => setTimeout(r, 250));
  }

  const summary = payload ? summarizePayload(payload) : { error: 'No payload captured' };
  console.log(JSON.stringify({ serviceOrigin, url, injected, summary }, null, 2));

  await browser.close();
}

function summarizePayload(p) {
  const a = p && p.article || {};
  const html = a && a.content || '';
  const base64 = a && a.content_b64 || '';
  const decoded = base64 ? Buffer.from(base64, 'base64').toString('utf8') : '';
  return {
    title: a.title,
    contentLength: html.length,
    textContentLength: (a.textContent || '').length,
    pCount: (html.match(/<p[^>]*>/gi) || []).length,
    brCount: (html.match(/<br[^>]*>/gi) || []).length,
    newlineCount: (html.match(/\n/g) || []).length,
    hasBase64: !!base64,
    decodedLength: decoded.length,
    decodedPCount: (decoded.match(/<p[^>]*>/gi) || []).length
  };
}

run().catch(e => { console.error(e); process.exit(1); });


