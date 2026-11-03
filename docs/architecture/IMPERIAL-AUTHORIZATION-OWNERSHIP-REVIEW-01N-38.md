# Imperial Novel Authorization & Ownership Review (01N-38)

**Audit date:** 3 November 2026  
**Audited source:** `main:src/index.js`  
**Source blob:** `237f4461135eb77258b7184e361ce9dfd9a140e9`

## Scope

This is a partial handler-level source review, not a complete review of all API routes or a security certification. Only controls directly visible in the current source are recorded. All unreviewed routes remain pending.

## Confirmed controls

- Notifications, ticket ledger, recommendations, follows, profile aggregates, and the current user's author application are queried using the authenticated session user ID.
- Author novel and chapter writes load the parent novel and compare its owner ID with the authenticated user, except for administrators.
- Newly created author novels receive the current user as owner and start in draft status.
- Global statistics, account directory, author application moderation, and application review use an administrator gate.
- Application approval uses pending-state and eligible-account conditions before promoting an applicant.

## AI project isolation

The reviewed AI project collection is filtered by the current account ID. Project detail, update, generation-run, and job-list handlers load the project and compare its owner ID before proceeding, with an explicit admin override. Linked novels are also checked against the current account before a project is created. Two-account integration tests are still required for project IDs and job IDs.

## Additional admin and connector review

- Donation review is admin-gated and uses a pending-state transition with linked ticket-balance and ledger writes. D1 integration tests must verify duplicate approval and failure recovery.
- Admin report status changes are gated and allowlisted, but the reviewed handler does not emit an audit event.
- Admin account role/verification/ban changes block self-demotion, but last-admin protection and audit logging are not established in the handler.
- Connector authorization requests derive requester identity from the authenticated session. Admin review requires a pending request and rights evidence/terms/notes; approved connectors remain disabled until separately enabled.
- Admin ticket adjustments update the target balance and conditionally create a ledger entry; runtime consistency tests remain necessary.

## Taxonomy and voting access review

- Public taxonomy reads return approved entries only; pending and rejected proposals are blocked from public discovery.
- Taxonomy proposals are currently anonymous. The handler accepts `creator_id` and `creator_name` from the request body, which permits spoofed attribution. No rate limit is visible in this handler.
- Taxonomy moderation reads and decisions are admin-gated; reviewer identity is taken from the authenticated admin session and proposals must still be pending.
- Public voting exposes request URL, source host, status, timestamp, vote count and requester username. Vote creation/removal is authenticated and scoped to the session user ID.

## Cache and browser request protections

- The shared JSON response helper defaults to `Cache-Control: no-store`; the HTML response also sets `no-store`.
- The sitemap is the explicit public-cache exception and selects only published, rights-eligible novels and chapters.
- The login cookie is `HttpOnly`, `Secure`, and `SameSite=Lax`. No explicit Origin or CSRF-token check is visible in the reviewed request pipeline, so cross-site browser POST behavior still needs a dedicated test. SameSite is a useful baseline, not a substitute for verification.

## Findings

1. Cross-account integration tests are still required. SQL ownership predicates are visible, but static inspection does not prove runtime isolation.
2. Admin account mutation needs deeper review. The visible handler blocks self-demotion, but last-admin protection and a complete audit trail are not established by this review.
3. Admin collection semantics need clarification. The author role helper permits admins, but the author novel collection still filters to the current admin's own owner ID.
4. Taxonomy submitter identity is client-controlled in the reviewed handler. The handler accepts `creator_id` and `creator_name` from the request body without requiring a session. Decide whether anonymous proposals are intended and prevent spoofable attribution.
5. The remainder of the API remains pending. Method enforcement, authorization, object ownership, DTO allowlists, CSRF/origin controls, cache privacy, and dynamic route semantics need continued review.

## Next validation

Add two-account runtime tests for account-scoped reads and cross-user ID substitution on creator-owned novels, chapters, and AI projects. Review last-admin invariants and taxonomy submitter attribution before security sign-off.
