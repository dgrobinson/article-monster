# Article Extraction Test Cases

This directory holds offline fixtures for extraction testing.

## Structure
- `test-cases/unsolved/` - Open problems we want to fix.
- `test-cases/solved/` - Regression tests that should keep passing.
- Optional goldens: `test-cases/solved/*.expected.epub` for EPUB-based checks.

## Running tests
- All extraction tests: `npm test`
- Only solved: `ONLY_SOLVED=true node test/dev-scripts/test-extraction.js`
- Only unsolved: `ONLY_UNSOLVED=true node test/dev-scripts/test-extraction.js`

## Adding a new test case (ELI5)
1) Save the HTML (best) or paste inline HTML into the JSON.
2) Create a JSON file in `test-cases/unsolved/`:
   - Required: `name`, `url`, and one of `htmlFile` or `content`.
   - Optional: `expectedPhrases`, `minLength`, `notes`.
3) Add the HTML file (if used) to the same folder.

## Goldens (optional)
- If you have a known-good EPUB, place it next to the JSON as
  `slug.expected.epub`. The test runner will compare content to it.
- Goldens are committed in the repo. CI does not sync from
  `latest-outputs-debug`.
- Use `test/goldens.manifest.json` and `scripts/sync-goldens.js` only
  when you want to manually refresh goldens.
