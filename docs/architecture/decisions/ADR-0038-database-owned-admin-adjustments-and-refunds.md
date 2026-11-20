# ADR-0038: Database-Owned Administrator Adjustments and Request Refunds

- **Status:** Proposed
- **Date:** 2026-11-20
- **Scope:** Administrator Crown credits and paid novel-request refunds

## Context

Migrations 0025 and 0027 introduce append-only financial records whose database triggers post Crown balance changes and ticket-ledger entries. The current Worker previously performed those balance and ledger writes directly. Leaving that behavior in place while switching the API to insert the new records would create duplicate posting.

## Decision

Use the database triggers as the only posting authority for these two operations.

For administrator Crown credits, the API requires an administrator session, a distinct target account, a whole-number amount, a bounded reason, and a stable idempotency key. It inserts one admin_ticket_adjustments row. The database validates the administrator role, uniqueness, and immutable history, then posts the balance and ledger changes atomically.

For paid novel-request refunds, the API requires a pending request, a valid amount, and a bounded review note. It transitions the request to rejected and inserts one novel_request_refunds row in the same D1 batch. The database validates that the request is rejected, the amount matches the original cost, and the reviewer is an independent administrator. The trigger posts the balance and ledger changes atomically.

The Worker must not separately update users.tickets or insert ticket_ledger rows for either operation.

## Consequences

- Each administrator adjustment is attributable, idempotent, and immutable.
- Each paid request refund can be posted once only and must match the original request cost.
- Application and database layers share one posting authority.
- The admin UI collects reasons/notes and retains adjustment idempotency keys for retry.
- Migrations 0025 and 0027 must be applied before the updated Worker is deployed.

## Verification

Build-gated source tests assert the API and UI contracts. SQLite trigger tests verify independent administrator authorization, exact amounts, immutable records, exactly-once balance/ledger posting, and rejection of duplicate or invalid operations. Production D1 inventory and production-shaped rehearsal remain mandatory release gates.
