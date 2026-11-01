# Imperial Novel: Cross-Branch Integration Gate and Verification Status

**Inspection date:** 1 November 2026
**Scope:** PR #118, PR #120, migration ordering and available CI evidence

## 1. Live GitHub state observed

| Item | Observed state |
|---|---|
| `main` | `33881f47c932096d2685bcc0ae777f8df1151a53` |
| PR #118 | Open, draft, unmerged; head `1f69507f32cd1589fe076ad69381b8d8a6ba7d0b`; base `6c3971390c2fad9f60aae104cbaf66c17dbf4c92` |
| PR #120 | Open, draft, unmerged; head `dea44ca5b0ba9261deed772c399db3318d8e5fa9`; base matches current `main` |

## 2. Check runs observed

GitHub check-run API was queried for the exact head commits above.

| PR | Check | Conclusion |
|---|---|---|
| #118 | Build official Graphify code graph (offline) | success |
| #118 | validate-source | success |
| #120 | Build official Graphify code graph (offline) | success |
| #120 | validate-source | success |

These are successful PR-local checks on their respective heads. GitHub commit status objects returned `pending` with no legacy status entries; the completed check-run conclusions are the relevant observed CI evidence.

## 3. What these checks do and do not prove

They provide evidence that each PR's own source-validation and Graphify checks passed at the inspected head. They do **not** prove:

- PR #118 and PR #120 have been combined into one branch and validated together;
- all ordered D1 migrations from 0001 through 0018 apply in the intended sequence;
- the PR #118 migration and runtime schema initializer remain behaviorally identical after future edits;
- the actual production D1 database is at the expected schema version;
- a backup/restore drill has passed;
- application-level route authorization, content rights, DTO privacy or live production behavior is correct.

## 4. Required combined validation sequence

1. Integrate PR #118's `0012_runtime_feature_schema.sql` into the current mainline without losing its runtime schema marker version-2 upgrade.
2. Integrate PR #120's migration 0013–0018 sequence, ensuring 0014 and 0018 do not duplicate DDL owned by 0012.
3. Build a temporary integration branch containing both complete PR heads on one current base. Do not deploy this branch.
4. Run the complete source validation, Worker build/dry-run, Graphify and all Node regression tests on that combined tree.
5. Run all migrations in order against a fresh SQLite-compatible database.
6. Run migration 0012 against a representative legacy schema containing orphaned/duplicate interactions and verify archive preservation, cleanup, triggers, cascades and idempotency.
7. Run the runtime initializer from both marker version 1 and a fresh database; compare resulting schema and behavior with the migration-only path.
8. Verify all tables, columns, indexes, triggers, constraints and schema markers after both paths.
9. Only after the combined branch passes, review PR readiness and plan any production migration separately with backup and restore verification.

## 5. Next implementation gate after migration integration

Once the schema foundation is reconciled, proceed to isolated application-level P0 fixes:

- owner-only authority for role elevation and sensitive administration;
- central rights eligibility predicate applied to all content routes;
- explicit public DTO allowlists instead of full-row novel selection;
- analytics write isolation so chapter reading does not depend on synchronous aggregate writes;
- route-level tests proving object ownership, privacy and fail-closed behavior.

These P0 fixes must have failing-before/passing-after tests and must not be marked complete based only on source-text searches.

## 6. Safety disposition

**Current state:** both PRs remain drafts. Individual CI check runs passed. Combined integration is not yet verified.

**No PR merged, no branch merged, no production D1 accessed or modified, no deployment executed.**