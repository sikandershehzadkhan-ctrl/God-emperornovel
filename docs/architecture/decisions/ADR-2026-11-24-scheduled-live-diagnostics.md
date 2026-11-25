# ADR: Scheduled live diagnostics

- Status: Proposed
- Date: 2026-11-24
- Decision owner: Repository owner and platform architecture maintainer

## Context

The repository's fail-closed ownership governance requires shared-surface changes to include an architecture decision record in the same pull request.

## Decision

Schedule the existing live-asset diagnostics workflow every six hours while retaining its existing triggers. This is repository automation only; it adds no provider, secret, dependency, production configuration, or database change. Workflow execution and production monitoring claims remain subject to observed run evidence.

## Consequences

- Keep the change within its existing documented ownership boundary.
- Do not interpret configuration or discovery documentation as evidence of a live production capability.
- No production deployment or database mutation is authorized by this decision.
