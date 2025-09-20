const puppeteer = require('puppeteer');

async function run() {
  const origin = process.env.ORIGIN || 'http://localhost:5173';
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : undefined
  });
  const page = await browser.newPage();

  const requests = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('/bookmarklet.js') || url.includes('/bookmarklet-debug.js')) {
      requests.push(url);
      // console.log('Request:', url);
    }
  });

  let ok = true;
  try {
    await page.goto(origin, { waitUntil: 'domcontentloaded' });

    // Main bookmarklet
    await page.waitForSelector('#bookmarklet-link', { timeout: 5000 });
    const href = await page.$eval('#bookmarklet-link', el => el.getAttribute('href'));
    if (!href || !href.startsWith('javascript:')) throw new Error('bookmarklet href missing');

    const code = decodeURIComponent(href.replace(/^javascript:/, ''));
    await page.evaluate(code);

    // Wait for injected script element
    await page.waitForFunction(() => !!document.getElementById('article-monster-script'), { timeout: 5000 });
    const scriptSrc = await page.$eval('#article-monster-script', s => s.src);

    // Debug bookmarklet
    await page.waitForSelector('#debug-bookmarklet-link', { timeout: 5000 });
    const dhref = await page.$eval('#debug-bookmarklet-link', el => el.getAttribute('href'));
    const dcode = decodeURIComponent(dhref.replace(/^javascript:/, ''));
    await page.evaluate(dcode);

    // Wait for debug script element
    await page.waitForFunction(() => !!document.getElementById('article-monster-debug-script'), { timeout: 5000 });
    const dscriptSrc = await page.$eval('#article-monster-debug-script', s => s.src);

    const fetchedMain = requests.some(u => u.includes('/bookmarklet.js')) || /\/bookmarklet\.js/.test(scriptSrc);
    const fetchedDebug = requests.some(u => u.includes('/bookmarklet-debug.js')) || /\/bookmarklet-debug\.js/.test(dscriptSrc);

    console.log('Loader test results:', {
      origin,
      mainScriptInjected: !!scriptSrc,
      mainScriptSrc: scriptSrc,
      debugScriptInjected: !!dscriptSrc,
      debugScriptSrc: dscriptSrc,
      requested: requests,
      fetchedMain,
      fetchedDebug
    });

    if (!fetchedMain || !fetchedDebug) {
      ok = false;
      throw new Error('Loader did not fetch expected scripts');
    }
  } catch (e) {
    ok = false;
    console.error('Loader test failed:', e.message);
  } finally {
    await browser.close();
  }

  if (!ok) process.exit(1);
}

run();


