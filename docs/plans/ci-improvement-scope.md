# CI Improvement Scope (Draft)

## Context
During anchor PR reconciliation, `npm test` reported failures tied to EPUB golden comparisons.
This is scoped as follow-up work, not a blocker for the anchor PR merge unless CI policy requires it.

## Symptoms
- `test/dev-scripts/test-extraction.js` and `test/dev-scripts/test-extraction-with-fivefilters.js` fail on:
  - `test-cases/solved/sapienism-burning-bridges.json`
- Failure details:
  - Expected text length (from EPUB golden) is about 8-11 percent longer than the extracted article text.
  - This difference comes from extra EPUB header/meta/source content that is not in Readability output.
- JSDOM prints CSS parse warnings for the Sapienism HTML. These are noisy but not the direct failure.

## Root Cause (ELI5)
The "golden" EPUB includes extra text (title, metadata, source block). The extractor only returns article body.
When CI compares lengths, it is comparing "body only" to "body plus extras," so the test fails.

## Files Involved
- `src/epubGenerator.js` adds `<h1>`, `.meta`, and `.source` blocks to EPUB output.
- `test/dev-scripts/test-extraction.js` and `test/dev-scripts/test-extraction-with-fivefilters.js` compare
  extracted article text against EPUB-derived text.
- `test-cases/solved/sapienism-burning-bridges.expected.epub` is the failing golden.

## Options for the CI Fix
1. Strip EPUB header/meta/source before comparison
   - Update `extractPlainTextFromEpub()` in both test scripts to remove:
     - `<head>...</head>`, `<h1>...</h1>`, `.meta`, and `.source` blocks.
   - This makes the EPUB comparison align with body-only extraction.

2. Skip EPUB length comparison when HTML is available
   - Add a test-case flag like `skipEpubCompare` or `useEpubOnly`.
   - Use EPUB only for phrase selection/minLength fallback, not strict length match.

3. Rebuild goldens from extraction content instead of EPUB
   - Adjust `scripts/sync-goldens.js` to store a normalized text baseline.
   - Compare extractor output to that baseline rather than to EPUB text.

## Suggested Next Steps
- Pick one option and implement it in a dedicated CI PR.
- Re-run `npm test` to confirm the Sapienism case passes.
- Decide if CI should continue enforcing EPUB length checks for solved cases.

## Notes
A local branch was created with exploratory changes and the updated Sapienism golden:
- Branch: `ci-improvement-scope`
- Modified files:
  - `test/dev-scripts/test-extraction.js`
  - `test/dev-scripts/test-extraction-with-fivefilters.js`
  - `test-cases/solved/sapienism-burning-bridges.expected.epub`
This branch is not intended for merge until the CI approach is agreed.
