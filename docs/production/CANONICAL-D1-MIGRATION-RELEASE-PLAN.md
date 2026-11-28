# Canonical production D1 migration release plan

STATUS: BLOCKED

## Why production release is blocked

The development integration now has one canonical migration chain, 0001–0046 and 0048–0049; 0047 is retired and never reused. The production deployment workflow previously referenced branch-local files named `0012_chapter_revisions.sql` and `0013_scheduled_chapter_publications.sql`. Those names are no longer valid in the canonical chain: profile/account migrations own 0012–0015, and chapter revisions/scheduling are 0016–0017.

The production D1 database's exact applied migration history has not been inspected and reconciled in this work session. A source-tree replay against fresh SQLite is not evidence of the remote D1 state.

The workflow is therefore hard-disabled. Do not remove that block merely to deploy the new Worker.

## Canonical migration chain

- 0001–0011: existing platform foundation and author application base.
- 0012: user profiles.
- 0013: username change cooldown/history.
- 0014: account preferences.
- 0015: historical username insert guard.
- 0016: chapter revisions.
- 0017: scheduled chapter publications.
- 0018–0027: media, rights, comics, quotas, donation review, ticket adjustments and novel-request refunds.
- 0028: community/runtime integrity reconciliation.
- 0029: chapter update timestamps.
- 0030: daily view analytics.
- 0031: account closure requests.
- 0032: Author Studio writing goals.
- 0033: private creator notes.
- 0034: fresh-install legacy ratings baseline.
- 0035: one-time 1–5 to 1–10 rating conversion and aggregate recomputation in `migrations/0035_ten_point_ratings.sql`.
- 0036: single-use, purpose-bound password reset tokens stored as hashes.
- 0037: mailbox ownership verification, separate from the existing creator/admin verification badge.
- 0038: password-reset token mailbox snapshot binding.
- 0039: consent-based novel ownership transfer with guarded acceptance and immutable transfer history.
- 0040: canonical account-closure request table rebuild, preserving request and review metadata while enforcing the governed status set.
- 0041: account-deletion review cases, versioned claims, and append-only review events. This stores review state only; it does not execute deletion.
- 0042: explicit account-deletion reviewer role assignments and append-only assignment/revocation audit.
- 0043: immutable, version-bound account-deletion disposition plans and items.
- 0044: independent immutable approval bound to the exact disposition-plan digest.
- 0045: specialist-scoped immutable account-deletion findings and corresponding audit events.
- 0046: token-fenced AI Author Studio run-claim columns and lookup index.
- 0047: retired allocation; never reuse.
- 0048: canonical OmniPortal support tables for side-effect-free read endpoints.
- 0049: unique pending connector authorization request per connector; requires zero duplicate pending groups before application.
- 0050: server-side Imperial user XP ledger with globally unique source-event keys and an opt-in public-rank visibility preference. XP remains derived from verified server events; founder identity and founder-only rank are not stored in this schema.

## Canonical migration checksum evidence

The repository includes `scripts/export-canonical-migration-checksums.mjs`. It computes SHA-256 over the exact raw bytes of every numbered migration file, rejects duplicate sequence numbers, empty files, and duplicate exact payloads, and emits a deterministic JSON manifest with `node scripts/export-canonical-migration-checksums.mjs --json`. The normal build runs its validation mode. Capture the JSON output together with the exact Git commit when preparing the signed-off production reconciliation evidence. This source manifest describes the candidate repository only; it is not a production applied-migration ledger and must never be used to infer remote application.

## Evidence-based migration reconciliation tool

The repository includes `scripts/reconcile-production-migrations.mjs`. It compares the candidate checksum manifest with an explicitly supplied production evidence JSON file. Each repository migration is classified as:

- `verified`: exact filename and SHA-256 checksum match the production evidence.
- `missing`: absent from a production ledger that the evidence explicitly marks complete.
- `mismatch`: checksum differs, or production lists a migration absent from the candidate repository.
- `unknown`: evidence is incomplete, or the production ledger has a name but no independently verified checksum.

A plain `d1_migrations` filename row is not a checksum. It must remain `unknown` unless independent evidence establishes the exact applied file bytes. If ledger completeness cannot be established, absent rows remain `unknown`, never `missing`. The tool exits nonzero unless every row is verified and there are no extra production migration identities.

Run the candidate-side exporter and reconciliation test with:

```sh
node scripts/export-canonical-migration-checksums.mjs --json > repository-migrations.json
node scripts/reconcile-production-migrations.mjs --self-test
node scripts/reconcile-production-migrations.mjs repository-migrations.json production-migration-evidence.json
```

The production evidence file must be created only from the approved read-only audit and independently reviewed migration provenance. Required shape:

```json
{
  "database": "god-emperornovel-db",
  "auditedAt": "2026-11-22T00:00:00Z",
  "ledgerComplete": false,
  "appliedMigrations": [
    { "name": "0001_initial.sql", "sha256": "<64-character verified SHA-256>" }
  ]
}
```

The example is a schema illustration, not production data. Do not fill it with guessed checksums or assume the migration ledger is complete. The self-test covers all four outcomes, extra production identities, and invalid/duplicate evidence. The build runs this self-test. This tool does not connect to Cloudflare, read production itself, apply migrations, or authorize deployment.

## Required work before a production release

1. Obtain a recoverable production D1 backup and verify that it can be restored.
2. Inspect the remote D1 schema marker, tables, columns, indexes, triggers, foreign keys and any existing migration ledger using read-only queries.
3. Compare the actual remote schema against each canonical migration. Determine which changes were previously applied manually, through runtime bootstrap, or by earlier deployment workflows.
4. Build a signed-off applied-migration ledger with the exact canonical filename and SHA-256 checksum for every migration already represented in production. Never infer that a migration ran merely because a similarly named table exists.
5. Rehearse the remaining migration plan against a production-shaped disposable SQLite/D1 copy, including legacy profile/account data, existing chapter revisions, media/comic references, community records, tickets/donations, private author data, existing ratings, password-reset and email-verification records, ownership transfers, account-closure requests/review metadata, and AI Author Studio jobs.
6. Pay special attention to data-rebuilding migrations 0035 and 0040. For 0035, verify the existing ratings table constraint and data, preserve timestamps, map old scores 1–5 to 2/4/6/8/10, recompute novel averages, and prove the operation is applied exactly once. For 0040, verify every existing account-closure request and review field is preserved, unknown statuses are handled as specified, and required indexes are recreated.
7. Review the security and integrity boundaries introduced by 0036–0046 and 0048–0049 in the rehearsal: token hashes only and purpose/expiry/consumption guards; mailbox snapshot binding; consent and eligibility checks on ownership transfer; separation of account-deletion review from deletion execution; reviewer role and independent approval constraints; immutable audit/disposition records; and token-fenced AI run claims.
8. Only after review, implement a ledger-aware runner that applies only verified missing migrations, records checksums transactionally where possible, stops on any mismatch, and verifies post-migration schema.
9. Re-enable production deployment in a separate reviewed change with explicit approval. Deploy only after the D1 migration step and Worker dry-run both pass.

## Required post-migration schema checks

At minimum, the reviewed release runner must verify these structures before deploying the Worker:

- `idx_chapter_revisions_chapter_created` and `idx_scheduled_chapter_publications_due`.
- `author_story_goals` and `idx_author_story_goals_owner_updated`.
- `author_private_notes`, `idx_author_private_notes_owner_story_updated` and `idx_author_private_notes_chapter`.
- The ten-point `ratings` CHECK constraint and recomputed novel rating aggregates.
- `password_reset_tokens` with unique token hashes and active-token indexes; `email_verification_tokens` with its separate `users.email_verified_at` field and active-token indexes; and `password_reset_tokens.email_snapshot`.
- `novel_ownership_transfers`, its pending-transfer uniqueness constraint, recipient/owner/history/expiry indexes, and guarded acceptance/immutability triggers.
- `account_closure_requests` with its pending-per-user and status/grace indexes.
- `account_deletion_reviews`, `account_deletion_review_events`, `account_deletion_reviewer_assignments`, `account_deletion_reviewer_assignment_events`, `account_deletion_disposition_plans`, `account_deletion_disposition_items`, `account_deletion_disposition_approvals`, and `account_deletion_disposition_findings`; verify their foreign keys, uniqueness constraints, reviewer/scope guards, version/digest checks, and append-only audit/immutability triggers.
- `ai_author_projects.active_run_token`, `ai_author_projects.active_run_started_at`, `ai_author_projects.active_run_owner_user_id`, `ai_chapter_jobs.run_token`, and `idx_ai_chapter_jobs_run_token`.
- `connector_events`, `import_jobs`, `recommendations`, and `connector_authorization_requests` from migration 0048; verify their expected indexes and foreign keys.
- The partial unique index `idx_connector_auth_one_pending_per_connector` from migration 0049; prove the preflight finds zero duplicate pending groups and that request history is preserved.
- `PRAGMA integrity_check` and `PRAGMA foreign_key_check` on the rehearsal database.

## Current safety state

- Production D1 migration: not performed.
- Production Worker deployment: not performed.
- Remote migration ledger: not verified.
- Existing deployment workflow: hard-disabled in `.github/workflows/deploy.yml`.
- Fresh SQLite migration replay: validated in Cloudflare Source Validation, but it does not replace the remote audit above.
- Migrations 0036–0049: present in the development integration only; their presence and successful fresh-database replay do not establish that they have been applied to production D1.

## Required integration CI evidence

Before this pull request is considered ready for review, its current head must have fresh successful pull-request checks for both **Imperial Novel Cloudflare Source Validation** and **Graphify architecture map**. Confirm the checks belong to the exact current head SHA, not an earlier commit. A mergeable GitHub status and a successful fresh-SQLite replay are not substitutes for those checks. If either workflow is skipped or does not start, treat validation as pending and investigate the workflow trigger; do not mark this release plan complete.

## Donation review and posting ownership

Migration 0024's approval trigger is the sole authority for Crown balance credit and payment-ledger posting. The Worker must insert the attributable `donation_reviews` row and transition the pending donation, but must not also update the user's balance or insert a second payment-ledger row. Migration 0026 enforces independent review at the database boundary. The admin UI must collect a required review note. The candidate integration includes source and SQLite regression tests for these invariants; this does not replace production-shaped rehearsal or remote D1 inspection.

## Administrator Crown adjustments and novel-request refunds

Migrations 0025 and 0027 are the single posting authorities for administrator credits and paid-request refunds. The Worker inserts the corresponding immutable financial record and must not also update user balances or insert payment-ledger rows. Administrator adjustments require an independent admin, bounded reason, and stable idempotency key. Paid-request refunds require a pending-to-rejected transition, active independent admin, a bounded note, and an amount exactly matching the original request cost. Build-gated SQLite tests exercise the database triggers. These migrations and the corresponding Worker changes must be rehearsed together before release.

## OmniPortal read-route schema dependency

Migration 0048 provisions the four support tables queried by side-effect-free OmniPortal GET routes. The migration is replay-safe for tables already created by the former lazy initializer. It intentionally does not add optional connector configuration columns; their remote presence is an explicit read-only audit finding and must be reconciled before any later column migration. Migration 0049 adds a partial unique index for one pending authorization request per connector. Its preflight must confirm there are no duplicate pending groups; the migration deliberately fails rather than deleting request history.


## Shared runtime schema bootstrap remains a separate blocker
The OmniPortal route changes remove route-local ensureOmniTables calls and add method guards, but the Worker API dispatcher still invokes ensureCoreSchema and ensureRuntimeFeatureSchema before route dispatch. Therefore the complete HTTP GET request is not yet guaranteed to be read-only. Do not remove these shared initializers until a complete table/column inventory, migration coverage map, production read-only audit, and production-shaped rehearsal prove that all required schema is supplied by canonical migrations.


## Shared runtime initializer inventory (2026-11-20)

A source-level inventory of the remaining runtime DDL and migration coverage is maintained in [SHARED-RUNTIME-SCHEMA-INVENTORY.md](./SHARED-RUNTIME-SCHEMA-INVENTORY.md). It records the still-unmigrated `comments.parent_id` and `comments.edited_at` columns, `taxonomy_submissions`, and eight optional `connectors` columns, plus the initializer's marker, cleanup, taxonomy/agent seeding, and scheduled-handler responsibilities. The inventory test is part of the Cloudflare build. This is source evidence only; it does not establish the remote D1 state and does not authorize removal of the runtime initializers.

## Latest production evidence (2026-11-23, read-only)

Latest audit run: [#45185492870](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/45185492870), executed from branch `foundation/canonical-migrations-current-mainline-2026-11-22` at commit `9051b040583533aae23a63c82c6cce1525a42280`. The complete read-only audit job succeeded and uploaded artifact [`production-runtime-schema-evidence-9051b040583533aae23a63c82c6cce1525a42280`](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/45185492870/artifacts/14823488359).

The audit verified Cloudflare account access, found a current D1 Time Travel bookmark, and received HTTP 200 from the public Worker. The health endpoint returned `ok: true`, database connected, and live Worker version `17.23.0`; the repository target was `17.24.0`. The bookmark is not a backup/restore rehearsal. The audit used SELECT/PRAGMA metadata reads only. The D1 query metadata consistently reported `changed_db: false` and `rows_written: 0`; no migration, schema mutation, or deployment was performed.

### Full captured schema inventory and comparison

The uploaded artifact was downloaded and inspected directly. It contains:
- 45 tables
- 28 explicit indexes
- 52 table-index entries
- 6 foreign keys
- 0 triggers

The capture diagnostics report `completed: true` and `inventoryComplete: true`. The comparison assessed 77 source-defined objects: 47 verified, 30 missing, zero mismatches and zero unknown. `definitionsCompatible: false` and `releaseReady: false`.

The 30 missing objects are fully accounted for:
- 3 tables: `media_assets`, `comic_chapter_pages`, `media_asset_reviews`.
- 3 unique constraints: `media_assets(object_key)`, `comic_chapter_pages(chapter_id,page_number)`, and `comic_chapter_pages(chapter_id,media_asset_id)`.
- 6 foreign keys across those three media tables, including their user, chapter and media-asset relationships.
- 5 explicit indexes: `idx_media_assets_owner_status`, `idx_media_assets_rights_status`, `idx_comic_pages_chapter_order`, `idx_comic_pages_asset`, and `idx_media_asset_reviews_asset_created`.
- 13 triggers: the media publication eligibility, novel-owner matching, independent review, review immutability, owner quota, deletion timestamp and terminal-deletion guards defined by migrations 0019–0022.

Because the inventory is complete and contains zero triggers, those 13 required trigger names are absent from the captured production schema. This is now an evidence-backed absence finding, not an unknown as it was in the previous audit. The three tables and their dependent keys/indexes/triggers must be treated as a coherent missing media-registry subsystem, not installed piecemeal.

### Other release blockers reconfirmed

- No `d1_migrations` table exists. Applied migration history and exact checksums remain unverified.
- `app_settings.core_schema_version` remains `16.64.0`.
- Live Worker is `17.23.0`, while repository target is `17.24.0`.
- A current Time Travel bookmark exists, but no restore rehearsal has been performed.
- The schema comparison deliberately sets `releaseReady: false`; even a future all-green object comparison would not prove migration provenance, row-data safety, backup restoration or production-shaped rehearsal.

### Interpretation and next safe action

The audit's overall GitHub conclusion is `success` because all required read-only inspection and artifact-capture steps completed. The schema comparator separately reported missing definitions using a warning, not a workflow failure. Do not interpret the green workflow badge as database release readiness.

Do not synthesize a `d1_migrations` ledger from table presence or the version marker. Do not apply migrations 0018–0022 directly or create the three media tables independently of their foreign keys, uniqueness constraints, indexes and integrity triggers. The next engineering step is to reconcile the complete canonical migration chain against production objects and independently establish which historical changes came from migrations, runtime initialization or manual operations. Then prepare and verify a recoverable backup, rehearse the full remaining sequence against a production-shaped copy, and obtain explicit release approval. Production migration and Worker deployment remain blocked.
