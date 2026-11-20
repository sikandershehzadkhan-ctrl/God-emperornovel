# ADR-0018: Production Operations Documentation Ownership

**Status:** Accepted for repository governance
**Date:** 2026-11-20
**Decision owners:** Database and production operations owner; platform architecture and release owner

## Context

Imperial Novel's production D1 audit procedures, migration release plans, backup and restore evidence, and operational risk registers need a clear owner distinct from general product reference documentation. These records describe sensitive production controls and must not be mistaken for executable runtime policy or deployment authorization.

The current ownership registry rejects every tracked path without exactly one declared owner. The read-only D1 audit foundation therefore cannot be integrated safely until `docs/production/` has an explicit owner.

## Decision

1. Assign the complete `docs/production/` path to the `production-operations-documentation` owner in the canonical shared-surface ownership registry.
2. The owner is accountable for read-only D1 audit procedures, canonical migration risk/release plans, and backup, restore, rehearsal, and release evidence records.
3. Changes to production operational documentation remain subject to the repository's ADR and ownership governance.
4. Production documentation is descriptive evidence and operational guidance only. It does not authorize a D1 mutation, migration execution, secret change, or Worker deployment.
5. Remote audit workflows must require explicit manual confirmation and use read-only queries for inventory collection.

## Consequences

- Production operational documents have a dedicated, enforceable ownership boundary.
- The fail-closed ownership validator can classify the new D1 audit runbook and SQL inventory without broadening a generic documentation catch-all.
- Operational evidence remains separate from runtime code, migration execution, and release authorization.

## Verification

The migration-governance workflow validates complete tracked-path ownership, required ADR coverage, and dependency direction. The production D1 audit SQL also has a build-gated check requiring each executable statement to be SELECT-only and rejecting common mutation/control keywords.

## Explicit non-goals

This ownership decision does not establish the live production schema, prove which migrations have been applied, create a migration ledger, or establish backup restorability. Those claims require separately collected production evidence and a rehearsed recovery procedure. The read-only audit workflow is deliberately manual and must not be treated as a deployment prerequisite that performs writes.
