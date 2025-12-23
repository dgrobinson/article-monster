# Parser Bug Intake

Use this workflow to file reproducible FiveFilters parser bugs without changing
vendored configs. The goal is a consistent artifact set for fast triage.

## Workflow

1. Identify the hostname and config file path.
   - Example: `example.com` -> `site-configs/example.com.txt`
   - Do not edit the config file (see ADR-001).
2. Run the inspection script and capture the output.
   - `node scripts/inspect-config.js --hostname example.com --json`
   - Or: `node scripts/inspect-config.js --file site-configs/example.com.txt --json`
   - Add `--compact` for a smaller JSON payload.
3. Copy a raw config snippet that includes the relevant directives.
4. Collect logs from the bookmarklet console and server.
5. File the issue using the "Parser Bug Report" template and attach the artifacts.

## Inspection Output

The script uses `src/configFetcher.js` to parse the config and emits warnings for:
- Unrecognized directives
- Empty directive arrays

It also reports whether any `body` rules were found (`bodyRulesPresent`).

### Example

```json
{
  "source": {
    "hostname": "example.com",
    "file": "/path/to/repo/site-configs/example.com.txt"
  },
  "warnings": {
    "unrecognizedDirectives": [
      {
        "line": 7,
        "directive": "unknown_rule",
        "reason": "unrecognized directive",
        "raw": "unknown_rule: foo"
      }
    ],
    "emptyArrays": [
      "title",
      "author",
      "date",
      "strip",
      "find_string",
      "replace_string"
    ]
  },
  "bodyRulesPresent": true,
  "config": {
    "title": [
      "//h1"
    ],
    "body": [
      "//div[@class='article']"
    ],
    "author": [],
    "strip": [],
    "date": [],
    "find_string": [],
    "replace_string": [],
    "strip_id_or_class": [],
    "strip_image_src": [],
    "single_page_link": [],
    "next_page_link": [],
    "test_url": [],
    "prune": null,
    "tidy": null,
    "autodetect_on_failure": null,
    "parser": null,
    "htmlPreprocessing": []
  }
}
```

## Issue Template

Use the template at `.github/ISSUE_TEMPLATE/parser-bug.yml` to file bugs with
the required artifact set.
