# Imperial Novel Database Migration Collision Register

**Audit date:** 2026-11-04  
**Scope:** Current `main` migration filenames and migration files added by open PRs #87, #88, #118, #120, #123, #124, #129, #130, #171, #173 and #174.  
**Purpose:** Prevent incompatible branch migrations from being combined or applied in an unsafe order.

## Executive finding

The current `main` branch contains migrations `0001_initial.sql` through `0011_author_applications.sql`. Multiple open feature branches independently allocate the same subsequent sequence numbers to different schema changes. At least one branch (#124) also introduces files numbered 0009–0011, which overlap sequence numbers already present on `main`.

This is an integration blocker, not a cosmetic filename problem. A migration runner commonly records applied migration filenames or identifiers. Renaming a migration after it has been applied can cause it to run again; two different files with the same sequence can also produce inconsistent fresh-install and upgrade behavior.

**Do not merge or deploy the affected migration branches as a bundle. Do not renumber migrations until the actual D1 applied-migration inventory has been obtained.**

## Current main baseline

`main` currently contains:

- `0001_initial.sql`
- `0002_omniportal.sql`
- `0003_finish_product.sql`
- `0004_legal_publishing.sql`
- `0005_chapter_publishing.sql`
- `0006_rights_first_security.sql`
- `0007_ai_author_studio.sql`
- `0008_discovery_community.sql`
- `0009_catalog_filter_indexes.sql`
- `0010_catalog_sort_indexes.sql`
- `0011_author_applications.sql`

## Open-PR migration inventory

| PR | Workstream | Migration files observed |
|---|---|---|
| #173 | Reader profiles | 0012 user profiles |
| #174 | Account identity/security | 0013, 0014, 0017, 0018, 0019 |
| #129 | Chapter revisions/scheduling | 0012, 0013 |
| #130 | Author Studio goals/notes | 0014, 0015 |
| #118 | Runtime community schema | 0012 |
| #120 | Discovery/reader metrics/ratings | 0013–0018 |
| #123 | Runtime schema + reader/account features | 0012–0019 |
| #171 | Design foundation integration | 0012–0013 |
| #124 | Creator ownership/account deletion | 0009–0019 |
| #87 | Media asset registry | 0012 |
| #88 | Media rights/comic/payment safeguards | 0012–0021 |

This inventory is based on the open pull-request file lists at audit time. It is not a statement that every PR is approved, merged, deployed, or applied to any database.

## Sequence collisions

| Sequence | Conflicting changes observed |
|---|---|
| 0009–0011 | PR #124 adds password-reset/email-verification migrations while main already has catalog indexes and author applications |
| 0012 | Profiles (#173), chapter revisions (#129), runtime schema (#118/#123), ratings (#171), ownership transfers (#124), media assets (#87/#88) |
| 0013 | Username cooldown (#174), scheduled publishing (#129), chapter timestamps (#120/#123), reader progress (#171), account deletion (#124), media publication gates (#88) |
| 0014 | Account preferences (#174), author goals (#130), engagement metrics (#120/#123), account deletion (#124), comic owner guards (#88) |
| 0015 | Author private notes (#130), daily analytics (#120/#123), account deletion review store (#124), media rights review (#88) |
| 0016 | Reading positions (#120/#123), account deletion reviewer roles (#124), media storage quotas (#88) |
| 0017 | Username cooldown (#174), ten-point ratings (#120/#123), account deletion disposition plans (#124), comic draft guards (#88) |
| 0018 | Account preferences (#174), comment reports (#120/#123), account deletion approvals (#124), donation review audit (#88) |
| 0019 | Historical username insert guard (#174), account closure (#123), account deletion findings (#124), admin ticket adjustments (#88) |

## Duplicate or overlapping migration payloads

The following duplicates/overlaps were observed from the changed-file patches:

1. **PR #174:** `0013_username_change_cooldown.sql` and `0017_username_change_cooldown.sql` implement substantially the same username history/cooldown schema and guards under different sequence numbers.
2. **PR #174:** `0014_account_preferences.sql` and `0018_account_preferences.sql` contain the same `ALTER TABLE users ADD COLUMN preferences_json ...` statement. Applying both to the same database will fail because the column already exists.
3. **PR #118 and #123:** both add `0012_runtime_feature_schema.sql`. Their relationship must be resolved to one canonical source, not applied twice.
4. **PR #87 and #88:** both add `0012_media_asset_registry.sql`. The registry should have one canonical migration owner.
5. **PR #120 and #123:** overlapping chapter timestamp, engagement metrics, daily analytics, reading positions, ten-point ratings and comment-report migration slots appear in both branches. The patches must be compared and one canonical implementation selected.
6. PR #120's `0014_reader_engagement_metrics.sql` and `0018_comment_reports.sql` are documented as intentional no-op slots because PR #118 owns the relevant schema. These are still sequence occupants and must not be mistaken for independent DDL.

## Integration hazards beyond numbering

- **Destructive table rebuild:** PR #120/#123's ten-point rating migration creates a replacement table, copies rows, drops `ratings`, then renames the replacement. It requires a verified schema/data rehearsal and preservation of indexes/triggers/foreign keys before release.
- **Data cleanup:** PR #123's runtime schema migration archives and deletes invalid/duplicate comment reports and removes orphan interactions. The effects need a before/after row-count report on a disposable copy.
- **Account branch dependency:** PR #174 currently targets the profile branch rather than `main`. Preserve this dependency or rebase deliberately after migration ownership is settled.
- **Creator account lifecycle:** PR #124 contains a multi-migration deletion/ownership-transfer workflow. Its dependencies on users, novels, chapters, roles and audit records must be verified against the actual baseline and other security migrations.
- **Migration guard correctness:** PR #177 now replaces the unsafe whitespace normalizer with a quote-aware canonicalizer that preserves whitespace inside string literals and quoted identifiers, and includes regression self-checks. It is a conservative lexical duplicate check, not a full SQL semantic-equivalence engine.

## Required safe integration procedure

1. Freeze creation of new numbered migrations on independent feature branches. New schema work should be authored against one designated integration branch.
2. Obtain a read-only inventory of applied migration identifiers from each relevant D1 environment, including production and staging. Do not infer applied state from Git.
3. Preserve the original migration files and hashes. Determine whether any conflicting migration has already been applied in any environment.
4. Build a dependency graph for every migration: required tables/columns, created objects, changed constraints, data transformations and reverse/rollback considerations.
5. Choose one canonical owner for each logical schema change. Consolidate duplicate implementations before assigning a single monotonic sequence after the verified baseline.
6. Never rewrite an already-applied migration in place. If an applied migration needs correction, add a forward corrective migration with a new identifier.
7. Rehearse the full canonical chain against a disposable SQLite database initialized from the exact baseline. Include representative legacy rows and verify foreign keys, indexes, triggers, row counts and application tests.
8. Run the Cloudflare build and D1 migration validation on the integrated branch.
9. Stage the migration against a disposable/staging D1 first. Production rollout requires backup, explicit release approval, monitoring and a documented recovery plan.

## Focused data-preservation review: ratings and reader progress

Reviewed the actual SQL and regression tests at PR #171 head `574b37bab1eb0426bc0032f79eceb3c4ca0a4588`, and the competing ratings migration at PR #123 head `5a2e5b8f3b7db97cbf878e71c0acd9c1f1716eb5`.

### Rating migration conflict: do not apply either migration yet

- PR #171 `0012_ten_point_ratings.sql` rebuilds `ratings`, maps values 1–5 to 2,4,6,8,10, drops the original table, renames the replacement, and recomputes `novels.rating`.
- PR #123 `0017_ten_point_ratings.sql` also rebuilds `ratings`, but copies existing values unchanged where they are between 1 and 10, silently excluding any out-of-range rows before dropping the old table.
- These are not equivalent transformations. PR #171 assumes every stored value 1–5 belongs to an old five-point scale. PR #123 assumes values 1–10 are already ten-point values.
- The PR #171 Worker source and rating regression test already enforce/expect whole-number ratings from 1 to 10. If production has accepted ten-point votes before the migration, PR #171 would double the value of every existing 1–5 vote. Conversely, PR #123's filtered copy would discard invalid legacy rows without archiving them or reporting a count.
- Both scripts use a table rebuild. The reviewed SQL does not explicitly preserve arbitrary indexes, triggers, or foreign-key relationships attached to the old `ratings` table. Those must be inventoried and recreated/verified where applicable.
- PR #171's regression test checks the intended mapping in SQL text, but does not by itself prove preservation of representative live rows, table dependencies, or mixed historical scale data.

**Required resolution before canonicalization:** inspect actual production rating values and schema dependencies using a read-only, aggregate/metadata-only audit; determine whether historic rows have reliable scale provenance. If provenance cannot distinguish five-point and ten-point rows, do not automatically remap ambiguous values. Design a forward-only migration with an explicit preservation/archive policy, pre/post row-count checks, rating distribution checks, and table-dependency verification. Do not run a destructive table rebuild until that rehearsal passes.

### Reader progress migration review

PR #171 `0013_reader_progress.sql` creates one row per `(user_id, novel_id)`, constrains chapter number and percentage, and indexes user/update time. It does not declare foreign keys to users/novels in the reviewed SQL. Its application tests assert account-scoped API reads/writes and local-vs-server timestamp reconciliation. Before integration, add disposable-database tests for orphan prevention or cleanup policy, user deletion, novel deletion, concurrent updates, and stale offline writes. The current source-level regression test is useful but is not a substitute for those data and concurrency tests.

## Cross-PR integration gate (reviewed 2026-11-04)

GitHub's `mergeable` field describes Git's ability to merge source changes; it does not establish that independent D1 migration histories are compatible. Treat these as separate gates.

| Pull request | Migration contribution / overlap | Integration disposition |
|---|---|---|
| #118 | `0012_runtime_feature_schema.sql` | Hold; same sequence as media, reader, profile, and other feature branches. |
| #120 | `0012_runtime_feature_schema.sql` and reader/ratings migration slots (including intentional no-op reservations) | Hold; integration base has multiple cross-branch overlaps. |
| #123 | Community runtime migration and reader/ratings sequence, including data cleanup and ratings-table rebuild | Hold; preserve its cleanup/rebuild semantics for a dedicated data-preservation rehearsal. |
| #124 | Account lifecycle and ownership-transfer migrations beginning at `0009` | Hold; its early sequence overlaps migrations already on `main`. |
| #129 | `0013_scheduled_chapter_publications.sql` | Hold; sequence 0013 is independently used by several branches. |
| #130 | `0014_author_story_goals.sql`, `0015_author_private_notes.sql` | Hold; sequence numbers overlap other feature migrations. |
| #171 | `0012_ten_point_ratings.sql`, `0013_reader_progress.sql` | Hold; #120/#123 and other branches use conflicting sequence slots. Its GitHub mergeability does not clear the D1 gate. |
| #173 | `0012_user_profiles.sql` | Hold; sequence 0012 conflicts with multiple independent migrations. |
| #174 | Profile/account identity migrations, including duplicate cooldown/preferences slots within its own branch | Hold; stacked on #173 and requires both source and migration consolidation. |
| #177 | Migration sequence/payload guard and fresh SQLite chain rehearsal | Keep as a validation-only draft until the integration process is established. |

### Required canonicalization sequence

1. Obtain the actual production D1 schema and migration-history evidence through an explicitly authorized read-only audit. The current repository workflow can perform this, but it has not been dispatched in this work.
2. Compare the production schema with `main` and the actual SQL payloads. A missing migration-ledger row alone is not proof that SQL was never applied because the current deploy workflow executes SQL files directly.
3. Create one integration branch from the verified production-compatible baseline. Do not merge independent feature branches merely because GitHub reports them mergeable.
4. Assign each genuinely new schema change a unique forward-only migration number in that integration branch. Preserve the original SQL intent, dependencies, constraints, triggers, indexes, and data transformations. Never rewrite a migration already applied in production.
5. Rehearse the complete chain on a disposable database seeded with representative legacy data. Verify row preservation, intentional cleanup counts, foreign keys, indexes, triggers, constraints, and application-level tests.
6. Only after the rehearsal and source CI pass should the integration PR be considered for human review. Production deployment remains a separate, explicitly approved operation.

**Current decision:** no feature PR is promoted to a canonical migration branch by this register alone. The actual production baseline is still unknown, so renumbering or consolidation would be premature.

## Production inventory and release workflow findings

A source review of `.github/workflows/audit-production-d1.yml`, `.github/workflows/deploy.yml` and `wrangler.toml` found the following operational constraints:

- The production D1 audit is a manually dispatchable workflow. It requires the explicit `confirm_read_only_audit=yes` input and valid Cloudflare GitHub Actions secrets. It checks the configured D1 identity, credential presence, Time Travel bookmark, public Worker health, table/column inventories, and (when present) `d1_migrations` history.
- The audit workflow is designed around SELECT and PRAGMA statements. It does not run migrations or deploy the Worker. Its workflow logs will contain database schema and aggregate operational information, so access to the GitHub Actions run should remain restricted to authorized maintainers.
- The production deploy workflow is also manual and requires `confirm_production_deploy=true`. Its current implementation explicitly applies only `0009_catalog_filter_indexes.sql`, `0010_catalog_sort_indexes.sql`, and `0011_author_applications.sql` before deploying. It is not a general mechanism for applying the open feature-branch migrations.
- The deploy workflow uses direct remote `d1 execute --file` calls for those three migrations rather than Wrangler's migration-ledger application command. Therefore the presence or absence of a `d1_migrations` record must not be assumed to prove that these SQL files were or were not executed. Compare the actual schema objects and the migration history together.
- The checked-in D1 binding points to `god-emperornovel-db` with database ID `78493557-1142-45e6-96aa-2ba9f67e3be0`. Confirm that this is the intended environment before dispatching any workflow.

**Operational rule:** Do not dispatch the production audit or deploy workflow as an automatic continuation step. The audit is read-only but accesses production operational metadata; it should be run only by an authorized maintainer after explicitly choosing the read-only audit input. Never dispatch production deploy as part of this migration reconciliation work.

## Validation update (2026-11-04)

- PR #177 adds a quote-aware duplicate-payload guard and runs it as part of the package build.
- PR #177 adds `scripts/test-migration-chain.py`, which applies the checked-in `main` migration chain to disposable in-memory SQLite and checks `PRAGMA integrity_check` plus `PRAGMA foreign_key_check`.
- Cloudflare Source Validation passed on PR #177 head `2710bc6e43dac973ffbfd1278b4fe7b2f55520a6`; Graphify also passed. The SQLite rehearsal step passed.
- This verifies only the current checked-in baseline on a fresh database. It does not validate colliding feature-branch migrations or production D1's applied state.

## Current disposition

- **Merge readiness:** blocked for colliding migration branches until the inventory and canonical sequence are complete.
- **Production D1:** no change authorized or performed by this audit.
- **Production deployment:** no change authorized or performed by this audit.
- **Known applied migration history:** not available from repository files alone; must be read from each D1 environment.
- **Next implementation milestone:** obtain a read-only applied-migration inventory for staging and production, then build one canonical integration branch and rehearse it against representative legacy data.

## Evidence and limitations

This register was assembled from GitHub's current `main` migration tree and changed-file lists/patches for the PRs listed above. It is a source-control audit, not a live D1 inspection. PR contents can change; refresh the inventory before integration. The register intentionally does not prescribe migration renumbering because the applied migration state is unknown.
