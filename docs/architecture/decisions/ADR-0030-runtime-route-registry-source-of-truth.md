# ADR-0030: One runtime route registry drives dispatch, canonical aliases, and static sitemap paths

- **Date:** 2026-11-20
- **Status:** Accepted
- **Related:** ADR-0022 through ADR-0029 and `IMPERIAL-ROUTE-REGISTRY-01N.json`

## Context

The route manifest was being checked against separate hard-coded route dispatch, noindex, canonical-alias, and static sitemap lists. Those parity tests detected drift, but the runtime still maintained multiple independent sources of truth.

Unknown page paths were also served through the 404 shell without an explicit HTTP 404 status.

## Decision

Introduce `src/route-registry.mjs` as the runtime source for:
- All 33 exact route-to-shell mappings, screen/renderer identifiers, robots policy, canonical target, and static sitemap eligibility.
- All six dynamic route patterns, sample paths, shell mappings, and robots/canonical behavior.
- Canonical alias derivation.
- Static sitemap path derivation.
- Runtime page-route resolution.

The Worker HTML dispatcher now calls `resolvePageRoute()`. The sitemap renderer imports `STATIC_SITEMAP_PATHS` from the same module. Canonical path resolution derives aliases and omitted compatibility paths from that registry. Unknown page paths return the 404 shell with HTTP status 404 and noindex headers.

The documentation manifest remains a richer architecture/evidence view; regression tests compare it against the runtime registry so metadata and runtime behavior cannot silently drift.

## Validation

The route-registry test imports the runtime registry and checks exact route coverage, dynamic pattern samples, shell and robots policies, canonical aliases, and sitemap path parity. The SEO guard test checks noindex behavior through the runtime registry. Existing dynamic sitemap tests continue to exercise XML generation and pagination.

## Evidence boundary

These are source-level tests and unit-level sitemap tests. Live Worker HTTP status, cache behavior, browser navigation, and dynamic sitemap responses against real D1 still require deployed integration verification. No production deployment or D1 mutation is included.
