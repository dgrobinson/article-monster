#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { extractArticle } = require('../src/articleExtractor');

/**
 * Manual validation against PDF reference fixtures.
 * This is optional and not part of default npm test runs.
 */
async function runValidation() {
  const testCasesDir = process.argv[2] || 'test-cases/pdf-references';
  
  try {
    // Load test manifest
    const manifestPath = path.join(testCasesDir, 'manifest.json');
    let manifest;
    try {
      const manifestData = await fs.readFile(manifestPath, 'utf8');
      manifest = JSON.parse(manifestData);
    } catch (e) {
      console.log('No test cases found (manifest.json missing)');
      process.exit(0);
    }
    
    console.log(`Running ${manifest.testCases.length} PDF reference test(s)...`);
    
    const results = [];
    
    for (const testCase of manifest.testCases) {
      const testDir = path.join(testCasesDir, testCase.id);
      
      // Load expected output
      const expectedPath = path.join(testDir, 'expected.json');
      const expected = JSON.parse(await fs.readFile(expectedPath, 'utf8'));
      
      // Load the original HTML if available
      const htmlPath = path.join(testDir, 'source.html');
      let sourceHtml;
      try {
        sourceHtml = await fs.readFile(htmlPath, 'utf8');
      } catch (e) {
        console.log(`⚠️  No source HTML for ${testCase.id}, skipping`);
        continue;
      }
      
      // Run extraction
      const extracted = await extractArticle(testCase.url, sourceHtml);
      
      // Compare key fields
      const validations = {
        title: extracted.title === expected.title,
        byline: extracted.byline === expected.byline,
        contentLength: Math.abs(extracted.content.length - expected.contentLength) < 100,
        paragraphCount: countParagraphs(extracted.content) === expected.paragraphCount,
        hasImages: (extracted.content.includes('<img')) === expected.hasImages
      };
      
      const passed = Object.values(validations).every(v => v);
      
      results.push({
        id: testCase.id,
        url: testCase.url,
        passed,
        validations
      });
      
      if (passed) {
        console.log(`✅ ${testCase.id}: PASSED`);
      } else {
        console.log(`❌ ${testCase.id}: FAILED`);
        Object.entries(validations).forEach(([field, valid]) => {
          if (!valid) {
            console.log(`   - ${field}: mismatch`);
          }
        });
      }
    }
    
    // Summary
    const passedCount = results.filter(r => r.passed).length;
    console.log(`\n📊 Results: ${passedCount}/${results.length} tests passed`);
    
    if (passedCount < results.length) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
  }
}

function countParagraphs(html) {
  const matches = html.match(/<p[^>]*>/gi);
  return matches ? matches.length : 0;
}

// Run if called directly
if (require.main === module) {
  runValidation();
}

module.exports = { runValidation };
