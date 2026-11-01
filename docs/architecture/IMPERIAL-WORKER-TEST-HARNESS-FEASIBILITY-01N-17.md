# Imperial Novel: Worker-Level Test Harness Feasibility Decision

**Phase:** 01N integration and verification architecture
**Status:** Repository inspection and test strategy decision; no dependency or application source changes
**Inspected source:** `package.json`, `src/index.js`, existing Node regression scripts, `wrangler.toml` on `architecture/phase-01n-master-route-registry`

## 1. Verified repository facts

- The application is a Cloudflare Module Worker with default export `{ fetch, scheduled }` in `src/index.js`.
- D1 is bound as `DB`; static assets are bound as `ASSETS`.
- Existing regression scripts use Node's built-in `assert` and direct source/module checks.
- `package.json` has React and esbuild dependencies, but no Vitest, Miniflare, `workerd`, SQLite driver or Worker test pool dependency.
- The current build runs many regression scripts and syntax checks, but no test invokes the complete Worker `fetch` handler against a realistic isolated D1 database.
- The production workflow has explicit manual confirmation and dry-run gates. This inspection does not execute that workflow.

## 2. Why a hand-written fake D1 is not sufficient

A fake that returns canned results for `prepare().first()`, `.all()`, `.run()` and `.batch()` can test selected branches, but it does not validate SQL semantics, transaction behavior, constraints, triggers, D1 metadata or migration compatibility. It can create false confidence, especially for role changes, ticket ledgers, content-rights filtering and concurrent unlocks.

Therefore a fake-D1-only harness is rejected as the primary P0 release gate. Lightweight mocks may still be used for isolated external services and queue failure injection.

## 3. Recommended test architecture

Use a Cloudflare-compatible Worker test runtime with an isolated D1 database and real SQLite-backed query execution. The preferred direction is Vitest with Cloudflare's Workers test pool / Miniflare-compatible D1 binding, pinned to versions compatible with the repository's Node 22 CI environment.

Required properties:

1. Import and execute the actual Worker module entry point.
2. Bind a fresh isolated D1 database for each test suite or fixture group.
3. Apply the same ordered migration chain used by the application.
4. Invoke `fetch` with real Request objects, session cookies and headers.
5. Exercise real prepared SQL, constraints, batch transactions and D1 result metadata.
6. Provide controlled clock, queue, fetch and secret bindings.
7. Run in GitHub Actions without requiring the owner's phone or a paid service.
8. Keep production D1 and production secrets entirely inaccessible to tests.

## 4. Integration steps before adding dependencies

1. Confirm the repository's CI Node version and lockfile/package-manager conventions.
2. Reconcile PR #118 and PR #120 against current main before using their migration chain.
3. Build a clean test database from migrations 0001 through the integrated head.
4. Confirm runtime schema bootstrap does not create a conflicting or divergent schema.
5. Add the Worker test runtime and lock exact compatible versions.
6. Prove one anonymous health request, one authenticated `/api/me` request and one real SQL-backed catalog request.
7. Prove test isolation by running the suite twice and in parallel without state leakage.
8. Only then implement the P0 route tests specified in `IMPERIAL-P0-REGRESSION-TEST-SPEC-01N-16.md`.

## 5. Test suites and ownership boundaries

| Suite | What it proves |
|---|---|
| Worker smoke | Actual module handler, bindings, request/response behavior |
| Identity and owner authority | Session resolution, role boundaries, owner-only operations |
| Content rights | Rights/publication eligibility across all content surfaces |
| Public DTO privacy | Explicit field allowlists and absence of private sentinels |
| D1 migrations | Clean install, upgrade, constraints, triggers and legacy fixtures |
| Transactions | Unlock, ticket ledger, payment and concurrent mutation invariants |
| Cache isolation | Public cacheable versus private/personalized response behavior |
| Failure injection | Analytics, queues, provider and optional service outages |
| Load and soak | Measured latency, errors, DB pressure and hot-content behavior |

## 6. Safety boundaries

- Never point tests at production D1.
- Never copy production user records into test fixtures.
- Never put production secrets in test workflows.
- No schema migration is applied to a live database during harness development.
- No merge or production deployment is authorized by this document.
- A passing local test suite is not a production security certification.

## 7. Decision

**Adopt a real Worker runtime plus isolated D1 for route-level release tests. Do not accept static source assertions or canned fake-D1 responses as proof of P0 security.**

Dependency selection and CI wiring remain pending verification of the current main branch, migration integration and Node version. No package file was changed in this phase.