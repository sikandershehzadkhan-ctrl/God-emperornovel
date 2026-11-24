# ADR: Free-for-dev register ownership

- Status: Proposed
- Date: 2026-11-24
- Decision owner: Repository owner and platform architecture maintainer

## Context

The repository's fail-closed ownership governance requires shared-surface changes to include an architecture decision record in the same pull request.

## Decision

The free-for-dev integration register is reference documentation only. Register its exact path under the existing documentation-reference owner. The list is discovery material, not approval to add providers, dependencies, secrets, or production integrations.

## Consequences

- Keep the change within its existing documented ownership boundary.
- Do not interpret configuration or discovery documentation as evidence of a live production capability.
- No production deployment or database mutation is authorized by this decision.
