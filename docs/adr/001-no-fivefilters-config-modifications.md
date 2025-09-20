# ADR-001: Do Not Modify Vendored FiveFilters Site Configs

## Status
Accepted

## Date
2025-09-20

## Context
Article Monster uses FiveFilters site configurations from the official `ftr-site-config` repository via git subtree. These configs provide extraction rules for 2000+ websites and are maintained by the FiveFilters community.

When extraction fails for a site, there may be temptation to modify the existing site configs or add new ones to fix the issue.

## Decision
**We will NOT modify vendored FiveFilters site configurations.**

Instead, we will:
1. Use the configs as read-only reference material
2. Document extraction differences and issues
3. Implement custom extraction logic in our codebase when needed
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
- Custom extraction logic belongs in our application code
- Separates our business logic from third-party configurations
- Makes debugging and testing more straightforward

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
- May need to implement custom extraction logic for some sites
- Cannot quickly "fix" a site by modifying its config directly
- Requires more application code for site-specific handling

## Implementation
- Issue reporting checklist updated to reflect this decision
- Custom extraction logic should be implemented in `src/` modules
- Site-specific overrides can be handled in the application layer
- Document any extraction differences for potential upstream contribution

## Alternatives Considered
1. **Fork FiveFilters configs** - Creates maintenance burden and loses community updates
2. **Local config overrides** - Adds complexity to config loading logic
3. **Hybrid approach** - Confusing and error-prone to maintain

## Related
- See `FIVEFILTERS_IMPLEMENTATION_PLAN.md` for integration details
- See `vendor/fivefilters-reference/` for PHP reference implementation
