# GitHub Authentication for Debug Outputs

This guide explains how to set up secure, branch-restricted GitHub access for the debug system from DigitalOcean App Platform.

## Option 1: Deploy Key with Branch Protection (Recommended)

### Step 1: Generate Deploy Key

```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "article-monster-debug@digitalocean" -f debug_deploy_key

# This creates:
# - debug_deploy_key (private key - for DigitalOcean)
# - debug_deploy_key.pub (public key - for GitHub)
```

### Step 2: Add Deploy Key to GitHub

1. Go to your repo → Settings → Deploy keys
2. Click "Add deploy key"
3. Title: "DigitalOcean Debug Output Writer"
4. Key: Contents of `debug_deploy_key.pub`
5. ✅ Allow write access
6. Click "Add key"

### Step 3: Configure Branch Protection

Since deploy keys have full repo write access, protect other branches:

1. Go to Settings → Branches
2. Add rule for `main`:
   - ✅ Restrict who can push to matching branches
   - Add yourself/team (exclude deploy key)
3. Add rule for `latest-outputs-debug`:
   - No restrictions (allow deploy key)

### Step 4: Configure in DigitalOcean

Add these environment variables in DigitalOcean App Platform:

```bash
# Use the private key content
GITHUB_SSH_KEY="-----BEGIN OPENSSH PRIVATE KEY-----
[your private key content]
-----END OPENSSH PRIVATE KEY-----"

GITHUB_REPOSITORY="dgrobinson/article-monster"
ENABLE_DEBUG_CAPTURE="true"
```

## Option 2: GitHub App (More Granular)

### Step 1: Create GitHub App

1. Go to Settings → Developer settings → GitHub Apps
2. Click "New GitHub App"
3. Configure:
   - Name: "Article Monster Debug Writer"
   - Homepage URL: Your DigitalOcean app URL
   - Webhook: Disable
   - Permissions:
     - Repository permissions:
       - Contents: Write
       - Metadata: Read
   - Where can this GitHub App be installed: Only on this account

### Step 2: Install App

1. After creation, click "Install App"
2. Choose your repository
3. Note the Installation ID from the URL

### Step 3: Generate Private Key

1. In the GitHub App settings, scroll to "Private keys"
2. Click "Generate a private key"
3. Save the downloaded `.pem` file

### Step 4: Configure in DigitalOcean

```bash
GITHUB_APP_ID="123456"
GITHUB_APP_INSTALLATION_ID="12345678"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
[your private key content]
-----END RSA PRIVATE KEY-----"
GITHUB_REPOSITORY="dgrobinson/article-monster"
ENABLE_DEBUG_CAPTURE="true"
```

## Option 3: Fine-Grained Personal Access Token

### Step 1: Create Token

1. Go to Settings → Developer settings → Personal access tokens → Fine-grained tokens
2. Click "Generate new token"
3. Configure:
   - Name: "DigitalOcean Debug Writer"
   - Expiration: 90 days (or custom)
   - Repository access: Select your repo
   - Permissions:
     - Contents: Write
     - Metadata: Read
   - No account permissions

### Step 2: Configure in DigitalOcean

```bash
GITHUB_TOKEN="github_pat_xxxxxxxxxxxxx"
GITHUB_REPOSITORY="dgrobinson/article-monster"
ENABLE_DEBUG_CAPTURE="true"
```

### Note on Branch Restrictions

Fine-grained tokens can't be restricted to specific branches via GitHub UI, but you can:
1. Create a separate GitHub account for automation
2. Give it write access only via branch protection rules
3. Use that account's token

## Implementation Details

The system automatically detects which auth method to use based on environment variables:

1. **SSH Deploy Key** (`GITHUB_SSH_KEY` present)
   - Uses direct git operations
   - Clones, commits, and pushes via SSH
   - Most efficient for branch-specific writes

2. **GitHub App** (`GITHUB_APP_ID` + `GITHUB_APP_PRIVATE_KEY`)
   - Generates JWT for authentication
   - Gets installation access token
   - Uses API for repository dispatch

3. **Personal Access Token** (`GITHUB_TOKEN`)
   - Simple bearer token authentication
   - Uses API for repository dispatch

## Security Best Practices

1. **Never commit credentials** - Use DigitalOcean's environment variables
2. **Rotate tokens regularly** - Set expiration reminders
3. **Use least privilege** - Only grant necessary permissions
4. **Monitor usage** - Check GitHub audit logs regularly

## Verification

After setup, test the debug system:

```bash
# In DigitalOcean console or SSH
curl -X POST https://your-app.ondigitalocean.app/test-debug

# Check GitHub for new branch/commits
git fetch origin latest-outputs-debug
git log origin/latest-outputs-debug --oneline
```