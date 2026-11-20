# Legacy Core-Schema Rebuild Plan

**Status:** design and verification gate only. This document does not reserve a migration number, authorize data repair, or authorize a production D1 operation.

## Purpose and boundary

Fresh-install schema parity and legacy-database retrofit are different problems. Creating a table with `IF NOT EXISTS` does not retrofit constraints onto an existing table. A successful fresh-bootstrap test therefore cannot prove that databases created by older application versions satisfy the current schema.

This plan governs a future legacy retrofit. It is intentionally read-only until a separately reviewed implementation and explicit owner authorization exist.

## Canonical schema source

- Treat the migration sequence and schema ownership files on the current canonical integration branch as authoritative.
- Never infer the next migration number from an old PR, local branch, package version, or historical document.
- Recompute migration ordering, duplicate object names, semantic overlap, dependencies, and ownership immediately before proposing any migration.
- Never copy historical migrations from a stale branch or renumber an already published migration.
- A migration proposal must include an immutable allocation record, exact target DDL, dependency review, and replay evidence.

## Read-only preflight

The auditor must not issue DDL or DML. For each affected table it should report:

1. Table existence, row count, column names/types/nullability/defaults/primary-key metadata, and original `CREATE TABLE` SQL.
2. Indexes and triggers, including their full SQL definitions.
3. Declared foreign keys and their update/delete actions.
4. `PRAGMA foreign_key_check` results.
5. Duplicate groups for every intended unique constraint.
6. Invalid values for every intended CHECK constraint and application invariant.
7. Orphan counts for every intended relationship, including relationships absent from legacy FK metadata.
8. Stable identifiers for every violating row, without exposing secrets or unnecessary personal data.

The report must distinguish a missing constraint from existing data that violates the intended constraint. A missing foreign key is not evidence that the underlying rows are valid.

The auditor must fail closed when a table is unexpected, partially migrated, or cannot be inspected. It must produce machine-readable output and a human-readable summary with a non-zero exit status for unsafe findings.

## Data-disposition policy

No automatic data disposition is approved by this plan.

Never silently:
- delete rows;
- change account, author, or content ownership;
- coerce roles or status values;
- invent parent records;
- drop custom indexes or triggers;
- replace invalid values with defaults;
- weaken canonical constraints to make legacy data pass.

Every violation requires a separately reviewed decision: deterministic documented repair with before/after evidence, recoverable quarantine/export with stable source identifiers, or manual resolution followed by a clean preflight. Preserve source evidence and prove recoverability before any destructive action.

## Rebuild protocol to be proven before implementation

1. Create a verified backup and rehearse restoration on an isolated copy.
2. Run preflight against the exact snapshot proposed for migration.
3. Resolve every violation through an approved disposition and rerun preflight.
4. Prove the exact transaction and foreign-key enforcement sequence on a D1-compatible test environment.
5. Create replacement tables from the current canonical target DDL.
6. Copy values without lossy casts, implicit ownership changes, or silent defaults.
7. Recreate reviewed indexes and triggers.
8. Compare row counts and stable per-row identity/value fingerprints.
9. Verify primary keys, unique constraints, CHECK constraints, FK actions, indexes, triggers, and application invariants.
10. Demonstrate rollback after injected failures at multiple points.
11. Demonstrate idempotent repeated execution.
12. Update schema-version metadata only after every verification succeeds, atomically where supported.

Desktop SQLite success alone is not proof of D1 behavior. Record the exact D1/SQLite compatibility evidence and limitations.

## Required fixture matrix

| Fixture | Required outcome |
| --- | --- |
| Clean legacy schema with valid rows | Rebuild succeeds and preserves IDs and values |
| Orphan session, chapter, join, unlock, comment, or request | Preflight blocks; no row is deleted |
| Invalid user or role value | Preflight blocks; no silent remapping |
| Duplicate rows conflicting with a target unique key | Preflight blocks |
| Nullable donation/payment owner | Canonical nullability and delete semantics are preserved |
| Custom index or trigger | Preserved or explicitly rejected; never silently dropped |
| Empty affected tables | Constraints are present after rebuild |
| Failure during copy or post-copy validation | Entire operation rolls back |
| Repeated invocation | Idempotent; no duplicate or data loss |
| Unexpected or partially migrated schema | Fails closed with actionable diagnostics |
| Restore rehearsal | Backup restores and passes the same integrity suite |

Tests must assert exact primary-key preservation, representative values, target metadata, FK actions, uniqueness, CHECK rejection, trigger behavior, and rollback state. Row counts alone are insufficient.

## Release authorization gates

A production operation requires all of the following, separately recorded:

- reviewed and immutable migration allocation;
- clean read-only preflight on the exact target snapshot;
- verified backup and successful restore rehearsal;
- approved disposition for every violating row;
- passing tests on production-shaped disposable data;
- proven D1-compatible transaction and rollback behavior;
- documented maintenance, monitoring, and rollback/forward-repair plan;
- exact candidate commit passing required validation;
- explicit owner approval for the production operation.

CI success, a green dry-run, or this document is not production authorization.

## Current truthful status

- The canonical integration branch contains later schema and governance work than the historical PRs that motivated this plan.
- The exact migration head and ownership allocation must be read from the canonical branch at implementation time, not copied from this document.
- A legacy retrofit is not authorized by this document.
- No production D1 database has been queried or modified as part of this plan.
