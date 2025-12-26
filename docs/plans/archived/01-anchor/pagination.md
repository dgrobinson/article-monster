# pagination (anchor batch)

Worktree: pagination
Terminal: pagination

## Goal
Implement multi-page extraction so configs using next_page_link or autodetect_next_page can yield full articles.

## Scope
In scope:
- next_page_link and autodetect_next_page support in the bookmarklet flow.
- Safer URL resolution for single_page_link and next_page_link.
- Basic page-merge logic and loop protection.

Out of scope:
- Server-side pagination.
- Site-config edits (per ADR-001).
- Full content de-duplication beyond basic heuristics.

## Key Files
- public/bookmarklet.js
- src/configFetcher.js
- FIVEFILTERS_IMPLEMENTATION_PLAN.md
- test/dev-scripts/test-extraction-with-fivefilters.js
 - test/dev-scripts/test-pagination-fixtures.js
 - test/fixtures/pagination/**
 - test/support/fixtures.js

## Plan
1) Harden URL resolution
- Update _makeAbsoluteUrl to resolve relative URLs via new URL(relative, window.location.href).
- Honor <base> tags when present (optional).

2) Implement next_page_link
- Extract next page URL(s) via XPath (node or string result).
- Fetch subsequent pages with same-origin credentials.
- Apply HTML preprocessing and XPath extraction on each page using the same config.
- Merge content blocks in order.
- Add a max page cap and loop detection (set of visited URLs).

3) Implement autodetect_next_page (minimal)
- When enabled, attempt rel="next" or common "next" link heuristics.
- Use as a fallback when next_page_link is absent.

4) Stitching and cleanup
- Merge content by concatenating HTML with separators.
- Avoid duplicate headers/footers by skipping identical leading/trailing text.

5) Add tests
- Add a test case for a known multi-page site.
- Validate minLength and expectedPhrases across pages.
 - Use the fixture-backed harness in `test/dev-scripts/test-pagination-fixtures.js` for cloud runs.
 - Keep live site validation local-only (CSP/auth dependent).

## Deliverables
- Bookmarklet pagination support with guardrails.
- Tests covering multi-page extraction.

## Acceptance
- A multi-page config extracts full content in one run.
- No infinite loops or runaway page fetches.

## Risks / Notes
- Fetching additional pages may hit CSP or require same-origin; document fallbacks.
- Multi-page extraction may be slower; keep caps low (e.g., 5 pages).

## Coordination
- Overlaps with directive work in public/bookmarklet.js; avoid large refactors.

## Archive
Move to docs/plans/archived/01-anchor/pagination.md when complete.
