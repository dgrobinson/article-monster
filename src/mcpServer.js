const express = require('express');
const axios = require('axios');

const mcpRouter = express.Router();

// Authentication middleware
function authenticateMCP(req, res, next) {
  const authHeader = req.headers.authorization;
  const mcpApiKey = process.env.MCP_API_KEY;

  if (!mcpApiKey) {
    console.error('MCP_API_KEY not configured');
    return res.status(500).json({ error: 'MCP not configured' });
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  if (token !== mcpApiKey) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

// Apply authentication to all MCP routes
mcpRouter.use(authenticateMCP);

// Base Zotero API configuration
function getZoteroConfig() {
  const userId = process.env.ZOTERO_USER_ID;
  const apiKey = process.env.ZOTERO_API_KEY;

  if (!userId || !apiKey) {
    throw new Error('Zotero credentials not configured');
  }

  return {
    baseUrl: `https://api.zotero.org/users/${userId}`,
    headers: {
      'Zotero-API-Key': apiKey,
      'Content-Type': 'application/json'
    }
  };
}

// Search endpoint - search across library
mcpRouter.post('/search', async (req, res) => {
  try {
    const { query, limit = 25 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    console.log(`MCP Search: "${query}"`);
    const config = getZoteroConfig();

    // Zotero search API
    const response = await axios.get(`${config.baseUrl}/items`, {
      headers: config.headers,
      params: {
        q: query,
        limit: Math.min(limit, 50), // Cap at 50
        sort: 'dateModified',
        direction: 'desc'
      }
    });

    // Format for MCP/AI consumption
    const items = response.data.map(item => ({
      key: item.key,
      type: item.data.itemType,
      title: item.data.title || 'Untitled',
      creators: item.data.creators || [],
      date: item.data.date,
      url: item.data.url,
      abstract: item.data.abstractNote,
      tags: item.data.tags || [],
      collections: item.data.collections || []
    }));

    res.json({
      query,
      count: items.length,
      items
    });

  } catch (error) {
    console.error('MCP search error:', error.message);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.response?.data?.message || error.message 
    });
  }
});

// Get specific item by key
mcpRouter.get('/item/:key', async (req, res) => {
  try {
    const { key } = req.params;
    console.log(`MCP Get Item: ${key}`);
    
    const config = getZoteroConfig();
    
    const response = await axios.get(`${config.baseUrl}/items/${key}`, {
      headers: config.headers
    });

    // Get children (attachments, notes)
    const childrenResponse = await axios.get(`${config.baseUrl}/items/${key}/children`, {
      headers: config.headers
    });

    const item = response.data;
    const children = childrenResponse.data;

    // Format detailed response
    res.json({
      key: item.key,
      version: item.version,
      data: item.data,
      attachments: children.filter(c => c.data.itemType === 'attachment').map(a => ({
        key: a.key,
        title: a.data.title,
        contentType: a.data.contentType,
        filename: a.data.filename
      })),
      notes: children.filter(c => c.data.itemType === 'note').map(n => ({
        key: n.key,
        note: n.data.note
      })),
      meta: {
        created: item.data.dateAdded,
        modified: item.data.dateModified,
        library: item.library
      }
    });

  } catch (error) {
    console.error('MCP get item error:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to get item', 
      message: error.message 
    });
  }
});

// List collections
mcpRouter.get('/collections', async (req, res) => {
  try {
    console.log('MCP List Collections');
    const config = getZoteroConfig();
    
    const response = await axios.get(`${config.baseUrl}/collections`, {
      headers: config.headers,
      params: {
        sort: 'name'
      }
    });

    const collections = response.data.map(col => ({
      key: col.key,
      name: col.data.name,
      parentCollection: col.data.parentCollection,
      itemCount: col.meta?.numItems || 0
    }));

    res.json({
      count: collections.length,
      collections
    });

  } catch (error) {
    console.error('MCP list collections error:', error.message);
    res.status(500).json({ 
      error: 'Failed to list collections', 
      message: error.message 
    });
  }
});

// List items with pagination
mcpRouter.get('/items', async (req, res) => {
  try {
    const { 
      collection, 
      limit = 25, 
      start = 0,
      sort = 'dateModified',
      direction = 'desc' 
    } = req.query;

    console.log(`MCP List Items: collection=${collection}, limit=${limit}, start=${start}`);
    const config = getZoteroConfig();

    const params = {
      limit: Math.min(parseInt(limit), 50),
      start: parseInt(start),
      sort,
      direction
    };

    const url = collection 
      ? `${config.baseUrl}/collections/${collection}/items`
      : `${config.baseUrl}/items`;

    const response = await axios.get(url, {
      headers: config.headers,
      params
    });

    const totalResults = response.headers['total-results'];

    const items = response.data.map(item => ({
      key: item.key,
      type: item.data.itemType,
      title: item.data.title || 'Untitled',
      creators: item.data.creators || [],
      date: item.data.date,
      url: item.data.url
    }));

    res.json({
      start: parseInt(start),
      limit: parseInt(limit),
      total: parseInt(totalResults) || items.length,
      items
    });

  } catch (error) {
    console.error('MCP list items error:', error.message);
    res.status(500).json({ 
      error: 'Failed to list items', 
      message: error.message 
    });
  }
});

// Add new item (be careful!)
mcpRouter.post('/item', async (req, res) => {
  try {
    const { itemType, title, url, tags, collections, abstract, creators, date } = req.body;
    
    if (!itemType || !title) {
      return res.status(400).json({ 
        error: 'itemType and title are required' 
      });
    }

    console.log(`MCP Add Item: "${title}" (${itemType})`);
    const config = getZoteroConfig();

    // Create Zotero-compatible item (similar to bookmarklet format)
    const newItem = {
      itemType,
      title,
      url: url || '',
      abstractNote: abstract || '',
      date: date || '',
      creators: creators || [],
      tags: (tags || []).map(tag => typeof tag === 'string' ? { tag, type: 1 } : tag),
      collections: collections || [],
      accessDate: new Date().toISOString().split('T')[0],
      extra: `Added via MCP API\\nDate: ${new Date().toISOString()}`
    };

    // Add itemType-specific fields
    if (itemType === 'webpage') {
      newItem.websiteTitle = title; // Use title as website title for webpages
    }

    const response = await axios.post(
      `${config.baseUrl}/items`, 
      [newItem], 
      { headers: config.headers }
    );

    if (response.data.successful && response.data.successful.length > 0) {
      const createdItem = response.data.successful[0];
      res.json({
        success: true,
        key: createdItem.key,
        version: createdItem.version
      });
    } else {
      throw new Error('Item creation failed');
    }

  } catch (error) {
    console.error('MCP add item error:', error.message);
    res.status(500).json({ 
      error: 'Failed to add item', 
      message: error.message 
    });
  }
});

// Health check for MCP
mcpRouter.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Zotero MCP Server',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!process.env.MCP_API_KEY
  });
});

module.exports = mcpRouter;