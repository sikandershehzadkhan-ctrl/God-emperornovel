# ADR-0019: Validate Stacked Architecture and Integration Pull Requests

- **Status:** Proposed
- **Date:** 2026-11-19
- **Decision owners:** Repository CI and architecture governance

## Context

Imperial Novel uses stacked pull requests for architecture and integration work. The Cloudflare Source Validation and Migration Governance workflows previously restricted their `pull_request.branches` filters to `main` (plus one governance-maintenance branch for migration governance).

Those filters select the pull request's **base branch**, not its head branch. Consequently, a draft PR targeting an `architecture/**` or `integration/**` branch could receive Graphify while missing the Cloudflare build/source checks and migration/ownership governance checks. A successful check on an ancestor or sibling commit is not evidence for the current PR head.

## Decision

Run both Cloudflare Source Validation and Migration Governance for pull requests whose base branch is:

- `main`
- `architecture/**`
- `integration/**`

Preserve the existing dedicated migration-governance maintenance branch trigger and the existing push/workflow-dispatch behavior.

## Validation and release boundaries

- Every stacked PR must be evaluated at its exact head SHA.
- A workflow result from another commit, parent PR, or earlier revision does not certify the current head.
- Source validation and migration governance are independent gates; both must pass where applicable.
- This decision does not authorize merging a draft, bypassing a conflict, applying migrations to production, or deploying a Worker.
- Production D1 changes still require the separate reviewed backup, preflight, apply, and postflight controls.

## Consequences

- Future and updated stacked architecture/integration PRs receive the same core validation gates as PRs targeting `main`.
- Workflow runs become visible earlier in the integration sequence, reducing late discovery of source, migration, and ownership failures.
- Existing PRs are not retroactively certified; their heads must be updated or otherwise revalidated after this workflow change is integrated.
