# ADR-0008: Initial ownership for shared platform surfaces

- **Status:** Proposed
- **Date:** 2026-11-04
- **Decision owners:** Platform architecture and repository maintainer

## Context

The Worker entry point, browser application, build manifests, migration directory, Wrangler configuration and GitHub workflows are high-collision surfaces. Parallel branches can overwrite one another even when each branch passes its own tests.

## Decision

Maintain a machine-readable initial ownership map at `docs/architecture/SHARED-SURFACE-OWNERSHIP.json`. Each listed path has exactly one owner. The initial map deliberately covers only the highest-risk shared surfaces; it is not yet a complete owner map for every repository file.

Changes to a listed shared surface must include an ADR or feature contract in the same pull request. The ownership validator rejects duplicate or overlapping ownership roots and verifies that changed protected paths resolve to one owner.

## Consequences

- Shared-file changes become visible and attributable during review.
- The registry can expand incrementally as domain modules and route contracts are reconciled.
- This check does not replace code review, route authorization tests, or GitHub branch protection.
