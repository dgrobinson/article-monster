# ci-cleanup (bowline batch)

Worktree: ci-cleanup
Terminal: ci-cleanup

## Goal
Keep CI fast and deterministic by removing dead steps and aligning checks with the offline test harness.

## Scope
In scope:
- Inventory existing workflows and scripts used in CI.
- Remove or isolate steps that require live network or browser access.
- Ensure CI gates on fixture-backed `npm test`.
- Document any local-only checks.

Out of scope:
- Changing extraction logic.
- Editing FiveFilters site configs (per ADR-001).

## Key Files
- .github/workflows/*
- package.json
- test/dev-scripts/*
- test/support/network-guard.js
- docs/batches/bowline/ci-cleanup.md

## Plan
1) Inventory CI workflows and scripts
- List workflows and the scripts they invoke.
- Flag steps that are redundant or require live network.

2) Align CI to offline harness
- Ensure `npm test` is the primary CI gate.
- Keep live-network or puppeteer scripts behind explicit opt-in flags.

3) Document local-only checks
- Note scripts that are excluded from CI and why.
- Provide short run commands and prerequisites.

## Deliverables
- CI workflow steps aligned with offline tests.
- Clear separation of offline vs local-only checks.
- Updated docs (if needed) explaining CI behavior.

## Acceptance
- CI runs without network access.
- `npm test` is the main gate for PRs.
- Optional live/browser checks are documented but not default.

## Risks / Notes
- Over-pruning can hide useful checks; keep optional scripts documented.

## Coordination
- Align with parser-guardrail if guardrail checks are added to CI.

## Archive
Move to docs/plans/archived/bowline/ci-cleanup.md when complete.
