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
- **Migration guard correctness:** the existing duplicate-payload guard normalizes all whitespace, including whitespace inside SQL string literals and quoted identifiers. Replace that normalizer with a quote-aware SQL canonicalizer or use a conservative exact-byte hash plus a separate reviewed duplicate report. Do not let the guard claim semantic equivalence it cannot prove.

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

## Current disposition

- **Merge readiness:** blocked for the colliding migration branches until the inventory and canonical sequence are complete.
- **Production D1:** no change authorized or performed by this audit.
- **Production deployment:** no change authorized or performed by this audit.
- **Known applied migration history:** not available from repository files alone; must be read from each D1 environment.
- **Next implementation milestone:** a quote-aware migration integrity test plus a disposable full-chain rehearsal, followed by a canonical integration branch.

## Evidence and limitations

This register was assembled from GitHub's current `main` migration tree and changed-file lists/patches for the PRs listed above. It is a source-control audit, not a live D1 inspection. PR contents can change; refresh the inventory before integration. The register intentionally does not prescribe migration renumbering because the applied migration state is unknown.
