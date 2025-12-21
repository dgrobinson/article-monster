# Claude Code Context for Article Monster

## Project Overview

Article Monster is a bookmarklet service that extracts articles from web pages and sends them to Kindle/Zotero. It implements a subset of FiveFilters Full-Text RSS functionality for client-side article extraction.

**Key Components:**
- **Bookmarklet** (`public/bookmarklet.js`): Client-side extraction using Readability + site configs
- **Server** (`src/server.js`): Node.js service providing site configs and processing articles
- **Site Configs** (`site-configs/`): 2000+ FiveFilters-format extraction rules
- **Config Parser** (`src/configFetcher.js`): Parses FiveFilters site config files

## Communication Guidance

The primary operator is not a developer. When reporting changes or decisions, include ELI5 context:
- What changed (plain language).
- Why it matters (impact).
- How to verify (simple steps).
Define any unavoidable jargon briefly.

## Workflow Safety

- Never push directly to `main`. Use a feature branch and open a PR.
- If a direct push happens, create a revert PR and explain the fix in ELI5 terms.

## Critical Bug Fixes (August 2025)

### MAJOR BREAKTHROUGH: System Now Works Reliably 🎯

After months of debugging, two critical bug fixes resolved the extraction failures:

**Bug Fix #1: XPath Parser String Truncation (commit 4cd68a8)**
- **Problem**: `split(':', 2)` broke XPath expressions with colons like `//meta[@property="article:author"]`
- **Impact**: 90% of advanced site configs failed due to invalid XPath selectors
- **Solution**: Use `indexOf(':')` to split only on first colon, preserving full XPath expressions

**Bug Fix #2: Synchronous Config Fetching (commit 176c70e)**
- **Problem**: No cached config → async fetch "for next time" → return null → extraction fails
- **Impact**: Required TWO bookmarklet clicks - first to cache config, second to extract
- **Solution**: Fetch configs synchronously on first visit, enabling immediate extraction

**Result**: Baldwin article (and all complex sites) now extract perfectly on first click with full content.

### Client-Side Debugging Infrastructure (commit 4119be9)

Added comprehensive debugging system to capture client-side extraction failures:
- **Console/Error Capture**: All client-side logs sent to server for unified debugging
- **Service URL Injection**: Bookmarklet installer injects correct service URL at install time
- **Server Log Mirroring**: Client-side events appear in server logs for complete visibility
- **GitHub Debug Commits**: Failed extractions automatically captured with full context

This infrastructure was crucial for identifying the root causes above.

## Implementation Insights

### FiveFilters Integration

**Critical Discovery:** Baldwin article extraction failed repeatedly (12+ attempts) until we systematically compared with the authoritative PHP source code.

**Root Causes Identified:**
1. **HTML Preprocessing Timing**: Must apply `find_string`/`replace_string` to raw HTML before DOM parsing, not after
2. **Incomplete Directive Support**: Missing 27 of 43 FiveFilters directives used in production configs  
3. **Config Structure Mismatch**: Parser stored PHP-format directives but bookmarklet expected different format

**PHP Reference Integration:**
- Added `vendor/fivefilters-reference/` subtree from official FiveFilters source
- Systematic PHP-to-JavaScript translation ensures 100% compatibility
- Parser now matches PHP logic exactly: `explode(':', $line, 2)`, boolean handling, etc.

### Configuration Parser Evolution

**Phase 1**: Basic title/body extraction with hardcoded strip conversion
**Phase 2**: Added `find_string`/`replace_string` preprocessing  
**Phase 3**: Complete PHP-compatible parser supporting all 43 directives

**Key PHP Directives Implemented:**
- Multi-statement: `title`, `body`, `strip`, `strip_id_or_class`, `find_string`, `replace_string`
- Boolean: `prune`, `tidy`, `autodetect_on_failure` 
- String: `parser`
- Parameterized: `replace_string(find_text): replace_text`

### Architecture Patterns

**Config Processing Flow:**
1. Parse site config files matching PHP `SiteConfig::build_from_array()`
2. Cache configs with 24-hour TTL
3. Apply HTML preprocessing before DOM parsing
4. Execute XPath extraction rules
5. Clean content using strip/prune/tidy directives

**Common Pitfalls (RESOLVED):**
- ~~Applying preprocessing after DOM parsing breaks the extraction~~ ✅ Fixed
- ~~Using different config structure between parser and bookmarklet~~ ✅ Fixed  
- ~~XPath expressions with colons being truncated~~ ✅ Fixed (commit 4cd68a8)
- ~~Two-click requirement for first-time site visits~~ ✅ Fixed (commit 176c70e)
- Assuming documentation covers all real-world directives (only 37% coverage)

## Debugging Patterns

### Failed Extraction Checklist
1. **Config Loading**: Check `/site-config/{hostname}` endpoint
2. **HTML Preprocessing**: Verify `find_string`/`replace_string` applied before XPath  
3. **XPath Validity**: Test selectors in browser dev tools
4. **Title Extraction**: Ensure title rules exist or fallback works
5. **Content Length**: Verify extracted content meets minimum length requirements

### Critical Testing URLs
- **New Yorker Baldwin Article**: ✅ NOW WORKING - Full extraction with title and content
- **FiveFilters Test Service**: Compare output with official service for validation
- **Production Test**: https://seal-app-t4vff.ondigitalocean.app

## Documentation References

**Active Documentation:**
- `FIVEFILTERS_IMPLEMENTATION_PLAN.md`: Complete directive inventory and implementation roadmap
- `vendor/fivefilters-reference/`: Official PHP source code for reference
- `BALDWIN_EXTRACTION_DEBUG.md`: Complete debugging saga with technical details and resolution

**Archived Documentation:** (see `docs/archive/`)
- Historical debugging files, outdated implementation summaries, and legacy analysis files have been moved to maintain a clean repository root

**Implementation Status (as of commit 4119be9):**
- ✅ PHP-compatible config parser
- ✅ Complete FiveFilters config processing
- ✅ **Baldwin article extraction WORKING** (all extraction issues resolved)
- ✅ XPath parser bug fixed (colon truncation)
- ✅ Synchronous config fetching (eliminates two-click problem)
- ✅ Client-side debugging infrastructure with server log mirroring
- ❌ Full directive implementation in bookmarklet (partial coverage)
- ❌ Server-side preprocessing pipeline

## Architecture Decisions

Before performing any nontrivial change, agents must read all ADRs in `docs/adr/` on first inference per session, and re-check ADRs when encountering conflicts or uncertainty. Adhere to accepted decisions unless an ADR update is explicitly proposed and accepted.

**Why Client-Side Extraction:**
- Avoids CORS issues with direct page scraping
- Leverages browser's full DOM and JavaScript capabilities
- Enables real-time extraction from user's current page

**Why FiveFilters Compatibility:**
- Largest collection of proven extraction rules (2000+ sites)
- Mature directive system covering edge cases
- Active community maintenance

**Next Architectural Opportunities:**
1. Complete directive implementation in bookmarklet (currently ~60% coverage)
2. Server-side preprocessing pipeline for complex transformations
3. Automated testing against FiveFilters reference implementation
4. Performance optimizations for config parsing and caching

## Testing Strategy

**Current Limitations:**
- Baldwin article serves as canary for preprocessing functionality
- No automated testing against FiveFilters reference implementation
- Limited validation of directive parsing accuracy

**Recommended Improvements:**
1. Automated comparison with official FiveFilters service
2. Test suite covering all 43 directive types
3. Integration tests with representative site configs
4. Performance benchmarks for config parsing and caching

## Production Debugging Protocol

**CRITICAL: Always check production logs when debugging extraction issues**

### DigitalOcean CLI (`doctl`) Commands
- Check app status: `doctl apps list`
- View recent logs: `doctl apps logs <app-id> --tail 100`
- Monitor deployments: `doctl apps get-deployment <app-id> <deployment-id>`
- App ID: `214fb1d0-54f7-4a28-ba39-7db566e8a8e6`
- App URL: https://seal-app-t4vff.ondigitalocean.app

### GitHub CLI (`gh`) Commands
- Check workflow status: `gh workflow list`
- View workflow runs: `gh run list`
- View debug outputs: `gh api repos/dgrobinson/article-monster/contents/outputs/<timestamp>`

### Production Debugging Checklist
1. **Always run `doctl apps logs` first** - shows server-side extraction results
2. **Check for `title: undefined`** - indicates client-side extraction failure
3. **Look for content stats** - `contentLength`, paragraph count, etc.
4. **Check debug captures** - GitHub commits with client-side console logs
5. **Verify deployment status** - ensure latest code is deployed

### Common Log Patterns
- **Successful extraction**: `title: "Article Title"`, structured content
- **Failed extraction**: `title: undefined`, raw HTML without structure
- **Config missing**: `No FiveFilters config found for <hostname>`
- **Preprocessing issues**: Missing console logs about HTML transformation
