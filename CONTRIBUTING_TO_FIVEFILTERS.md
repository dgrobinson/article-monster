# Contributing Back to FiveFilters

As good open source citizens using FiveFilters' extensive site configuration work, we should contribute back to help maintain and improve their 2000+ site configs.

All domain-specific extraction rules live in our `site-configs/` directory. Any tweaks for particular sites should be made there and, whenever possible, shared upstream with the FiveFilters project.

## Current Ways We Can Help

### 1. Test and Fix Site Configurations

Use our archived test cases to validate FiveFilters configs:

```bash
# Test The Atlantic config against our saved article
node test-cases/run-tests.js --site theatlantic.com --example atlantic-trump-trade-deals.html
```

### 2. Report and Fix Broken Configs

From their GitHub issues, these sites need help:
- **nytimes.com** - lazy-loaded images not working
- **quantamagazine.org** - missing pictures  
- **faz.net** - broken config
- **phoronix.com** - not working
- **tweakers.net** - pattern outdated

### 3. Create Missing Configurations

Sites we encounter that don't have FiveFilters configs yet:
- Check `ls site-configs/` for missing major news sites
- Create configs using their web interface: http://siteconfig.fivefilters.org
- Submit via GitHub pull requests

### 4. Automated Testing Contribution

**Future Project**: Create automated testing system that:
- Tests all FiveFilters configs against real articles
- Reports failures as GitHub issues
- Suggests fixes based on successful extraction patterns

## FiveFilters Links

- **Test Results**: http://siteconfig.fivefilters.org/test/
- **Config Creator**: http://siteconfig.fivefilters.org
- **GitHub Issues**: https://github.com/fivefilters/ftr-site-config/issues
- **Direct Editing**: Edit configs directly on GitHub web interface

## Our Archive System Benefits FiveFilters

Our `test-cases/examples/` directory provides:
- Real-world test cases for validation
- Examples of successful extraction
- Before/after comparison data
- Edge cases and premium content challenges

## Next Steps

1. ✅ Vendor FiveFilters configs via git subtree
2. Test our archived examples against FiveFilters configs  
3. Submit fixes for broken configs we encounter
4. Share successful extraction patterns from our bookmarklet
5. Consider sponsoring or supporting their infrastructure costs

By using their work responsibly and contributing back improvements, we help maintain this valuable community resource for everyone.