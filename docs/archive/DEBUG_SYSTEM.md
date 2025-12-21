# Debug Output System

A comprehensive debugging system that automatically captures and stores detailed logs from article extractions for troubleshooting.

## Overview

When enabled, this system captures:
- Client-side bookmarklet execution logs
- Full request/response payloads
- Server-side processing logs
- Site-specific configuration usage
- Generated EPUB files
- Email content sent to Kindle

All debug outputs are stored in a separate `latest-outputs-debug` branch to keep the main branch clean.

## Architecture

```
Article Extraction → Debug Logger → GitHub Action → Debug Branch
                          ↓
                    Local Fallback
```

### Components

1. **Debug Logger** (`src/debugLogger.js`)
   - Captures server-side logs
   - Triggers GitHub Actions via repository dispatch
   - Falls back to local storage in development

2. **Enhanced Bookmarklet** (`public/bookmarklet.js`)
   - Captures client-side extraction logs
   - Sends debug info with article payload

3. **GitHub Actions**
   - `capture-debug-outputs.yml` - Stores debug data
   - `rebase-debug-branch.yml` - Keeps debug branch updated

4. **Debug Branch** (`latest-outputs-debug`)
   - Isolated branch for debug outputs
   - Automatically rebased on main deployments
   - Force-pushed to prevent conflicts

## Setup

### 1. Environment Variables

```bash
# Enable debug capture
ENABLE_DEBUG_CAPTURE=true
GITHUB_REPOSITORY=owner/repo    # e.g., dgrobinson/article-monster
```

### 2. GitHub Authentication

Choose ONE authentication method:

#### Option A: SSH Deploy Key (Recommended for DigitalOcean)
Best for: Branch-restricted access, no API limits

1. Generate SSH key: `ssh-keygen -t ed25519 -f debug_key`
2. Add public key to GitHub repo as Deploy Key (with write access)
3. Add private key to DigitalOcean environment: `GITHUB_SSH_KEY`

#### Option B: GitHub App
Best for: Fine-grained permissions, organizational repos

1. Create GitHub App with Contents:Write permission
2. Install on your repository
3. Add to environment:
   - `GITHUB_APP_ID`
   - `GITHUB_APP_INSTALLATION_ID`
   - `GITHUB_APP_PRIVATE_KEY`

#### Option C: Personal Access Token
Best for: Quick setup, personal projects

1. Create token with `repo` scope
2. Add to environment: `GITHUB_TOKEN`

See [`docs/GITHUB_AUTH_SETUP.md`](../GITHUB_AUTH_SETUP.md) for detailed setup instructions.

### 3. Initial Branch Creation

The system automatically creates the `latest-outputs-debug` branch on first use.

## Usage

### Automatic Capture

When `ENABLE_DEBUG_CAPTURE=true`, every article extraction automatically:
1. Captures all debug information
2. Triggers GitHub Action
3. Stores output in timestamped folder

### Output Structure

```
latest-outputs-debug/
└── outputs/
    └── 20241217-143025-abc1234/
        ├── summary.md           # Quick overview
        ├── bookmarklet-log.json # Client-side logs
        ├── payload.json         # Full request payload
        ├── server-logs.json     # Server processing logs
        ├── config-used.json     # Site-specific config (if any)
        ├── article.epub         # Generated EPUB
        └── email-content.html   # Email sent to Kindle
```

### Accessing Debug Outputs

```bash
# Clone and checkout debug branch
git fetch origin latest-outputs-debug
git checkout latest-outputs-debug

# View latest output
ls -la outputs/

# Search for specific extraction
grep -r "article-title" outputs/
```

### Analyzing with AI Agents

The debug branch is perfect for AI-powered analysis:

```bash
# Launch AI agent on debug branch
git checkout latest-outputs-debug
# Point your AI agent at the outputs/ directory
# Agent can analyze patterns, propose fixes, test solutions
```

## Workflow Integration

### On Main Push

```yaml
on:
  push:
    branches: [main]
```

Automatically rebases `latest-outputs-debug` onto main to keep it current.

### On Article Extraction

```yaml
on:
  repository_dispatch:
    types: [extraction-debug]
```

Captures and stores debug output without triggering CI/CD.

## Preventing CI Loops

The system prevents infinite loops by:

1. **Branch Exclusion**: `latest-outputs-debug` doesn't trigger workflows
2. **Repository Dispatch**: Debug capture uses events, not pushes
3. **No Protection Rules**: Debug branch allows force pushes
4. **Isolated Outputs**: The `outputs/` folder only exists on debug branch

## Local Development

In development (without GitHub token):

```javascript
// Debug outputs saved locally
debug-outputs/
└── 2024-12-17T14-30-25-123Z/
    ├── server-logs.json
    └── extraction-data.json
```

## Troubleshooting

### Debug Capture Not Working

1. Check environment variables:
   ```bash
   echo $ENABLE_DEBUG_CAPTURE  # Should be "true"
   echo $GITHUB_TOKEN          # Should start with ghp_
   ```

2. Verify GitHub token permissions:
   - Needs `repo` scope
   - Test with: `curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user`

3. Check GitHub Actions:
   - Go to Actions tab → `capture-debug-outputs`
   - Check for failed runs

### Branch Issues

If rebase fails:
```bash
# Force recreate debug branch
git checkout main
git branch -D latest-outputs-debug
git checkout -b latest-outputs-debug
git push origin latest-outputs-debug --force
```

### Storage Limits

Large EPUB files are base64 encoded. If hitting limits:
- Reduce EPUB image quality
- Implement file size checks
- Use GitHub LFS for large outputs

## Security Considerations

1. **Token Security**: Never commit GitHub tokens
2. **Sensitive Data**: Review debug outputs for PII
3. **Access Control**: Limit debug branch access if needed
4. **Cleanup**: Periodically clean old debug outputs

## Future Enhancements

- [ ] Automatic cleanup of old outputs (>30 days)
- [ ] Debug output search interface
- [ ] Diff viewer for comparing extractions
- [ ] Metrics dashboard from debug data
- [ ] Webhook notifications on extraction failures

## Example Debug Session

```bash
# 1. Trigger an extraction (use bookmarklet on article)

# 2. Wait for GitHub Action to complete

# 3. Fetch latest debug data
git fetch origin latest-outputs-debug
git checkout latest-outputs-debug

# 4. Find the output
ls -la outputs/ | tail -5

# 5. Analyze the extraction
cat outputs/latest/summary.md
jq '.extraction_status' outputs/latest/server-logs.json

# 6. Open EPUB to verify content
open outputs/latest/article.epub

# 7. Check for errors
jq '.logs[] | select(.category == "error")' outputs/latest/server-logs.json
```
