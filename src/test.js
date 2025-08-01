require('dotenv').config();
const { extractArticle } = require('./articleExtractor');

// Test article extraction with a few different sites
async function testExtraction() {
  const testUrls = [
    'https://example.com', // Simple test case
    'https://en.wikipedia.org/wiki/Node.js', // Complex content
  ];

  console.log('🧪 Testing article extraction...\n');

  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`);
      const article = await extractArticle(url);
      
      console.log(`✅ Success!`);
      console.log(`   Title: ${article.title}`);
      console.log(`   Length: ${article.length} characters`);
      console.log(`   Excerpt: ${article.excerpt.substring(0, 100)}...`);
      console.log(`   Site: ${article.siteName}`);
      console.log(`   Author: ${article.byline || 'Unknown'}\n`);
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}\n`);
    }
  }
}

// Test environment variables
function testConfig() {
  console.log('🔧 Testing configuration...\n');

  const required = [
    'EMAIL_USER',
    'EMAIL_PASS', 
    'KINDLE_EMAIL',
    'ZOTERO_USER_ID',
    'ZOTERO_API_KEY'
  ];

  let allGood = true;

  for (const key of required) {
    const value = process.env[key];
    if (value) {
      console.log(`✅ ${key}: ${key.includes('PASS') || key.includes('KEY') ? '***' : value}`);
    } else {
      console.log(`❌ ${key}: Missing`);
      allGood = false;
    }
  }

  console.log(`\n${allGood ? '✅ Configuration looks good!' : '❌ Configuration incomplete - check .env file'}\n`);
}

// Run tests
async function runTests() {
  console.log('📚 Article Bookmarklet Service - Local Tests\n');
  
  testConfig();
  await testExtraction();
  
  console.log('🎉 Tests complete! Start the server with: npm run dev');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testExtraction, testConfig };