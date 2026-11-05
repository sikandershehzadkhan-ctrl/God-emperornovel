# ADR-0019: Keep personalized recommendation routes out of search indexes

**Status:** Accepted for the canonical integration candidate  
**Date:** 5 November 2026

## Context

The Worker serves personalized recommendation routes through the shared HTML shell. The current private-route noindex set covers account and reader-private destinations but omitted `/for-you` and `/made-for-you`. These routes may expose personalized ordering or account-specific recommendations, so allowing them to be indexed risks publishing private or unstable personalized views.

The repository's ownership governance requires an ADR or feature contract in the same PR for changes to the Worker and architecture-owned test surface.

## Decision

1. Add both `/for-you` and `/made-for-you` to the exact Worker HTML noindex route set.
2. Preserve the existing response-level `X-Robots-Tag` and HTML robots meta behavior.
3. Extend the SEO regression test to assert both routes are included in the private-route policy.
4. Do not treat robots directives as an authorization mechanism. Personalized data must still be protected by server-side authentication and owner scoping.

## Consequences

- Search engines are instructed not to index personalized recommendation pages.
- Public canonical discovery pages remain indexable under the existing public content and rights policy.
- No database migration or schema change is required.
- No production deployment or D1 mutation is authorized by this decision.

## Validation

Run the full Cloudflare source validation and architecture governance workflows on the exact PR head. The SEO regression must fail if either personalized route is removed from the noindex set.
