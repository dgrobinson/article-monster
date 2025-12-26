# zotero-duplicate-handling (bowline batch)

Worktree: zotero-duplicate-handling
Terminal: zotero-duplicate-handling

## Goal
Keep Zotero clean by removing older duplicate items for the same URL, but only when those older items have no annotations or notes. The newest item stays.

## Scope
In scope:
- Detect existing Zotero items for the same URL after creating the newest item.
- Remove older duplicates only if they have no annotations/notes.
- Log what was removed (or skipped) for transparency.

Out of scope:
- Bulk dedupe across the entire library without a new send.
- Editing or merging annotations.
- Any changes to FiveFilters configs.

## Key Files
- src/zoteroSender.js
- src/server.js
- README.md
- test/** (new tests or fixtures as needed)

## Plan
1) Define dedupe rules
- Only consider items created by this tool (tag `article-bookmarklet`) and, if configured, the test collection.
- Dedupe only by exact URL match (normalized for trailing slashes).

2) Find duplicates after creating the newest item
- Query Zotero for items matching the URL.
- Exclude the newly created item key from deletion candidates.

3) Detect annotations/notes
- Fetch child items for each candidate (attachments + notes).
- Treat `annotation` and `note` item types as “has annotations/notes”.
- If any annotations/notes exist, keep the item.

4) Delete safe duplicates
- If a candidate has no annotations/notes, delete it.
- Log deletions with item key + URL.

5) Add tests
- Mock Zotero API responses for:
  - duplicates with annotations (keep)
  - duplicates without annotations (delete)
  - mixed duplicates (only delete safe ones)

## Deliverables
- Dedup logic in Zotero send path.
- Clear logging of duplicates kept/removed.
- Tests covering the annotation-safety rule.

## Acceptance
- New item is added successfully.
- Older duplicates without annotations are removed.
- Any item with annotations/notes remains untouched.

## Risks / Notes
- Zotero annotations live on child items; ensure child fetches are included.
- Restrict deletions to bookmarklet-created items for safety.

## Archive
Move to docs/plans/archived/bowline/zotero-duplicate-handling.md when complete.
