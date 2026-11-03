# Imperial Novel Phase 01N.16: Comment Report Uniqueness

**Scope:** prevent duplicate comment reports by the same account for the same comment, including concurrent submissions and existing installations.  
**Production impact:** none from this work session. Source and migration files were committed on the architecture branch; no Worker deployment or live D1 operation was performed.

## Gap identified

The comment-report endpoint used `INSERT OR IGNORE` and checked for an existing `(user_id, comment_id)` pair. However, the runtime-created `comment_reports` table did not declare a unique constraint or index for that pair. Without a database constraint, two concurrent requests could both pass the prior-report check and insert duplicate rows.

## Changes committed

1. Added migration `0019_comment_report_uniqueness.sql`.
   - Creates the table if a fresh D1 install does not already have it.\n   - Removes duplicate legacy rows while retaining the lowest report ID for each account/comment pair.
   - Creates unique index `idx_comment_reports_user_comment` on `(user_id, comment_id)`.

2. Upgraded runtime schema marker from version 1 to version 2.
   - Existing installations marked version 1 will run the new deduplication and unique-index steps.
   - Installations already at version 2 take the fast path.
   - Runtime bootstrap retains the existing retry behavior if a schema step fails.

3. Added `scripts/test-comment-report-uniqueness.mjs`.
   - Checks endpoint duplicate handling and hourly account limit.
   - Checks the ordered migration and runtime upgrade both create the unique index after deduplication.

4. Extended `scripts/test-runtime-feature-schema.mjs`.
   - Verifies version 2 fast path.
   - Verifies deduplication, unique index creation and version marker update on bootstrap.

5. Added the new comment-report test to the package build validation chain.

## Data handling

If duplicate reports already exist, the migration/runtime upgrade retains the earliest row (lowest ID) for each user/comment pair and removes later duplicates. This is a deliberate deterministic cleanup, not a claim that duplicates were found in production.

## Verification boundary

The regression checks have been added but have not been executed in this environment. A disposable-D1 concurrency test is still needed to demonstrate behavior under simultaneous requests. Production schema and data were not inspected or changed.
