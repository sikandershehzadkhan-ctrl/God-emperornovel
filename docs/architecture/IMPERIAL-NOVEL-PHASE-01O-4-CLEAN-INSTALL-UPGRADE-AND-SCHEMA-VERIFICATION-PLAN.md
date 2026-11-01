# Imperial Novel | Phase 01O.4: Clean Install, Upgrade & Schema Verification Plan

**Review date:** 2026-11-01  
**Audited ref:** `architecture/phase-01m-screen-blueprint`  
**Status:** Test design only. No database or migration execution.

## 1. Objective

Prove that the canonical migration set can:
1. initialize an empty SQLite database deterministically;
2. upgrade each supported legacy schema without losing user, story, chapter, financial, reading or moderation data;
3. produce the same expected schema regardless of whether the environment began from a supported clean baseline or supported legacy baseline;
4. support the application release that claims compatibility with that schema.

The migration inventory currently contains 17 files with a missing 0012. A clean-install pass cannot be claimed until the missing ownership gap and all runtime/migration conflicts are resolved.

## 2. Freeze the test inputs

Every run records:
- repository, branch, commit SHA and package version;
- ordered migration filename list and SHA-256 checksums;
- SQLite/D1 engine/runtime version;
- migration runner and exact command;
- fixture source and fixture checksum;
- foreign-key enforcement configuration;
- expected schema inventory version;
- test start/end timestamps and complete logs.

Never test a moving branch. Pin the exact commit.

## 3. Required fixture families

### F0: Empty database
A truly empty SQLite database. Apply only the canonical numbered migrations. Do not run application startup or runtime schema helpers. This proves migration-only bootstrapping.

### F1: Legacy runtime-bootstrap database
Construct a fixture from the exact historical runtime schema version(s) that are officially supported. Include schema markers only when they match the captured source behavior. Include representative existing rows.

### F2: Community feature schema
Represent both runtime-helper-created tables and the candidate 0012 schema variants. Include rows with and without foreign-key relationships.

### F3: Existing ratings
Include 1–5 ratings, boundary values, timestamps, duplicates if historically possible, and the exact legacy indexes/triggers. Include a separate fixture already at 1–10 to test idempotent compatibility decisions.

### F4: Publishing and chapters
Include novels/chapters with draft, published, rejected, missing or null historical status values as permitted by actual schema. Include updated_at nulls, chapter_views, triggers and indexes.

### F5: Commerce and donations
Include pending/approved/rejected donations, duplicate normalized reference IDs, ticket ledger history, unlock records, and all relevant balances. No fixture may silently manufacture financial truth.

### F6: OmniPortal, AI and analytics
Include existing connector, import job, recommendation, AI project/job, view aggregate and agent/taxonomy rows where those structures exist in the supported legacy schema.

### F7: User and permission states
Include user, author, moderator and admin accounts, banned/restricted states where represented, author applications, owned works and cross-owner references.

## 4. Test sequence

1. Verify fixture checksum and schema inventory.
2. Enable and verify foreign-key enforcement for SQLite test runs.
3. Apply migrations one at a time in exact lexical order, capturing success/failure and transaction behavior.
4. Stop on first failure; do not skip or reorder a migration to make the suite green.
5. After each migration, capture schema objects and row counts.
6. Verify all indexes, triggers, foreign keys, uniqueness and CHECK constraints.
7. Run data-integrity queries and compare before/after row counts and key relationships.
8. Run application query smoke tests against the migrated schema.
9. Run authorization and owner-scope tests against the same fixture.
10. Re-run the approved idempotency/compatibility checks without changing already-applied migration history.
11. Repeat equivalent tests on a disposable D1 database.
12. Export a signed-off test report tied to the exact source SHA.

## 5. Schema equivalence report

Compare:
- sqlite_master tables, indexes, triggers and SQL definitions;
- PRAGMA table_info for all tables;
- PRAGMA index_list and index_info;
- PRAGMA foreign_key_list;
- PRAGMA foreign_key_check;
- CHECK constraints and unique constraints;
- normalized column types/defaults/nullability;
- migration history and checksums;
- data counts, relationship integrity and critical aggregates.

A schema compatibility result is not just “tables exist”. Definitions and constraints must match the expected contract.

## 6. Data-preservation invariants

- User IDs and account ownership remain stable.
- Novel/chapter IDs and author ownership remain stable.
- Every unlock retains its chapter/user relationship and cost.
- Ticket ledger rows remain append-only and balances reconcile.
- Donation/payment references and review outcomes remain auditable.
- Reading positions, bookmarks and history remain owner-scoped.
- Moderation reports and staff decisions remain retrievable under their access policy.
- Rating values and timestamps are preserved during 1–5 to 1–10 conversion.
- Duplicate/orphan cleanup is fully counted and archived under an approved retention policy.
- No migration silently publishes drafts or changes rights status.

## 7. Release gates

| Gate | Requirement | Pass evidence |
|---|---|---|
| G1 | Canonical source SHA frozen | Release record |
| G2 | Migration list complete and contiguous | Inventory/checksum report |
| G3 | Every DDL object has one owner | Schema ownership matrix |
| G4 | Empty database migration succeeds | Clean-install logs |
| G5 | All supported legacy upgrades succeed | Fixture upgrade logs |
| G6 | Schema equivalence passes | Object/constraint diff |
| G7 | Data preservation passes | Before/after reconciliation |
| G8 | Application queries pass | API smoke test results |
| G9 | Role and resource authorization passes | Positive/negative test matrix |
| G10 | Disposable D1 matches SQLite contract | D1 verification report |
| G11 | Rollback/forward recovery approved | Recovery runbook |
| G12 | Release compatibility signed off | Engineering/security approval |

## 8. Failure handling

- Stop at the first unexpected migration failure.
- Preserve fixture and full logs.
- Do not rewrite a released migration to bypass the failure.
- Design a forward-only migration or an explicitly versioned baseline strategy.
- Reproduce the failure in a second isolated fixture before accepting a fix.
- Never test against production D1 or a production Worker binding.
- No live schema repair, migration or deploy is authorized by this document.

## 9. Current status

Not executed:
- clean SQLite migration chain;
- legacy upgrade fixtures;
- D1 fixture migration;
- schema equivalence;
- application query tests;
- role/authorization tests.

**Gate result: NOT PASSED / NOT YET TESTED.** The missing 0012 artifact and runtime/migration ownership differences must be resolved before test execution can establish a release candidate.
