# ADR-0027: Public author discovery directory

- **Status:** Proposed
- **Date:** 2026-11-05
- **Decision owner:** Catalog
- **Technical integrator:** Platform integrator

## Context

The canonical Worker already exposes a GET-only `/api/public-authors` aggregate, but the public `/authors` page, route registration, public SEO entry and explicit authorization review were missing. A legacy feature branch contains an author directory, but it is deeply divergent and includes obsolete Worker and browser-bundle snapshots. Importing it wholesale would reintroduce stale shared code.

## Decision

1. Reconstruct the author directory as a bounded feature slice on the canonical integration root.
2. Route `/authors` to a dedicated page shell using the canonical application shell and localized client.
3. Add desktop and mobile navigation links in all fourteen interface locales; preserve existing `/author/:name` profile URLs.
4. Keep the public author API GET-only. Cap search text at 80 characters, escape backslash/percent/underscore LIKE wildcards, and bound output to 50 search results or 100 directory results.
5. Aggregate only novels with `publication_status='published'` and `rights_status` in `original`, `public_domain`, `licensed` or `authorized`. Use `COALESCE` for recorded views and include only valid 1–10 ratings in any rating aggregate.
6. Return only author display names and aggregate story/read metadata. Never expose account IDs, email addresses, private profile fields or unpublished works.
7. Include `/authors` in canonical SEO metadata, static sitemap output, route registry, API method inventory and handler-level authorization inventory.
8. Keep `public/app.js` and the versioned served bundle byte-identical. Do not introduce a database migration.

## Consequences

- Readers can discover authors without relying on a direct profile URL.
- The directory is indexable and reachable from desktop and mobile navigation.
- Search is bounded and literal for SQL LIKE wildcard characters.
- Existing public author profile routes and data remain compatible.
- The legacy branch's obsolete Worker and browser snapshots are not imported.

## Validation

The build-invoked author-discovery test checks route mapping, GET-only behavior, rights filtering, bounded escaped search, safe author rendering, navigation, SEO, sitemap metadata, authorization review and app-bundle parity. The full six-workflow integration suite must pass on the exact feature head.

## Rollback

Revert the page shell, renderer, navigation, Worker route, SEO metadata and inventory updates together. No database rollback or data repair is required.
