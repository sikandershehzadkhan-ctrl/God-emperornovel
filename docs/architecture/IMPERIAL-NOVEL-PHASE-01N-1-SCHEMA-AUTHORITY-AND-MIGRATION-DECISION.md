# Imperial Novel | Phase 01N.1: Schema Authority & Migration Decision Record

**Status:** Proposed decision for architecture review; not approved for implementation.  
**Evidence ref:** Phase 01N repository evidence audit, same branch.  
**Scope:** D1/SQLite schema evolution and release preflight.

## 1. Problem statement

The audited Worker currently distributes schema creation across:
- numbered SQL migrations;
- `ensureCoreSchema` with `core_schema_version=16.64.0`;
- `ensurePublishingSchema`;
- runtime feature schema helper;
- OmniPortal, AI Author Studio, analytics, engagement, taxonomy and donation helpers;
- request-time table/column creation and alteration.

This creates multiple sources of truth. A fresh install, an existing production database and a new Worker isolate can encounter different schema paths.

A specific incompatibility was identified:
- `migrations/0001_initial.sql` creates `novels` without `publication_status`.
- `migrations/0010_catalog_sort_indexes.sql` creates indexes that reference `novels.publication_status`.
- `ensurePublishingSchema` adds that column at runtime.
- The deployment workflow's clean SQLite preflight applies numbered SQL files without running the Worker runtime helper.

The SQL-only clean-install check therefore appears unable to apply the current migration set in order. This must be reproduced in CI before a remediation is selected.

## 2. Decision goals

1. One authoritative schema version and migration history.
2. Deterministic fresh-install and upgrade paths.
3. No destructive production migration without verified backup/recovery.
4. No hidden schema writes during ordinary user requests.
5. No schema marker advance unless every required operation succeeds.
6. Migration tests use the same ordered artifacts that production applies.
7. Production preflight checks actual schema state and expected migration history.
8. App release version and database schema version are separate concepts.
9. Existing customer/content/financial data remains intact.
10. Rollback strategy is explicit; for SQLite changes, prefer forward-fix where rollback is unsafe.

## 3. Proposed target model

### 3.1 Numbered migrations become canonical

Use `migrations/*.sql` as the authoritative, ordered schema history. Every structural change receives a new migration number. Never silently rewrite a migration already applied to a shared environment.

Migration metadata must record:
- stable migration identifier and filename;
- checksum/hash;
- application timestamp;
- deployment/release reference;
- outcome and error;
- operator/workflow identity.

Use the Cloudflare D1 migration tracking mechanism consistently. Do not maintain a separate application-level schema marker as an independent authority unless it is explicitly derived from the migration ledger and verified against it.

### 3.2 Runtime schema helpers become transitional compatibility only

After all runtime-created structures have been represented in numbered migrations:
- remove request-time schema DDL from normal API handlers;
- remove duplicate schema creation paths;
- keep only a temporary read-only schema compatibility check where needed;
- fail closed with a safe diagnostic if required schema is missing;
- remove legacy bootstrap only after production parity is verified and a staged release has completed.

No request handler should opportunistically run `ALTER TABLE` or create a domain table as a side effect of reading a page.

### 3.3 Versioning

Maintain independent values:
- `APP_VERSION`: application release, e.g. 17.23.0.
- `DB_SCHEMA_VERSION`: latest applied migration identifier.
- optional `MIN_COMPATIBLE_APP_SCHEMA`: minimum database schema supported by a Worker release.

A Worker must check compatibility before serving writes. It must not assume that package version equals database version.

## 4. Remediation options for the current 0010 dependency

The following options require testing and production-schema verification. None is approved by this document.

### Option A: Repair fresh-install bootstrap ordering

Create a deterministic pre-0010 bootstrap step that ensures required publication columns exist before the sort-index migration runs, while remaining safe for both fresh and already-upgraded D1 databases.

This likely requires a carefully designed idempotent migration/bootstrap mechanism. SQLite's column-add behavior and D1 migration execution must be tested. Do not add a naive `ALTER TABLE ADD COLUMN` migration that fails when the column already exists.

### Option B: Rebuild a corrected baseline for new installations

Define a new canonical baseline/squash artifact for brand-new databases while preserving historical migrations for existing environments. This requires a clear distinction between fresh-install bootstrap and upgrade migration paths, plus checksum and lineage validation. Do not simply edit 0001 and assume already-migrated production will be reconciled.

### Option C: Change preflight to model the real supported install path

If runtime bootstrap is deliberately part of the supported install path, the CI preflight must execute the exact same bootstrap logic and then apply the same migrations in the exact production order. This is less desirable as a long-term architecture because it preserves split ownership, but may be a safe transitional bridge if the current production baseline depends on it.

### Option D: Remove/rework the dependent index migration

Only consider if query plans and measured catalog performance justify it. Any replacement must preserve the required index behavior and be safe on both fresh and upgraded databases. Do not silently drop production indexes.

## 5. Required evidence before choosing an option

- Exact current main branch migration file inventory and checksums.
- Current production D1 migration history from Wrangler.
- Read-only production `sqlite_master` and `PRAGMA table_info` inventory for all affected tables.
- Current production `core_schema_version` and runtime feature schema marker.
- Confirmation whether migrations 0009, 0010 and 0011 have been applied to production.
- Clean SQLite reproduction of the migration sequence, including exact failure output.
- Cloudflare D1 compatibility test for the selected conditional/additive operation.
- A staging D1 copy or isolated test database proving fresh install and upgrade paths.
- Data preservation and rollback/forward-recovery plan.

No production database query was performed in Phase 01N.

## 6. Migration inventory work still required

Build an authoritative inventory from:
- every numbered migration;
- every `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, trigger and seed statement in Worker helpers;
- all imported schema helper modules;
- all `ensure*Schema` and `ensure*Tables` call sites;
- all SQL queries referencing columns;
- deploy workflow migration and verification commands.

For each object, record its first creation, later alteration, owner domain, migration identifier, runtime dependencies, indexes, foreign keys, expected nullability/defaults, and removal policy.

Detect:
- objects created in both migration and runtime code;
- tables created only at runtime;
- columns referenced before they are added;
- indexes that depend on runtime-added columns;
- CHECK/foreign-key differences between baseline and runtime CREATE TABLE statements;
- marker version drift;
- code paths that suppress DDL errors.

## 7. Required acceptance gates

1. All numbered migrations apply to a clean SQLite database in lexical order.
2. The same migration sequence applies to a clean D1 test database.
3. Upgrade from each supported historical schema state preserves all rows.
4. Applying the migration set twice is either safely prevented by D1 migration tracking or idempotent by design.
5. No application request performs schema DDL after the migration consolidation phase.
6. Worker refuses incompatible schema with a safe diagnostic rather than a cascade of SQL errors.
7. Migration checksum/history mismatch blocks deployment.
8. App version and schema version can advance independently.
9. Backup/restore or forward-recovery is tested for every destructive or table-rebuild migration.
10. Workflow migration checks run before deployment; post-deploy checks verify actual indexes, columns and migration history.
11. The production deploy remains manually confirmed and cannot run from push/PR events.
12. No live data, payment ledger or content record is modified by schema preflight.

## 8. Proposed decision

**Provisional direction:** Adopt numbered D1 migrations as the single long-term schema authority; use runtime schema helpers only as a temporary compatibility bridge; do not choose a remediation for migration 0010 until current production migration history and schema are verified and the clean-install failure is reproduced.

This direction is an architecture recommendation, not implementation approval. No migration file, Worker source, D1 database, workflow, production setting or deployment was changed.
