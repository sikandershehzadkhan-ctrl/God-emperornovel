# Imperial Novel | Phase 01N.2: API, Authorization & Side-Effect Matrix

**Audited ref:** `architecture/phase-01m-screen-blueprint`  
**Status:** Static source classification; not a security certification.  
**Purpose:** Establish the endpoint-level contract required before implementation.

## 1. Guard vocabulary observed

The Worker defines three central guards:
- `need(u)`: requires an authenticated user.
- `admin(u)`: requires `u.role === "admin"`.
- `author(u)`: accepts admin or author.

These are coarse guards. They do not by themselves express granular permissions, resource ownership, staff scope, approval level or separation of duties. Some route handlers call guards inside helper functions or in branches, so this matrix is a first-pass classification, not a substitute for reviewing each full handler and helper.

## 2. Endpoint classification

| Domain | Observed endpoints | First-pass access classification | High-risk notes |
|---|---|---|---|
| Health/config | GET /api/health, GET /api/config | Public | Health output should not leak secrets or infrastructure details |
| Public taxonomy | GET /api/genres, GET /api/tags, GET /api/formats, GET /api/taxonomy | Public read | Taxonomy submissions require moderation before public vocabulary |
| Auth | POST /api/auth/register, POST /api/auth/login, POST /api/auth/logout, GET /api/me | Public auth actions / optional session read | Rate limits, cookie attributes, generic errors, session revocation |
| Catalog | GET /api/novels, GET /api/novels/:id, GET /api/chapters/:id | Public read subject to publication/rights checks | Do not expose drafts or restricted chapters |
| Reading/library | POST /api/bookmark, GET/POST /api/history, GET/POST /api/reading-position, GET/POST /api/library, GET /api/bookmarks | Authenticated owner scope | Verify all IDs against published/access-eligible content; prevent cross-user access |
| Reactions/comments | GET/POST /api/novel-reactions, GET/POST /api/comments, POST /api/comments/like | Inspect handler-specific session/ownership rules | Abuse/rate limits, edit/delete ownership, visibility and moderation |
| Ratings/reports | GET/POST /api/rating, POST /api/comments/report, POST /api/report | Public read / authenticated write | Rating must be integer 1–10; reports contain potentially sensitive evidence |
| Engagement | GET /api/chapter-engagement, GET /api/novel-engagement, GET /api/platform/overview, GET /api/discovery/graph | Public/aggregate read candidate | Verify privacy aggregation and avoid exposing per-user activity |
| Requests/voting | GET/POST /api/requests, GET/POST /api/vote-novels | Authenticated request creation/read; voting requires explicit policy check | Per-user limits, duplicate votes, URL validation, state transitions |
| Following | POST /api/follow, GET /api/follows | Authenticated owner | Public counts must not leak private relationship data |
| Notifications | GET /api/notifications, POST /api/notifications/read | Authenticated owner | Read action currently marks all unread records for that user |
| Commerce | POST /api/donations, GET /api/tickets/ledger, POST /api/payment/webhook | User submission / owner ledger / webhook disabled | Manual verification; no generic webhook auto-credit |
| OmniPortal | GET /api/sources, GET /api/omni/status, GET /api/omni/search, GET /api/omni/resolve | Public discovery surfaces; inspect disclosure | Provider configuration/credentials must never be returned |
| OmniPortal jobs | POST /api/omni/import, GET /api/omni/jobs, GET /api/omni/smart-unlock | Authenticated; owner scope required | Rights authorization and job ownership must be checked server-side |
| Connector authorization | POST /api/connector-authorization-requests | Authenticated | Request must not activate connector rights |
| Creator applications | GET /api/author/applications/me, POST /api/author/applications | Authenticated applicant | Owner-scoped status; rights declaration; avoid exposing private sample work |
| Creator workspace | GET/POST /api/author/novels, GET/POST /api/author/chapters, GET /api/author/analytics | Author/admin candidate | Verify resource ownership on every novel/chapter/project ID |
| AI Author Studio | GET/POST /api/author/ai/projects, project routes, jobs, benchmarks | Authenticated owner/author policy | Provider key server-only; generated output remains draft; enforce quotas |
| Admin | /api/admin/stats, users, agents, publishing, reports, donations, tickets, connectors, requests | Admin guard observed on many handlers | Coarse admin role; sensitive actions need permission-specific scope and audit |
| Taxonomy admin | GET/POST /api/admin/taxonomy | Admin guard | Review decisions must be audited and state-transition checked |
| Publishing admin | /api/admin/publishing/* | Admin guard on observed branches | Publishing decision and rights verification are separate gates |
| Connector admin | /api/admin/connectors, /api/admin/omni/health, authorization review | Admin guard on observed branches | Secrets should be referenced, never echoed; rights evidence and health must be separate |
| Agents | GET /api/agents, GET /api/admin/agents, POST /api/admin/agents/run | Public summary / admin control | Agent invocation must be scoped, rate-limited and audited |

## 3. Routes requiring focused handler review

The following route families need complete branch-by-branch review before any permission matrix is considered complete:
- `/api/novel-reactions`, `/api/comments`, `/api/comments/like`, `/api/rating`: helper/branch behavior must be reviewed for authentication, ownership, spam controls and privacy.
- `/api/author/applications`, `/api/author/ai/*`, `/api/author/novels`, `/api/author/chapters`: inspect the full owner checks, status transitions and role requirements.
- `/api/admin/publishing/chapters(?:/:id)?`: route matching and method branches require explicit method/resource authorization tests.
- `/api/admin/connectors/cleanup`: inspect guard placement and ensure the route cannot mutate connector data without admin authorization.
- `/api/admin/author-applications/:id`: verify reviewer guard and decision constraints.
- `/api/donations`: inspect manual reference validation, duplicate handling and pending state.
- `/api/omni/import`: verify that it creates a request/job only and cannot ingest copyrighted chapter body without separately approved rights.

A route being named under `/api/admin` is not proof it is admin-protected. A UI being hidden is not proof of server-side authorization.

## 4. Required endpoint contract

For every route, the engineering inventory must capture:
1. Stable operation ID and route/method.
2. Public/authenticated/staff/service classification.
3. Required permission and resource scope.
4. Owner relationship and anti-IDOR rule.
5. Request schema, bounds and normalization.
6. Response schema and privacy classification.
7. State transition and allowed source/target states.
8. Side effects and transaction boundaries.
9. Idempotency and concurrency policy.
10. Rate limit and abuse controls.
11. Audit event and failure behavior.
12. Cache policy and data freshness.
13. Error codes and safe recovery behavior.
14. Tests for authorized, unauthorized, cross-owner and malformed cases.

## 5. Permission model proposal

Permissions should be action-specific, not just page-specific. Initial domains:
- `catalog.read_public`, `catalog.manage_metadata`, `catalog.review_rights`;
- `author.apply`, `author.manage_own_work`, `author.collaborate`;
- `publishing.review`, `publishing.approve`, `publishing.unpublish`;
- `community.moderate`, `community.appeal_review`;
- `commerce.read_own_ledger`, `commerce.review_payment`, `commerce.issue_adjustment`;
- `provider.read_health`, `provider.manage_config`, `provider.approve_rights`;
- `security.read_alerts`, `security.manage_incidents`, `security.revoke_sessions`;
- `users.read_limited`, `users.restrict`, `users.manage_roles`;
- `agents.read`, `agents.run`, `agents.manage_policy`;
- `audit.read`, `analytics.read`, `configuration.manage`.

Every permission must be scoped to the minimum resources and fields required. Role-to-permission mapping is a separate artifact. Financial approval, rights approval, role assignment and security incident containment should have separation-of-duty rules.

## 6. Non-negotiable invariants

- Deny by default; check authorization server-side on every read/write.
- Never trust user ID, owner ID, role, price, ticket balance, rights state or approval state supplied by the client.
- Every user-owned resource lookup includes authenticated owner scope unless an explicit staff permission allows otherwise.
- Every admin write validates a state transition and records actor/reason/outcome.
- High-risk audit failure blocks the action or leaves it in a durable pending state.
- Payment callback cannot credit balance until signature, amount, currency, event identity and replay protection are verified.
- Crown balance mutation and ledger insertion must be atomic and idempotent.
- Agent execution uses a narrow allowlist of actions and cannot elevate its own authority.
- Rights approval is separate from provider health and separate from metadata match confidence.
- Private reading history, messages, support content and payment evidence are not public analytics.
- Whole-number ratings from 1 to 10 are validated server-side.

## 7. Test matrix

For every write endpoint:
- no session → 401 where authentication is required;
- wrong role/permission → 403;
- authenticated user accessing another user's ID → 404/403 without data leakage;
- malformed/oversized input → 400/413;
- invalid transition → 409;
- repeated idempotency key → same safe outcome, no duplicate side effect;
- concurrent requests → invariant remains true;
- audit store unavailable → high-risk mutation fails safely;
- stale permission/session → action denied;
- unexpected dependency failure → no partial financial or rights mutation.

Additional focused tests:
- user cannot unlock by forging a client balance or webhook response;
- creator cannot edit another author's novel/chapter by changing numeric ID;
- connector authorization request cannot set connector enabled/authorized directly;
- moderator cannot read financial evidence or change connector secrets;
- an agent cannot perform admin-only actions by passing a slug or trigger value;
- report submitter identity and staff notes remain private;
- ratings reject fractions, zero, values above ten and numeric strings if contract disallows them.

## 8. Completion boundary

This is a first-pass endpoint/guard classification from static source inspection. It is not exhaustive, does not certify all helper-level guards, and is not production-verified. The next step is a full route-by-route source extraction and tests for every write path, followed by the canonical permission matrix.

No source code, schema, user record, role, secret, production setting or deployment was changed.
