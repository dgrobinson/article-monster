# Debug Outputs

This branch contains debug outputs from article extractions.

Each extraction creates a timestamped folder with:
- bookmarklet-log.json - Client-side extraction logs
- payload.json - Full payload sent to server  
- server-logs.json - Server processing logs
- config-used.json - Site-specific config applied (if any)
- article.epub - Generated EPUB file
- email-content.html - Email sent to Kindle
- summary.md - Quick overview of the extraction

These outputs are automatically captured when ENABLE_DEBUG_CAPTURE=true is set.
