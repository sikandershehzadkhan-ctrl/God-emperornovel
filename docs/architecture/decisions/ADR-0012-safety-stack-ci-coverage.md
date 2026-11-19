# ADR-0012: CI coverage for safety and production PR stacks

- Status: Proposed
- Date: 2026-11-19
- Decision owners: Imperial Novel maintainers

## Context

Migration and production-safety work is developed in stacked pull requests. The validation workflows previously filtered pull-request base branches to a narrow set of names, which excluded branches under the `safety/**` and `production/**` namespaces. As a result, a safety change could receive partial graph checks without the full Cloudflare source validation and migration-governance checks.

## Decision

1. Treat `safety/**` and `production/**` as first-class validation targets.
2. Run Cloudflare source validation for pull requests targeting those namespaces.
3. Run the same source validation on relevant pushes to those namespaces, retaining the workflow's path filters.
4. Run migration governance for pull requests targeting architecture, integration, safety, and production namespaces.
5. Keep validation non-deploying and read-only with respect to production systems.

## Consequences

- Safety and production PR stacks receive the same source and migration governance checks as the established architecture and integration stacks.
- New branch namespaces must be added explicitly to workflow filters and reviewed through this ADR process.
- Workflow checks remain validation only. They do not authorize production D1 mutations or Worker deployment.
