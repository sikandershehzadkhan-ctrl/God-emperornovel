# Imperial Novel: P0 Authorization, Rights and Public-DTO Regression Test Specification

**Phase:** 01N security implementation preparation
**Status:** Test design only; no application source changed and no tests executed
**Source snapshot:** `src/index.js` blob `13874ee0fde4e31e04a652c5169776c3b6f95c38`

## 1. Purpose

This specification turns the source findings into executable acceptance criteria. It deliberately precedes implementation so each correction can be demonstrated by a failing-before/passing-after test. Tests must execute the real Worker API handler against an isolated D1-compatible database, not rely only on source-string matching.

## 2. P0-A: sole-owner authority and role elevation

### Observed source behavior

`getUser` resolves the signed-in user and role. `admin(u)` accepts any account with `role='admin'`. `PATCH /api/admin/users/:id` is guarded by this generic helper and accepts `user`, `author`, `moderator` or `admin`. It only prevents the caller from removing their own admin role. It does not prevent one generic administrator from promoting another account to admin.

### Target authorization model

- A distinct owner principal is established by a protected server-side identity/claim, not by trusting a user-editable role field.
- Generic admin and delegated roles cannot create, promote, demote, or replace the owner.
- Only the owner can grant a narrowly scoped delegated permission, and only through step-up authenticated, CSRF-protected, audited action.
- Delegated identities cannot grant permissions, change owner identity, access secrets or perform owner-only financial/security actions.
- No default or seed account is silently designated as owner.

### Required tests

| Test | Identity | Attempt | Expected |
|---|---|---|---|
| A01 | Anonymous | PATCH user role to admin | 401 |
| A02 | Reader | PATCH user role to admin | 403 |
| A03 | Author | PATCH user role to admin | 403 |
| A04 | Moderator | PATCH user role to admin | 403 |
| A05 | Generic admin | Promote another user to admin | 403 |
| A06 | Generic admin | Demote another admin | 403 unless explicitly delegated by policy |
| A07 | Generic admin | Change own role | 403 |
| A08 | Owner | Promote reader to admin with valid step-up and audit | Allowed only through explicit owner workflow |
| A09 | Owner | Grant limited moderator scope | Allowed; persisted scope is exact |
| A10 | Moderator | Attempt to grant admin or another scope | 403 |
| A11 | Any non-owner | Change owner identity/claim | 403; owner record unchanged |
| A12 | Owner action | Missing/invalid step-up or CSRF token | 401/403; no mutation |
| A13 | Concurrent requests | Two conflicting role updates | One deterministic policy outcome; no partial privilege state |
| A14 | Audit | Successful and denied privileged attempts | Audit event with actor, target, action, outcome; no secrets |

### Migration and recovery conditions

- Existing admin accounts must be enumerated and reviewed before enabling owner authority.
- Owner bootstrap must be explicit, one-time, recoverable and protected against replay.
- No migration may infer owner from lowest user ID, email text or existing admin role.
- Emergency recovery must not create a hidden universal backdoor.

## 3. P0-B: central content-rights eligibility

### Target predicate

Public content eligibility must be evaluated server-side and fail closed. At minimum it must require a published novel, an allowed rights status (`original`, `public_domain`, `licensed`, `authorized`), no takedown/suspension/legal hold, a published chapter where applicable, valid parent relationship and any applicable territory/age/locale constraints.

One shared policy must be applied to catalog, novel detail, chapter content, single and batch unlock, reactions, ratings, comments, engagement, discovery, search, recommendations, sitemap and cache population.

### Required tests

| Test | Fixture | Expected |
|---|---|---|
| B01 | Published + original | Public listing/detail permitted |
| B02 | Published + public_domain | Permitted only with verified public-domain state |
| B03 | Published + licensed | Permitted within license scope |
| B04 | Published + authorized | Permitted within authorization scope |
| B05 | Published + pending rights | Excluded from all public endpoints |
| B06 | Published + rejected/unknown rights | Excluded; fail closed |
| B07 | Unpublished + allowed rights | Excluded |
| B08 | Published novel + unpublished chapter | Chapter content unavailable |
| B09 | Rights revoked after cache fill | Subsequent request cannot serve stale restricted content |
| B10 | Legal hold/takedown | All applicable content endpoints deny or suppress content |
| B11 | Batch unlock includes ineligible chapter | No charge, no unlock, no partial ledger mutation |
| B12 | Comment/reaction/rating on ineligible novel | Rejected consistently |
| B13 | Search/recommendation includes ineligible novel | Ineligible result absent |
| B14 | Sitemap generated after rights revoked | Restricted URL omitted |
| B15 | Locale/territory restriction | Only permitted audience receives content |

## 4. P0-C: public response DTO allowlists

### Observed source behavior

`GET /api/novels` selects `n.*`; `GET /api/novels/:id` selects `*` and spreads the database row into the public response. Database columns include internal ownership and rights/review governance information. This makes response exposure depend on schema evolution.

### Target behavior

- Public novel DTO is an explicit allowlist of display-safe fields.
- Internal owner IDs, rights evidence, rights notes, reviewer identities, moderation state, internal audit data, payment references and private metadata are never serialized publicly.
- Authenticated personalization is composed separately and is never put into shared-cacheable public DTOs.
- Author and owner DTOs are distinct and permission-scoped.

### Required tests

1. Seed sentinel values in every internal/private column; request public catalog and detail; assert no sentinel or private key appears anywhere in JSON.
2. Add a new private schema column in a test fixture; assert it does not automatically appear in public JSON.
3. Verify public DTO contains required fields and stable types.
4. Verify user-specific fields (`bookmark`, `in_library`, `following`, `user_rating`) are separated from cacheable public metadata.
5. Verify public responses have explicit cache policy; personalized/private responses use `private, no-store`.
6. Verify errors and logs do not reveal SQL, tokens, email, rights evidence or stack traces.

## 5. P0-D: analytics must not block reading

### Observed source behavior

Novel detail increments the novel view counter synchronously and attempts a daily aggregate. Chapter detail synchronously upserts `chapter_views`; this primary write is not caught. A D1 write failure can therefore fail a chapter read even when chapter content is available.

### Target behavior

- Reading content does not synchronously depend on analytics aggregation.
- View events are deduplicated according to documented semantics and delivered asynchronously with idempotency keys.
- Queue failure is observable and recoverable; it must not silently fabricate success or block the reader.
- Counter labels distinguish requests, unique readers and active readers.

### Required tests

1. Simulate analytics write/queue failure; published eligible chapter remains readable.
2. Replay the same event; aggregate increments once according to idempotency key.
3. Simulate queue retry and duplicate delivery; no double count.
4. Hot chapter concurrency test measures read latency and write amplification.
5. Verify event payload contains no unnecessary personal data.

## 6. Harness architecture

- Import the Worker module in a Node test process and invoke `fetch` with controlled Request objects.
- Use an isolated SQLite/D1-compatible binding with production-compatible SQL behavior where feasible.
- Build fixtures for anonymous, reader, author, moderator, generic admin, owner, and two unrelated user accounts.
- Create novels for every rights/publication combination and chapters with locked/unlocked states.
- Capture status, headers, JSON body, SQL mutation counts and audit events.
- Provide deterministic clock, session token and queue mocks.
- Keep test fixtures synthetic; never copy production personal data.

## 7. Test execution order and release gates

1. Build route-level test harness and prove it can execute current handlers.
2. Add tests A01–A14, B01–B15 and DTO sentinel tests; confirm expected failures against current behavior.
3. Implement one P0 correction at a time on an isolated feature branch.
4. Re-run all new tests plus existing regression suite after each correction.
5. Run schema migration tests and restore rehearsal before any production data migration.
6. Require manual owner review of privilege changes, rights policy and public DTO field contract.
7. Deploy to staging only after combined PR migration integration and full CI pass.
8. Verify live staging routes, authorization, content rights, cache headers and rollback.

## 8. Current disposition

**Specification complete.** This is not an implementation or test pass. The four P0 areas remain open until the executable harness demonstrates the required outcomes.

**No application source changed. No tests executed. No migration run. No deployment performed.**