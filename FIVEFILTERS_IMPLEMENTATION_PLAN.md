# Complete Plan for Full FiveFilters Config Support

## Overview
Build a comprehensive JavaScript/Node.js implementation of the FiveFilters config parser since no existing JS library exists (FiveFilters is PHP-based).

## Phase 1: Enhanced Config Parser (configFetcher.js)

### 1.1 Core Extraction Directives
```javascript
{
  // Existing (keep)
  title: [],      // XPath selectors for title
  body: [],       // XPath selectors for body  
  author: [],     // XPath selectors for author
  date: [],       // XPath selectors for date
  strip: [],      // XPath selectors to remove
  
  // Add new directives
  find_string: [],     // Strings to find for replacement
  replace_string: [],  // Replacement strings
  strip_attr: [],      // Attributes to strip
  strip_id_or_class: [], // IDs/classes to remove
  strip_image_src: [], // Image sources to remove
  dissolve: [],        // Elements to unwrap (keep content)
  wrap_in: [],         // Wrap matching elements  
  move_into: [],       // Move elements into others
}
```

### 1.2 Processing Directives
```javascript
{
  tidy: 'yes',          // Clean HTML before processing
  prune: 'yes',         // Remove non-content elements
  autodetect_on_failure: 'yes', // Fallback to Readability
  parser: 'html5',      // Parser to use
  skip_json_ld: false,  // Skip JSON-LD extraction
  prefer_jsonld: false, // Prefer JSON-LD over DOM
  convert_double_br_tags: 'yes', // Convert <br><br> to <p>
}
```

### 1.3 Multi-page Support
```javascript
{
  single_page_link: [],      // XPath to single-page version
  single_page_link_in_feed: [], // For feed processing
  next_page_link: [],        // XPath to next page
  autodetect_next_page: true, // Auto-detect pagination
}
```

### 1.4 HTTP Configuration
```javascript
{
  http_headers: {},     // Custom headers (User-Agent, Cookie, etc.)
  requires_login: false, // Site requires authentication
  login_uri: '',        // Login endpoint
  login_username_field: '', // Username field name
  login_password_field: '', // Password field name
  not_logged_in_xpath: '',  // Detect if not logged in
}
```

### 1.5 Advanced Features
```javascript
{
  native_ad_clue: [],   // Detect native ads
  if_page_contains: [], // Conditional processing
  test_url: [],         // Test URLs for validation
  test_contains: [],    // Expected content in tests
  src_lazy_load_attr: [], // Lazy load attributes
  insert_detected_image: true, // Insert lead images
}
```

## Phase 2: Processing Pipeline (bookmarklet.js)

### 2.1 Pre-processing Stage
1. **String Replacement** (find_string/replace_string)
   - Apply before DOM parsing
   - Handle special cases like `<noscript>` tags
   - Fix lazy-loaded images

2. **HTML Cleaning** (tidy)
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