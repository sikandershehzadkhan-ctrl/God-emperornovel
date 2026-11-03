# Phase 01N.14 — Generic Report API Hardening

Status: source change and regression-policy check committed to the architecture branch. The test was added to the build chain but has not been executed in this environment. No live Worker or D1 request was made.

## Change made

Hardened `POST /api/report` in `src/index.js`:

- Requires an authenticated session.
- Requires at least one target: novel or chapter.
- Validates supplied target IDs as positive safe integers.
- Requires supplied novel targets to exist and be published.
- Requires supplied chapter targets to exist, be published, and belong to a published parent novel.
- When both IDs are supplied, verifies the chapter belongs to the supplied novel.
- Caps reason at 300 characters and details at 2,000 characters.
- Enforces a per-user limit of 10 generic reports per rolling hour in the INSERT predicate.
- Checks the INSERT result and returns HTTP 429 when the limit is reached.

## Regression protection

Added `scripts/test-generic-report-policy.mjs` with source-policy assertions for authentication, target requirements, numeric validation, published-state checks, parent relationship, field limits and hourly rate limiting.

Added the test to the existing `npm run build` test chain.

**Important:** this is a static source-policy regression test. It does not replace route integration tests, D1 concurrency tests, or two-account adversarial tests. It has not yet been run.

## Files changed

- `src/index.js`
- `scripts/test-generic-report-policy.mjs`
- `package.json`

## Follow-up

1. Run `node scripts/test-generic-report-policy.mjs` in CI.
2. Run the full existing build/test chain and resolve any failures.
3. Add integration tests for missing targets, invalid IDs, unpublished novel/chapter, mismatched novel/chapter pair, oversized details and hourly limit.
4. Add two-account tests and concurrent report submissions.
5. Inspect report moderation queue behavior and confirm all report target types used by the UI are supported.

No D1 schema or migration changed. No secrets or Worker configuration changed. No production deployment occurred.
