# Article Bookmarklet Service

A cloud service that sends web articles to both Kindle and Zotero with a single bookmarklet click.

## Features

### Bookmarklet Service
- 🔐 **Works with authenticated content** - extracts articles from paywalled sites you're logged into
- 📧 **Kindle integration** - sends clean HTML that Kindle converts automatically
- 📚 **Zotero integration** - creates proper citations with EPUB attachments for highlighting
- 🎯 **Browser-side extraction** - uses Mozilla Readability.js in your browser
- ⚡ **Fast processing** - sends to both platforms in parallel
- 🛡️ **Safe for Zotero** - uses test collections and careful API integration


## Site-Specific Extraction
All site-specific extraction rules live in the `site-configs/` directory using the FiveFilters format.
The application codebase contains no domain-specific hacks—adding support for a new site means
creating a config file, not modifying code. The directory vendors the official FiveFilters
configuration repository via `git subtree`.

To pull in upstream changes, run:

```bash
npm run update:site-configs
```

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Gmail account (for Kindle email sending)
- Zotero account with API key
- Kindle device with email configured

### 2. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit with your actual credentials
nano .env
```

Required environment variables:
```
# Bookmarklet Service
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
KINDLE_EMAIL=your-username@kindle.com
ZOTERO_USER_ID=your-numeric-user-id
ZOTERO_API_KEY=your-api-key
ZOTERO_TEST_COLLECTION=optional-collection-key

```

### 3. Setup Kindle

1. Go to [Amazon Manage Your Content and Devices](https://www.amazon.com/mn/dcw/myx.html)
2. Go to Preferences → Personal Document Settings
3. Add your `EMAIL_USER` to the approved email list

### 4. Setup Zotero

1. Go to [Zotero API Keys](https://www.zotero.org/settings/keys)
2. Create new key with "Allow library access" and "Allow write access"
3. Copy your User ID and API key
4. Create a test collection called "Bookmarklet Test"

### 5. Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit http://localhost:3000 to install the bookmarklet.

### 6. Deploy to Cloud

The service is designed for DigitalOcean App Platform:

1. Push code to GitHub
2. Connect to DigitalOcean App Platform
3. Set environment variables in the dashboard
4. Deploy!

## Usage

1. Install the bookmarklet from your running service
2. Visit any article page
3. Click the bookmarklet
4. Article appears in both Kindle and Zotero!

## Architecture

```
Browser (with auth) → Bookmarklet extracts content → Cloud Service → Kindle + Zotero
```

The bookmarklet runs Mozilla Readability.js in your browser to extract clean article content, then sends it to the cloud service which formats and delivers to both platforms.

## Safety

- Zotero operations only ADD items, never modify existing ones
- Uses test collections to protect your main library
- All operations are logged for debugging
- Browser-side extraction respects your authentication

## Development & Future Plans

- **Future Enhancements**: See [METADATA_ROADMAP.md](./METADATA_ROADMAP.md) for planned metadata improvements
- **Contributing**: See [CONTRIBUTING_TO_FIVEFILTERS.md](./CONTRIBUTING_TO_FIVEFILTERS.md) for site extraction rules
- **Debug System**: See [DEBUG_SYSTEM.md](./DEBUG_SYSTEM.md) for comprehensive debugging capabilities
- **Kindle Payload Loop**: See [docs/kindle-loop.md](./docs/kindle-loop.md) for archived payloads and preview workflow

## Troubleshooting

- Check service status at your deployed URL
- Verify environment variables are set correctly
- Ensure Kindle email is approved for your sender
- Test Zotero API key permissions
- Check browser console for bookmarklet errors
