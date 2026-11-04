# ADR-0011: Immutable Migration Number Reservations

**Status:** Proposed  
**Date:** 2026-11-04  
**Decision owners:** Database governance and platform architecture

## Context

Checking all currently open pull requests for duplicate migration numbers is useful feedback, but it is not a race-free allocator: two pull requests can be opened or checked before either is visible to the other. GitHub merge ordering and a shared reservation artifact provide a durable serialization point.

## Decision

1. Every new migration number must first be reserved by adding `migrations/.reservations/NNNN.json`.
2. A reservation records its number and the exact canonical migration filename it authorizes.
3. Reservation files are immutable and cannot be deleted. A migration must match its reservation exactly.
4. New reservations must allocate a number greater than every existing migration and reservation number.
5. A reservation may be merged before its SQL migration is ready. This deliberately separates allocation from implementation.
6. Concurrent attempts to reserve the same number contend for the same Git path. After one reservation lands, the other cannot silently overwrite it; the immutable-history check rejects modification or deletion.
7. The open-PR collision scan remains an early warning, while the committed reservation file is the durable source of truth.

## Consequences

Migration numbering is no longer decided independently by each feature branch. Authors reserve first, then implement against the committed allocation. This avoids relying on timing-sensitive PR discovery as the only collision defense.

## Verification

CI tests duplicate reservation attempts, invalid reservation filenames, mismatched migration paths, reservation modification/deletion, missing reservations for new migrations, and valid forward reservations/migrations. No production migration is executed by this governance check.
