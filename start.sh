#!/bin/bash

echo "=== STARTING MAIN NODE.JS SERVER ==="
echo "Running primary bookmarklet service with web interface..."

# Start the main Node.js server (includes MCP endpoints and website)
exec node src/server.js