# ADR-0037: Database-Owned Donation Credit Posting

- **Status:** Proposed
- **Date:** 2026-11-20
- **Scope:** Donation review, finalization, Crown balance, and payment ledger

## Context

Migration 0024 adds a database trigger that credits a donor's Crown balance and writes the corresponding payment ledger entry when a pending donation is approved. The pre-existing Worker handler also credited the balance and wrote the ledger after changing donation status. Enabling both mechanisms would double-credit an approved donation. The migration also requires a persisted review note and reviewer identity; migration 0026 requires the reviewer to be independent of the donor.

## Decision

Use the database trigger as the single posting authority. The Worker must validate the administrator, reject self-review, require a bounded review note, insert an attributable donation_reviews row, and then transition the pending donation. The Worker must not also update the donor's balance or insert a payment ledger row. The database trigger posts both atomically with the status transition.

The admin interface must collect the review note for both approval and rejection. Database triggers remain the final enforcement boundary for review attribution, independent review, and immutable review history.

## Consequences

- One approved donation produces one balance credit and one payment ledger entry.
- Rejected donations produce no Crown credit.
- Application retries cannot post a second credit after the donation leaves the pending state.
- A missing review, self-review, or invalid review record blocks finalization.
- The integration requires migrations 0024 and 0026 before the updated Worker is deployed.

## Verification

The build-gated donation policy test checks reviewer identity, self-review rejection, and required notes. The SQLite trigger test checks missing-review rejection, independent-review enforcement, immutable history, exactly-once posting, and no credit on rejection. Production D1 inspection and a production-shaped migration rehearsal remain separate release requirements.
