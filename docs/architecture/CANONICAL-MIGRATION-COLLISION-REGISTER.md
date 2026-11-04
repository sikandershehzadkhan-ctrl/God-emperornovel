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
| 0016_reading_positions.sql | not yet ported | Blocked by a real schema/API collision described below. |
| 0017_ten_point_ratings.sql | not yet ported | Blocked until the table lifecycle and API validation are migrated together. |
| 0018_comment_reports.sql | none | Intentionally omitted: source file is comment-only; comment-report schema is owned by 0028. |
| 0019_account_closure_requests.sql | 0031_account_closure_requests.sql | Ported. |

## Confirmed schema collisions that must not be papered over

### Reading positions

The canonical runtime schema on the media branch creates `reading_positions` with one row per (user, novel), columns `percent` and `revision`, and optimistic-concurrency updates. The incoming branch migration defines a different table with one row per (user, novel, chapter), column `progress_percent`, and no revision token.

Both definitions cannot safely own the same table name. A simple migration-number rename would leave the Worker queries and database contract inconsistent. The incoming per-chapter feature must be ported to a separately named table (for example `reader_chapter_positions`) and its API/UI queries updated in the same change, or the canonical contract must be deliberately redesigned with a tested data migration.

### Ten-point ratings

The canonical Worker lazily creates `ratings` with a 1–5 CHECK constraint. The incoming migration rebuilds `ratings` for 1–10 but assumes that the table already exists, while a fresh D1 migration replay does not create it before the rebuild. The endpoint also currently validates 1–5 on the canonical branch. This feature requires a coordinated migration that supports both fresh and existing databases, plus API/UI/test changes to 1–10. It is not safe to port the SQL alone.

## Release requirements

1. Run the full Cloudflare Source Validation workflow against this branch, including fresh SQLite replay and migration integrity checks.
2. Add legacy-schema upgrade fixtures for runtime-created community tables, including duplicate and orphan reports.
3. Add a legacy-schema fixture for existing `reading_positions` and prove the new per-chapter table does not overwrite or reinterpret it.
4. Add fresh-install and existing-install fixtures for the ratings transition before enabling ten-point ratings.
5. Verify `PRAGMA integrity_check` and `PRAGMA foreign_key_check`.
6. Review the exact remote D1 migration ledger and take a recoverable backup before any production migration.
7. Deploy only through the explicitly approved production release workflow.

This branch is a source-level integration candidate. It does not claim that all reader features are integrated, that the production database has been migrated, or that the production Worker has been deployed.
