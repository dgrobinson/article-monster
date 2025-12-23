const fs = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');
const { allowLiveFetch } = require('../support/network-guard');

const repoRoot = path.join(__dirname, '..', '..');

async function testBookmarkletExtraction() {
  console.log('Testing bookmarklet extraction with Baldwin article...\n');
  
  // Load the test article
  const html = await fs.readFile(
    path.join(repoRoot, 'test-cases', 'solved', 'newyorker-baldwin.html'),
    'utf8'
  );
  
  // Create a DOM
  const domOptions = {
    url: 'https://www.newyorker.com/magazine/2025/08/18/baldwin-a-love-story-nicholas-boggs-book-review',
    runScripts: 'dangerously'
  };
  if (allowLiveFetch) {
    domOptions.resources = 'usable';
  }
  const dom = new JSDOM(html, domOptions);
  
  const window = dom.window;
  const document = window.document;
  
  // Load Readability
  const readabilityCode = await fs.readFile(
    path.join(repoRoot, 'node_modules', '@mozilla', 'readability', 'Readability.js'),
    'utf8'
  );
  window.eval(readabilityCode);
  
  // Test 1: Basic Readability extraction
  console.log('Test 1: Basic Readability Extraction');
  console.log('=====================================');
  const reader = new window.Readability(document);
  const article = reader.parse();
  
  if (article && article.content) {
    const pCount = (article.content.match(/<p>/gi) || []).length;
    const brCount = (article.content.match(/<br>/gi) || []).length;
    const newlineCount = (article.content.match(/\n/g) || []).length;
    
    console.log('- Content length:', article.content.length);
    console.log('- <p> tags:', pCount);
    console.log('- <br> tags:', brCount);
    console.log('- Newlines:', newlineCount);
    
    // Check for specific paragraph structure
    const hasHeCouldCharm = article.content.includes('He could charm');
    const heCouldCharmIndex = article.content.indexOf('He could charm');
    
    if (hasHeCouldCharm && heCouldCharmIndex > -1) {
      const before = article.content.substring(Math.max(0, heCouldCharmIndex - 100), heCouldCharmIndex);
      console.log('\nChecking "He could charm" paragraph:');
      console.log('- Found at index:', heCouldCharmIndex);
      console.log('- Is in separate <p>?:', before.includes('</p>'));
      
      // Show context
      const context = article.content.substring(
        Math.max(0, heCouldCharmIndex - 50),
        Math.min(article.content.length, heCouldCharmIndex + 100)
      );
      console.log('- Context:', context.replace(/\s+/g, ' ').substring(0, 150));
    }
    
    // Save extracted content
    const outputPath = path.join(__dirname, 'test-readability-output.html');
    await fs.writeFile(outputPath, article.content);
    console.log('\nReadability output saved to', outputPath);
  }
  
  // Test 2: Simulate fixImageUrls
  console.log('\n\nTest 2: After fixImageUrls');
  console.log('===========================');
  
  function fixImageUrls(html) {
    try {
      var div = document.createElement('div');
      div.innerHTML = html;
      var baseUrl = 'https://www.newyorker.com';
      
      // Fix img src attributes
      var images = div.querySelectorAll('img');
      for (var i = 0; i < images.length; i++) {
        var img = images[i];
        
        // Fix relative URLs to absolute
        if (img.src && !img.src.startsWith('http')) {
          try {
            img.src = new URL(img.src, baseUrl).href;
          } catch (e) {
            console.warn('Could not fix image URL:', img.src);
          }
        }
      }
      
      return div.innerHTML;
    } catch (e) {
      console.error('Error fixing image URLs:', e);
      return html;
    }
  }
  
  if (article && article.content) {
    const fixed = fixImageUrls(article.content);
    
    const pCount = (fixed.match(/<p>/gi) || []).length;
    const brCount = (fixed.match(/<br>/gi) || []).length;
    const newlineCount = (fixed.match(/\n/g) || []).length;
    
    console.log('- Content length:', fixed.length);
    console.log('- <p> tags:', pCount);
    console.log('- <br> tags:', brCount);
    console.log('- Newlines:', newlineCount);
    console.log('- Changed from original?:', fixed !== article.content);
    
    const outputPath = path.join(__dirname, 'test-after-fiximage.html');
    await fs.writeFile(outputPath, fixed);
    console.log('\nAfter fixImageUrls saved to', outputPath);
  }
  
  // Test 3: Base64 encoding/decoding
  console.log('\n\nTest 3: Base64 Encoding/Decoding');
  console.log('=================================');
  
  if (article && article.content) {
    const fixed = fixImageUrls(article.content);
    
    // Simulate browser's btoa with unescape/encodeURIComponent
    const base64 = Buffer.from(fixed).toString('base64');
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    
    const pCount = (decoded.match(/<p>/gi) || []).length;
    const brCount = (decoded.match(/<br>/gi) || []).length;
    const newlineCount = (decoded.match(/\n/g) || []).length;
    
    console.log('- Content length:', decoded.length);
    console.log('- <p> tags:', pCount);
    console.log('- <br> tags:', brCount);
    console.log('- Newlines:', newlineCount);
    console.log('- Same as before base64?:', decoded === fixed);
    
    const outputPath = path.join(__dirname, 'test-after-base64.html');
    await fs.writeFile(outputPath, decoded);
    console.log('\nAfter base64 round-trip saved to', outputPath);
  }
  
  // Close the DOM
  dom.window.close();
}

// Run the test
testBookmarkletExtraction().catch(console.error);
