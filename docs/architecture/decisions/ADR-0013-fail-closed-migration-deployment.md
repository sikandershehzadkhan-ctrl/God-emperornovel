# ADR-0013: Fail-closed production deployment for unreconciled migrations

- **Status:** Proposed
- **Date:** 2026-11-05
- **Decision owners:** Delivery platform and platform data

## Context

The manual production deployment workflow currently applies and verifies migrations 0009-0011 only. The canonical integration branch contains later numbered migrations. A green fresh-SQLite replay does not prove that the production D1 database has those schema changes, and deploying code that depends on them without applying them can break live routes.

## Decision

1. Keep production deployment manual and explicitly confirmed.
2. Before Cloudflare credential verification or any remote D1 action, inspect the repository migration directory.
3. If any numbered migration above 0011 exists, fail the deployment job with the unsupported migration list.
4. Do not bypass the gate or infer production schema state from a clean fresh-database test.
5. Replace this temporary block only after a deterministic, resumable migration release plan exists, including a read-only inventory of live state, legacy compatibility checks, per-migration preflight/postflight, and a non-production D1 rehearsal.

## Consequences

- The current canonical integration branch cannot accidentally deploy through an incomplete migration workflow.
- CI can continue validating source and migrations without mutating production.
- A future release pipeline must explicitly reconcile migrations 0012 onward before deployment is re-enabled.

## Rollback

The gate may be removed only in the same change that adds and tests the replacement full-chain release controls. No production database change is part of this decision.
