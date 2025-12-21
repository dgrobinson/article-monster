# Article Extraction Test Cases

This directory contains fixtures for validating article extraction locally.

## Structure
- `solved/` - Regression fixtures. Each case is a `.json` file referencing an HTML snapshot in the same folder, plus optional `.expected.epub` goldens.
- `unsolved/` - Work-in-progress cases. Store `.json` definitions (and any HTML snapshots); only JSON cases are picked up by the current test script.
- `examples/` - Legacy HTML captures for ad-hoc debugging; not wired into the harness.
- `pdf-references/` - PDF-based reference cases; see `test-cases/pdf-references/README.md` for format and optional validation.

## Running tests
- `node test/dev-scripts/test-extraction.js`
- Optional/manual: `node test/validate-extraction.js test-cases/pdf-references`

## Adding or updating cases
1. Add a `.json` definition in `test-cases/unsolved/` or `test-cases/solved/` with `name`, `url`, and either `htmlFile` or inline `content`.
2. Store the HTML snapshot alongside the JSON when using `htmlFile`.
3. Optional: add `expectedPhrases`, `minLength`, and `notes` for validation.
4. When a case is fixed, move it from `unsolved/` to `solved/` to keep it as regression coverage.
5. For planned schema changes and goldens, see `docs/test-harness-rebuild.md`.
