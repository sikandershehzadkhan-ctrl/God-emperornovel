# Canonical migration collision register

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

The ten-point rating feature is now integrated at source level and its fresh/legacy migration paths have dedicated regression coverage. This branch remains a source-level integration candidate; it does not claim that production D1 has been migrated or that the production Worker has been deployed.
