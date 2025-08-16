const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Configuration
const SERVICE_URL = process.env.SERVICE_URL || 'https://seal-app-t4vff.ondigitalocean.app';
const ZOTERO_API_KEY = process.env.ZOTERO_API_KEY;
const ZOTERO_USER_ID = process.env.ZOTERO_USER_ID;

async function runE2ETest() {
  console.log('Starting E2E paragraph preservation test...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.platform === 'darwin' 
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : undefined
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable request interception to capture what bookmarklet sends
    await page.setRequestInterception(true);
    let capturedRequest = null;
    
    page.on('request', request => {
      if (request.url().includes('/process-article')) {
        capturedRequest = {
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        };
        console.log('Captured bookmarklet request');
      }
      request.continue();
    });
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      } else {
        console.log('Browser console:', msg.text());
      }
    });
    
    // Load test article (Baldwin article from test cases)
    const testHtml = await fs.readFile(
      path.join(__dirname, 'test-cases/solved/newyorker-baldwin.html'),
      'utf8'
    );
    
    // Create a local server URL or use data URL
    await page.setContent(testHtml, {
      waitUntil: 'networkidle0'
    });
    
    console.log('Loaded test article');
    
    // Inject the bookmarklet code
    const bookmarkletCode = await fs.readFile(
      path.join(__dirname, 'public/bookmarklet.js'),
      'utf8'
    );
    
    // Override the service URL in bookmarklet
    const modifiedBookmarklet = bookmarkletCode.replace(
      /var SERVICE_URL = '[^']+'/,
      `var SERVICE_URL = '${SERVICE_URL}/process-article'`
    );
    
    // Execute bookmarklet and capture extraction result
    const extractionResult = await page.evaluate((code) => {
      return new Promise((resolve, reject) => {
        // Override fetch to capture the request
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
          if (url.includes('/process-article')) {
            const body = JSON.parse(options.body);
            resolve({
              url: url,
              article: body.article,
              hasBase64: !!body.article.content_b64,
              contentLength: body.article.content?.length || 0,
              base64Length: body.article.content_b64?.length || 0
            });
            
            // Return a fake success response
            return Promise.resolve({
              json: () => Promise.resolve({ 
                success: true,
                zotero: { key: 'TEST123' },
                kindle: { messageId: 'test@example.com' }
              })
            });
          }
          return originalFetch.apply(this, arguments);
        };
        
        // Execute the bookmarklet
        try {
          eval(code);
        } catch (e) {
          reject(e);
        }
      });
    }, modifiedBookmarklet);
    
    console.log('\nExtraction Result:');
    console.log('- Has base64:', extractionResult.hasBase64);
    console.log('- Content length:', extractionResult.contentLength);
    console.log('- Base64 length:', extractionResult.base64Length);
    
    // Analyze paragraph structure
    if (extractionResult.article.content) {
      const content = extractionResult.article.content;
      const pCount = (content.match(/<p>/gi) || []).length;
      const brCount = (content.match(/<br>/gi) || []).length;
      const newlineCount = (content.match(/\n/g) || []).length;
      
      console.log('\nParagraph Structure (Raw):');
      console.log('- <p> tags:', pCount);
      console.log('- <br> tags:', brCount);
      console.log('- Newlines:', newlineCount);
      
      // Check for specific paragraph breaks
      const hasProperBreaks = content.includes('</p><p>') || content.includes('</p>\n<p>');
      console.log('- Has proper paragraph breaks:', hasProperBreaks);
      
      // Check if "He could charm" is in a separate paragraph
      const heCouldCharmIndex = content.indexOf('He could charm');
      if (heCouldCharmIndex > -1) {
        const before = content.substring(Math.max(0, heCouldCharmIndex - 50), heCouldCharmIndex);
        console.log('- Text before "He could charm":', before.replace(/\s+/g, ' '));
        console.log('- Is "He could charm" in separate <p>?:', before.includes('</p>') || before.includes('<p>'));
      }
    }
    
    // If base64 content exists, decode and check it too
    if (extractionResult.article.content_b64) {
      const decoded = Buffer.from(extractionResult.article.content_b64, 'base64').toString('utf8');
      const pCount = (decoded.match(/<p>/gi) || []).length;
      const brCount = (decoded.match(/<br>/gi) || []).length;
      const newlineCount = (decoded.match(/\n/g) || []).length;
      
      console.log('\nParagraph Structure (Base64 Decoded):');
      console.log('- <p> tags:', pCount);
      console.log('- <br> tags:', brCount);
      console.log('- Newlines:', newlineCount);
    }
    
    // Save the extracted content for analysis
    await fs.writeFile(
      'test-extraction-result.json',
      JSON.stringify(extractionResult, null, 2)
    );
    console.log('\nExtraction result saved to test-extraction-result.json');
    
    // Optional: Actually send to service and check Zotero
    if (process.env.RUN_FULL_E2E === 'true' && ZOTERO_API_KEY) {
      console.log('\nSending to actual service...');
      // This would require actual API calls to your service
      // and then fetching from Zotero API to verify
    }
    
  } finally {
    await browser.close();
  }
}

// Run the test
runE2ETest().catch(console.error);