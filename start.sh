#!/bin/bash

echo "=== STARTING SMART ROUTER ==="
echo "This will run both FastMCP (for ChatGPT) and Node.js (for website)..."
echo "- /sse → Pure FastMCP for ChatGPT MCP"
echo "- Everything else → Node.js for website/bookmarklet"

# Start the smart router that manages both services
exec node src/router.js