# parser-bug-intake (anchor batch)

Worktree: parser-bug-intake
Terminal: parser-bug-intake

## Goal
Create a structured intake path for FiveFilters parser bugs so reports are reproducible, comparable, and fast to triage.

## Scope
In scope:
- A standard intake template (fields + checklists) for parser bugs.
- A small local tool/script to parse a single config and dump the parsed output.
- Documentation for how to file and triage parser bug reports.

Out of scope:
- Fixing parser bugs themselves.
- Changes to site configs (per ADR-001).

## Key Files
- src/configFetcher.js
- docs/
- .github/ISSUE_TEMPLATE/
- scripts/

## Plan
1) Add a parser bug issue template
- Create `.github/ISSUE_TEMPLATE/parser-bug.yml` (or .md if preferred).
- Required fields: hostname, config file path, raw config snippet, expected parse, actual parse, reproduction steps, logs (bookmarklet + server), and whether HTML preprocessing is involved.
- Include a checklist: config fetch verified, preprocessing applied before DOM, XPath tested in dev tools, JSON-LD behavior considered.

2) Add a parser inspection script
- Add `scripts/inspect-config.js` to load a `site-configs/*.txt` file and output the parsed config JSON using `src/configFetcher.js`.
- Support flags: `--hostname`, `--file`, `--json`, `--compact`.
- Print warnings for unrecognized directives or empty arrays.

3) Document the intake workflow
- Add `docs/parser-bug-intake.md` describing how to capture a report, run the script, and attach outputs.
- Link to the issue template and example output.

4) Wire into existing docs
- Add a brief pointer in README or AGENTS to the parser bug intake process.

## Deliverables
- Issue template for parser bugs.
- Config inspection script.
- Documentation for reporting and triage.

## Acceptance
- A parser bug can be filed with a single, consistent set of artifacts.
- The inspection script produces a reproducible parse output for a given config.

## Risks / Notes
- Some directives are rare or malformed; log but do not fail in the inspector.

## Coordination
- Minimal overlap with other worktrees; no shared code changes beyond `src/configFetcher.js` usage.

## Archive
Move to docs/plans/archived/01-anchor/parser-bug-intake.md when complete.
