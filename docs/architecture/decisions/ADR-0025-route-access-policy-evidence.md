# ADR-0025: Route access policy evidence is separate from public page-shell dispatch

- **Date:** 2026-11-20
- **Status:** Accepted
- **Related:** ADR-0022, ADR-0023, ADR-0024, `IMPERIAL-ROUTE-REGISTRY-01N.json`

## Context

The Worker HTML dispatcher selects and serves static page shells. It does not authenticate the visitor before returning those shells. Several client renderers then check the current session or role, and the API separately enforces authentication, role checks, and user-scoped queries. Treating a noindex URL or a client-side check as a server-side security boundary would be incorrect.

## Decision

The canonical route manifest now has an explicit access-policy entry for every exact route and dynamic route pattern. It records public-shell behavior separately from content access, action access, client navigation checks, and source evidence.

The initial source audit records:
- Account pages whose API data is session-authenticated and scoped to the current user.
- Author Studio's reader application flow and author/admin workspace roles.
- Admin client role verification and independent administrator API guards.
- OmniPortal's public search behavior, authorized-connector filter, and authenticated authorized-connector import requirement.
- Public/local settings and public discovery routes with action-specific API boundaries.

The registry explicitly labels reader chapter-content and unlock authorization as unfinished rather than assuming the public reader shell proves public content access.

## Validation

The route-registry test checks complete exact/pattern policy coverage, confirms that Worker page-shell dispatch remains public, verifies representative session-owned API guards, checks the admin role gate, and checks OmniPortal connector authorization.

## Evidence boundary

This is a source-level initial policy inventory. It is not a complete audit of every API method, every resource identifier, every payment/unlock path, canonical/locale/RTL behavior, or deployed runtime. No runtime code, database, secrets, or production deployment are changed.
