#!/usr/bin/env node

require('../support/network-guard');

const { JSDOM } = require('jsdom');
const {
  installFixtureNetwork,
  readFixtureText
} = require('../support/fixtures');

const page1Url = 'https://fixtures.article-monster.test/pagination/page-1.html';
const page2Url = 'https://fixtures.article-monster.test/pagination/page-2.html';
const configUrl = 'https://fixtures.article-monster.test/site-config/fixtures.article-monster.test';

function fail(message) {
  console.error('Pagination fixture test failed:', message);
  process.exit(1);
}

function getFirstNode(dom, xpath) {
  const doc = dom.window.document;
  const result = doc.evaluate(
    xpath,
    doc,
    null,
    dom.window.XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );
  return result.singleNodeValue || null;
}

function getFirstValue(dom, xpath) {
  const node = getFirstNode(dom, xpath);
  if (!node) return null;
  if (node.nodeType === 2) return node.value;
  return node.textContent || node.innerHTML || null;
}

async function run() {
  const page1Html = readFixtureText(page1Url);
  const dom1 = new JSDOM(page1Html, { url: page1Url });
  installFixtureNetwork(dom1.window);

  const xhr = new dom1.window.XMLHttpRequest();
  xhr.open('GET', configUrl, false);
  xhr.send();
  const configPayload = JSON.parse(xhr.responseText);
  const config = configPayload && configPayload.config;

  if (!config || !Array.isArray(config.body) || config.body.length === 0) {
    fail('fixture config missing body selector');
  }
  if (!Array.isArray(config.next_page_link) || config.next_page_link.length === 0) {
    fail('fixture config missing next_page_link selector');
  }

  const page2Response = await dom1.window.fetch(page2Url);
  const page2Html = await page2Response.text();
  const dom2 = new JSDOM(page2Html, { url: page2Url });

  const body1 = getFirstNode(dom1, config.body[0]);
  if (!body1) fail('page 1 body selector did not match');

  const nextHref = getFirstValue(dom1, config.next_page_link[0]);
  if (!nextHref) fail('page 1 next link missing');

  const resolvedNext = new URL(nextHref, page1Url).href;
  if (resolvedNext !== page2Url) {
    fail(`next link resolved to ${resolvedNext}, expected ${page2Url}`);
  }

  const body2 = getFirstNode(dom2, config.body[0]);
  if (!body2) fail('page 2 body selector did not match');

  const merged = body1.innerHTML + body2.innerHTML;
  const requiredPhrases = [
    'Page One Marker',
    'Page Two Marker'
  ];

  for (const phrase of requiredPhrases) {
    if (!merged.includes(phrase)) {
      fail(`merged content missing phrase: ${phrase}`);
    }
  }

  console.log('Pagination fixture test passed.');
}

run().catch(error => {
  console.error('Pagination fixture test failed:', error.message);
  process.exit(1);
});
