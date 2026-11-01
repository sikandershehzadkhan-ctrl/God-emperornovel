# Account deletion lifecycle design

Status: design only. This document does not authorize or implement account erasure.

## Non-negotiable invariants

1. A deletion request is not an erasure operation.
2. Re-authentication is required before a request is accepted.
3. A request enters a 30-day cooling-off period and can be cancelled by the account holder while pending.
4. No scheduled job may erase an account until the finalization policy and dependency inventory have been independently reviewed.
5. Financial ledger entries and records subject to legal retention must not be silently deleted or rewritten.
6. Creator novels and chapters must never be deleted merely because their author's account is closing.
7. Pending ownership transfers, rights evidence, moderation cases, and payment disputes must be resolved or explicitly retained under a documented policy.
8. Every operation must be account-scoped and idempotent; retries must not create duplicate financial or ownership effects.

## Proposed lifecycle

- active: normal account state
- pending_deletion: request verified, 30-day cooling-off period active
- cancelled: user cancelled before finalization
- review_required: unresolved creator ownership, financial, legal, or moderation dependency
- finalized: reviewed erasure/anonymization completed, with permitted retained records documented

## Re-authentication and abuse controls

- Require the current password for password-based accounts; future federated accounts need provider re-authentication.
- Apply per-account and per-IP rate limits.
- Return generic authentication failures.
- Do not place passwords, reset tokens, or session tokens in request records or audit details.
- Notify the account through its verified contact channel, without exposing private account details in the notification preview.

## Dependency inventory required before finalization

| Data surface | Required treatment |
|---|---|
| users | Remove or irreversibly anonymize personal identifiers only after eligibility checks |
| sessions | Revoke all sessions at finalization |
| ticket_ledger, donations | Preserve legally required accounting evidence; minimize identifying fields where permitted |
| novels, chapters | Preserve published creator works unless ownership is transferred with consent or a lawful takedown applies |
| novel_ownership_transfers | Resolve pending transfers before finalization |
| rights evidence and connector authorization | Preserve records needed to establish publication rights and audit authorization |
| reports, moderation records, audit_logs | Apply documented retention and pseudonymization rules; never expose reviewer identities |
| history, bookmarks, follows, ratings, comments | Delete or anonymize according to product policy and applicable law |
| AI Author Studio jobs and projects | Preserve or transfer creator-owned drafts only with explicit user choice; otherwise erase eligible personal content |
| OmniPortal import jobs | Remove personal metadata while preserving any required rights/authorization evidence |
| notifications | Remove personal notifications when eligible |
| backups and logs | Define bounded retention and deletion propagation; document exceptions |

## Required tests before implementation is considered safe

- Account A cannot request, inspect, cancel, or finalize Account B's deletion.
- Incorrect password never creates a request.
- Rate limits apply independently per account and IP.
- A repeated request is idempotent.
- A pending request can be cancelled before its deadline.
- An expired request does not automatically erase data without the reviewed finalization gate.
- A creator with published novels is routed through ownership review.
- Open payment disputes and legally retained ledger entries remain intact.
- All sessions are revoked at finalization.
- Repeated finalization attempts do not double-process or corrupt records.
- D1 failure at every step leaves a recoverable, auditable state.

## Explicitly out of scope for the first implementation

- Automatic hard deletion of user rows.
- Cascading deletion of novels or chapters.
- Deleting or rewriting financial ledger entries.
- Automatic ownership reassignment.
- Automatic erasure of backups or external provider records.

This design must be reviewed against applicable Pakistani law and any other jurisdictions in which Imperial Novel operates before a finalization implementation is approved.
