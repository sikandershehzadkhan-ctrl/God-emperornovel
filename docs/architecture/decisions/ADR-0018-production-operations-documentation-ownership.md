# ADR-0018: Production Operations Documentation Ownership

- **Status:** Accepted for repository governance
- **Date:** 2026-11-20
- **Decision owners:** Database and production operations; platform architecture and release

## Context

Production D1 audit procedures, migration release plans, backup/restore evidence, and operational risk registers need a clear owner distinct from general product reference documentation. These records describe sensitive controls and must not be mistaken for executable runtime policy or deployment authorization.

## Decision

Assign `docs/production/` to the `production-operations-documentation` owner. This owner is accountable for read-only D1 audit procedures, canonical migration risk/release plans, and backup, restore, rehearsal, and release evidence.

Changes to production operational documentation require an ADR or feature contract under the repository ownership policy. Operational documents do not authorize D1 mutation, migration execution, secret changes, or Worker deployment.

## Consequences

- Production operational documents have a dedicated, enforceable ownership boundary.
- Read-only audit evidence remains separate from runtime code, migration execution, and release authorization.
- A production migration release remains blocked until the actual remote D1 state is inspected and reconciled.

## Verification

The migration-governance workflow validates complete tracked-path ownership, required ADR coverage, and dependency direction.
