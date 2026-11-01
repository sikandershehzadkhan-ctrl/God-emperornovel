# Imperial Novel: Integration Branch and CI/Test Harness Audit

**Phase:** 01N integration preparation
**Status:** Temporary branch created from current main; read-only workflow and dependency audit
**Inspection date:** 1 November 2026

## 1. Temporary integration branch

- Branch: `integration/phase-01n-pr118-pr120-validation`
- Starting commit: `33881f47c932096d2685bcc0ae777f8df1151a53`
- GitHub branch ref was fetched after creation and its head matched the expected main SHA exactly.
- The branch currently contains no PR integration changes. It is a safe, isolated workspace, not a merged branch.
- Main, the two draft PRs, production Worker and production D1 were not modified.

## 2. Current CI environment findings (PR #120 head)

- `.github/workflows/validate-cloudflare-source.yml` pins Node.js 22 and uses `npm ci` against the committed lockfile.
- The build runs the project's long Node-based regression suite, JavaScript syntax checks, React island build, public-entry/content-format/release-version checks and design-system tests.
- The workflow performs a Wrangler Worker dry-run. It does not deploy.
- The workflow also applies every `migrations/*.sql` file in lexical order to an in-memory Python SQLite database.
- The SQLite step is useful for fresh-database SQL syntax and ordering, but it does not execute the Worker module against a Cloudflare-compatible D1 binding. It does not prove runtime D1 transaction/batch behavior, Worker request routing, Cloudflare-specific semantics or production data compatibility.
- The workflow runs selected Python DB tests and catalog aggregation parity checks, but this is not a full end-to-end Worker + D1 harness.

## 3. Dependency and test-runtime audit

- `package.json` version is `17.23.0`.
- Runtime dependencies are `react` and `react-dom` at `19.3.1`.
- The only declared development dependency is `esbuild` at `0.28.2`.
- The inspected lockfile is npm lockfile version 3.
- No Vitest, `@cloudflare/vitest-pool-workers`, Miniflare, `workerd` or SQLite driver is declared in the inspected package manifest.
- Exact compatible versions and setup must be verified before adding dependencies. No package or lockfile was changed in this audit.

## 4. Existing validation coverage and gaps

| Area | Existing CI evidence | Remaining gap |
|---|---|---|
| Node/browser syntax and app build | Present | Does not exercise Worker route behavior |
| Fresh SQL migration chain | Python SQLite executes sorted migration files | Does not test migration against representative live legacy schemas |
| Worker bundle | Wrangler dry-run | Not a runtime request test |
| Password hashing | Node regression test | No full session/authorization route execution |
| Payment/unlock atomicity | Several Node/Python tests and source checks | Must run against actual D1-compatible SQL engine and Worker handler |
| Owner authority | Static invariant exists for first-admin bootstrap | Does not close the generic admin role-grant route identified in P0 audit |
| Public rights policy | Some source checks and targeted query tests | Main catalog/detail/chapter/unlock routes still need rights enforcement tests |
| Public DTO privacy | No complete sentinel-based route test identified | Must prove internal fields never escape public responses |
| Analytics isolation | Some analytics and source checks | Need injected DB/event pipeline failure tests proving reads still work |

## 5. Recommended test harness

1. Verify current Cloudflare Workers Vitest pool documentation and compatible package versions against Node 22 and the repository's current Wrangler version.
2. Add an isolated Worker test environment with a D1-compatible SQLite database and apply migrations before each relevant suite.
3. Import the actual Worker default export and exercise its `fetch` handler with real `Request` objects and bound test environment, rather than only testing extracted helper functions.
4. Seed isolated accounts and records for owner, admin, author, reader, anonymous and banned identities.
5. Add regression suites for owner-only privilege grants, rights eligibility across every public content route, public DTO sentinel leakage, object ownership, cache isolation, ticket unlock atomicity and analytics failure isolation.
6. Keep Python fresh-SQL migration validation as a separate useful gate; do not mistake it for the Worker runtime suite.
7. Run the complete combined suite on the temporary integration branch after PR #118 and PR #120 are reconciled.

## 6. Release safety observations

- The production deploy workflow is manual (`workflow_dispatch`) and requires the explicit `confirm_production_deploy` input to be `true`.
- It uses Node.js 22, performs build and fresh SQLite migration validation, checks Cloudflare credentials, reads the live schema marker and performs a Wrangler dry-run before the production migration/deploy steps.
- The separate production schema preflight workflow is explicitly read-only and inventories live schema through SELECT/PRAGMA commands.
- These workflow controls are valuable safeguards, but they do not replace reviewing the actual migration sequence and testing a representative legacy database.
- No production workflow was run as part of this audit.

## 7. Next gate

Before adding PR source changes to the temporary branch, inspect PR #120's full commit ancestry and exact intended diff, then reconcile PR #118's older base. After that, integrate one change set at a time and run the combined fresh/legacy migration checks. No merge to main or production release is authorized by this document.