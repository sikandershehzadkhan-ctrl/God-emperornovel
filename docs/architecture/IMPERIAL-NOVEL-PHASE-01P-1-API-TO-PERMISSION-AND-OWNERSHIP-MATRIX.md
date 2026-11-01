# Imperial Novel | Phase 01P.1: API-to-Permission & Ownership Matrix

**Review date:** 2026-11-01  
**Audited source:** `src/index.js` and Phase 01N.2 authorization matrix on `architecture/phase-01m-screen-blueprint`.  
**Status:** Static mapping and target policy. No API authorization code changed.

## 1. How to read this matrix

- **Observed** means the route or coarse guard was visible in the inspected source.
- **Target permission** is the proposed granular permission from Phase 01P, not a claim that it is implemented.
- **Owner scope** means the server must bind the target record to the authenticated user or an explicit staff assignment.
- **Not verified** means route-level branch coverage, method handling, all error paths and production behavior still need tests.

The existing runtime primarily uses `need(u)`, `admin(u)` and `author(u)`. Those helpers represent authentication and coarse role checks, not the target permission system.

## 2. Public and identity endpoints

| Endpoint family | Observed access / behavior | Target permission | Resource and safety rule |
|---|---|---|---|
| `GET /api/health` | Public health response observed | `operations.health.read_public` | Return only service status/version/time; never credentials, bindings or internal diagnostics |
| `GET /api/config` | Public config; payment currently reports disabled until approved merchant integration | `platform.config.read_public` | Publish only safe public configuration; do not imply payments are operational |
| `GET /api/genres`, `/api/tags`, `/api/formats`, `/api/taxonomy` | Public taxonomy read observed | `catalog.taxonomy.read_public` | Public approved terms only; pending submissions remain private |
| `POST /api/auth/register` | Public; IP rate-limit observed | `identity.register` | Validate input, abuse controls, generic duplicate response; never accept role/state fields from client |
| `POST /api/auth/login` | Public; IP and email rate limits observed | `identity.login` | Generic failure, secure session, account-state gate and session rotation |
| `POST /api/auth/logout` | Publicly callable; clears session cookie if present | `identity.logout` | Revoke only caller's session; idempotent |
| `GET /api/me` | Returns current session user or null | `identity.profile.read_own` | Expose minimal own profile; no role mutation through this route |
| `GET /api/public-authors` | Public author listing observed | `author.profile.read_public` | Public profile fields only; hide private application and account data |

## 3. Catalog, reading and reader-owned data

| Endpoint family | Target permission | Mandatory server-side rule |
|---|---|---|
| `GET /api/novels`, `GET /api/novels/:id` | `catalog.novel.read_public` | Only published and rights-eligible works; draft/review states never leak |
| `GET /api/chapters/:id` | `reader.chapter.read` | Chapter and parent novel must both be published; locked body withheld until a valid unlock or explicit policy grant |
| `POST /api/chapters/:id/unlock`, batch unlock | `commerce.chapter.unlock_own` | Authenticated buyer, published chapter, atomic balance/ledger/unlock update, idempotency and no negative balance |
| `GET /api/omni/smart-unlock` | `commerce.unlock_options.read_own` | Authenticated balance and unlock records for caller only |
| `POST /api/bookmark`, `GET /api/bookmarks` | `library.bookmark.manage_own` | Every bookmark is scoped to session user; validate public/eligible novel |
| `GET/POST /api/library` | `library.collection.manage_own` | Collection IDs and membership always scoped to caller |
| `GET/POST /api/history` | `library.history.read_own`, `library.history.write_own` | Do not accept another user's owner ID; retention and clear-history behavior explicit |
| `GET/POST /api/reading-position` | `reader.progress.read_own`, `reader.progress.write_own` | User+novel/chapter compound ownership; validate chapter belongs to novel |
| `POST /api/follow`, `GET /api/follows` | `social.follow.manage_own`, `social.follow.read_own` | Caller is follower; private relationship data is not exposed to unrelated users |
| `GET /api/notifications`, `POST /api/notifications/read` | `notification.read_own`, `notification.mark_read_own` | Query and update only caller's rows; mark specific IDs where possible, not global records |

## 4. Community and engagement

| Endpoint family | Target permission | Mandatory server-side rule |
|---|---|---|
| `GET/POST /api/comments` | `community.comment.read_public`, `community.comment.create` | Validate parent visibility; create as caller; edit/delete only own comment or authorized case action |
| `POST /api/comments/like`, novel reactions | `community.reaction.manage_own` | Unique user/resource reaction; caller ID from session, not request body |
| `GET/POST /api/rating` | `community.rating.read_public`, `community.rating.create` | Whole-number rating from 1 to 10; one active rating per user/work; no self-rating manipulation |
| `POST /api/comments/report`, `POST /api/report` | `community.report.create` | Authenticated reporter, validated target, private evidence, deduplication and rate limit |
| `GET /api/requests`, `POST /api/requests` | `community.request.read_public`, `community.request.create` | Read only public request fields; creation is caller-owned and rate-limited |
| `GET/POST /api/vote-novels` | `community.vote.read_public`, `community.vote.create` | One eligible vote per user/target/window; server-enforced eligibility |
| `GET /api/chapter-engagement`, `GET /api/novel-engagement` | `analytics.engagement.read_public_aggregate` | Aggregate only; suppress small cohorts and never return per-user reading behavior |
| `GET /api/platform/overview`, `GET /api/discovery/graph` | `analytics.platform.read_public_aggregate` or staff-scoped analytics | Public payload must be aggregate and privacy-safe; staff detail needs explicit grant |

## 5. Author and creator endpoints

| Endpoint family | Target permission | Mandatory server-side rule |
|---|---|---|
| `POST /api/author/applications` | `author.apply` | Applicant identity from session; rights declaration and private samples protected |
| `GET /api/author/applications/me` | `author.application.read_own` | Return only caller's application and status |
| `GET/POST /api/author/novels` | `author.work.read_own`, `author.work.create_own` | List/create only caller-owned work; never trust submitted owner_user_id |
| `GET/POST /api/author/chapters` | `author.chapter.manage_own` | Resolve parent novel then verify owner on every request |
| `PATCH/DELETE /api/author/novels/:id`, chapter routes | `author.work.update_own`, `author.chapter.update_own` | Re-check owner and publication state for every method and ID |
| `GET /api/author/analytics` | `author.analytics.read_own` | All analytics filtered by owner; distinguish request counts from unique readers and ticket spend from earnings |
| `/api/author/ai/projects/*`, jobs, blueprint, run | `author.ai.project.manage_own`, `author.ai.job.run_own` | Project owner checked on every route; provider key server-only; quotas; generated output remains draft |
| `GET /api/author/ai/benchmarks` | `author.ai.benchmark.read` or staff aggregate | No provider secrets or other authors' private prompts/results |

## 6. OmniPortal and provider endpoints

| Endpoint family | Target permission | Mandatory server-side rule |
|---|---|---|
| `GET /api/sources`, `GET /api/omni/status` | `omni.directory.read_public` | Public provider metadata only; no secret/config values |
| `GET /api/omni/search`, `GET /api/omni/resolve` | `omni.search.public` | Only explicitly enabled, rights-authorized, allowlisted providers; safe URL handling and rate limits |
| `POST /api/omni/import` | `omni.import.request` | Current source requires login; owner-scoped job; metadata permission and rights authorization checked; no chapter-body import without separate license scope |
| `GET /api/omni/jobs` | `omni.job.read_own` | Query by authenticated user; never allow arbitrary user_id filter |
| `POST /api/connector-authorization-requests` | `omni.rights.request` | Caller submits evidence only; cannot activate connector or mark it authorized |
| `GET /api/admin/connectors`, PATCH/POST | `provider.directory.read`, `provider.config.manage` | Staff assignment; secret values never returned; enabling requires verified rights and allowlisted host |
| `POST /api/admin/omni/health` | `provider.health.run` | Allowlisted health probes, bounded timeout, rate limit, audit; no arbitrary URL fetch |
| `GET /api/admin/connector-authorization-requests`, PATCH | `rights.review`, `rights.approve` | Separate evidence review; reviewer cannot approve own request; approval does not automatically enable provider |

## 7. Commerce and financial endpoints

| Endpoint family | Target permission | Mandatory server-side rule |
|---|---|---|
| `POST /api/donations` | `commerce.payment.submit_own` | Caller-owned pending record; normalized reference duplicate check; no ticket credit on submission |
| `GET /api/tickets/ledger` | `commerce.ledger.read_own` | Always derive user ID from session |
| `POST /api/payment/webhook` | `commerce.payment.webhook.receive` | Disabled until verified merchant integration, signature, replay protection and reconciliation exist |
| `GET /api/admin/donations` | `commerce.payment.review_queue.read` | Finance operator/approver only; redact unnecessary personal evidence |
| `PATCH /api/admin/donations/:id` | `commerce.payment.approve` or `commerce.payment.reject` | Pending-only compare-and-set; separation of duties; atomic ticket+ledger update; immutable audit |
| `POST /api/admin/tickets` | `commerce.adjustment.initiate` | Operator initiates with reason and case reference; independent approver required before posting adjustment |
| `GET /api/author/earnings`, payout routes if present | `commerce.earnings.read_own`, `commerce.payout.request_own` | Own author ledger only; distinguish gross reader spend from net earnings and payable balance |

## 8. Admin and staff endpoint families

The current source uses a coarse `admin(u)` guard on many handlers. Target permissions must be narrower:

| Endpoint family | Target permission | Scope / control |
|---|---|---|
| `/api/admin/stats` | `analytics.admin.read` | Aggregated metrics; finance details separated |
| `/api/admin/users` and user PATCH | `identity.user.read_scoped`, `identity.user.manage` | No direct free-form role assignment; reason, grant workflow, last-admin protection |
| `/api/admin/agents` | `operations.agent.read` | Read safe agent metadata only |
| `POST /api/admin/agents/run` | `operations.jobs.run_allowlisted` | Agent allowlist, dry-run where supported, actor/correlation ID, bounded scope |
| `/api/admin/taxonomy` | `catalog.taxonomy.review` | Assigned queue, valid state transitions, audit |
| `/api/admin/publishing/*` | `publishing.queue.read`, `publishing.review`, `publishing.approve` | Publishing and rights are separate; author cannot approve own work |
| `/api/admin/donations/*` | `commerce.payment.review`, `commerce.payment.approve` | Finance-only, dual control for sensitive actions |
| `/api/admin/tickets` | `commerce.adjustment.initiate` | Dual approval; append-only ledger; never edit balance without ledger |
| `/api/admin/reports/*` | `community.case.review`, `community.content.hide` | Assigned moderation case, reason and appeal path |
| `/api/admin/connectors/*` | `provider.config.manage` | Provider operator; no rights approval by virtue of provider access |
| `/api/admin/connector-authorization-requests/*` | `rights.review`, `rights.approve` | Rights reviewer; conflict-of-interest check |
| `/api/admin/requests/*` | `community.request.review` | Assigned request queue; refunds handled through finance policy |
| `/api/admin/author-applications/*` | `author.application.review` | Assigned editorial queue; cannot approve own application |

## 9. Route-level findings requiring remediation

1. **Role mutation is too coarse:** inspected admin user PATCH can set one of four role strings and change verification/ban flags. Replace with scoped, audited grant and account-state workflows.
2. **Admin namespace is not a permission:** retain route-level authorization even if path starts with `/api/admin`; test every method branch.
3. **Owner checks must be repeated:** novel, chapter, AI project, notification, library, history, reading-position and job IDs are untrusted input.
4. **Financial adjustment needs separation:** current admin ticket-credit endpoint writes balance and ledger in one batch but is initiated by one admin. Target requires reason, case, independent approval and reconciliation.
5. **Rights and provider are separate:** a provider operator must not approve rights; rights approval must not reveal connector secrets.
6. **Moderation is scoped:** a moderator must not inherit global admin access to users, donations, tickets or connectors.
7. **Public aggregates require privacy review:** do not expose individual engagement, reading histories or small-cohort data.
8. **Audit persistence is a security dependency:** high-risk operations must fail closed or enter a durable pending state if required audit cannot be recorded.

## 10. Endpoint completeness and confidence

This document maps the endpoint families visible in the inspected API matrix and source excerpts. It is **not yet a mechanically exhaustive route inventory**. Before implementation, extract every route predicate and HTTP method from the full Worker source into a machine-checkable registry, including aliases, dynamic parameters, early returns, helper-dispatched routes and error branches.

Required endpoint inventory fields:
- HTTP method and normalized route pattern;
- source file and handler line/range;
- authentication requirement;
- current guard and role behavior;
- target permission;
- owner/resource scope;
- account-state requirement;
- side effects and transaction boundary;
- audit requirement;
- rate limit and abuse control;
- data classification;
- public/private/noindex classification;
- positive, negative and cross-owner test IDs.

## 11. Implementation gate

**Not implemented.** Do not replace the existing role checks or create permission tables until:
1. route extraction is exhaustive;
2. every route has a target permission and ownership rule;
3. the role/grant schema is approved with Phase 01O migration strategy;
4. deny-by-default tests pass against clean and upgrade fixtures;
5. staff operating model and approval separation are approved.

No application code, database, user role, secret, production configuration or deployment was changed.
