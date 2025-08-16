# Article Extraction Test Cases

This directory contains saved articles for testing and improving extraction methods.

## Structure
- `examples/` - Saved complete web pages (HTML + assets)
- `results/` - Expected extraction results for comparison
- `run-tests.js` - Test runner to validate extraction against examples

## Examples

### New Yorker (JSON-LD with articleBody)
- **File**: `examples/new-yorker-example.html` 
- **Extraction Method**: JSON-LD structured data
- **Status**: ✅ Working - includes full `articleBody` in JSON-LD

### The Atlantic (JSON-LD without articleBody)
- **File**: `examples/atlantic-example.html`
- **Extraction Method**: Falls back to DOM extraction
- **Status**: ⚠️ Partial - JSON-LD has metadata but no article content


## Adding New Test Cases

1. Save complete webpage using browser "Save Page As" (complete)
2. Move saved files to `examples/[site-name]-[article-title].html`
3. Update this README with extraction method and status
4. Add expected results to `results/[filename].json`

## Testing
Run `node test-cases/run-tests.js` to test all examples against current extraction logic.