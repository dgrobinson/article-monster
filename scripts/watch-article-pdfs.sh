#!/bin/bash

# PDF Reference Monitoring Script
# Watches a folder for PDFs, commits them to debug branch, then deletes locally

WATCH_DIR="$HOME/code/local-pdfs"
REPO_DIR="$HOME/code/article-monster"
MAIN_BRANCH="main"
DEBUG_BRANCH="latest-outputs-debug"

# Ensure watch directory exists
mkdir -p "$WATCH_DIR"

echo "📂 Watching $WATCH_DIR for PDFs..."
echo "Place PDFs here and they will be:"
echo "  1. Committed to main branch as test cases"
echo "  2. Paired with recent debug outputs from $DEBUG_BRANCH"
echo "  3. Deleted locally after successful commit"

# Process any existing PDFs first
process_pdfs() {
  for pdf in "$WATCH_DIR"/*.pdf; do
    [ -f "$pdf" ] || continue
    
    echo "📄 Processing: $(basename "$pdf")"
    
    # Extract info from filename
    filename=$(basename "$pdf")
    title="${filename%.pdf}"
    timestamp=$(date +%Y%m%d-%H%M%S)
    
    # Clean title for folder name
    folder_name=$(echo "$title" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]//g')
    
    cd "$REPO_DIR" || exit 1
    
    # Make sure we're on main branch
    git checkout "$MAIN_BRANCH"
    git pull origin "$MAIN_BRANCH"
    
    # Fetch debug branch to access its outputs
    git fetch origin "$DEBUG_BRANCH"
    
    # Find matching debug output from debug branch (most recent)
    git checkout origin/"$DEBUG_BRANCH" -- outputs/ 2>/dev/null || true
    latest_debug=$(ls -dt outputs/*/ 2>/dev/null | head -1)
    
    # Switch back to main
    git checkout "$MAIN_BRANCH"
    
    # Create test case folder in pdf-references subdirectory
    test_case_dir="test-cases/pdf-references/${folder_name}-${timestamp}"
    mkdir -p "$test_case_dir"
    
    # Copy PDF
    cp "$pdf" "$test_case_dir/reference.pdf"
    
    # Link to debug output if found
    if [ -n "$latest_debug" ] && [ -d "$latest_debug" ]; then
      echo "🔗 Linking to debug output: $latest_debug"
      cp -r "$latest_debug" "$test_case_dir/debug-output"
      
      # Extract expected values from debug output
      cat > "$test_case_dir/expected.json" << EOF
{
  "title": "$(grep '"title"' "$latest_debug/payload.json" | head -1 | cut -d'"' -f4)",
  "contentLength": $(grep '"content"' "$latest_debug/payload.json" | head -1 | wc -c),
  "hasImages": $(grep -q '<img' "$latest_debug/email-content.html" && echo "true" || echo "false"),
  "paragraphCount": $(grep -c '<p' "$latest_debug/email-content.html" 2>/dev/null || echo 0)
}
EOF
    fi
    
    # Create metadata
    cat > "$test_case_dir/metadata.json" << EOF
{
  "id": "${folder_name}-${timestamp}",
  "title": "$title",
  "filename": "$filename",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "linkedDebugOutput": "$(basename "$latest_debug" 2>/dev/null)"
}
EOF
    
    # Update manifest
    manifest_file="test-cases/pdf-references/manifest.json"
    if [ ! -f "$manifest_file" ]; then
      mkdir -p "$(dirname "$manifest_file")"
      echo '{"testCases": []}' > "$manifest_file"
    fi
    
    # Add to manifest (using jq if available, otherwise append manually)
    if command -v jq &> /dev/null; then
      jq ".testCases += [{\"id\": \"${folder_name}-${timestamp}\", \"url\": \"unknown\", \"title\": \"$title\"}]" \
        "$manifest_file" > "$manifest_file.tmp" && mv "$manifest_file.tmp" "$manifest_file"
    fi
    
    # Clean up temporary outputs directory
    rm -rf outputs/
    
    # Commit to main branch
    git add "$test_case_dir" "$manifest_file"
    git commit -m "test: add reference PDF test case for '$title'

Automatically captured from local filesystem
Linked to debug output: $(basename "$latest_debug" 2>/dev/null)"
    
    # Push to main
    if git push origin "$MAIN_BRANCH"; then
      echo "✅ Successfully committed to main: $filename"
      # Delete local PDF after successful push
      rm "$pdf"
      echo "🗑️  Deleted local file: $pdf"
    else
      echo "❌ Failed to push to main, keeping local file: $pdf"
    fi
  done
}

# Process existing PDFs
process_pdfs

# Watch for new PDFs (requires fswatch)
if command -v fswatch &> /dev/null; then
  fswatch -o "$WATCH_DIR" | while read event; do
    echo "📥 New file detected"
    process_pdfs
  done
else
  echo "⚠️  fswatch not installed. Install with: brew install fswatch"
  echo "Running in one-time mode (processing existing files only)"
fi