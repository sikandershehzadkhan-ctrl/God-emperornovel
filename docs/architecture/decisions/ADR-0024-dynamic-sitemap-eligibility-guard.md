# ADR-0024: Dynamic sitemap publication and rights eligibility guard

- **Date:** 2026-11-20
- **Status:** Accepted
- **Scope:** Source-level regression protection for dynamic sitemap SQL.
- **Related:** ADR-0022, ADR-0023, `IMPERIAL-ROUTE-REGISTRY-01N.json`

## Context

The route registry already checks static sitemap parity and ensures exact noindex routes are not listed. Dynamic novel and chapter sitemap endpoints are assembled by Worker database queries. A source-level regression could accidentally include drafts, unpublished chapters, or works without an eligible rights status while leaving the static sitemap checks green.

## Decision

The route-registry validation now inspects all four dynamic sitemap SQL queries:

1. Novel count query.
2. Novel page query.
3. Published chapter count query.
4. Chapter page query.

Novel sitemap queries must require `publication_status='published'` and a rights status in `original`, `public_domain`, `licensed`, or `authorized`. Chapter sitemap queries must additionally require the chapter itself and its parent novel to be published. Paginated page queries must retain deterministic ordering and bounded limit/offset pagination.

The route manifest also records the unresolved product-level question that `/omniportal` is publicly linked and statically indexable even though external connector search is restricted to enabled authorized connectors and import requires an authenticated user plus an enabled authorized connector. This is an explicit policy decision still requiring confirmation, not a claim that the portal is globally disabled.

## Evidence boundary

These are source-level guards over the current Worker SQL. They do not execute against production D1, prove that all rights metadata is correct, certify object-level authorization for every API, or verify live sitemap output. No runtime code, schema, secrets, or production data are changed.
