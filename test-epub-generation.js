#!/usr/bin/env node

/**
 * Test EPUB generation to ensure full content is preserved
 * This tests the complete pipeline: extraction -> EPUB generation -> verification
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const AdmZip = require('adm-zip');
const { generateEpub } = require('./src/epubGenerator');
const { execSync } = require('child_process');

// Test that EPUB contains expected content
async function testEpubGeneration() {
  console.log('🧪 Testing EPUB Generation Pipeline');
  console.log('═'.repeat(50));
  
  // Step 1: Load and extract the Baldwin article
  console.log('\n📖 Step 1: Extracting article...');
  
  const htmlPath = path.join(__dirname, 'test-cases/solved/newyorker-baldwin.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const dom = new JSDOM(html, { 
    url: 'https://newyorker.com/test'
  });
  const window = dom.window;
  const document = window.document;
  
  // Load and execute Readability
  const readabilityCode = fs.readFileSync('public/readability.min.js', 'utf8');
  const executeReadability = new Function('window', 'document', `
    ${readabilityCode}
    return window.Readability;
  `);
  
  const Readability = executeReadability(window, document);
  window.Readability = Readability || window.Readability;
  
  const reader = new window.Readability(window.document);
  const article = reader.parse();
  
  if (!article || !article.content) {
    console.log('❌ Failed to extract article');
    return false;
  }
  
  console.log(`✅ Extracted ${article.content.length} bytes of content`);
  
  // Check for key phrases in extracted content
  const extractedPhrases = {
    beginning: article.content.includes('Baldwin was high-strung'),
    middle: article.content.includes('Farrar, Straus'),
    ending: article.content.includes('lot of love out there')
  };
  
  console.log('Extracted content contains:');
  console.log(`  Beginning phrase: ${extractedPhrases.beginning ? '✅' : '❌'}`);
  console.log(`  Middle phrase: ${extractedPhrases.middle ? '✅' : '❌'}`);
  console.log(`  Ending phrase: ${extractedPhrases.ending ? '✅' : '❌'}`);
  
  // Step 2: Generate EPUB
  console.log('\n📚 Step 2: Generating EPUB...');
  
  const epubArticle = {
    title: article.title || 'Test Article',
    byline: article.byline || 'Test Author',
    siteName: article.siteName || 'The New Yorker',
    url: 'https://newyorker.com/test',
    publishedTime: article.publishedTime || new Date().toISOString(),
    content: article.content,
    length: article.content.length,
    hasImages: article.content.includes('<img'),
    lang: article.lang || 'en'
  };
  
  try {
    const epubResult = await generateEpub(epubArticle);
    console.log(`✅ EPUB generated: ${epubResult.filename}`);
    console.log(`📦 EPUB size: ${(epubResult.size / 1024).toFixed(2)} KB`);

    const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
    if (epubResult.filename.includes(commitHash)) {
      console.log(`📝 Filename contains commit hash: ${commitHash}`);
    } else {
      console.log(`❌ Filename missing commit hash ${commitHash}`);
      return false;
    }
    
    // Step 3: Verify EPUB contents
    console.log('\n🔍 Step 3: Verifying EPUB contents...');
    
    // Create AdmZip from buffer
    const zip = new AdmZip(epubResult.buffer);
    const zipEntries = zip.getEntries();
    
    let xhtmlContent = '';
    let xhtmlFiles = [];
    
    zipEntries.forEach(entry => {
      if (entry.entryName.endsWith('.xhtml') || entry.entryName.endsWith('.html')) {
        xhtmlFiles.push(entry.entryName);
        const content = zip.readAsText(entry);
        xhtmlContent += content;
        
        // Check file size
        console.log(`  📄 ${entry.entryName}: ${(content.length / 1024).toFixed(2)} KB`);
      }
    });
    
    console.log(`\nFound ${xhtmlFiles.length} XHTML files in EPUB`);
    console.log(`Total XHTML content: ${(xhtmlContent.length / 1024).toFixed(2)} KB`);
    
    // Check for key phrases in EPUB
    const epubPhrases = {
      beginning: xhtmlContent.includes('Baldwin was high-strung'),
      middle: xhtmlContent.includes('Farrar, Straus'),
      ending: xhtmlContent.includes('lot of love out there')
    };
    
    console.log('\nEPUB content contains:');
    console.log(`  Beginning phrase: ${epubPhrases.beginning ? '✅' : '❌'}`);
    console.log(`  Middle phrase: ${epubPhrases.middle ? '✅' : '❌'}`);
    console.log(`  Ending phrase: ${epubPhrases.ending ? '✅' : '❌'}`);
    
    // Compare extraction vs EPUB
    console.log('\n📊 Comparison:');
    console.log(`Extraction content length: ${article.content.length} bytes`);
    console.log(`EPUB XHTML content length: ${xhtmlContent.length} bytes`);
    
    if (!epubPhrases.ending && extractedPhrases.ending) {
      console.log('\n⚠️  WARNING: Ending was extracted but is missing from EPUB!');
      
      // Find where it cuts off
      const truncationPhrases = [
        'Farrar, Straus & Giroux',
        'Farrar, Straus &amp; Giroux',
        'Just Above My Head',
        'Devil Finds Work'
      ];
      
      for (const phrase of truncationPhrases) {
        if (xhtmlContent.includes(phrase)) {
          const index = xhtmlContent.lastIndexOf(phrase);
          const snippet = xhtmlContent.substring(index - 50, index + 200);
          console.log(`\nFound potential truncation point at "${phrase}":`);
          console.log(snippet.replace(/<[^>]*>/g, '').trim());
          break;
        }
      }
      
      // Check if there's a size limit issue
      if (xhtmlContent.length > 500000) {
        console.log('\n⚠️  EPUB content is very large (>500KB), might be hitting a size limit');
      }
      
      return false;
    }
    
    console.log('\n✅ EPUB generation test completed successfully');
    return true;
    
  } catch (error) {
    console.log('❌ EPUB generation failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run the test
testEpubGeneration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});