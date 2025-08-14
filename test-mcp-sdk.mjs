#!/usr/bin/env node

/**
 * Test script for the official MCP SDK server
 * This simulates what ChatGPT would do when calling our MCP server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testMCPServer() {
  console.log('🧪 Testing MCP SDK Server...\n');

  // Start the MCP server process
  const mcpServer = spawn('node', [path.join(__dirname, 'src/mcpSdkServer.mjs')], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: process.env
  });

  // Test 1: List tools
  console.log('1️⃣  Testing list_tools...');
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };

  mcpServer.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  // Test 2: Search Zotero
  console.log('2️⃣  Testing search_zotero...');
  const searchRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'search_zotero',
      arguments: {
        query: 'AI',
        limit: 3
      }
    }
  };

  setTimeout(() => {
    mcpServer.stdin.write(JSON.stringify(searchRequest) + '\n');
  }, 1000);

  // Collect output
  let output = '';
  mcpServer.stdout.on('data', (data) => {
    output += data.toString();
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          console.log('📥 Response:', JSON.stringify(response, null, 2));
        } catch (e) {
          console.log('📝 Raw output:', line);
        }
      }
    }
  });

  mcpServer.stderr.on('data', (data) => {
    console.log('🔧 Server log:', data.toString());
  });

  // Cleanup after 10 seconds
  setTimeout(() => {
    console.log('\n✅ Test complete, shutting down server...');
    mcpServer.kill();
    process.exit(0);
  }, 10000);

  mcpServer.on('exit', (code) => {
    console.log(`\n🏁 MCP server exited with code: ${code}`);
  });
}

testMCPServer().catch(console.error);