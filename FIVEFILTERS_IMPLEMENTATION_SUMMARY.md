## Summary

### Root Cause Discovery
After analyzing 12 failed attempts to fix the Baldwin article, we discovered the fundamental issue: **our implementation lacks HTML preprocessing directives**, specifically `find_string`/`replace_string` which transforms HTML before XPath processing.

The New Yorker config contains:
```
find_string: <header
replace_string: <em
```

This transforms `<header` tags to `<em` before XPath processing, which is why the body selector works:
```
body: //em[@data-testid='SplitScreenContentHeaderWrapper'] | //div[@class='body__inner-container']
```

### Complete Solution Approach
Rather than continue piecemeal fixes, this plan implements the full FiveFilters specification with 45+ directives across 2000+ site configs, ensuring robust extraction for all sites.

**Key Insight:** FiveFilters' own save-to-Kindle works perfectly for the Baldwin article, proving our JavaScript implementation is missing critical preprocessing steps that their PHP implementation includes.