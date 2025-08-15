#!/usr/bin/env node

/**
 * Test article extraction locally before deploying
 * Reads test cases from test-cases/unsolved and test-cases/solved
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Load test cases from folders
function loadTestCases() {
  const testCases = [];
  
  // Load unsolved cases (high priority)
  const unsolvedDir = path.join(__dirname, 'test-cases/unsolved');
  if (fs.existsSync(unsolvedDir)) {
    const files = fs.readdirSync(unsolvedDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const testCase = JSON.parse(fs.readFileSync(path.join(unsolvedDir, file), 'utf8'));
      testCase.htmlPath = path.join(unsolvedDir, testCase.htmlFile);
      testCase.priority = 'UNSOLVED';
      testCases.push(testCase);
    }
  }
  
  // Load solved cases (regression tests)
  const solvedDir = path.join(__dirname, 'test-cases/solved');
  if (fs.existsSync(solvedDir)) {
    const files = fs.readdirSync(solvedDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const testCase = JSON.parse(fs.readFileSync(path.join(solvedDir, file), 'utf8'));
      testCase.htmlPath = path.join(solvedDir, testCase.htmlFile);
      testCase.priority = 'SOLVED';
      testCases.push(testCase);
    }
  }
  
  return testCases;
}

// Test extraction on a single HTML file
function testExtraction(testCase) {
  console.log(`\n📖 Testing: ${testCase.name} [${testCase.priority}]`);
  console.log('─'.repeat(50));
  
  // Load HTML
  if (!fs.existsSync(testCase.htmlPath)) {
    console.log(`❌ Test file not found: ${testCase.htmlPath}`);
    return false;
  }
  
  const html = fs.readFileSync(testCase.htmlPath, 'utf8');
  const dom = new JSDOM(html, { 
    url: testCase.url || 'https://example.com'
  });
  const window = dom.window;
  const document = window.document;
  
  // Load our Readability.min.js and execute it
  const readabilityCode = fs.readFileSync('public/readability.min.js', 'utf8');
  
  // The code is an IIFE (immediately invoked function expression)
  // We need to execute it in a way that gives it access to window
  try {
    // Use Function constructor to evaluate the code with window context
    const executeReadability = new Function('window', 'document', `
      ${readabilityCode}
      return window.Readability;
    `);
    
    const Readability = executeReadability(window, document);
    
    if (!Readability && !window.Readability) {
      console.log('❌ Failed to load Readability');
      return false;
    }
    
    // Use whichever is available
    window.Readability = Readability || window.Readability;
  } catch (err) {
    console.log('❌ Script execution error:', err.message);
    return false;
  }
  
  // Extract article
  const reader = new window.Readability(window.document);
  let article;
  try {
    article = reader.parse();
  } catch (err) {
    console.log('❌ Extraction error:', err.message);
    return false;
  }
  
  if (!article || !article.content) {
    console.log('❌ No content extracted');
    return false;
  }
  
  // Check content length
  console.log(`📏 Content length: ${article.content.length} bytes`);
  let lengthOk = true;
  if (article.content.length < testCase.minLength) {
    console.log(`❌ Content too short (expected at least ${testCase.minLength} bytes)`);
    lengthOk = false;
  } else {
    console.log(`✅ Content length OK`);
  }
  
  // Check for expected phrases
  let allPhrasesFound = true;
  for (const phrase of testCase.expectedPhrases) {
    const found = article.content.includes(phrase) || article.textContent?.includes(phrase);
    if (found) {
      console.log(`✅ Found: "${phrase}"`);
    } else {
      console.log(`❌ Missing: "${phrase}"`);
      allPhrasesFound = false;
    }
  }
  
  // Show content preview
  const plainText = article.content.replace(/<[^>]*>/g, '').trim();
  console.log('\n📄 Content preview:');
  console.log('Beginning:', plainText.substring(0, 100) + '...');
  console.log('Ending:', '...' + plainText.substring(plainText.length - 100));
  
  // If test notes exist, show them
  if (testCase.notes) {
    console.log('\n📝 Notes:', testCase.notes);
  }
  
  return allPhrasesFound && lengthOk;
}

// Run all tests
function runTests() {
  console.log('🧪 Running Article Extraction Tests');
  console.log('═'.repeat(50));
  
  const testCases = loadTestCases();
  console.log(`Found ${testCases.length} test case(s)`);
  
  let passed = 0;
  let failed = 0;
  let unsolvedPassed = [];
  
  for (const testCase of testCases) {
    const result = testExtraction(testCase);
    if (result) {
      passed++;
      if (testCase.priority === 'UNSOLVED') {
        unsolvedPassed.push(testCase.name);
      }
    } else {
      failed++;
    }
  }
  
  console.log('\n' + '═'.repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  
  if (unsolvedPassed.length > 0) {
    console.log('\n🎉 UNSOLVED CASES NOW PASSING:');
    for (const name of unsolvedPassed) {
      console.log(`  ✅ ${name}`);
      console.log('     → Move to test-cases/solved/ to mark as regression test');
    }
  }
  
  return failed === 0;
}

// Run tests and exit with appropriate code
const success = runTests();
process.exit(success ? 0 : 1);