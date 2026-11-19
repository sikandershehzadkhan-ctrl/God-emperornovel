# API authentication and authorization audit: first 14 paths

Audit date: 2026-11-18

## Evidence boundary

This review covers the 14 literal routes that previously had no explicit method condition and now have centralized method guards. It is a source-level review of `src/index.js` and a literal-string scan of `public/app.js`. It does not certify every API route or dynamic route family.

Authentication helpers inspected:

- `getUser(req,env)`: resolves the session cookie to a user, rejecting missing, expired, or banned sessions.
- `need(user)`: returns 401 when no authenticated user exists.
- `admin(user)`: returns 403 unless the user role is `admin`.
- `author(user)`: permits `author` or `admin`.

Except for the early `/api/health` fast path, the API dispatcher performs schema setup and then optional session lookup before route branches. A route classified as public does not require a valid session, even though an optional cookie may be read.

## Route matrix

| Route | Method | Authentication / role | Data scope and behavior | Client literal hits |
|---|---|---|---|---:|
| `/api/health` | GET | Public; bypasses session lookup | Lightweight database probe and service metadata | 0 |
| `/api/taxonomy` | GET | Public | Approved genre/tag vocabulary only | 0 |
| `/api/taxonomy` | POST | Authenticated account required | New proposal; submitter ID/name derived from session, not request body | 0 |
| `/api/me` | GET | Optional session | Returns only the current session user's profile summary, or null | 5 |
| `/api/config` | GET | Public | Public site/payment configuration; payment reports unavailable | 0 |
| `/api/genres` | GET | Public | Genre vocabulary | 1 |
| `/api/tags` | GET | Public | Tag vocabulary | 1 |
| `/api/public-authors` | GET | Public | Aggregated authors from published, rights-eligible novels | 0 |
| `/api/sources` | GET | Public | Static connector/source registry metadata | 0 |
| `/api/omni/status` | GET | Public, D1-backed per-IP limit: 60/minute | Reads connector status; does not seed or mutate registry rows | 0 |
| `/api/omni/search` | GET | Public | Local search plus enabled connectors marked rights-authorized | 1 |
| `/api/omni/resolve` | GET | Public | Validates and resolves a supported source URL; no user-owned resource | 0 |
| `/api/omni/smart-unlock` | GET | Authenticated account required | Calculates the current user's remaining locked chapters and affordable packs for a published, rights-eligible novel; does not perform an unlock | 0 |
| `/api/novels` | GET | Public | Catalog query restricted to published, rights-eligible novels | 13 |
| `/api/admin/stats` | GET | Administrator only | Aggregate platform statistics | 0 |

Client literal hits count exact path-string occurrences in `public/app.js`. Zero hits do not prove an endpoint is unused: callers may construct paths, use another runtime, or call it outside this file. These counts are discovery hints, not a complete API-client reconciliation.

## Confirmed remediation

### Taxonomy submitter spoofing

Before this audit, taxonomy POST accepted `creator_id` and `creator_name` from the request body. The handler now calls `need(user)` before reading the body and writes `user.id` and `user.username`. This removes the client-controlled identity path.

### Method handling

All 14 routes now reject unsupported methods with HTTP 405 and an `Allow` header before schema bootstrap and session lookup. Taxonomy allows GET and POST; the other 13 routes allow GET only.

## Additional author-resource update finding

### Partial chapter edits must not change lock state implicitly

The author chapter PATCH handler previously converted an omitted `is_locked` field to false through a truthiness expression. A client updating only a title or chapter body could therefore unintentionally unlock the chapter. The same handler accepted ticket costs without requiring a bounded whole number, unlike the reader unlock path's safe-integer validation.

The handler now preserves the stored lock state when `is_locked` is absent and validates ticket cost as a safe integer from 0 through 1,000,000. A source regression assertion protects both behaviors. This is a verified input/update-integrity defect and remediation in the PR branch, not a demonstrated cross-account data exposure.

## Remaining security and operational questions

1. **Public Omni search exposure:** `/api/omni/search` remains public and can query enabled, rights-authorized external connectors. It now has a 20/minute per-IP D1-backed limit, a 120-character query cap, at most 30 eligible connectors per request, and a 7-second outbound timeout. Concurrency and edge/WAF controls still need production review.
2. **Public Omni status side effects:** resolved in the audit branch. Public status now only ensures required tables and reads connector rows; registry seeding is moved to the authenticated admin connector listing. Public status is rate-limited to 60/minute per IP.
3. **Taxonomy submission abuse:** POST now requires login and binds identity correctly, but per-account/IP submission rate limits and moderation abuse controls still need review.
4. **Client parity:** Several routes have no exact literal reference in `public/app.js`; trace dynamic callers and other frontend bundles before calling them unused.
5. **Remaining routes:** This report does not cover the other literal routes or the 21 dynamic route families.

## Status

- Method behavior for these 14 paths: **implemented and CI-verified**.
- Taxonomy submitter identity binding: **implemented and CI-verified**.
- Authentication/role behavior for these 14 paths: **source-reviewed; Omni public endpoint rate/query bounds implemented, edge/WAF and concurrency controls remain open**.
- User-owned reader data is session-scoped in the reviewed handlers: history, library, bookmarks, notifications, ticket ledger, recommendations, and follows bind queries to the authenticated user's ID. Author novel/chapter and AI project/job handlers include owner checks, with admin bypasses where intended. In addition to source assertions, `scripts/test-api-user-bookmark-isolation-runtime.mjs` exercises the actual Worker fetch handler using two simulated accounts and a deterministic D1 test double. It covers cross-account denials and independent user data, but is not a live Cloudflare D1 test.
- Remaining cross-account validation must extend beyond the currently covered routes to every dynamic family, including denied reads and writes, admin boundaries, and concurrent mutation paths.
- Full API authorization, resource ownership, cross-account isolation, and client parity: **not complete**.
- No production D1 access, production deployment, or live-browser test was performed.


## Rating scale integration dependency

The earlier reference to PR #195 is historical and is no longer the current integration target. The canonical migration work has been ported to PR #329 (migrations 0012–0046, including reserved migrations 0034/0035), and the ten-point Worker/API/UI implementation is carried by PR #331. Reader Settings Studio integration is tracked separately in PR #328.

This API audit branch is still based on the public-domain ownership stack, not on the canonical migration/rating stack. Its source snapshot therefore still contains legacy five-point assumptions, including the catalog minimum-rating clamp. Do not create a competing rating migration or treat this branch's rating behavior as compliant. Once the canonical migration and ten-point rating changes are integrated into the chosen unified base, rebase this audit branch, remove/reconcile the duplicate legacy rating route and five-point assumptions, refresh the source-pinned endpoint inventory, and run the full API/client regression suite against the exact rebased commit.

Current dependency status: PR #329 and PR #331 remain open drafts; their described checks do not validate this branch. No rating integration is claimed here.

## 2026-11-18 follow-up: public Omni endpoint abuse controls

- Public `GET /api/omni/status` is now IP-rate-limited to 60 requests per 60-second window and no longer seeds/writes connector registry rows. Registry seeding happens from the authenticated admin connector listing instead.
- Public `GET /api/omni/search` is now IP-rate-limited to 20 requests per 60-second window and rejects query strings longer than 120 characters before searching local content or contacting authorized connectors.
- External connector searches remain limited to enabled connectors with `rights_status='authorized'`, and the existing 7-second outbound fetch timeout remains in place.
- The rate-limit helper uses the existing D1-backed auth rate-limit table. This introduces bounded D1 writes for public requests; it is not a substitute for Cloudflare edge/WAF controls, and the shared `unknown` IP fallback must be reviewed if requests can reach the Worker without `cf-connecting-ip`.
- Regression coverage is source-level in `scripts/test-api-authorization-audit.mjs`; exact-head CI and production behavior remain unverified until the build workflows pass and the Worker is deployed.

## Connector creation rights default

Admin connector creation previously inserted new connector records with `rights_status='authorized'` despite having no rights evidence or terms/license URL. Although the row was disabled, this incorrectly asserted authorization in the data model and could make later enablement decisions unsafe. The creation route now defaults to `enabled=0, rights_status='pending'`; the existing PATCH flow requires evidence or terms before moving a connector to authorized. A regression assertion protects the pending default. This is a source-level fix; exact-head CI and deployed behavior remain to be verified.

## Report resource-reference validation

The authenticated POST /api/report handler now validates target IDs, verifies referenced records exist, and rejects a chapter that does not belong to the supplied novel. A chapter-only report is linked to the chapter's actual novel. Details are bounded plain text. Regression assertions were added to the API authorization build gate. This is source-level remediation; live database behavior and exact-head CI are not yet verified.



## Admin chapter publication boundary

Admin chapter PATCH and POST previously allowed a chapter to be marked published when its parent novel was still a draft. The PATCH path checked rights eligibility but did not require the parent novel itself to be published; the create path only rejected ineligible rights when the parent novel was already published. Both paths now require the parent novel to be published and rights-eligible before publishing a chapter. Admin chapter create/update also enforce whole-number ticket costs from 0 through 1,000,000 instead of silently clamping arbitrary values. Build-gated regression assertions cover both paths. This is source-level remediation; exact-head CI and deployed behavior remain to be verified.



## Rights-verification audit-field consistency

The admin novel review handler could clear `rights_verified_by` when a work returned to draft while retaining an earlier `rights_verified_at` timestamp. It could also set the reviewer ID from a truthy request value without ensuring a matching timestamp was written. The handler now treats publication or an explicit boolean `rights_verified: true` as the verification event, and writes the reviewer ID and timestamp together; otherwise both fields are cleared. A regression assertion protects the paired fields. This preserves audit-record consistency, but does not independently prove the evidence itself is legally sufficient.



## Admin user PATCH: partial-update and self-demotion safeguards

A focused review found that the admin user PATCH handler treated an omitted role as `user`, while its self-demotion guard used a different fallback. An administrator could therefore submit a partial update (or omit `role`) and unintentionally demote their own account. The same handler also reset omitted `verified` and `banned` values to false, making partial updates destructive, and it did not verify that the target user existed before returning success.

The route now validates a positive safe-integer user ID, loads the current account, returns 404 for a missing user, preserves each omitted field, validates the effective role, and blocks self-demotion based on that effective role. Build-gated source assertions cover these boundaries. This is a source-level fix; exact-head CI, runtime behavior against real D1, and production behavior remain unverified.


## Admin publishing resource ID validation

The next resource-boundary pass found that several admin publishing routes converted path or request identifiers with `Number()` but accepted any truthy number. This allowed fractional or unsafe-integer identifiers to reach D1 bindings, and chapter numbering used `Number.isInteger` rather than the safer integer bound.

The novel PATCH, chapter list, chapter PATCH/DELETE, chapter reorder, and chapter creation paths now require positive safe-integer IDs. Chapter numbers on create/update also require positive safe integers. The author-application review path already had a positive safe-integer guard and was retained.

These are source-level validation safeguards. The regression assertions are added to the build-gated authorization audit; CI and real-D1 behavior still require verification.


## Admin-created novel owner assignment

A review of the admin novel creation route found that `owner_user_id` was converted with `Number(...)` and inserted without checking that the target account existed, was active, or had an author-capable role. The route now requires a positive safe-integer owner ID, resolves the account, and permits assignment only to an unbanned author or administrator. If no owner is supplied, the current administrator remains the default owner. This prevents malformed or arbitrary account IDs from silently becoming novel ownership assignments.

Regression assertions cover the owner validation and role/ban checks. This is a source-level safeguard, not yet a live D1 authorization test.


## Author chapter publication parent-state enforcement

The author chapter publish route checked ownership and novel rights but did not check the parent novel's publication state. This allowed a chapter to be marked published while its parent novel was still a draft or awaiting review. The route now loads the parent novel publication status and rejects chapter publication until the parent novel is published. Moving a chapter back to draft remains allowed.

Regression assertions cover the parent-state lookup and publication gate. This is a source-level safeguard; runtime behavior still requires the repository test suite and deployment validation.


## Author chapter creation numeric validation

The author chapter creation route previously accepted any integer chapter number and only rejected negative ticket costs. Non-integer, non-finite, or excessively large ticket costs could reach the database layer, and chapter numbers were not constrained to safe integers. The route now validates a positive safe-integer novel ID and chapter number, plus a safe-integer ticket cost from 0 through 1,000,000, before database access or insertion.

Regression assertions cover all three numeric boundaries. This is source-level validation and does not substitute for running the full Worker test suite.


## Author chapter edit and list identifier validation

The Author Studio chapter list route converted the supplied `novel_id` with `Number()` and queried D1 without first rejecting missing, fractional, non-finite, zero, negative, or unsafe identifiers. The chapter edit route likewise relied on its digit-only path matcher without checking that the converted chapter ID was a positive safe integer, and chapter-number edits used `Number.isInteger` rather than a safe-integer bound.

The list route now rejects invalid novel IDs before database access. Chapter edits validate the path ID and require a positive safe-integer chapter number. Regression assertions cover each boundary. These are source-level safeguards; the full repository test suite, real-D1 behavior, and production deployment remain unverified.


## Author publishing route path-ID validation

The author novel submission, novel editing, and chapter publication handlers converted digit-only path captures to JavaScript numbers and proceeded to database lookups without confirming that the values were positive safe integers. These handlers now reject invalid IDs before database access. Regression assertions cover each route, complementing the prior chapter-list and chapter-edit checks.

This remains a source-level validation result. It does not establish that the full repository test suite passed, that production D1 behaves identically, or that the changes are deployed.


## Published Author Studio content review transitions

The Author Studio edit paths previously allowed material changes to published novel metadata and published chapter content while retaining the published state. This created a review-bypass path: updated material could remain publicly visible without renewed moderation.

The author novel PATCH path now detects changes to the novel's title, author attribution, alternate titles, description, series status, language, format, rights declaration/evidence/notes, and cover/source assets. A material edit to a published novel moves it to `review`, clears prior reviewer decision metadata, and notifies administrators. Rights verification metadata is cleared only when the rights declaration/evidence or rights-related assets/format changed; ordinary descriptive edits do not erase the rights verification record.

The author chapter PATCH path now detects changes to chapter number, title, body, lock state, and ticket cost. A material edit to a published chapter moves it to `review`, records an audit event, and notifies administrators. The author chapter submission endpoint now routes a requested publication into `review` rather than directly publishing it, preventing an author from bypassing moderation after an edit. The admin chapter editor accepts the `review` state so administrators can inspect and then approve or return a chapter to draft.

Source regression assertions cover the review transition, audit events, administrator notifications, author submission behavior, and admin review-state support. These are source-level protections only. The test script has not yet been executed in a verified repository runtime, and live D1 behavior, full CI, production deployment, and browser QA remain unverified.


## Admin publication approval and return-for-changes controls

A further review of the admin moderation boundary found that a draft novel or chapter could be moved directly to published, bypassing the review queue. Returning a novel from review to draft did not require reviewer feedback, and chapter decisions did not consistently notify the author or retain the reason for a return.

The admin novel PATCH route now requires a novel to be in `review` before first approval. Returning a novel from review to draft requires non-empty reviewer feedback (bounded to 3,000 characters). Approval records the acting administrator as both the rights verifier and publication reviewer with timestamps; review re-queue clears stale decision metadata. Approval and return-for-changes notify the owning author, and the decision plus feedback is written to the audit log.

The admin chapter PATCH route applies the same review-before-approval and feedback-required return policy. It rechecks that the parent novel is published and rights-eligible before chapter approval, records the acting administrator and decision details in the audit log, and notifies the novel owner of approval or requested changes. Chapter feedback is retained in the audit log because the current chapter schema has no dedicated review-feedback/reviewer columns. No schema migration was introduced in this audit branch.

Regression assertions were added for direct-approval rejection, feedback requirements, reviewer identity, audit events, parent rights checks, and author notifications. These assertions have been committed but have not yet been executed in a verified repository runtime. This remains source-level remediation; full CI, real-D1 behavior, production deployment, and browser QA are not claimed.


## Renewed rights review and chapter creation gate

The admin novel decision route now detects changes to the rights declaration, rights evidence, or rights notes. A currently published novel cannot keep its published state while those fields change; the administrator must first move it to review. The existing approval transition then revalidates evidence for non-original works and records a fresh rights reviewer and timestamp. Moving the work into review clears the previous rights verification.

The admin chapter-creation route now accepts only draft creation. A newly created chapter must subsequently enter review through the admin chapter decision route before it can be published. This closes the direct-publication path that previously existed only on chapter creation, separate from the existing review gate on chapter updates.

Public-facing source queries inspected in this pass consistently filter novels by published status and eligible rights, and chapter reads require both a published parent novel and a published chapter. Public-author discovery, local Omni search, recommendations, tier/random lists, ratings, comments, reactions, follows, library operations, and sitemap generation were also inspected for publication eligibility filters. This is source inspection, not live endpoint verification.

Regression assertions were added for rights-change detection, blocking an in-place rights change on a published novel, fresh rights verification on approval, and draft-only admin chapter creation. Tests remain unexecuted in a verified repository runtime; no production deployment or live D1/browser validation is claimed.


## Novel archive and restoration lifecycle

The admin novel review route now requires a non-empty reason (up to the existing 3,000-character feedback bound) when moving a novel into `archived`. The reason is retained in the existing `review_feedback` field, included in the audit decision event, and sent to the novel owner in an archive notification. Restoring an archived novel to public publication still requires the normal review transition and a subsequent approval; direct `archived` to `published` remains rejected. Re-queueing into review clears the old archive reason so it cannot be mistaken for a new decision. Regression assertions were added for the archive reason, persistence, notification, and review-before-restoration boundary. These are source-level changes only; exact-head CI, live D1 behavior, deployment, and browser QA remain unverified.


## Administrative report and connector review safeguards

The report-status PATCH route now validates a positive safe-integer report ID, checks the database update affected exactly one row, returns 404 for a missing report, and records the acting administrator and new status in the audit log. Connector authorization review now validates its request ID and performs a conditional `pending` to decision transition. The connector rights/disabled-state update is gated on that transition succeeding; competing review attempts return a conflict instead of both applying decisions. Review notes are bounded to 3,000 characters. Regression assertions cover the ID checks, missing-report behavior, audit event, pending-state compare-and-set, and dependent connector update. Source-level checks only; runtime concurrency and production D1 behavior remain unverified.


## Administrator account self-protection

The admin user PATCH route now blocks an administrator from setting their own account to banned, preventing an accidental self-lockout. It retains the existing self-demotion guard, validates that exactly one user row was updated, and records role, verification, ban-state changes, target account, and acting administrator in the audit log. Regression assertions cover the self-ban guard, audit event, and affected-row check. This is source-level protection; authentication/session behavior has not been tested against a live deployment.


## AI author-project resource identifiers

The AI author-project detail, edit, Story Bible generation, chapter-run, and job-history routes now reject IDs that are not positive safe integers before database access. Existing owner checks remain in place after lookup. Regression coverage asserts all five dynamic resource handlers retain the guard. These are source-level assertions; live account-isolation and generation workflows remain unverified.


## Concurrent publication review protection (2026-11-19)
- Admin novel review updates now include the previously observed `publication_status` in the UPDATE predicate and require exactly one affected row. Stale or concurrent decisions return HTTP 409 and require the reviewer to refresh.
- Admin chapter review updates use the same compare-and-set rule and affected-row check.
- This closes the stale-read overwrite window for those admin review writes. It does not replace broader live D1 concurrency testing, and the regression checks still require exact-head CI execution.


## Author submission transition protection (2026-11-19)
- Author novel submission now permits only draft or archived records to enter review, uses the previously observed state in the UPDATE predicate, and returns HTTP 409 for duplicate or stale submissions.
- Author chapter submission now rejects duplicate review submissions and already-published chapters. Its state transition is conditional on the observed chapter state; the SQL also rechecks that the parent novel remains published and rights-eligible at write time.
- Author novel edits now condition their write on the publication state read before editing and require one affected row, preventing a stale edit from silently crossing a concurrent publication-state transition.
- These source-level safeguards require exact-head CI and live D1 concurrency validation; neither is claimed complete here.


## Purchase-time chapter publication and price revalidation (2026-11-19)

- Single-chapter unlock now repeats the chapter-to-novel ownership, published-state, locked-state, observed ticket-price, and parent rights checks inside the conditional ticket debit. If a chapter is unpublished, unlocked, repriced, moved, or its novel loses publication/rights eligibility after the initial read, the debit affects no row and the request returns a conflict.
- Batch unlock now makes the debit conditional on every selected chapter still belonging to the requested novel, remaining published and locked, retaining its observed price, and having a published, rights-eligible parent. A count check ensures every selected chapter still matches before any ticket debit is accepted.
- Regression assertions were added for both purchase paths. These changes are source-level only until exact-head CI and real D1 transaction/concurrency behavior are verified. No deployment or production database change is claimed.


## Ticket-credit balance integrity (2026-11-19)

- Donation approval, administrator Crown credits, and novel-request refunds now require the existing account balance to be a non-negative whole number and leave room below JavaScript's maximum safe integer before crediting.
- Donation and refund state transitions are now conditional on that balance precondition as well as the pending state. This prevents marking a transaction approved/rejected-for-refund when the account cannot safely receive its credit.
- The subsequent account update repeats the bound, and the ledger insert remains dependent on exactly one successful balance update.
- Regression assertions were added for all three credit paths. These are source-level safeguards; test execution, D1 batch semantics under live concurrency, and deployment remain unverified.


## Ticket-debit balance integrity (2026-11-19)

- Single and batch chapter unlock debits now require the account balance to be a non-negative whole number no greater than JavaScript's maximum safe integer, in addition to sufficient funds and the purchase-time chapter/rights checks.
- Novel-request creation now applies the same whole-number and safe-integer constraints before inserting a paid request. Its conditional debit repeats those balance checks and verifies the newly inserted request cost is still affordable before subtracting tickets.
- Source-level regression assertions cover all three spending paths. The test script has not yet been executed in a verified runtime, and live D1 batch/concurrency behavior remains unverified.


## Chapter deletion refund integrity (2026-11-19)

- Administrative chapter deletion now enumerates all unlock records and validates account IDs and original costs before any mutation.
- Each positive-cost unlock is refunded to its original account only when its deterministic chapter/account refund reference is absent. A matching chapter_unlock_refund ledger entry is inserted as part of the same D1 batch.
- Unlock rows are deleted only after every positive-cost unlock has a matching refund ledger entry. The chapter row is then deleted only when no unlock rows remain; otherwise deletion stops and retains unlock records for review.
- Malformed unlock records, invalid account balances, or balances too close to the safe-integer ceiling prevent chapter deletion instead of silently discarding purchase history.
- Source-level regression assertions were added. Runtime tests and live D1 transactional/concurrency behavior have not yet been executed or independently verified.
