---
name: test-harness-rebuild
description: Rebuild extraction test harness to mirror bookmarklet flow with EPUB-based goldens
---

# Test Harness Rebuild (Completed)

Status: completed during the anchor batch. The final plan lives at `docs/plans/archived/anchor/test-harness.md`.

Current harness documentation lives in `test-cases/README.md`.

# Plan (Historical)

Rebuild the extraction test harness to mirror the bookmarklet pipeline (preprocess -> XPath -> Readability fallback) and reduce drift. Keep separate schemas for unsolved vs goldens, and rely on EPUB goldens for completeness (pagination out of scope).

## Requirements
- Use the bookmarklet extraction path as source of truth; Readability output is used when XPath fails or no config.
- Tests run offline against saved HTML or inline content.
- Unsolved cases are lightweight; goldens use EPUB-derived checks.
- Goldens are committed in-repo; CI does not sync from `latest-outputs-debug` (manual refresh only).
- Missing optional fields never crash tests.
- No site-config edits; loader pattern unchanged.
- Focus on substantive completeness, not pagination.

## Scope
- In: Normalize test-case formats, fix test runners, align FiveFilters test path with production parser/preprocessing, update docs/scripts.
- Out: Change extraction logic, add/modify site configs, pagination handling.

## Files and entry points
- test/dev-scripts/test-extraction.js
- test/dev-scripts/test-extraction-with-fivefilters.js
- test/validate-extraction.js
- test-cases/README.md
- test-cases/solved/
- test-cases/unsolved/
- test/goldens.manifest.json
- scripts/sync-goldens.js
- src/configFetcher.js
- public/bookmarklet.js
- package.json

## Data model / API changes
- Unsolved schema (JSON): name, url, and one of htmlFile or content; optional expectedPhrases, minLength, notes.
- Golden schema (manifest + files): test/goldens.manifest.json entries drive scripts/sync-goldens.js to create test-cases/solved/*.expected.epub plus minimal metadata JSON; validations derive from EPUB when possible.
- PDF references become optional/manual; not part of default npm test.

## Action items
[ ] Define the unsolved schema and update test-cases/unsolved and test-cases/solved fixtures to match their respective formats.
[ ] Harden test/dev-scripts/test-extraction.js for inline HTML and missing optional fields; avoid path ops when htmlFile is absent.
[ ] Replace the ad-hoc FiveFilters parser in test/dev-scripts/test-extraction-with-fivefilters.js with src/configFetcher.js parsing and HTML preprocessing; run XPath via window.XPathResult.
[ ] Ensure the FiveFilters harness follows bookmarklet flow (preprocess -> XPath -> fallback).
[ ] Demote or remove test/validate-extraction.js from default usage; document PDF tests as optional/manual.
[ ] Update test-cases/README.md and package.json scripts to match the new harness paths and schemas.
[ ] Add lightweight schema validation/guards to surface malformed test cases.

## Testing and validation
- npm test
- Optional/manual: node test/validate-extraction.js test-cases/pdf-references (if kept)

## Risks and edge cases
- JSDOM/XPath differences from browser behavior can still diverge.
- Saved HTML can be incomplete; golden checks should allow minor drift.
- EPUB-derived phrases can still be brittle; keep multiple short phrases + length thresholds.

## Open questions
- None (decisions set: bookmarklet pipeline is truth; separate schemas; EPUB goldens primary; PDF optional/manual).
