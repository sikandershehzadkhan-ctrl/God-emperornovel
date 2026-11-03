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

## Findings

1. Cross-account integration tests are still required. SQL ownership predicates are visible, but static inspection does not prove runtime isolation.
2. Admin account mutation needs deeper review. The visible handler blocks self-demotion, but last-admin protection and a complete audit trail are not established by this review.
3. Admin collection semantics need clarification. The author role helper permits admins, but the author novel collection still filters to the current admin's own owner ID.
4. Taxonomy submitter identity is client-controlled in the reviewed handler. The handler accepts `creator_id` and `creator_name` from the request body without requiring a session. Decide whether anonymous proposals are intended and prevent spoofable attribution.
5. The remainder of the API remains pending. Method enforcement, authorization, object ownership, DTO allowlists, CSRF/origin controls, cache privacy, and dynamic route semantics need continued review.

## Next validation

Add two-account runtime tests for account-scoped reads and cross-user ID substitution on creator-owned novels, chapters, and AI projects. Review last-admin invariants and taxonomy submitter attribution before security sign-off.
