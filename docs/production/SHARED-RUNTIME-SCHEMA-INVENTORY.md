# Shared runtime schema inventory and migration blockers

Status: **AUDITED IN SOURCE; PRODUCTION STATE UNKNOWN; RUNTIME DDL NOT YET REMOVED**

Date: 2026-11-20
Audited source: `src/index.js` and `src/runtime-feature-schema.mjs` at the canonical migration integration candidate.

Architecture decision: [ADR-0040](../architecture/decisions/ADR-0040-shared-runtime-schema-inventory-before-cutover.md).

## Why this inventory exists

The API dispatcher invokes `ensureCoreSchema(env)` and `ensureRuntimeFeatureSchema(env)` before normal API route dispatch. The health endpoint returns before those initializers. The Worker also invokes `ensureCoreSchema(env)` from its scheduled handler. The core initializer uses the `core_schema_version` marker to skip its bootstrap after it has been initialized, while the runtime-feature initializer uses `runtime_feature_schema_version`.

This means the current API request path is not universally read-only: on a database without the expected markers, initialization can issue DDL and DML before a GET handler runs. Passing route-local GET tests does not prove whole-request read-only behavior.

Do not remove either shared initializer until the remote production schema and applied migration history have been inspected, the items below have been reconciled, and a production-shaped rehearsal has passed.

## Source-to-migration coverage confirmed

| Runtime initializer responsibility | Canonical migration coverage | Audit result |
|---|---|---|
| Core identity, session, novel, chapter, base genres/tags taxonomy, reading, finance, notification and settings baseline tables | `0001_initial.sql` through `0003_finish_product.sql` | Baseline structures are represented in the canonical chain. Verify the actual production columns and constraints remotely. |
| Novel ownership, publication and rights-review columns/index | `0004_legal_publishing.sql` | Covered by migration source. |
| Chapter publication column/index and `chapter_views` | `0005_chapter_publishing.sql` | Covered by migration source. |
| Author Studio AI project, job, run, benchmark and publish-policy tables | `0007_ai_author_studio.sql` | Covered by migration source. |
| Auth rate limits, comment likes/reports, novel reactions, request votes and their integrity rules | `0028_runtime_feature_integrity.sql` | Covered by migration source. Existing lazily-created tables may have weaker original definitions; migration 0028 adds integrity triggers/indexes and performs its documented cleanup. Remote state still needs inspection. |
| Connector events, import jobs and recommendations | `0002_omniportal.sql`, replay-safe support in `0048_omniportal_runtime_support.sql` | Covered by migration source. |
| Connector authorization requests | `0048_omniportal_runtime_support.sql` | Covered by migration source. |
| Pending connector authorization uniqueness | `0049_unique_pending_connector_authorization.sql` | Partial unique index is covered by migration source; production preflight must find zero duplicate pending groups before application. |

## Outstanding schema debt found in the live Worker source

These are concrete DDL operations still present in the runtime initializers and not yet represented by a verified, production-reconciled canonical migration:

1. **Comments columns:** `comments.parent_id INTEGER` and `comments.edited_at TEXT`, added by `createRuntimeFeatureSchemaEnsurer()` in `src/runtime-feature-schema.mjs`.
2. **Novel review columns:** `novels.review_feedback TEXT`, `novels.reviewed_by INTEGER`, and `novels.reviewed_at TEXT`, added by `ensurePublishingSchema()` in `src/index.js`. Migration 0004 covers the other publication/rights columns but not these three review fields.
3. **Agent registry tables:** `agents`, `agent_runs`, and `idx_agent_runs_agent`, created by the core initializer in `src/index.js`. These are used by the local agent registry and run history; the inspected baseline migrations 0001–0011 do not define them.
4. **Community taxonomy proposals:** `taxonomy_submissions`, created by `ensureCommunityTaxonomySchema()` in `src/index.js`.
5. **Optional connector configuration columns:** `connectors.search_url`, `connectors.auth_header`, `connectors.secret_name`, `connectors.rights_evidence_url`, `connectors.terms_url`, `connectors.rights_notes`, `connectors.metadata_import_allowed`, and `connectors.attribution_required`, added by `ensureOmniTables()` in `src/index.js`.

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

- The production audit workflow now captures complete schema-object SQL, foreign-key violations, the outstanding agent/taxonomy/connector review columns, and migration 0049 index presence. These are audit capabilities only; the workflow has not been dispatched.

No remote D1 query was run as part of this source audit.
- No production D1 data or schema was changed.
- No migration was applied to production.
- No Worker deployment was performed.
- The source inventory is not evidence of the production database's current state.


## Detailed cutover ownership map (source inspection, 2026-11-21)

This section expands the outstanding list into migration design inputs. It is not a migration reservation, an applied-migration ledger, or evidence about production D1.

| Runtime source / responsibility | Canonical owner candidate | Required migration or cutover treatment | Data and behavior safeguards |
|---|---|---|---|
| `ensurePublishingSchema()`: `novels.review_feedback`, `reviewed_by`, `reviewed_at` | publishing | Add the three missing review columns and verify the existing publication/rights columns and indexes are already owned by 0004; do not duplicate them | Preserve every existing review value; additive nullable/default-compatible columns only after remote schema inspection |
| `ensureRuntimeFeatureSchema()`: `comments.parent_id`, `comments.edited_at` | community | Add both columns; confirm the other feature tables and integrity indexes/triggers are already covered by 0028 | Preserve comment rows and existing moderation state; test parent references, edit timestamp behavior, and foreign-key policy |
| `ensureCoreSchema()`: `agents`, `agent_runs`, `idx_agent_runs_agent` | platform-data / automation | Provision tables and index in canonical migrations; keep agent catalogue population as a separately versioned, idempotent reference-data operation | Preserve existing run history; do not reset agent status, enablement, or last-run fields during seeding |
| `ensureCommunityTaxonomySchema()`: `taxonomy_submissions` | community | Provision the table and its uniqueness/index requirements in a canonical migration | Preserve proposal, submitter, reviewer, status and timestamps; retain pending/rejected history |
| `ensureOmniTables()`: eight optional `connectors` columns | OmniPortal / platform-data | Add the eight columns through a deterministic migration with explicit failure behavior; 0048 owns the four support tables and 0049 owns pending-request uniqueness, not these columns | Preserve connector configuration; keep all connectors disabled unless separately authorized; never swallow ALTER failures |
| `ensureOmniTables()`: connector events, import jobs, recommendations, connector authorization requests and indexes | platform-data | Already represented by 0048; verify exact production definitions and 0049 index before removing runtime creation | Do not recreate or overwrite existing rows; preserve user attribution and job history |
| `ensureAuthorAISchema()`: AI project/job/run/benchmark/policy tables and indexes | ai | Already represented by 0007 plus later additive AI migrations including 0046; verify exact production definitions and all current indexes | Preserve projects, jobs, generation history, policy settings and active run fencing; no destructive rebuild without a production-shaped rehearsal |
| `ensurePublishingSchema()`: publication backfills and `chapter_views` | publishing | Structural ownership is 0004/0005; move any required backfill into a separately reviewed, bounded data migration or verified one-time data operation | Measure affected rows first; preserve existing publication choices; prove idempotency |
| `ensureRuntimeFeatureSchema()`: expired auth-rate-limit cleanup and schema marker | identity / platform-data | Remove schema marker dependency after cutover; move expiry cleanup to a deliberate bounded scheduled maintenance task, not a GET request | Retain rate-limit protection; cleanup must be bounded, observable, and safe under concurrent scheduled invocations |
| `ensureCoreSchema()`: taxonomy and agent seeds, ticket-pack default, bootstrap markers | platform-data / community / automation | Separate schema from reference-data provisioning; define explicit versioned seed ownership and no-op behavior on already customized production data | Never overwrite administrator-edited settings, taxonomy, connector state, or agent configuration; do not create demo novels or chapters |
| scheduled handler: `ensureCoreSchema()` before automation | automation / platform-data | Replace implicit schema bootstrap with an explicit readiness check; scheduled jobs must fail closed and report missing schema rather than mutate DDL | A missing migration must be observable and must not trigger an implicit schema upgrade |

### Confirmed initializer call graph

- The API dispatcher calls `ensureCoreSchema(env)` and `ensureRuntimeFeatureSchema(env)` before ordinary route dispatch, after the special health-check early return.
- `ensureCoreSchema()` calls `ensurePublishingSchema()`, seeds taxonomy, creates community taxonomy schema, seeds agents, and creates Author Studio AI schema.
- `ensureOmniTables()` is still reachable from OmniPortal route paths and `seedOmni()`; it currently suppresses individual connector-column ALTER failures and suppresses its support-table batch failure.
- The scheduled handler calls `ensureCoreSchema()` before running automation.
- `ensureCoreSchema()` uses an in-memory isolate promise and a `core_schema_version` marker. `ensureRuntimeFeatureSchema()` uses an in-memory promise and a separate database marker. These markers are bootstrap shortcuts, not proof that every canonical migration has been applied.


### Route-level schema and seed side effects confirmed (2026-11-21)

The shared API initializers are not the only runtime-DDL entrypoints. Direct route-level call sites also need to be removed or converted to readiness checks during the same cutover:

| Route / execution path | Current source call | Side effect | Required cutover |
|---|---|---|---|
| `GET /api/admin/connectors` | `seedOmni(env)` | Calls `ensureOmniTables(env)`, then inserts missing registry connector rows | Make GET strictly read-only; move connector registry provisioning to an explicit, versioned, idempotent seed operation |
| `GET /api/admin/connector-authorization-requests` | `ensureOmniTables(env)` | Attempts eight ALTER TABLE statements and creates support tables/indexes | Replace with schema readiness check; return a clear unavailable response if migrations are missing |
| `PATCH /api/admin/connectors` | `ensureOmniTables(env)` | Performs DDL before updating connector configuration | Remove DDL from mutation route; require migration-owned schema |
| `POST /api/omni/import` | `ensureOmniTables(env)` | Performs DDL before inserting an import job | Remove DDL; require migration-owned schema |
| `POST /api/admin/omni/health` | `ensureOmniTables(env)` | Performs DDL before health checks and connector status updates | Remove DDL; require migration-owned schema |
| `POST /api/admin/connectors/cleanup` | `ensureOmniTables(env)` | Performs DDL before connector deduplication and related data updates | Remove DDL; require migration-owned schema |
| `POST /api/connector-authorization-requests` | `ensureOmniTables(env)` | Performs DDL before authorization request creation | Remove DDL; require migration-owned schema |
| `PATCH /api/admin/connector-authorization-requests/:id` | `ensureOmniTables(env)` | Performs DDL before authorization review | Remove DDL; require migration-owned schema |

Two important distinctions:

- The admin connector GET is both a schema side-effect and a reference-data write because `seedOmni()` inserts connector registry rows. Admin authentication does not make a GET read-only.
- The admin authorization-request GET invokes schema setup directly. This is a second route-level DDL path beyond the shared dispatcher bootstrap.

The existing public OmniPortal status/search/jobs GET handlers do not call `ensureOmniTables()` directly, but they still pass through the shared API dispatcher, which can invoke both shared schema initializers when their database markers are absent. Therefore they are not proof of whole-request read-only behavior.

These call sites were confirmed by source inspection of `src/index.js` on 2026-11-21. They remain blockers, not an authorization to change production schema or connector data.

### Migration allocation decision

Do not reserve 0050 until the exact production schema audit identifies which of the structures above are absent, partially present, or structurally divergent. Once known, allocate the next unused number in the global register before authoring. The likely business concepts span platform-data, publishing, community, and OmniPortal, so do not force all outstanding structures into one migration merely to consume one sequence number. Prefer separate domain-owned migrations where the schema and review ownership differ. Never reuse 0047.

### Cutover acceptance tests required before removing initializers

1. Fresh database: applying the canonical migration chain alone creates every required table, column, index, trigger and foreign key. No Worker request is needed to prepare schema.
2. Existing database rehearsal: use a production-shaped copy and exact remote schema findings; preserve all records, constraints, user settings, connector configuration, agent state, taxonomy submissions and AI job history.
3. API read-only dispatch: with a fully migrated database, ordinary GET requests do not execute CREATE, ALTER, DROP, schema marker writes, seed inserts, cleanup deletes, or other bootstrap DML.
4. Missing-schema fail-closed: remove a required object in a disposable fixture and verify the Worker reports a clear readiness failure without attempting runtime DDL.
5. Scheduled execution: a scheduled invocation performs a read-only schema readiness check and refuses to run automation if required schema is missing; it does not call any initializer.
6. Reference data: seed operations are explicit, versioned, idempotent and non-destructive to customized production rows. No demo novel/chapter content is inserted by production bootstrap.
7. OmniPortal: route handlers do not call `ensureOmniTables()`; all eight connector columns and 0048/0049 objects are migration-owned and verified.
8. Failure semantics: migration errors are surfaced; no catch-and-ignore DDL behavior remains.
9. Source guard: CI statically rejects calls to the removed initializers from API dispatch, route handlers and scheduled execution.
10. Rehearsal evidence: record migration checksums, before/after schema snapshots, row-count/data invariants, `PRAGMA integrity_check`, `PRAGMA foreign_key_check`, and a separately verified recovery/restore rehearsal.

### Explicit non-authorization

This source inspection does not authorize running the production audit workflow, applying migrations, writing production D1 data, enabling the deployment workflow, merging PR #374, or deploying the Worker. The release remains blocked until the read-only production audit is explicitly approved and the recovery/rehearsal gates are satisfied.


### Additional route-level DDL found: donation reference uniqueness (2026-11-21)

A further source pass found a runtime DDL path outside the OmniPortal initializer:

| Route / execution path | Current source call | Side effect | Required cutover |
|---|---|---|---|
| `POST /api/donations` | `ensureDonationReferenceIndex(env)` | Executes `CREATE UNIQUE INDEX IF NOT EXISTS idx_donations_reference_normalized ON donations(LOWER(TRIM(reference_id)))` before inserting a donation reference | Verify whether an equivalent canonical migration owns the exact expression index and its duplicate-data preflight; if absent, allocate a domain-owned migration only after production schema/data inspection. Remove route-time DDL after ownership and rollout are proven |

The helper in `src/donation-reference-index.mjs` memoizes the DDL promise per Worker isolate and retries after failure. This is still request-triggered schema mutation. It is a POST rather than a GET, but mutation handlers should not perform schema upgrades either: the migration must own the uniqueness invariant before the application relies on it.

The source inventory does not yet establish whether an equivalent expression index is present in every production environment or which canonical migration owns it. Do not assume that the runtime helper's existence proves production state. This finding expands the runtime DDL inventory and does not authorize production queries or changes.


### Deployment-demo content seeding removed from runtime bootstrap (2026-11-21)

The source audit confirmed that `seedTaxonomy()`, called by `ensureCoreSchema()`, previously inserted a demo novel titled **God-Emperor's Infinite Ascension** whenever the novels table was empty, then inserted 120 published placeholder chapters and genre/tag links. This was real runtime data mutation, not merely a dormant fixture.

The code path has now been removed from `seedTaxonomy()`. Taxonomy reference rows continue to use their existing idempotent `INSERT OR IGNORE` behavior; the bootstrap no longer creates demo novels or placeholder chapters. The change is additive with respect to existing data: it does not delete or alter any already-seeded demo novel, chapter, or user content. Any existing demo records require a separately reviewed content audit and explicit owner decision before cleanup.

A regression assertion now rejects reintroduction of the demo title or placeholder chapter body in the Worker source. This is source-level evidence only. No production D1 query or cleanup was performed.


### Runtime schema error suppression and bootstrap ordering (2026-11-21)

A closer inspection of the actual helper bodies found that the OmniPortal initializer does not provide reliable schema-readiness evidence:

- Each of the eight `ALTER TABLE connectors ADD COLUMN ...` statements is wrapped in an empty `catch {}`. Any failure is silently ignored, not only duplicate-column errors.
- The `CREATE TABLE` / index batch for OmniPortal support tables ends with `.catch(()=>{})`, suppressing batch failure.
- `seedOmni()` catches and logs connector-registry seed failures, then returns normally.
- The two admin GET routes previously inventoried therefore can return after an attempted but partially failed schema/seed operation. A successful HTTP response is not proof that the connector schema is complete.

The core bootstrap order is also explicit: core base tables, publishing initializer, ticket-pack default setting, taxonomy seed, taxonomy-submission table, agent seed, Author Studio AI schema, security marker, then core version marker. This confirms the initializer mixes schema creation, reference-data provisioning, cleanup/default values, and version-marker writes. These responsibilities need separate, versioned owners before the initializer can be retired.

Cutover requirements:
1. Replace broad exception suppression with migration-time failures that stop the release and produce actionable diagnostics.
2. Run duplicate-column compatibility checks only as migration preflight logic; do not treat arbitrary DDL errors as successful readiness.
3. Make connector seed provisioning an explicit idempotent operation with an auditable outcome, never a side effect of a GET.
4. Keep core schema version advancement atomic with successful completion of its owned migration/provisioning steps.
5. Preserve the existing admin security behavior; schema cutover must not reintroduce automatic administrator promotion.

This is source-level evidence. It does not establish the production database's present schema, data, or migration ledger.
