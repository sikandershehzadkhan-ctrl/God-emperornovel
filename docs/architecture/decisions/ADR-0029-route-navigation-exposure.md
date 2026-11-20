# ADR-0029: Route navigation exposure is registered separately from route existence

- **Date:** 2026-11-20
- **Status:** Accepted
- **Related:** ADR-0022 through ADR-0028 and `IMPERIAL-ROUTE-REGISTRY-01N.json`

## Context

A route can exist without appearing in primary navigation, and a link can be conditionally shown based on the current user's role or session. The route inventory previously did not record those distinctions.

## Decision

The canonical route registry now classifies navigation exposure for every exact route and dynamic pattern. Exact routes identify desktop top navigation, drawer, mobile navigation, footer, utility actions, contextual-only access, authentication entry, aliases, and role-conditional navigation. Dynamic routes are classified as contextual or compatibility redirects.

The current shell exposes OmniPortal in both desktop top navigation and the main drawer. This is recorded as an explicit product-policy question because the requested rights-first global disable state is not represented by the current navigation or static sitemap.

## Validation

The route-registry test compares each registered primary navigation surface with the current shell markup and verifies the administrator and authenticated-ticket shortcuts remain conditional.

## Evidence boundary

This is source-level navigation exposure inventory. It does not prove that every contextual deep link is reachable in every application state, nor does it verify live browser behavior. No runtime code or production deployment is changed.
