# ADR-0011: Immutable Migration Number Reservations

**Status:** Proposed  
**Date:** 2026-11-04  
**Decision owners:** Database governance and platform architecture

## Context

Checking all currently open pull requests for duplicate migration numbers is useful feedback, but it is not a race-free allocator: two pull requests can be opened or checked before either is visible to the other. A committed reservation artifact provides a durable serialization point.

## Decision

1. Every new migration number is reserved by adding `migrations/.reservations/NNNN.json` in the same pull request as its SQL migration.
2. A reservation records schema version, number, exact canonical migration filename, and the creating pull request number.
3. The reservation and SQL migration must be introduced together. Reservation-only PRs and migrations consuming reservations created by earlier PRs are rejected.
4. Reservation files are immutable and cannot be deleted. A migration must match its reservation exactly, including the creating PR number.
5. New reservations must allocate a number greater than every existing migration and reservation number.
6. Concurrent attempts to reserve the same number contend for the same Git path. After one lands, the other cannot silently overwrite it; the immutable-history check rejects modification or deletion.
7. The open-PR collision scan remains an early-warning check, while the committed reservation file is the durable source of truth.

## Consequences

Migration numbering is allocated atomically with the migration change. Two independently developed PRs cannot both introduce the same reservation into the canonical branch without one encountering an immutable reservation conflict. The migration guard does not execute SQL or authorize production changes.

## Verification

CI tests duplicate reservations, invalid reservation filenames, mismatched migration paths, wrong PR binding, reservation-only changes, reservation modification/deletion, missing reservations for new migrations, and valid same-PR forward allocations.
