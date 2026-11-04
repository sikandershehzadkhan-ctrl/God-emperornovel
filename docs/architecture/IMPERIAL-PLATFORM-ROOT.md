# Imperial Novel Platform Architecture Root

**Status:** Canonical architecture entry point  
**Applies to:** Every feature, service, route, migration, UI surface, workflow and integration  
**Rule:** This file is the root index. Detailed registries linked below remain the source of truth for their own domains.

## 1. Architecture tree

```text
Imperial Novel
├── 00-platform-governance
│   ├── this root map
│   ├── feature-boundary-and-integration-policy
│   ├── feature ownership map
│   ├── feature change contract template
│   └── collision register
├── 01-experience
│   ├── homepage and discovery
│   ├── catalog, genres, tags and search
│   ├── novel detail and reader
│   ├── library, history and reading progress
│   ├── community and profiles
│   └── localization and accessibility
├── 02-creator
│   ├── Author Studio
│   ├── publishing and scheduling
│   ├── revisions and rights
│   └── creator analytics
├── 03-platform-services
│   ├── identity, sessions and account lifecycle
│   ├── authorization and ownership
│   ├── notifications and email
│   ├── search, ranking and recommendations
│   ├── media and storage
│   └── AI orchestration and provider adapters
├── 04-commerce
│   ├── tickets and ledger
│   ├── payments and reconciliation
│   ├── donations
│   ├── advertising
│   └── creator earnings
├── 05-operations
│   ├── Admin and moderation
│   ├── security and privacy
│   ├── observability and incident response
│   └── deployment and disaster recovery
└── 06-external-integrations
    ├── OmniPortal and licensed connectors
    ├── translation providers
    └── third-party APIs
```

This is the logical product tree. It does not claim that every logical domain has already been extracted into a separate source directory. The current Worker and browser application contain legacy shared entry points; those are compatibility shells until a separately tested extraction is approved.

## 2. Canonical source-of-truth registry

| Concern | Canonical authority |
|---|---|
| Platform architecture and navigation | `docs/architecture/IMPERIAL-PLATFORM-ROOT.md` |
| Feature ownership and allowed paths | `docs/architecture/FEATURE-OWNERSHIP-MAP.json` |
| Feature change contract | `docs/architecture/FEATURE-CHANGE-CONTRACT.template.json` |
| Integration and collision rules | `docs/architecture/FEATURE-BOUNDARY-AND-INTEGRATION-POLICY.md` |
| Route identity, shell, renderer and indexing | `docs/architecture/IMPERIAL-ROUTE-REGISTRY-01N.json` |
| API route and method inventory | `docs/architecture/IMPERIAL-API-ROUTE-METHOD-MATRIX-01N-37.json` |
| Authorization and data ownership review | `docs/architecture/IMPERIAL-AUTHORIZATION-OWNERSHIP-MATRIX-01N-38.json` |
| D1 migration allocation and semantic conflicts | `docs/architecture/CANONICAL-MIGRATION-COLLISION-REGISTER.md` |
| Executable regression gates | `package.json` build script and `scripts/test-*.mjs` |
| Deployment safety | `.github/workflows/` and deployment gate tests |

A registry is authoritative only for its stated scope. A route registry is not proof of authorization; an authorization matrix is not proof of runtime isolation; a migration register is not permission to execute a production migration.

## 3. Source layout policy

New feature code belongs under `src/features/<feature-id>/`. Shared platform capabilities belong under `src/platform/<capability-id>/`. Browser feature code belongs under `public/features/<feature-id>/`. Shared browser infrastructure belongs under `public/platform/`.

Each extracted feature must provide:
- `FEATURE-CONTRACT.json`: stable ID, owner, entry point, dependencies, routes, data entities, migrations, events, tests and rollback plan.
- `index.mjs` or another explicitly declared entry point.
- Tests colocated in the feature or registered in the root build.
- No direct imports from another feature's private implementation.

Existing `src/index.js`, `public/app.js`, versioned served bundles and current migration files are protected shared surfaces. They remain in place until extraction is proven equivalent. Do not create a second router, second session authority, second ledger, second ownership model, or parallel schema for an existing concept.

## 4. Integration lifecycle

`Idea → domain owner → feature contract → dependency review → collision scan → implementation branch → isolated tests → integration branch → full CI → human review → merge → staged verification → production release`

A feature is not integrated merely because its files compile. Its routes, permissions, data ownership, schema, UI boot lifecycle, localization, indexing, observability and rollback effects must be reviewed where applicable.

## 5. Non-negotiable invariants

1. One canonical owner per domain and one canonical source of truth per entity.
2. No duplicate route, route alias, API method, session authority, ledger, or database concept without an explicit compatibility decision.
3. Migrations are append-only, globally numbered, collision-checked and semantically reviewed. Never renumber or rewrite an applied migration.
4. Every user-owned row is scoped to the authenticated owner in the query/update predicate, not only in the UI.
5. Every write route declares method, authentication, role, ownership, CSRF/idempotency and audit expectations.
6. Client and served assets must remain byte-identical when both are shipped representations of the same release.
7. SSR and client boot must have one explicit handoff. Neither may erase, duplicate or re-own the other's shell.
8. Route, API, authorization, SEO, migration and feature contracts change in the same pull request as the affected behavior.
9. CI must fail closed on missing contracts, duplicate identifiers, stale fingerprints and unregistered migrations.
10. No production deployment or D1 migration is implied by source validation.

## 6. Change control

Before modifying a shared surface, identify its owner in `FEATURE-OWNERSHIP-MAP.json`, list every dependent feature, update the relevant registries and tests, and document any intentional compatibility behavior. If two features need the same shared surface, integrate through the owner-approved contract rather than editing in parallel.

See `FEATURE-BOUNDARY-AND-INTEGRATION-POLICY.md` for the mandatory checklist and collision protocol.
