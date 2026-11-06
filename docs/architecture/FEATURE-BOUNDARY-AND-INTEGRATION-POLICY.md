# Feature Boundary and Integration Policy

## Goal

Prevent recurring merge collisions, duplicate foundations, stale architecture maps, and cross-feature regressions by making ownership and integration explicit before implementation.

## Ownership model

- **Domain owner:** accountable for the behavior and data contract of a domain.
- **Platform owner:** owns cross-cutting infrastructure such as routing, sessions, authorization primitives, database access, event delivery and shared UI shell.
- **Feature contributor:** may implement only within the feature's declared paths and contract.
- **Integrator:** reconciles shared-surface changes, runs the collision scan and updates the canonical registries.

The canonical source of truth is `IMPERIAL-FEATURE-OWNERSHIP.json`, with `IMPERIAL-DOMAIN-DEPENDENCIES.json` and `IMPERIAL-MIGRATION-ALLOCATIONS.json` as its dependency and schema companions. `FEATURE-OWNERSHIP-MAP.json` is a subordinate feature-module placement guide only. If they conflict, `ARCHITECTURE.md` and the canonical registries win. A contributor cannot self-assign ownership of a shared platform surface by creating a branch.

## Path boundaries

1. New backend feature modules: `src/features/<feature-id>/`.
2. Shared backend services: `src/platform/<capability-id>/`.
3. New browser feature modules: `public/features/<feature-id>/`.
4. Shared browser infrastructure: `public/platform/`.
5. D1 schema changes: new globally numbered files only in `migrations/`.
6. Architecture contracts and registries: `docs/architecture/`.
7. Executable checks: `scripts/`, registered in the root build.
8. Workflows: `.github/workflows/`, changed only with an explanation of triggers, permissions, concurrency and failure behavior.

Legacy monolith files and versioned public bundles are shared integration surfaces, not feature-owned files. Changes to them require an impact declaration and owner review.

## Required feature contract

Copy `FEATURE-CHANGE-CONTRACT.template.json` into `docs/architecture/feature-contracts/<feature-id>.json`; its owner and path declarations must agree with the canonical registries. Use stable IDs and declare:
- one domain owner and one technical integrator;
- exact files/directories owned and shared files touched;
- dependencies and the direction of each dependency;
- routes, API methods, authentication, authorization and owner scoping;
- tables/entities, migration number proposal and data lifecycle;
- UI shell/SSR/client boot behavior and served asset parity;
- localization, accessibility, SEO and privacy impact;
- tests, CI gates, rollout, rollback and compatibility plan.

A field that does not apply must say why. Do not leave an ambiguous blank.

## Collision scan protocol

Before implementation and again before merge:
1. Compare the feature contract with the ownership map.
2. Compare changed paths against every active integration's changed paths.
3. Check duplicate route paths, API method ownership, event names, schema objects, migration numbers and public asset names.
4. Check whether the same concept already has a canonical table, endpoint, service or UI owner.
5. Check source fingerprints for route and authorization registries.
6. Check all consumers of changed contracts, including mobile/browser bundles and scheduled jobs.
7. Record conflicts and their resolution in the collision register. If unresolved, stop integration; do not hide the conflict with renaming or stale snapshots.

## Database rules

- Migration numbers are globally allocated from the current canonical sequence.
- Never reuse, renumber, edit or delete an applied migration.
- A feature branch may propose a migration number but may not assume it owns that number until the integrator checks the current mainline.
- A migration must be idempotent where feasible, preserve existing data, include rollback/forward-repair notes, and have a D1 test or a clearly stated reason a test is unavailable.
- Semantically duplicate tables/columns must be reconciled into the canonical entity, not created as parallel ledgers.
- Runtime-created tables must be represented in the production audit inventory.

## API and data rules

- Every endpoint declares exact path, methods, authentication, role, ownership rule, CSRF behavior for writes, rate/size bounds and error contract.
- Unsupported methods return 405.
- User-specific queries must scope by the authenticated user ID in SQL.
- Admin access is not implicitly equivalent to specialist, finance, privacy or security approval.
- Read-only route inventories and authorization review matrices remain separate.

## Frontend and rendering rules

- One canonical route registry; aliases point to canonical routes.
- One owner for global navigation, app boot, theme state and localization state.
- SSR output must survive initial hydration/boot. Client code must explicitly hydrate or replace a declared region, never clear the whole root blindly.
- Source and served bundles must be byte-identical when they are intended to be the same release artifact.
- Shared CSS tokens and themes have one foundation; feature styles are namespaced and must not reset global tokens.
- Each new UI route includes loading, empty, error, permission-denied and mobile states.

## Pull request and merge rules

- One feature concern per PR where practical. Cross-domain integration PRs must declare all affected owners.
- PR title uses `feat(<domain>):`, `fix(<domain>):`, `test(<domain>):` or `docs(architecture):`.
- PR description lists contract path, shared surfaces, migration proposal, tests, risks, rollback and known exclusions.
- Do not merge a draft, a failing check, a stale source fingerprint, an unresolved collision or an unreviewed destructive migration.
- Do not repeatedly close/reopen PRs to force CI. Fix the source of the check and let the normal PR event run.
- Merge only after the exact head SHA has passed required workflows and the diff is reviewed.
- Deployments and D1 migrations remain separate, explicitly authorized operations.

## Future feature acceptance checklist

- [ ] Feature ID and owner exist in the ownership map.
- [ ] Feature contract exists and is complete.
- [ ] No duplicate route, API, table, event, ledger or global UI owner.
- [ ] Shared surfaces have written owner approval.
- [ ] Dependencies point inward to stable platform contracts, not sideways into private feature code.
- [ ] Migration allocation is confirmed against mainline.
- [ ] Route, API, authorization and SEO registries are updated where applicable.
- [ ] Regression and isolation tests are registered in CI.
- [ ] Browser source/served bundle parity is preserved.
- [ ] Rollback and data compatibility are documented.
- [ ] Exact PR head passes all required checks.
