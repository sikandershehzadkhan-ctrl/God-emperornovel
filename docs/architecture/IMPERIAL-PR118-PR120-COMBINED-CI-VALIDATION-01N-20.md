# Imperial Novel: PR #118 + PR #120 Integration Validation Results

**Phase:** 01N controlled integration
**Status:** Combined draft PR CI passed; no merge or production deployment
**Inspection date:** 1 November 2026

## 1. Integration artifact

- Temporary branch: `integration/phase-01n-pr118-pr120-validation`
- Draft validation PR: [#123](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/123)
- Current integration head at validation: `cfe55f80513954f3cfd51d18ba13c65fcf8838ff`
- Base: current `main` snapshot `33881f47c932096d2685bcc0ae777f8df1151a53`
- PR #123 remains draft and must not be merged automatically.

## 2. Reconciled changes

- Carried PR #120's current 50-file change set into the isolated integration branch.
- Added PR #118's declarative migration `0012_runtime_feature_schema.sql`.
- Added the legacy community schema integrity fixture.
- Updated `src/runtime-feature-schema.mjs` to schema marker version 2, including legacy cleanup/archive, uniqueness and referential-integrity triggers.
- Added the legacy community schema test to the Cloudflare source validation workflow.
- Updated `scripts/test-runtime-feature-schema.mjs` to assert marker v2 and the current migration/runtime parity.
- Adapted the duplicate-report assertion to PR #120's newer atomic `INSERT OR IGNORE` plus explicit HTTP 409 behavior.
- Adapted comment likes to `INSERT OR IGNORE` so concurrent duplicate like attempts do not surface as database errors.
- Deliberately did not apply PR #118's older `src/index.js` patch wholesale: PR #120 already contains newer route logic and the old patch would have regressed it.

## 3. CI results

| Check | Run | Result |
|---|---|---|
| Imperial Novel Cloudflare Source Validation | [Run 1135](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41308582779) | PASS |
| Official Graphify architecture map | [Run 738](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41308582758) | PASS |

Cloudflare source validation completed successfully, including:

- `npm ci` on Node.js 22
- Full project build/regression script
- Worker and browser JavaScript syntax checks
- Wrangler Worker bundle dry-run (no deploy)
- Production safety invariant checks
- All migrations in lexical order against a fresh in-memory SQLite database
- Legacy community schema integrity fixture, including archive-before-deduplication, idempotency, orphan cleanup, validation triggers and cascade behavior
- Catalog aggregation parity
- Author application database constraints
- Donation reference uniqueness
- Atomic novel-request charging

## 4. Test failures found and corrected

Two outdated or missing concurrency assertions were exposed by the combined CI run:

1. The PR #120 runtime schema test expected marker version 1 and did not match the version-2 migration. The test was updated to verify the v2 fast path and legacy schema parity.
2. The test expected the literal `UNIQUE constraint failed` handler from PR #118's older report route. PR #120 already uses atomic `INSERT OR IGNORE` and returns 409 when the prior report exists. The test was updated to assert the actual atomic behavior, and the comment-like insert was made conflict-safe.

Both issues were corrected on the temporary branch, and the subsequent full validation passed.

## 5. What this proves, and what it does not

**Proven for this tested commit:** the repository build and configured CI regression suite pass; the fresh migration sequence executes in SQLite; the legacy community migration fixture passes; the Worker bundle passes Wrangler dry-run; Graphify completes.

**Not proven:** actual Cloudflare Worker requests against a live D1 instance; compatibility with the current production D1 data; live migration execution; backup/restore; production runtime behavior; resolution of owner-authority, core content-rights, public DTO privacy or synchronous analytics P0 findings; capacity or load-test results.

## 6. Release disposition

- PR #123 remains draft.
- PR #118 and PR #120 remain separate drafts unless independently updated by their owner.
- No merge to `main` occurred.
- No production D1 command or migration was executed.
- No Worker deployment occurred.
- The combined result is a successful CI validation candidate, not a production release approval.

## 7. Next work

1. Add true Worker request tests using an isolated D1-compatible runtime; existing CI still does not execute the actual Worker handler against D1.
2. Test representative legacy database snapshots and runtime-bootstrap/migration parity beyond the focused community fixture.
3. Begin the P0 security implementation in a separately reviewable sequence: owner-only privilege elevation, centralized rights eligibility, explicit public DTO allowlists, then analytics failure isolation.
4. Keep the release blocked until those P0 controls have executable route tests and production schema/backup preflight is reviewed.