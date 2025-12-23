#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const repoRoot = path.join(__dirname, '..', '..');
const bookmarkletCode = fs.readFileSync(path.join(repoRoot, 'public', 'bookmarklet.js'), 'utf8');
const SERVICE_URL = 'https://service.test/process-article';

function loadFixture(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function createSessionStorage() {
  return {
    _data: {},
    getItem: function(key) { return this._data[key] || null; },
    setItem: function(key, value) { this._data[key] = String(value); },
    removeItem: function(key) { delete this._data[key]; }
  };
}

function buildConfig(overrides) {
  return Object.assign({
    title: [],
    body: [],
    author: [],
    date: [],
    strip: [],
    strip_id_or_class: [],
    strip_image_src: [],
    single_page_link: [],
    next_page_link: [],
    htmlPreprocessing: [],
    prune: null,
    tidy: null,
    autodetect_on_failure: null,
    autodetect_next_page: null
  }, overrides);
}

function countOccurrences(haystack, needle) {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

async function runTestCase(testCase) {
  console.log(`\n📖 Pagination test: ${testCase.name}`);
  console.log('─'.repeat(50));

  const page1Html = loadFixture(testCase.page1);
  const dom = new JSDOM(page1Html, {
    url: testCase.url,
    runScripts: 'dangerously'
  });

  const window = dom.window;
  window.__BOOKMARKLET_SERVICE_URL__ = SERVICE_URL;
  window.alert = function() {};
  window.confirm = function() { return true; };
  window.sessionStorage = window.sessionStorage || createSessionStorage();
  if (!window.btoa) {
    window.btoa = function(str) {
      return Buffer.from(str, 'binary').toString('base64');
    };
  }

  const hostname = new URL(testCase.url).hostname.replace(/^www\./, '');
  window.sessionStorage.setItem('siteConfig_' + hostname, JSON.stringify({
    config: testCase.config,
    timestamp: Date.now()
  }));

  const fixtureMap = {};
  testCase.pages.forEach((page) => {
    fixtureMap[page.url] = loadFixture(page.path);
  });

  const result = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Bookmarklet extraction timed out'));
    }, 5000);

    window.fetch = function(url, options) {
      if (url === SERVICE_URL) {
        try {
          const body = JSON.parse(options.body || '{}');
          clearTimeout(timeout);
          resolve(body.article);
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, kindle: 'sent', zotero: 'sent', article: { title: body.article.title } })
          });
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
          return Promise.resolve({ ok: false, json: () => Promise.resolve({ success: false }) });
        }
      }

      if (fixtureMap[url]) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(fixtureMap[url])
        });
      }

      if (url.includes('/site-config/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, config: testCase.config })
        });
      }

      return Promise.reject(new Error('Unexpected fetch: ' + url));
    };

    try {
      window.eval(bookmarkletCode);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });

  if (!result || !result.content) {
    throw new Error('No content extracted');
  }

  const plainText = result.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  testCase.expectedPhrases.forEach((phrase) => {
    if (!plainText.includes(phrase)) {
      throw new Error(`Missing phrase: ${phrase}`);
    }
    console.log(`✅ Found: "${phrase}"`);
  });

  if (testCase.expectedOnce) {
    const count = countOccurrences(plainText, testCase.expectedOnce);
    if (count !== 1) {
      throw new Error(`Expected "${testCase.expectedOnce}" once, found ${count}`);
    }
    console.log(`✅ De-dup verified for: "${testCase.expectedOnce}"`);
  }

  console.log(`✅ Extracted length: ${plainText.length} chars`);
  dom.window.close();
}

async function runTests() {
  const testCases = [
    {
      name: 'Next page link pagination',
      url: 'https://example.com/article?page=1',
      page1: 'test/fixtures/pagination/next-page-link/page1.html',
      pages: [
        { url: 'https://example.com/article?page=2', path: 'test/fixtures/pagination/next-page-link/page2.html' }
      ],
      config: buildConfig({
        title: ['//article/h1'],
        body: ['//article'],
        next_page_link: ['//nav[contains(@class, "pager")]//a[contains(@class, "next")]/@href'],
        autodetect_next_page: false
      }),
      expectedPhrases: ['Page 1 unique phrase alpha.', 'Page 2 unique phrase beta.'],
      expectedOnce: 'Pagination Fixture'
    },
    {
      name: 'Autodetect next page pagination',
      url: 'https://example.com/story?part=1',
      page1: 'test/fixtures/pagination/autodetect-next-page/page1.html',
      pages: [
        { url: 'https://example.com/story?part=2', path: 'test/fixtures/pagination/autodetect-next-page/page2.html' }
      ],
      config: buildConfig({
        title: ['//article/h1'],
        body: ['//article'],
        autodetect_next_page: true
      }),
      expectedPhrases: ['Autodetect page one unique phrase.', 'Autodetect page two unique phrase.'],
      expectedOnce: 'Autodetect Fixture'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      await runTestCase(testCase);
      passed += 1;
    } catch (error) {
      failed += 1;
      console.error(`❌ ${testCase.name} failed:`, error.message);
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);

  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch((error) => {
  console.error('Pagination test run failed:', error);
  process.exit(1);
});
