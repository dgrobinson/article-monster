#!/usr/bin/env node

// Generate a secure API key for MCP server
const crypto = require('crypto');

const key = crypto.randomBytes(32).toString('hex');

console.log('\n🔑 Generated MCP API Key:\n');
console.log(key);
console.log('\nAdd this to your .env file as:');
console.log(`MCP_API_KEY=${key}`);
console.log('\nOr set in DigitalOcean environment variables (marked as encrypted)');
console.log('\n⚠️  Keep this key secret! Only share with your AI assistants.\n');