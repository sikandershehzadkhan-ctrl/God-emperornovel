# ADR-0023: Route-to-renderer and static sitemap parity checks

- **Status:** Accepted
- **Date:** 2026-11-20
- **Depends on:** ADR-0022

## Context

The route registry now validates exact Worker page-shell dispatch and noindex metadata. That is not sufficient to catch a route whose client renderer disappears or a private noindex route accidentally enters the static sitemap.

## Decision

Extend the route-registry validation to:
1. Verify that each non-standalone exact route has a corresponding client renderer token in `public/app.js`.
2. Verify each dynamic route sample against its registered pattern and require the corresponding client renderer where the route is not an intentional redirect.
3. Record the static sitemap path list in the manifest and compare it exactly with `src/sitemap.mjs`.
4. Fail if any route classified as noindex appears in the static sitemap.

These checks validate source-level wiring and sitemap classification only. They do not replace browser tests, live HTTP checks, rights/publication eligibility tests, or route/API authorization tests.

## Consequences

Client renderer removals, static sitemap drift, and accidental noindex leakage become CI-visible route-registry failures.
