#!/bin/bash

echo "=== PURE FASTMCP DEPLOYMENT ATTEMPT ==="
echo "Trying to start FastMCP Python server on main port..."

# Check if Python3 and dependencies are available
if ! command -v python3 &> /dev/null; then
    echo "Python3 not found, falling back to Node.js"
    echo "=== FALLBACK TO BOOKMARKLET-ONLY NODE.JS ==="
    node src/bookmarkletOnly.js
    exit 0
fi

# Check if FastMCP dependencies are installed
if ! python3 -c "import fastmcp" 2>/dev/null; then
    echo "FastMCP not installed, falling back to Node.js"
    echo "=== FALLBACK TO BOOKMARKLET-ONLY NODE.JS ==="
    node src/bookmarkletOnly.js
    exit 0
fi

echo "Python3 and FastMCP available, starting pure FastMCP server..."

# Try to start FastMCP Python server
exec python3 src/mcpFastMCP.py