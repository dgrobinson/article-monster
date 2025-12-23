# ADR-001: Do Not Modify Vendored FiveFilters Site Configs

## Status
Accepted (Revised)

## Date
2025-09-20 (Revised 2025-12-23)

## Context
Article Monster uses FiveFilters site configurations from the official `ftr-site-config` repository via git subtree. These configs provide extraction rules for 2000+ websites and are maintained by the FiveFilters community.

When extraction fails for a site, there may be temptation to modify the existing site configs or add new ones to fix the issue.

## Decision
**We will NOT modify vendored FiveFilters site configurations, and we will NOT add site-specific custom extraction logic.**

Instead, we will:
1. Use the configs as read-only reference material
2. Treat FiveFilters configs as the single source of truth for site-specific extraction
3. Document extraction differences and issues for upstream contribution
4. Contribute improvements back to the upstream FiveFilters project separately

## Rationale

### Maintenance Burden
- Modified configs would be overwritten on updates from upstream
- Tracking local changes becomes complex and error-prone
- Merge conflicts on subtree updates would be frequent

### Community Collaboration
- FiveFilters configs benefit the entire community
- Our modifications might not align with other users' needs
- Upstream maintainers have better context for site-specific rules

### Code Clarity
- Site-specific behavior should live only in configs, not in application code
- Avoids hidden, hard-to-debug per-site branches
- Keeps our implementation aligned with the reference FiveFilters behavior

### Update Safety
- We can safely pull upstream updates without losing local changes
- Reduces risk of breaking existing extraction functionality
- Maintains compatibility with the reference FiveFilters implementation

## Consequences

### Positive
- Safe, predictable updates from upstream FiveFilters
- Clear separation between vendored configs and custom logic
- Easier debugging and maintenance
- Ability to contribute improvements upstream

### Negative
- Some sites may remain broken until upstream configs are updated
- Cannot quickly "fix" a site with in-repo custom code or config edits
- Fewer fallback options when configs are incomplete or stale

## Implementation
- Issue reporting checklist updated to reflect this decision
- Remove or avoid any site-specific extraction code paths
- Site-specific overrides should be handled upstream in FiveFilters, not in-app
- Document any extraction differences for potential upstream contribution

## Alternatives Considered
1. **Fork FiveFilters configs** - Creates maintenance burden and loses community updates
2. **Local config overrides** - Adds complexity to config loading logic
3. **Hybrid approach** - Confusing and error-prone to maintain
4. **Site-specific code fixes** - Rejected in favor of upstream config alignment

## Related
- See `FIVEFILTERS_IMPLEMENTATION_PLAN.md` for integration details
- See `vendor/fivefilters-reference/` for PHP reference implementation
