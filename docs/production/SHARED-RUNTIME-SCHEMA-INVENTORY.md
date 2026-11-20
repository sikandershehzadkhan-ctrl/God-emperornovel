# Shared runtime schema inventory and migration blockers

Status: **AUDITED IN SOURCE; PRODUCTION STATE UNKNOWN; RUNTIME DDL NOT YET REMOVED**

Date: 2026-11-20
Audited source: `src/index.js` and `src/runtime-feature-schema.mjs` at the canonical migration integration candidate.

## Why this inventory exists

The API dispatcher invokes `ensureCoreSchema(env)` and `ensureRuntimeFeatureSchema(env)` before normal API route dispatch. The health endpoint returns before those initializers. The Worker also invokes `ensureCoreSchema(env)` from its scheduled handler. The core initializer uses the `core_schema_version` marker to skip its bootstrap after it has been initialized, while the runtime-feature initializer uses `runtime_feature_schema_version`.

This means the current API request path is not universally read-only: on a database without the expected markers, initialization can issue DDL and DML before a GET handler runs. Passing route-local GET tests does not prove whole-request read-only behavior.

Do not remove either shared initializer until the remote production schema and applied migration history have been inspected, the items below have been reconciled, and a production-shaped rehearsal has passed.

## Source-to-migration coverage confirmed

| Runtime initializer responsibility | Canonical migration coverage | Audit result |
|---|---|---|
| Core identity, session, novel, chapter, taxonomy, reading, finance, notification, agent and settings baseline tables | `0001_initial.sql` through `0003_finish_product.sql` | Baseline structures are represented in the canonical chain. Verify the actual production columns and constraints remotely. |
| Novel ownership, publication and rights-review columns/index | `0004_legal_publishing.sql` | Covered by migration source. |
| Chapter publication column/index and `chapter_views` | `0005_chapter_publishing.sql` | Covered by migration source. |
| Author Studio AI project, job, run, benchmark and publish-policy tables | `0007_ai_author_studio.sql` | Covered by migration source. |
| Auth rate limits, comment likes/reports, novel reactions, request votes and their integrity rules | `0028_runtime_feature_integrity.sql` | Covered by migration source. Existing lazily-created tables may have weaker original definitions; migration 0028 adds integrity triggers/indexes and performs its documented cleanup. Remote state still needs inspection. |
| Connector events, import jobs and recommendations | `0002_omniportal.sql`, replay-safe support in `0048_omniportal_runtime_support.sql` | Covered by migration source. |
| Connector authorization requests | `0048_omniportal_runtime_support.sql` | Covered by migration source. |

## Outstanding schema debt found in the live Worker source

These are concrete DDL operations still present in the runtime initializers and not yet represented by a verified, production-reconciled canonical migration:

1. **Comments columns:** `comments.parent_id INTEGER` and `comments.edited_at TEXT`, added by `createRuntimeFeatureSchemaEnsurer()` in `src/runtime-feature-schema.mjs`.
2. **Community taxonomy proposals:** `taxonomy_submissions`, created by `ensureCommunityTaxonomySchema()` in `src/index.js`.
3. **Optional connector configuration columns:** `connectors.search_url`, `auth_header`, `secret_name`, `rights_evidence_url`, `terms_url`, `rights_notes`, `metadata_import_allowed`, and `attribution_required`, added by `ensureOmniTables()` in `src/index.js`.

Migration 0048 intentionally provisions the four OmniPortal support tables but does not claim to provision these optional connector columns. Do not infer that they exist in production merely because the runtime initializer attempts to add them.

## Runtime side effects to preserve or deliberately replace

- `ensurePublishingSchema()` backfills blank publication status values and creates `chapter_views`; its structural pieces are represented by migrations 0004 and 0005. Confirm the backfill outcome remotely before removing the runtime path.
- `ensureRuntimeFeatureSchema()` deletes expired auth-rate-limit rows and writes the `runtime_feature_schema_version` marker after its DDL. A migration-only replacement must retain a deliberate, bounded cleanup policy without making GET handlers mutate the database.
- `ensureCoreSchema()` seeds taxonomy and agents, inserts the default ticket-pack setting, and writes bootstrap/version markers. Separate required reference-data provisioning from schema migration before removing this initializer.
- `ensureOmniTables()` currently catches individual connector-column ALTER errors and suppresses its support-table batch failure. This legacy behavior is not a substitute for a deterministic migration with explicit failure semantics.
- The scheduled Worker entrypoint calls `ensureCoreSchema()`; replacing the API initializer alone would leave scheduled execution with a schema-bootstrap path.

## Required next sequence

1. Run the explicitly approved, manually gated, read-only production D1 audit. Capture table/column/index/trigger/view definitions, foreign-key checks, schema markers and any migration ledger. No write command is authorized by this inventory.
2. Reconcile each outstanding item against the exact production schema. Record whether each column/table already exists, its definition, and whether its origin was a prior migration or runtime bootstrap.
3. Allocate new, never-reused migration sequence numbers for any missing canonical structures. Design additive/rebuild steps only after the production definitions and data are known. Do not revive retired migration 0047.
4. Rehearse the exact remaining migrations and any data/reference seeding on a production-shaped disposable database. Verify rollback/recovery separately.
5. Replace the runtime DDL with explicit migration-owned schema and a deliberate reference-data/bootstrap process. Keep GET request paths free of schema writes.
6. Add tests proving the Worker dispatcher and scheduled entrypoint no longer invoke runtime DDL after the migration cutover.
7. Only then consider marking the complete HTTP GET path read-only and removing the legacy initializers.

## Safety boundary

- No remote D1 query was run as part of this source audit.
- No production D1 data or schema was changed.
- No migration was applied to production.
- No Worker deployment was performed.
- The source inventory is not evidence of the production database's current state.
