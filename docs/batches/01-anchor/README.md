# Anchor Batch (01-anchor)

- test-harness: rebuild the extraction test harness to mirror bookmarklet flow and align fixtures.
- docs-cleanup: fix doc drift, update links, and clarify canonical docs.
- directives-cleaning: implement cleaning/control directives in parser + bookmarklet.
- pagination: add multi-page extraction via next_page_link/autodetect.
- debug-media: align debug bookmarklet with production and unify image handling.
- parser-bug-intake: add a structured intake for parser bugs (template + inspection script).
- parser-guardrail: prevent site-specific special-casing in parser code via CI enforcement.

Cross-cutting guardrail: CI must fail if parser code introduces site-specific special cases; rely on FiveFilters site-configs for per-site logic instead of hardcoding hostnames.

PR reconciliation plan: docs/plans/anchor-pr-reconciliation.md.
