# Worker Page Route Inventory: Mainline Baseline

**Audit date:** 2026-11-20  
**Audited ref:** `main` at `a7a83ee780e6f785713b8e3bf8aa2821a0ada97b`  
**Source blob:** `src/index.js` at `237f4461135eb77258b7184e361ce9dfd9a140e9`  
**Manifest:** `IMPERIAL-ROUTE-REGISTRY-01N.json`

## Finding

The mainline Worker contains a deterministic exact-path-to-HTML-shell map and six dynamic page-route patterns. The manifest records that source inventory and the test compares the complete exact path set and shell mapping against the Worker source. The noindex list and sitemap endpoint inventory are also checked against source.

## Evidence boundary

This is a source-level dispatch inventory. It is not evidence that every client screen is functional or that every route is correctly authorized. A page-shell route can return HTML while its client screen is incomplete or its underlying APIs are insufficiently protected.

## Remaining foundation work

1. Reconcile each route with its actual client renderer and navigation exposure.
2. Add evidence-backed authentication, role, and resource-ownership policies.
3. Record canonical URL, indexability, locale, and RTL policy per route.
4. Prove public sitemap output excludes private, draft, unpublished, and rights-ineligible content.
5. Exercise HTTP status, browser navigation, and production asset behavior against a running Worker.
6. Keep API method and object-level authorization in their own inventory and tests; do not infer it from page routes.

No runtime, database, secret, or deployment configuration is changed by this inventory.
