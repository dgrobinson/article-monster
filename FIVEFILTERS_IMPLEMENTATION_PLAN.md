# Complete Plan for Full FiveFilters Config Support

## Overview
Build a comprehensive JavaScript/Node.js implementation of the FiveFilters config parser since no existing JS library exists (FiveFilters is PHP-based).

## Critical Discovery: Baldwin Article Root Cause Analysis

### The Real Issue
After 12+ failed attempts to fix the Baldwin article extraction, we discovered the root cause:

**The New Yorker FiveFilters config includes HTML preprocessing directives that our implementation doesn't support:**
```
find_string: <header
replace_string: <em
```

This transforms all `<header` tags to `<em` tags BEFORE XPath processing, which is why the body selector works:
```
body: //em[@data-testid='SplitScreenContentHeaderWrapper'] | //div[@class='body__inner-container']
```

**Key insight:** FiveFilters' own save-to-Kindle works perfectly for the Baldwin article, proving:
1. The config is correct and current
2. Our JavaScript implementation is missing critical preprocessing steps
3. All previous attempts failed because they addressed symptoms, not the root cause

### Failed Attempts History
- **Attempts 1-6:** Infrastructure and timing fixes
- **Attempts 7, 9, 11, 12:** Body-only config support + title fallbacks
- **All failed because:** We never implemented `find_string`/`replace_string` preprocessing

This validates the need for complete FiveFilters implementation rather than piecemeal fixes.

## Phase 1: Enhanced Config Parser (configFetcher.js)

### 1.1 Complete Directive Inventory (VERIFIED COMPLETE)
**Analysis:** Found 43 unique directives across 2122 site configs vs only 16 in official docs
**Coverage:** Our inventory includes 27 undocumented directives actively used in production configs

**Core Content Extraction:**
- `title: XPath` (867 uses) - Title selectors
- `body: XPath` (1973 uses) - Content selectors  
- `author: XPath` (934 uses) - Author selectors
- `date: XPath` (758 uses) - Date selectors

**HTML Preprocessing (CRITICAL - Baldwin article fails without this):**
- `find_string: string` (442 uses) - String to find for replacement
- `replace_string: string` (442 uses) - Replacement string
- Must be applied BEFORE XPath processing

**Content Cleaning:**
- `strip: XPath` (3302 uses) - Elements to remove completely
- `strip_id_or_class: selector` (4863 uses) - Remove by ID/class
- `strip_attr: attribute` (56 uses) - Strip attributes
- `strip_image_src: pattern` (24 uses) - Remove images by source
- `strip_comments: yes/no` (10 uses) - Remove HTML comments
- `dissolve: XPath` (13 uses) - Unwrap elements (keep content)

**Multi-page Support:**
- `single_page_link: XPath` (107 uses) - Link to full article
- `next_page_link: XPath` (91 uses) - Pagination links
- `autodetect_next_page: yes/no` (8 uses) - Auto-detect pagination

**Authentication:**
- `requires_login: yes/no` (50 uses) - Login required
- `login_uri: URL` (51 uses) - Login page URL
- `login_username_field: name` (51 uses) - Username field
- `login_password_field: name` (51 uses) - Password field
- `login_extra_fields: data` (102 uses) - Additional login fields
- `not_logged_in_xpath: XPath` (50 uses) - Detect login requirement

**Processing Controls:**
- `prune: yes/no` (824 uses) - Remove non-content elements
- `tidy: yes/no` (399 uses) - Clean HTML
- `parser: html5/libxml` (11 uses) - HTML parser to use
- `convert_double_br_tags: yes/no` (32 uses) - Convert BR to P tags
- `autodetect_on_failure: yes/no` (5 uses) - Fallback to Readability
- `skip_json_ld: yes/no` (12 uses) - Skip structured data
- `skip_id_or_class: selector` (5 uses) - Skip elements in extraction

**Testing & Validation:**
- `test_url: URL` (2740 uses) - Test URLs for validation
- `test_contains: text` (197 uses) - Expected content
- `if_page_contains: text` (9 uses) - Conditional processing

**Advanced Features:**
- `footnotes: XPath` (12 uses) - Footnote handling
- `native_ad_clue: pattern` (15 uses) - Native ad detection
- `insert_detected_image: yes/no` (28 uses) - Add detected images
- `src_lazy_load_attr: attribute` (2 uses) - Lazy loading support

**Undocumented Edge Cases (Found in Configs):**
- `post_strip_attr: attribute` (1 use) - Post-processing attribute removal
- `test_urls: URL` (1 use) - Multiple test URL variant  
- `test_content: text` (1 use) - Content testing variant
- `span: selector` (1 use) - Span element specific handling
- `titl: XPath` (1 use) - Typo variant of title directive
- `https: URL` (1 use) - Protocol-specific directive
- `test: XPath` (1 use) - Generic test directive

**Documentation vs Reality Gap:**
- Official docs: 16 directives (37% coverage)
- Found in configs: 43 directives (100% coverage)
- Missing from docs: 27 critical directives including all authentication features

## Phase 1: Critical HTML Preprocessing (Fixes Baldwin Article)
**Priority: HIGH - Required for 442 site configs**

### 1.1 Implement find_string/replace_string Processing
- Add preprocessing step before XPath evaluation
- Support multiple find/replace pairs per config
- Apply transformations to raw HTML before DOM parsing
- **Immediate impact:** Fixes New Yorker and 441 other sites

### 1.2 Enhanced Config Parser
- Update configFetcher.js to parse all preprocessing directives
- Maintain backward compatibility with existing basic parsing
- Add validation for directive combinations

## Phase 2: Core Content Extraction Enhancement
**Priority: HIGH - Foundation for all extractions**

### 2.1 Advanced XPath Processing
- Improve XPath evaluation robustness
- Add support for complex XPath expressions
- Handle namespace issues in XML/HTML parsing

### 2.2 Content Cleaning Pipeline
- Implement `strip_id_or_class` (4863 uses - most common directive)
- Add `strip_attr` and `strip_image_src` support
- Implement `dissolve` for element unwrapping

## Phase 3: Multi-page Article Support
**Priority: MEDIUM - Affects 198+ sites with pagination**

### 3.1 Single Page Detection
- Implement `single_page_link` following
- Add automatic single-page URL detection
- Handle redirects and URL validation

### 3.2 Pagination Handling
- Implement `next_page_link` following
- Add `autodetect_next_page` logic
- Combine multiple pages into single article

## Phase 4: Authentication & Paywall Bypass
**Priority: LOW - Affects 50 sites but complex legal/technical issues**

### 4.1 Login Support
- Implement login flow handling
- Add session management
- Handle 2FA and complex auth flows

### 4.2 Paywall Detection
- Implement `not_logged_in_xpath` detection
- Add paywall bypass strategies
- Handle subscription content appropriately

## Phase 5: Advanced Processing Controls
**Priority: LOW-MEDIUM - Quality improvements**

### 5.1 Processing Optimizations
- `prune: yes/no` (824 uses) - Intelligent content pruning
- `tidy: yes/no` (399 uses) - HTML cleanup and normalization
- `convert_double_br_tags: yes/no` (32 uses) - Paragraph conversion
- `parser: html5/libxml` (11 uses) - Parser selection

### 5.2 Testing & Validation Framework
- `test_url: URL` (2740 uses) - Automated config validation
- `test_contains: text` (197 uses) - Content verification
- `if_page_contains: text` (9 uses) - Conditional processing

### 5.3 Image & Media Handling
- `insert_detected_image: yes/no` (28 uses) - Lead image detection
- `src_lazy_load_attr: attribute` (2 uses) - Lazy loading support
- `native_ad_clue: pattern` (15 uses) - Native ad filtering

## Implementation Roadmap

### Quick Win: Baldwin Article Fix (Phase 1)
**Estimated Time: 2-4 hours**
1. Add `find_string`/`replace_string` preprocessing to configFetcher.js
2. Update bookmarklet.js to apply HTML transformations before XPath
3. Test specifically with New Yorker Baldwin article
4. **Expected Result:** Baldwin article extracts perfectly

### Foundation: Core Enhancement (Phase 2) 
**Estimated Time: 1-2 days**
1. Implement `strip_id_or_class` (most used directive - 4863 configs)
2. Add advanced XPath processing improvements
3. Enhanced error handling and fallback logic
4. **Expected Result:** Dramatically improved extraction success rate

### Scale: Multi-page Support (Phase 3)
**Estimated Time: 2-3 days** 
1. `single_page_link` following (107 configs benefit)
2. `next_page_link` pagination (91 configs benefit)
3. Content aggregation from multiple pages
4. **Expected Result:** Full articles from paginated sites

### Polish: Advanced Features (Phase 4-5)
**Estimated Time: 3-5 days**
1. Authentication/paywall handling (50 configs)
2. Processing optimizations and quality improvements  
3. Comprehensive testing framework
4. **Expected Result:** Production-ready FiveFilters implementation

## Technical Implementation Details

### Critical Processing Pipeline
1. **HTML Preprocessing** (BEFORE XPath evaluation)
   - Apply `find_string`/`replace_string` transformations
   - Handle lazy-loaded images and dynamic content
   - Clean malformed HTML if `tidy: yes`

2. **Content Extraction**
   - Execute XPath selectors in priority order
   - Apply `strip_id_or_class` removal (most critical)
   - Handle multi-page article assembly

3. **Post-processing**
   - Content cleaning and validation
   - Image URL fixing and lazy-load handling
   - Final HTML normalization

### Expected Impact
- **Immediate:** Baldwin article and 441 other find_string/replace_string configs work
- **Short-term:** 4863 configs using strip_id_or_class improve significantly  
- **Long-term:** Complete FiveFilters ecosystem compatibility
   - Use DOMPurify or similar
   - Fix malformed HTML
   - Normalize encoding

### 2.2 Extraction Stage
1. **Check JSON-LD preference**
   - If prefer_jsonld, try JSON-LD first
   - Fall back to DOM extraction

2. **Apply XPath selectors**
   - Try each selector in order
   - Stop on first match with content
   - Validate minimum content length

3. **Multi-page handling**
   - Check for single_page_link
   - Follow next_page_link recursively
   - Merge content from all pages

### 2.3 Post-processing Stage
1. **Content Cleaning**
   - Apply strip rules
   - Remove specified attributes/classes
   - Dissolve wrapper elements
   - Apply wrap_in/move_into transformations

2. **Pruning** (if enabled)
   - Remove unlikely content blocks
   - Clean up empty elements
   - Fix broken images

3. **Final Processing**
   - Convert double line breaks
   - Fix relative URLs
   - Ensure valid HTML

## Phase 3: Error Handling & Fallbacks

### 3.1 Graceful Degradation
```javascript
try {
  // Try site config extraction
  const configResult = extractWithSiteConfig(config);
  if (configResult && configResult.content) {
    return configResult;
  }
} catch (e) {
  console.warn('Site config extraction failed:', e);
}

// Fallback to JSON-LD
try {
  const jsonLdResult = extractFromJsonLd();
  if (jsonLdResult && jsonLdResult.content) {
    return jsonLdResult;
  }
} catch (e) {
  console.warn('JSON-LD extraction failed:', e);
}

// Fallback to Readability
return extractWithReadability();
```

### 3.2 Validation
- Always ensure title exists (via config or fallback)
- Validate content minimum length
- Check for required fields before sending to server
- Never return null/undefined

## Phase 4: Server-side Updates

### 4.1 Enhanced Config Loading
```javascript
// src/configFetcher.js
class ConfigFetcher {
  parseFtrConfig(configText) {
    const config = {
      // All directives initialized
    };
    
    // Parse all directive types
    // Handle multi-value directives
    // Process HTTP headers specially
    
    // Accept configs with just body rules
    return config.body.length > 0 ? config : null;
  }
  
  // Add config validation
  validateConfig(config) {
    // Check for deprecated directives
    // Validate XPath syntax
    // Warn about potential issues
  }
}
```

### 4.2 HTTP Header Support
```javascript
// When fetching content server-side
if (config.http_headers) {
  Object.entries(config.http_headers).forEach(([key, value]) => {
    headers[key] = value;
  });
}
```

## Phase 5: Testing Strategy

### 5.1 Unit Tests
- Test each directive parser
- Test XPath evaluation
- Test string replacement
- Test error handling

### 5.2 Integration Tests
- Test with actual site configs
- Verify New Yorker extraction works
- Test other body-only configs
- Test multi-page articles

### 5.3 Regression Tests
- Ensure existing sites still work
- Monitor extraction quality
- Track performance metrics

## Phase 6: Implementation Order

1. **Fix immediate issue** (Day 1)
   - Update configFetcher.js to accept body-only configs
   - Add title fallback in bookmarklet.js
   - Add proper error handling

2. **Core directives** (Day 2)
   - Implement find_string/replace_string
   - Add strip variations
   - Handle HTTP headers

3. **Advanced features** (Day 3)
   - Multi-page support
   - Lazy load handling
   - JSON-LD preference

4. **Polish & test** (Day 4)
   - Comprehensive testing
   - Performance optimization
   - Documentation

## Benefits of This Approach

1. **Full FiveFilters compatibility** - Support all 2000+ site configs
2. **Future-proof** - Easy to add new directives
3. **Robust fallbacks** - Multiple extraction methods
4. **Better debugging** - Clear pipeline with logging
5. **Maintainable** - Modular, testable code

## New Yorker Specific Approach
For the New Yorker site config (newyorker.com.txt):
- **No modifications to the FiveFilters config file** - We maintain the vendored config as-is
- **Detection logic**: Check if the config's XPath selectors actually match any content
- **Decision**: If selectors don't match current HTML structure, skip the config and use fallback extraction
- **Testing**: Verify with the Baldwin article whether FiveFilters config or fallback works better

This comprehensive approach ensures we can leverage the full power of FiveFilters configs while maintaining robustness and fallback options.

## Current State Analysis

### Why Previous Attempts Failed
1. **Incomplete Parser**: Current implementation only handles ~20% of FiveFilters directives
2. **No Pre-processing**: Missing find_string/replace_string support breaks configs like New Yorker's
3. **Poor Error Handling**: When XPath selectors don't match, entire extraction fails instead of falling back
4. **No Validation**: Accepts configs but doesn't validate if they'll actually work

### FiveFilters Ecosystem
- **Full-Text RSS**: PHP-based, no JavaScript/Node.js implementation exists
- **Site Configs**: 2000+ configs in the repository, many using advanced features we don't support
- **Documentation**: Comprehensive but assumes PHP implementation

## Implementation Notes

### Key Directives Found in Configs (from analysis)
- 45+ unique directives in use across site configs
- Most common: title, body, strip, strip_id_or_class, author, date
- Advanced: find_string/replace_string, http_header, wrap_in, move_into
- Multi-page: single_page_link, next_page_link, autodetect_next_page

### Critical for New Yorker
- find_string/replace_string (currently used but not supported)
- Body XPath selectors that likely don't match current HTML
- No title selectors (requires fallback)

This plan provides a robust, production-ready implementation that will handle all FiveFilters configs properly.