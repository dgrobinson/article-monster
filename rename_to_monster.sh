#!/bin/bash

# Script to rename article-library to article-monster

echo "🦾 Renaming article-library to article-monster..."

# Get the parent directory
PARENT_DIR=$(dirname "$(pwd)")

# Check if we're in the right directory
if [[ $(basename "$(pwd)") != "article-library" ]]; then
    echo "❌ Error: This script must be run from within the article-library directory"
    exit 1
fi

# Move to parent directory and rename
cd "$PARENT_DIR" && mv article-library article-monster

if [ $? -eq 0 ]; then
    echo "✅ Successfully renamed directory to article-monster!"
    echo "📁 New path: $PARENT_DIR/article-monster"
    echo ""
    echo "Next steps:"
    echo "1. cd $PARENT_DIR/article-monster"
    echo "2. Update your GitHub repository name"
else
    echo "❌ Failed to rename directory"
    exit 1
fi