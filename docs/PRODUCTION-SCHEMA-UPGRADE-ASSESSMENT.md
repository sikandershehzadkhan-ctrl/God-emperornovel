# Production D1 Schema Upgrade Assessment

**Updated:** 2026-10-28  
**Status:** Read-only assessment; production data has not been changed.

## Production target

- Worker: `god-emperornovel`
- D1 database: `god-emperornovel-db`
- Database ID: `78493557-1142-45e6-96aa-2ba9f67e3be0`
- Current observed Worker version: `16.63.0`
- Repository target: `16.65.0`
- Observed `app_settings.core_schema_version`: `16.12.1`
- Runtime fast-path marker expected by current source: `16.64.0`

## What the read-only audit established

- The public homepage and `/api/health` responded successfully in the audit.
- Every table declared by the current Worker source through literal `CREATE TABLE IF NOT EXISTS` statements was present in the production table inventory.
- All critical columns included in the targeted compatibility query were present.
- The production database has no `d1_migrations` history table, so migration history cannot be used to infer which historical changes were applied.
- The live `users.role` default differs from the current source's bootstrap-table default. This is a schema detail to preserve and review, not a reason to rewrite existing user rows.
- The legacy `content_rights` and `rights_audit_log` tables were absent from the latest inventory, but the current Worker source does not reference either table. They are not treated as required runtime tables.
- The catalog's aggregate rights and chapter integrity checks were read-only.
- Source validation on commit `e89a4d6a643e0d071bc6c17352c9a23353b24fad` passed syntax checks, build, non-deploying Wrangler bundle validation, safety invariants, and fresh-SQLite migration validation.

## Additional bootstrap hazard found in source review

The current `ensureCoreSchema()` path is not a safe substitute for a reviewed migration:

- It catches and ignores errors for each statement in its main schema list, so the sequence can continue after a failed table/index operation.
- It calls additional schema helpers and seed functions that may perform writes.
- It attempts to write `core_schema_version = 16.64.0` even if earlier schema statements failed.
- `ensurePublishingSchema()` includes data updates that normalize blank publication statuses, in addition to conditional column/index creation.

This means the marker is not sufficient proof that every expected schema operation completed. Do not deploy this path to production simply to advance the marker. A future fix should make schema initialization fail closed and only mark a version after every required operation and postcondition has been verified. Any such code change must be tested against both fresh SQLite and a production-shaped fixture before deployment.

## Why deployment remains guarded

A stale schema marker alone does not prove that all production schema details match the current source. Conversely, changing the marker alone would not upgrade any missing column. The current runtime's bootstrap also contains data updates and seed operations, so it must not be used as an unreviewed migration mechanism.

The production deploy workflow therefore blocks when the live marker is not `16.64.0`. Do not bypass that gate or manually update the marker to make a deployment pass.

## Safe upgrade sequence

1. Keep the current production D1 audit read-only.
2. Compare every SQL statement used by runtime routes against the production table definitions, including columns, indexes, defaults, and constraints. Pay particular attention to authentication/session, novel publishing/rights, chapters, tickets/ledger, requests, donations, comments, notifications, connectors, and admin operations.
3. Fix bootstrap error handling so schema readiness cannot be reported after a partial failure. Prefer explicit migration steps over a long best-effort bootstrap list.
4. Build an explicit, idempotent SQLite/D1 migration that adds only verified missing structures. Do not drop tables, replace tables, reset balances, promote accounts, or overwrite existing novel/chapter data.
5. Test that migration against a fresh SQLite database and a production-shaped schema fixture, including repeated application and injected failure cases.
6. Add a migration preflight that verifies the expected tables and columns before any write.
7. Only after those checks pass, back up production and apply the reviewed migration, then verify aggregate row counts, admin access, balances/ledger consistency, and publication integrity.
8. Update the schema marker only as the final step of a successfully verified migration. Deploy the Worker separately and re-check `/api/health`.

## Current safety rule

No production migration or Worker deployment is authorized by this document. The audit workflow performs SELECT/PRAGMA queries only. The deployment guard remains enabled until the full schema comparison and migration tests are complete.
