# ADR-0026: Reader content and unlock entitlement boundaries

- **Date:** 2026-11-20
- **Status:** Accepted
- **Related:** ADR-0025 and `IMPERIAL-ROUTE-REGISTRY-01N.json`

## Context

The reader page shell is public, but that does not imply every chapter body is public. The Worker exposes chapter metadata and content through a separate API and supports single-chapter and batch unlock operations using Imperial Crowns.

## Source-audited behavior

- Novel detail lookup requires the novel to be published and have an eligible rights status.
- Chapter content lookup requires both the chapter and its parent novel to be published, with the parent novel carrying an eligible rights status.
- The chapter API returns the body only when the chapter is not locked, the requester is an administrator, or the current authenticated user has an unlock record for that chapter. Otherwise, the content field is null.
- Single unlock requires an authenticated session, validates the eligible parent work and price, conditionally debits the current user's balance, writes an unlock row, and records the ledger debit.
- Batch unlock requires an authenticated session, validates the published rights-eligible parent novel, selects only published locked chapters not already unlocked by the current user, and records the debit, per-chapter unlock rows, and batch ledger record.

## Validation

The route-registry test now asserts these source-level gates and verifies that locked chapter content is not returned without entitlement.

## Evidence boundary

These checks inspect current Worker source. They do not replace D1 integration tests, concurrency tests against real transactions, cache/privacy verification, or live production checks. No runtime code, database, secrets, or production deployment are changed.
