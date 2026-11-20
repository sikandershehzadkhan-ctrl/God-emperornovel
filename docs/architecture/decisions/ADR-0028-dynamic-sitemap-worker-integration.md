# ADR-0028: Exercise Dynamic Sitemap Queries Through the Worker Handler

- **Status:** Proposed
- **Date:** 2026-11-19
- **Decision owners:** SEO, publishing and platform engineering

## Context

Sitemap unit tests validated XML rendering and source SQL fragments, while reader isolation tests exercised the real Worker handler through a D1-compatible SQLite adapter. The dynamic sitemap endpoints also need runtime coverage to ensure the Worker dispatches requests, binds pagination, and excludes unpublished or rights-pending content.

## Decision

Extend the Worker-handler integration suite to request the sitemap index, novel sitemap and chapter sitemap against an isolated SQLite database. Seed published eligible works alongside draft and rights-pending works. Assert that only eligible novel/chapter URLs are returned and invalid page numbers are rejected.

## Boundaries

This is local SQLite integration coverage, not a live Cloudflare D1 deployment check or search-engine indexing confirmation.

## Validation

The normal build executes these assertions using the real Worker fetch handler and D1-compatible adapter.
