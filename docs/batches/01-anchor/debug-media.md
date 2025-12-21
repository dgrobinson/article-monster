# debug-media (anchor batch)

Worktree: debug-media
Terminal: debug-media

## Goal
Align the debug bookmarklet with production extraction and unify image handling so EPUB output is consistent and predictable.

## Scope
In scope:
- Unify image URL fixing logic in public/bookmarklet.js.
- Align public/bookmarklet-debug.js with the production extraction pipeline.
- Update docs/EPUB_IMAGE_FIX.md to reflect current status and next steps.

Out of scope:
- Server-side extraction changes.
- Large refactors to the core extraction pipeline.
- Pagination features (handled elsewhere).

## Key Files
- public/bookmarklet.js
- public/bookmarklet-debug.js
- docs/EPUB_IMAGE_FIX.md
- src/server.js (content_b64 handling)

## Plan
1) Unify image URL fixing
- Identify the canonical image-fixing function.
- Remove duplicate logic or route all uses through a shared helper.
- Ensure lazy-load attributes and srcset are normalized consistently.

2) Align debug extraction behavior
- Option A: Have bookmarklet-debug.js load the same extraction logic as bookmarklet.js and add debug UI around it.
- Option B: Port the production pipeline into bookmarklet-debug.js (site config + preprocessing + XPath + JSON-LD + DOM fallback).
- Ensure debug output notes which extraction path was used.

3) Review content_b64 behavior
- Ensure bookmarklet encodes content consistently and server decoding selects the correct source.
- Confirm newline/paragraph preservation across encode/decode.

4) Update EPUB image fix doc
- Mark which phases are already implemented.
- Clarify remaining gaps and add concrete next steps if needed.

5) Add a small verification path
- Add or update a dev script to compare debug vs production output for a known URL.

## Deliverables
- Single image-fix implementation used across extraction paths.
- Debug bookmarklet output that matches production behavior.
- Updated EPUB image fix documentation.

## Acceptance
- Debug and production extraction match for a known test page.
- Image URLs are absolute and consistent in both outputs.

## Risks / Notes
- Debug bookmarklet runs in varied contexts; keep changes minimal and reversible.

## Coordination
- Touches public/bookmarklet.js; coordinate with other plans editing that file.

## Archive
Move to docs/plans/archived/01-anchor/debug-media.md when complete.
