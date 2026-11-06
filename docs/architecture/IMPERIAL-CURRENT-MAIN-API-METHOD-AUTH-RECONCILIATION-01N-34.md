# Imperial Novel — Current Main API Method and Authorization Reconciliation (01N-34)

**Audit date:** 3 November 2026  
**Branch audited:** `main`  
**Source:** `src/index.js`, blob `237f4461135eb77258b7184e361ce9dfd9a140e9`  
**Related baseline:** `IMPERIAL-API-ROUTE-METHOD-AUTHORIZATION-INVENTORY-01N-12.md`  
**Status:** Static source reconciliation. Not a security certification and not a runtime test.

## 1. Executive result

The older API inventory remains a useful checklist, but its source blob differs from current `main`. This document records current-main observations and supersedes older assumptions only where the current source was inspected.

The API dispatcher has route-specific method checks for many write and admin operations, but several read/public handlers match by path alone. There is no single global method allowlist visible at the start of the dispatcher. Consequently, a path-only handler can execute for methods beyond the intended read method unless an inner helper rejects them.

**Important:** this audit does not claim every listed endpoint is exploitable. It identifies missing explicit method constraints and the authorization boundaries that need tests.

## 2. Dispatcher-wide behavior

- API handling is entered through `api(req, env)` for `/api/` paths.
- The health endpoint has an early GET path and a later path-only compatibility branch.
- The dispatcher resolves the current session before most route handling.
- Coarse helpers in this source are `need(u)`, `admin(u)`, and `author(u)`.
- `need(u)` is the signed-in-user gate; `admin(u)` checks the legacy admin role; `author(u)` accepts author/admin roles.
- These helpers do not prove object ownership. Handlers must bind each private row to the authenticated user or verify a valid delegated permission.
- Unmatched paths return JSON 404. Unsupported methods are not consistently converted into 405 responses with an `Allow` header.

## 3. Current-main path-only handlers requiring explicit method review

The following route conditions are visibly matched without `m === ...` in the route condition. They should be constrained to their intended method (usually GET) or delegated to a helper that explicitly enforces methods. Confirm delegated behavior before changing.

| Route | Current source observation | Required contract |
|---|---|---|
| `/api/health` | A path-only compatibility branch exists after the GET fast path | GET only; preserve the fast path semantics |
| `/api/taxonomy` | Delegates directly to `communityTaxonomy(req, env)` | Document and test allowed methods inside helper; return 405 otherwise |
| `/api/me` | Path-only response projection | GET only; no-store; authenticated projection must remain self-only |
| `/api/config` | Path-only public config projection | GET only; never expose secrets or internal configuration |
| `/api/genres` | Path-only catalog read | GET only; public DTO allowlist |
| `/api/tags` | Path-only catalog read | GET only; public DTO allowlist |
| `/api/public-authors` | Path-only aggregate/list handler | GET only; public/published eligibility and bounded query |
| `/api/sources` | Path-only static provider directory | GET only; registry metadata only |
| `/api/omni/status` | Path-only connector status projection | GET only; public-safe fields only |
| `/api/omni/search` | Path-only search handler | GET only; query bounds, abuse controls and rights filtering |
| `/api/omni/resolve` | Path-only URL resolver | GET only; strict URL parsing and SSRF boundary tests |
| `/api/omni/smart-unlock` | Path-only handler with login gate | GET only; user-specific no-store and eligible content only |
| `/api/novels` | Path-only list handler | GET only; pagination/query bounds, public DTO and rights eligibility |
| `/api/novels/:id` | Dynamic path match without method condition | GET only; public DTO allowlist and published/rights predicate |
| `/api/chapters/:id` | Dynamic path match without method condition | GET only; parent novel rights/publication and chapter publication enforced |

The helper-backed `/api/taxonomy` method contract is deliberately marked unresolved here. The source call alone does not prove the helper's method behavior.

## 4. Explicit method patterns observed

The current source visibly constrains many routes with method checks, including:

- Authentication: register/login/logout POST.
- Format registry: GET.
- Chapter unlock and batch unlock: POST.
- Bookmark writes: POST.
- History and library: separate GET and POST handlers.
- Comments: separate GET and POST; comment likes/reports POST.
- Ratings and novel reactions: separate GET and POST.
- Reader notifications: GET and POST for read-state mutation.
- Ticket ledger: GET.
- Recommendations and follows: GET.
- Author application and AI project actions: route-specific GET/POST/PATCH.
- Author novel/chapter creation and editing: route-specific GET/POST/PATCH.
- Admin user, publication, donation, report, ticket, connector and request actions: route-specific GET/POST/PATCH/DELETE as implemented.

This list is illustrative, not exhaustive. The final route registry must preserve exact dynamic patterns and method sets from the handler source.

## 5. Authorization and ownership findings to carry into the registry

### 5.1 Reader-owned data

For history, library, bookmarks, reading position, notifications, follows, ticket ledger, profile and import jobs, the authenticated user ID must be the query/write boundary. Tests must substitute another user's IDs and verify no read, update, delete, export or count leakage.

### 5.2 Creator-owned data

Author routes use the broad author gate, but project, novel and chapter operations also require owner checks. The source includes explicit admin bypasses in some creator-owned operations. This is a policy decision requiring owner-model review, not proof that every administrator should access every creator draft.

### 5.3 Administrator authority

The current `admin(u)` gate is a generic legacy admin-role check. It is not an owner-only permission system. Sensitive actions needing tighter policy include role changes, ticket credits, payment/donation review, connector secrets/configuration, publishing/rights approval, agent execution and moderation data.

### 5.4 Rights eligibility

Current source contains rights allowlist checks in several public and reader paths, but the registry must not assume every public API uses the same predicate. Audit every public novel/chapter projection, reaction/rating mutation, sitemap inclusion and recommendation result against the approved rights states:
`original`, `public_domain`, `licensed`, `authorized`.

### 5.5 Rating scale discrepancy

The current `/api/rating` POST source validates a 1–5 rating. The product requirement recorded in the project direction is a whole-number 1–10 scale. This is a product-contract mismatch requiring coordinated API, database constraint, UI, aggregation, migration and test review. Do not change only the UI or silently reinterpret historical ratings.

## 6. Required route-level test matrix

For every endpoint, record and test:

1. Exact accepted method(s); all other methods return 405 and an accurate `Allow` header.
2. Anonymous, reader, author, administrator and owner identities as applicable.
3. Same-owner versus cross-owner resource identifiers, including nested parent/child IDs.
4. Published, draft, deleted, suspended and rights-ineligible resource states.
5. Request schema, validation, maximum body size and safe error response.
6. Response DTO field allowlist; no accidental `SELECT * ` exposure in public/private projections.
7. Cache behavior: private/personalized data must not be shared-cacheable.
8. CSRF/origin policy for cookie-authenticated mutations.
9. Rate limits, pagination bounds, query budgets and abuse resistance.
10. Idempotency, atomicity and audit events for money-like/ticket and moderation actions.

## 7. Completion disposition

| Work package | Status |
|---|---|
| Current-main source revision pinned | Complete |
| Path-only method gaps identified | Complete for the list in section 3 |
| Coarse role helpers and ownership requirements recorded | Complete as static observations |
| Full exact endpoint-to-method matrix | In progress |
| Full endpoint-to-permission and DTO matrix | In progress |
| Helper/delegated route internals | Pending |
| Route-level automated tests | Pending |
| Browser/API runtime verification | Pending |
| Production deployment | Not performed |

## 8. Safe next actions

1. Add explicit method allowlists to path-only handlers in a focused code change, preserving delegated helper semantics.
2. Add shared method-not-allowed response utility and route tests.
3. Reconcile rating scale with the 1–10 product contract before schema/UI changes.
4. Add owner-vs-admin permission policy tests for creator and sensitive admin routes.
5. Build a generated route manifest from the actual dispatcher and compare it to the human registry in CI.

**No application code, database, secrets, or production deployment were changed by this audit.**
