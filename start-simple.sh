#!/bin/bash

echo "=== STARTING BOOKMARKLET SERVICE (SIMPLE MODE) ==="
echo "Running Node.js server directly without FastMCP or router..."

# Run Node.js server directly
exec node src/server.js