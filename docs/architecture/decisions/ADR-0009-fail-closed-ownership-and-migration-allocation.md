# ADR-0009: Fail-Closed Path Ownership and Cross-PR Migration Allocation

**Status:** Proposed  
**Date:** 2026-11-04  
**Decision owners:** Platform architecture and database governance

## Context

The initial governance validators had two gaps. Changed paths with no registered owner were ignored, and migration-number uniqueness was checked only inside each PR against its own base tree. Independent PRs could therefore pass while allocating the same next migration number.

## Decision

1. Every changed path in a governed pull request must resolve to exactly one path owner. Zero owners and multiple owners both fail closed.
2. The ownership registry must explicitly assign every path introduced by a governance PR before the validator is run.
3. Migration governance must inspect all open pull requests targeting main and reject a proposed migration number if another open PR independently proposes that number.
4. The cross-PR check uses a read-only GitHub token with pull-requests: read; API failures, missing event context, and incomplete pagination fail closed.
5. Unit fixtures must prove same-number allocations across separate PRs fail and distinct numbers pass.

## Consequences

New files require an owner registration before integration. Concurrent migration proposals are serialized by requiring one to integrate and the other to rebase/reallocate. No migration is executed by these checks. Production database changes remain subject to the separate backup, approval, preflight and recovery policy.

## Verification

The migration governance workflow runs ownership, migration immutability and cross-PR allocation fixtures, then executes all three checks for pull requests.
