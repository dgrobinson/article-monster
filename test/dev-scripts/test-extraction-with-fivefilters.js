#!/usr/bin/env node

/**
 * Test article extraction WITH FiveFilters config - matches production flow
 * This properly simulates how the bookmarklet works in production
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const AdmZip = require('adm-zip');

const repoRoot = path.join(__dirname, '..', '..');

// Parse FiveFilters config format (matching configFetcher.js)
function parseFtrConfig(configText) {
  const lines = configText.split('\n');
  const config = {
    title: [],
    body: [],
    author: [],
    strip: [],
    date: []
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

    if (trimmed.startsWith('title:')) {
      config.title.push(trimmed.substring(6).trim());
    } else if (trimmed.startsWith('body:')) {
      // Handle pipe-separated body selectors
      const bodySelectors = trimmed.substring(5).trim().split(' | ');
      bodySelectors.forEach(selector => config.body.push(selector.trim()));
    } else if (trimmed.startsWith('author:')) {
      config.author.push(trimmed.substring(7).trim());
    } else if (trimmed.startsWith('date:')) {
      config.date.push(trimmed.substring(5).trim());
    } else if (trimmed.startsWith('strip:')) {
      config.strip.push(trimmed.substring(6).trim());
    } else if (trimmed.startsWith('strip_id_or_class:')) {
      const className = trimmed.substring(18).trim();
      config.strip.push(`//*[contains(@class, '${className}') or contains(@id, '${className}')]`);
    }
  }

  return (config.body.length > 0) ? config : null;
}

// Load FiveFilters config for a site
function loadSiteConfig(hostname) {
  const configPath = path.join(repoRoot, 'site-configs', `${hostname}.txt`);
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = parseFtrConfig(configContent);
    console.log(`✅ Loaded FiveFilters config for ${hostname}`);
    console.log(`   Body selectors: ${config.body.length}`);
    console.log(`   Strip rules: ${config.strip.length}`);
    return config;
  }
  console.log(`❌ No FiveFilters config for ${hostname}`);
  return null;
}

// Test extraction on a single HTML file
function testExtraction(testCase) {
  const label = testCase.name || testCase.title || testCase.url || testCase.htmlFile || 'Unnamed test';
  console.log(`\n📖 Testing: ${label} [${testCase.priority}]`);
  console.log('─'.repeat(50));
  
  // Load HTML or handle EPUB-only cases
  const htmlPath = testCase.htmlPath;
  const htmlExists = htmlPath ? fs.existsSync(htmlPath) : false;
  const expectedEpubPath = htmlPath
    ? path.join(path.dirname(htmlPath), path.basename(htmlPath, path.extname(htmlPath)) + '.expected.epub')
    : null;

  if (!htmlExists && expectedEpubPath && fs.existsSync(expectedEpubPath)) {
    console.log(`ℹ️ No HTML found, running EPUB-only validation using golden: ${expectedEpubPath}`);
    try {
      const zip = new AdmZip(expectedEpubPath);
      const entries = zip.getEntries();
      let expectedXhtml = '';
      entries.forEach(entry => {
        if (entry.entryName.endsWith('.xhtml') || entry.entryName.endsWith('.html')) {
          expectedXhtml += zip.readAsText(entry);
        }
      });
      const plainText = expectedXhtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`📏 EPUB XHTML text length: ${plainText.length} chars`);
      let lengthOk = true;
      if (testCase.minLength && plainText.length < testCase.minLength) {
        console.log(`❌ EPUB content too short (expected at least ${testCase.minLength} chars)`);
        lengthOk = false;
      } else {
        console.log('✅ EPUB content length OK');
      }

      let allPhrasesFound = true;
      for (const phrase of testCase.expectedPhrases || []) {
        const found = plainText.toLowerCase().includes(String(phrase).toLowerCase());
        console.log(`${found ? '✅' : '❌'} ${found ? 'Found' : 'Missing'}: "${phrase}"`);
        if (!found) allPhrasesFound = false;
      }

      return allPhrasesFound && lengthOk;
    } catch (e) {
      console.log('❌ EPUB-only validation failed:', e.message);
      return false;
    }
  }

  if (!htmlExists && !testCase.htmlContent) {
    console.log(`❌ Test file not found and no inline content provided: ${htmlPath || '(inline missing)'}`);
    return false;
  }
  
  const html = htmlExists ? fs.readFileSync(htmlPath, 'utf8') : testCase.htmlContent;
  const url = testCase.url || 'https://newyorker.com/test';
  const dom = new JSDOM(html, { url });
  const window = dom.window;
  const document = window.document;
  
  // Get hostname from URL
  const hostname = new URL(url).hostname.replace(/^www\./, '');
  
  // Load FiveFilters config if available
  const siteConfig = loadSiteConfig(hostname);
  
  if (siteConfig) {
    // Use FiveFilters config for extraction
    console.log('📋 Using FiveFilters extraction...');
    
    let extractedContent = '';
    let extractedTitle = '';
    
    // Extract body using XPath selectors
    for (const bodySelector of siteConfig.body) {
      try {
        const result = document.evaluate(
          bodySelector,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        
        if (result.singleNodeValue) {
          const element = result.singleNodeValue;
          console.log(`   Found content with: ${bodySelector}`);
          
          // Apply strip rules
          for (const stripRule of siteConfig.strip) {
            const stripResult = document.evaluate(
              stripRule,
              element,
              null,
              XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
              null
            );
            
            for (let i = stripResult.snapshotLength - 1; i >= 0; i--) {
              const nodeToRemove = stripResult.snapshotItem(i);
              if (nodeToRemove && nodeToRemove.parentNode) {
                nodeToRemove.parentNode.removeChild(nodeToRemove);
              }
            }
          }
          
          extractedContent = element.innerHTML;
          break;
        }
      } catch (e) {
        console.log(`   XPath error for ${bodySelector}: ${e.message}`);
      }
    }
    
    // Extract title
    for (const titleSelector of siteConfig.title || []) {
      try {
        const result = document.evaluate(
          titleSelector,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        
        if (result.singleNodeValue) {
          extractedTitle = titleSelector.endsWith('/@content') 
            ? result.singleNodeValue.value 
            : result.singleNodeValue.textContent;
          if (extractedTitle) break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (extractedContent) {
      // Check extraction results
      console.log(`📏 Content length: ${extractedContent.length} bytes`);
      
      let lengthOk = true;
      if (extractedContent.length < testCase.minLength) {
        console.log(`❌ Content too short (expected at least ${testCase.minLength} bytes)`);
        lengthOk = false;
      } else {
        console.log(`✅ Content length OK`);
      }

      // EPUB golden compare if available
      const htmlFileBase = path.basename(testCase.htmlPath, path.extname(testCase.htmlPath));
      const expectedEpubPath = path.join(path.dirname(testCase.htmlPath), htmlFileBase + '.expected.epub');
      if (fs.existsSync(expectedEpubPath)) {
        console.log(`📚 Found EPUB golden: ${expectedEpubPath}`);
        try {
          const zip = new AdmZip(expectedEpubPath);
          const entries = zip.getEntries();
          let expectedXhtml = '';
          entries.forEach(entry => {
            if (entry.entryName.endsWith('.xhtml') || entry.entryName.endsWith('.html')) {
              expectedXhtml += zip.readAsText(entry);
            }
          });
          const normalize = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').toLowerCase().replace(/\s+/g, ' ').trim();
          const expectedText = normalize(expectedXhtml);
          const actualText = normalize(extractedContent);
          const lenDiff = Math.abs(actualText.length - expectedText.length);
          const relDiff = expectedText.length ? (lenDiff / Math.max(actualText.length, expectedText.length)) : 0;
          const containsEither = actualText.includes(expectedText.substring(0, Math.min(200, expectedText.length))) || expectedText.includes(actualText.substring(0, Math.min(200, actualText.length)));
          if (relDiff < 0.1 && containsEither) {
            console.log('✅ EPUB golden comparison passed (len diff < 10% and content aligned)');
          } else {
            console.log('❌ EPUB golden comparison failed');
            console.log(`   Expected length: ${expectedText.length}, Actual length: ${actualText.length}, Rel diff: ${(relDiff*100).toFixed(1)}%`);
            return false;
          }
        } catch (e) {
          console.log('❌ Failed to read/compare EPUB golden:', e.message);
          return false;
        }
      }
      
      // Check for expected phrases
      let allPhrasesFound = true;
      const plainText = extractedContent.replace(/<[^>]*>/g, '').trim();
      
      for (const phrase of testCase.expectedPhrases) {
        const found = extractedContent.includes(phrase) || plainText.includes(phrase);
        if (found) {
          console.log(`✅ Found: "${phrase}"`);
        } else {
          console.log(`❌ Missing: "${phrase}"`);
          allPhrasesFound = false;
        }
      }
      
      // Show content preview
      console.log('\n📄 Content preview:');
      console.log('Beginning:', plainText.substring(0, 100) + '...');
      console.log('Ending:', '...' + plainText.substring(plainText.length - 100));
      
      return allPhrasesFound && lengthOk;
    } else {
      console.log('❌ FiveFilters extraction failed, would fall back to Readability');
    }
  }
  
  // Fall back to Readability.js if no FiveFilters config or extraction failed
  console.log('📖 Falling back to Readability.js extraction...');
  
  // Load our Readability.min.js and execute it
  const readabilityCode = fs.readFileSync(path.join(repoRoot, 'public', 'readability.min.js'), 'utf8');
  
  try {
    // Mock sessionStorage for the bookmarklet
    window.sessionStorage = {
      _data: {},
      getItem: function(key) { return this._data[key] || null; },
      setItem: function(key, value) { this._data[key] = value; },
      removeItem: function(key) { delete this._data[key]; }
    };
    
    // If we have a site config, store it in sessionStorage like the bookmarklet would
    if (siteConfig) {
      window.sessionStorage.setItem('siteConfig_' + hostname, JSON.stringify({
        config: siteConfig,
        timestamp: Date.now()
      }));
    }
    
    // Execute Readability
    const executeReadability = new Function('window', 'document', `
      ${readabilityCode}
      return window.Readability;
    `);
    
    const Readability = executeReadability(window, document);
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

  // EPUB golden compare if available
  // Recompute EPUB path for readability fallback section
  const expectedEpubPath2 = htmlPath
    ? path.join(path.dirname(htmlPath), path.basename(htmlPath, path.extname(htmlPath)) + '.expected.epub')
    : null;
  if (expectedEpubPath2 && fs.existsSync(expectedEpubPath2)) {
    console.log(`📚 Found EPUB golden: ${expectedEpubPath2}`);
    try {
      const zip = new AdmZip(expectedEpubPath2);
      const entries = zip.getEntries();
      let expectedXhtml = '';
      entries.forEach(entry => {
        if (entry.entryName.endsWith('.xhtml') || entry.entryName.endsWith('.html')) {
          expectedXhtml += zip.readAsText(entry);
        }
      });
      const normalize = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').toLowerCase().replace(/\s+/g, ' ').trim();
      const expectedText = normalize(expectedXhtml);
      const actualText = normalize(article.content);
      const lenDiff = Math.abs(actualText.length - expectedText.length);
      const relDiff = expectedText.length ? (lenDiff / Math.max(actualText.length, expectedText.length)) : 0;
      const containsEither = actualText.includes(expectedText.substring(0, Math.min(200, expectedText.length))) || expectedText.includes(actualText.substring(0, Math.min(200, actualText.length)));
      if (relDiff < 0.1 && containsEither) {
        console.log('✅ EPUB golden comparison passed (len diff < 10% and content aligned)');
      } else {
        console.log('❌ EPUB golden comparison failed');
        console.log(`   Expected length: ${expectedText.length}, Actual length: ${actualText.length}, Rel diff: ${(relDiff*100).toFixed(1)}%`);
        return false;
      }
    } catch (e) {
      console.log('❌ Failed to read/compare EPUB golden:', e.message);
      return false;
    }
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

// Load test cases from folders
function loadTestCases() {
  const testCases = [];
  
  // Load unsolved cases (high priority)
  const unsolvedDir = path.join(repoRoot, 'test-cases', 'unsolved');
  if (fs.existsSync(unsolvedDir)) {
    const files = fs.readdirSync(unsolvedDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const testCase = JSON.parse(fs.readFileSync(path.join(unsolvedDir, file), 'utf8'));
      if (testCase.htmlFile) {
        testCase.htmlPath = path.join(unsolvedDir, testCase.htmlFile);
      } else if (typeof testCase.content === 'string' && testCase.content.length > 0) {
        testCase.htmlContent = testCase.content;
      }
      testCase.name = testCase.name || testCase.title || testCase.url || testCase.htmlFile || path.basename(file, '.json');
      testCase.expectedPhrases = testCase.expectedPhrases || [];
      testCase.priority = 'UNSOLVED';
      testCases.push(testCase);
    }
  }
  
  // Load solved cases (regression tests)
  const solvedDir = path.join(repoRoot, 'test-cases', 'solved');
  if (fs.existsSync(solvedDir)) {
    const files = fs.readdirSync(solvedDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const testCase = JSON.parse(fs.readFileSync(path.join(solvedDir, file), 'utf8'));
      if (testCase.htmlFile) {
        testCase.htmlPath = path.join(solvedDir, testCase.htmlFile);
      } else if (typeof testCase.content === 'string' && testCase.content.length > 0) {
        testCase.htmlContent = testCase.content;
      }
      testCase.name = testCase.name || testCase.title || testCase.url || testCase.htmlFile || path.basename(file, '.json');
      testCase.expectedPhrases = testCase.expectedPhrases || [];
      testCase.priority = 'SOLVED';
      testCases.push(testCase);
    }
  }
  
  return testCases;
}

// Run all tests
function runTests() {
  console.log('🧪 Running Article Extraction Tests (with FiveFilters)');
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
