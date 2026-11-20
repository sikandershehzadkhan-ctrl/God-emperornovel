# ADR-0022: Mainline page-route registry baseline

- **Status:** Accepted for source-inventory baseline; full route-policy adoption remains in progress
- **Date:** 2026-11-20
- **Scope:** Worker HTML page-shell dispatch and sitemap endpoint inventory

## Context

The repository's Worker contains the authoritative page-shell dispatcher in `src/index.js`, but mainline did not contain a canonical manifest that could be compared against it. A prior route-registry branch contained a useful inventory, but its history was divergent and its source-audit metadata needed to be reconciled before reuse.

The mainline Worker source blob was inspected directly. The selected inventory was retained only after confirming that its audited source blob matches the current mainline `src/index.js` blob.

## Decision

1. Store the page-shell route inventory in `docs/architecture/IMPERIAL-ROUTE-REGISTRY-01N.json`.
2. Record the exact source branch, commit, and source blob used for the audit.
3. Validate the full exact route set and each route's shell against the Worker's exact dispatch map.
4. Validate the Worker noindex set, dynamic route samples, and sitemap endpoint inventory.
5. Run the route check as an explicit npm build prerequisite and through a focused GitHub Actions workflow.
6. State the evidence boundary explicitly: a shell mapping does not prove client renderer completeness, authentication, role authorization, resource ownership, locale/RTL behavior, canonical URL policy, live HTTP behavior, or production deployment.

## Consequences

The route inventory becomes reproducible and drift-detectable. Route changes that alter exact paths, shell assignments, noindex policy, or sitemap endpoints must update the manifest and pass the dedicated check.

This ADR does not authorize merging divergent route branches wholesale and does not certify the remaining route-policy dimensions. Those require separate source-backed reconciliation and tests.

## Safety

No runtime request handling, database schema/data, credentials, production secrets, or deployment settings are changed by this decision.
