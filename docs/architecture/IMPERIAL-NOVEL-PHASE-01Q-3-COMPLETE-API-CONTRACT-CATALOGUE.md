# Imperial Novel | Phase 01Q.3: Complete API Contract Catalogue

**Branch:** `architecture/phase-01m-screen-blueprint`  
**Review date:** 2026-11-01  
**Status:** Architecture contract and source-grounded inventory; not an implementation claim.  
**Source inspected:** `src/index.js` at the architecture branch, plus Phase 01P.1 and 01P.2.  
**Safety boundary:** No application code, database, production data, secrets, Worker settings or deployment changed.

## 1. Purpose and evidence rules

This catalogue defines the contract required for Imperial Novel's API surface and records what can currently be established from source inspection.

Three labels are used throughout:

- **OBSERVED**: the route predicate, method, guard or response behavior is visible in the inspected source.
- **TARGET**: the desired contract for the complete platform. This is a design requirement, not proof of implementation.
- **VERIFY**: source inspection did not establish the complete schema, all branches, transaction semantics or production behavior. Tests or deeper handler review are required.

A route predicate in the dispatcher is not automatically a complete endpoint contract. Some paths dispatch to helper functions; dynamic routes are matched by regular expressions; some methods are implicit; and authorization may be enforced inside a helper. Absence of a visible guard at the predicate is not proof that the operation is public.

## 2. Global contract

### 2.1 Request and response conventions

**OBSERVED**
- The Worker dispatcher handles API requests under `/api/*`.
- The shared JSON response helper emits `application/json;charset=UTF-8` and `cache-control: no-store`.
- Request JSON parsing falls back to an empty object on parse failure in the shared body helper.
- Health has a dedicated early path before the normal schema bootstrap and session lookup.
- Login creates a session token, stores its hash and sets an HttpOnly, Secure, SameSite=Lax cookie.
- Authentication rate limits are applied to registration and login.

**TARGET**
- Every operation declares accepted content types, maximum body size, strict JSON parsing, validation schema and response envelope.
- Reject malformed JSON with a stable 400 response rather than silently converting malformed bodies into empty objects.
- Use a consistent error object: `{ error: { code, message, request_id, details? } }`; do not expose SQL, stack traces, secrets or internal hostnames.
- Use stable success envelopes and explicit status codes. Keep backward compatibility deliberate and versioned.
- Every request receives a correlation/request ID propagated to logs, audit events and asynchronous jobs.
- Use UTC ISO-8601 timestamps in API payloads. Define whether values are seconds, integer counts, minor currency units or decimal amounts.
- Never trust user IDs, roles, ownership IDs, ticket balances or approval states supplied by the client.

### 2.2 Authentication and authorization

**OBSERVED**
- Current coarse guards include `need(u)`, `author(u)` and `admin(u)`.
- `admin(u)` checks the current role value; this is not granular RBAC/ABAC.
- Some author and AI handlers perform explicit owner checks after loading the target resource.
- User administration currently accepts the roles `user`, `author`, `moderator` and `admin` in a guarded PATCH path.

**TARGET**
- Deny by default. Each operation must declare authentication, account-state gate, permission, resource scope and staff assignment scope.
- Resolve the actor from the authenticated session only.
- Check ownership on every read, write, export, delete, job lookup and nested resource operation.
- Staff access must be scoped, time-limited where appropriate, audited and separated by duty.
- Sensitive operations require recent authentication or step-up verification.
- Never allow self-approval of rights, finance, role escalation or security-sensitive access requests.
- Keep account state separate from role: active, email_unverified, restricted, suspended, banned, deletion_pending and deleted/anonymized.

### 2.3 Cross-cutting protections

Every mutating operation must define:
- CSRF strategy for cookie-authenticated requests; SameSite alone is not the complete policy.
- CORS allowlist and credential policy; no wildcard origin with credentials.
- Rate limit key, limit, time window and retry behavior.
- Idempotency key requirements for payments, ticket changes, unlocks, imports, publishing and job creation.
- Cache policy. Private/user-specific responses are no-store; public cacheable data must have explicit freshness and invalidation rules.
- Audit event, actor, target, reason, timestamp and correlation ID.
- Transaction boundary and concurrency strategy.
- Error codes and retryability.
- Data classification and retention rules.

## 3. Source-grounded route inventory

This section records route families and method evidence visible in the dispatcher inventory. It deliberately does not invent a request schema where the complete handler contract has not been extracted.

| Domain | Source-observed route(s) | Method evidence | Contract status |
|---|---|---|---|
| Health | `/api/health` | GET and a fallback path predicate | OBSERVED; response includes service/version/database/time |
| Agents | `/api/agents`, `/api/admin/agents`, `/api/admin/agents/run` | GET, GET, POST | OBSERVED; admin guard visible on admin routes |
| Taxonomy | `/api/taxonomy`, `/api/admin/taxonomy` | helper dispatch; GET; POST | OBSERVED route family; helper contract needs extraction |
| Identity | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/me` | POST, POST, POST, method not constrained in predicate | OBSERVED; registration/login validation and session cookie visible |
| Public configuration | `/api/config`, `/api/genres`, `/api/tags`, `/api/formats`, `/api/public-authors` | GET or method-agnostic predicates | OBSERVED |
| OmniPortal | `/api/sources`, `/api/omni/status`, `/api/omni/search`, `/api/omni/resolve`, `/api/omni/import`, `/api/omni/jobs`, `/api/omni/smart-unlock` | GET/helper, POST, GET | OBSERVED; import and jobs visibly require authentication |
| Engagement | `/api/chapter-engagement`, `/api/novel-engagement` | GET | OBSERVED; request-time D1 metrics and definitions visible |
| Platform analytics | `/api/platform/overview`, `/api/discovery/graph` | GET | OBSERVED |
| Catalog | `/api/novels`, dynamic novel/chapter routes | helper and dynamic predicates | VERIFY each method, publication gate and rights gate |
| Reading/library | bookmark, history, reading-position, library, bookmarks | POST/GET as indexed | OBSERVED; authenticated guards visible on listed reader-owned routes |
| Community | novel-reactions, comments, comment like/report, rating | GET/POST as indexed | OBSERVED; some guards are inside handlers or not visible at predicate |
| Commerce | `/api/donations`, `/api/payment/webhook`, `/api/tickets/ledger`, admin donations/tickets | POST/GET/PATCH as indexed | OBSERVED route family; live merchant integration not established |
| Social | requests, follow/follows, leaderboard, tier-list, random, made-for-you, vote-novels | GET/POST as indexed | OBSERVED |
| Notifications | notifications, notifications/read, report | GET/POST | OBSERVED; authentication guard visible on notifications |
| Author applications | author/applications/me, author/applications, admin/author-applications | GET/POST and admin helper | OBSERVED route family; full decision handler must be checked |
| Author Studio | author/ai/status, projects, project ID, blueprint, run, jobs, benchmarks | GET/POST/PATCH as indexed | OBSERVED; author guard and explicit project-owner checks visible in inspected handlers |
| Author publishing | author/analytics, author/novels, author/chapters and dynamic item routes | GET/POST/PATCH as indexed | OBSERVED route family; helper/owner contract requires exhaustive extraction |
| Admin operations | admin/stats, users, publishing, community, reports, connectors, omni health, requests | GET/POST/PATCH as indexed | OBSERVED; most use coarse admin guard; some helper-dispatched routes need verification |
| Connector rights | connector-authorization-requests, admin review routes | POST/GET/PATCH as indexed | OBSERVED; authorization and approval workflow needs route-by-route verification |

**Important inventory limitation:** Phase 01P.2 is a predicate-line index, not a normalized endpoint registry. It records dynamic/helper entries where exact route templates are not safely inferred from the predicate index alone. Before implementation, every route must be extracted into one row per method and normalized path, including aliases, nested conditions and helper dispatches.

## 4. Operation contract template

Every operation must have a completed record with the following fields. Unknown fields remain explicitly marked VERIFY until proven from source or an approved product decision.

| Field | Required content |
|---|---|
| Operation ID | Stable identifier, e.g. `identity.session.login` |
| Domain | Identity, catalog, reader, community, author, commerce, OmniPortal, operations |
| Method + path | Exact HTTP method and canonical route template |
| Evidence | OBSERVED source lines or TARGET proposal |
| Audience | Anonymous, authenticated user, author, assigned staff, admin service |
| Authentication | Session/token requirement and session freshness |
| Account state | Permitted states and denial behavior |
| Permission | Current coarse guard plus target granular permission |
| Resource scope | Own resource, public resource, assigned queue or global |
| Request | Path/query/body schema, types, bounds, enums, unknown-field policy |
| Response | Statuses, JSON schema, pagination, timestamp and numeric semantics |
| Data classification | Public, internal, personal, sensitive, financial, secret |
| Database | Tables read/written and required indexes |
| Transaction | Atomic writes, compare-and-set and rollback/compensation behavior |
| Side effects | Notifications, events, jobs, provider calls and cache invalidation |
| Audit | Event name, actor, target, reason, before/after policy |
| Abuse controls | Rate limits, quotas, idempotency, bot controls |
| Browser controls | CSRF, CORS, cache, cookie and content-security constraints |
| Errors | Stable error codes, HTTP status and retryability |
| Tests | Positive, anonymous, wrong-role, cross-owner, invalid-input, replay, race and leakage tests |

## 5. Canonical target contracts by domain

The following are target contracts. Exact payload schemas must be derived from handlers and product decisions before implementation.

### 5.1 Identity and account

| Operation ID | Target method/path | Access and invariants | Required tests |
|---|---|---|---|
| `identity.register` | POST `/api/auth/register` | Anonymous; server assigns default role/state; validate username/email/password; rate-limit and generic duplicate behavior | invalid fields, duplicate, rate limit, role injection |
| `identity.session.login` | POST `/api/auth/login` | Anonymous; generic credential failure; account-state check; rotate secure session; bounded attempts | wrong password, banned/suspended user, session fixation, replay |
| `identity.session.logout` | POST `/api/auth/logout` | Revoke caller session; idempotent; clear cookie | missing/expired cookie, other-session isolation |
| `identity.profile.read_own` | GET `/api/me` | Caller-only minimal identity; no private account leakage | anonymous response, session expiry, role-field exposure |

Observed registration validation includes username 3-24 characters using letters/numbers/underscore, a basic email presence check and password length 8-1024. These are source facts, not a claim that this is the final recommended validation policy.

### 5.2 Catalog and reading

| Operation ID | Target route | Access and invariants |
|---|---|---|
| `catalog.novel.list_public` | GET `/api/novels` | Published and rights-eligible records only; bounded filters/sort/page |
| `catalog.novel.read_public` | GET `/api/novels/{novelId}` | Same publication/rights gate; public fields only |
| `reader.chapter.read` | GET `/api/chapters/{chapterId}` | Parent novel and chapter both eligible; locked body withheld unless unlock policy grants access |
| `commerce.chapter.unlock_own` | POST `/api/chapters/{chapterId}/unlock` | Authenticated; atomic ticket debit, immutable ledger and unlock; idempotent; no negative balance |
| `reader.progress.read_own` | GET `/api/reading-position` | Session-derived owner; validate novel/chapter relationship |
| `reader.progress.write_own` | POST `/api/reading-position` | Session-derived owner; monotonic/defined progress semantics; bounded write frequency |
| `library.history.read_own` | GET `/api/history` | Caller-only; retention and deletion behavior defined |
| `library.history.write_own` | POST `/api/history` | Caller-only; server derives user ID |
| `library.bookmark.manage_own` | POST `/api/bookmark` | Caller-only; unique relationship and idempotent add/remove semantics |
| `library.collection.manage_own` | GET/POST `/api/library` | Collection and membership ownership checked on every operation |

### 5.3 Community and reputation

| Operation ID | Target route | Access and invariants |
|---|---|---|
| `community.comment.read_public` | GET `/api/comments` | Only visible comments for eligible public parent |
| `community.comment.create` | POST `/api/comments` | Authenticated; caller is author; length, rate and abuse checks |
| `community.comment.like` | POST `/api/comments/like` | Caller-derived identity; unique user/comment reaction |
| `community.comment.report` | POST `/api/comments/report` | Authenticated; private report evidence; dedupe/rate limit |
| `community.rating.create` | POST `/api/rating` | Whole integer 1-10; one active rating per user/work; abuse controls |
| `community.rating.read_public` | GET `/api/rating` | Aggregate/public-safe rating data; no private voter identity |
| `community.novel_reaction.manage_own` | POST `/api/novel-reactions` | Session-derived identity; one active reaction per user/work |
| `community.report.create` | POST `/api/report` | Authenticated; validated target; private case evidence |

### 5.4 Author Studio and publishing

| Operation ID | Target route | Access and invariants |
|---|---|---|
| `author.application.create` | POST `/api/author/applications` | Authenticated applicant; server-derived user; rights declaration |
| `author.application.read_own` | GET `/api/author/applications/me` | Caller-only application and status |
| `author.work.list_own` | GET `/api/author/novels` | Owner-scoped list |
| `author.work.create_own` | POST `/api/author/novels` | Server assigns owner; rights declaration; draft by default |
| `author.chapter.create_own` | POST `/api/author/chapters` | Parent novel ownership checked; draft by default |
| `author.work.update_own` | PATCH `/api/author/novels/{novelId}` | Recheck ownership and publication state |
| `author.chapter.update_own` | PATCH `/api/author/chapters/{chapterId}` | Resolve parent and recheck ownership |
| `author.analytics.read_own` | GET `/api/author/analytics` | Owner-filtered metrics; explicitly distinguish requests, unique readers, reader ticket spend and author earnings |
| `author.ai.project.manage_own` | GET/POST/PATCH `/api/author/ai/projects` | Author access; project owner check; provider key server-only; quotas |
| `author.ai.job.run_own` | POST `/api/author/ai/projects/{projectId}/run` | Owner check; idempotent job creation; generated work remains draft; never auto-publish |

### 5.5 OmniPortal and rights

| Operation ID | Target route | Access and invariants |
|---|---|---|
| `omni.directory.read_public` | GET `/api/sources`, `/api/omni/status` | Public metadata only; never expose credentials |
| `omni.search.public` | GET `/api/omni/search` | Local search plus explicitly enabled, allowlisted, rights-authorized providers only |
| `omni.source.resolve` | GET `/api/omni/resolve` | Validate supported host; defend against SSRF and redirects |
| `omni.import.request` | POST `/api/omni/import` | Authenticated; explicit metadata-import permission; owner-scoped job; no chapter-body ingestion without separate rights |
| `omni.job.read_own` | GET `/api/omni/jobs` | Caller-only jobs; no arbitrary user filter |
| `omni.rights.request` | POST `/api/connector-authorization-requests` | User submits evidence only; cannot self-authorize provider |
| `rights.review` | GET/PATCH admin authorization-request routes | Assigned reviewer; conflict-of-interest and separation-of-duty controls |
| `provider.health.run` | POST `/api/admin/omni/health` | Allowlisted probe only; bounded timeout, rate limit and audit |

### 5.6 Commerce and finance

| Operation ID | Target route | Access and invariants |
|---|---|---|
| `commerce.payment.submit_own` | POST `/api/donations` | Caller-owned pending request; duplicate reference detection; no ticket credit on submission |
| `commerce.ledger.read_own` | GET `/api/tickets/ledger` | Session-derived user; immutable ledger view |
| `commerce.payment.webhook.receive` | POST `/api/payment/webhook` | Disabled until verified merchant integration, signature validation, replay protection and reconciliation are implemented |
| `commerce.payment.review_queue.read` | GET `/api/admin/donations` | Assigned finance role; minimize exposure of payment evidence |
| `commerce.payment.approve` | PATCH `/api/admin/donations/{donationId}` | Pending-only compare-and-set; independent approver; atomic ticket+ledger+audit |
| `commerce.payment.reject` | PATCH `/api/admin/donations/{donationId}` | Reason required; no ticket credit; immutable decision audit |
| `commerce.adjustment.initiate` | POST `/api/admin/tickets` | Operator proposes; separate approver posts; reason and case reference required |

Ticket packs may be offered at PKR 10/25/50/100 only after a legitimate merchant integration and reconciliation process are approved. A displayed pack is not proof that payment is enabled.

### 5.7 Staff, governance and operations

| Operation ID | Target route | Target permission/control |
|---|---|---|
| `identity.user.read_scoped` | GET `/api/admin/users` | `identity.user.read_scoped`; minimize fields and paginate |
| `identity.user.manage` | PATCH `/api/admin/users/{userId}` | No free-form privilege escalation; approval workflow, reason, last-admin protection |
| `operations.agent.read` | GET `/api/admin/agents` | Safe metadata only |
| `operations.jobs.run_allowlisted` | POST `/api/admin/agents/run` | Allowlisted task, bounded scope, dry-run where available, audit |
| `catalog.taxonomy.review` | GET/POST/PATCH admin taxonomy routes | Assigned queue and explicit state transitions |
| `community.moderation.review` | GET/PATCH admin community routes | Case assignment, evidence privacy, reasoned action and appeal path |
| `analytics.admin.read` | GET `/api/admin/stats` | Aggregate metrics; finance details separately permissioned |
| `publishing.review` | Admin publishing routes | Assigned editor/publishing manager; rights evidence and immutable review history |
| `provider.config.manage` | GET/PATCH/POST admin connector routes | Secret values never returned; allowlisted host and verified rights required |

## 6. Pagination, filtering and sorting standard

**TARGET**
- Use cursor pagination for large/changing feeds; offset pagination only for bounded administrative lists where stable ordering is guaranteed.
- Maximum page size: 100 public records and 200 staff records unless a reviewed performance test justifies another bound.
- Every paginated response includes `items`, `next_cursor` and `has_more`; do not return unbounded arrays.
- Sort fields are allowlisted; direction is enum `asc|desc`; tie-break with a stable unique key.
- Search queries have minimum/maximum length, normalization, rate limits and explicit supported filters.
- Never accept raw SQL fragments, arbitrary column names or unvalidated sort expressions.

## 7. Data classification and response rules

| Classification | Examples | API rule |
|---|---|---|
| Public | Published novel metadata, public author profile, public taxonomy | Exclude drafts, private contact details and rights evidence |
| Internal | Operational status, job metadata, aggregate analytics | Staff or safe aggregate only |
| Personal | Email, reading history, bookmarks, notifications, application data | Own-account scope; export/delete policy |
| Sensitive | Moderation evidence, identity verification, rights documents | Narrow assigned access, audit every read/write |
| Financial | Donation references, ticket ledger, approval decisions | Finance permissions, separation of duties, immutable ledger |
| Secret | Provider API keys, session tokens, webhook secrets | Never serialize to client; managed secret storage only |

## 8. Required error catalogue

| HTTP | Stable code | Meaning | Retry |
|---:|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid path/query/body field | No, correct input |
| 401 | `AUTHENTICATION_REQUIRED` | Missing/expired session | After sign-in |
| 403 | `PERMISSION_DENIED` | Authenticated but not authorized | No |
| 404 | `RESOURCE_NOT_FOUND` | Missing or intentionally concealed resource | No |
| 409 | `STATE_CONFLICT` | Invalid transition, duplicate or stale update | Only after refresh |
| 410 | `RESOURCE_GONE` | Deleted/expired resource | No |
| 413 | `PAYLOAD_TOO_LARGE` | Body exceeds operation limit | No |
| 422 | `POLICY_REJECTED` | Rights, publication or domain policy failure | No |
| 429 | `RATE_LIMITED` | Abuse/quota threshold reached | After Retry-After |
| 500 | `INTERNAL_ERROR` | Unexpected server error | Maybe; request ID required |
| 502 | `UPSTREAM_FAILURE` | Provider failure or invalid upstream response | Maybe |
| 503 | `FEATURE_UNAVAILABLE` | Integration/provider not configured or disabled | After configuration |

The exact mapping from current handlers to this catalogue must be verified before changing client behavior.

## 9. Security and correctness test matrix

Every operation must receive applicable tests from this matrix:

| Test ID | Scenario | Expected result |
|---|---|---|
| API-AUTH-001 | Anonymous call to authenticated operation | 401; no side effect |
| API-AUTH-002 | Authenticated user calls staff-only operation | 403; audit security event where appropriate |
| API-OWN-001 | User A reads User B resource by changing ID | 404/403 according to disclosure policy; no data leakage |
| API-OWN-002 | User A updates User B resource | Denied; database unchanged |
| API-ROLE-001 | Client submits `role=admin` during registration/profile update | Rejected/ignored; no privilege change |
| API-STATE-001 | Suspended/banned/deletion-pending account calls protected route | Denied according to account-state policy |
| API-INPUT-001 | Malformed JSON, oversized body, unknown fields and invalid types | Stable validation response; no side effect |
| API-RATE-001 | Burst beyond configured limit | 429 with Retry-After |
| API-IDEM-001 | Same idempotency key replayed | Exactly one durable effect |
| API-RACE-001 | Two simultaneous unlock/payment approvals | No double debit/credit; one valid transition |
| API-CSRF-001 | Cross-site cookie-authenticated mutation | Rejected |
| API-CORS-001 | Untrusted origin with credentials | No permissive CORS response |
| API-CACHE-001 | Shared cache attempts to reuse private response | Private response is not cached/shared |
| API-AUDIT-001 | Sensitive staff action without reason/correlation ID | Rejected or audit-required workflow |
| API-LEAK-001 | Error path or response serialization includes secrets/internal data | Test fails; no secret exposure |
| API-RIGHTS-001 | Unlicensed/unapproved work or provider import | Denied; no ingestion/publishing |
| API-FIN-001 | Duplicate payment callback or replay | No duplicate credit |
| API-FIN-002 | Same staff member initiates and approves restricted financial action | Denied |
| API-PUB-001 | Draft/unreviewed chapter requested publicly | Not exposed |
| API-REALTIME-001 | Engagement metrics displayed as unique/online readers without evidence | Contract/test failure |

## 10. Open extraction tasks

The following are mandatory before this catalogue can be called mechanically exhaustive:

1. Convert the full dispatcher into one normalized record per method/path, including nested conditions and dynamic route patterns.
2. Resolve every helper-dispatched handler and record its internal authentication, owner checks and side effects.
3. Capture exact request field names, types, limits, defaults and unknown-field behavior for every mutation.
4. Capture exact response schemas and status codes for every success/error branch.
5. Map each operation to concrete D1 tables, SQL statements, transaction/batch boundaries and indexes.
6. Record rate-limit coverage, idempotency behavior, CSRF/CORS and cache policy per operation.
7. Add source line ranges and stable operation IDs to a machine-readable route registry.
8. Generate positive, negative, cross-owner, replay, concurrency and privacy tests from that registry.
9. Compare client API calls against the registry to detect orphaned routes and undocumented operations.
10. Verify the resulting contracts against clean-install and upgrade database fixtures, without using production data as a test fixture.

## 11. Exit criteria

Phase 01Q.3 is ready for implementation planning only when:
- every actual route and method is normalized and source-linked;
- observed behavior and target behavior are clearly separated;
- every request/response schema is explicit;
- every operation has a permission and ownership predicate;
- every side effect has a transaction/idempotency/audit contract;
- all sensitive data has a classification and access rule;
- tests cover anonymous, wrong-role, cross-owner, replay, race and leakage cases;
- client and server route registries agree.

**Current decision:** This document establishes the complete contract framework and domain-level target catalogue. It does not claim exhaustive route extraction or production verification. Continue with source-level operation normalization and contract tests before implementing granular permissions or changing runtime handlers.
