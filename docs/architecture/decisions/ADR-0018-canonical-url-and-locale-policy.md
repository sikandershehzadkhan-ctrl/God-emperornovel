# ADR-0018: Canonical URLs, redirects and locale boundaries

- **Status:** Accepted for the foundation branch, pending PR review
- **Date:** 2026-11-19

## Context

Exact page routes, dynamic route families, static sitemap membership, and noindex policy had separate declarations. Trailing-slash behavior was inconsistent, and the legacy fandom shortcut depended on client-side JavaScript to redirect. Public HTML shells also lacked a consistent canonical link.

## Decision

- Centralize route resolution and canonical path normalization in `src/route-registry.mjs`.
- Redirect known trailing-slash page paths with HTTP 308, preserving query parameters.
- Resolve the legacy fandom shortcut server-side to `/catalog?tag={last-segment}` using URLSearchParams.
- Inject query-free canonical links for indexable HTML pages; retain noindex meta and response headers for exact private/utility paths.
- Keep locale prefixes out of the URL until locale routing, hreflang, redirects, and localized sitemap rules are specified.
- Keep chapter-body direction independent from the selected UI language.

## Consequences

- Search engines receive stable slashless canonical paths and do not need client JavaScript to resolve legacy fandom URLs.
- Query-driven discovery URLs do not become duplicate canonical pages.
- The current locale strategy is explicitly unprefixed; localized routes remain a future design decision.
- Canonical tags and redirects do not establish access control or prove that a page is visually or semantically complete.
