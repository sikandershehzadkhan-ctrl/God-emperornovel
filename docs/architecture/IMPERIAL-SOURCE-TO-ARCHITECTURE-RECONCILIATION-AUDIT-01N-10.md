# Imperial Novel: Source-to-Architecture Reconciliation Audit

**Programme:** Phase 01N source reconciliation
**Status:** Static source and migration inspection; no runtime penetration test or production verification
**Branch inspected:** `architecture/phase-01n-master-route-registry`
**Repository:** `sikandershehzadkhan-ctrl/God-emperornovel`
**Inspected release metadata:** `package.json` and `wrangler.toml` both declare `17.23.0`

## 1. Scope and evidence

Inspected the branch tree, `src/index.js`, `src/runtime-feature-schema.mjs`, `src/rating-policy.mjs`, `src/author-application-policy.mjs`, `public/app.js`, `public/admin.html`, `wrangler.toml`, `package.json`, and all migration files present from `0001` through `0018`.

This is static inspection of the repository snapshot. It does not prove the same code is deployed to the live Worker, does not query the live D1 database, and does not establish exploitability by executing attacks. Findings below describe code paths that require correction or verification.

## 2. Release and schema inventory

- `package.json` version: `17.23.0`.
- `wrangler.toml` `APP_VERSION`: `17.23.0`.
- Worker entry point: `src/index.js`.
- Static asset directory: `./public`.
- D1 binding: `DB`, database name `god-emperornovel-db`, migrations directory `migrations`.
- Migration files present: `0001` through `0011`, then `0013` through `0018`.
- `migrations/0012_runtime_feature_schema.sql` is absent from the inspected branch tree.
- `0014_reader_engagement_metrics.sql` and `0018_comment_reports.sql` are intentionally no-op placeholders that state their DDL is owned by the missing `0012` migration from PR #118.
- `src/runtime-feature-schema.mjs` creates `auth_rate_limits`, `comment_likes`, `comment_reports`, `novel_reactions`, and `request_votes` at runtime, and adds `comments.parent_id` and `comments.edited_at`.
- `ensureCoreSchema` also creates a substantial baseline schema at runtime, while D1 migration files define overlapping structures. This dual schema ownership requires a single documented migration/bootstrap contract.

### Schema reconciliation risks

1. The missing `0012` file means the migration history and the comments in `0014`/`0018` do not describe a self-contained, reproducible migration directory.
2. Some structures are created by runtime bootstrap rather than numbered migrations. A new database, an existing database, and a database initialized from migrations can therefore reach schema state through different paths unless parity is tested.
3. `novels.owner_user_id` is added as a nullable integer in migration `0004`, without a declared foreign key in that migration. Existing rows may have no provable owner.
4. Several ownership-sensitive tables in the initial migrations do not declare foreign keys (including `ticket_ledger`, `follows`, `bookmarks`, `history`, `reports`, and polymorphic rights records). Application-level checks and reconciliation are therefore important; constraints should be added only after orphan and duplicate audits.
5. `ratings` is initially constrained to 1–5 in `0003`, then rebuilt for 1–10 in `0017`. The current policy parser accepts only whole integers 1–10. The final deployed schema must be verified, not inferred from the newest file name.

## 3. High-priority findings

### Finding SRC-AUTH-01: administrator role can be granted by an existing administrator

**Severity:** Critical authorization design gap
**Evidence:** `src/index.js`, around line 747, route `PATCH /api/admin/users/:id`.

The route requires `admin(u)`, then accepts `user`, `author`, `moderator`, or `admin` from the request body and writes the selected role to the target account. The only self-protection prevents an administrator from removing their own admin role; it does not prevent granting admin to another account.

Consequences:

- Any compromised or misused administrator account can promote another account to full administrator.
- The current code does not enforce the intended single-human-owner model or distinguish owner authority from a generic `admin` role.
- Privileged account changes are not visibly tied in this handler to step-up authentication or a separate owner-only approval.

Required remediation:

- Identify the true owner principal through verified operational evidence, not by guessing the oldest or first user.
- Introduce an owner-only authorization predicate separate from the generic admin role.
- Remove `admin` from ordinary role-edit options; require an explicit owner-only, step-up-authenticated, audited bootstrap/grant workflow for any future delegated administrator.
- Add negative tests proving ordinary admins, authors, readers, and service identities cannot create or elevate an administrator.
- Review existing administrator accounts and sessions before changing policy.

### Finding SRC-RIGHTS-01: public catalog and novel API paths do not consistently enforce rights eligibility

**Severity:** Critical content-rights and publication-boundary gap
**Evidence:** `src/index.js`, around lines 587–601.

`GET /api/novels` filters on `n.publication_status='published'` but does not include the `rights_status` allowlist used by the HTML metadata and sitemap paths. `GET /api/novels/:id` also selects a published novel without checking `rights_status`. `GET /api/chapters/:id` selects published chapter and novel state but does not reject a novel whose `rights_status` is pending, rejected, or otherwise ineligible.

The chapter handler uses lock/unlock state to decide whether to return `content`, but rights eligibility is not part of that decision. The chapter unlock and batch-unlock handlers also query publication state without an explicit rights allowlist.

Consequences:

- A record marked published but carrying ineligible rights metadata can still appear in public API catalog/detail responses.
- A chapter body can be returned by the chapter API when its lock rules permit, even though the parent novel's rights state is not eligible.
- HTML route metadata and sitemap filters are stricter than the API, creating inconsistent policy enforcement and a possible direct-API bypass.

Required remediation:

- Create one server-side `isPubliclyEligible` policy that checks publication state, rights state, takedown/suspension state and any relevant locale/access rule.
- Apply it consistently to catalog, novel detail, chapter body, chapter unlock, batch unlock, comments, search, recommendations, sitemap and all public projections.
- Prefer explicit response projections over `SELECT *` for public APIs.
- Add tests for every rights state, including direct API access when HTML routes reject the same resource.
- Add an urgent suppression path for rights withdrawal and takedown that does not depend only on asynchronous cache purge.

### Finding SRC-DATA-01: public novel API returns the full novels row

**Severity:** High information-disclosure and data-minimization concern
**Evidence:** `src/index.js`, around lines 589–600.

`GET /api/novels` selects `n.*`, and `GET /api/novels/:id` selects `*` and returns the row using object spread. The schema contains operational and creator-governance fields such as `owner_user_id`, rights evidence/notes, rights verification metadata, and review metadata (added by publishing migrations/runtime schema).

Even where these values are not passwords or direct personal identifiers, rights evidence, internal review notes, reviewer IDs and ownership metadata should not automatically become public API fields.

Required remediation:

- Define a public novel DTO with an explicit allowlist of display fields.
- Keep creator workspace ownership, rights evidence, reviewer data, moderation state and internal notes in private projections.
- Add response-schema tests that fail if internal columns are added to the novels table without an explicit public exposure decision.

### Finding SRC-ANALYTICS-01: chapter and novel views perform synchronous database writes on read paths

**Severity:** High scalability and availability concern
**Evidence:** `src/index.js`, around lines 600–601.

`GET /api/novels/:id` increments `novels.views` synchronously and then increments a daily aggregate. `GET /api/chapters/:id` increments `chapter_views` synchronously and then increments a daily aggregate. The daily aggregate write is wrapped in a catch, but the primary chapter view counter write is not.

Consequences:

- A popular chapter can create a write for every read request, concentrating contention on a single row.
- A cache strategy that serves only static HTML while still routing API reads through the Worker will not remove this write amplification.
- A database write failure can fail the chapter API even when chapter content itself is available.
- This conflicts with the intended asynchronous engagement-event design for the 1,000-reader hot-chapter scenario.

Required remediation:

- Define what counts as a view and how duplicates/bots/retries are treated.
- Move view aggregation off the synchronous chapter delivery path using a durable, idempotent event/batch mechanism or an appropriately bounded edge aggregation strategy.
- Keep committed comments, ratings, bookmarks and payments separate from approximate view counters.
- Test a hot chapter with cold and warm cache, and verify that read traffic does not create one synchronous database write per request.
- Clearly label aggregate freshness; never fabricate or silently inflate real-time counts.

## 4. Additional findings requiring hardening

### Finding SRC-TAX-01: anonymous taxonomy submissions can spoof submitter metadata

**Severity:** Medium trust and provenance gap
**Evidence:** `src/index.js`, around lines 456 and 420–424.

`/api/taxonomy` dispatches to `communityTaxonomy` without requiring an authenticated principal. Its POST path accepts `creator_id` and `creator_name` directly from the request body and stores those values in the pending submission. These fields are therefore not verified identity claims.

Required remediation:

- Either require authentication and derive creator ID/name from the session, or store submissions explicitly as anonymous with no trusted account identity.
- Treat all client-supplied attribution as untrusted display text and do not use it for moderation authority or audit attribution.
- Rate-limit and abuse-protect anonymous submissions.

### Finding SRC-ADMIN-02: broad user listing exposes personal and financial-adjacent fields to every admin

**Severity:** High privacy minimization concern
**Evidence:** `src/index.js`, around line 746.

`GET /api/admin/users` returns email, role, ticket balance, verification and ban state for up to 500 users to any principal passing the generic `admin(u)` check. This is not public access, but it is broader than the proposed sole-owner and purpose-bound sensitive-data model.

Required remediation:

- Restrict this view to the verified owner or a specifically authorized, audited workflow.
- Separate ordinary account moderation from access to email and financial balances.
- Use paginated, searchable, field-minimized projections and audit sensitive detail access.

### Finding SRC-BOOT-01: runtime bootstrap and migration state need parity tests

**Severity:** High operational integrity concern
**Evidence:** `src/index.js` `ensureCoreSchema`, `src/runtime-feature-schema.mjs`, and `migrations/0001`–`0018`.

The Worker performs runtime schema creation and writes a `core_schema_version` marker. A separate runtime feature-schema initializer creates additional tables and columns. D1 migrations also create overlapping tables and columns. The core bootstrap's fast path returns when the stored marker equals `16.64.0`, while current package/Worker release metadata is `17.23.0`; this marker appears to represent a schema baseline rather than the app release, but its lifecycle and upgrade contract are not documented in the inspected source.

Required remediation:

- Decide whether schema changes are migration-owned or runtime-bootstrap-owned. Avoid two independent authorities for the same DDL.
- Restore or formally replace the missing `0012` migration and remove misleading placeholder comments once the migration history is reconciled.
- Add clean-install, migration-upgrade, existing-database and runtime-bootstrap parity tests.
- Verify the schema marker against actual required tables/columns; do not treat a version string alone as proof of schema completeness.
- Run D1 migration dry-runs and backup/restore tests before production changes.

## 5. Positive controls observed

These controls exist in the inspected source, but their complete effectiveness still requires tests:

- Password hashing and verification are delegated to `src/auth-password.mjs`.
- Login and registration have IP/email rate-limit logic through `auth_rate_limits`.
- Session tokens are random, stored as SHA-256 digests, delivered in `HttpOnly`, `Secure`, `SameSite=Lax` cookies, and checked against expiry and banned-account state.
- `/api/health` has an early fast path that avoids schema bootstrap and session lookup.
- The automated payment webhook currently returns HTTP 503 and explicitly refuses automated confirmation until provider signature, amount, currency, event identity and replay protections are verified.
- Ticket unlock code uses conditional balance updates and D1 batches, with ledger writes guarded by successful changes.
- Author novel/chapter handlers contain owner_user_id comparisons for creator operations.
- HTML responses set several browser security headers and a restrictive same-origin-oriented CSP, although inline script/style allowances remain.
- The ten-point rating parser rejects non-integer and out-of-range values, and migration `0017` rebuilds the ratings constraint to 1–10.

Positive controls are not a certification and do not cancel the findings above.

## 6. Route and page-dispatch reconciliation

- Worker API dispatch is centralized through `p.startsWith('/api/')` and `api(req, env)`.
- HTML dispatch maps a number of separate product destinations to the same `index.html` shell, with client-side routing handling several screen states.
- Novel/chapter routes retain numeric identifiers: `/novel/:id`, `/novel/:id/chapters`, `/read/:novelId/:chapterNumber`.
- `/discover` and `/catalog` resolve to the catalog shell.
- `/author` and `/author/:username` resolve through distinct exact/pattern handling.
- Unknown extensionless paths are sent through `html()`, which selects `404.html` and returns status 404 when the shell is available.
- `wrangler.toml` uses an explicit `run_worker_first` list for the product route families. Any new route family must be reconciled with both Worker HTML dispatch and this asset routing configuration.

A route resolving to a shared shell is not evidence that it has a complete dedicated screen, API contract, SEO treatment or permission model.

## 7. Remediation order

### P0: close authorization and rights exposure gaps before public expansion

1. Establish verified owner-only authority and prevent generic admins from granting admin.
2. Apply the same rights/publication eligibility predicate to all public API, chapter and unlock paths.
3. Replace public `SELECT *` / `n.*` responses with explicit public DTOs.
4. Add direct-API negative tests for rights-blocked, draft, suspended and cross-owner content.

### P1: protect privacy and stabilize read paths

5. Remove spoofable submitter identity from anonymous taxonomy submissions.
6. Minimize and audit admin access to user email and ticket balances.
7. Remove synchronous hot-row view writes from chapter delivery and validate an idempotent aggregate path.
8. Reconcile the missing migration `0012`, runtime DDL and schema marker contract.

### P2: complete evidence and release confidence

9. Build an endpoint-by-endpoint method/auth/ownership/field/cache/rate-limit matrix.
10. Add response schema, route, authorization, rights and migration parity tests.
11. Run existing test scripts, Worker build checks and staging failure/load tests.
12. Compare the inspected branch to `main` and the live Worker before any merge or production deployment.

## 8. Required verification suite

- Public catalog/detail/chapter endpoints reject every ineligible rights and publication state.
- Public API responses contain only approved display fields.
- Generic admin cannot create another admin; only the verified owner can perform approved privileged delegation.
- Anonymous taxonomy submissions cannot claim a registered user's identity.
- User email and financial-adjacent fields are unavailable outside explicitly authorized, audited workflows.
- Chapter reads under a 1,000-reader hot spot do not cause one synchronous database write per request.
- Clean D1 install, migration upgrade, runtime bootstrap and existing database all produce the same required schema.
- Payment webhook remains disabled until provider-specific signature and replay tests pass.
- All existing build/test scripts pass on the exact candidate commit.

## 9. Current disposition

**Static audit result:** Architecture and source are not yet reconciled. Multiple high-priority changes are required before the platform can be cleared for broad public launch.

**Not performed:** no production deployment, no D1 mutation, no source-code modification, no runtime exploit test, no penetration test, no load test, and no live-data inspection.

**Production remains unchanged by this audit.**

---

**Next action:** prepare focused remediation designs and automated tests for SRC-AUTH-01, SRC-RIGHTS-01, SRC-DATA-01 and SRC-ANALYTICS-01 before editing application code.