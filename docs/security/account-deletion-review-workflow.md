# Account deletion administrative review workflow

Status: partial security implementation on the draft security branch. Reviewer-role listing, assignment, revocation, and a role-gated read-only queue now have API routes. Case claiming, case decisions, approval workflow, and finalization are not implemented. Nothing here approves deletion or authorizes production erasure.

## Purpose

Provide a narrowly permissioned, auditable review process for deletion requests that cannot safely proceed through the ordinary 30-day cooling-off path. The workflow must protect creator-owned works, financial evidence, rights records, moderation cases, and the personal data of other accounts.

## Security invariants

1. A reviewer may inspect and classify a request, but review approval is not a database-erasure command.
2. No reviewer may delete a user row, cascade-delete creator content, rewrite a financial ledger, or transfer ownership through this workflow.
3. Every request and every administrative action is scoped to one request ID and its bound user ID. A client-supplied user ID is never trusted.
4. Reviewer access is least-privilege and separate from ordinary account administration where feasible.
5. The requester cannot review their own request. The actor and subject must be recorded separately.
6. High-impact decisions require a second authorized reviewer. No self-approval or single-person bypass.
7. All state transitions use guarded, atomic database operations and are idempotent.
8. Review notes must not contain passwords, session tokens, reset tokens, full payment credentials, or unnecessary personal data.
9. The audit trail is append-only for application workflows. Corrections are new events, not edits to prior events.
10. Expiry of the 30-day period never triggers automatic erasure.

## Roles and permissions

| Role | Permitted actions | Prohibited actions |
|---|---|---|
| Support reviewer | View minimum request metadata; request clarification; record a support disposition | View password hashes, private creator drafts, full financial instruments, or finalize |
| Creator-rights reviewer | Inspect novel ownership, publication status, rights evidence references, and pending transfers needed for disposition | Reassign ownership without the separate consent-based transfer flow; delete chapters or novels |
| Finance/compliance reviewer | Determine whether ledger, donation, refund, dispute, or legally retained records require preservation | Edit or delete ledger entries; disclose unrelated account transactions |
| Privacy administrator | Coordinate the dependency inventory and prepare a proposed disposition | Unilaterally approve and execute finalization |
| Second approver | Independently review the proposed disposition and evidence | Approve their own proposal or bypass unresolved dependencies |
| System operator | Operate reviewed, tested maintenance tooling under a separately approved change | Use an ad hoc SQL delete or bypass the recorded approval gate |

Role grants must be explicit, time-bounded where practical, and audited. An ordinary `admin` role must not automatically imply every specialist permission.

## Proposed review states

- `pending_deletion`: ordinary request is inside its cooling-off period.
- `review_required`: a dependency requires specialist review.
- `review_in_progress`: a reviewer has claimed the case using a short-lived lease.
- `awaiting_user_action`: the user must choose, confirm, or supply information.
- `blocked_retention`: a documented legal, financial, rights, or safety hold prevents finalization.
- `review_approved`: reviewers have approved a written disposition; this is not erasure authorization.
- `cancelled`: the user cancelled before the irreversible process began.
- `finalization_eligible`: all gates are satisfied and a separate finalization change has been authorized.
- `finalized`: a separately approved and verified finalization has completed.
- `rejected`: the request cannot proceed, with a safe user-facing reason and appeal path.

The implementation must define allowed transitions explicitly. Arbitrary status updates are forbidden.

## Required reviewer workflow

1. **Queue:** list only request ID, status, request date, scheduled date, and coarse reason category. Paginate and avoid bulk export.
2. **Claim:** acquire an atomic, expiring reviewer lease. Prevent concurrent reviewers from silently overwriting each other's decisions.
3. **Verify scope:** derive the subject account from the request record. Never accept a subject account ID from the browser as authority.
4. **Inventory dependencies:** check creator-owned novels and chapters, ownership transfers, rights evidence, tickets and financial ledgers, donations/refunds/disputes, moderation and legal holds, AI drafts/projects, OmniPortal jobs and authorizations, sessions, notifications, backups, and provider-side records.
5. **Minimize access:** expose only the fields needed by the reviewer's role. Use references and counts instead of chapter bodies, private drafts, or complete financial records.
6. **Record disposition:** select a structured outcome per dependency: retain, anonymize, delete, transfer with separate consent, await user action, or block. Require a reason and policy reference for each non-default choice.
7. **Second-person approval:** a different authorized reviewer verifies the dependency inventory and proposed disposition. Any changed dependency invalidates prior approval.
8. **Notify:** communicate the decision through a verified channel when available. Do not reveal sensitive details in notification previews.
9. **Close or escalate:** unresolved dependencies remain blocked or awaiting action. They must never be silently treated as cleared.
10. **Separate finalization:** any future finalization worker or operator must consume an immutable approved plan, re-check all preconditions, and write an idempotent execution record. This requires its own implementation, threat model, tests, and release approval.

## Data access and privacy

- All reviewer endpoints require authentication, explicit permission checks, CSRF protection where cookie sessions are used, and account/request-level authorization.
- Reviewer identity is never included in the user's ordinary account export or exposed to another reviewer without a legitimate audit purpose.
- Review responses must not return password hashes, session identifiers, token digests, private notes unrelated to the case, or other users' records.
- Use no-store response headers for sensitive review pages.
- Apply rate limits and log denied access attempts without recording secrets.
- Search, filters, and pagination must not allow an unprivileged user to enumerate account IDs or request existence.
- Audit records should contain actor ID, request ID, action, prior and new state, timestamp, reason code, policy version, and a correlation ID. Store only the minimum necessary detail.

## Atomicity and failure handling

- Claiming, state transitions, approval records, and audit events must be committed atomically where they form one logical operation.
- Use compare-and-set conditions on the expected prior state and current lease/version.
- A stale reviewer must receive a conflict response, not overwrite a newer decision.
- If audit persistence fails, the corresponding privileged mutation must fail closed.
- Retries must return the already-recorded result or a conflict; they must not duplicate approvals or finalization effects.
- Every multi-step finalization design must include failure injection at each database/provider boundary and a recovery/reconciliation procedure.

## Mandatory tests before an administrative workflow ships

- Non-admin and ordinary admin accounts without the specialist permission are denied.
- Reviewer A cannot claim or modify another request outside the permitted queue scope.
- The requester cannot review or approve their own request.
- One reviewer cannot satisfy both approval roles.
- Concurrent claim attempts produce exactly one active lease.
- Expired leases can be reclaimed without losing prior audit history.
- Stale state transitions and stale approvals are rejected.
- Changing the dependency inventory invalidates existing approval.
- Cross-account sentinel data never appears in queue details, exports, search, or reviewer responses.
- Creator content and rights evidence remain unchanged during review.
- Financial ledger and dispute records remain unchanged during review.
- Audit write failure prevents privileged state changes.
- Replayed requests do not duplicate state transitions or approvals.
- No scheduled job performs erasure merely because `scheduled_for` has passed.
- Finalization tooling, if ever added, requires a separate explicit approval and independent end-to-end test suite.

## Release boundary

The reversible account-deletion API and user settings interface remain the only implemented user-facing deletion functionality. Administrative reviewer-role APIs now support bounded listing, explicit assignment, one-way revocation, and append-only assignment events. The review queue is read-only and requires an active reviewer assignment. Case claiming, role-specific case details, disposition recording, independent approval, reviewer UI, and finalization remain unimplemented. The draft branch has not been deployed and no production migration has run. Keep the pull request in draft until the remaining workflow, integration tests, and independent review are complete.

Review this policy against applicable Pakistani law and every jurisdiction in which Imperial Novel operates before implementing retention periods or irreversible processing.
