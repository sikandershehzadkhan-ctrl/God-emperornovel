# ADR-0030: Canonical Worker page-route registry

- **Status:** Accepted for implementation in PR #350
- **Date:** 2026-11-20
- **Decision owners:** Repository architecture and engineering governance

## Context

The Worker previously maintained its exact page-shell map, dynamic page-family expressions, and crawler noindex list inline in `src/index.js`. This made route ownership difficult to audit and allowed tests and documentation to drift from the actual Worker dispatch.

## Decision

Use `src/route-registry.mjs` as the single runtime source for:
- Exact page path to HTML shell mappings.
- Dynamic page route families and their HTML shells.
- Exact crawler noindex policy for page routes.

The Worker must import and use this registry for both page-shell selection and page dispatch. Cloudflare `run_worker_first` configuration must cover every exact page path and each dynamic page prefix. Build-gated tests must verify shell files exist and route, sitemap, noindex, and Worker routing contracts remain consistent.

## Explicit boundaries

- A crawler `noindex` directive is **not** authentication, authorization, or data isolation.
- A returned HTML shell does not certify that its client screen is complete or that protected API calls are secure.
- API endpoint inventory, authorization, and resource ownership remain separate audits.
- Dynamic novel and chapter sitemap eligibility is rights-filtered by the existing sitemap queries; this ADR does not change publication or rights policy.
- Public author profiles are distinct from the exact `/author` Author Studio route. The former must not inherit the latter's noindex rule.
- This decision does not add locale-prefixed URLs, canonical trailing-slash redirects, or claim visual/browser QA.

## Consequences

- Page route definitions are reviewable in one module.
- Worker dispatch and tests share one route source rather than duplicated exact-path maps.
- Route changes require corresponding updates to sitemap, Cloudflare route coverage, and source-backed route evidence.
- Future API route governance must not be folded into page-shell resolution.

## Validation

PR #350 adds a build-gated route contract test and updates existing SEO, catalog fallback, and release consistency tests to consume the route registry. Cloudflare Source Validation must pass on the exact PR head.
