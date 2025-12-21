# cloud-ready (anchor batch)

Worktree: cloud-ready
Terminal: cloud-ready

## Goal
Make the anchor batch runnable in Codex Cloud with offline, fixture-backed tests and clear environment guidance.

## Scope
In scope:
- Convert any live-fetch validation into fixture-backed tests.
- Add network guardrails for tests to prevent accidental external requests.
- Document Codex Cloud environment requirements and optional toggles.
- Define which checks remain local-only and why.

Out of scope:
- Adding new extraction features beyond existing batch plans.
- Modifying FiveFilters site configs (per ADR-001).

## Cloud Blockers (Inventory)
Live network or browser-only flows that are local-only:
- `src/test.js` (live fetch via axios)
- `test/validate-extraction.js` (live fetch via `extractArticle`)
- `test/dev-scripts/test-live-sapienism.js` (live site + puppeteer)
- `test/dev-scripts/test-e2e-paragraphs.js` (puppeteer; optional live service)
- `test/dev-scripts/test-loader.js` (puppeteer + local dev server)

Cloud-safe equivalents:
- `npm test` uses fixture-only cases and blocks network by default.
- Fixture shims live in `test/support/fixtures.js` and `test/fixtures/**`.

## Key Files
- test/dev-scripts/test-extraction.js
- test/dev-scripts/test-extraction-with-fivefilters.js
- test-cases/**
- scripts/**
- package.json
- docs/batches/01-anchor/*.md
 - test/support/network-guard.js
 - test/support/fixtures.js
 - test/fixtures/manifest.json

## Partition (Cloud vs Local)
Cloud-first (Codex Cloud friendly):
- docs-cleanup: doc edits and link fixes only.
- parser-bug-intake: issue template + inspect script + docs.
- test-harness: harness code changes, schema guards, fixture-only tests.
- directives-cleaning: parser + bookmarklet changes with fixture tests.
- pagination: code + fixture-backed multi-page tests.
- debug-media: code + fixture-based parity checks.
- cloud-ready: network guardrails + env guidance.
- kindle-loop: payload capture + server-side artifacts.

Local-only or local validation required:
- Live-site validation for pagination and directives (CSP/auth dependent).
- Browser bookmarklet verification for debug-media parity.
- Capturing new fixtures from authenticated or dynamic pages.
- Kindle Previewer runs for render validation.

Hybrid (cloud implementation, local confirmation):
- directives-cleaning, pagination, debug-media (cloud for code/tests; local for live runs).
- kindle-loop (cloud for capture; local for Previewer verification).

## Plan
1) Inventory cloud blockers
- Identify any batch tasks that assume live network access or browser-only flows.
- Mark which validations need fixtures or local-only steps.

2) Add fixture-backed shims
- Provide a URL-to-fixture resolver for pagination and debug-media tests.
- Add minimal multi-page fixtures to validate merge logic offline.
- Ensure directive tests use local HTML fixtures.

3) Enforce offline behavior in tests
- Add a network-deny guard for test runs by default.
- Add a flag to opt into live fetches for local debugging.
 - Use fixture shims for pagination/debug-media validations.

4) Document cloud environment guidance
- Node 18+ requirement.
- Puppeteer handling (skip download or provide executable path).
- Env flags for test selection and offline mode.

5) Update batch docs
- Add references to cloud-ready constraints in test-harness, pagination, debug-media, and directives-cleaning docs.

## Deliverables
- Offline-first test harness behavior with fixture-backed validation.
- Network guardrail + opt-in live fetch flag.
- Cloud environment guidance documented alongside batch plans.
 - Fixture shims and multi-page fixtures for pagination/debug-media.

## Acceptance
- `npm test` passes without network access.
- Pagination and debug-media validations run using fixtures only.
- Batch docs indicate which steps are cloud-safe vs local-only.

## Risks / Notes
- JSDOM XPath variance remains; keep checks tolerant.
- Fixture drift can hide regressions; include small but representative fixtures.

## Environment + Flags
Cloud defaults (no network, no browser):
- Node 18+ (matches `package.json` engines)
- `npm test` runs fixture-only checks

Local opt-ins:
- `ALLOW_LIVE_FETCH=true` enables live network in test scripts.
- `ONLY_SOLVED=true` / `ONLY_UNSOLVED=true` to filter extraction fixtures.
- `PUPPETEER_SKIP_DOWNLOAD=1` to avoid downloading Chromium when not needed.
- `PUPPETEER_EXECUTABLE_PATH=/path/to/chrome` for local browser tests.

## Cloud Commands
- `npm test` (offline, fixture-only)
- `npm run test:fixtures` (pagination + debug-media fixtures)

## Coordination
- test-harness: schema and runner updates.
- pagination/debug-media: fixture coverage and URL resolver.
- directives-cleaning: add fixture cases per directive.

## Archive
Move to docs/plans/archived/01-anchor/cloud-ready.md when complete.
