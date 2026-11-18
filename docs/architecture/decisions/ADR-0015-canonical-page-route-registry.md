# ADR-0015: Canonical Page Route Registry

- **Status:** Proposed
- **Date:** 2026-11-18
- **Decision owners:** Architecture contracts and Worker runtime

## Context

The 2026-11-18 source audit established 33 exact HTML page routes, six dynamic page-route families, 17 exact noindex paths, and 11 static sitemap paths. Before this change, the Worker page dispatcher, noindex policy, and sitemap static path list were maintained in separate source locations. That duplication allowed route behavior and indexing policy to drift.

The audited inventory is evidence of source behavior, not proof of deployed behavior, authorization correctness, or complete screens.

## Decision

Introduce `src/route-registry.mjs` as the shared source for:

- Exact page-path to HTML-shell mappings.
- Ordered dynamic page-route patterns and their shells.
- Exact noindex path policy.
- Static sitemap path membership.

The Worker resolves page shells and noindex policy through this module. The sitemap renderer imports its static path list from the same module. The route-inventory regression test compares the canonical registry against the evidence-stamped audit manifest and exercises every exact route and representative dynamic sample.

## Security and indexing boundaries

- Noindex is a search-engine directive, never an authorization mechanism.
- Route-to-shell resolution does not grant access to protected data. API and resource authorization remain server-side responsibilities.
- Dynamic novel/chapter sitemap generation must retain its existing published and rights-eligible database filters.
- Route presence does not certify screen completeness, accessibility, responsive behavior, or deployed availability.

## Consequences

- Page dispatch, exact noindex behavior, and static sitemap membership now share one source.
- Adding or changing a page route requires updating the registry and its evidence-backed regression tests.
- API endpoint method/authentication contracts remain a separate unresolved audit and are not inferred by this decision.
- Locale/RTL alternates, canonical URL policy, and full client event-navigation reconciliation remain follow-up work.

## Validation

The route registry test must verify all 33 exact routes, all six dynamic route families and their samples, all 17 noindex paths, the static sitemap path list, and the existing API inventory's unresolved status. Cloudflare CI must pass before this decision is accepted.
