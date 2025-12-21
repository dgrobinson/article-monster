# test-harness (anchor batch)

Worktree: test-harness
Terminal: test-harness

## Goal
Make offline tests mirror the bookmarklet extraction flow (preprocess -> XPath -> Readability fallback) and align fixtures with unsolved vs golden schemas.

## Scope
In scope:
- Normalize test-case JSON schemas for unsolved and solved cases.
- Update test runners to match the production extraction pipeline.
- Align goldens with EPUB-derived checks.
- Refresh test scripts and package.json to match the new harness.

Out of scope:
- Changes to extraction logic in production code.
- Edits to FiveFilters site configs.
- Pagination behavior (handled in a separate plan).

## Key Files
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
- docs/test-harness-rebuild.md

## Plan
1) Define schemas
- Unsolved schema: name, url, and one of htmlFile or content; optional expectedPhrases, minLength, notes.
- Solved schema: driven by goldens (EPUB-derived checks), minimal JSON metadata.
- Fix fixture drift (missing url, wrong status, etc).

2) Harden test/dev-scripts/test-extraction.js
- Accept inline HTML (content) or htmlFile; avoid path operations when htmlFile is missing.
- Tolerate optional fields and missing expectedPhrases.
- Add lightweight schema validation and clear error messages.
 - Enforce network guardrails via `test/support/network-guard.js` (fixture-only by default).

3) Replace FiveFilters parsing in test/dev-scripts/test-extraction-with-fivefilters.js
- Use src/configFetcher.js to parse configs.
- Apply HTML preprocessing before DOM parsing (match bookmarklet flow).
- Run XPath via window.XPathResult on the preprocessed DOM.
- Fall back to Readability when XPath fails.

4) Demote or remove test/validate-extraction.js from default usage
- Keep as optional/manual validation if still needed.
- Update package.json scripts accordingly.

5) Update docs and tooling
- Update test-cases/README.md to describe the new structure.
- Ensure scripts/sync-goldens.js still produces the expected solved fixtures.
 - Document `ALLOW_LIVE_FETCH=true` for local-only network validations.

## Deliverables
- Updated test harness scripts with production-like flow.
- Updated fixtures in test-cases/solved and test-cases/unsolved.
- Updated docs and npm scripts.

## Acceptance
- npm test passes locally.
- Unsolved and solved cases run without schema errors.
- FiveFilters harness uses src/configFetcher.js and preprocessing.

## Risks / Notes
- JSDOM XPath behavior can diverge from browsers; keep checks tolerant.
- Goldens can be brittle; prefer multiple short phrases + length thresholds.

## Coordination
- Avoid touching public/bookmarklet.js logic beyond test parity.
- Coordinate with docs cleanup for test-cases/README.md edits.

## Archive
Move to docs/plans/archived/01-anchor/test-harness.md when complete.
