# Imperial Novel: Taxonomy and Notification DTO Minimization 01N-26

**Phase:** 01N P0 privacy hardening
**Status:** Implemented and CI-verified on integration branch
**Validated head:** `175e858cd7335580ffc450875be80abfedcf962f`
**Production:** Not deployed

## Changes

- Public `/api/genres` now returns only `id`, `name` and `slug`.
- Public `/api/tags` now returns only `id`, `name` and `slug`.
- Authenticated `/api/notifications` now returns only `id`, `title`, `body`, `read_at` and `created_at`; it does not serialize the internal `user_id` column or any future columns added to the table.
- Existing explicit public novel and reader-discovery DTOs remain in place.

## Regression coverage

`scripts/test-public-novel-dto.mjs` now asserts the exact genre, tag and notification field allowlists in addition to the existing novel and taxonomy response checks.

CI passed on the exact validated head:
- [Cloudflare Source Validation run 41315883565](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41315883565), including the isolated local Worker+D1 HTTP smoke test.
- [Graphify architecture map run 41315883566](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41315883566).

## Remaining privacy work

- Complete response-by-response audit for every public and authenticated API route, including exports, admin views, connector responses, author projects and reports.
- Add runtime sentinel-field tests against a seeded D1 fixture.
- Confirm frontend compatibility with these narrower DTOs across all routes.
- Add authorization/IDOR tests for every user-scoped resource.

## Release disposition

- PR #123 remains draft and unmerged.
- No main-branch merge, production migration or Cloudflare deployment.