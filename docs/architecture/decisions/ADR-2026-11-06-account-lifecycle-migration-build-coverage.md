# ADR: Enforce account lifecycle migration regressions in the canonical build

- **Date:** 2026-11-06
- **Status:** Proposed, pending PR review
- **Decision owner:** platform-architecture
- **Technical integrator:** platform-integrator
- **Related change:** PR #266, `fix/account-lifecycle-migration-build-coverage-17-83`

## Context

The canonical migration history includes consent-based novel ownership transfer and the account-closure review/disposition lifecycle. Dedicated SQLite migration regression scripts already exist for these constraints, but six of those scripts were not part of the mandatory `npm run build` chain. A test file that is not run by the required build is not an enforced regression guard.

The build-chain change touches the shared `package.json` surface. Repository governance therefore requires both an Architecture Decision Record and an updated platform integration feature contract in the same pull request.

## Decision

Register these existing tests in the canonical build after migration-sequence uniqueness validation:

1. `scripts/test-ownership-transfer-migration.mjs`
2. `scripts/test-account-deletion-migration.mjs`
3. `scripts/test-account-deletion-review-migration.mjs`
4. `scripts/test-account-deletion-disposition-migration.mjs`
5. `scripts/test-account-deletion-disposition-approval-migration.mjs`
6. `scripts/test-account-deletion-specialist-findings-migration.mjs`

The platform integration contract records the same tests as unit, integration, and build-command evidence.

## Scope and non-goals

This is validation wiring only. It does not add or alter migration SQL, Worker routes, authorization behavior, user interface, account-deletion operations, ownership-transfer operations, production deployment logic, or production D1 state. Passing these migration tests does not certify that the corresponding application workflows are implemented; their Worker/API integration remains a separate, explicitly tracked task.

## Consequences

- The mandatory build will fail if any of the six migration regression scripts fail.
- Shared-surface governance and platform-contract validation remain enforced rather than bypassed.
- Production deployment remains blocked by the existing fail-closed migration release gate until the separate resumable migration and recovery plan is approved and validated.

## Verification

Require the exact PR head to pass Architecture Governance, Integration Migration Governance, Route Registry, Runtime Schema Parity, Graphify, and Cloudflare Source Validation. Inspect the Cloudflare Source Validation log to confirm all six scripts execute and pass. No production D1 access or deployment is part of this decision.
