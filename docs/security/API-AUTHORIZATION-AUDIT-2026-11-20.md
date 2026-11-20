# API authorization and ownership audit

**Audit date:** 2026-11-20  
**Reviewed ref:** `main` at `25aa2667a6a714a72578a35baac2a113f256f738`  
**Reviewed source:** `src/index.js` (Git blob `237f4461135eb77258b7184e361ce9dfd9a140e9`)  
**Audit type:** static source review; no production requests, database writes, browser session, or two-account runtime tests were performed.

## Executive result

The Worker routes API requests through one large dispatcher in `src/index.js`. Authentication helpers are present:

- `need(u)` rejects unauthenticated callers.
- `admin(u)` requires role `admin`.
- `author(u)` allows `author` and `admin`.

A number of private routes visibly use these gates, and author resource handlers inspected in this pass also compare the resource owner ID with the authenticated user's ID. This is useful evidence, but helper presence is not a complete authorization proof.

**One confirmed attribution defect** was found in taxonomy submission. Several read-style routes also do not constrain the HTTP method at the dispatcher level. These findings should be addressed before the API layer is certified.

## Findings

### API-001: Taxonomy submissions trust caller-supplied creator identity

- **Severity:** Medium
- **Confidence:** Confirmed from source
- **Location:** `src/index.js`, `communityTaxonomy(req, env)`, called by `/api/taxonomy` at the API dispatcher.
- **Affected operation:** `POST /api/taxonomy`

The POST handler reads `creator_id` and `creator_name` from the untrusted JSON body and writes them into `taxonomy_submissions`. It does not call `need(u)`, and the dispatcher does not pass the authenticated principal into the helper.

A caller can therefore create a pending proposal attributed to another account. The proposal still requires admin review, so this finding does **not** establish an admin-approval bypass. It does invalidate submitter attribution and auditability.

**Required remediation**
1. Pass the authenticated principal to `communityTaxonomy`.
2. Require authentication for POST while keeping approved taxonomy GET public.
3. Derive creator ID and display name from the authenticated database user, never from request fields.
4. Add a rate limit and tests proving anonymous rejection and identity spoofing resistance.

### API-002: Several read-style routes are method-agnostic

- **Severity:** Low (hardening; reassess after client compatibility review)
- **Confidence:** Confirmed from source
- **Examples:** `/api/me`, `/api/config`, `/api/genres`, `/api/tags`, `/api/public-authors`, `/api/sources`, `/api/omni/status`, `/api/omni/search`, `/api/omni/resolve`, `/api/novels`, `/api/novels/:id`, `/api/chapters/:id`

These dispatcher branches do not consistently require `m === 'GET'`. Requests using other HTTP methods can enter read-style handlers instead of receiving 405. Most do not expose a write operation, but `/api/omni/status` calls `seedOmni(env)`, which ensures tables and seeds connector registry rows. That makes a nominally public status read perform database setup work.

**Required remediation**
1. Declare allowed methods for every API route.
2. Return 405 for unsupported methods, with an `Allow` header where practical.
3. Make public status reads side-effect free; move seeding/schema setup to controlled bootstrap/migration paths.
4. Add method-matrix regression tests for every route.

### API-003: Duplicate rating write handler

- **Severity:** Low (maintainability and route-order ambiguity)
- **Confidence:** Confirmed from source
- **Location:** `src/index.js`, `POST /api/rating` appears twice (around lines 476 and 503 in the reviewed source).

The first handler validates that the novel is published and rights-eligible, then writes the rating and aggregate. A later duplicate handler writes a rating without repeating that eligibility check. The earlier matching branch returns first, so the later branch appears unreachable in the current ordering. Keeping a second weaker implementation creates a future regression hazard if routes are reordered.

**Required remediation**
1. Remove the duplicate branch after confirming no distinct intended behavior.
2. Keep one authoritative handler and a regression test for publication/rights eligibility.

## Positive source evidence observed

- Admin taxonomy POST delegates to `adminTaxonomy`, which calls `admin(u)`.
- Admin author-application listing and decisions call `admin(u)`.
- Admin publishing, donation, report, ticket, connector, and request-management handlers inspected in this pass visibly call `admin(u)`.
- Author Studio and AI project routes inspected call `author(u)`; project, novel, and chapter ID handlers also compare owner IDs for non-admin users.
- User history, library, bookmarks, follows, profile, notifications, ledger, requests, and import-job routes inspected bind reads/writes to the authenticated user ID.
- Public novel/chapter reads filter to published content and eligible rights statuses in the inspected handlers.

These observations are source-level only. They do not replace adversarial tests.

## Certification gaps

The following remain **not certified**:

1. Two-user cross-account read/write tests for every user-owned resource family.
2. Admin/non-admin/author/reader/anonymous role matrix across all route-method pairs.
3. Dynamic route IDOR tests, including AI project, novel, chapter, application, donation, report, request, and connector-authorization IDs.
4. CSRF review for cookie-authenticated state-changing requests and origin validation.
5. Rate-limit coverage for all abuse-sensitive public and authenticated mutations.
6. Error-path, race-condition, and concurrent state-transition tests.
7. Runtime Cloudflare Worker + D1 tests against an isolated test database.

## Recommended implementation order

1. Fix API-001 first because it is a confirmed identity-integrity defect.
2. Add explicit method contracts and make public status reads side-effect free (API-002).
3. Remove the duplicate rating handler (API-003).
4. Build a route-method-role-resource matrix and executable two-account authorization tests.
5. Only then mark API authorization and resource ownership as certified.

## Evidence boundary

This document records findings from the reviewed `main` source snapshot. It does not claim the findings are deployed, fixed, or exercised against production. No production deployment or D1 mutation was performed.
