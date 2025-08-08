const axios = require('axios');

// Test MCP endpoints locally
async function testMCP() {
  const baseUrl = 'http://localhost:3000';
  const mcpApiKey = process.env.MCP_API_KEY || 'test-key-12345';
  
  console.log('🧪 Testing MCP Server Endpoints...\n');
  
  // Test without auth
  try {
    console.log('1. Testing without authentication...');
    await axios.get(`${baseUrl}/mcp/health`);
    console.log('❌ FAIL: Should require authentication\n');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ PASS: Authentication required\n');
    } else {
      console.log('❌ Unexpected error:', error.message, '\n');
    }
  }
  
  // Test with auth
  const headers = {
    'Authorization': `Bearer ${mcpApiKey}`
  };
  
  try {
    console.log('2. Testing health check with auth...');
    const health = await axios.get(`${baseUrl}/mcp/health`, { headers });
    console.log('✅ PASS: Health check works');
    console.log('Response:', health.data, '\n');
  } catch (error) {
    console.log('❌ FAIL:', error.response?.data || error.message, '\n');
  }
  
  // Test search (if Zotero is configured)
  if (process.env.ZOTERO_USER_ID && process.env.ZOTERO_API_KEY) {
    try {
      console.log('3. Testing search endpoint...');
      const search = await axios.post(`${baseUrl}/mcp/search`, {
        query: 'test',
        limit: 5
      }, { headers });
      console.log('✅ PASS: Search works');
      console.log(`Found ${search.data.count} items\n`);
    } catch (error) {
      console.log('❌ FAIL:', error.response?.data || error.message, '\n');
    }
    
    try {
      console.log('4. Testing collections endpoint...');
      const collections = await axios.get(`${baseUrl}/mcp/collections`, { headers });
      console.log('✅ PASS: Collections work');
      console.log(`Found ${collections.data.count} collections\n`);
    } catch (error) {
      console.log('❌ FAIL:', error.response?.data || error.message, '\n');
    }
  } else {
    console.log('⚠️  Skipping Zotero tests (credentials not configured)\n');
  }
  
  console.log('🎉 MCP tests complete!');
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  testMCP().catch(console.error);
}

module.exports = { testMCP };