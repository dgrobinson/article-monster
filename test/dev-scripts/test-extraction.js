#!/usr/bin/env node

/**
 * Test article extraction locally before deploying
 * Reads test cases from test-cases/unsolved and test-cases/solved
 */

require('../support/network-guard');

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const AdmZip = require('adm-zip');

const repoRoot = path.join(__dirname, '..', '..');

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
  const withoutHead = xhtml.replace(/<head[\s\S]*?<\/head>/gi, ' ');
  const withoutMeta = withoutHead
    .replace(/<div class="meta">[\s\S]*?<\/div>/gi, ' ')
    .replace(/<div class="source">[\s\S]*?<\/div>/gi, ' ');
  const contentMarker = /<div class="content">/i;
  const markerIndex = withoutMeta.search(contentMarker);
  const withoutHeader = markerIndex === -1
    ? withoutMeta.replace(/<h1[\s\S]*?<\/h1>/i, ' ')
    : withoutMeta.slice(0, markerIndex).replace(/<h1[\s\S]*?<\/h1>/i, ' ') +
        withoutMeta.slice(markerIndex);
  return stripHtml(
    withoutHeader
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

// Load test cases from folders
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

  // Optional filtering via environment flags to support CI grouping
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

// Test extraction on a single HTML file
function testExtraction(testCase) {
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
  const dom = new JSDOM(html, {
    url: testCase.url || 'https://example.com'
  });
  const window = dom.window;
  const document = window.document;

  try {
    loadReadability(window, document);
  } catch (err) {
    console.log('❌ Script execution error:', err.message);
    return { status: 'fail' };
  }

  const reader = new window.Readability(window.document);
  let article;
  try {
    article = reader.parse();
  } catch (err) {
    console.log('❌ Extraction error:', err.message);
    return { status: 'fail' };
  }

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

  return { status: allPhrasesFound && lengthOk ? 'pass' : 'fail' };
}

// Run all tests
function runTests() {
  console.log('🧪 Running Article Extraction Tests');
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
    const result = testExtraction(testCase);
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

const success = runTests();
process.exit(success ? 0 : 1);
