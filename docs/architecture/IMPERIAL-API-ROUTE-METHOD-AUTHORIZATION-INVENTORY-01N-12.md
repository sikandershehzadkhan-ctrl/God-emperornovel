# Imperial Novel: API Route, Method and Authorization Inventory

**Programme:** Phase 01N source reconciliation
**Status:** Static inventory of inspected Worker source; authorization conclusions are provisional until route-level tests
**Source:** `src/index.js` blob `13874ee0fde4e31e04a652c5169776c3b6f95c38`
**Branch:** `architecture/phase-01n-master-route-registry`

## 1. Purpose and interpretation

This inventory records the API surface found in the inspected Worker branch. It is not a statement that every route is secure. Route names and nearby guard calls are not enough to prove object-level authorization, CSRF behavior, correct HTTP methods, field minimization or rights eligibility.

Worker API flow:

1. Requests with paths beginning `/api/` enter `api(req, env)`.
2. Except for the early `/api/health` GET fast path, the API handler ensures core and runtime feature schemas, then resolves the session using `getUser(req, env)`.
3. `need(u)` requires a signed-in user.
4. `admin(u)` accepts any account whose legacy `role` is `admin`.
5. `author(u)` accepts either `role='author'` or `role='admin'`.

These helpers provide coarse role gates. They do not themselves prove that the caller owns a particular novel, chapter, comment, project, connector or payment record. Each handler must enforce resource-level ownership and allowed state transitions.

## 2. Public and session-optional API families

| Route | Observed method handling | Source-level access | Reconciliation notes |
|---|---|---|---|
| `/api/health` | GET and a second legacy no-method branch | Public | Fast path performs DB health check before schema/session initialization |
| `/api/agents` | GET | Public | Exposes enabled agent metadata; review fields for operational disclosure |
| `/api/taxonomy` | Delegated to `communityTaxonomy`; method-specific logic inside helper | Public entry point | POST accepts creator attribution fields from request body; do not treat as verified identity |
| `/api/auth/register` | POST | Public | IP rate limit; validate input and duplicate account behavior |
| `/api/auth/login` | POST | Public | IP and email rate limits; credential verification; session issuance details require separate test |
| `/api/auth/logout` | POST | Session optional | Deletes presented session digest if present; verify CSRF and cookie behavior |
| `/api/me` | No explicit method restriction in route condition | Session optional | Returns email, role and ticket balance to the signed-in user; confirm no shared caching |
| `/api/config` | No explicit method restriction | Public | Payment is explicitly reported not configured |
| `/api/genres`, `/api/tags` | No explicit method restriction | Public | Taxonomy records are returned; review public DTO shape |
| `/api/public-authors` | No explicit method restriction | Public | Aggregates published novels; query filter and rights eligibility require harmonization |
| `/api/sources` | No explicit method restriction | Public | Static provider/source directory; no credentials in response |
| `/api/omni/status` | No explicit method restriction | Public | Returns connector metadata and status; does not return configured search URL/evidence URL in final projection |
| `/api/omni/search` | No explicit method restriction | Public | Local and enabled authorized connectors; confirm query abuse limits and result rights filtering |
| `/api/omni/resolve` | No explicit method restriction | Public | URL source resolver; confirm URL parser and SSRF boundaries |
| `/api/formats` | GET | Public | Static format registry |
| `/api/chapter-engagement` | GET | Public | Real-time request-time aggregate query; validate privacy, cost and rights filter |
| `/api/novel-engagement` | GET | Public | Requires published and rights-eligible novel; request-time D1 aggregate |
| `/api/platform/overview` | GET | Public | Public platform aggregates; inspect query bounds and rights filters |
| `/api/discovery/graph` | GET | Public | Discovery graph projection; inspect node eligibility and query bounds |
| `/api/novels` | Route accepts query/list form; method not explicitly constrained in initial condition | Public | Published filter lacks the rights allowlist; response uses `n.*` |
| `/api/novels/:id` | Dynamic route; method not explicitly constrained in initial condition | Public | Published filter lacks rights allowlist; response selects full row |
| `/api/chapters/:id` | Dynamic route; method not explicitly constrained in initial condition | Public/conditional lock behavior | Must enforce parent novel rights and chapter publication state before content or unlock logic |
| `/api/novel-reactions` | GET and POST | GET public/session-optional; POST requires login | GET/POST existence checks currently check publication state but not the full rights allowlist |
| `/api/comments` | GET and POST | GET public; POST requires login | GET and POST apply novel rights allowlist; enforce moderation and rate limits |
| `/api/comments/like` | POST | Login required | Comment must be visible and parent novel published/rights-eligible |
| `/api/rating` | GET and POST | GET public/session-optional; POST requires login | Current novel existence check uses publication state; harmonize rights predicate |
| `/api/leaderboard`, `/api/tier-list`, `/api/random`, `/api/made-for-you`, `/api/vote-novels` GET | GET | Public or session-aware | Review rights filters and prevent private/personalized cache sharing |

## 3. Authenticated reader routes

| Route | Method | Guard observed | Resource boundary to verify |
|---|---|---|---|
| `/api/omni/import` | POST | `need(u)` | User may queue metadata import only for an enabled, rights-authorized connector that permits metadata import |
| `/api/omni/jobs` | GET | `need(u)` | Query is scoped to `j.user_id = u.id` |
| `/api/omni/smart-unlock` | GET-like query route | `need(u)` | Verify novel is public/rights-eligible and chapter set is eligible before suggesting purchase |
| `/api/novels/:id/batch-unlock` | POST | `need(u)` | Validate novel/chapter ownership relation, rights state, cost, idempotency and atomic ledger |
| `/api/bookmark` | POST | `need(u)` | Must only mutate the caller's bookmark record |
| `/api/history` | GET/POST | `need(u)` | Query and writes must remain scoped to caller ID |
| `/api/reading-position` | GET/POST | `need(u)` | Query and writes must remain scoped to caller ID |
| `/api/library` | GET/POST | `need(u)` | Query and writes must remain scoped to caller ID |
| `/api/bookmarks` | GET | `need(u)` | Query must remain scoped to caller ID |
| `/api/novel-reactions` | POST | `need(u)` | Unique per-user/novel reaction; rights predicate required |
| `/api/comments` | POST | `need(u)` | Rate-limited insert and parent comment validation; notification delivery must not expose private details |
| `/api/comments/like` | POST | `need(u)` | One user's like state only; idempotency/concurrency test required |
| `/api/comments/report` | POST | `need(u)` | Reporter identity must derive from session; report content is private moderation data |
| `/api/rating` | POST | `need(u)` | Whole-number 1–10 policy; user/novel unique key and rights predicate |
| `/api/donations` | POST | Login requirement appears in handler; provider/payment state needs review |
| `/api/requests` | GET/POST | `need(u)` | Request visibility, per-user quota, URL validation and refund ledger state |
| `/api/follow` | POST | `need(u)` | Must validate eligible novel and caller-specific follow relation |
| `/api/vote-novels` | POST | `need(u)` | Validate vote target, voting window, duplicate vote and rights state |
| `/api/notifications` | GET | `need(u)` | Query scoped to caller ID |
| `/api/notifications/read` | POST | `need(u)` | Update must target only notifications owned by caller |
| `/api/report` | POST | `need(u)` | Reporter identity from session; validate target and duplicate/rate limit |
| `/api/tickets/ledger` | GET | `need(u)` | Query scoped to caller ID; sensitive financial-adjacent data |
| `/api/recommendations` | GET | `need(u)` | Personalized data must never be shared cached; novel projection and rights filter need review |
| `/api/follows` | GET | `need(u)` | Query scoped to caller ID; public target eligibility needs review |
| `/api/profile` | GET | `need(u)` | Aggregates caller's private library/history/ledger; private no-store response |
| `/api/author/applications/me` | GET | `need(u)` | Query scoped to caller ID; review notes should only be shown to applicant if intended and sanitized |
| `/api/author/applications` | POST | `need(u)` plus reader role requirement | Validated application; per-user quota and unique pending constraint |
| `/api/connector-authorization-requests` | POST | `need(u)` | Requester derives from session; prevent unauthorized connector activation |

## 4. Author Studio routes

All of the following use `author(u)` in the inspected handlers, meaning current legacy `author` and `admin` roles are accepted. The creator's own resource must additionally be checked by owner ID.

| Route | Method | Ownership check observed |
|---|---|---|
| `/api/author/ai/status` | GET | Role gate; no private project data |
| `/api/author/ai/projects` | GET | `owner_user_id = u.id` |
| `/api/author/ai/projects` | POST | Optional linked novel checked against owner ID, except legacy admin bypass |
| `/api/author/ai/projects/:id` | GET/PATCH | Project owner ID checked, except legacy admin bypass |
| `/api/author/ai/projects/:id/blueprint` | POST | Project owner ID checked, except legacy admin bypass |
| `/api/author/ai/projects/:id/run` | POST | Project owner ID checked, except legacy admin bypass |
| `/api/author/ai/projects/:id/jobs` | GET | Project owner ID checked, except legacy admin bypass |
| `/api/author/ai/benchmarks` | GET | Author role gate |
| `/api/author/analytics` | GET | Author role gate; query filters novels by `owner_user_id = u.id` |
| `/api/author/novels` | GET/POST | Author role gate; inspect create/update ownership and mass assignment |
| `/api/author/chapters` | GET/POST | Author role gate; inspect parent novel ownership, publication state and rights |

`/api/author/ai/benchmarks` POST is admin-only in the inspected source. AI project generation is disabled when no `OPENAI_API_KEY` is configured; no claim is made that the production secret is present.

## 5. Administrator routes

Every listed route has an `admin(u)` check in the inspected handler unless marked as a helper delegated route. This is a generic legacy role check, not owner-only authority.

| Route family | Methods | Data/actions | Main review requirement |
|---|---|---|---|
| `/api/admin/agents` | GET | Agent records and last result | Owner-only visibility for sensitive run output |
| `/api/admin/agents/run` | POST | Runs selected agent/automation | Owner-only execution policy, per-agent scopes, audit and kill switches |
| `/api/admin/taxonomy` | GET/POST | Taxonomy moderation | Field minimization and state transition validation |
| `/api/admin/community/comments` | GET/PATCH | Comment moderation | Sensitive content access, audit and action permissions |
| `/api/admin/community/reports` | GET/PATCH | Reports and reporter context | Restricted reporter identity and evidence access |
| `/api/admin/author-applications` | GET/PATCH | Applicant personal/portfolio data and role approval | Owner-only or purpose-scoped review; approval audit |
| `/api/admin/stats` | GET | Platform aggregate counts | Bound queries and avoid exposing private rows |
| `/api/admin/users` | GET | Email, role, tickets, verification and ban state | Excessive sensitive field exposure; owner-only purpose-bound access |
| `/api/admin/users/:id` | PATCH | Role, verification and ban changes | Critical: generic admin can grant admin role |
| `/api/admin/publishing` | GET | Publishing queues and records | Owner-only publication governance and rights review |
| `/api/admin/publishing/novels` | POST/PATCH | Novel publishing and rights fields | Strict rights evidence, state transitions, immutable audit |
| `/api/admin/publishing/chapters` | GET/POST/PATCH | Chapter publishing and ordering | Parent novel ownership, rights and chapter state |
| `/api/admin/donations` | GET/PATCH | Donation/payment review | Provider reconciliation and double-credit protection |
| `/api/admin/reports` | GET/PATCH | User reports | Sensitive personal data and reporter confidentiality |
| `/api/admin/tickets` | POST | Manual ticket credit | Owner-only, step-up, reason, idempotency and immutable ledger |
| `/api/admin/connectors` | GET/POST/PATCH | External provider configuration | Owner-only secrets, allowlist, rights status and activation gates |
| `/api/admin/omni/health` | POST | Connector health checks | Owner-only; bounded outbound calls and SSRF protection |
| `/api/admin/connectors/cleanup` | POST | Deduplicate connector records | Owner-only and dry-run/audit before destructive changes |
| `/api/admin/requests` | GET/PATCH | User request review and possible refund | Owner-only financial action and atomic ledger |
| `/api/admin/connector-authorization-requests` | GET/PATCH | Provider rights authorization | Owner-only rights approval and evidence audit |

## 6. Cross-cutting findings

### 6.1 Coarse roles are not sufficient for the target owner model

The current helpers are `need(u)`, `admin(u)` and `author(u)`. There is no distinct owner principal or scoped delegated permission layer in these helpers. A generic admin is treated as a full author for author routes and is allowed to bypass project/novel owner checks in multiple handlers.

### 6.2 Rights checks are inconsistent across route families

HTML metadata/sitemap and some engagement/comment endpoints use the allowlist `original`, `public_domain`, `licensed`, `authorized`. Other routes only check `publication_status='published'`. A central policy must be applied to every public projection and mutation.

### 6.3 Method enforcement is inconsistent

Several route conditions do not explicitly constrain `m` (HTTP method), including `/api/me`, `/api/config`, `/api/genres`, `/api/tags`, `/api/public-authors`, `/api/omni/status`, `/api/omni/search`, `/api/omni/resolve`, `/api/novels`, `/api/novels/:id` and `/api/chapters/:id`. Some routes may intentionally be read-only, but this should be enforced explicitly and unsupported methods should return 405 with an `Allow` header.

### 6.4 API response field allowlists need systematic review

Sensitive data appears in some privileged projections and full-row selectors. Public, author, moderator and owner response DTOs should be separate. Do not let adding a database column silently widen an API response.

### 6.5 Public engagement endpoints require consistent eligibility and abuse controls

Reactions and ratings GET/POST checks use publication status in places where comments and novel engagement use the fuller rights allowlist. Public query endpoints also need query budgets and rate limits against scraping/denial-of-service patterns.

### 6.6 OmniPortal status and search are intentionally public-facing but still need policy boundaries

`/api/omni/status` exposes connector identity/base URL and operational status; it omits search URLs and rights evidence URLs from the final response. `/api/omni/search` queries only enabled, rights-authorized connectors. Continue to treat provider URLs, responses, attribution and metadata as untrusted input.

## 7. Automated route test contract

For every route record, tests must cover:

1. Correct HTTP method; unsupported methods return 405.
2. Anonymous, reader, author, delegated moderator/admin and owner-test identities as applicable.
3. Correct status for missing, malformed, cross-owner, deleted, suspended, unpublished and rights-ineligible resources.
4. Object-level authorization by substituting another user's IDs, novel IDs, chapter IDs, project IDs and notification IDs.
5. Response field allowlist and no-store/private cache headers for user-specific data.
6. Rate limits, pagination bounds, maximum payload sizes and query budgets.
7. CSRF/origin protections for cookie-authenticated state-changing requests.
8. Idempotency and concurrent retry behavior for payments, unlocks, ratings, reactions and publication transitions.
9. Audit records for privileged actions without logging secrets or unnecessary personal data.
10. Failure behavior when D1, queue, storage or optional providers are unavailable.

## 8. Disposition

**Inventory status:** Main API route families and role gates mapped from the inspected source. It is not yet a fully verified endpoint contract because exact SQL semantics, request/response schemas, CSRF behavior, rate limits and object-level tests remain to be checked route by route.

**No application code changed. No D1 migration was applied. No production deployment or live database inspection was performed.**

---

**Next:** implement a route-level authorization/rights regression harness, then reconcile migration `0012` and the runtime-schema bootstrap before changing production behavior.