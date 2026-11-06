# ADR-0001: Canonical platform composition and feature ownership

- **Status:** proposed for merge with the architecture governance foundation
- **Date:** 2026-11-04
- **Decision owners:** repository maintainers
- **Scope:** shared Worker composition, browser shell, build configuration, architecture registers

## Context

The repository has accumulated parallel feature branches that independently edit shared composition files, route and authorization inventories, migration namespaces, browser entry points and build scripts. A feature branch can therefore pass its own tests while becoming incompatible with another branch or with current main. Fixing only the immediate merge conflict does not prevent recurrence.

## Decision

1. `main` is the sole production integration root.
2. Every feature has exactly one domain owner recorded in `IMPERIAL-FEATURE-OWNERSHIP.json`.
3. Domain dependencies are declared in `IMPERIAL-DOMAIN-DEPENDENCIES.json` and must be acyclic.
4. D1 migrations use one globally allocated, append-only sequence recorded in `IMPERIAL-MIGRATION-ALLOCATIONS.json`.
5. Shared composition files are integration surfaces. Any PR changing them must include an ADR, update affected registries and tests, and pass full CI.
6. PR CI validates changed-path ownership and rejects unregistered paths.
7. A feature is ported onto the current integration root by semantic change, never by wholesale replacement of shared files.
8. Feature CI may validate migrations against disposable SQLite fixtures, but never executes production D1 migrations or deploys the Worker.

## Shared surfaces included in this decision

- `src/index.js`: Worker composition and legacy route dispatcher.
- `src/homepage-ssr.mjs`: server-rendered homepage composition.
- `public/app.js`, `public/app-*.js`, `public/index.html`: browser composition and served entry points.
- `package.json`, `package-lock.json`, `wrangler.toml`: build/runtime authority.
- Route, API-method and authorization/ownership registers.
- CI and deployment workflows.

## Consequences

The architecture validator becomes a required PR check after this governance change is merged to main. New source roots must be registered before merge. Shared changes need an explicit ADR and same-PR regression coverage. The validator is a prevention mechanism, not a claim that static checks prove all runtime behavior or eliminate every possible defect.

## Rollout

- Phase 1: merge governance contracts and validator after all checks pass.
- Phase 2: require the governance check for all feature PRs.
- Phase 3: migrate legacy composition code into domain modules incrementally, one domain per PR, preserving public contracts.
- Phase 4: progressively replace legacy path ownership with the target tree; do not bulk-move the repository.
