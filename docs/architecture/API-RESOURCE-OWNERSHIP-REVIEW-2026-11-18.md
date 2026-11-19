# API Resource Ownership Review: First Pass

**Audit date:** 2026-11-18  
**Source:** `src/index.js` at foundation branch snapshot  
**Scope:** User-scoped reader data, author-owned works, AI projects, and administrative mutations. Source review plus deterministic Worker-handler tests; not live Cloudflare D1 verification.

## Positive ownership controls observed

| Surface | Source evidence | Observed control |
|---|---|---|
| Session identity | `getUser(req, env)` | Resolves session token hash; rejects missing, banned, or expired users |
| Authenticated routes | `need(u)` | Requires a resolved user |
| Admin routes | `admin(u)` | Requires exact `role === "admin"` |
| Author routes | `author(u)` | Allows admin or author role |
| History and library | `/api/history`, `/api/library` | Reads and mutations bind `user_id` to `u.id` |
| Bookmarks | `/api/bookmark`, `/api/bookmarks` | Reads and writes are scoped to `u.id` |
| Follows and notifications | `/api/follow`, `/api/follows`, `/api/notifications` | User-specific rows use `u.id` |
| Author novel workspace | `/api/author/novels` | List filters `owner_user_id=u.id`; create assigns `owner_user_id=u.id`; update loads the row and checks its owner |
| Author chapters | `/api/author/chapters` and ID routes | List/create checks parent novel ownership; update/publish checks chapter's parent novel owner |
| Author AI projects | `/api/author/ai/projects` and ID actions | Project read/update/run/blueprint/jobs paths check `owner_user_id`, with admin exemption |
| Admin publishing and review | `/api/admin/*` | Admin helper appears before administrative mutations |

These are source-level positive signals. They do not replace adversarial cross-account tests.

## Findings requiring follow-up

### 1. Comic chapter policy consistency

**Status: resolved in PR branch.**

The author chapter PATCH handler now loads the parent novel's content format and calls `validateComicChapterContent(content)` for comic formats, matching the create path. Invalid content is rejected rather than silently rewritten. A regression assertion covers the shared validator call.

### 2. Bookmark write validation

**Status: resolved in PR branch.**

`POST /api/bookmark` now validates positive safe-integer novel/chapter identifiers and confirms that the requested chapter number belongs to that novel, with both chapter and novel published and the novel rights-eligible. The write remains scoped to the authenticated `u.id`. Regression assertions cover the identifier and resource relationship checks.

### 3. Partial chapter update integrity

**Status: resolved in PR branch.**

The author chapter PATCH handler now preserves the existing lock state when `is_locked` is omitted and rejects ticket costs that are not safe integers in the range 0 through 1,000,000. This prevents a title/body-only edit from implicitly unlocking a chapter and aligns update validation with reader unlock constraints.

### 4. Reader activity must reference eligible published resources

**Status: resolved in PR branch.**

The history write now validates safe-integer novel/chapter identifiers and confirms the exact chapter belongs to a published, rights-eligible novel before storing progress.

Public comment reads and writes now reject unknown, unpublished, or rights-ineligible novels. Public rating reads apply the same publication and rights filter. This prevents public activity endpoints from exposing or accepting activity against works that are not currently eligible for public reading.

Regression assertions cover the history relationship and the publication/rights gates for comments and ratings. These changes enforce publication boundaries; they do not establish a cross-account data exposure.

### 5. Novel request and AI project ownership

**Status: source review positive; deterministic Worker-level tests added in PR branch.**

The authenticated `GET /api/requests` quota count filters by both `user_id=u.id` and the current week. The `POST /api/requests` insert binds the authenticated `u.id` as the owner, and both weekly cost subqueries are scoped to that same user. The API intentionally exposes only the submitting account's quota count; the public vote listing is a separate, intentionally public surface and does not expose private request ownership controls.

The AI project collection filters by `owner_user_id=u.id`; creation assigns `owner_user_id=u.id` rather than accepting a client owner. Project detail, update, blueprint, run, and jobs handlers load the addressed project and reject non-admin users whose ID does not match its owner. Job listing is then selected by the verified project ID. Generation-run and job creation bind the authenticated user ID. The test harness now exercises two-author project creation/list/read/update isolation, project job-feed authorization, and rejection of cross-account blueprint/run actions before provider invocation. Novel request creation is also exercised through the Worker with a deterministic D1 batch model: three free requests, the fourth request's server-derived 100-Crown price, exact balance deduction, paid-request ledger entry, ownership despite forged client user IDs, independent weekly quotas, and rejection of an unaffordable request without leaving a request row or ledger entry.

These tests use the actual Worker request handler with a deterministic D1 test double. The request-accounting test models the exact ordered three-statement `env.DB.batch()` sequence, including `changes()` dependencies and `last_insert_rowid()` ownership checks. It does not execute live Cloudflare D1, prove real transactional rollback/concurrency behavior, or validate production balances.

### 6. Cross-account isolation test coverage

**Status: partial runtime coverage added in PR branch.**

`scripts/test-api-user-bookmark-isolation-runtime.mjs` now calls the real Worker `fetch()` handler with two independently authenticated sessions and a deterministic D1 test double. The test exercises account-scoped reads and writes for bookmarks, reading history, and personal library membership; it also checks that a forged `user_id` is ignored, history/bookmark chapter relationships are validated, author novel listings are owner-filtered, and a second author cannot update another author's novel or chapter. It also verifies that follows, notifications, ticket-ledger reads, and the current author-application read return only the authenticated account's rows. The test is included in the normal `npm run build` gate.

This is not a live Cloudflare D1 test. It now includes novel-request free/paid/insufficient-balance accounting through a deterministic batch model, AI project creation/list/read/update/job-feed isolation, and cross-account rejection for blueprint/run actions. Real-D1 concurrency/rollback verification and AI job/run persistence still need broader runtime coverage.

### 7. Canonical client route reconciliation

**Status: path-level mapping added; method and payload parity remain open.**

A build-gated check now scans literal URL arguments passed to `api()` and `apiWithTimeout()` in `public/app.js`. At this snapshot it finds 63 call sites and 42 distinct literal path expressions, which map to 38 distinct server literal endpoints or dynamic route families in the API inventory. No captured call-site path expression is currently unmatched. The check is implemented in `scripts/test-api-client-contract-coverage.mjs` and included in `npm run build`.

This is only path-level reconciliation for the canonical `public/app.js` client. It does not yet prove that each call uses the correct HTTP method, request schema, authorization expectation, response shape, or error handling. Dynamically assembled URL suffixes, inline HTML scripts, version-stamped client copies, and separately bundled clients still need dedicated review.

## Security boundary

No confirmed cross-user data exposure was established by this first pass. The two findings above are validation/policy consistency issues. This audit does not certify CSRF protections, rate limits, method rejection, session rotation, or all delegated handlers.

No production deployment, D1 mutation, or live API test was performed. The expanded ownership test is still awaiting exact-head CI execution; the deterministic harness is not a substitute for production verification. The expanded Worker-level test has been committed but must still pass the repository build/CI gate on the resulting exact commit before its assertions are treated as validated.
