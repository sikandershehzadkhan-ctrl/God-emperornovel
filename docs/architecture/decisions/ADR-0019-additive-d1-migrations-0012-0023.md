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
