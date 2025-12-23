#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const repoRoot = path.join(__dirname, '..', '..');
const bookmarkletPath = path.join(repoRoot, 'public', 'bookmarklet.js');
const bookmarkletCode = fs.readFileSync(bookmarkletPath, 'utf8');

function makeConfig(overrides) {
  return Object.assign({
    title: [],
    body: [],
    author: [],
    date: [],
    strip: [],
    strip_id_or_class: [],
    strip_attr: [],
    post_strip_attr: [],
    dissolve: [],
    skip_id_or_class: [],
    strip_image_src: [],
    if_page_contains: [],
    native_ad_clue: [],
    src_lazy_load_attr: [],
    htmlPreprocessing: [],
    prune: null,
    tidy: null,
    autodetect_on_failure: null,
    parser: null,
    strip_comments: null,
    skip_json_ld: null,
    convert_double_br_tags: null,
    insert_detected_image: null
  }, overrides);
}

function runExtraction({ html, url, config, mode }) {
  const dom = new JSDOM(html, { url });
  const { window } = dom;
  window.__BOOKMARKLET_TEST__ = true;
  window.sessionStorage = {
    _data: {},
    getItem: function(key) { return this._data[key] || null; },
    setItem: function(key, value) { this._data[key] = value; },
    removeItem: function(key) { delete this._data[key]; }
  };

  const executeBookmarklet = new Function('window', 'document', 'sessionStorage', 'XPathResult', 'NodeFilter', 'Node', `
    ${bookmarkletCode}
    return window.__ArticleMonsterTestHooks;
  `);

  const hooks = executeBookmarklet(
    window,
    window.document,
    window.sessionStorage,
    window.XPathResult,
    window.NodeFilter,
    window.Node
  );
  if (!hooks || !hooks.Readability) {
    throw new Error('Failed to load bookmarklet test hooks');
  }

  if (config) {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    window.sessionStorage.setItem('siteConfig_' + hostname, JSON.stringify({
      config,
      timestamp: Date.now()
    }));
  }

  const reader = new hooks.Readability(window.document);
  if (mode === 'parse') {
    return reader.parse();
  }
  return reader._extractWithSiteConfig();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const longJsonText = Array(120).fill('Json content').join(' ');

const tests = [
  {
    name: 'strip_attr removes attribute nodes',
    mode: 'site-config',
    url: 'https://example.com/strip-attr',
    html: '<html><body><div id="content"><img data-src="lazy.jpg" src="real.jpg"></div></body></html>',
    config: makeConfig({
      body: ['//div[@id="content"]'],
      strip_attr: ['//img/@data-src']
    }),
    verify: (result) => {
      assert(result && result.content, 'Expected content for strip_attr');
      assert(result.content.indexOf('data-src=') === -1, 'data-src attribute should be removed');
    }
  },
  {
    name: 'post_strip_attr removes attributes after cleanup',
    mode: 'site-config',
    url: 'https://example.com/post-strip-attr',
    html: '<html><body><div id="content" class="root"><p class="para">Text</p></div></body></html>',
    config: makeConfig({
      body: ['//div[@id="content"]'],
      post_strip_attr: ['//*/@class']
    }),
    verify: (result) => {
      assert(result && result.content, 'Expected content for post_strip_attr');
      assert(result.content.indexOf('class=') === -1, 'class attributes should be removed');
    }
  },
  {
    name: 'strip_comments removes HTML comments',
    mode: 'site-config',
    url: 'https://example.com/strip-comments',
    html: '<html><body><div id="content">Text<!--comment--><span>More</span></div></body></html>',
    config: makeConfig({
      body: ['//div[@id="content"]'],
      strip_comments: true
    }),
    verify: (result) => {
      assert(result && result.content, 'Expected content for strip_comments');
      assert(result.content.indexOf('<!--') === -1, 'Comments should be removed');
    }
  },
  {
    name: 'dissolve unwraps nodes',
    mode: 'site-config',
    url: 'https://example.com/dissolve',
    html: '<html><body><div id="content"><div class="wrap"><span>Inner</span></div></div></body></html>',
    config: makeConfig({
      body: ['//div[@id="content"]'],
      dissolve: ['//div[@class="wrap"]']
    }),
    verify: (result) => {
      assert(result && result.content, 'Expected content for dissolve');
      assert(result.content.indexOf('class="wrap"') === -1, 'Wrapper div should be dissolved');
      assert(result.content.indexOf('Inner') !== -1, 'Inner content should remain');
    }
  },
  {
    name: 'skip_id_or_class skips bad body candidates',
    mode: 'site-config',
    url: 'https://example.com/skip-id',
    html: '<html><body><div id="bad"><div class="skipme">Skip</div><p>Bad</p></div><div id="good"><p>Good</p></div></body></html>',
    config: makeConfig({
      body: ['//div[@id="bad"]', '//div[@id="good"]'],
      skip_id_or_class: ['skipme']
    }),
    verify: (result) => {
      assert(result && result.content, 'Expected content for skip_id_or_class');
      assert(result.content.indexOf('Good') !== -1, 'Good content should be used');
      assert(result.content.indexOf('Bad') === -1, 'Bad content should be skipped');
    }
  },
  {
    name: 'skip_json_ld blocks JSON-LD fallback',
    mode: 'parse',
    url: 'https://example.com/skip-json-ld',
    html: `<html><head>
      <script type="application/ld+json">
        {"@type":"Article","headline":"Json Title","articleBody":"${longJsonText}"}
      </script>
      </head><body>
      <article><h1>Dom Title</h1><p>Dom content here.</p></article>
      </body></html>`,
    config: makeConfig({
      body: ['//div[@id="missing"]'],
      skip_json_ld: true
    }),
    verify: (result) => {
      assert(result && result.content, 'Expected content for skip_json_ld');
      assert(result.extractionMethod === 'dom-fallback', 'Expected DOM fallback when JSON-LD is skipped');
    }
  },
  {
    name: 'convert_double_br_tags turns BR pairs into paragraphs',
    mode: 'site-config',
    url: 'https://example.com/double-br',
    html: '<html><body><div id="content">Line one<br><br>Line two</div></body></html>',
    config: makeConfig({
      body: ['//div[@id="content"]'],
      convert_double_br_tags: true
    }),
    verify: (result) => {
      assert(result && result.content, 'Expected content for convert_double_br_tags');
      assert(result.content.toLowerCase().indexOf('<p>') !== -1, 'Paragraph tags should be inserted');
      assert(result.content.toLowerCase().indexOf('<br') === -1, 'BR tags should be converted');
    }
  },
  {
    name: 'if_page_contains allows matching pages',
    mode: 'site-config',
    url: 'https://example.com/if-page-contains',
    html: '<html><body><div id="marker">Ok</div><div id="content">Body</div></body></html>',
    config: makeConfig({
      body: ['//div[@id="content"]'],
      if_page_contains: ['//div[@id="marker"]']
    }),
    verify: (result) => {
      assert(result && result.content, 'Expected content for if_page_contains match');
      assert(result.content.indexOf('Body') !== -1, 'Body should be extracted');
    }
  },
  {
    name: 'if_page_contains blocks non-matching pages',
    mode: 'site-config',
    url: 'https://example.com/if-page-contains-miss',
    html: '<html><body><div id="content">Body</div></body></html>',
    config: makeConfig({
      body: ['//div[@id="content"]'],
      if_page_contains: ['//div[@id="missing"]']
    }),
    verify: (result) => {
      assert(result === null, 'Expected null when if_page_contains fails');
    }
  },
  {
    name: 'native_ad_clue flags native ads',
    mode: 'site-config',
    url: 'https://example.com/native-ad',
    html: '<html><head><meta name="sponsored" content="yes"></head><body><div id="content">Body</div></body></html>',
    config: makeConfig({
      body: ['//div[@id="content"]'],
      native_ad_clue: ['//meta[@name="sponsored"]']
    }),
    verify: (result) => {
      assert(result && result.content, 'Expected content for native_ad_clue');
      assert(result.nativeAdDetected === true, 'Native ad should be detected');
      assert(result.nativeAdClue, 'Native ad clue should be recorded');
    }
  },
  {
    name: 'insert_detected_image adds og:image when enabled',
    mode: 'site-config',
    url: 'https://example.com/insert-image',
    html: '<html><head><meta property="og:image" content="https://example.com/lead.jpg"></head><body><div id="content">Body</div></body></html>',
    config: makeConfig({
      body: ['//div[@id="content"]'],
      insert_detected_image: true
    }),
    verify: (result) => {
      assert(result && result.content, 'Expected content for insert_detected_image');
      assert(result.content.indexOf('lead.jpg') !== -1, 'Lead image should be inserted');
    }
  },
  {
    name: 'insert_detected_image respects no',
    mode: 'site-config',
    url: 'https://example.com/no-insert-image',
    html: '<html><head><meta property="og:image" content="https://example.com/lead.jpg"></head><body><div id="content">Body</div></body></html>',
    config: makeConfig({
      body: ['//div[@id="content"]'],
      insert_detected_image: false
    }),
    verify: (result) => {
      assert(result && result.content, 'Expected content for insert_detected_image no');
      assert(result.content.indexOf('lead.jpg') === -1, 'Lead image should not be inserted');
    }
  },
  {
    name: 'src_lazy_load_attr promotes lazy src',
    mode: 'site-config',
    url: 'https://example.com/lazy-src',
    html: '<html><body><div id="content"><img data-src="lazy.jpg"></div></body></html>',
    config: makeConfig({
      body: ['//div[@id="content"]'],
      src_lazy_load_attr: ['data-src']
    }),
    verify: (result) => {
      assert(result && result.content, 'Expected content for src_lazy_load_attr');
      assert(result.content.indexOf('src="lazy.jpg"') !== -1, 'Lazy src should be promoted');
      assert(result.content.indexOf('data-src=') === -1, 'Lazy attribute should be removed');
    }
  }
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    const result = runExtraction(test);
    test.verify(result);
    console.log('PASS', test.name);
    passed += 1;
  } catch (error) {
    console.log('FAIL', test.name, '-', error.message);
    failed += 1;
  }
}

console.log(`\nDirectives cleaning tests: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
