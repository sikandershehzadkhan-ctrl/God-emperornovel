# Imperial Novel: Author Studio and OmniPortal DTO Privacy 01N-28

**Phase:** 01N P0 privacy hardening
**Status:** Implemented and CI-verified on isolated integration branch
**Validated head:** `7e46ebe9007bb816de281907d700e881ef9ac783`
**Production:** Not deployed

## Author Studio AI projects

- Owner-scoped AI project collection now selects explicit project fields and novel title rather than `p.*`.
- AI project detail and mutation ownership lookups select a defined field list; owner_user_id remains internal for authorization.
- The detail response is constructed from an explicit DTO and no longer spreads the database row, preventing internal ownership fields and future schema columns from leaking.
- Existing ownership checks remain in place for project detail, updates and generation operations.

## OmniPortal import history

- User-scoped import-job history now selects explicit job fields and connector display name instead of `j.*`.
- The query remains filtered by the authenticated user's ID.

## Regression and CI

- Extended `scripts/test-public-novel-dto.mjs` with assertions for the AI project collection, detail DTO, internal ownership selector and import-job DTO.
- [Cloudflare Source Validation run 41316659030](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41316659030) passed.
- [Graphify architecture map run 41316659064](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41316659064) passed.

These are source regression and existing local Worker+D1 smoke checks. They do not yet prove two-account runtime isolation or seeded database sentinel-field behavior.

## Remaining work

- Exercise two separate author sessions against local D1 to prove project and import-job isolation.
- Audit chapter draft and author novel edit responses for explicit response DTOs.
- Review administrative report, donation, connector and publishing DTOs, including sensitive rights evidence and payment references.
- Add IDOR/BOLA runtime coverage for every user-owned resource.

## Release disposition

- PR #123 remains draft and unmerged.
- No merge to main, production D1 migration or Worker deployment.