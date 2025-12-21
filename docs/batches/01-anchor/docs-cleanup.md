# docs-cleanup (anchor batch)

Worktree: docs-cleanup
Terminal: docs-cleanup

## Goal
Resolve doc drift and broken links, and make the current state and next steps obvious to new contributors and agents.

## Scope
In scope:
- Update README links to point at current docs.
- Refresh test-cases/README.md to match the actual folder structure.
- Decide how AGENTS.md and CLAUDE.md stay in sync.
- Update archive index to reflect active docs.

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
1) Fix README links
- Point metadata roadmap, debug system, and contributing docs to their current locations.
- If a doc is archived, link to docs/archive/* and note that it is historical.

2) Refresh test-cases/README.md
- Describe current structure (solved, unsolved, goldens) and how tests run now.
- Remove references to paths or scripts that no longer exist.

3) Reconcile AGENTS.md vs CLAUDE.md
- Pick one as canonical and make the other a thin pointer, or keep them identical with a note.
- Ensure ADR-reading requirement remains prominent.

4) Update archive index
- Verify docs/archive/README.md matches what is actually archived.
- Add any missing pointers from active docs to the archive index.

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
Move to docs/plans/archived/01-anchor/docs-cleanup.md when complete.
