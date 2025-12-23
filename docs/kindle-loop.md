# Kindle Payload Loop

This workflow captures the exact HTML sent to Kindle, keeps a short archive for inspection, and provides a repeatable preview path.

## Archive behavior
- Each Kindle send stores the HTML plus metadata (timestamp, hostname, title slug, hash).
- Default archive location: `kindle-archive/` in the repo root.
- Retention is enforced on write (max age and/or max count).

Metadata fields include: `id`, `timestamp`, `hostname`, `title`, `titleSlug`, `url`, `hash`, `contentLength`, `imageCount`.

### Configuration
Set these environment variables as needed:
```
KINDLE_ARCHIVE_DIR=./kindle-archive
KINDLE_ARCHIVE_MAX_COUNT=200
KINDLE_ARCHIVE_MAX_AGE_DAYS=30
ENABLE_KINDLE_ARCHIVE_DEBUG=false
# Optional: require this token for debug endpoints
# KINDLE_ARCHIVE_DEBUG_TOKEN=your-token
```

## Debug endpoints (gated)
Enable the endpoints with `ENABLE_KINDLE_ARCHIVE_DEBUG=true`. If `KINDLE_ARCHIVE_DEBUG_TOKEN` is set, pass it as `x-debug-token` or `?token=...`.

- List recent payloads:
  - `GET /debug/kindle-payloads?limit=50`
- Fetch a payload by id:
  - `GET /debug/kindle-payloads/:id`
  - Add `?format=json` to return metadata + HTML in JSON.
- Capture a payload without sending email:
  - `POST /debug/capture-article`

## Preview workflow
1) Find a payload id from the archive directory or the list endpoint.
2) Run the preview script:
```
npm run preview:kindle -- --latest
npm run preview:kindle -- --id <payload-id>
npm run preview:kindle -- --file /path/to/payload.html
```
3) The script opens Kindle Previewer if installed, otherwise it falls back to your default viewer.

### Optional override
If Kindle Previewer is installed in a non-standard location:
```
KINDLE_PREVIEWER_BIN=/path/to/Kindle\ Previewer
```

## Capture new payloads (bookmarklet runner)
Use the capture script to run the bookmarklet on a live URL and archive the HTML without sending mail.

Local mode (default) archives to your local `kindle-archive/`:
```
npm run capture:bookmarklet -- --url "https://example.com/article"
```

Server mode posts the captured payload to the debug endpoint:
```
npm run capture:bookmarklet -- --mode server --url "https://example.com/article" --service-origin http://localhost:3000 --token your-token
```

Optional flags:
- `--bookmarklet-source remote|local` (remote loads from the service; local uses `public/bookmarklet.js`)
- `--headful` to see the browser window
- `--timeout-ms 30000` to adjust capture timeout

The script prints the archive `id` and metrics; then run `npm run preview:kindle -- --id <id>` to inspect.

## Metrics
Each send logs `contentLength`, `imageCount`, and `hash` so regressions can be spotted quickly.
