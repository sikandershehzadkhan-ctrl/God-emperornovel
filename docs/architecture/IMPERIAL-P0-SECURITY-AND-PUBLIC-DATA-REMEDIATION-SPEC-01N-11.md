# Imperial Novel: P0 Security and Public-Data Remediation Specification

**Programme:** Phase 01N source reconciliation
**Status:** Remediation design and test contract; no application code changed
**Branch:** `architecture/phase-01n-master-route-registry`

## 1. Release blockers

This specification converts source audit findings SRC-AUTH-01, SRC-RIGHTS-01, SRC-DATA-01 and SRC-ANALYTICS-01 into implementation requirements. Work must be performed in isolated, reviewable changes with tests. Do not deploy these changes directly to production without staging verification and the established deployment gate.

## 2. SRC-AUTH-01: owner-only privileged authority

### Required design

- Separate `platform_owner` authority from the legacy `users.role` field.
- Resolve the owner principal from a deliberate, authenticated operational configuration, not from `MIN(user_id)`, first registration, a request payload, or a generic admin role.
- Owner bootstrap must be one-time, explicit, recoverable and auditable. The bootstrap secret or proof must never be exposed to browser code or logs.
- Generic admin may perform only the delegated operational tasks explicitly assigned to that admin. Under the current solo-owner model, no delegated admin is active by default.
- Generic admin cannot create another admin, assign owner authority, alter owner identity, modify authorization policy, or disable audit/security controls.
- Any future delegated role requires a separate scope, expiry, revocation and audit record.
- Add step-up authentication for owner identity, privileged grants, security settings and sensitive exports.

### Compatibility and migration

- Inventory all accounts with `role='admin'` and every route that calls `admin(u)`.
- Do not silently remove an existing admin or guess which account is the owner.
- Verify owner identity through the account owner and deployment control plane before enabling owner-only restrictions.
- Keep a safe recovery procedure and test it in staging.

### Mandatory tests

1. Anonymous, reader and author cannot call admin endpoints.
2. A generic delegated admin cannot assign `admin` or `platform_owner` to any account.
3. A generic delegated admin cannot change the verified owner account's identity or authority.
4. A reader cannot elevate itself by submitting `role`, `isAdmin`, `ownerId` or similar client fields.
5. Owner-only grant requires fresh step-up authentication and creates an immutable audit event.
6. Revoked or expired delegated grants fail on the next request.
7. The owner recovery process works without a hidden first-user bootstrap.

## 3. SRC-RIGHTS-01: one eligibility policy for all public content

### Required design

Create a single server-side publication eligibility function. It must evaluate at least:

- novel publication state is exactly `published`;
- chapter publication state is exactly `published` where chapter content is requested;
- rights state is in the explicit allowlist `original`, `public_domain`, `licensed`, or `authorized`;
- no active takedown, suspension, legal hold or policy suppression blocks access;
- resource-to-parent relationships are valid;
- any future territory, language, age or entitlement rules are satisfied.

Use the same policy in:

- `GET /api/novels` catalog and all filters/sorts;
- `GET /api/novels/:id` detail;
- `GET /api/chapters/:id` chapter body;
- single and batch unlock endpoints;
- comments, reactions, ratings, search, recommendations and public author projections;
- sitemap shards, canonical metadata and public cache population.

Do not rely on the UI or HTML route guard. The API is an independent access path. When rights/publication state cannot be resolved, fail closed for content delivery.

### Mandatory tests

Run a rights-state matrix against every public API path:

| Novel state | Chapter state | Rights state | Expected public result |
|---|---|---|---|
| published | published | original | Eligible, subject to lock/entitlement |
| published | published | public_domain | Eligible, subject to lock/entitlement |
| published | published | licensed | Eligible only within documented license conditions |
| published | published | authorized | Eligible only within documented authorization conditions |
| published | published | pending_review | Denied |
| published | published | rejected | Denied |
| published | published | unknown/empty | Denied |
| draft/review/suspended | published | otherwise eligible | Denied |
| published | draft/hidden | otherwise eligible | Chapter denied |

Tests must verify both response status and absence of title, metadata, chapter text, cover URLs where restricted, and cache artifacts. Repeat requests through HTML and direct API routes and confirm identical policy decisions.

## 4. SRC-DATA-01: public response allowlists

### Required design

- Replace `SELECT *` and `n.*` in public novel APIs with explicit, reviewed column lists.
- Define a stable public DTO for novel cards and novel detail. Include only fields necessary for reader display and public discovery.
- Exclude workspace ownership identifiers, rights evidence and notes, review feedback, reviewer identifiers, internal moderation fields and operational metadata.
- Define a separate author-owned DTO for creator views and a restricted owner/governance DTO.
- Add schema-evolution tests so adding a database column cannot automatically expose it publicly.

### Mandatory tests

1. Assert the exact public response key allowlist for catalog and novel detail.
2. Insert sentinel values into rights evidence, internal review notes and owner metadata; verify no public endpoint returns them.
3. Verify creator owner can see permitted private fields only for their own resource.
4. Verify a different author cannot access the same private fields.
5. Verify response allowlists remain stable when a new internal column is added to a fixture schema.

## 5. SRC-ANALYTICS-01: remove synchronous hot-row view writes

### Required design

- Define view-request semantics, deduplication window, bot treatment and privacy boundaries.
- Chapter and novel content delivery must not synchronously update a shared hot counter row per request.
- Use a bounded, durable event or aggregation mechanism with idempotent event IDs and batch/periodic persistence.
- Separate approximate view-request aggregates from committed user actions such as comments, ratings, bookmarks, ticket purchases and unlocks.
- Expose freshness/last-updated information when the aggregate is delayed.
- If the event pipeline is temporarily unavailable, reading must continue where content and authorization remain valid; any loss/buffering policy must be explicit and observable.

### Mandatory tests

1. Simulate 1,000 readers opening one chapter and verify content delivery does not issue one synchronous counter write per read.
2. Deliver the same event repeatedly and verify the aggregate is not inflated beyond the deduplication policy.
3. Pause the analytics consumer and verify chapter delivery remains available.
4. Restart/replay the consumer and verify eventual aggregate reconciliation.
5. Verify no user email, session token, private history or chapter body is embedded in view events.
6. Verify a rights takedown suppresses content independently of analytics backlog.

## 6. Regression suite and execution order

Existing relevant tests include:

- `scripts/test-auth-password.mjs`
- `scripts/test-runtime-feature-schema.mjs`
- `scripts/test-novel-rating-policy.mjs`
- `scripts/test-payment-webhook-disabled.mjs`
- `scripts/test-chapter-unlock-atomic.mjs`
- `scripts/test-production-deploy-gates.mjs`

The inspected test suite does not currently prove the four source audit findings above are fixed. Add focused route-level tests rather than relying only on source-string assertions.

Recommended sequence:

1. Create fixtures for owner, delegated admin, reader, author, public/draft/rights-blocked novel and chapters.
2. Implement owner authorization and test privilege boundaries.
3. Implement shared content eligibility and run the full rights-state matrix.
4. Implement public DTO allowlists and private-field sentinel tests.
5. Implement asynchronous view aggregation and hot-chapter load tests.
6. Run existing tests and all new tests on the same candidate commit.
7. Run build, Cloudflare readiness and dry-run deployment checks.
8. Deploy to isolated staging, run route/security/rights tests, then controlled load/failure drills.
9. Review diff and rollback plan before considering merge or production release.

## 7. Acceptance and release gate

No public launch or broad traffic expansion until:

- all four findings have code fixes and route-level regression tests;
- owner identity and recovery are verified;
- rights policy is consistent across HTML, API, cache, search and sitemap;
- no internal governance/rights fields leak from public DTOs;
- hot chapter load tests pass without synchronous per-read hot-row writes;
- schema/migration parity is resolved;
- payment and unlock regression tests pass;
- staging tests and rollback rehearsal pass.

**Current status:** Requirements and tests specified. No application code, database, production route or deployment was changed by this document.

---

**Next implementation prerequisite:** complete the remaining endpoint method/permission inventory and identify the exact current owner bootstrap/recovery mechanism before modifying privileged authorization code.