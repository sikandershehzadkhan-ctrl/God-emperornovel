# Imperial Novel: API Method Matrix Findings (01N-37)

**Audit date:** 4 November 2026  
**Audited branch:** `integration/homepage-ssr-design-on-security-stack-17-65`  
**Worker source blob:** `a741914a81c7fb08f79ea16deb92376b220cfaa4`  
**Source commit:** `61a40d9cd4d4bf52b5db2780b983441670d933f8`  
**Machine-readable inventory:** `IMPERIAL-API-ROUTE-METHOD-MATRIX-01N-37.json`

## 1. Refreshed inventory

| Item | Count |
|---|---:|
| Exact API paths | 78 |
| Dynamic API route patterns | 21 |
| Exact routes with unguarded method dispatch | 0 |
| Dynamic routes with unguarded method dispatch | 0 |
| Ownership/authorization entries reviewed | 45 |

This is a static dispatcher inventory. It is not a complete OpenAPI contract, authorization certification, or proof of runtime behavior. The 45 ownership entries remain a reviewed subset, not full coverage of all 99 route shapes.

## 2. Method-contract hardening completed

The previous main-branch audit identified path-only branches for health, profile projection, public configuration/catalog reads, Omni status/search/resolve/smart-unlock, novel listing and admin statistics. These were reconciled against the integrated Worker.

- `/api/health` retains its GET fast path and now returns 405 for other methods before database work.
- `/api/me`, `/api/config`, `/api/genres`, `/api/tags`, `/api/public-authors`, `/api/sources`, `/api/omni/status`, `/api/omni/search`, `/api/omni/resolve`, and `/api/omni/smart-unlock` reject non-GET methods before endpoint work.
- `/api/novels` and `/api/admin/stats` now explicitly reject non-GET methods.
- Numeric novel and chapter detail routes require GET before their read/view-count behavior.
- `/api/taxonomy` delegates to `communityTaxonomy`, whose helper validates its supported GET/POST contract.
- Dynamic Author Studio, AI, admin publishing, donation, report, connector-authorization, author-application and request routes retain explicit method dispatch.

The updated machine-readable matrix records the observed methods and source-line evidence. It reports zero unguarded exact or dynamic handlers. This closes the method-ambiguity findings from the 3 November snapshot; it does not certify authorization or data ownership.

## 3. Remaining security work

1. Standardize HTTP 405 responses with accurate `Allow` headers. Current guards reject unsupported methods, but header consistency still needs a dedicated pass.
2. Add per-route anonymous/reader/author/owner/moderator/admin integration tests.
3. Add cross-user ID substitution tests for history, library, bookmarks, tickets, notifications, profiles, AI projects and creator-owned novels/chapters.
4. Add response DTO allowlists and private-cache assertions for account, ticket, payment, author and admin responses.
5. Verify CSRF/origin enforcement and rate limits for every cookie-authenticated mutation.
6. Reconcile the current 1–5 rating API validation with the intended whole-number 1–10 product scale before changing schema or UI.
7. Expand the 45-entry authorization/ownership review to all exact and dynamic routes; do not treat the remaining routes as certified.

## 4. CI and release boundary

The route-registry workflow validates:
- HTML route manifest.
- API method inventory.
- Authorization/ownership register.
- Admin account and donation/ticket D1 invariants.
- Additional API ownership, CSRF, taxonomy, rating, and privacy checks.

The latest full workflow result must be read from the exact PR head. A green static inventory does not authorize production deployment or D1 migration.

**No production Worker deployment or live D1 mutation is part of this audit.**
