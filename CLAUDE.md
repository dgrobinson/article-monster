# Claude Code Context for Article Monster

## Project Overview

Article Monster is a bookmarklet service that extracts articles from web pages and sends them to Kindle/Zotero. It implements a subset of FiveFilters Full-Text RSS functionality for client-side article extraction.

**Key Components:**
- **Bookmarklet** (`public/bookmarklet.js`): Client-side extraction using Readability + site configs
- **Server** (`src/server.js`): Node.js service providing site configs and processing articles
- **Site Configs** (`site-configs/`): 2000+ FiveFilters-format extraction rules
- **Config Parser** (`src/configFetcher.js`): Parses FiveFilters site config files

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

**Common Pitfalls:**
- Applying preprocessing after DOM parsing breaks the extraction
- Using different config structure between parser and bookmarklet
- Assuming documentation covers all real-world directives (only 37% coverage)

## Debugging Patterns

### Failed Extraction Checklist
1. **Config Loading**: Check `/site-config/{hostname}` endpoint
2. **HTML Preprocessing**: Verify `find_string`/`replace_string` applied before XPath  
3. **XPath Validity**: Test selectors in browser dev tools
4. **Title Extraction**: Ensure title rules exist or fallback works
5. **Content Length**: Verify extracted content meets minimum length requirements

### Critical Testing URLs
- **New Yorker Baldwin Article**: Tests `find_string: <header` → `replace_string: <em` preprocessing
- **FiveFilters Test Service**: Compare output with official service for validation

## Documentation References

**External Docs:**
- `FIVEFILTERS_IMPLEMENTATION_PLAN.md`: Complete directive inventory and implementation roadmap
- `vendor/fivefilters-reference/`: Official PHP source code for reference
- `DEBUGGING_SYSTEM.md`: Debug output and GitHub commit patterns

**Implementation Status (as of commit 9898b07):**
- ✅ PHP-compatible config parser
- ✅ Basic HTML preprocessing  
- ⚠️  Baldwin article still fails (architectural preprocessing timing issue)
- ❌ Full directive implementation in bookmarklet
- ❌ Server-side preprocessing pipeline

## Architecture Decisions

**Why Client-Side Extraction:**
- Avoids CORS issues with direct page scraping
- Leverages browser's full DOM and JavaScript capabilities
- Enables real-time extraction from user's current page

**Why FiveFilters Compatibility:**
- Largest collection of proven extraction rules (2000+ sites)
- Mature directive system covering edge cases
- Active community maintenance

**Next Architectural Challenge:**
HTML preprocessing timing requires either:
1. Server-side preprocessing (fetch page server-side, apply rules, return to client)
2. Client-side raw HTML access (before Readability processes it)
3. Hybrid approach (preprocess critical rules server-side, rest client-side)

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