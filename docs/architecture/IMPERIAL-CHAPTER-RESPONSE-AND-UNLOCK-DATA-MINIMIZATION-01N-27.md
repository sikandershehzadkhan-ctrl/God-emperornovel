# Imperial Novel: Chapter Response and Unlock Query Minimization 01N-27

**Phase:** 01N P0 privacy hardening
**Status:** Implemented and CI-verified on isolated integration branch
**Validated head:** `5d1711660d4b7919933f7a13d3fcd1190629fc70`
**Production:** Not deployed

## Changes

- Public `GET /api/chapters/:id` now selects only chapter ID, novel ID, chapter number, title, content, lock state, ticket cost and publication status, plus the minimum parent-novel eligibility fields.
- Single-chapter unlock selects only the chapter fields needed to authorize and price the transaction.
- Batch unlock selects only chapter ID, chapter number and ticket cost.
- Removed `SELECT c.*` from these reader-facing and transactional chapter paths.

## Verification

- Added regression assertions to `scripts/test-public-novel-dto.mjs` for all three query allowlists and absence of chapter row wildcards.
- [Cloudflare Source Validation run 41316241020](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41316241020) passed.
- [Graphify architecture map run 41316241040](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41316241040) passed.

These checks verify source-level field allowlists and the existing local Worker+D1 smoke test. They do not yet prove the full chapter unlock transaction under concurrent requests or verify all response payloads against seeded private sentinel values.

## Remaining audit scope

- Author Studio and admin-only queries need response-level DTO review, not just SQL minimization.
- Audit import-job and AI-project responses for owner-only field exposure.
- Add seeded D1 runtime tests for chapter content, locked/unlocked access, rights states, and user ownership boundaries.
- Continue reviewing admin/report/payment payloads and user-scoped IDOR boundaries.

## Release disposition

- PR #123 remains draft and unmerged.
- No merge to main, production migration or Worker deployment.