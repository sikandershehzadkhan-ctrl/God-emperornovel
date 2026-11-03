# Imperial Novel Phase 01N.19: Report Lifecycle and Schema Integrity

**Scope:** inspect report/comment schema lineage, deletion semantics, and moderation query paths; add non-destructive indexes for report queues.  
**Branch:** `architecture/phase-01n-master-route-registry`.  
**Production impact:** none. No Worker deployment, live D1 migration, or production data operation was performed.

## Findings

### 1. Report tables and migration lineage

- `reports` is introduced by migration `0003_finish_product.sql` with nullable `user_id`, `novel_id`, and `chapter_id`; it has no declared foreign keys.
- `comment_reports` is created by the runtime feature schema and migration `0019_comment_report_uniqueness.sql`. The migration deliberately has no foreign keys, preserving report evidence if the referenced account or comment is later removed.
- Migration `0018_comment_reports.sql` is a dependency-free placeholder. The migration directory listing on this branch skips `0012`; community schema creation therefore cannot be assumed to be fully represented by the ordered SQL migrations alone.
- The base migration `0001_initial.sql` declares cascading foreign keys for comments to users and novels. The runtime core bootstrap's comments table definition does not declare those same foreign keys. This is a schema-lineage divergence that requires a dedicated runtime/fresh-install reconciliation, not an unsafe blanket rebuild.

### 2. Deletion and retention policy

- Generic reports and comment reports are intentionally retained independently of their targets. The moderation queue uses LEFT JOINs so deleted or missing targets can still be reviewed.
- Do not cascade-delete report evidence when a user, comment, novel, or chapter is removed.
- Personal-data erasure must be handled separately: pseudonymize reporter identity where legally required while retaining only the minimum moderation/audit record permitted by the applicable retention policy. That policy still requires legal/product approval.
- No automatic orphan deletion or report retention expiry was introduced.

### 3. Query/index improvements

Added migration `0020_report_lifecycle_indexes.sql` with indexes for:
- generic report status/time ordering;
- per-user report history;
- novel and chapter reverse lookups;
- comment report status/time ordering;
- comment report target/status lookup.

The migration is additive and non-destructive. It does not delete, rewrite, or rebuild report rows.

### 4. Regression check

Added `scripts/test-report-lifecycle-migration.mjs` and included it in the package build validation chain. It checks the expected tables, index names, and non-destructive migration policy.

## Verification still required

- The new source-policy test has not yet been executed.
- No SQLite/D1 integration run has applied the complete migration sequence.
- No production schema introspection or `PRAGMA foreign_key_check` was performed.
- The migration gap at `0012` and runtime/core schema divergence must be reconciled before claiming fresh-install and upgrade parity.
- Query plans should be checked with `EXPLAIN QUERY PLAN` against representative report volumes.
- Account deletion and erasure flows need a separate, end-to-end retention review before any schema change to reporter identity.

## Decision

Preserve report evidence; expose orphan context to moderators; add read-path indexes without destructive cleanup. Treat migration/runtime parity and privacy erasure semantics as open release gates.
