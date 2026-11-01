# Imperial Novel: Public Content Rights Gate Implementation Record

**Phase:** 01N P0 security implementation
**Status:** Initial public-reader route guards implemented and CI passed
**Production status:** Not deployed

## Scope implemented

The shared public content eligibility allowlist is applied directly in the SQL predicates for these five critical paths:

1. Public novel catalog: `/api/novels`
2. Public novel detail: `/api/novels/:id`
3. Public chapter reader: `/api/chapters/:id`
4. Single chapter unlock: `/api/chapters/:id/unlock`
5. Batch chapter unlock: `/api/novels/:id/batch-unlock`

Allowed rights states are exactly `original`, `public_domain`, `licensed`, and `authorized`. Pending, rejected, unknown, missing and any other values do not pass these route predicates.

## Regression coverage

`scripts/test-public-rights-gates.mjs` is part of the normal build regression chain and checks that all five route handlers include the complete eligible rights allowlist.

Latest combined integration validation: [Cloudflare Source Validation run 41309576761](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41309576761) passed, including the application build, Wrangler dry-run, safety checks, full fresh SQLite migration sequence and the new owner-authority and public-rights source regression checks.

## Important limits

- This is a first P0 slice, not yet one centralized reusable rights-policy function.
- Other public surfaces still require a route-by-route audit: discovery graph, public author listings, rankings, recommendations, search, comments, reactions, ratings, follows, bookmarks, reading history, sitemap and cache behavior.
- The catalog and detail routes still contain broad `n.*` / `SELECT *` projections. The separate public DTO privacy issue remains open.
- Existing chapter view writes remain synchronous. Analytics failure isolation remains open.
- Source-level checks do not replace request-level Worker+D1 tests.
- No production D1 data was inspected or changed, and no Worker was deployed.