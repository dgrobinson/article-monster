#!/bin/bash

echo "=== STARTING BOOKMARKLET SERVICE ==="
echo "Running Node.js server..."

# Run Node.js server directly
exec node src/server.js
