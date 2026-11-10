# ADR-0014: Runtime core schema parity with canonical migration

- **Status:** Proposed
- **Date:** 2026-11-05
- **Decision owners:** Platform data and platform kernel

## Context

The runtime `ensureCoreSchema` first-install statements drifted from canonical migration `0001_initial.sql`. In particular, the runtime definitions omitted the role CHECK constraint and multiple foreign keys, and retained a default for `unlock_batches.cost` that the canonical migration does not define. A fresh runtime bootstrap could therefore create a weaker schema than a fresh migration replay.

## Decision

1. Treat migration `0001_initial.sql` as the canonical definition for the audited core tables.
2. Align the runtime first-install DDL with its role constraint, defaults, primary keys and foreign-key actions.
3. Keep the existing `16.64.0` schema-marker fast path unchanged.
4. Add source-level assertions and independent SQLite schema comparison tests for 17 core tables.
5. Keep production schema preflight read-only. Do not rebuild existing live tables or infer production schema compatibility from a fresh-database test.

## Consequences

- Fresh runtime bootstrap and canonical migration replay produce matching core schemas.
- Invalid user roles and orphaned core references are rejected by the database.
- Existing production tables are not retroactively upgraded by `CREATE TABLE IF NOT EXISTS`; any required production repair must be separately assessed and migrated.
- No migration number is allocated and no production D1 operation is part of this decision.

## Validation

The dedicated Runtime Schema Parity workflow runs the JavaScript source assertions and Python SQLite structural comparison on pull requests to main and integration branches.
