# Article Extraction Test Cases

Offline fixtures used by the test harness. The harness mirrors bookmarklet flow:
HTML preprocessing -> XPath extraction -> Readability fallback.

## Structure
- `unsolved/`: Active issues. Each case is a JSON file plus HTML (or inline `content`).
- `solved/`: Regression tests. JSON metadata plus `.expected.epub` goldens when available.
- `schemas/`: JSON schemas for unsolved and solved cases.
- `examples/`: Legacy HTML snapshots (not wired into the harness).
- `pdf-references/`: PDF-based reference cases; see `test-cases/pdf-references/README.md`.

## Schemas
- `schemas/unsolved.schema.json`:
  - Required: `name`, `url`, and one of `htmlFile` or `content`.
  - Optional: `expectedPhrases`, `minLength`, `notes`.
- `schemas/solved.schema.json`:
  - Required: `name`, `url`.
  - Optional: `htmlFile`, `content`, `expectedPhrases`, `minLength`, `notes`.
  - Checks are usually derived from `.expected.epub` when present.

## Goldens
Goldens are generated from production debug outputs:
- Manifest: `test/goldens.manifest.json`
- Sync script: `npm run sync:goldens`
  - Copies `article.epub` to `test-cases/solved/*.expected.epub`
  - Writes minimal metadata JSON in `test-cases/solved/*.json`

## Adding a new unsolved case
1. Save the page HTML (full page) into `unsolved/`.
2. Create a JSON file in `unsolved/` matching the schema.
3. Add `expectedPhrases` / `minLength` if you want checks.

## Promoting to solved
1. Add or refresh a golden via `npm run sync:goldens`.
2. Move the HTML (if needed) and metadata JSON into `solved/`.
3. Optional: keep explicit `expectedPhrases` / `minLength` overrides.

## Running tests
- `npm test` (runs both harness modes)
- `npm run test:pdf` (manual PDF reference validation)

See `docs/test-harness-rebuild.md` for planned schema and golden updates.

Note: failed unsolved cases are reported but do not fail `npm test` unless you run only unsolved cases.
