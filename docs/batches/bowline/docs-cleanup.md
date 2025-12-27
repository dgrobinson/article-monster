# docs-cleanup (bowline batch)

Worktree: docs-cleanup
Terminal: docs-cleanup

## Goal
Resolve doc drift and broken links, and make the current state and next steps obvious to new contributors and agents.

## Scope
In scope:
- Re-check README links for drift and fix any broken references.
- Verify test-cases/README.md still matches the current harness layout.
- Reconcile AGENTS.md and CLAUDE.md (carryover).
- Update archive index only if new docs moved or renamed.

Out of scope:
- Changes to extraction logic or test harness behavior.
- Large doc reorgs beyond link fixes and clarity.

## Key Files
- README.md
- AGENTS.md
- CLAUDE.md
- docs/archive/README.md
- test-cases/README.md
- docs/test-harness-rebuild.md
- docs/EPUB_IMAGE_FIX.md

## Plan
1) Audit doc links for drift
- Re-verify README.md and test-cases/README.md pointers against current file paths.
- If a doc is archived, link to docs/archive/* and note that it is historical.

2) Reconcile AGENTS.md vs CLAUDE.md
- Keep them identical (preferred) or make one a thin pointer.
- Ensure ADR-reading requirement remains prominent.

3) Update archive index (if needed)
- Confirm docs/archive/README.md matches what is actually archived.
- Add missing pointers when files move.

## Deliverables
- Updated README.md with valid, current links.
- Updated test-cases/README.md that matches the harness.
- Clear policy for AGENTS.md/CLAUDE.md duplication.

## Acceptance
- No broken doc links in README.md.
- test-cases/README.md matches actual folder structure.
- AGENTS.md and CLAUDE.md are either identical or explicitly linked.

## Risks / Notes
- test-cases/README.md overlaps with the test harness plan; coordinate to avoid conflicts.

## Coordination
- If the test harness plan changes doc structure, apply those changes here too.

## Archive
Move to docs/plans/archived/bowline/docs-cleanup.md when complete.
