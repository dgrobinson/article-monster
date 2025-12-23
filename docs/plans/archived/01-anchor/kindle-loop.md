# kindle-loop (anchor batch)

Worktree: kindle-loop
Terminal: kindle-loop

## Goal
Close the loop on Kindle output by capturing the exact payload we send and providing a repeatable preview workflow.

## Scope
In scope:
- Archive outbound Kindle HTML (and metadata) for inspection.
- Provide a secure way to download or preview archived payloads.
- Add a local preview path using Kindle Previewer (or EPUB reader fallback).
- Log sanity metrics (length, image count, hash) to detect regressions.

Out of scope:
- Retrieving rendered output from the Kindle device (no official API).
- Changing extraction logic beyond what is needed to capture artifacts.

## Key Files
- src/kindleSender.js
- src/server.js
- scripts/
- docs/

## Plan
1) Capture outbound payload
- Store the HTML returned by createKindleHTML along with metadata.
- Include stable identifiers (timestamp, hostname, title slug, hash).
- Add retention policy (age cap or max count).

2) Expose preview access (server-side)
- Add a debug endpoint to download or view the stored HTML.
- Guard access (env flag or debug auth).
- Add a list endpoint for recent payloads (optional).

3) Local preview workflow
- Add a script to open archived HTML in Kindle Previewer if installed.
- Provide a fallback that opens in a standard EPUB/HTML viewer.
- Document how to validate against expected phrases/length.

4) Log sanity metrics
- Record content length, image count, and hash at send time.
- Emit these in server logs and debug output.

## Deliverables
- Archived Kindle payloads with metadata.
- Debug endpoint to fetch payloads.
- Local preview script + documentation.

## Acceptance
- We can inspect the exact HTML sent for any delivery.
- Preview workflow is repeatable and documented.
- Logs show payload metrics for regression spotting.

## Risks / Notes
- Avoid storing sensitive content in production without retention controls.
- Ensure debug endpoints are gated and disabled by default.

## Coordination
- debug-media: align image handling so archived HTML matches production behavior.
- docs-cleanup: link the loop doc from README or docs index.

## Archive
Move to docs/plans/archived/01-anchor/kindle-loop.md when complete.
