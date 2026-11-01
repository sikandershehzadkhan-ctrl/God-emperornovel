# Imperial Novel: Reader-Facing Rights Gate Expansion 01N-23

**Phase:** 01N isolated P0 implementation
**Status:** Implemented on integration branch; source validation and architecture graph passed
**Validated integration head:** `3eb16ab97b9bff31a3be552bb0669e41c8b0e03b`
**Production:** Not deployed

## 1. Problem confirmed

The initial rights audit had confirmed that the main catalog, novel detail, chapter reader and unlock endpoints applied an eligible-rights allowlist. A follow-up route inspection found additional reader-facing endpoints that only checked `publication_status='published'`. This could expose or permit engagement with a published record whose rights status was pending, rejected, unknown or otherwise ineligible.

## 2. Rights-gate expansion

The integration branch now applies `rights_status IN ('original','public_domain','licensed','authorized')` to:

- Public author discovery, both filtered and unfiltered queries.
- Rating GET and POST target validation.
- Personalized and fallback recommendations.
- Public leaderboard novel and author aggregation.
- Tier-list discovery.
- Random novel discovery.
- Anonymous Made For You feed.
- Follow mutation target validation and followed-novel listing.
- Novel interaction target lookups that use the shared exact novel-id lookup.
- Existing catalog, detail, chapter, unlock, comments and engagement paths remain covered by their route checks.

## 3. Reader discovery data minimization

Recommendation, Made For You and follow-list queries were changed from `n.*` to explicit public novel fields. This avoids passing internal rights evidence, reviewer metadata, ownership data and other internal columns into normal reader-facing JSON payloads.

## 4. Regression coverage

`scripts/test-public-rights-gates.mjs` now checks the allowlist on catalog/detail/chapter/unlock, public author discovery, rating routes, recommendation routes, leaderboard, tier list, random discovery, anonymous feed, follow mutation and followed-novel listing.

`scripts/test-public-novel-dto.mjs` checks the explicit public metadata selection in the catalog/detail and reader discovery response queries.

GitHub Actions source validation passed on the exact recorded integration head:

- [Cloudflare Source Validation run 41313358583](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41313358583)
- [Graphify architecture map run 41313358577](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/actions/runs/41313358577)

These are source/build/regression checks. They are not real Worker HTTP tests against D1, nor a full privacy audit of every API response.

## 5. Known remaining work

- A central reusable server-side content-eligibility policy is still needed; the current route SQL has repeated predicates and therefore requires drift detection.
- Audit every public and authenticated route, including taxonomy submissions, OmniPortal metadata, search, creator dashboards, exports, sitemap, cache keys and all interaction APIs.
- Verify that rights changes, takedowns and legal holds invalidate caches and remove records from every discovery surface.
- Add runtime Worker+D1 tests for pending, rejected, unknown, authorized, licensed, public-domain and original rights states.
- Add response-sentinel tests proving internal rights evidence, reviewer fields and owner identifiers are never serialized to ordinary readers.
- Confirm migration and production database compatibility with backup/restore before any release.

## 6. Release disposition

- Validation PR #123 remains draft.
- No merge to `main`.
- No production D1 migration.
- No Cloudflare deployment.
- No owner identity or production secret configured.