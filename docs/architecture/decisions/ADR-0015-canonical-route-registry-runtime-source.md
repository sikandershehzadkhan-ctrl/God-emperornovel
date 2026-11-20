# ADR-0015: Runtime canonical route registry

- **Status:** Accepted for the foundation branch, pending PR review
- **Date:** 2026-11-19
- **Decision owners:** Imperial Novel architecture

## Context

Page-shell routing, dynamic page families, noindex policy, and static sitemap membership were represented in separate Worker and sitemap declarations. That duplication allowed the route inventory to drift from actual runtime dispatch. In particular, a route could be listed as a dynamic page while the outer Worker dispatcher sent dotted path segments to static asset handling before the HTML resolver ran.

## Decision

Use `src/route-registry.mjs` as the runtime source for:
- exact page path to HTML shell mappings;
- dynamic page family patterns and shell mappings;
- exact noindex utility paths;
- static sitemap membership.

The Worker uses `resolvePageShell` for both HTML shell selection and outer fetch dispatch. The sitemap renderer consumes `SITEMAP_STATIC_PATHS` from the same module. Unknown extensionless paths retain the existing HTML 404 shell behavior; paths with file extensions continue to the asset handler unless explicitly registered as page routes.

`docs/architecture/CANONICAL-ROUTE-REGISTRY.json` remains the reviewable evidence snapshot. Build-gated tests compare the runtime module with that snapshot, validate every exact and dynamic route sample, verify noindex/sitemap separation, and preserve explicit uncertified security gates. API route metadata remains separately inventoried because API dispatch and authorization have different semantics.

## Consequences

- Adding or changing a page route or static sitemap path requires updating the runtime registry and evidence snapshot in the same change.
- Route dispatch and sitemap output can no longer silently diverge through independent hard-coded lists.
- The registry does not certify page content, authentication, resource authorization, visual accessibility, or deployed behavior.
- Dynamic resource access remains subject to endpoint-level publication and ownership checks.
