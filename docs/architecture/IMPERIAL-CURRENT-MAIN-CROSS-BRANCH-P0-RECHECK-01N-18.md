# Imperial Novel: Current-Main Cross-Branch Integration and P0 Recheck

**Phase:** 01N integration gate
**Status:** Read-only GitHub comparison and source recheck; no branch merge, source edit, migration or deployment
**Inspection date:** 1 November 2026

## 1. Current branch facts

| Reference | Verified state |
|---|---|
| `main` | `33881f47c932096d2685bcc0ae777f8df1151a53` |
| PR #118 base | `6c3971390c2fad9f60aae104cbaf66c17dbf4c92` |
| PR #118 head | `1f69507f32cd1589fe076ad69381b8d8a6ba7d0b` |
| PR #118 | Open, draft, 20 commits, 6 changed files |
| PR #120 base | current main SHA above |
| PR #120 head | `dea44ca5b0ba9261deed772c399db3318d8e5fa9` |
| PR #120 | Open, draft, 500 commits reported, 50 changed files |

GitHub compare for current main against PR #118 reports `diverged`, 20 commits ahead and 2 behind. PR #120 is based directly on current main. Both PR objects report `mergeable=true` at inspection, but this is not a combined PR #118 + PR #120 integration result.

## 2. Integration implications

- PR #118 was authored against an older base. Its changes must be replayed/reconciled against current main rather than assuming its branch base is current.
- PR #120 has a very large reported commit count (500). Before any merge, inspect its full ancestry and ensure the intended change set, not unrelated branch history, is what will be integrated.
- Both PRs modify `src/index.js`; the combined result must be reviewed at handler and route level, not merely accepted because GitHub reports each PR individually mergeable.
- PR #118 owns `migrations/0012_runtime_feature_schema.sql` and updates `src/runtime-feature-schema.mjs` to schema marker version 2.
- PR #120 deliberately re-sequences migrations 0013–0018 and leaves 0014 and 0018 as no-op placeholders, deferring shared community schema DDL to migration 0012.
- PR #118 adds a legacy community schema integrity test and updates the runtime schema test. PR #120 has its own broad test suite. Neither PR's separate CI proves the combined migration/runtime bootstrap chain.

## 3. Recheck of P0 findings on PR #120 head

Source inspected at PR #120 head `dea44ca5b0ba9261deed772c399db3318d8e5fa9`, `src/index.js` blob `13874ee0fde4e31e04a652c5169776c3b6f95c38`.

| P0 finding | PR #120 head observation | Disposition |
|---|---|---|
| Generic admin role escalation | `PATCH /api/admin/users/:id` still uses `admin(u)` and accepts role `admin`; no distinct owner principal is enforced in this handler | OPEN |
| Public catalog rights enforcement | `GET /api/novels` filters published status but not the rights allowlist | OPEN |
| Public novel detail rights enforcement | `GET /api/novels/:id` checks published status but not rights allowlist | OPEN |
| Public chapter rights enforcement | `GET /api/chapters/:id` checks publication status but not rights allowlist | OPEN |
| Single/batch unlock rights enforcement | Both handlers check publication state but do not enforce the rights allowlist | OPEN |
| Public DTO allowlist | Catalog still selects `n.*`; novel detail still selects `*` and spreads the database row | OPEN |
| Synchronous analytics dependency | Novel and chapter detail handlers still write counters synchronously; chapter counter write is not isolated from the read response | OPEN |

### Positive partial changes in PR #120

- Discovery graph query filters to published novels with `rights_status IN ('original','public_domain','licensed','authorized')`.
- Chapter engagement metrics and novel engagement endpoints apply an eligible-rights filter.
- Community rights checks were added to several comment/report/reaction paths.
- Author analytics queries scope to owner-owned novels and eligible rights status.
- Ten-point whole-number rating policy and related migration/tests are present in the PR change set.

These improvements are useful but do not close the core catalog/detail/chapter/unlock P0 gaps. They also do not establish owner-only privilege authority or eliminate public `SELECT *` response exposure.

## 4. Required integration sequence

1. Freeze the exact current main SHA and inspect the two commits missing from PR #118's base.
2. Inspect PR #120's complete 500-commit ancestry and confirm it is an intentional branch lineage.
3. Create a temporary integration branch from current main, not from either stale architecture snapshot.
4. Integrate PR #120's intended change set and run its complete build/regression suite.
5. Reconcile PR #118's six-file delta against that integrated result. Resolve `src/index.js` and runtime schema overlap deliberately.
6. Apply migrations 0001–0018 to a clean isolated SQLite/D1-compatible database with foreign keys enabled.
7. Run PR #118's legacy schema integrity fixture against representative pre-migration community tables.
8. Verify duplicate/orphan report archival preserves evidence, cleanup is retry-safe, and constraints/triggers behave as intended.
9. Compare migration-created schema with runtime bootstrap marker v2, including a fresh database and a legacy upgrade path.
10. Run the full merged regression suite and route-level tests for owner escalation, rights eligibility, public DTO privacy, unlock atomicity and analytics failure isolation.
11. Only after successful staging validation should merge/deployment be considered through the manual owner-approved release process.

## 5. Explicit no-go conditions

- Do not merge PR #118 simply because its branch says `mergeable=true`; its base is behind current main.
- Do not infer PR #120's 500-commit branch ancestry is harmless; inspect and reconcile it.
- Do not treat no-op migrations 0014/0018 as proof that migration 0012 has been applied to any database.
- Do not run D1 migrations on production during integration work.
- Do not deploy either draft PR as a production fix.
- Do not describe the current source as rights-safe, owner-secure or DTO-private; the recheck shows those P0 findings remain open.

## 6. Current decision

**Integration is not yet approved.** The correct next operation is a temporary integration branch based on current main, followed by combined migration and runtime tests. No PR was merged, no production data was touched, and no deployment occurred.