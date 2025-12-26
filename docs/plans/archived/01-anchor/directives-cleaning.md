# directives-cleaning (anchor batch)

Worktree: directives-cleaning
Terminal: directives-cleaning

## Goal
Implement high-value FiveFilters cleaning and control directives so extraction behavior matches the PHP reference more closely.

## Scope
In scope:
- Parsing additional directives in src/configFetcher.js.
- Implementing those directives in public/bookmarklet.js.
- Minimal tests or harness updates to cover new directives.

Out of scope:
- Pagination (handled in a separate plan).
- Server-side extraction pipeline changes.
- Site-config edits (per ADR-001).

## Key Files
- src/configFetcher.js
- public/bookmarklet.js
- FIVEFILTERS_IMPLEMENTATION_PLAN.md
- vendor/fivefilters-reference/
- test/dev-scripts/test-extraction-with-fivefilters.js

## Target Directives (Cleaning/Controls)
Parser additions (configFetcher):
- strip_attr, post_strip_attr
- strip_comments
- dissolve
- skip_id_or_class
- skip_json_ld
- convert_double_br_tags
- if_page_contains
- native_ad_clue
- insert_detected_image
- src_lazy_load_attr

Bookmarklet behavior:
- strip_comments: remove comment nodes from extracted content.
- strip_attr/post_strip_attr: remove specified attributes from matching elements, pre and post cleanup.
- dissolve: unwrap nodes while preserving their children.
- skip_id_or_class: skip extraction if target content matches skip selectors.
- skip_json_ld: bypass JSON-LD extraction when enabled.
- convert_double_br_tags: convert double BR into paragraph breaks when enabled.
- if_page_contains: only apply config when the page contains required text.
- src_lazy_load_attr: treat configured attribute as an image source when src is missing.
- native_ad_clue/insert_detected_image: stub or minimal behavior with clear TODO if not fully implemented.

## Plan
1) Confirm PHP reference behavior
- Cross-check directives in vendor/fivefilters-reference/ for exact semantics.
- Update FIVEFILTERS_IMPLEMENTATION_PLAN.md if assumptions differ.

2) Extend config parsing
- Add directive fields to src/configFetcher.js with correct types (array/boolean/string).
- Preserve PHP parsing semantics (split on first colon, booleans, parameterized forms).

3) Implement bookmarklet behaviors
- Add preprocessing checks before XPath to honor if_page_contains and skip_id_or_class.
- Implement comment stripping, attribute stripping, and dissolve in _cleanElementWithConfig.
- Add skip_json_ld and convert_double_br_tags toggles.
- Use src_lazy_load_attr in image handling to populate img.src.

4) Add coverage
- Add or update test cases that exercise each directive.
- Ensure test harness uses configFetcher and preprocessing.
 - Keep directive tests fixture-only in cloud; use `ALLOW_LIVE_FETCH=true` for local live validation.

## Deliverables
- Updated parser and bookmarklet support for the listed directives.
- Tests or fixtures that demonstrate correct behavior.

## Acceptance
- Configs that rely on the directives above extract without regressions.
- Tests pass with new directive coverage.

## Risks / Notes
- Some directives are rare or under-specified; follow PHP reference and document any gaps.
- Modifying HTML can change Readability outcomes; keep changes scoped to config-driven paths.

## Coordination
- Overlaps with pagination and debug alignment in public/bookmarklet.js; avoid large refactors.

## Archive
Move to docs/plans/archived/01-anchor/directives-cleaning.md when complete.
