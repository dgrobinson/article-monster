const express = require('express');
const axios = require('axios');

const chatgptRouter = express.Router();

// Base Zotero API configuration (same as MCP server)
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
chatgptRouter.post('/search', async (req, res) => {
  try {
    const { query, limit = 25 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    console.log(`ChatGPT Search: "${query}"`);
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

    // Format for ChatGPT consumption
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
    console.error('ChatGPT search error:', error.message);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.response?.data?.message || error.message 
    });
  }
});

// Get specific item by key
chatgptRouter.get('/item/:key', async (req, res) => {
  try {
    const { key } = req.params;
    console.log(`ChatGPT Get Item: ${key}`);
    
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

    // Format detailed response for ChatGPT
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
    console.error('ChatGPT get item error:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to get item', 
      message: error.message 
    });
  }
});

// List items with pagination
chatgptRouter.get('/items', async (req, res) => {
  try {
    const { 
      collection, 
      limit = 25, 
      start = 0,
      sort = 'dateModified',
      direction = 'desc' 
    } = req.query;

    console.log(`ChatGPT List Items: collection=${collection}, limit=${limit}, start=${start}`);
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
    console.error('ChatGPT list items error:', error.message);
    res.status(500).json({ 
      error: 'Failed to list items', 
      message: error.message 
    });
  }
});

// OpenAPI schema for ChatGPT Actions discovery
chatgptRouter.get('/openapi.yaml', (req, res) => {
  res.setHeader('Content-Type', 'application/x-yaml');
  res.send(`openapi: 3.0.0
info:
  title: Personal Zotero Library Access
  version: 1.0.0
  description: Access your personal Zotero research library for AI assistance
servers:
  - url: https://seal-app-t4vff.ondigitalocean.app/chatgpt

paths:
  /search:
    post:
      summary: Search Zotero library
      description: Search across all items in your personal Zotero library
      operationId: searchLibrary
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                query:
                  type: string
                  description: Search terms (title, author, keywords, etc.)
                limit:
                  type: integer
                  default: 25
                  maximum: 50
              required:
                - query
      responses:
        '200':
          description: Search results from your library

  /item/{key}:
    get:
      summary: Get detailed item information
      operationId: getItemDetails
      parameters:
        - name: key
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Detailed item information

  /items:
    get:
      summary: Browse library items
      operationId: listItems
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 25
        - name: start
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: List of library items`);
});

// Health check for ChatGPT
chatgptRouter.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'ChatGPT Zotero Integration',
    authentication: 'none',
    timestamp: new Date().toISOString()
  });
});

module.exports = chatgptRouter;