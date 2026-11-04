# Canonical migration collision register



## PR #124 security and account-deletion migration collision map

PR #124 is based on an older migration namespace and cannot be merged as-is. Its files 0009–0012 collide with current canonical migrations 0009–0012, while its 0013 chapter timestamp migration duplicates the canonical timestamp migration 0029. The proposed canonical allocation after the validated 0001–0035 chain is:

| PR #124 source file | Canonical destination | Treatment |
| --- | --- | --- |
| 0009_password_reset_tokens.sql | 0036_password_reset_tokens.sql | Preserve; single-use hashed recovery tokens |
| 0010_email_verification.sql | 0037_email_verification.sql | Preserve; mailbox verification is distinct from the legacy verified badge |
| 0011_password_reset_email_snapshot.sql | 0038_password_reset_email_snapshot.sql | Preserve; bind recovery tokens to the mailbox that received them |
| 0012_novel_ownership_transfers.sql | 0039_novel_ownership_transfers.sql | Preserve; consent-based transfer with guarded acceptance |
| 0013_chapter_updated_at.sql | none | Omit; canonical 0029_chapter_update_timestamps.sql already owns this column and lifecycle |
| 0014_account_deletion_requests.sql | 0040_account_deletion_requests.sql | Preserve; reversible request state only, no erasure execution |
| 0015_account_deletion_review_store.sql | 0041_account_deletion_review_store.sql | Preserve; review records and immutable events |
| 0016_account_deletion_reviewer_roles.sql | 0042_account_deletion_reviewer_roles.sql | Preserve; explicit specialist roles, not inherited from admin |
| 0017_account_deletion_disposition_plans.sql | 0043_account_deletion_disposition_plans.sql | Preserve; immutable versioned plans |
| 0018_account_deletion_disposition_approvals.sql | 0044_account_deletion_disposition_approvals.sql | Preserve; independent approval bound to exact plan digest |
| 0019_account_deletion_specialist_findings.sql | 0045_account_deletion_specialist_findings.sql | Preserve; specialist-scoped immutable findings |

This allocation is a namespace reconciliation, not permission to execute account erasure. The deployment workflow remains disabled. Before any production use, the new migrations must pass fresh and upgrade fixtures, foreign-key/integrity checks, reviewer-role separation tests, and ownership-transfer concurrency tests. The PR #124 Worker/API changes must be ported onto the current security integration without replacing the Origin/Fetch-Metadata, route-method, project-owner, report-audit or admin-account safeguards already integrated from PR #172.

## Current-main reconciliation checkpoint (2026-11-04)

- `main` and PR #173 have byte-identical migration files 0001–0011 (verified by Git blob SHA for each file).
- PR #173 is the audited source of migrations 0012–0035. These 24 migration files have now been ported into the current-main route/security integration branch after confirming 0001–0011 are byte-identical to main. The complete 0001–0035 fresh replay and integrity gates are now in CI; no production D1 migration has been run.
- PR #173 is two commits behind current `main` and changes the Worker, browser bundle, deployment workflow, package metadata and many tests. Its branch must not be merged wholesale: it does not contain the current route-security safeguards ported from PR #172.
- The current-main route/security integration branch removed the unreachable duplicate legacy `POST /api/rating` handler, migrated the runtime/API/UI to whole-number 1–10 ratings, added the fresh-install and legacy-conversion migrations 0034/0035, and registered `scripts/test-rating-handler-canonical.mjs` plus `scripts/test-rating-migration.py`. Full CI is the remaining verification gate.
- The canonical migration chain includes a fresh-install baseline (0034), even-value conversion of legacy scores (0035), a uniqueness guard, and a dedicated SQLite rating-migration test. These are now wired into current-main CI and must pass alongside the full 35-migration replay before this integration branch is eligible for review.


Status: integration candidate; no production D1 migration has been run.

## Canonical sequence

The canonical media/account/Author Studio branch already owns migrations 0001–0027:

- 0012 user profiles
- 0013 username-change cooldown and history
- 0014 account preferences
- 0015 historical-username insert guard
- 0016 chapter revisions
- 0017 scheduled chapter publications
- 0018–0027 media, rights, comic, donation-review and payment safeguards

The community/reader/account-closure branch used overlapping branch-local numbers. The safe, independent migrations have been moved into new, globally unique slots:

| Former branch-local file | Canonical file | Treatment |
| --- | --- | --- |
| 0012_runtime_feature_schema.sql | 0028_runtime_feature_integrity.sql | Ported. Adds referential-integrity triggers, archives duplicate/orphan reports before cleanup, and keeps runtime-created tables compatible. |
| 0013_chapter_update_timestamps.sql | 0029_chapter_update_timestamps.sql | Ported. |
| 0014_reader_engagement_metrics.sql | none | Intentionally omitted: source file is comment-only and creates no schema. |
| 0015_daily_view_analytics.sql | 0030_daily_view_analytics.sql | Ported. |
| 0016_reading_positions.sql | superseded | The canonical Worker already provides cross-device reading positions with optimistic concurrency; do not create a second table contract. |
| 0017_ten_point_ratings.sql | 0034_ratings_baseline.sql + 0035_ten_point_ratings.sql | Ported with a fresh-install baseline, existing-table rebuild and even-value conversion from 1–5 to 1–10. Worker API, runtime schema, reader control, catalog thresholds and display regressions were updated together. |
| 0018_comment_reports.sql | none | Intentionally omitted: source file is comment-only; comment-report schema is owned by 0028. |
| 0019_account_closure_requests.sql | 0031_account_closure_requests.sql | Ported. |


## Author editorial workspace reconciliation

The Author Editorial Workspace branch also used branch-local migrations 0012–0015:

| Former branch-local file | Canonical treatment |
| --- | --- |
| 0012_chapter_revisions.sql | Omitted as a duplicate: byte-identical to canonical 0016_chapter_revisions.sql. |
| 0013_scheduled_chapter_publications.sql | Omitted as a duplicate: byte-identical to canonical 0017_scheduled_chapter_publications.sql. |
| 0014_author_story_goals.sql | Ported as 0032_author_story_goals.sql. |
| 0015_author_private_notes.sql | Ported as 0033_author_private_notes.sql. |

This resolves the filename collisions without replaying duplicate DDL or displacing account migrations 0014–0015. The application APIs/UI and their owner-isolation tests still need to be integrated and validated with these tables before the Author Editorial Workspace can be considered fully integrated.


## Author Studio application integration completed

The canonical account-security integration now includes the Author Editorial Workspace application layer, not just its tables:

- Owner-scoped GET/PUT writing-goal APIs with bounded integer/date validation, atomic ownership predicates and audit events.
- Private note list/create/update/delete APIs with owner/story/chapter checks, 4,000-character bounds and audit events.
- Deterministic story readiness checks based on recorded metadata, supported formats, rights evidence and actual chapter completeness. These checks do not certify literary quality, originality, legal rights or approval.
- Phone-first Author Studio panels for goals, chapter-linked private notes and editorial readiness, with planning-queue signals.
- Regression coverage registered in the standard build, including owner isolation and source/served bundle parity.
- Existing comic page manager and creator media library were preserved and revalidated alongside the editorial workspace.

Canonical migrations 0032–0033 back these features. Their API/UI/test integration passed the complete Cloudflare Source Validation, account identity CI and Graphify workflows on commit `358269534ec8ac00fcbdd3ab1b41a9d6c4fa7f52`.

## Confirmed schema collisions that must not be papered over

### Reading positions

The canonical runtime schema on the media branch creates `reading_positions` with one row per (user, novel), columns `percent` and `revision`, and optimistic-concurrency updates. The incoming branch migration defines a different table with one row per (user, novel, chapter), column `progress_percent`, and no revision token.

Both definitions cannot safely own the same table name. A simple migration-number rename would leave the Worker queries and database contract inconsistent. The incoming per-chapter feature must be ported to a separately named table (for example `reader_chapter_positions`) and its API/UI queries updated in the same change, or the canonical contract must be deliberately redesigned with a tested data migration.


### Duplicate reader-progress proposals

The design branch's `0013_reader_progress.sql`, the phase branch's `0016_reading_positions.sql`, and the separate `history.progress_percent` proposal all represent overlapping cross-device chapter-position persistence. The canonical Worker already has `reading_positions` with a revision token and server-side conflict detection. These competing tables/columns are intentionally retired from the migration plan; new Library progress displays should read the canonical position API rather than introduce another independently writable progress store.

### Ten-point ratings

The canonical Worker lazily creates `ratings` with a 1–5 CHECK constraint. The incoming migration rebuilds `ratings` for 1–10 but assumes that the table already exists, while a fresh D1 migration replay does not create it before the rebuild. The endpoint also currently validates 1–5 on the canonical branch. This feature requires a coordinated migration that supports both fresh and existing databases, plus API/UI/test changes to 1–10. It is not safe to port the SQL alone.


### Reader progress history field

A separate reader-progress PR proposed adding `history.progress_percent`. The canonical Worker already persists cross-device chapter progress in `reading_positions` with optimistic concurrency (`percent` and `revision`) and local recovery. Adding a second independently writable progress field would create two competing sources of truth. Keep the existing `reading_positions` API as canonical; if the Library needs a history percentage, derive it from that source rather than storing a second percentage on `history`.

## Release requirements

1. Run the full Cloudflare Source Validation workflow against this branch, including fresh SQLite replay and migration integrity checks.
2. Add legacy-schema upgrade fixtures for runtime-created community tables, including duplicate and orphan reports.
3. Add a legacy-schema fixture for existing `reading_positions` and prove the new per-chapter table does not overwrite or reinterpret it.
4. Add fresh-install and existing-install fixtures for the ratings transition before enabling ten-point ratings.
5. Verify `PRAGMA integrity_check` and `PRAGMA foreign_key_check`.
6. Review the exact remote D1 migration ledger and take a recoverable backup before any production migration.
7. Deploy only through the explicitly approved production release workflow.

The ten-point rating implementation and fresh/legacy SQLite migration tests exist on PR #173, but they are not yet integrated into the current-main route/security integration branch. The duplicate legacy POST /api/rating handler has been removed on the current integration branch; the active Worker schema and API remain 1–5 until migrations 0012–0035 and the complete ten-point UI/API/schema/test set are reconciled together. This register is a source-level integration plan only. No production D1 migration has been run and no production Worker deployment is authorized by this work.
