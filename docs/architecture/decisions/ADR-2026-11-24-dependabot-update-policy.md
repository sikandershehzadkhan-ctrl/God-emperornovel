# ADR: Dependabot update policy

- Status: Proposed
- Date: 2026-11-24
- Decision owner: Repository owner and platform architecture maintainer

## Context

The repository's fail-closed ownership governance requires shared-surface changes to include an architecture decision record in the same pull request.

## Decision

Configure weekly Dependabot update proposals for npm and GitHub Actions with a bounded pull-request limit. This does not itself enable repository security alerts or code scanning, and it does not modify dependency versions or lockfiles. Updates remain subject to review and CI.

## Consequences

- Keep the change within its existing documented ownership boundary.
- Do not interpret configuration or discovery documentation as evidence of a live production capability.
- No production deployment or database mutation is authorized by this decision.
