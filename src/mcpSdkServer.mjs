#!/usr/bin/env node

/**
 * Official MCP SDK Server for Zotero Integration
 * 
 * This provides proper MCP protocol support for ChatGPT and other MCP clients.
 * Runs alongside the custom REST API for maximum compatibility.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import 'dotenv/config';

// Zotero API configuration
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

// Create MCP server instance
const server = new Server(
  {
    name: 'zotero-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_zotero',
        description: 'Search for items in your Zotero library',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search terms to find in your library'
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results to return (default: 25, max: 50)',
              default: 25
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_zotero_item',
        description: 'Get detailed information about a specific Zotero item',
        inputSchema: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'The Zotero item key to retrieve'
            }
          },
          required: ['key']
        }
      },
      {
        name: 'list_zotero_collections',
        description: 'List all collections in your Zotero library',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'list_zotero_items',
        description: 'List items in your Zotero library with pagination',
        inputSchema: {
          type: 'object',
          properties: {
            collection: {
              type: 'string',
              description: 'Collection key to filter by (optional)'
            },
            limit: {
              type: 'number',
              description: 'Number of items to return (default: 25, max: 50)',
              default: 25
            },
            start: {
              type: 'number',
              description: 'Starting index for pagination (default: 0)',
              default: 0
            },
            sort: {
              type: 'string',
              description: 'Sort field (default: dateModified)',
              default: 'dateModified'
            },
            direction: {
              type: 'string',
              description: 'Sort direction: asc or desc (default: desc)',
              default: 'desc'
            }
          }
        }
      },
      {
        name: 'add_zotero_item',
        description: 'Add a new item to your Zotero library',
        inputSchema: {
          type: 'object',
          properties: {
            itemType: {
              type: 'string',
              description: 'Type of item (webpage, journalArticle, book, etc.)'
            },
            title: {
              type: 'string',
              description: 'Title of the item'
            },
            url: {
              type: 'string',
              description: 'URL of the item (optional)'
            },
            abstract: {
              type: 'string',
              description: 'Abstract or summary (optional)'
            },
            creators: {
              type: 'array',
              description: 'Array of creator objects with firstName, lastName, creatorType',
              items: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  creatorType: { type: 'string', default: 'author' }
                }
              }
            },
            date: {
              type: 'string',
              description: 'Publication date (optional)'
            },
            tags: {
              type: 'array',
              description: 'Array of tag strings',
              items: { type: 'string' }
            },
            collections: {
              type: 'array',
              description: 'Array of collection keys to add item to',
              items: { type: 'string' }
            }
          },
          required: ['itemType', 'title']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const config = getZoteroConfig();

    switch (name) {
      case 'search_zotero': {
        const { query, limit = 25 } = args;
        
        if (!query) {
          throw new McpError(ErrorCode.InvalidParams, 'Search query is required');
        }

        const response = await axios.get(`${config.baseUrl}/items`, {
          headers: config.headers,
          params: {
            q: query,
            limit: Math.min(limit, 50),
            sort: 'dateModified',
            direction: 'desc'
          }
        });

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

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                query,
                count: items.length,
                items
              }, null, 2)
            }
          ]
        };
      }

      case 'get_zotero_item': {
        const { key } = args;
        
        if (!key) {
          throw new McpError(ErrorCode.InvalidParams, 'Item key is required');
        }

        const [itemResponse, childrenResponse] = await Promise.all([
          axios.get(`${config.baseUrl}/items/${key}`, { headers: config.headers }),
          axios.get(`${config.baseUrl}/items/${key}/children`, { headers: config.headers })
        ]);

        const item = itemResponse.data;
        const children = childrenResponse.data;

        const result = {
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
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      }

      case 'list_zotero_collections': {
        try {
          const response = await axios.get(`${config.baseUrl}/collections`, {
            headers: config.headers,
            params: { sort: 'name' }
          });

          const collections = response.data.map(col => ({
            key: col.key,
            name: col.data.name,
            parentCollection: col.data.parentCollection,
            itemCount: col.meta?.numItems || 0
          }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  count: collections.length,
                  collections
                }, null, 2)
              }
            ]
          };
        } catch (collectionError) {
          // Handle case where user has no collections or API doesn't support it
          if (collectionError.response?.status === 400 || collectionError.response?.status === 404) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    count: 0,
                    collections: [],
                    note: 'No collections found or collections API not available for this account'
                  }, null, 2)
                }
              ]
            };
          }
          throw collectionError;
        }
      }

      case 'list_zotero_items': {
        const { 
          collection, 
          limit = 25, 
          start = 0,
          sort = 'dateModified',
          direction = 'desc' 
        } = args;

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

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                start: parseInt(start),
                limit: parseInt(limit),
                total: parseInt(totalResults) || items.length,
                items
              }, null, 2)
            }
          ]
        };
      }

      case 'add_zotero_item': {
        const { itemType, title, url, tags, collections, abstract, creators, date } = args;
        
        if (!itemType || !title) {
          throw new McpError(ErrorCode.InvalidParams, 'itemType and title are required');
        }

        const newItem = {
          itemType,
          title,
          url: url || '',
          abstractNote: abstract || '',
          date: date || '',
          creators: creators || [],
          tags: (tags || []).map(tag => ({ tag, type: 1 })),
          collections: collections || [],
          accessDate: new Date().toISOString().split('T')[0],
          extra: `Added via MCP SDK\\nDate: ${new Date().toISOString()}`
        };

        if (itemType === 'webpage') {
          newItem.websiteTitle = title;
        }

        const response = await axios.post(
          `${config.baseUrl}/items`, 
          [newItem], 
          { headers: config.headers }
        );

        if (response.data.successful && response.data.successful.length > 0) {
          const createdItem = response.data.successful[0];
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  key: createdItem.key,
                  version: createdItem.version,
                  message: `Successfully added "${title}" to your Zotero library`
                }, null, 2)
              }
            ]
          };
        } else {
          throw new McpError(ErrorCode.InternalError, 'Item creation failed');
        }
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

  } catch (error) {
    console.error(`MCP SDK Error in ${name}:`, error.message);
    
    if (error instanceof McpError) {
      throw error;
    }
    
    // Handle Axios errors
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      
      if (status === 404) {
        throw new McpError(ErrorCode.InvalidParams, 'Item not found');
      } else if (status === 403) {
        throw new McpError(ErrorCode.InvalidParams, 'Access denied - check Zotero API permissions');
      } else if (status === 400) {
        throw new McpError(ErrorCode.InvalidParams, `Invalid request: ${message}`);
      }
    }
    
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Zotero MCP SDK Server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});