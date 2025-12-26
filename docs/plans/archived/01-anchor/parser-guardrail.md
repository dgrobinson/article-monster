# parser-guardrail (anchor batch)

Worktree: parser-guardrail  
Terminal: parser-guardrail

## Goal
Block parser code from introducing site-specific special-casing. Per-site logic should live in FiveFilters site-configs; CI should fail if parser changes hardcode hostnames or bespoke branches.

## Scope
In scope:
- Guardrail definition and documentation for parser changes.
- A CI check that flags host-specific conditionals or hostname literals in parser code paths.
- Tests or fixtures that validate the guardrail behavior and minimize false positives.

Out of scope:
- Editing FiveFilters site-configs (per ADR-001).
- Adding new parser features unrelated to the guardrail.

## Key Files
- docs/batches/anchor/README.md
- docs/plans/archived/01-anchor/parser-guardrail.md
- src/configFetcher.js
- public/bookmarklet.js (parser-related logic only)
- scripts/check-parser-guardrail.js
- package.json
- .github/workflows/ci-cd.yml

## Plan
1) Codify the guardrail
- Document the rule: no hardcoded hostnames or site-specific branches in parser logic; use FiveFilters site-configs instead.
- Capture examples of disallowed patterns (hostname string checks, domain-specific regexes) and permitted patterns (config-driven behavior).

2) Implement detection
- Add a lightweight script (`scripts/check-parser-guardrail.js`) that scans parser-related files for hostname literals.
- Provide a small allowlist for non-parser hostnames (blocked web apps, service origin).
- Ensure the script exits non-zero with actionable messaging on violations.

3) Integrate with CI
- Hook the guardrail script into the existing CI workflow so PRs fail on violations.
- Add a local npm script alias (`npm run check:parser-guardrail`).

4) Add coverage and examples
- Include a small test fixture that intentionally violates the guardrail to verify detection.
- Add documentation snippets showing how to rely on site-configs rather than parser conditionals.

5) Communicate and maintain
- Update developer-facing docs (README or AGENTS) with a brief “no parser special-casing” reminder and how to run the check.
- Note how to extend the allowlist in `scripts/check-parser-guardrail.js` if legitimate non-parser hostnames are flagged.

## Deliverables
- Guardrail documentation and examples.
- A CI-enforced check preventing site-specific parser code.
- Tests/fixtures demonstrating detection and providing guidance on avoiding false positives.

## Acceptance
- CI fails if parser code introduces hostname-based conditionals or other site-specific branches.
- Developers can run the guardrail check locally with a single command.
- Allowlist and messaging keep false positives low while catching genuine issues.

## Risks / Notes
- Overly broad detection may flag legitimate strings; mitigate with a minimal allowlist and clear output.
- Parser refactors may need temporary allowlist entries; track and remove them promptly.

## Coordination
- Overlaps with directives-cleaning and pagination work if they touch parser files; coordinate to avoid conflicting CI updates.

## Archive
Move to docs/plans/archived/01-anchor/parser-guardrail.md when complete.
