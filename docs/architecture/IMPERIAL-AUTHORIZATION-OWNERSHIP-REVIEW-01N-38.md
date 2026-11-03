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

## AI generation actor versus project owner

The AI project generation endpoints permit the admin role to operate on a creator-owned project. However, generation job and run rows write the acting session user's ID into columns named `owner_user_id`, while the project itself remains owned by the creator. This may be intentional admin-on-behalf-of behavior, but the data model does not distinguish the project owner from the operator. Decide whether this admin capability should exist and separate actor attribution from ownership if retained.

## Findings

1. Cross-account integration tests are still required. SQL ownership predicates are visible, but static inspection does not prove runtime isolation.
2. Admin account mutation needs deeper review. The visible handler blocks self-demotion, but last-admin protection and a complete audit trail are not established by this review.
3. Admin collection semantics need clarification. The author role helper permits admins, but the author novel collection still filters to the current admin's own owner ID.
4. Taxonomy submitter identity is client-controlled in the reviewed handler. The handler accepts `creator_id` and `creator_name` from the request body without requiring a session. Decide whether anonymous proposals are intended and prevent spoofable attribution.
5. The remainder of the API remains pending. Method enforcement, authorization, object ownership, DTO allowlists, CSRF/origin controls, cache privacy, and dynamic route semantics need continued review.

## Next validation

Add two-account runtime tests for account-scoped reads and cross-user ID substitution on creator-owned novels, chapters, and AI projects. Review last-admin invariants and taxonomy submitter attribution before security sign-off.


## Comment visibility and parent-content eligibility (AUTH-013)

The public `GET /api/comments` handler selects visible comments by caller-supplied `novel_id` but does not join the parent novel or constrain its publication and rights status. The authenticated `POST /api/comments` handler validates the comment body and optional parent comment, then inserts using the supplied novel ID without first verifying that the parent novel exists, is published, and is rights-eligible. This is a source-level gap, not proof of an exploitable leak: confirm route reachability and data constraints in an isolated D1 integration test.

**Required tests:** public reads must not expose comments for draft or rights-ineligible novels; authenticated users must not create comments for missing, draft, or rights-ineligible novels; normal comments on published, rights-eligible novels must continue to work.

**Recommended remediation:** enforce the same published + rights-status allowlist used by public catalog/discovery queries in both read and write handlers, and return a consistent not-found response for ineligible parent novels.


## Rating contract consistency (AUTH-014)

The current source accepts whole-number ratings from 1 to 5, while the recorded product requirement is a whole-number 1-to-10 scale. A second legacy `POST /api/rating` handler appears later in the same request dispatch path; it also accepts 1 to 5 but omits the published/rights-eligible novel check present in the earlier handler. The earlier matching handler returns a response, so the later block appears unreachable under the current sequential dispatch. This is a maintainability and contract-consistency finding, not evidence that the weaker branch is currently reachable.

Do not widen the API bound in isolation. First inspect database CHECK constraints, existing rating values, frontend controls, sorting/filtering consumers, imported data, and any serialized rating displays. Then define a migration that preserves historical meaning and add end-to-end tests for accepted values, averages, distribution, sorting and eligibility.


## Admin account PATCH semantics and last-admin protection (AUTH-015 / AUTH-016)

The current `PATCH /api/admin/users/:id` handler computes `verified` and `banned` from truthiness of request-body fields and writes both columns on every request. If an administrator sends a role-only patch, omitted `verified` and `banned` values become `0`; this can silently clear verification or unban an account. This is a concrete partial-update semantics defect visible in source.

The handler blocks self-demotion but does not visibly enforce a last-active-admin invariant when another administrator demotes or bans the final remaining administrator. This can remove the platform's administrative recovery path.

**Required remediation:** parse a strict allowlisted patch DTO, preserve omitted fields, reject empty updates, verify the target row exists, and write an immutable audit event recording actor, target, and before/after values. Enforce the last-active-admin rule within a transaction or equivalent atomic D1 operation so concurrent changes cannot bypass it.

**Required tests:** role-only patch preserves verification and ban state; verified-only patch preserves role and ban state; banned-only patch preserves role and verification; unknown fields are rejected; empty patch is rejected; missing target returns not found; last admin cannot be demoted or banned; concurrent attempts cannot leave zero active admins.


### Detail API method follow-up

The `/api/novels/:id` and `/api/chapters/:id` detail handlers now reject non-GET methods with 405 before database access and before view-count writes. The new static regression test passes in the route-registry workflow. This is a targeted correction, not proof that all API handlers have correct method guards.
