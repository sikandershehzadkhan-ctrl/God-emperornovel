# Client Navigation and API Surface Audit

**Audit date:** 2026-11-19  
**Branch:** `architecture/phase-01-foundation-route-registry`  
**Purpose:** Extend the source-audited route baseline from Worker dispatch into client navigation and a first-pass API method inventory.

## Client navigation findings

Sources inspected:

- `public/app.js`
- `public/app-17.24.0.js`
- `src/index.js`

Verified findings:

- The release bundle `public/app-17.23.0.js` is byte-for-byte identical to `public/app.js`.
- The client bundle contains 168 same-origin `href` occurrences.
- After removing query strings and fragments and normalizing template parameters, those links represent 41 distinct route destinations or intentional route-construction prefixes.
- All 41 destinations resolve to one of the canonical exact page routes or six observed dynamic route families. Legacy fandom shortcuts are server-redirected before page dispatch.
- The client destinations include discovery, catalog, format landing pages, novel detail/chapter routes, reader routes, author studio, account/library/history/following, community, leaderboard, tier list, random discovery, recommendations, voting, requests, OmniPortal, Trend Factory, and legal pages. The route check now consumes `src/route-registry.mjs`, normalizes canonical trailing slashes and tests concrete numeric samples for dynamic routes.

The new `scripts/test-client-navigation-coverage.mjs` check:

1. Requires the versioned client bundle to match `public/app.js`.
2. Extracts same-origin client `href` destinations.
3. Normalizes query strings, fragments, and template parameters.
4. Checks each destination against the Worker’s exact page map or supported dynamic route patterns.
5. Runs as part of the normal `npm run build` gate.

This is a static navigation-link check. It does not certify screen completeness, JavaScript event-driven navigation not expressed as an `href`, route authorization, or live browser behavior.

## First-pass API method surface

A source scan of explicit Worker branches using a literal path and method condition found:

- **92** literal route branch occurrences.
- **74** distinct literal API paths.
- **92** explicit method conditions.
- **1 duplicate path/method declaration:** `POST /api/rating` appears twice, at `src/index.js` lines 476 and 503. The earlier matching branch returns a response, so the later declaration appears unreachable for the same request. This requires a dedicated API-handler review before canonicalization.

Observed helper signals in those branches:

| Source signal | Branches | Meaning |
|---|---:|---|
| `admin(u)` | 24 | Admin helper call observed |
| `author(u)` | 8 | Author helper call observed |
| `need(u)` | 29 | Authenticated-user helper call observed |
| No such helper text in matched branch | 17 | Not a security conclusion; may be public, optional-auth, delegated, or otherwise guarded |

The delegated `POST /api/admin/taxonomy` branch calls `adminTaxonomy(req, env, u)`; helper calls inside that delegated function are outside the simple branch scan. The public taxonomy handler now derives submitter identity from the session rather than client-supplied identity fields.

## Open API contract work

The current source scan remains an inventory, not a canonical API authorization contract. Remaining work:

- Include dynamic path expressions such as parameterized author, publishing, and admin resource routes.
- Record every allowed method and the default behavior for unsupported methods.
- Trace delegated handlers and authorization helpers.
- Verify authentication, role checks, resource ownership, and cross-user isolation from the actual data access predicates.
- Record request validation and response/error shapes.
- Resolve duplicate declarations, beginning with `POST /api/rating`.
- Reconcile API client calls in `public/app.js` against the Worker method inventory.

A helper-name signal is evidence of source structure only. It is not proof that a route is secure or correctly scoped to the current user.


### Known rating integration dependency

The current `main` source snapshot used by this baseline still contains two `POST /api/rating` branches, both validating 1–5. This is recorded as a baseline observation, not a proposal to restore the legacy scale. The separate 1–10 integration is tracked in [PR #318](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/318), which states that it removes the duplicate legacy handler and depends on the reserved schema migration in [PR #195](https://github.com/sikandershehzadkhan-ctrl/God-emperornovel/pull/195). The canonical route registry must be refreshed against the integrated result after that work is resolved; this foundation PR must not create a competing rating migration or handler fix.

## Non-claims

This audit does not certify that every screen is complete, every API is correct, all authorization is secure, the sitemap policy is correct, or the live Worker has deployed these source changes. Reader history writes now verify the exact published novel/chapter pair; new connectors start pending and disabled until explicit evidence-backed authorization. Source-level ownership contracts are build-gated, but two-user D1-backed isolation tests remain open. No production deployment or D1 mutation was performed.
