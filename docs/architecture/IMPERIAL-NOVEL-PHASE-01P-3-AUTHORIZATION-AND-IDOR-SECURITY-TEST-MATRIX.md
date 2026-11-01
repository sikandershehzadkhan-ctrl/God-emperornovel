# Imperial Novel | Phase 01P.3: Authorization, Ownership and IDOR Security Test Matrix

**Audited source ref:** `architecture/phase-01m-screen-blueprint`  
**Source:** `src/index.js` (source blob `13874ee0fde4e31e04a652c5169776c3b6f95c38` at review).  
**Status:** Test specification derived from static inspection. **No tests in this document have been executed.**

## 1. Test execution rules

- Use isolated test databases and synthetic users. Never run destructive authorization tests against production.
- Create at minimum: reader A, reader B, author A, author B, moderator, admin A, admin B; create owned resources for A and B.
- Assert both HTTP status and absence of unauthorized data/side effects.
- Record request ID, response, DB before/after state, audit row and test artifact.
- Do not use real passwords, payment evidence, personal data, connector secrets or licensed chapter text.
- A passing UI test does not count. Tests must call the API directly with forged IDs, bodies and methods.

Priority: **P0** blocks production security approval; **P1** required before broad staff/commerce launch; **P2** hardening and regression.

## 2. Source-confirmed authorization observations

| Area | Current source evidence | Test implication |
|---|---|---|
| Session identity | `need(u)`, `admin(u)`, `author(u)` are coarse guards | Exercise every route and every method with absent, stale and wrong-role sessions |
| Reader-owned data | History, bookmarks, reading position, library, follows, notifications, ledger and Omni jobs bind queries to `u.id` in observed handlers | Verify request-supplied owner IDs cannot override session identity |
| Author-owned data | Author AI project routes and author novel/chapter routes have dedicated handlers; owner enforcement must be verified for each dynamic ID | Cross-author IDOR tests for every project, novel and chapter operation |
| Admin user mutation | `PATCH /api/admin/users/:id` allows four role values and changes verified/banned flags under `admin(u)` | P0: test privilege escalation, last-admin safety, self-demotion, target-not-found and audit |
| Financial adjustment | `POST /api/admin/tickets` changes ticket balance and ledger under a single admin guard | P0: require dual-control target; test concurrent, duplicate and invalid account operations |
| Donation approval | `PATCH /api/admin/donations/:id` processes pending donation and ticket credit | P0: concurrency, duplicate approval, exact amount and ledger atomicity |
| Payment callback | `POST /api/payment/webhook` currently returns 503 disabled | Verify it never credits tickets under any payload until verified integration exists |
| Provider/rights | Connector create/update and rights-request review use admin guard; connector authorization request is authenticated | P0: test provider config cannot imply rights approval; requester cannot approve own request |
| Publishing | Admin publishing routes use admin guard; publication status and rights states are checked in observed handlers | P0: verify rights evidence, ownership, chapter parent and valid state transitions |
| Moderation | Admin comment/report review uses admin guard and writes audit rows in observed branches | Verify role scoping, audit atomicity, and report privacy |
| Agent execution | Admin agent run uses admin guard; public agent listing is separate | Verify arbitrary slug cannot invoke privileged/unregistered actions |

## 3. P0: account, role and privilege boundaries

| ID | Operation | Test setup / attack | Expected result |
|---|---|---|---|
| AUTH-001 | Any protected route | No session cookie | 401; no DB mutation |
| AUTH-002 | Any protected route | Expired, revoked or malformed session | 401; no cached identity accepted |
| AUTH-003 | Admin routes | Reader or author calls admin endpoint directly | 403; no data leakage or mutation |
| AUTH-004 | Author routes | Reader without author entitlement calls create/edit route | 403 |
| AUTH-005 | `PATCH /api/admin/users/:id` | Reader calls with role=admin | 403 |
| AUTH-006 | `PATCH /api/admin/users/:id` | Admin A tries to grant self/another user admin | Target: separate role-grant permission, step-up authentication, reason and independent approval |
| AUTH-007 | `PATCH /api/admin/users/:id` | Admin changes another admin's role; last-admin edge case | Target: protected last-admin invariant and dual approval |
| AUTH-008 | `PATCH /api/admin/users/:id` | Unknown user ID | 404; no success-shaped response |
| AUTH-009 | `PATCH /api/admin/users/:id` | Client submits unexpected role, verified or banned values/types | 400; no partial update |
| AUTH-010 | Any staff write | Actor's role revoked between page load and API call | Fresh server authorization denies action |

## 4. P0: ownership and IDOR tests

| ID | Operation | Attack | Expected result |
|---|---|---|---|
| IDOR-001 | `GET /api/history`, `POST /api/history` | Supply `user_id=B` while logged in as A | Only A's rows change/return; supplied owner ignored |
| IDOR-002 | `GET/POST /api/reading-position` | Forge B's ID or chapter from a different novel | Only A's progress; mismatched chapter/novel rejected |
| IDOR-003 | `GET /api/library`, `POST /api/library` | Forge owner ID or another user's collection key | Only A's collection affected |
| IDOR-004 | `GET /api/bookmarks`, `POST /api/bookmark` | Attempt to read/overwrite B's bookmark | Only A's bookmark affected |
| IDOR-005 | `GET /api/follows`, `POST /api/follow` | Forge user ID or target unpublished novel | Only A's follows; unpublished target rejected |
| IDOR-006 | `GET /api/notifications`, `POST /api/notifications/read` | Supply another user's notification ID/user ID | Only A's notifications can be read/marked |
| IDOR-007 | `GET /api/tickets/ledger` | Supply arbitrary user ID | Only A's ledger returned |
| IDOR-008 | `GET /api/omni/jobs` | Add user_id=B query parameter | Only A's jobs returned |
| IDOR-009 | Author AI project read/update/delete/run | Replace project ID with B's project ID | 404/403; no read, edit, deletion, job or provider call |
| IDOR-010 | Author novel update/delete | Replace novel ID with B's novel ID | 404/403; no mutation |
| IDOR-011 | Author chapter update/delete | Use B's chapter ID or A's novel with B's chapter | 404/403; parent ownership validated |
| IDOR-012 | Admin publishing chapter operations | Chapter ID belongs to a different parent than supplied novel | Reject; no reorder or publication side effect |

## 5. P0: commerce, balance and transaction invariants

| ID | Operation | Attack / race | Expected result |
|---|---|---|---|
| FIN-001 | Chapter unlock | Forge ticket balance or price in request | Server-calculated cost and stored balance govern |
| FIN-002 | Chapter unlock | Repeat same unlock concurrently | One debit and one unlock record only |
| FIN-003 | Batch unlock | Invalid size, negative start, cross-novel chapter IDs | 400/404; no debit |
| FIN-004 | Donation submission | Duplicate normalized payment reference | One pending claim; no ticket credit |
| FIN-005 | Donation approval | Two admins approve same pending donation concurrently | One state transition and one credit/ledger event |
| FIN-006 | Donation approval | Amount/user/ticket fields forged by reviewer request | Server-validated decision only; exact ledger reconciliation |
| FIN-007 | Donation rejection | Repeat rejection or approve after rejection | 409/no duplicate refund or credit |
| FIN-008 | `POST /api/payment/webhook` | Send forged signature/event/amount payload | Current expected 503; zero ticket/ledger changes |
| FIN-009 | `POST /api/admin/tickets` | Duplicate request, invalid user, huge amount, negative amount | Target: approval workflow; bounded values; idempotency; audit |
| FIN-010 | Admin request rejection/refund | Concurrent PATCH status and repeated rejection | One pending-to-rejected transition and one refund |
| FIN-011 | Ledger consistency | Force ledger insert failure during balance adjustment | Entire operation rolls back or enters recoverable pending state; never silent balance-only mutation |

## 6. P0: publishing, rights and OmniPortal boundaries

| ID | Operation | Attack | Expected result |
|---|---|---|---|
| RIGHTS-001 | `PATCH /api/admin/publishing/novels/:id` | Publish with missing/ineligible rights evidence | 400/403; remains unpublished |
| RIGHTS-002 | Publishing novel/chapter | Author attempts to approve own submission | Denied; independent reviewer required |
| RIGHTS-003 | Publishing chapter | Chapter's novel has ineligible rights state | Denied; no published chapter |
| RIGHTS-004 | `POST /api/connector-authorization-requests` | Submit request with metadata_import_allowed=true | Remains pending; no connector activation |
| RIGHTS-005 | Admin connector authorization review | Requester reviews own request | Target: deny conflict of interest |
| RIGHTS-006 | `PATCH /api/admin/connectors` | Enable connector without evidence/terms or with unallowlisted URL | 400; connector remains disabled |
| RIGHTS-007 | Connector admin GET | Attempt to retrieve secret/header values | Target: never return secret material; expose only configured/not-configured status |
| RIGHTS-008 | Omni import | Provider is disabled, unapproved or metadata import disallowed | 409; no import job/body ingestion |
| RIGHTS-009 | Omni resolve/search | Supply localhost, private IP, credential URL, custom port or redirect to private host | Reject; no SSRF or secret leakage |
| RIGHTS-010 | Rights state | Provider health succeeds but rights are unapproved | Search/import remains disabled |

## 7. P1: community, moderation, privacy and automation

| ID | Operation | Attack | Expected result |
|---|---|---|---|
| MOD-001 | Comment create/edit/delete | User A edits/deletes B's comment by changing ID | Denied unless assigned moderation permission |
| MOD-002 | Comment/report review | Moderator without finance/provider permission calls donation or connector routes | 403 |
| MOD-003 | Report create | Report references nonexistent or unrelated chapter/novel | 400/404; no orphan report |
| MOD-004 | Report review | Change status from terminal state or race two reviewers | Valid transitions only; durable audit |
| MOD-005 | Rating create | Submit 0, 11, fractional or malformed rating | Reject; only whole number 1–10 |
| MOD-006 | Reactions/votes | Submit repeated requests concurrently | Unique per-user rule enforced; no inflated counts |
| PRIV-001 | Public engagement/overview | Probe small cohorts or user-level data | Aggregate-only output; no private reading history |
| PRIV-002 | Profile/author analytics | Reader requests another author's metrics | Denied or only public aggregate |
| AUTO-001 | `POST /api/admin/agents/run` | Supply arbitrary slug, unknown slug or cross-scope task | Allowlist and permission check; no privilege escalation |
| AUTO-002 | Agent execution | Agent attempts role, rights, payment or secret mutation | Denied unless narrowly delegated, separately approved capability |
| AUTO-003 | Agent execution | Duplicate/replayed run request | Idempotent run key; bounded concurrency and audit |

## 8. P2: input, abuse and operational hardening

- Fuzz every JSON body for missing, null, wrong type, oversized strings, deeply nested values and unexpected properties.
- Verify per-route request size limits and rate limits, not just registration/login limits.
- Verify CORS, CSRF posture, cookie attributes, session rotation and logout revocation.
- Test cache headers on private responses; user A must never receive user B's cached payload.
- Test all methods not explicitly supported; unsupported methods must return 405/404 and must not fall through to another handler.
- Test SQL uniqueness and foreign-key behavior under concurrent create/delete operations.
- Test safe error responses; no stack traces, SQL fragments, secrets or provider response bodies.
- Test audit log unavailability for high-risk operations; action must fail closed or remain pending.
- Test account states: unverified, restricted, suspended, banned, deletion-pending and deleted/anonymized.

## 9. Required test harness and evidence

The test suite must provide:
1. Isolated D1-compatible fixture setup and teardown.
2. Synthetic user/role/resource factory.
3. API request helper that can swap cookies and forge request bodies.
4. DB snapshots before/after high-risk calls.
5. Concurrency runner for unlock, payment approval and refunds.
6. Audit assertion helper.
7. Test report with pass/fail/skipped and source commit SHA.
8. CI gate that fails closed when P0 tests are missing or skipped.

## 10. Findings that must be resolved before implementation approval

- Existing user PATCH combines role and account-state mutation under one admin guard.
- Existing ticket credit is a single-admin initiated adjustment, not a two-person approval workflow.
- Existing moderation is admin-only in inspected handlers; scoped moderator permissions are not implemented.
- Existing admin connector GET selects `auth_header` and `secret_name`; confirm response redaction before allowing broader staff access.
- Existing route inventory is still not one normalized operation per row; helper-dispatched methods require extraction.
- Existing audit coverage varies by handler; confirm every high-risk mutation and failure path.
- No production payment webhook should be enabled until provider-specific cryptographic verification and replay protection are implemented and tested.

## 11. Completion status

**Specification committed; execution pending.** No tests were run as part of this architecture task. No application source, schema, user roles, production records, secrets, Worker configuration, branch merge or deployment was changed.
