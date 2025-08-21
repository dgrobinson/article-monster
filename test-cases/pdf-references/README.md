# PDF Reference Test Cases

This directory contains PDF references for validating article extraction accuracy.

## Structure
- Each test case is in its own directory with:
  - `reference.pdf` - The PDF printout of the article
  - `metadata.json` - Test case metadata (title, URL, creation date)
  - `expected.json` - Expected extraction values for validation
  - `debug-output/` - Linked debug output from extraction (if available)

## How Test Cases Are Created

1. **Manual PDF capture**: Save article as PDF from browser
2. **Automatic processing**: Place PDF in `~/code/local-pdfs/`
3. **Script commits**: The `watch-article-pdfs.sh` script:
   - Creates test case structure
   - Links to recent debug outputs
   - Commits to main branch
   - Deletes local PDF

## Running Tests

```bash
node test/validate-extraction.js test-cases/pdf-references
```

## Test Validation

Tests validate:
- Title extraction accuracy
- Author/byline extraction
- Content length consistency
- Paragraph count
- Image presence
- Overall structure preservation

## Adding Test Cases Manually

1. Create directory: `test-cases/pdf-references/[article-name]-[timestamp]/`
2. Add `reference.pdf`
3. Create `metadata.json`:
```json
{
  "id": "article-name-timestamp",
  "title": "Article Title",
  "url": "https://example.com/article",
  "created": "2024-08-20T10:30:00Z"
}
```
4. Create `expected.json` with expected values
5. Update `manifest.json`