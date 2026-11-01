# Imperial Novel: D1 Migration and Runtime-Schema Reconciliation Audit

**Programme:** Phase 01N source reconciliation
**Status:** Static migration and bootstrap inspection; no D1 query or migration execution
**Branch:** `architecture/phase-01n-master-route-registry`
**Worker source:** `src/index.js` blob `13874ee0fde4e31e04a652c5169776c3b6f95c38`

## 1. Executive result

The inspected branch does not currently provide a self-contained, linear migration history: migration `0012_runtime_feature_schema.sql` is absent, while migrations `0014` and `0018` explicitly say their DDL is owned by that missing file. The Worker also creates core and feature tables/columns at runtime. This creates multiple schema authorities and makes clean install, migration-only install and existing-database upgrade parity an unproven assumption.

No production D1 state was inspected or modified. This audit does not establish which migration versions have actually been applied to the live database.

## 2. Migration inventory

| Migration | Purpose / objects | Static finding |
|---|---|---|
| `0001_initial.sql` | Initial users, sessions, novels, chapters, taxonomy, unlocks, bookmarks, history, donations, connectors, comments, requests, audit | Base schema; several ownership relations lack declared foreign keys |
| `0002_omniportal.sql` | Connector events, import jobs, recommendations | Additive integration tables |
| `0003_finish_product.sql` | Ticket ledger, follows, ratings, reports, notifications, settings | Ratings initially constrained to 1–5 |
| `0004_legal_publishing.sql` | Novel owner, publication and rights metadata columns | `owner_user_id` nullable; no FK added by this migration |
| `0005_chapter_publishing.sql` | Chapter publication status, chapter view table | Additive publication/statistics schema |
| `0006_rights_first_security.sql` | `content_rights`, `rights_audit_log` | Separate rights records; consistency with `novels.rights_status` and content ownership needs explicit policy |
| `0007_ai_author_studio.sql` | AI projects, jobs, generation runs, provider benchmarks, publish policies | Project/job ownership fields need FK and cross-table consistency review |
| `0008_discovery_community.sql` | Request votes | Additive community table |
| `0009_catalog_filter_indexes.sql` | Genre/tag reverse lookup and unlock index | Index-only |
| `0010_catalog_sort_indexes.sql` | Published catalog sort indexes | Index-only |
| `0011_author_applications.sql` | Author applications and indexes | Includes user/reviewer FKs, status check and one-pending partial unique index |
| `0012_runtime_feature_schema.sql` | Referenced by later migrations for community feature DDL | **Missing from inspected branch tree** |
| `0013_chapter_update_timestamps.sql` | Chapter updated_at, triggers and index | Runtime publishing bootstrap also adds related column/triggers/index |
| `0014_reader_engagement_metrics.sql` | Placeholder | No DDL; points to missing `0012` |
| `0015_daily_view_analytics.sql` | Novel/chapter daily aggregate tables | Additive; tables have no declared FKs in this migration |
| `0016_reading_positions.sql` | Per-user reading position | User FK and progress range check |
| `0017_ten_point_ratings.sql` | Rebuild ratings table with 1–10 check | Destructive table rebuild; requires backup and data-preservation test |
| `0018_comment_reports.sql` | Placeholder | No DDL; points to missing `0012` |

## 3. Runtime schema owners

`src/index.js` contains runtime schema initialization beyond the numbered migrations:

- `ensureCoreSchema(env)` creates/repairs the baseline schema and tracks a `core_schema_version` marker.
- `ensureRuntimeFeatureSchema(env)` delegates to `src/runtime-feature-schema.mjs`.
- `ensurePublishingSchema(env)` adds novel/chapter publication columns, indexes, chapter view storage and update triggers.
- `ensureEngagementSchema(env)` creates comment likes, novel reactions and supporting indexes.
- `ensureAuthorAISchema(env)` creates AI Author Studio tables and indexes.
- `ensureViewAnalyticsSchema(env)` creates daily view aggregate tables and indexes.
- Other helpers initialize OmniPortal and donation-reference structures.

`src/runtime-feature-schema.mjs` creates `auth_rate_limits`, `comment_likes`, `comment_reports`, `novel_reactions`, `request_votes`, adds `comments.parent_id` and `comments.edited_at`, and records its own runtime feature schema version.

Some of these structures are also represented in migration files or expected by migration comments. A database may therefore be initialized through more than one path.

## 4. Specific migration risks

### 4.1 Missing `0012` dependency

`0014_reader_engagement_metrics.sql` and `0018_comment_reports.sql` explicitly defer DDL to PR #118 migration `0012_runtime_feature_schema.sql`. That file is not present in the inspected branch tree. The migration directory is not independently reproducible as documented.

Required action: inspect the referenced PR/commit history and establish whether the missing file was omitted, renamed, superseded or never integrated. Do not fabricate a replacement migration from comments alone. Reconcile it with current runtime feature DDL and actual migration history first.

### 4.2 Dual DDL authority

Runtime bootstrap and numbered migrations both manage overlapping schema concerns. This can produce drift between:

- a fresh database initialized by `wrangler d1 migrations apply`;
- a database initialized by Worker runtime bootstrap;
- an existing production database upgraded over several releases;
- a local/test database whose schema was created by test helpers.

Required action: choose one authoritative schema-change mechanism. Preferred target is versioned, ordered migrations for structural changes, with runtime checks limited to read-only compatibility validation or a deliberately controlled one-time bootstrap.

### 4.3 Schema marker semantics

The inspected core bootstrap has a fast path keyed by a `core_schema_version` marker value `16.64.0`, while `package.json` and `wrangler.toml` declare application release `17.23.0`. This may be a schema-baseline marker rather than the application version, but that distinction and the required schema contract are not self-evident. A marker match must not be treated as proof that every table/index/column exists.

Required action: document schema version independently from app release, validate required objects and support safe forward migration.

### 4.4 Destructive ratings rebuild

`0017_ten_point_ratings.sql` creates a replacement table, copies rows whose rating is 1–10, drops the old table and renames the replacement. Before execution against any populated database, verify:

- all existing rating rows are valid and copied;
- indexes, triggers and foreign keys attached to `ratings` are recreated if required;
- foreign key enforcement and transaction behavior are correct in the target D1 environment;
- backup and restore are available;
- rollback is a forward corrective migration, not an assumption that the dropped table can be recovered.

### 4.5 Ownership and referential integrity

`owner_user_id` is nullable and the migration does not add a foreign key. Some initial tables, including history/bookmarks/follows/ledger and polymorphic rights records, also lack explicit FK constraints. This does not prove corruption, but it means the platform must audit orphaned rows and enforce ownership at the application boundary. Add constraints only after duplicate/orphan reports and a safe cleanup plan.

## 5. Required schema reconciliation process

1. Retrieve the full Git history and pull-request context for the missing `0012` reference.
2. Inventory every `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, trigger and schema marker in migrations and runtime helpers.
3. Build a canonical object matrix: object name, definition, owner, introduced version, migration path, runtime path, dependencies and consumers.
4. Compare the canonical matrix to a fresh local SQLite/D1-compatible schema built from migrations only.
5. Compare it to a schema produced by the documented bootstrap path.
6. Compare both to a sanitized schema-only export of the actual target D1 database, obtained through authorized Cloudflare tooling. Do not export user rows for this task.
7. Resolve missing objects, duplicate DDL owners, drift and orphaned relationships.
8. Add migration tests for clean install, sequential upgrade, interrupted migration/retry, existing schema, and rollback/recovery.
9. Only then prepare additive or carefully staged corrective migrations.

## 6. Automated schema tests required

- Migration directory contains every referenced migration and strictly ordered IDs.
- Clean install from migrations produces every required table, column, index and trigger.
- Runtime bootstrap does not create a divergent schema or silently swallow DDL failures.
- Re-running safe initialization is idempotent.
- Migration interruption/retry has a documented safe outcome.
- Schema marker cannot report success when required objects are missing.
- Ratings 1–10 survive migration with counts and values unchanged.
- Foreign key checks and orphan reports are clean or explicitly waived with a plan.
- Existing production schema snapshot matches the canonical expected schema before release.
- Backup restore is tested before any destructive or table-rebuild migration.

## 7. Disposition

**Result:** migration history and runtime schema ownership are not yet reconciled. The missing `0012` dependency and dual schema initialization must be resolved before schema-changing implementation or production migration.

**Not performed:** no D1 migration applied, no live database read, no user data exported, no source code changed, no production deployment.

---

**Next:** establish the missing migration's history and design a repeatable route-level test harness. Keep source and production unchanged until these checks can be run safely.