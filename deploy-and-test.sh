#!/bin/bash

# Automated deployment and testing script
# Handles git operations, deployment monitoring, and post-deployment testing

set -e

echo "🚀 Starting automated deployment cycle"
echo "════════════════════════════════════"

# 1. Run local tests first
echo "📝 Running local tests..."
if node test-extraction.js; then
    echo "✅ Local tests passed"
else
    echo "❌ Local tests failed - aborting deployment"
    exit 1
fi

# 2. Stage and commit changes
echo "📦 Staging changes..."
git add -A

COMMIT_MSG="${1:-Auto-commit: Extraction improvements}"
echo "💾 Committing: $COMMIT_MSG"
git commit -m "$COMMIT_MSG

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>" || {
    echo "ℹ️ No changes to commit"
    exit 0
}

# 3. Push to trigger deployment
echo "⬆️ Pushing to GitHub..."
git push origin main

# 4. Wait for deployment to start
echo "⏳ Waiting for deployment to start..."
sleep 10

# 5. Monitor deployment
echo "👀 Monitoring deployment status..."
MAX_WAIT=300  # 5 minutes max
ELAPSED=0
INTERVAL=15

while [ $ELAPSED -lt $MAX_WAIT ]; do
    STATUS=$(doctl apps list-deployments 214fb1d0-54f7-4a28-ba39-7db566e8a8e6 --format Phase --no-header | head -1)
    
    case $STATUS in
        ACTIVE)
            echo "✅ Deployment successful!"
            break
            ;;
        ERROR)
            echo "❌ Deployment failed!"
            exit 1
            ;;
        BUILDING|DEPLOYING)
            echo "⏳ Status: $STATUS (${ELAPSED}s elapsed)"
            sleep $INTERVAL
            ELAPSED=$((ELAPSED + INTERVAL))
            ;;
        *)
            echo "❓ Unknown status: $STATUS"
            sleep $INTERVAL
            ELAPSED=$((ELAPSED + INTERVAL))
            ;;
    esac
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "⏰ Deployment timed out after ${MAX_WAIT}s"
    exit 1
fi

# 6. Wait a bit for service to stabilize
echo "⏳ Waiting for service to stabilize..."
sleep 10

# 7. Check deployment logs for errors
echo "📋 Checking recent logs..."
doctl apps logs 214fb1d0-54f7-4a28-ba39-7db566e8a8e6 --tail 50 | grep -E "(error|Error|ERROR|failed|Failed)" | tail -5 || echo "No errors in recent logs"

# 8. Test with the bookmarklet (if URL provided)
if [ -n "$2" ]; then
    echo "🧪 Testing with article: $2"
    # This would need a headless browser or API call to test
    echo "(Manual testing required for now)"
fi

echo "════════════════════════════════════"
echo "🎉 Deployment cycle complete!"
echo ""
echo "Next steps:"
echo "1. Test the bookmarklet on problem articles"
echo "2. Check server logs: doctl apps logs 214fb1d0-54f7-4a28-ba39-7db566e8a8e6 --tail 100"
echo "3. Run local tests again: node test-extraction.js"