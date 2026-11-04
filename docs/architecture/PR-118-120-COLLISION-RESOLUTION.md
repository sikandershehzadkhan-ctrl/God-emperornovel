# PR #118 / PR #120 canonical schema collision resolution

STATUS: reconciled in the canonical development integration branch

This document records the decisions that prevent the independent PR #118 and PR #120 migration histories from being concatenated or renamed blindly.

## Canonical migration ownership

| Feature | Historical branch-local migration | Canonical owner | Resolution |
| --- | --- | --- | --- |
| Community/runtime tables, comment likes/reports, reactions, request votes and legacy orphan/duplicate cleanup | PR #118 `0012_runtime_feature_schema.sql` | `0028_runtime_feature_integrity.sql` plus `src/runtime-feature-schema.mjs` | Reconciled, extended and kept idempotent. Do not reapply branch-local 0012. |
| Chapter update timestamps and feed index | PR #120 `0013_chapter_update_timestamps.sql` | `0029_chapter_update_timestamps.sql` | Canonical equivalent follows the account/media migration block. |
| Reader engagement metrics placeholder | PR #120 `0014_reader_engagement_metrics.sql` | No separate DDL required | Historical migration is intentionally a no-op because community tables are owned by PR #118; do not create a duplicate schema migration. |
| Daily novel/chapter view aggregates | PR #120 `0015_daily_view_analytics.sql` | `0030_daily_view_analytics.sql` | Canonical equivalent, aggregate-only and without reader identity/history. |
| Cross-device reading position | PR #120 `0016_reading_positions.sql` | `src/runtime-feature-schema.mjs` runtime schema v2 | Deliberately not imported. PR #120's `progress_percent` table conflicts with the established `percent` + `revision` optimistic-concurrency contract. |
| Ten-point ratings | PR #120 `0017_ten_point_ratings.sql` | `0034_ratings_baseline.sql` + `0035_ten_point_ratings.sql` | Replaced with a safe fresh-install baseline and one-time 1–5 to 1–10 mapping plus novel aggregate recomputation. |
| Comment reports placeholder | PR #120 `0018_comment_reports.sql` | `0028_runtime_feature_integrity.sql` | Historical migration is a no-op because PR #118 owns this table and its integrity safeguards. |
| Account closure | PR #120 `0019_account_closure_requests.sql` | `0031_account_closure_requests.sql` | Canonical equivalent retained after the other feature groups. |

## Reading-position contract: do not merge the conflicting table

The canonical runtime table has exactly one row per (user, novel), stores the active chapter and a bounded percentage, and carries a monotonically increasing revision:

- `user_id`, `novel_id`, `chapter_number`, `percent`, `revision`, `updated_at`.
- Primary key: `(user_id, novel_id)`.
- Percentage bounds: 0–100; chapter and revision are positive.
- Reads are scoped to the authenticated owner and published novel.
- Writes require a published novel and chapter.
- Updates use `WHERE reading_positions.revision=?`; stale concurrent writes return HTTP 409 and the latest owner-scoped position.

PR #120's independent `progress_percent` schema is not compatible with the API and would create a second source of truth. Its migration must not be renamed into the canonical chain. If the reader branch is revived, port its UI/API behavior to the existing `percent` + `revision` contract and test concurrent devices.

## Validation requirements

- Migration sequence guard checks globally unique four-digit migration numbers and duplicate normalized SQL payloads.
- Fresh SQLite replay checks `PRAGMA integrity_check` and `PRAGMA foreign_key_check`.
- Runtime schema tests verify the canonical community/runtime tables and reading-position schema.
- Reading-position API tests verify owner scoping, published-content checks, bounds, optimistic concurrency and conflict response.
- Production D1 ledger remains unaudited; this development reconciliation does not authorize production migration or deployment.
