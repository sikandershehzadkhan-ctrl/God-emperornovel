# ADR: Assign D1 recovery runbook to documentation ownership

- Status: Proposed
- Date: 2026-11-24
- Decision owner: Repository owner and platform architecture maintainer

## Context

The D1 backup and recovery runbook is operational reference documentation. The repository's fail-closed ownership governance requires every tracked path to have exactly one registered owner. The initial runbook change exposed that its new path was not listed in the canonical ownership registry.

## Decision

Register `docs/D1-BACKUP-AND-RECOVERY-RUNBOOK.md` as an exact path under the existing `documentation-reference` owner. Keep it as documentation only: it must not be imported by runtime code, used as executable build policy, or contain database exports, credentials, or private user data.

## Consequences

- The runbook remains under the existing documentation ownership and review responsibility.
- The canonical registry remains the single source of truth for path ownership.
- No runtime code, D1 schema, production database, Worker configuration, or deployment behavior changes.
- The ownership governance check must pass before this documentation change can be considered integrated.
