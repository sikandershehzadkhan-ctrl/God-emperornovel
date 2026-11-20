# ADR-0027: Canonical URL and compatibility-route metadata

- **Date:** 2026-11-20
- **Status:** Accepted
- **Related:** ADR-0022 through ADR-0026 and `IMPERIAL-ROUTE-REGISTRY-01N.json`

## Context

The route shells previously shipped without canonical link metadata. The two exact aliases, `/discover` and `/for-you`, could therefore be crawled as separate URLs, while trailing-slash and query variants had no shared canonicalization rule. The `/fandom/:slug` route is only a client-side compatibility redirect to catalog search, not a dedicated landing page.

## Decision

A small pure helper normalizes canonical paths by removing query strings and trailing slashes, preserving the root path, and mapping the two aliases to their canonical targets. Fandom compatibility paths return no canonical target and are marked `noindex,nofollow`.

The Worker now injects a canonical link and matching Open Graph URL into served route shells using the incoming request origin. It also inserts a noindex robots meta tag when a served shell does not already contain one.

## Validation

The route-registry test imports the actual canonical-path helper and verifies root handling, aliases, trailing slashes, query exclusion, and omission of fandom compatibility URLs. It also checks that the Worker emits canonical and Open Graph URL metadata and applies the dynamic noindex rule.

## Evidence boundary

This is source-level implementation and testing. Canonical tags, redirects, locale variants, and indexability still require deployed HTTP/browser verification. No production deployment or database change is included.
