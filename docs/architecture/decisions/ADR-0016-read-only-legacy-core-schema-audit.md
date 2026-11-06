# ADR-0016: Read-only legacy core-schema preflight

- **Status:** Proposed
- **Date:** 2026-11-05
- **Decision owners:** Platform data and security

## Context

Legacy SQLite databases and backups may predate the current core schema. A migration plan must not assume that table names alone prove compatibility: columns, foreign keys, unique indexes, CHECK allowlists, named index/trigger definitions, integrity, and existing data can drift independently.

## Decision

1. Provide a local audit tool that compares a user-supplied SQLite backup/export with the canonical core schema in migration `0001_initial.sql`.
2. Open the inspected database using SQLite URI `mode=ro` and enable `PRAGMA query_only=ON`; the tool must not write to the inspected database.
3. Report missing canonical tables/objects, column and constraint drift, orphan relationships, duplicate unique groups, invalid simple CHECK allowlist values, integrity and foreign-key violations, custom objects, and same-name index/trigger definition drift.
4. Keep the comparison scope explicit: this is a core-schema preflight against migration 0001, not a full migration-chain audit or proof that a production database is safe to migrate.
5. Run the self-test only against in-memory fixtures in CI. Never connect this workflow to Cloudflare or production.

## Consequences

- Operators can inspect a verified local backup before designing a migration rollout.
- A clean result is a prerequisite for further review, not authorization to mutate production.
- Custom indexes/triggers are reported conservatively and require human review.
- Full migration-chain compatibility, production schema inventory, and resumable rollout remain separate release gates.

## Validation

`python3 scripts/audit-legacy-core-schema.py --self-test` exercises clean and drifted fixtures, object-definition mismatch, orphan and CHECK violations, duplicate unique values, custom objects, and the read-only write guard.
