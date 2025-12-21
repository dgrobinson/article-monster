# Anchor PR Reconciliation Plan

## Context
- Anchor batch work was split across multiple agent repos in `~/code/agents/`.
- Plan documents may have been missing or diverged between those repos.
- Open PRs may reflect different assumptions about scope and plan versions.

This plan is for a future orchestration agent to evaluate and reconcile open PRs,
while restoring a single canonical plan for the anchor batch.

## Goals
- Reconcile open PRs into a clear merge order or closure list.
- Ensure each PR matches the intended plan scope.
- Restore a single canonical set of plan docs for anchor batch work.
- Provide ELI5 summaries for the operator (non-developer).
- Record the next batch focus so CI cleanup is not forgotten.

## Inputs
- Open PR list: `gh pr list --state open --json number,title,headRefName,updatedAt,author,isDraft,labels`
- Canonical plans: `docs/batches/01-anchor/*.md` from the orchestration repo.
- ADRs: `docs/adr/` (ADR-001 and ADR-002).
- Agent repos: `/Users/dgrobinson/code/agents/<agent-name>/`.

## Constraints
- Do not edit `site-configs/` (ADR-001).
- Preserve the bookmarklet loader pattern (ADR-002).
- Avoid destructive git commands (`reset --hard`, `checkout --`).
- Do not rewrite PR history unless explicitly instructed.

## Plan

### 1) Establish the canonical plan docs
1. Treat the orchestration repo as canonical for `docs/batches/01-anchor/*.md`.
2. Compare each agent repo plan file to canonical:
   - Note missing files (common when agents did not receive a plan).
   - Note differences that may represent new decisions.
3. For each difference:
   - Decide if the change is valid and should be promoted to canonical.
   - If yes, update the canonical plan doc and record that decision in this plan log.
   - If no, leave canonical as-is and note that the agent diverged.
4. Sync canonical plan files into each agent repo if needed.

Suggested command:
```
diff -u /path/to/orchestration/docs/batches/01-anchor/<file>.md \
  /path/to/agent/docs/batches/01-anchor/<file>.md
```

### 2) Inventory open PRs
1. List open PRs and tag each by batch area:
   - cloud-ready, docs-cleanup, directives-cleaning, pagination, debug-media,
     parser-bug-intake, test-harness, kindle-loop.
2. Flag PRs that touch shared surfaces:
   - `public/bookmarklet.js`, `src/configFetcher.js`, `test/**`, `docs/**`.
3. Identify duplicates or overlapping PRs (for example, two PRs for the same feature).

### 3) Review each PR against its plan
For each PR:
1. Check out locally: `gh pr checkout <number>`.
2. Summarize diff scope (files and key changes).
3. Confirm scope matches the plan doc for that batch.
4. Verify ADR compliance (no `site-configs/`, no embedded bookmarklet logic).
5. Run the relevant tests:
   - Prefer `npm test` or batch-specific scripts.
   - For fixture-only tasks, avoid live network tests by default.
6. Record results in an ELI5 summary:
   - What it does.
   - Why it matters.
   - How to verify.
   - Any risk or follow-up needed.

### 4) Resolve overlaps and conflicts
1. Build a matrix of overlapping files across open PRs.
2. Decide a merge order where conflicts are likely (example: test harness before
   pagination if both touch test scripts).
3. If two PRs implement the same behavior, choose one and close the other with
   a short reason.
4. If necessary, create an integration branch to validate combined changes.

### 5) Decide merge vs close vs defer
For each PR, choose one:
- Merge: scope matches plan and tests pass.
- Revise: needs changes; ask the PR owner to update.
- Close: out of scope, duplicate, or stale.
- Defer: block on other PRs or missing decisions.

### 6) Communicate clearly (ELI5)
Provide the operator with:
- A short list of what will merge and why.
- A short list of what will close and why.
- One or two simple verification steps per merge.
Keep explanations in plain language and define jargon.

## Outputs
- A reconciled list of PRs with merge order.
- Canonical plan docs in `docs/batches/01-anchor/`.
- ELI5 summary of decisions and next steps.
- Next batch: `02-compass` (nautical theme), with CI cleanup as a core focus.

## Verification
- `npm test` passes for merged changes.
- No ADR violations.
- No plan doc drift across agent repos after sync.
