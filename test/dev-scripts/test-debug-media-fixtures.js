#!/usr/bin/env node

require('../support/network-guard');

const { JSDOM } = require('jsdom');
const { readFixtureText } = require('../support/fixtures');

const pageUrl = 'https://fixtures.article-monster.test/debug-media/article.html';

function fail(message) {
  console.error('Debug media fixture test failed:', message);
  process.exit(1);
}

function run() {
  const html = readFixtureText(pageUrl);
  const dom = new JSDOM(html, { url: pageUrl });
  const document = dom.window.document;

  const images = Array.from(document.querySelectorAll('img'));
  if (images.length < 3) {
    fail('expected at least 3 images in fixture');
  }

  const srcs = images.map(img => img.getAttribute('src')).filter(Boolean);
  const relative = srcs.filter(src => !src.startsWith('http') && !src.startsWith('data:'));
  const absolute = srcs.filter(src => src.startsWith('http'));

  if (relative.length < 2) {
    fail('expected at least 2 relative image sources');
  }
  if (absolute.length < 1) {
    fail('expected at least 1 absolute image source');
  }

  const normalized = relative.map(src => new URL(src, pageUrl).href).sort();
  const expected = [
    'https://fixtures.article-monster.test/debug-media/images/hero.jpg',
    'https://fixtures.article-monster.test/debug-media/images/inline.png'
  ].sort();

  if (JSON.stringify(normalized) !== JSON.stringify(expected)) {
    fail(`normalized URLs mismatch: ${JSON.stringify(normalized)}`);
  }

  const hasLazy = images.some(img => img.hasAttribute('data-src'));
  if (!hasLazy) {
    fail('expected at least one lazy-load attribute');
  }

  console.log('Debug media fixture test passed.');
}

run();
