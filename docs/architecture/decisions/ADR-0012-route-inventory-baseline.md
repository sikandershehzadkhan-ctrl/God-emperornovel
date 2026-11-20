# ADR-0012: Establish a source-audited route inventory before canonical routing

**Status:** Proposed  
**Date:** 2026-11-18  
**Decision owners:** Platform architecture and repository governance

## Context

The current Worker owns HTML dispatch, API dispatch, and sitemap response handling in separate source locations. The sitemap's static path list is separately maintained from the HTML dispatch map. The repository also contains older route-registry research and a browser-side registry branch that diverged from current `main`; neither is safe to merge wholesale.

The current-main source audit identified 33 exact HTML dispatch entries, six dynamic HTML route families, four sitemap endpoints, and 76 API path literals. These are observed source facts, not proof of live behavior, screen completeness, or authorization correctness.

## Decision

1. Record a machine-readable, evidence-stamped route inventory derived from the current default-branch Worker and sitemap source.
2. Keep page routes, dynamic page patterns, API path literals, and sitemap endpoints as separate route classes.
3. Mark unverified method, authentication, resource ownership, response schema, screen completeness, and SEO policy explicitly as unresolved. Do not infer security from a robots/noindex rule.
4. Add a build-integrated regression check that detects drift between the inventory and current Worker/sitemap source.
5. Treat this inventory as a baseline, not yet the final canonical registry. A later phase must reconcile browser navigation, client route rendering, redirects, locales, route permissions, API methods, resource ownership, canonical URLs, and sitemap eligibility.
6. Generate or validate sitemap membership from the completed canonical registry only after the unresolved indexability and rights policies are reviewed.

## Consequences

- The existing dynamic sitemap and rights-eligibility filters are preserved.
- Route drift becomes detectable during the standard build.
- The project gains a reproducible source inventory without importing divergent branch history.
- Route authorization and UX completeness remain explicit acceptance gates rather than being falsely certified by path enumeration.

## Verification

The baseline test compares exact page paths and shells to the Worker map, checks dynamic route source expressions and representative path matches, verifies API literal presence in the API handler, compares static sitemap paths and noindex paths to their source definitions, and checks sitemap endpoint coverage.
