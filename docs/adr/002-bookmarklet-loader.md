# ADR-002: Adopt Bookmarklet Loader Pattern (No Embedded Extraction Logic)

Date: 2025-09-20

Status: Accepted

## Context

- We want users to benefit from extraction improvements without reinstalling the bookmarklet.
- Historically, the bookmarklet embedded the full extraction logic directly in the `javascript:` URL. This meant any extractor changes required users to reinstall.
- Repo history shows this embedding pattern existed since the Aug 1 rewrite (`5f169e3`). A later change on Aug 28 (`27a4806`) injected the service URL at install time but kept the embedded model.
- This violates our principle: the bookmarklet should be a thin loader; extraction logic should be fetched dynamically from the service.

## Decision

- Switch to a loader pattern: The installed bookmarklet contains only a minimal bootstrap that, at click-time, injects a `<script>` tag loading the latest extractor from the service origin.
- Implementation details:
  - The installer (`public/index.html`) now generates a bookmarklet that sets `window.__BOOKMARKLET_SERVICE_URL__` to `<origin>/process-article` and injects a script tag for `public/bookmarklet.js` with a cache-busting query (`?v=Date.now()`).
  - The debug bookmarklet similarly loads `public/bookmarklet-debug.js` via script injection.
  - The extractor code remains in `public/bookmarklet.js` on the server and can be updated independently of user-installed bookmarks.

## Consequences

Positive:
- Users automatically get the latest extractor without reinstalling.
- Smaller, simpler bookmarklet payload.
- Enables phased rollouts, hotfixes, and A/B testing via server changes.

Trade-offs / Risks:
- Requires network access to the service each time the bookmarklet runs.
- Some sites may have strict CSP that blocks loading scripts from external origins; mitigation is to serve from the same origin the installer uses (already the case) and provide troubleshooting guidance.
- Cache-busting ensures freshness but may reduce browser caching benefits; we can tune this if needed.

## Alternatives Considered

- Continue embedding extractor code: rejected due to reinstall friction and drift.
- Hybrid: small embedded core that dynamically imports modules: more complex, not needed at present.

## References

- Commit introducing embed model: `5f169e3` (2025-08-01) — Complete rewrite.
- Service URL injection in embedded model: `27a4806` (2025-08-28).
- Related PR: #38 (Wix JSON-LD fallback; did not alter delivery model).

## Follow-ups

- Update `AGENTS.md` to require reading ADRs on first inference and to enforce the loader pattern.
- Consider adding an automated check to prevent re-introduction of embedded extraction into the bookmarklet installer.


