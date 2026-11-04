# Legacy core-schema rebuild plan

**Status:** design gate only. No migration number is reserved and no database is modified by this document.

## Why this is separate from bootstrap parity

The canonical fresh-install schema is `migrations/0001_initial.sql`. PR #210 aligns the runtime bootstrap with that migration for the tested core tables. SQLite's `CREATE TABLE IF NOT EXISTS` does not retrofit constraints onto an existing table. Databases created by an older bootstrap therefore need a separately reviewed table-rebuild procedure.

## Migration-sequence gate

Mainline currently ends at `0011_author_applications.sql`. PR #211 (unmerged) proposes `0012_atomic_ai_run_claims.sql`. Do not allocate a legacy-repair migration number until every open migration-bearing PR has been reconciled against latest mainline. Never infer the next number from a branch-local list.

## Read-only preflight requirements

Produce machine-readable and human-readable reports without writing to the database. For every affected table capture existence, row count, column metadata, original CREATE TABLE SQL, indexes, triggers, FK definitions, and `PRAGMA foreign_key_check`. Also check duplicate groups for every target unique constraint, invalid values for every target CHECK, and orphan counts for every intended relationship, including relationships absent from legacy FK metadata.

Distinguish **missing constraint** from **existing data violation**. A missing FK is not evidence that the data is clean.

## Data disposition policy

Fail closed on any row that cannot satisfy the target schema. Never silently delete rows, change ownership, coerce role values, invent parent records, or discard indexes/triggers. Every violation requires an explicit disposition approved before migration: (1) deterministic documented repair with before/after evidence, (2) quarantine/export with stable source identifiers and verified recoverability, or (3) manual resolution followed by a clean preflight. This plan approves no automatic disposition.

## Rebuild protocol

1. Verify backup creation and restore procedure before touching production.
2. Re-run preflight against the exact snapshot to be migrated.
3. Start a transaction using a documented SQLite/D1-compatible rebuild sequence.
4. Create replacement tables from canonical target DDL, preserving IDs and required values.
5. Copy rows without lossy casts or implicit defaults.
6. Recreate reviewed indexes and triggers.
7. Compare source/replacement row counts and stable per-row identity/value fingerprints.
8. Run FK checks, duplicate checks, CHECK probes, and application invariants.
9. Commit only if every assertion passes; otherwise roll back.
10. Write the schema-version marker only after verification, atomically where supported.

Prove the exact transaction and FK-enforcement sequence against the deployed D1/SQLite runtime. Do not assume desktop SQLite behavior guarantees D1 behavior.

## Required fixture matrix

| Fixture | Expected result |
| --- | --- |
| Clean legacy schema with valid rows | Rebuild succeeds; IDs and values preserved |
| Orphan session, chapter, join, unlock, comment, or request | Preflight blocks; no data removed |
| Invalid user role | Preflight blocks; no silent remapping |
| Duplicate rows conflicting with target unique key | Preflight blocks |
| Nullable donation owner | Preserved under canonical `ON DELETE SET NULL` semantics |
| Existing custom index or trigger | Preserved or explicitly rejected, never silently dropped |
| Empty affected tables | Rebuild succeeds with constraints present |
| Failure during copy or post-copy validation | Entire operation rolls back |
| Repeated invocation after success | Idempotent; no duplicate or data loss |
| Unexpected/partial schema | Fail closed with actionable diagnostics |

Tests must verify exact primary-key preservation, key values, target metadata, FK actions, unique indexes, CHECK rejection, trigger behavior, and rollback state, not only row counts.

## Production release gate

No production D1 migration is authorized by this plan. Before execution require a reviewed migration sequence, clean target preflight, verified backup and restore rehearsal, approved disposition for every violation, passing tests on a production-shaped copy, documented maintenance/rollback procedure, and explicit owner approval.

## Current truthful status

- PR #210: fresh runtime-bootstrap parity only; open and unmerged when this plan was authored.
- PR #211: atomic AI run-claim migration candidate `0012`; open and unmerged when this plan was authored.
- Legacy retrofit: not implemented, not assigned a migration number, and not run against production.
