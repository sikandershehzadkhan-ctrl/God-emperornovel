# API contract audit baseline (2026-11-18)

## Purpose

Establish a source-backed starting point for the API method, authentication, authorization, resource-ownership, and client-consistency audit. This is an audit baseline, not a declaration that the API is secure or contract-complete.

## Audited source

- Worker dispatcher: `src/index.js`, function `api(req, env)`
- Existing static inventory: `docs/architecture/API-ENDPOINT-INVENTORY-2026-11-18.json`
- Existing inventory source checks: `scripts/test-api-endpoint-inventory.mjs`
- Public client runtime: `public/app.js`

The inventory is a first-pass static scan of literal path branches and dynamic path matchers. It is now pinned to Worker blob `d4eb2234773aed49d3aa824496069a8b8d3662f1`, with exact route source-line evidence checked by the build gate. Its method and helper-signal fields are evidence hints only. They do not prove allowed methods, authorization outcomes, or resource-level ownership.

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

The inventory has been regenerated against Worker blob `d4eb2234773aed49d3aa824496069a8b8d3662f1`. The build-gated audit test recomputes the Git blob SHA-1, verifies all literal route occurrence line numbers, and verifies each dynamic route source line. This closes the stale-fingerprint and shifted-line evidence issue for this audited revision.

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

Fourteen literal paths previously had no explicit method evidence. They are now covered by a centralized allowlist enforced before schema bootstrap and session lookup. Two dynamic resource read families are also explicitly restricted to GET before bootstrap: `/api/novels/{id}` and `/api/chapters/{id}`.
`/api/health`, `/api/taxonomy`, `/api/me`, `/api/config`, `/api/genres`, `/api/tags`, `/api/public-authors`, `/api/sources`, `/api/omni/status`, `/api/omni/search`, `/api/omni/resolve`, `/api/omni/smart-unlock`, `/api/novels`, and `/api/admin/stats`.

Unsupported methods now receive HTTP 405 with an `Allow` header. `/api/taxonomy` allows GET and POST; the other 13 literal paths allow GET only. The two dynamic resource families also return 405 with `Allow: GET`, preventing POST, PATCH, or DELETE requests from triggering read handlers and view-count side effects. This resolves method dispatch for these paths, but does not resolve their authentication or resource-ownership contracts.

### 3. Taxonomy submitter identity required server-side binding

The public taxonomy submission handler previously accepted `creator_id` and `creator_name` directly from the request body. A caller could therefore spoof attribution. The handler now requires an authenticated user for POST submissions and derives both identity fields from the session. GET remains public. A build-gated regression test rejects any return to client-controlled submitter identity.

Status: **source-level remediation implemented; CI verification pending**.

### 4. Authorization signals are not sufficient evidence

The inventory records nearby calls to `need(u)`, `admin(u)`, and `author(u)`. These are useful navigation signals, but they do not prove that every database read or write is scoped to the authenticated account, that an author owns the addressed resource, or that an administrator-only action is correctly guarded.

Dynamic routes need explicit per-operation ownership review, especially author AI projects, author novels/chapters, user records, publishing resources, donations, reports, requests, and connector authorization requests.



### 6. Ten-point rating implementation is owned by the governed migration stack

The canonical 1–10 rating implementation is already developed in PR #195 (`integration/architecture-governance-root-17-70`), not in this audit branch. PR #195 reserves migration `0035_ten_point_ratings.sql` and includes migration `0034_ratings_baseline.sql`, whole-number 1–10 database constraints, legacy 1–5 to even 1–10 conversion with timestamps preserved, aggregate recalculation, the canonical single POST handler, 1–10 API validation, catalog thresholds, reader rating controls, display formatting, and migration/UI/API regression tests. The historical PR #297 migration 0012 is explicitly superseded and must not be revived.

This API audit branch is based on PR #341's ownership stack and does not contain PR #195's reservation or migration. Do not copy migration 0035 into this branch or create a competing migration. Integration order must bring PR #195's governed migration into the canonical base, then rebase/reconcile this audit branch and refresh the route inventory and rating contract tests against the unified source. Until then, this branch's current 1–5 schema/API and duplicate rating POST branch are known unresolved dependencies, not a completed 1–10 implementation.
### 5. Duplicate rating route branch remains present

The inventory records three literal `/api/rating` branch occurrences. Preserve this as a reconciliation item until the GET/POST handlers and any duplicate branch are reviewed together. Do not silently normalize the inventory count.

### 7. Report submission resource references

The authenticated report endpoint previously accepted arbitrary novel_id and chapter_id values without validating their types, existence, or relationship. A malformed or mismatched chapter reference could therefore be stored against an unrelated novel, and a report could be created without identifying any resource.

The handler now requires at least one target, validates supplied identifiers as positive safe integers, verifies the referenced novel/chapter exists, confirms a supplied chapter belongs to the supplied novel, and derives the novel ID from a chapter-only report. Report details are accepted only as bounded plain text (2,000 characters maximum).

Status: **source remediation and build-gated regression assertions added; exact-head CI and live D1 behavior still require verification**.

## Public Omni follow-up completed in the audit branch

- `/api/omni/status`: per-IP limit of 60 requests per 60 seconds; no longer seeds connector registry rows. Seeding moved to authenticated admin connector listing.
- `/api/omni/search`: per-IP limit of 20 requests per 60 seconds; query length capped at 120 characters; only enabled, rights-authorized connectors are searched; outbound fetch timeout remains 7 seconds.
- These controls do not replace edge/WAF controls or bound aggregate concurrency across many IPs. Those remain production review items.

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
- The separate API resource-validation work in PR #336 remains a separate stacked change and must be reconciled before the API foundation is declared complete. The current branch includes source-level method guards and taxonomy identity hardening, but neither is considered validated until CI passes.
