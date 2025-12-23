#!/usr/bin/env node

/**
 * Test article extraction WITH FiveFilters config - mirrors bookmarklet flow
 */

require('../support/network-guard');

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const AdmZip = require('adm-zip');
const ConfigFetcher = require('../../src/configFetcher');

const repoRoot = path.join(__dirname, '..', '..');
const configFetcher = new ConfigFetcher();

const UNSOLVED_ALLOWED_FIELDS = new Set([
  'name',
  'url',
  'htmlFile',
  'content',
  'expectedPhrases',
  'minLength',
  'notes'
]);

const SOLVED_ALLOWED_FIELDS = new Set([
  'name',
  'url',
  'htmlFile',
  'content',
  'expectedPhrases',
  'minLength',
  'notes'
]);

function validateTestCase(testCase, meta) {
  const errors = [];
  const warnings = [];

  if (!testCase || typeof testCase !== 'object' || Array.isArray(testCase)) {
    errors.push('Case must be a JSON object');
    return { ok: false, errors, warnings };
  }

  const allowed = meta.priority === 'UNSOLVED' ? UNSOLVED_ALLOWED_FIELDS : SOLVED_ALLOWED_FIELDS;
  for (const key of Object.keys(testCase)) {
    if (!allowed.has(key)) {
      warnings.push(`Unknown field "${key}" will be ignored`);
    }
  }

  if (!testCase.name || typeof testCase.name !== 'string') {
    errors.push('Missing or invalid "name" (string required)');
  }

  if (!testCase.url || typeof testCase.url !== 'string') {
    errors.push('Missing or invalid "url" (string required)');
  }

  if (testCase.htmlFile !== undefined && typeof testCase.htmlFile !== 'string') {
    errors.push('"htmlFile" must be a string when provided');
  }

  if (testCase.content !== undefined && typeof testCase.content !== 'string') {
    errors.push('"content" must be a string when provided');
  }

  if (meta.priority === 'UNSOLVED') {
    if (!testCase.htmlFile && !testCase.content) {
      errors.push('Unsolved cases require one of "htmlFile" or "content"');
    }
  } else if (!testCase.htmlFile && !testCase.content) {
    warnings.push('Solved case has no "htmlFile" or "content"; will rely on EPUB golden if present');
  }

  if (testCase.expectedPhrases !== undefined) {
    if (!Array.isArray(testCase.expectedPhrases)) {
      errors.push('"expectedPhrases" must be an array of strings');
    } else if (testCase.expectedPhrases.some(p => typeof p !== 'string')) {
      errors.push('"expectedPhrases" must contain only strings');
    }
  }

  if (testCase.minLength !== undefined) {
    if (!Number.isFinite(testCase.minLength)) {
      errors.push('"minLength" must be a finite number');
    } else if (testCase.minLength < 0) {
      errors.push('"minLength" must be >= 0');
    }
  }

  if (testCase.notes !== undefined && typeof testCase.notes !== 'string') {
    errors.push('"notes" must be a string when provided');
  }

  return { ok: errors.length === 0, errors, warnings };
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeText(text) {
  return text.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').toLowerCase().trim();
}

function extractPlainTextFromEpub(epubPath) {
  const zip = new AdmZip(epubPath);
  const entries = zip.getEntries();
  let xhtml = '';
  entries.forEach(entry => {
    if (entry.entryName.endsWith('.xhtml') || entry.entryName.endsWith('.html')) {
      xhtml += zip.readAsText(entry);
    }
  });
  return stripHtml(
    xhtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  );
}

function pickPhrases(text) {
  const words = text.split(' ');
  const pickWindow = (startIdx, windowSize) => words.slice(startIdx, startIdx + windowSize).join(' ');
  const len = words.length;
  const w = 12;
  const begin = pickWindow(0, w);
  const mid = pickWindow(Math.max(0, Math.floor(len * 0.5) - Math.floor(w / 2)), w);
  const end = pickWindow(Math.max(0, len - w), w);
  const phrases = [begin, mid, end]
    .map(s => s.replace(/[\s\u00A0]+/g, ' ').trim())
    .filter(Boolean);
  return [...new Set(phrases)];
}

function resolveExpectedEpubPath(testCase) {
  const baseFromHtml = testCase.htmlFile
    ? path.basename(testCase.htmlFile, path.extname(testCase.htmlFile))
    : null;
  const base = baseFromHtml || testCase.caseId;
  if (!base || !testCase.caseDir) return null;
  return path.join(testCase.caseDir, `${base}.expected.epub`);
}

function resolveChecks(testCase, expectedEpubPath) {
  let expectedPhrases = Array.isArray(testCase.expectedPhrases) ? testCase.expectedPhrases : [];
  let minLength = Number.isFinite(testCase.minLength) ? testCase.minLength : null;
  let epubText = null;

  if (
    expectedEpubPath &&
    fs.existsSync(expectedEpubPath) &&
    (expectedPhrases.length === 0 || minLength === null)
  ) {
    try {
      epubText = extractPlainTextFromEpub(expectedEpubPath);
      if (expectedPhrases.length === 0) {
        expectedPhrases = pickPhrases(epubText);
      }
      if (minLength === null) {
        minLength = Math.floor(epubText.length * 0.9);
      }
    } catch (e) {
      console.log('⚠️  Failed to derive checks from EPUB:', e.message);
    }
  }

  return { expectedPhrases, minLength, epubText };
}

function loadReadability(window, document) {
  const readabilityCode = fs.readFileSync(path.join(repoRoot, 'public', 'readability.min.js'), 'utf8');
  const executeReadability = new Function('window', 'document', `
    ${readabilityCode}
    return window.Readability;
  `);
  const Readability = executeReadability(window, document);
  if (!Readability && !window.Readability) {
    throw new Error('Failed to load Readability');
  }
  window.Readability = Readability || window.Readability;
}

function applyHtmlPreprocessing(html, preprocessingRules) {
  let modifiedHtml = html;
  const extraRules = [];

  for (const rule of preprocessingRules || []) {
    if (rule.find && rule.replace !== undefined) {
      const findString = rule.find;
      const replaceString = rule.replace;
      modifiedHtml = modifiedHtml.split(findString).join(replaceString);

      const openingTagMatch = findString.match(/^<([a-zA-Z][a-zA-Z0-9-]*)$/);
      const replaceTagMatch = replaceString.match(/^<([a-zA-Z][a-zA-Z0-9-]*)$/);

      if (openingTagMatch && replaceTagMatch) {
        const originalTag = openingTagMatch[1];
        const newTag = replaceTagMatch[1];
        const closingFind = `</${originalTag}>`;
        const closingReplace = `</${newTag}>`;

        const alreadyDefined = preprocessingRules.some(r => r.find === closingFind);
        if (!alreadyDefined) {
          extraRules.push({ find: closingFind, replace: closingReplace });
        }
      }
    }
  }

  for (const extraRule of extraRules) {
    modifiedHtml = modifiedHtml.split(extraRule.find).join(extraRule.replace);
  }

  return modifiedHtml;
}

function evaluateXPath(doc, window, xpath, contextNode) {
  try {
    const result = doc.evaluate(
      xpath,
      contextNode || doc,
      null,
      window.XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    return result.singleNodeValue;
  } catch (e) {
    return null;
  }
}

function evaluateXPathAll(doc, window, xpath, contextNode) {
  try {
    const result = doc.evaluate(
      xpath,
      contextNode || doc,
      null,
      window.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    const nodes = [];
    for (let i = 0; i < result.snapshotLength; i++) {
      nodes.push(result.snapshotItem(i));
    }
    return nodes;
  } catch (e) {
    return [];
  }
}

function cleanEmptyElements(element, window) {
  const emptyElements = element.querySelectorAll('p:empty, div:empty, span:empty');
  for (const el of emptyElements) {
    if (el && el.remove) {
      el.remove();
    }
  }

  const walker = element.ownerDocument.createTreeWalker(
    element,
    window.NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue && /^\s*$/.test(node.nodeValue)) {
      const parent = node.parentNode;
      if (parent && parent.childNodes.length === 1 && parent.remove) {
        parent.remove();
      }
    }
  }
}

function pruneContent(element, window) {
  const serviceData = element.querySelectorAll('[data-candidate]');
  serviceData.forEach(node => node.removeAttribute('data-candidate'));

  const nofollowLinks = element.querySelectorAll('a[rel="nofollow"]');
  for (const link of nofollowLinks) {
    if (link && link.remove) {
      link.remove();
    }
  }

  const junkSelectors = ['input', 'button', 'nav', 'object', 'iframe', 'canvas'];
  for (const selector of junkSelectors) {
    const elements = element.querySelectorAll(selector);
    for (const el of elements) {
      if (el && el.remove) {
        el.remove();
      }
    }
  }

  const h1Elements = element.querySelectorAll('h1');
  for (const h1 of h1Elements) {
    if (h1 && h1.remove) {
      h1.remove();
    }
  }

  cleanEmptyElements(element, window);
}

function tidyContent(element, window) {
  const brGroups = element.querySelectorAll('br + br');
  for (const br of brGroups) {
    if (br.previousElementSibling && br.previousElementSibling.tagName === 'BR') {
      const p = element.ownerDocument.createElement('p');
      br.parentNode.insertBefore(p, br);
      br.remove();
      if (br.previousElementSibling) {
        br.previousElementSibling.remove();
      }
    }
  }

  const walker = element.ownerDocument.createTreeWalker(
    element,
    window.NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let textNode;
  while ((textNode = walker.nextNode())) {
    if (textNode.nodeValue) {
      textNode.nodeValue = textNode.nodeValue.replace(/[ \t]+/g, ' ');
    }
  }

  const allElements = element.querySelectorAll('*');
  for (const el of allElements) {
    for (let i = el.attributes.length - 1; i >= 0; i--) {
      const attr = el.attributes[i];
      if (!attr.value || attr.value.trim() === '') {
        el.removeAttribute(attr.name);
      }
    }
  }
}

function cleanElementWithConfig(element, config, doc, window) {
  const clone = element.cloneNode(true);

  if (config.strip && config.strip.length > 0) {
    for (const rule of config.strip) {
      const toRemove = doc.evaluate(
        rule,
        clone,
        null,
        window.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
      );
      for (let i = toRemove.snapshotLength - 1; i >= 0; i--) {
        const node = toRemove.snapshotItem(i);
        if (node && node.parentNode) {
          node.parentNode.removeChild(node);
        }
      }
    }
  }

  if (config.strip_id_or_class && config.strip_id_or_class.length > 0) {
    for (const rawSelector of config.strip_id_or_class) {
      const selector = rawSelector.replace(/['"]/g, '');
      const elements = clone.querySelectorAll(
        `[class*="${selector}"], [id*="${selector}"]`
      );
      for (const el of elements) {
        if (el && el.remove) {
          el.remove();
        }
      }
    }
  }

  if (config.strip_image_src && config.strip_image_src.length > 0) {
    for (const rawPattern of config.strip_image_src) {
      const pattern = rawPattern.replace(/['"]/g, '');
      const images = clone.querySelectorAll(`img[src*="${pattern}"]`);
      for (const img of images) {
        if (img && img.remove) {
          img.remove();
        }
      }
    }
  }

  if (config.prune === true) {
    pruneContent(clone, window);
  }

  if (config.tidy === true) {
    tidyContent(clone, window);
  }

  return clone;
}

function extractWithSiteConfig(doc, window, config) {
  if (!config || !config.body || config.body.length === 0) {
    return null;
  }

  if (config.preferJsonLd) {
    return null;
  }

  const result = {
    source: 'site-config'
  };

  let titleExtracted = false;
  if (config.title && config.title.length > 0) {
    for (const xpath of config.title) {
      const element = evaluateXPath(doc, window, xpath);
      if (element) {
        result.title = xpath.endsWith('/@content') ? element.value : element.textContent;
        if (result.title) {
          result.title = result.title.trim();
          titleExtracted = true;
          break;
        }
      }
    }
  }

  const shouldAutoDetectTitle =
    !config.title || config.title.length === 0 || (!titleExtracted && config.autodetect_on_failure !== false);
  if (!titleExtracted && shouldAutoDetectTitle) {
    if (doc.title) {
      result.title = doc.title.trim();
    }
  }

  for (const bodyXPath of config.body) {
    const elements = evaluateXPathAll(doc, window, bodyXPath);
    if (!elements || elements.length === 0) {
      continue;
    }

    let bodyElement;
    if (elements.length === 1) {
      bodyElement = elements[0];
    } else {
      bodyElement = doc.createElement('div');
      for (const el of elements) {
        bodyElement.appendChild(el.cloneNode(true));
      }
    }

    const cleanElement = cleanElementWithConfig(bodyElement, config, doc, window);
    result.content = cleanElement.innerHTML;
    result.textContent = cleanElement.textContent || cleanElement.innerText || '';
    result.length = result.textContent.length;

    if (result.textContent && result.textContent.trim().length > 0) {
      break;
    }
  }

  if (config.author) {
    for (const xpath of config.author) {
      const element = evaluateXPath(doc, window, xpath);
      if (element) {
        result.byline = xpath.endsWith('/@content') ? element.value : element.textContent;
        if (result.byline) {
          result.byline = result.byline.trim();
          break;
        }
      }
    }
  }

  return result.content ? result : null;
}

function loadTestCases() {
  const testCases = [];
  const errors = [];

  function loadDir(dirName, priority) {
    const dirPath = path.join(repoRoot, 'test-cases', dirName);
    if (!fs.existsSync(dirPath)) return;
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const testCase = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const caseId = path.basename(file, '.json');
      const meta = {
        priority,
        caseId,
        caseDir: dirPath,
        caseFile: filePath
      };
      const validation = validateTestCase(testCase, meta);
      if (validation.warnings.length > 0) {
        for (const warning of validation.warnings) {
          console.log(`⚠️  ${warning} (${filePath})`);
        }
      }
      if (!validation.ok) {
        for (const err of validation.errors) {
          errors.push(`${err} (${filePath})`);
        }
        continue;
      }

      if (testCase.htmlFile) {
        testCase.htmlPath = path.join(dirPath, testCase.htmlFile);
      } else if (typeof testCase.content === 'string' && testCase.content.length > 0) {
        testCase.htmlContent = testCase.content;
      }
      testCase.priority = priority;
      testCase.caseId = caseId;
      testCase.caseDir = dirPath;
      testCase.caseFile = filePath;
      testCases.push(testCase);
    }
  }

  loadDir('unsolved', 'UNSOLVED');
  loadDir('solved', 'SOLVED');

  if (errors.length > 0) {
    console.log('\n❌ Schema validation errors:');
    for (const err of errors) {
      console.log(`  - ${err}`);
    }
    process.exit(1);
  }

  const onlySolved = String(process.env.ONLY_SOLVED || '').toLowerCase() === 'true';
  const onlyUnsolved = String(process.env.ONLY_UNSOLVED || '').toLowerCase() === 'true';

  if (onlySolved && onlyUnsolved) {
    return testCases.filter(tc => tc.priority === 'SOLVED');
  }
  if (onlySolved) {
    return testCases.filter(tc => tc.priority === 'SOLVED');
  }
  if (onlyUnsolved) {
    return testCases.filter(tc => tc.priority === 'UNSOLVED');
  }

  return testCases;
}

async function runExtractionWithConfig(html, url) {
  const hostname = new URL(url).hostname.replace(/^www\./, '');
  const config = await configFetcher.getConfigForSite(hostname);

  if (config) {
    console.log(`✅ Loaded FiveFilters config for ${hostname}`);
    let finalHtml = html;
    if (config.htmlPreprocessing && config.htmlPreprocessing.length > 0) {
      finalHtml = applyHtmlPreprocessing(html, config.htmlPreprocessing);
      console.log(`   Applied ${config.htmlPreprocessing.length} preprocessing rule(s)`);
    }

    const processedDom = new JSDOM(finalHtml, { url });
    const processedWindow = processedDom.window;
    const processedDoc = processedWindow.document;

    const siteConfigResult = extractWithSiteConfig(processedDoc, processedWindow, config);
    if (siteConfigResult && siteConfigResult.content) {
      return { article: siteConfigResult, method: 'site-config' };
    }

    console.log('❌ FiveFilters extraction failed, falling back to Readability');
    loadReadability(processedWindow, processedDoc);
    const reader = new processedWindow.Readability(processedDoc);
    return { article: reader.parse(), method: 'readability-fallback' };
  }

  console.log(`❌ No FiveFilters config for ${hostname}`);
  const dom = new JSDOM(html, { url });
  const window = dom.window;
  const document = window.document;
  loadReadability(window, document);
  const reader = new window.Readability(document);
  return { article: reader.parse(), method: 'readability' };
}

// Test extraction on a single HTML file
async function testExtraction(testCase) {
  console.log(`\n📖 Testing: ${testCase.name} [${testCase.priority}]`);
  console.log('─'.repeat(50));

  const expectedEpubPath = resolveExpectedEpubPath(testCase);
  const htmlExists = testCase.htmlPath ? fs.existsSync(testCase.htmlPath) : false;
  const htmlContent = testCase.htmlContent;

  if (!htmlExists && !htmlContent) {
    if (expectedEpubPath && fs.existsSync(expectedEpubPath)) {
      console.log(`ℹ️ No HTML found, running EPUB-only validation using golden: ${expectedEpubPath}`);
      try {
        const { expectedPhrases, minLength, epubText } = resolveChecks(testCase, expectedEpubPath);
        const plainText = epubText || extractPlainTextFromEpub(expectedEpubPath);
        console.log(`📏 EPUB XHTML text length: ${plainText.length} chars`);
        let lengthOk = true;
        if (minLength !== null && plainText.length < minLength) {
          console.log(`❌ EPUB content too short (expected at least ${minLength} chars)`);
          lengthOk = false;
        } else if (minLength !== null) {
          console.log('✅ EPUB content length OK');
        }

        let allPhrasesFound = true;
        for (const phrase of expectedPhrases) {
          const found = plainText.toLowerCase().includes(String(phrase).toLowerCase());
          console.log(`${found ? '✅' : '❌'} ${found ? 'Found' : 'Missing'}: "${phrase}"`);
          if (!found) allPhrasesFound = false;
        }

        return { status: allPhrasesFound && lengthOk ? 'pass' : 'fail' };
      } catch (e) {
        console.log('❌ EPUB-only validation failed:', e.message);
        return { status: 'fail' };
      }
    }

    if (testCase.priority === 'SOLVED') {
      console.log('⚠️  No HTML or inline content provided, skipping case');
      return { status: 'skip' };
    }

    console.log('❌ Test file not found and no inline content provided');
    return { status: 'fail' };
  }

  const html = htmlExists ? fs.readFileSync(testCase.htmlPath, 'utf8') : htmlContent;
  const url = testCase.url || 'https://example.com';

  let extraction;
  try {
    extraction = await runExtractionWithConfig(html, url);
  } catch (err) {
    console.log('❌ Extraction error:', err.message);
    return { status: 'fail' };
  }

  const article = extraction.article;
  if (!article || !article.content) {
    console.log('❌ No content extracted');
    return { status: 'fail' };
  }

  const { expectedPhrases, minLength } = resolveChecks(testCase, expectedEpubPath);

  if (expectedEpubPath && fs.existsSync(expectedEpubPath)) {
    console.log(`📚 Found EPUB golden: ${expectedEpubPath}`);
    try {
      const expectedText = normalizeText(extractPlainTextFromEpub(expectedEpubPath));
      const actualText = normalizeText(stripHtml(article.content));
      const lenDiff = Math.abs(actualText.length - expectedText.length);
      const relDiff = expectedText.length
        ? (lenDiff / Math.max(actualText.length, expectedText.length))
        : 0;
      const containsEither =
        actualText.includes(expectedText.substring(0, Math.min(200, expectedText.length))) ||
        expectedText.includes(actualText.substring(0, Math.min(200, actualText.length)));
      if (relDiff < 0.1 && containsEither) {
        console.log('✅ EPUB golden comparison passed (len diff < 10% and content aligned)');
      } else {
        console.log('❌ EPUB golden comparison failed');
        console.log(
          `   Expected length: ${expectedText.length}, Actual length: ${actualText.length}, Rel diff: ${(relDiff * 100).toFixed(1)}%`
        );
        return { status: 'fail' };
      }
    } catch (e) {
      console.log('❌ Failed to read/compare EPUB golden:', e.message);
      return { status: 'fail' };
    }
  }

  const plainText = stripHtml(article.content);

  console.log(`📏 Content length: ${plainText.length} chars`);
  let lengthOk = true;
  if (minLength !== null && plainText.length < minLength) {
    console.log(`❌ Content too short (expected at least ${minLength} chars)`);
    lengthOk = false;
  } else if (minLength !== null) {
    console.log('✅ Content length OK');
  }

  let allPhrasesFound = true;
  for (const phrase of expectedPhrases) {
    const found = plainText.toLowerCase().includes(String(phrase).toLowerCase());
    if (found) {
      console.log(`✅ Found: "${phrase}"`);
    } else {
      console.log(`❌ Missing: "${phrase}"`);
      allPhrasesFound = false;
    }
  }

  console.log('\n📄 Content preview:');
  console.log('Beginning:', plainText.substring(0, 100) + '...');
  console.log('Ending:', '...' + plainText.substring(Math.max(0, plainText.length - 100)));

  if (testCase.notes) {
    console.log('\n📝 Notes:', testCase.notes);
  }

  console.log(`\n🔎 Extraction method: ${extraction.method}`);

  return { status: allPhrasesFound && lengthOk ? 'pass' : 'fail' };
}

async function runTests() {
  console.log('🧪 Running Article Extraction Tests (with FiveFilters)');
  console.log('═'.repeat(50));

  const testCases = loadTestCases();
  console.log(`Found ${testCases.length} test case(s)`);

  let solvedPassed = 0;
  let solvedFailed = 0;
  let unsolvedPassedCount = 0;
  let unsolvedFailedCount = 0;
  let skipped = 0;
  const unsolvedPassed = [];

  for (const testCase of testCases) {
    const result = await testExtraction(testCase);
    if (result.status === 'pass') {
      if (testCase.priority === 'UNSOLVED') {
        unsolvedPassedCount++;
        unsolvedPassed.push(testCase.name);
      } else {
        solvedPassed++;
      }
    } else if (result.status === 'skip') {
      skipped++;
    } else {
      if (testCase.priority === 'UNSOLVED') {
        unsolvedFailedCount++;
      } else {
        solvedFailed++;
      }
    }
  }

  const passed = solvedPassed + unsolvedPassedCount;
  const failed = solvedFailed + unsolvedFailedCount;

  console.log('\n' + '═'.repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log(`   Solved: ${solvedPassed} passed, ${solvedFailed} failed`);
  console.log(`   Unsolved: ${unsolvedPassedCount} passed, ${unsolvedFailedCount} failed`);

  if (unsolvedPassed.length > 0) {
    console.log('\n🎉 UNSOLVED CASES NOW PASSING:');
    for (const name of unsolvedPassed) {
      console.log(`  ✅ ${name}`);
      console.log('     → Move to test-cases/solved/ to mark as regression test');
    }
  }

  const ranSolved = solvedPassed + solvedFailed > 0;
  const shouldFailOnUnsolved = !ranSolved;
  return solvedFailed === 0 && (!shouldFailOnUnsolved || unsolvedFailedCount === 0);
}

runTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('❌ Test runner error:', err);
    process.exit(1);
  });
