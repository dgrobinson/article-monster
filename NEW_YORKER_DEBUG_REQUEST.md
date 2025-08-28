# Critical Bug: New Yorker Article Extraction Failing Despite Config Being Loaded

## Problem Summary
The bookmarklet successfully extracts articles from The Atlantic and NYTimes but consistently fails for The New Yorker with `title: undefined` and no EPUB generation. The extraction has been failing for 15+ debugging attempts over several weeks.

## Current Symptoms
1. **Server logs show**: `title: undefined`, `extractionMethod: "unknown"` 
2. **Browser console shows**: `Using cached FiveFilters config for newyorker.com` (appears 2-6 times)
3. **Missing logs**: None of our debugging logs appear, including the entry point log for `_extractWithSiteConfig()`
4. **No JavaScript errors** in console
5. **Works fine for**: Atlantic, NYTimes (sites with explicit `title:` rules in config)
6. **Fails for**: New Yorker (no `title:` rules, relies on auto-detection)

## Key Discovery
The New Yorker config (site-configs/newyorker.com.txt) has:
- NO title extraction rules (unlike working sites)
- Complex preprocessing: `find_string: <header` → `replace_string: <em`  
- Complex XPath: `//em[@data-testid='SplitScreenContentHeaderWrapper'] | //div[@class='body__inner-container']`

## Architecture Context
```javascript
// Extraction flow in bookmarklet.js
1. extractArticleWithConfig() called
2. Checks for cached config via tempReader._getCachedConfig()
3. If config exists, processes HTML and creates new Readability(processedDoc)
4. Calls reader._extractWithSiteConfig() 
5. Should extract via XPath rules or fall back to auto-detection
```

## The Mystery
Despite adding extensive logging at every step:
- `console.log('_extractWithSiteConfig called for hostname:', ...)` at method entry
- XPath debugging logs (`Trying body XPath:`, etc.)
- HTML preprocessing logs
- Title auto-detection logs

**NONE of these logs appear**, yet the config IS being loaded (we see the "Using cached config" message from `_getCachedConfig()`).

## Critical Code Paths to Investigate

1. **Line 1257 in bookmarklet.js** - Where site config extraction should happen:
```javascript
var reader = new Readability(processedDoc);
var siteConfigResult = reader._extractWithSiteConfig();
```

2. **Line 26** - Alternative path in `Readability.prototype.parse()`:
```javascript
var siteConfig = this._extractWithSiteConfig();
```

## Specific Questions to Answer

1. **Why is `_extractWithSiteConfig()` not being called** despite the config being successfully loaded?
2. **Which extraction path is actually being taken** if not the site-specific one?
3. **Is there an early return or exception** between config loading and `_extractWithSiteConfig()` call?
4. **Why does the config load message appear multiple times** (2-6x with different VM numbers)?
5. **Is the `processedDoc` creation failing** silently before we get to create the Readability instance?

## Debugging Approach Needed

We need someone who can:
1. **Set breakpoints in the browser** at the actual extraction points
2. **Step through the execution flow** to see which path is taken
3. **Inspect the DOM state** after HTML preprocessing
4. **Check if `processedDoc` is valid** when passed to Readability
5. **Determine if there's a silent exception** being swallowed

## Files Involved
- `/public/bookmarklet.js` - Main extraction logic
- `/src/configFetcher.js` - Config parsing (server-side)
- `/site-configs/newyorker.com.txt` - The failing config

## Historical Context
- Worked briefly on Aug 27 with 9220 characters extracted
- Config parser bug fixed (was truncating XPath with colons)
- Two-click problem supposedly fixed with sync config fetch
- Undefined `reader` variable in fallback paths fixed
- All fixes deployed but problem persists

## What We Need
An experienced JavaScript developer who can use browser DevTools to set breakpoints and trace the actual execution flow, since remote debugging through logs has proven insufficient after 15+ attempts.

## Test URL
https://www.newyorker.com/magazine/2025/08/18/baldwin-a-love-story-nicholas-boggs-book-review

## Expected Behavior vs Reality
- **Expected**: XPath extraction finds content after HTML preprocessing, or title auto-detection provides fallback
- **Reality**: Silent failure with no debugging logs, resulting in `title: undefined` and failed EPUB generation