# API contract audit baseline (2026-11-18)

## Purpose

Establish a source-backed starting point for the API method, authentication, authorization, resource-ownership, and client-consistency audit. This is an audit baseline, not a declaration that the API is secure or contract-complete.

## Audited source

- Worker dispatcher: `src/index.js`, function `api(req, env)`
- Existing static inventory: `docs/architecture/API-ENDPOINT-INVENTORY-2026-11-18.json`
- Existing inventory source checks: `scripts/test-api-endpoint-inventory.mjs`
- Public client runtime: `public/app.js`

The inventory is a first-pass static scan of literal path branches and dynamic path matchers. It is now pinned to Worker blob `d35630f02e392496ce8826c9f720b75672b099c8`, with exact route source-line evidence checked by the build gate. Its method and helper-signal fields are evidence hints only. They do not prove allowed methods, authorization outcomes, or resource-level ownership.

## Verified inventory totals

| Measure | Count |
|---|---:|
| Literal API path values | 74 |
| Literal route branch occurrences | 91 |
| Explicit method conditions recorded by the inventory | 77 |
| Dynamic route families | 21 |
| Previously unconstrained literal paths now covered by centralized method contracts | 14 |
| Literal paths still unresolved for method | 0 |

All 74 literal paths and all 21 dynamic families remain review-required for auth and resource scope. The 14 paths that previously lacked explicit method evidence now have centralized method contracts enforced before schema bootstrap and session lookup. The remaining 77 direct method conditions are still source evidence, not a full security contract.

## Concrete findings confirmed in source

### 0. Inventory source fingerprint and line evidence

The inventory has been regenerated against Worker blob `d35630f02e392496ce8826c9f720b75672b099c8`. The build-gated audit test recomputes the Git blob SHA-1, verifies all literal route occurrence line numbers, and verifies each dynamic route source line. This closes the stale-fingerprint and shifted-line evidence issue for this audited revision.

### 1. Rating contract mismatch

The Worker POST handler for `/api/rating` rounds the submitted value and accepts only 1 through 5. The public client rating formatter also labels values on a 5-point scale. This conflicts with the product requirement for whole-number ratings from 1 through 10.

Status: **confirmed contract mismatch; remediation not included in this baseline**.

Required follow-up:
- inspect all rating writes, read projections, seeds, migrations, tests, and UI controls;
- define one canonical 1–10 contract;
- safely migrate existing stored values without fabricating ratings;
- update every client surface and API validation together;
- add regression tests for 1, 5, 6, 10, decimals, zero, and out-of-range values.

### 2. Method evidence is incomplete

Fourteen literal paths previously had no explicit method evidence. They are now covered by a centralized allowlist enforced before schema bootstrap and session lookup:
`/api/health`, `/api/taxonomy`, `/api/me`, `/api/config`, `/api/genres`, `/api/tags`, `/api/public-authors`, `/api/sources`, `/api/omni/status`, `/api/omni/search`, `/api/omni/resolve`, `/api/omni/smart-unlock`, `/api/novels`, and `/api/admin/stats`.

Unsupported methods now receive HTTP 405 with an `Allow` header. `/api/taxonomy` allows GET and POST; the other 13 paths allow GET only. This resolves method dispatch for these paths, but does not resolve their authentication or resource-ownership contracts.

### 3. Authorization signals are not sufficient evidence

The inventory records nearby calls to `need(u)`, `admin(u)`, and `author(u)`. These are useful navigation signals, but they do not prove that every database read or write is scoped to the authenticated account, that an author owns the addressed resource, or that an administrator-only action is correctly guarded.

Dynamic routes need explicit per-operation ownership review, especially author AI projects, author novels/chapters, user records, publishing resources, donations, reports, requests, and connector authorization requests.

### 4. Duplicate rating route branch remains present

The inventory records three literal `/api/rating` branch occurrences. Preserve this as a reconciliation item until the GET/POST handlers and any duplicate branch are reviewed together. Do not silently normalize the inventory count.

## Required contract dimensions

Every endpoint operation must ultimately document:

1. Exact path or dynamic path pattern.
2. Allowed HTTP method(s), including explicit unsupported-method behavior.
3. Authentication: public, optional session, or required session.
4. Required role/capability, if any.
5. Resource scope: public resource, caller-owned resource, role-scoped resource, or system resource.
6. Input validation and bounded payload/query parameters.
7. Side effects and idempotency expectations.
8. Response/error status contract.
9. Client call sites and whether they match the server contract.
10. Automated tests for authorization and cross-account isolation where applicable.

Unknown values must remain marked **unverified**, not inferred from route names or nearby helper calls.

## Audit sequence

1. Resolve method behavior for all 74 literal paths and 21 dynamic families. The 14 previously unconstrained literal paths now have explicit centralized guards; continue reviewing all remaining branches and dynamic families.
2. Resolve authentication and role requirements from full control flow, including delegated helpers.
3. Trace resource ownership and cross-account isolation for every read/write.
4. Reconcile API operations with frontend call sites.
5. Turn confirmed gaps into narrowly scoped fixes and regression tests.
6. Re-run Cloudflare build, Worker tests, migration governance, and architecture checks.

## Explicit limitations

- Static source review is not a live production API test.
- No live Cloudflare D1 data was read or changed.
- No production deployment was performed.
- No browser session or authenticated multi-account production test was performed.
- This baseline does not certify endpoint security, API completeness, or client parity.
- The separate API resource-validation work in PR #336 remains a separate stacked change and must be reconciled before the API foundation is declared complete.
