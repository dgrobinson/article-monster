# EPUB Image Fix Status

## Current State
Phase 1 (URL fixing) is implemented and unified:
- `public/bookmarklet.js` uses a single `fixImageUrls` path for all extraction flows.
- The fixer normalizes `src`, `data-src`, and `srcset` to absolute URLs.
- Debug extraction uses the production pipeline, so it shares the same image handling.

## Remaining Gap
Server-side EPUB generation still cannot fetch authenticated images (cookies do not transfer).

## Next Steps (If Needed)
Phase 2 (critical image embedding) is not implemented yet. If auth-gated images are still required:
1) Embed a small number of key images as base64 client-side.
2) Skip tiny icons and very large assets to keep payloads reasonable.
3) Add telemetry or logging to tune size thresholds.

## Notes
- This change only targets URL normalization; it does not modify server-side extraction or EPUB generation.
