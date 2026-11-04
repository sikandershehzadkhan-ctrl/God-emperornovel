# Imperial Novel Architecture Root

**Status:** governing architecture contract  
**Effective:** 2026-11-04  
**Applies to:** every feature branch, pull request, migration, API, UI surface, scheduled job and production change.

## 1. One canonical root

`main` is the only production integration root. Feature branches are temporary workspaces, never alternate sources of truth. Integration branches may aggregate work, but must be rebased or reconciled against current `main` before review. Never merge an old feature branch wholesale when it contains a stale copy of shared files.

The canonical dependency direction is:

```text
Experience surfaces (web, reader, author studio, admin, community)
                         |
                         v
Application capabilities (catalog, identity, publishing, payments, rights)
                         |
                         v
Domain contracts (API schemas, permissions, events, data ownership)
                         |
                         v
Platform kernel (routing, auth/session, errors, observability, config)
                         |
                         v
Persistence adapters (D1 repositories, object storage, queues)
                         |
                         v
Infrastructure (Cloudflare Worker, D1, R2, Pages/assets, CI)
```

Dependencies point downward only. A lower layer must never import a higher layer. Cross-domain calls go through a declared contract, not another feature's private implementation.

## 2. Canonical repository tree

This is the target ownership tree. Existing legacy files may remain where they are until deliberately migrated; their ownership is still defined here. Do not mass-move files merely to make the tree look tidy.

```text
/
├── ARCHITECTURE.md                         # this root contract
├── package.json / package-lock.json        # build and dependency authority
├── wrangler.toml                           # Cloudflare runtime authority
├── src/
│   ├── platform/                           # kernel, routing, auth, config, errors
│   ├── domains/
│   │   ├── identity/                       # accounts, profiles, roles, sessions
│   │   ├── catalog/                        # novels, genres, tags, search
│   │   ├── publishing/                     # novels, chapters, revisions, schedules
│   │   ├── reader/                         # progress, bookmarks, history
│   │   ├── community/                      # discussions, comments, reports
│   │   ├── creator/                        # Author Studio, applications, analytics
│   │   ├── rights/                         # licensing, attribution, takedowns
│   │   ├── payments/                       # tickets, ledger, donations, payouts
│   │   ├── discovery/                      # ranking, recommendations, trends
│   │   ├── media/                          # covers, comics, uploads, processing
│   │   ├── ai/                             # AI capabilities, provider boundaries
│   │   └── administration/                 # admin-only operations and audit
│   ├── contracts/                          # versioned cross-domain contracts
│   ├── adapters/                           # D1, R2, queues, external services
│   └── index.js                            # legacy Worker composition root
├── public/
│   ├── styles/                             # design tokens and styles (target)
│   ├── assets/                             # static assets (target)
│   ├── app.js                              # legacy browser composition root
│   └── app-*.js                            # generated/served release bundles
├── migrations/                             # one global, append-only D1 sequence
├── scripts/
│   ├── architecture/                       # architecture governance validators
│   └── test-*.mjs                          # regression and build gates
├── docs/
│   ├── architecture/
│   │   ├── decisions/                      # ADRs for shared/kernel changes
│   │   ├── contracts/                      # API/event/data contracts
│   │   └── registers/                      # ownership, route, migration registers
│   ├── security/
│   └── operations/
└── .github/workflows/                      # one CI/deployment policy
```

**Important:** this is an ownership map and destination architecture, not a claim that every legacy directory has already been physically moved. New code should use the target domain layout where compatible. Legacy composition roots remain shared and protected until modularization is separately tested.

## 3. Single ownership rule

Every source path, API route, database table, event, queue, scheduled task and user-facing route has exactly one owning domain. Consumers may use its public contract; they may not duplicate its storage or private logic.

The machine-readable owner and dependency registers are:
- `docs/architecture/IMPERIAL-FEATURE-OWNERSHIP.json`
- `docs/architecture/IMPERIAL-DOMAIN-DEPENDENCIES.json`
- `docs/architecture/IMPERIAL-MIGRATION-ALLOCATIONS.json`

The route, method and authorization registers remain authoritative companions:
- `IMPERIAL-ROUTE-REGISTRY-01N.json`
- `IMPERIAL-API-ROUTE-METHOD-MATRIX-01N-37.json`
- `IMPERIAL-AUTHORIZATION-OWNERSHIP-MATRIX-01N-38.json`

A register is not proof of runtime correctness. Tests must verify implementation against it.

## 4. Shared kernel change protocol

These files are shared integration surfaces, not feature-owned scratchpads: `src/index.js`, `public/app.js`, `public/index.html`, `package.json`, `package-lock.json`, `wrangler.toml`, route/method/auth registers, and CI/deployment workflows.

A feature may change a shared surface only when its PR:
1. identifies the exact shared contract being changed;
2. includes an Architecture Decision Record under `docs/architecture/decisions/`;
3. updates affected registries and tests in the same PR;
4. preserves unrelated code using a minimal, reviewed change;
5. passes the full source, route, authorization, migration and architecture gates.

Never replace a shared file with a branch snapshot merely to bring in a feature. Port the smallest domain-owned change and reconcile against current `main`.

## 5. Database and migration rules

- One global numeric migration sequence. Never restart numbering in a feature branch.
- A migration number is reserved in the allocation register before authoring SQL.
- A migration is immutable after it reaches a shared branch. Corrections use a new forward migration.
- One canonical table per business concept. Do not create parallel ledgers or duplicate request tables.
- Each table has one owning domain and declared read/write consumers.
- Every migration must pass fresh-install replay, supported upgrade fixtures, foreign-key checks and SQLite integrity checks.
- Migration files are never run against production by CI or by an integration PR.
- No production migration/deployment without an explicit release approval and verified backup/rollback plan.

## 6. API, identity and authorization rules

- Every API route declares owner, methods, authentication, role/permission, resource-owner predicate, input schema, rate limit and audit behavior.
- Default deny. Unsupported methods return 405. Unknown routes return 404.
- User identity and ownership are derived from the authenticated session, never trusted from request bodies.
- Admin authority is explicit and server-side. Feature ownership does not grant admin access.
- Cross-domain APIs call contracts, not SQL against another domain's private tables.
- Public projections must explicitly exclude private fields and unauthorized/unlicensed content.

## 7. Feature delivery contract

Every feature PR must include:
- owning domain and maintainer;
- problem statement and acceptance criteria;
- changed paths and public contracts;
- dependencies and downstream consumers;
- migration allocation (or explicit `none`);
- API/route/permission changes (or explicit `none`);
- tests, observability and rollback strategy;
- accessibility, localization, performance and rights/privacy impact where relevant.

No feature is complete because it compiles. It is complete when its contract, tests, security boundaries, migration path, UI behavior and operational rollback are all verified.

## 8. Merge gates

Required gates: source validation, architecture governance, dependency DAG, route registry, API method inventory, authorization/ownership, migration sequence/replay, security regression, design/SSR regression and Cloudflare dry-run. A green check on an unrelated or older commit does not validate the current PR head.

No auto-merge. No deployment from feature branches. No production schema changes from feature CI.

## 9. Collision prevention response

If a collision is detected: stop integration, preserve both source histories, identify canonical owner, compare semantics (not filenames alone), create a reconciliation ADR, port the smallest safe change, add a regression test, update registers, rerun gates on the exact head. Never resolve a collision by silently overwriting a file or renumbering an applied migration.

## 10. Honest status

This contract becomes effective only after its governance validator and CI workflow are merged to `main`. Until then it is a draft integration control. It cannot guarantee zero future defects; it makes ownership conflicts detectable before merge and makes exceptions explicit and reviewable.
