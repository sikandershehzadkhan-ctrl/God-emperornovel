# ADR-0019: Reconcile Additive D1 Migrations 0012–0023 onto Mainline

**Status:** Proposed
**Date:** 2026-11-20
**Decision owners:** Database and data-integrity owner; platform architecture and release owner

## Context

The current `main` lineage contains canonical SQL migrations 0001–0011. A separate integration lineage contains migrations 0012–0046, but that branch is substantially divergent from current main and cannot be merged wholesale.

The first migration slice, 0012–0023, adds profile metadata, username history guards, account preferences, chapter revision/scheduling tables, and a rights-aware media/comic asset schema. These SQL files are additive against the unchanged 0001–0011 baseline. The migration files are ported individually, not by merging the integration branch.

## Decision

1. Port only canonical SQL migrations 0012–0023 onto current main, preserving their SQL contents.
2. Reserve each sequence number 0012–0023 in the same pull request using immutable reservation records bound to PR #371.
3. Add deterministic SQLite tests for profile defaults/constraints, username history, chapter revisions, scheduled publication, media registry, rights gates, owner isolation, quotas and comic page lifecycle.
4. Keep migrations append-only. Any later correction must be a new forward migration.
5. Do not port migrations 0024–0046 as part of this slice. They require separate review of application/database authority, data-preservation behavior, and production-shaped migration tests.
6. Do not apply these migrations to production D1 or alter the production deployment workflow. A production read-only schema audit, migration-ledger reconciliation, recoverable backup and restore rehearsal, and reviewed apply/postflight plan remain mandatory.

## Consequences

The mainline repository gains a contiguous canonical schema history through 0023 and build-gated SQLite coverage for this slice. This does not establish that production has applied any of these migrations, nor does it authorize production deployment.

## Verification

- Cloudflare Source Validation applies the complete checked-in migration chain to a fresh in-memory SQLite database.
- Migration Governance verifies immutable SQL history and same-PR number reservations.
- Dedicated migration tests exercise profile/username behavior and media/comic constraints.
- No remote D1 query, production mutation, backup, restore, or Worker deployment is performed.

## Confirmed exclusion blocker in migration 0024

The later integration-lineage migration 0024 is not compatible with the current mainline donation handler as written:

- The migration adds a `BEFORE UPDATE OF status` trigger that rejects approval/rejection unless a matching `donation_reviews` row already exists.
- The current `PATCH /api/admin/donations/{id}` handler updates donation status without inserting `donation_reviews`, so the trigger rejects the operation.
- The same migration adds an `AFTER UPDATE OF status` trigger that credits the user's Crown balance and writes the payment ledger. The current handler separately performs those same two writes in its D1 batch. If the review-row requirement were added without removing the application-side writes, approval would credit and ledger twice.

This incompatibility was reproduced in an isolated in-memory SQLite fixture: the existing status update is rejected without a review row; with a review row, the trigger plus the current handler's writes produce two credits and two payment-ledger entries. Migration 0024 therefore remains excluded until one authority is chosen and the handler, review UI/payload, transaction, and tests are updated together.

Migrations 0025 and 0027 also introduce trigger-owned adjustment/refund records that current mainline handlers do not write. Migration 0028 performs cleanup deletes, and migrations 0035 and 0040 rebuild tables. Each requires separate application/data reconciliation and production-shaped preservation tests before inclusion.
