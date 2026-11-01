# Imperial Novel: Local Worker and D1 Runtime Smoke Test 01N-24

**Phase:** 01N integration validation
**Status:** First real local Worker+D1 HTTP smoke test added and passed
**Validated integration head:** `c12f5b71518aeff07fafca1bc711e2e56c216b05`
**Production:** Not deployed

## 1. What changed

- Added `scripts/test-worker-local-runtime.mjs`.
- Added the `npm run test:worker-runtime` command.
- Added a CI step named `Exercise Worker against isolated local D1`.
- The script starts Wrangler v4 in explicit `--local` mode with a dedicated `.wrangler/test-runtime` persistence directory and a loopback-only listener.
- The script terminates the Wrangler process group after the test so no local Worker process remains running in CI.

## 2. HTTP checks performed against the running Worker

1. `GET /api/health`: requires a successful D1 query and a healthy response.
2. `GET /api/novels`: requires a successful JSON catalog response with a results array.
3. `GET /api/platform/overview`: requires a successful D1-backed overview and numeric live metrics.
4. `GET /api/chapters/2147483000`: requires a structured 404 for a nonexistent chapter.
5. `GET /`: requires the Worker to serve the Imperial Novel homepage.

## 3. CI result

- [Cloudflare Source Validation run 41314646764](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41314646764) passed.
- The job's `Exercise Worker against isolated local D1` step passed.
- [Graphify architecture map run 41314646776](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41314646776) passed.

This is a genuine local Worker HTTP test using Wrangler's local D1 emulation, not merely a source regex or Wrangler deployment dry-run. It is still a smoke test, not a complete authorization, privacy, payment, rights or concurrency test suite.

## 4. What remains

- Seed isolated D1 fixtures with multiple rights states and prove that every public route rejects pending, rejected, unknown and otherwise ineligible works.
- Exercise owner/admin authorization and IDOR/BOLA cases through actual HTTP requests.
- Test public DTO privacy using sentinel values inserted into internal columns.
- Test chapter unlock transaction atomicity, concurrent duplicate requests and no double charging.
- Test analytics failure isolation and queue semantics under a controlled D1 failure.
- Add backup/restore and production migration compatibility checks; never point this smoke test at production.

## 5. Release disposition

- PR #123 remains draft.
- No merge to `main`.
- No production D1 migration.
- No Cloudflare Worker deployment.
- The test uses isolated local D1 only.