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

## Route-local database work on GET requests

The shared dispatcher bootstrap above runs before every non-health API route, including GET. In addition, the source currently contains route-local initializer calls inside these GET handlers:

| GET route | Route-local call | Additional effect to account for |
|---|---|---|
| `/api/author/ai/projects` | `ensureAuthorAISchema(env)` | Ensures Author Studio project, publish-policy and run-history structures. |
| `/api/author/ai/projects/:id` | `ensureAuthorAISchema(env)` | Same initializer on an individual project read. |
| `/api/author/ai/projects/:id/jobs` | `ensureAuthorAISchema(env)` | Ensures AI project/job/run structures before reading the account-owned job history. |
| `/api/author/ai/benchmarks` | `ensureAuthorAISchema(env)` | Ensures benchmark and Author Studio structures before reading provider observations. |
| `/api/admin/publishing` | `ensurePublishingSchema(env)` | Ensures publication/review columns and chapter-view structures; initializer also performs its documented publication-status backfill. |
| `/api/admin/publishing/chapters` | `ensurePublishingSchema(env)` | Same initializer on chapter-list reads. |
| `/api/admin/connectors` | `seedOmni(env)` | Calls `ensureOmniTables(env)` and seeds registry connector rows with `INSERT OR IGNORE`. |
| `/api/admin/connector-authorization-requests` | `ensureOmniTables(env)` | Ensures OmniPortal tables and optional connector columns before listing requests. |

These route-local calls are separate from the shared dispatcher bootstrap and must be reconciled independently. A future read-only GET contract requires removing or relocating both layers of initialization/seed work, not merely testing the route's final SELECT statement. This list is source-audited; it is not evidence that any of these structures or seed rows exist in production.

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

## Exact outstanding runtime DDL definitions (source transcription)

The following definitions are transcribed from the current Worker source to make production comparison precise. They are not proposed migration SQL and must not be applied blindly. The production audit must capture the actual `sqlite_master.sql`, `PRAGMA table_info`, indexes and foreign-key metadata for each object before a migration is designed.

### Agent registry

```sql
CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  icon TEXT DEFAULT '🤖',
  mode TEXT NOT NULL DEFAULT 'automation',
  status TEXT NOT NULL DEFAULT 'ready',
  enabled INTEGER NOT NULL DEFAULT 1,
  last_run_at TEXT,
  last_result TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS agent_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL,
  trigger TEXT NOT NULL,
  result TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ok',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON agent_runs(agent_id,created_at);
```

### Community taxonomy proposals

```sql
CREATE TABLE IF NOT EXISTS taxonomy_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT DEFAULT '',
  creator_id INTEGER,
  creator_name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  reviewer_id INTEGER,
  UNIQUE(type,slug)
);
```

### Connector configuration columns

The runtime helper attempts these individual ALTER statements and suppresses every error, not only duplicate-column errors. A future migration must first determine which columns already exist and whether any existing column has a different type/default/nullability. SQLite/D1 does not support using `ADD COLUMN IF NOT EXISTS` as a safe universal reconciliation shortcut.

```sql
ALTER TABLE connectors ADD COLUMN search_url TEXT DEFAULT '';
ALTER TABLE connectors ADD COLUMN auth_header TEXT DEFAULT 'authorization';
ALTER TABLE connectors ADD COLUMN secret_name TEXT DEFAULT '';
ALTER TABLE connectors ADD COLUMN rights_evidence_url TEXT DEFAULT '';
ALTER TABLE connectors ADD COLUMN terms_url TEXT DEFAULT '';
ALTER TABLE connectors ADD COLUMN rights_notes TEXT DEFAULT '';
ALTER TABLE connectors ADD COLUMN metadata_import_allowed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE connectors ADD COLUMN attribution_required INTEGER NOT NULL DEFAULT 0;
```

### Novel review and comment columns

```sql
ALTER TABLE novels ADD COLUMN review_feedback TEXT DEFAULT '';
ALTER TABLE novels ADD COLUMN reviewed_by INTEGER;
ALTER TABLE novels ADD COLUMN reviewed_at TEXT;
ALTER TABLE comments ADD COLUMN parent_id INTEGER;
ALTER TABLE comments ADD COLUMN edited_at TEXT;
```

The source performs these additions conditionally through schema inspection or duplicate-column handling. A static SQL migration cannot safely replay these ALTER statements against a database where runtime bootstrap may already have added some or all of them. The migration runner/reconciliation design must account for per-column presence without treating an arbitrary ALTER failure as success.

### Non-DDL bootstrap behavior that cannot be silently dropped

- `seedTaxonomy(env)` inserts the canonical genre/tag vocabulary using `INSERT OR IGNORE`; preserve existing IDs and custom taxonomy entries. Reference-data synchronization needs an explicit ownership and versioning policy.
- `ensureAgents(env)` seeds agent catalogue rows. Preserve existing enabled/status/last-run fields; do not overwrite operator changes when migrating from runtime seeding.
- `seedOmni(env)` inserts connector registry rows with disabled status and pending rights. Preserve user/operator changes and do not enable any connector during cutover.
- `ensurePublishingSchema(env)` backfills blank novel and chapter publication states and creates the chapter-view counter table. Confirm current values and data volumes before replacing this behavior.
- `ensureRuntimeFeatureSchema(env)` deletes auth-rate-limit records older than 48 hours and writes a runtime version marker. A migration-only architecture must separate the bounded cleanup schedule from request handling and define marker ownership.
- `ensureCoreSchema(env)` writes the core version marker and the secure first-admin bootstrap marker. The latter must not be replaced with an automatic privilege grant.

These behaviors are independent of whether the corresponding table or column already exists. The cutover plan must account for them separately from schema DDL.

## Offline runtime-schema evidence assessment

The repository now includes `scripts/assess-runtime-schema-evidence.mjs`. It accepts a normalized JSON capture produced from the read-only production audit and classifies the specific runtime-only tables, columns, and index names as `present`, `missing`, or `unknown`. It requires the target database name, audit timestamp, explicit inventory-completeness declaration, table/column arrays, and index names. It rejects duplicate table/column/index identities.

This is deliberately a presence-only first pass. A present column is **not** considered definition-compatible: its declared type, nullability, default, primary-key status, table SQL, indexes, foreign keys, triggers, existing data, and migration provenance still need independent comparison. The result always sets `releaseReady: false`, even when every required name is present. It cannot connect to Cloudflare, apply SQL, or approve deployment.

Run its self-test with:

```sh
node scripts/assess-runtime-schema-evidence.mjs --self-test
```

Example normalized evidence shape (illustrative only, not production state):

```json
{
  "database": "god-emperornovel-db",
  "auditedAt": "2026-11-22T00:00:00Z",
  "inventoryComplete": false,
  "tables": [
    { "name": "comments", "columns": [{ "name": "id" }, { "name": "parent_id" }] },
    { "name": "connectors", "columns": [{ "name": "id" }, { "name": "search_url" }] }
  ],
  "indexes": ["idx_agent_runs_agent"]
}
```

Only populate this file from actual audit output. Set `inventoryComplete: true` only after confirming the audit captured the complete relevant table, column, and index inventories and every required query succeeded. Never convert a failed query or omitted table into a missing-object finding. A complete inventory may establish name-level absence, but it still does not prove migration history or exact schema compatibility.

## Production release workflow gap

The current production deploy workflow applies and verifies migrations `0009`–`0011` only. This candidate adds canonical migrations `0012`–`0046` and `0048`–`0049`, but those later migrations are not included in the deploy workflow's apply step. Therefore, a green source build or a passing deployment dry run must not be interpreted as evidence that the candidate's full canonical migration chain has been applied or that production is ready for this Worker revision. The deploy workflow must be reconciled with the production audit, exact applied-migration history, per-migration preflight, and production-shaped rehearsal before a production release is approved.

The separate production schema preflight previously had a push-to-main trigger that could query production automatically when its workflow file changed. It is now manual-dispatch-only and requires the explicit `confirm_read_only_preflight=yes` input. This is a control change only; it has not been dispatched and makes no claim about live production state.

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

### Additional Author Studio GET schema side effects (2026-11-21)

A follow-up call-site audit found that the Author Studio AI initializer is invoked directly inside multiple GET handlers, in addition to being invoked from the shared core bootstrap:

| Route | Direct initializer call | Consequence | Required cutover |
|---|---|---|---|
| GET /api/author/ai/projects | ensureAuthorAISchema(env) | Executes CREATE TABLE / CREATE INDEX statements before listing projects | Replace with a migration-owned readiness check; GET must not create schema |
| GET /api/author/ai/projects/:id | ensureAuthorAISchema(env) | Executes schema DDL before reading a project | Same; preserve project ownership filtering |
| GET /api/author/ai/projects/:id/jobs | ensureAuthorAISchema(env) | Executes schema DDL before reading job history | Same; preserve job history and owner scoping |
| GET /api/author/ai/benchmarks | ensureAuthorAISchema(env) | Executes schema DDL before reading benchmark observations | Same; preserve recorded benchmark history |

The initializer is also called by Author Studio POST/PATCH handlers, which means schema provisioning is coupled to both read and write requests. The direct GET calls are separately important: even if the shared API dispatcher bootstrap is later removed, these handlers would still mutate schema unless their direct calls are removed.

The source inspection confirms that ensureAuthorAISchema() propagates statement failures rather than swallowing them. That is better failure behavior than the OmniPortal helper, but it remains request-triggered DDL and is not a migration substitute. Migration 0007 and later AI migrations remain the candidate canonical owners; production definitions and migration ledger must be verified before the initializer is retired.

This is source-level evidence only. No production D1 query or change was performed.
### Additional publishing GET schema side effects (2026-11-21)

The same direct-call audit found two authenticated publishing GET handlers that invoke ensurePublishingSchema() before reading data:

| Route | Side effect | Required cutover |
|---|---|---|
| GET /api/admin/publishing | Rechecks/creates publication columns and indexes, backfills blank novel publication status, creates chapter_views, and may add chapter publication status | Remove initializer call after 0004/0005 and any required bounded backfill are reconciled against production; GET must only read |
| GET /api/admin/publishing/chapters | Performs the same publishing schema checks/backfills before listing chapters | Same; preserve chapter ordering, publication state and view records |

These calls are separate from the API dispatcher's shared bootstrap. Removing the shared initializer alone would not make these GET handlers read-only. The publishing helper propagates failures, but it performs DDL and DML (including UPDATE backfills) directly in request handling.

No production schema or row state was inspected. The migration cutover must compare the exact production definitions and measure affected backfill rows before replacing this behavior.
### Runtime feature schema bootstrap and request-time cleanup (2026-11-21)

The shared API dispatcher invokes ensureRuntimeFeatureSchema(env) after ensureCoreSchema(env) for API requests other than the separately fast-pathed health route. The helper is therefore not limited to feature writes or administrator actions. Any ordinary API request can enter this initializer before its route handler runs, including GET requests.

The initializer uses app_settings.runtime_feature_schema_version='1' as a fast-path marker. When the marker is absent or differs, it:

- Creates auth_rate_limits and its window index.
- Creates comment_likes, comment_reports, novel_reactions, request_votes and their indexes.
- Adds comments.parent_id and comments.edited_at. It tolerates only duplicate-column errors; other ALTER failures propagate.
- Deletes auth_rate_limits rows older than 48 hours (a data cleanup operation).
- Writes/replaces the runtime_feature_schema_version marker.

Thus the shared API bootstrap combines schema DDL, bounded-but-request-triggered rate-limit cleanup, and version-marker writes. The helper memoizes readiness in the Worker isolate and clears that memo on failure, but the database marker is not proof that the exact production definitions match the source. Cutover must reconcile these objects with canonical migration files and production D1 before removing the helper. The cleanup should become an explicitly owned maintenance task or migration only if its lifecycle and operational impact are separately approved.

This is source-level evidence only. No production D1 query or modification was performed.
### Canonical migration versus core runtime bootstrap schema drift (2026-11-21)

A comparison of the inline CREATE TABLE statements in ensureCoreSchema() with migrations/0001_initial.sql confirms that these are not equivalent schema definitions. Examples:

| Object | Canonical migration | Runtime bootstrap |
|---|---|---|
| users.role | CHECK constraint limits values to user, author, moderator, admin | No equivalent CHECK constraint |
| sessions.user_id | Foreign key to users with ON DELETE CASCADE | No foreign key clause |
| chapters.novel_id | Foreign key to novels with ON DELETE CASCADE | No foreign key clause |
| novel_genres / novel_tags | Foreign keys to their parent tables with ON DELETE CASCADE | No foreign key clauses |
| unlocks | Foreign keys to users and chapters with ON DELETE CASCADE | No foreign key clauses |

Because these statements use CREATE TABLE IF NOT EXISTS, the runtime bootstrap does not repair a table that already exists with a different definition. Conversely, a fresh database created by the runtime bootstrap can receive weaker constraints than the canonical initial migration. The core initializer and migration 0001 therefore cannot be treated as interchangeable schema authorities.

Cutover requirement: choose the canonical migration chain as the sole schema owner; compare production sqlite_master / PRAGMA table_info / foreign_key_list / index_list output against the intended migration result; explicitly plan any constraint rebuilds and orphan checks before applying changes. Do not attempt an in-place table rebuild or create a new migration until the production read-only audit and backup/restore rehearsal are complete.

This is a source-to-migration comparison only. It does not establish which schema variant currently exists in production.
### Runtime feature table definitions versus migration 0028

The runtime feature initializer also defines simplified versions of tables owned by migration 0028. In particular, its comment_likes definition omits the canonical foreign keys; comment_reports omits the canonical UNIQUE(user_id,comment_id) and foreign keys; request_votes omits its canonical foreign keys. Migration 0028 adds orphan/duplicate archival, cleanup, uniqueness, validation/cascade triggers, and supporting indexes.

This is another reason not to assume that a runtime marker or CREATE TABLE IF NOT EXISTS means the canonical schema is present. Migration 0028 contains integrity work beyond the runtime helper's table-creation statements. The production cutover must verify every object from 0028, including triggers and the legacy duplicate archive, not merely table names and columns.

### Expanded core-baseline constraint drift (2026-11-21)

A second pass compared the complete `CREATE TABLE` definitions in `ensureCoreSchema()` with `migrations/0001_initial.sql`. The previously recorded examples are not the full set. The source comparison also identifies these baseline constraint differences:

| Table | Canonical migration constraint | Runtime bootstrap difference | Cutover requirement |
|---|---|---|---|
| `unlock_batches` | `user_id` references `users(id)` with `ON DELETE CASCADE` | Runtime definition has no foreign key | Check for orphaned user references and preserve batch history before any table rebuild |
| `bookmarks` | `user_id` references `users(id)` with `ON DELETE CASCADE` | Runtime definition has no foreign key | Check orphaned users; preserve every bookmark and reading position |
| `history` | `user_id` references `users(id)` with `ON DELETE CASCADE` | Runtime definition has no foreign key | Check orphaned users; preserve all reading-history rows |
| `donations` | nullable `user_id` references `users(id)` with `ON DELETE SET NULL` | Runtime definition has no foreign key | Preserve donation records and nullable ownership semantics; do not delete orphaned financial history |
| `comments` | `user_id` and `novel_id` reference their parent tables with cascade behavior | Runtime definition has no foreign keys | Check both orphan classes and retain moderation/content history |
| `novel_requests` | `user_id` references `users(id)` with `ON DELETE CASCADE` | Runtime definition has no foreign key | Check orphaned user references and preserve request status/history |

The earlier comparison also found differences for `users.role`, `sessions.user_id`, `chapters.novel_id`, `novel_genres`, `novel_tags`, and `unlocks`. The runtime bootstrap is therefore not a constraint-equivalent substitute for the canonical baseline, even when both create tables with matching names and many matching columns.

This is source-level evidence only. It does not establish whether production D1 was initialized by migrations, by the runtime helper, or by a mixture of both. Do not rebuild tables or add repair migrations until the read-only production audit has captured actual `sqlite_master` definitions, `PRAGMA foreign_key_list` results, orphan counts, and a restorable backup.


### Additional core baseline omissions and publishing default drift (2026-11-21)

A full pass over the `ensureCoreSchema()` statement list found another runtime-created table that is used by live API handlers but is not defined by baseline migrations 0001–0003:

| Runtime object | Runtime behavior / consumers | Canonical migration status | Cutover requirement |
|---|---|---|---|
| `user_library` | Created by `ensureCoreSchema()`; read by `GET /api/library` and written/deleted by `POST /api/library` to track a user's saved novels | No `user_library` table declaration appears in `0001_initial.sql`, `0002_omniportal.sql`, or `0003_finish_product.sql` | Add an allocated canonical migration after verifying the remote table definition, row count, duplicate behavior, and any existing indexes. Preserve all user-to-novel membership rows. Define foreign-key and deletion policy deliberately; do not silently infer it from current runtime DDL. |

This is a functional dependency, not merely an optional optimization. A database created from the inspected canonical baseline without runtime bootstrap will not satisfy the library API's table dependency. The API's route-level use is confirmed in `src/index.js`; production presence remains unknown until the remote audit.

The publishing helper also has a source-level default mismatch worth preserving explicitly in the cutover plan:

- `ensurePublishingSchema()` adds `novels.publication_status` with default `'published'` when the column is absent.
- Migration `0004_legal_publishing.sql` adds the same column with default `'draft'`.
- The helper additionally adds `novels.review_feedback`, `reviewed_by`, and `reviewed_at`, which are not defined in migration 0004.
- The helper backfills blank novel publication statuses to `draft`, while chapter publication status is backfilled to `published`. These data updates must be measured and understood before the helper is retired.

Do not resolve the default mismatch by changing existing production rows or by assuming the default clause affects rows already present. Inspect actual `PRAGMA table_info` defaults, migration history, null/blank counts, and application expectations first. A future canonical migration should explicitly define the intended behavior for new rows and preserve the established publication/rights review state.


### Core bootstrap reference-data and registry side effects (2026-11-21)

The core initializer has additional responsibilities that must be separated from structural migration ownership during cutover:

- `seedTaxonomy(env)` batches `INSERT OR IGNORE` writes for the built-in genre and tag vocabularies. This is idempotent reference-data provisioning, not table DDL. It runs when the `core_schema_version` marker is absent or differs from `16.64.0`; after the marker fast path succeeds, the initializer skips the batch. Preserve existing taxonomy rows and define a separately versioned reference-data process before retiring this behavior.
- `ensureAgents(env)` inserts the built-in `AGENT_SEED` registry with `INSERT OR IGNORE` into `agents`. It is called by the core initializer and again by `runAgent()`. An agent-run action can therefore also seed registry rows. Keep the registry catalogue and user/admin enablement state separate from table creation; do not overwrite existing agent settings while migrating.
- `ensureCommunityTaxonomySchema(env)` creates `taxonomy_submissions` from the core initializer. It is not an independent public GET initializer in the inspected source, but an unmarked or marker-mismatched API request reaches it before route dispatch. The table is not present in inspected migrations 0001–0011.

The source confirms `agents`, `agent_runs`, `idx_agent_runs_agent`, and `taxonomy_submissions` are not defined by migration `0001_initial.sql`; the broader 0001–0011 gap for the agent registry remains as previously recorded. A first API GET on a database without the expected core marker can therefore trigger structural DDL and taxonomy/agent reference-data DML before its route handler. The scheduled entrypoint separately calls the same core initializer. This is not evidence that production currently lacks any of these objects.

Cutover safeguards: inventory actual production rows and schema first; preserve agent status/enabled flags and all run history; preserve taxonomy proposal/review states; count existing genre/tag rows before seed reconciliation; make reference-data changes auditable and idempotent; and do not silently reseed or normalize user-created vocabulary.


### Agent registry and taxonomy bootstrap ownership gap (2026-11-21)

A further pass through the complete core initializer identified additional runtime-owned schema and data responsibilities:

- `ensureCoreSchema()` creates `agents`, `agent_runs`, and `idx_agent_runs_agent` inline. A repository-wide migration-source search found no canonical migration that creates these two tables. They currently have runtime-bootstrap ownership rather than an identified forward migration owner.
- `ensureAgents()` inserts the built-in specialist-agent registry using `INSERT OR IGNORE` during core bootstrap. This is repeatable seed data, but it remains an implicit application-startup write. Its owner and versioning policy must be explicit.
- `ensureCommunityTaxonomySchema()` creates `taxonomy_submissions` at runtime. No canonical migration currently creates this table.
- `seedTaxonomy()` inserts the built-in genre and tag vocabulary using `INSERT OR IGNORE` batches during core bootstrap. The demo novel/chapter seed has been removed, but this taxonomy vocabulary remains intentional reference data. Its owner, versioning policy, and safe update behavior must be explicit.
- Core bootstrap also inserts the default `ticket_packs` setting and writes the `first_admin_bootstrap_done` and `core_schema_version` settings. These are application configuration/bootstrap markers, not migration-ledger evidence.

The core initializer has a `core_schema_version='16.64.0'` fast path that returns before running the above helpers. Seeing this marker does not prove that agent tables, taxonomy submissions, agent seed rows, or current taxonomy vocabulary exist or are complete. The Worker isolate memo is not durable schema evidence either.

Cutover requirements:
1. Allocate canonical migrations for `agents`, `agent_runs`, and `taxonomy_submissions` only after checking production D1 objects and the migration ledger.
2. Define whether the agent registry and genre/tag vocabulary are immutable seed snapshots, versioned reference-data migrations, or separately managed catalog data. Preserve administrator edits and user-created taxonomy.
3. Extend the read-only audit to inspect these exact tables, indexes, row counts, and existing vocabulary without exposing sensitive row contents.
4. Keep runtime helpers in place until migration and data ownership are proven. Do not create or apply a guessed migration based only on repository source.

This is repository-source evidence, not a statement about production D1 contents. No production query or mutation was performed.


## Definition-level runtime schema comparison

The repository also includes `scripts/compare-runtime-schema-definitions.mjs`. This is a stricter offline second pass than the name-only assessor above. It compares source-transcribed definitions for the runtime-created `agents`, `agent_runs`, and `taxonomy_submissions` tables; the runtime-added comments, novel-review and connector columns; and the `idx_agent_runs_agent` index.

Normalized evidence must contain:
- `database`, `auditedAt`, and explicit boolean `inventoryComplete`;
- `tables`: each table has `name` and `columns`; each column carries the SQLite `PRAGMA table_info` fields `name`, `type`, `notnull`, `dflt_value`, and `pk`;
- `indexes`: each index has `name`, `table`, ordered `columns`, and boolean `unique`;
- `foreignKeys`: an array reserved for the captured `PRAGMA foreign_key_list` output.

Example index representation:

```json
{ "name": "idx_agent_runs_agent", "table": "agent_runs", "columns": ["agent_id", "created_at"], "unique": false }
```

Run the offline self-test with:

```sh
node scripts/compare-runtime-schema-definitions.mjs --self-test
```

The comparison reports `verified`, `missing`, `mismatch`, and `unknown`. Missing is used only when the relevant inventory is explicitly complete; otherwise absence is unknown. A column mismatch includes type, NOT NULL, default, or primary-key-position differences. The required agent-run index is checked for table, ordered columns, and uniqueness. This tool still sets `releaseReady: false` unconditionally. It does not establish every table-level UNIQUE/CHECK constraint, validate arbitrary foreign-key semantics or triggers, inspect row data, prove migration provenance, verify recovery, or replace a production-shaped rehearsal. Do not use illustrative evidence as production evidence.


## Automated read-only evidence artifact

When the explicitly confirmed `Imperial Novel Read-Only Production D1 Audit` workflow is run, its final evidence-capture step issues one SELECT-only SQLite JSON query. It captures every non-internal table's `sqlite_master.sql`, `PRAGMA table_info` columns, declared foreign keys, and non-auto index SQL, uniqueness and ordered indexed columns. Wrangler's JSON response is normalized by `scripts/normalize-runtime-schema-audit.mjs`; the normalized evidence is then passed to the definition comparator.

The workflow uploads `production-runtime-schema-evidence-<commit>` for seven days. The artifact contains schema metadata, not application rows, credentials, or chapter bodies. It also retains the raw Wrangler JSON response for auditability. If Wrangler's output shape is not recognized or the complete inventory cannot be validated, normalization fails closed and no normalized evidence is produced.

The audit workflow remains manually gated by `confirm_read_only_audit=yes`. This change does not dispatch it, access production D1, change database state, or deploy the Worker. The comparison still cannot approve release: table-level constraints, data invariants, migration ledger provenance, recovery restore rehearsal, and a production-shaped migration rehearsal remain separate gates.
