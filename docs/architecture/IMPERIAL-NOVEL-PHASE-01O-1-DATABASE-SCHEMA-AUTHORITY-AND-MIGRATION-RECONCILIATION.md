# Imperial Novel | Phase 01O.1: Database Schema Authority & Migration Reconciliation

**Review date:** 2026-11-01  
**Repository ref:** `architecture/phase-01m-screen-blueprint`  
**Related candidate:** `fix/community-schema-foundation-001`  
**Status:** Evidence-backed design decision. No schema or application changes made.

## 1. Decision

The repository currently has multiple schema authorities:
1. numbered SQL migrations;
2. runtime DDL in `src/index.js`;
3. runtime DDL in `src/runtime-feature-schema.mjs`;
4. a divergent branch's candidate migration `0012_runtime_feature_schema.sql`;
5. migration comments that assume that candidate is integrated.

This is not a safe long-term deployment model. **The target authority shall be versioned, ordered SQL migrations.** Runtime request handlers must not create/alter domain schema. Runtime code may read schema version and fail with a clear compatibility error, but must not silently repair production schema.

This is a target decision, not an implemented state. Do not delete runtime helpers or apply migrations until a tested compatibility plan exists for existing D1 databases.

## 2. Evidence captured

### 2.1 Baseline migration 0001

On the architecture branch, `migrations/0001_initial.sql` creates users, sessions, novels, chapters, genres, tags, novel_genres, novel_tags, unlocks, unlock_batches, bookmarks, history, donations, connectors, comments, novel_requests and audit_logs, plus initial indexes.

It does **not** create:
- `app_settings`;
- `publication_status` on novels or chapters;
- `ratings`;
- `ticket_ledger`;
- `follows` and `user_library`;
- the broader notifications/agents/AI/OmniPortal/analytics feature schema.

Those objects are introduced by the runtime core bootstrap in `src/index.js` (or by later runtime helpers/migrations where applicable).

### 2.2 Runtime core bootstrap

`ensureCoreSchema` in `src/index.js` creates a broad baseline of tables, indexes, app settings, ratings with a 1–10 CHECK, and then invokes publishing, taxonomy, agents and AI schema helpers. It records `core_schema_version=16.64.0`.

Important behavior:
- The helper short-circuits when the marker equals 16.64.0.
- A package version such as 17.23.0 is not the same thing as the database schema version.
- The runtime helper contains DDL and data seeding, including taxonomy and agent setup.
- It seeds a deployment-demo novel and 120 placeholder chapters when the novels table is empty. That seed behavior is not a migration and must be separately reviewed before any clean-install test is run against a database whose expected content matters.

### 2.3 Publishing schema helper

`ensurePublishingSchema` adds novel columns including `owner_user_id`, `publication_status`, rights evidence/review fields, and chapter `publication_status` and `updated_at`. It also creates chapter views, indexes and triggers.

The helper is called from the core bootstrap and from some request paths. It is a runtime schema owner today.

### 2.4 Feature schema helper

`src/runtime-feature-schema.mjs` creates:
- `auth_rate_limits` and its window index;
- `comment_likes`;
- `comment_reports`;
- `novel_reactions` and its index;
- `request_votes` and its index;
- `comments.parent_id` and `comments.edited_at` columns.

It uses `runtime_feature_schema_version=1` in `app_settings` as a fast-path marker. It has no foreign keys on some of the created tables, while the candidate SQL migration adds foreign keys, unique constraints, data cleanup and triggers. Therefore the runtime and candidate migration are not equivalent definitions.

### 2.5 Numbered migration dependencies

| Migration | Observed operation | Dependency / issue |
|---|---|---|
| 0001 | Initial core tables | Does not create app_settings, ratings or publication columns |
| 0009 | Reverse lookup indexes | Depends on base genre/tag/unlock tables from 0001 |
| 0010 | Published catalog sort indexes | Requires novels.publication_status |
| 0011 | Author applications | Depends on users |
| 0012 | Missing on architecture branch | Feature helper exists; candidate SQL exists on divergent branch |
| 0013 | Chapter updated_at, trigger and index | Adds updated_at, but trigger/index also reference chapters.publication_status |
| 0014 | No-op slot | Comment delegates community DDL to candidate 0012 |
| 0015 | No-op slot | Inspect actual file before adoption; do not infer from filename |
| 0016 | reading_positions | Depends on users |
| 0017 | Rebuilds ratings for integer 1–10 | Requires ratings table and compatible columns before copy/drop |
| 0018 | No-op slot | Comment delegates comment_reports to candidate 0012 |

The numbered sequence is not self-sufficient as a clean install. Migration 0010 cannot run immediately after 0001 because publication_status is absent. Migration 0013 has a similar dependency. Migration 0017 expects a ratings table that 0001 does not create.

### 2.6 Community candidate branch

The divergent branch `fix/community-schema-foundation-001` contains `migrations/0012_runtime_feature_schema.sql` (blob SHA `765a5ad7790181f22b41dedaa3ddb8b82d9e7b25`). It defines feature tables, foreign keys, unique comment-report constraints, legacy duplicate/orphan report archiving, cleanup, validation/cascade triggers and indexes.

This is a candidate only. It differs from runtime helper definitions:
- candidate `comment_reports` has UNIQUE(user_id,comment_id) and foreign keys; runtime helper does not;
- candidate `comment_likes` has foreign keys; runtime helper does not;
- candidate `request_votes` has foreign keys; runtime helper does not;
- candidate archives and deletes legacy duplicate/orphan reports; runtime helper does not perform that reconciliation;
- candidate adds integrity triggers that runtime helper lacks.

The candidate's data-cleanup behavior must be reviewed with fixtures and retention approval. Do not merge the divergent branch wholesale.

## 3. Deployment workflow reconciliation

The audited workflow has a production preflight that checks the expected base objects, including `novels.publication_status`, before applying migration 0009, 0010 and 0011. It then verifies the indexes and author application table before deploying.

This is a guarded incremental production path, not proof that the complete numbered migration chain can initialize a clean database. It assumes production already has a compatible runtime-created schema. The workflow's explicit migration scope (0009–0011) also does not automatically apply later numbered files 0013–0018.

A separate clean-install migration test is still required. The exact CI test topology must be recorded rather than described generically as a workflow preflight.

## 4. Target schema ownership model

### 4.1 Authority
- Numbered SQL migrations are the only schema authority.
- Each migration is immutable once released.
- Each migration has a unique sequence, descriptive name, checksum and review record.
- A schema inventory is generated from the actual resulting SQLite schema.
- D1 migration history and actual schema objects must agree.
- Application version and database schema version are separate values.

### 4.2 Runtime behavior
- Remove runtime DDL from request paths only after equivalent migration coverage is deployed and verified.
- Runtime code checks required schema compatibility at startup/health readiness or a cached safe boundary.
- On incompatible schema, return a clear unavailable/maintenance response for affected operations. Do not attempt best-effort ALTER TABLE.
- Do not run taxonomy seeding, placeholder novel seeding or AI/agent setup as an accidental side effect of an ordinary API request.
- Data seeding is an explicit, separately audited operation with deterministic fixtures.

### 4.3 Migration ordering target
The final sequence must be determined from full DDL and query dependency extraction. The likely dependency grouping is:
1. foundational identity/content/taxonomy/commerce tables;
2. core settings and schema marker;
3. publication and rights columns;
4. ratings table baseline with integer 1–10 constraint;
5. feature tables (auth rate limits, reactions, comment likes/reports, votes, comment threading);
6. analytics and reader progress;
7. author applications and creator domain;
8. OmniPortal/provider/import/recommendation structures;
9. AI author structures;
10. donation/payment indexes and financial controls;
11. all supporting indexes, triggers, constraints and backfills.

This is a dependency grouping, not a proposed numbered migration file list. Exact ordering follows verified foreign keys, query references and safe data conversion.

## 5. Data-preservation rules

- Never edit a migration already applied to any environment.
- Never drop or rebuild a table until all dependent indexes, triggers, foreign keys and data transformations are inventoried.
- Before ratings table rebuild, verify all existing rows, invalid values, duplicate keys, triggers and references; record counts and a reversible recovery strategy.
- Before comment report deduplication, archive the complete original record and define retention/access policy.
- Do not delete orphan interaction rows without recording counts and proving the rows cannot be reconciled.
- Preserve IDs and relationships for users, novels, chapters, unlocks, ticket ledger, bookmarks, reading positions and author applications.
- Financial history is append-only; corrections use compensating ledger entries.
- Every backfill is bounded, resumable and idempotent.
- Test foreign-key behavior with D1's actual enforcement configuration, not SQLite assumptions alone.

## 6. Required schema inventory

For every table/column/index/trigger/constraint, capture:
- object name and owning domain;
- creation migration and introduction version;
- source file and current runtime DDL owner;
- referenced tables and columns;
- queries that read/write it;
- data sensitivity and retention;
- migration/backfill behavior;
- compatibility with prior app versions;
- test fixture and verification query.

Also inventory all DDL in:
- `src/index.js`;
- `src/runtime-feature-schema.mjs`;
- `src/donation-reference-index.mjs`;
- any additional runtime helpers discovered in the full repository tree.

## 7. Verification plan before any schema repair

1. Freeze a canonical source SHA for the intended release base.
2. Obtain a complete migration file inventory from that SHA.
3. Build a fresh SQLite fixture from migrations only.
4. Run each migration in exact lexical order and stop at the first failure.
5. Build a legacy fixture matching the supported production schema and migration history.
6. Apply the upgrade path to the legacy fixture.
7. Compare complete `sqlite_master` object inventory and `PRAGMA table_info` outputs.
8. Verify indexes, triggers, foreign keys, unique constraints and CHECK constraints.
9. Exercise app queries against the migrated schema.
10. Verify data preservation and idempotency.
11. Run equivalent tests against a disposable D1 database.
12. Only then design an additive production migration and a staged runtime-DDL removal release.

Do not run a test that writes to production D1. Do not infer live production schema from repository files.

## 8. Open decisions

- Which immutable source branch/SHA is the actual production baseline?
- Is the community candidate migration 0012 approved after data-cleanup review?
- What exact SQL currently creates every OmniPortal, AI, taxonomy, donation, analytics and agent object?
- What production schema version and migration history are actually installed?
- Which historic runtime-created structures need a one-time baseline adoption migration?
- Should the placeholder demo novel seeding be removed from the normal bootstrap and replaced with an explicit development fixture?
- What is the approved backup/restore and forward-recovery procedure?

## 9. Gate

**Schema repair remains blocked** until a full file inventory, clean-install test, supported upgrade fixture and production schema evidence are available. The next architecture task is to complete the DDL ownership inventory and produce the migration dependency graph. No source code, SQL migration, D1 data or production configuration was changed.
