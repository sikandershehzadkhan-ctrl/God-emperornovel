# Imperial Novel: Account Isolation Policy Regression 01N-31

**Phase:** 01N P0 privacy hardening
**Status:** Implemented and CI-verified on isolated integration branch
**Validated head:** `f2a4294bbd60b778148d8fa9ac4083f76228f935`
**Production:** Not deployed

## Coverage added

- Added `scripts/test-account-isolation-policy.mjs` to the build regression suite.
- Authenticated read routes for OmniPortal import history, reading history, reading positions, personal library, bookmarks, notifications, ticket ledger and private profile are checked for session authentication and SQL scoping to `u.id`.
- Authenticated writes for history, reading positions, library and bookmarks are checked to derive the account ID from the authenticated principal rather than request-body user IDs.
- Author Studio AI project detail, author novel edit and author chapter edit ownership checks are guarded by regression assertions.
- Sensitive `/api/admin/users` account directory is verified as configured-platform-owner-only; this endpoint exposes account email and other sensitive account fields.

## Verification

- [Cloudflare Source Validation run 41318940996](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41318940996) passed.
- [Graphify architecture map run 41318940980](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41318940980) passed.
- Both workflows completed successfully on the exact validated head above.

## Important limitation

This is source-level policy regression coverage. The existing Worker runtime smoke test exercises Wrangler with local D1 for health, catalog, overview, taxonomy rejection and missing-chapter handling, but it does not seed two authenticated users and perform cross-account requests. No claim of demonstrated two-account runtime isolation is made.

## Next required tests

- Seed two users and session tokens in isolated local D1.
- Verify user A cannot read or mutate user B's history, library, bookmarks, reading positions, notifications, ticket ledger or OmniPortal import jobs.
- Verify author A cannot access author B's AI projects, novels or chapters.
- Inspect actual JSON responses for private sentinel fields.
- Verify admin/moderator/owner role boundaries with separate sessions.

## Release disposition

- PR #123 remains draft and unmerged.
- No merge to main, production D1 migration or Worker deployment.