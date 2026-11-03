# Phase 01N.11 — Author Object Ownership and Publication Boundary Review

Status: source inspection completed for author applications, novels, chapters and analytics. This is a static code review, not a runtime exploit test.

Repository: `sikandershehzadkhan-ctrl/God-emperornovel`
Branch: `architecture/phase-01n-master-route-registry`
Worker source: `src/index.js`, blob `13874ee0fde4e31e04a652c5169776c3b6f95c38`

## 1. Confirmed authorization and ownership controls

| Endpoint family | Role gate | Object boundary / validation observed |
|---|---|---|
| `GET /api/author/applications/me` | Authenticated session | Application lookup filters by `user_id = u.id` |
| `POST /api/author/applications` | Authenticated session | Reader role only; validated fields; max three applications in 30 days; insert binds `u.id`; pending state; audit + admin notification |
| `GET /api/admin/author-applications` | Admin | Status allow-list; capped at 100 |
| `PATCH /api/admin/author-applications/:id` | Admin | Pending-only transition; approval batch conditionally changes application and user role; banned/changed-role applicants are blocked; audit + user notification |
| `GET /api/author/analytics` | Author or admin | Main story query and timeline/chapter queries filter `novels.owner_user_id = u.id`; period allow-list 7/30/90 |
| `GET /api/author/novels` | Author or admin | `WHERE n.owner_user_id = u.id` |
| `POST /api/author/novels` | Author or admin | New draft assigns `owner_user_id = u.id`; rights status allow-list |
| `POST /api/author/novels/:id/submit` | Author or admin | Explicit owner check except admin; rights eligibility/evidence checked; sends to review |
| `PATCH /api/author/novels/:id` | Author or admin | Explicit owner check except admin; rights/format allow-lists; rights/asset changes on published work pause it and requeue review |
| `GET /api/author/chapters?novel_id=:id` | Author or admin | Loads parent novel and checks owner before returning chapter content |
| `POST /api/author/chapters` | Author or admin | Loads parent novel and checks owner; new chapter begins as draft |
| `PATCH /api/author/chapters/:id` | Author or admin | Joins chapter to parent novel and checks owner; validates number/title/content/cost; duplicate chapter number blocked |
| `POST /api/author/chapters/:id/publish` | Author or admin | Joins chapter to parent novel and checks owner; status allow-list; parent novel rights status must be eligible before publishing |

## 2. Positive security evidence

- All inspected author data mutation routes call the shared `author(u)` role helper.
- Author access is not treated as sufficient by itself: novel and chapter object ownership is separately checked.
- New novels are always created as drafts and owned by the current account.
- New chapters are always created as drafts.
- Author analytics queries are explicitly scoped to the current author's owned novels, including daily timeline and chapter rows.
- A published novel is paused and returned to review when rights declaration, rights evidence/notes, source URL, cover URL or content format changes.
- Application approval uses a guarded database batch and refuses to grant the author role if the applicant is banned or no longer has the expected reader role.

## 3. Follow-up invariant checks

1. **Chapter publication parent state:** the author chapter publish handler checks parent rights status but does not visibly require the parent novel's `publication_status` to be `published`. Reader-facing queries may still hide chapters under unpublished novels, but the invariant should be enforced or documented at the mutation boundary.
2. **Published chapter edits:** the author chapter PATCH handler updates content and metadata while retaining its existing publication status. Confirm whether edits to already-published chapters should require a review state, audit reason or moderation policy.
3. **Novel PATCH on published works:** rights/asset changes trigger a pause, but ordinary title/description/status edits do not. Confirm this is intentional and document the editorial policy.
4. **Admin bypass semantics:** admins bypass owner checks in author endpoints. Confirm admin actions are separately audited and this is an intentional support workflow.
5. **Cross-account negative tests:** test author A attempting to list, patch, submit or publish author B's novel/chapter IDs. Expected result: 403 or safe 404, with no data disclosure.
6. **Role transition tests:** test demoted authors and banned authors against every author endpoint.
7. **Concurrency:** test simultaneous author edits and publication transitions for lost updates and stale-state races.

## 4. Metrics and creator fairness

The analytics handler clearly labels reader ticket spend separately and returns a definition stating it is not author earnings, payout or profit. It reports cumulative counters and period requests, and discloses that daily view history is not backfilled. This is preferable to representing reader ticket spend as creator income.

## 5. Phase 01N.11 disposition

- [x] Inspect author application read/submit/review.
- [x] Inspect author novel list/create/submit/update.
- [x] Inspect chapter list/create/update/publish.
- [x] Inspect author analytics ownership filters.
- [x] Record object-level ownership checks and rights-review triggers.
- [x] Record publication invariant questions for follow-up.
- [ ] Add and execute cross-account negative tests.
- [ ] Decide and enforce parent publication-state invariant.
- [ ] Decide whether published chapter edits require re-review.
- [ ] Complete remaining reader/community/admin endpoint schema and permission mapping.

No runtime code, database migration, secrets, Worker configuration or production deployment changed.
