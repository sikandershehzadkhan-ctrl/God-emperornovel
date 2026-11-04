# Governance Enforcement Runbook

**Status:** Proposed operating contract; not a claim that repository settings are already enforced.
**Canonical integration branch:** `main`
**Owner:** Repository owner

This runbook converts the governance closure register into repeatable rules for every future feature. It is intentionally conservative: when ownership, schema lineage, permissions, or release evidence is unclear, the change is blocked rather than guessed.

## 1. Source-of-truth hierarchy

1. `main` is the only canonical integration source.
2. A pull request is a proposal until merged. A passing workflow on a feature branch does not make that branch canonical.
3. The canonical route registry, authorization policy, design tokens, API contracts, migration ledger, and build scripts must each have one declared path and one maintainer.
4. Generated or versioned browser bundles are derived artifacts. Update them only from their canonical source in the same change and verify byte parity where the project requires it.
5. Production state is a separate authority. Repository files and CI cannot prove that Cloudflare Worker, D1, secrets, DNS, or account settings match the repository.

## 2. Required change contract

Every pull request must state:

- **Concern:** one coherent feature or corrective concern.
- **Owner:** one accountable maintainer for the changed contract.
- **Canonical paths:** exact source, test, migration, workflow, and generated paths touched.
- **Dependencies:** prerequisite PRs or contracts, with explicit base SHA.
- **Compatibility:** routes, API payloads, roles, data shape, localization, and existing client behavior affected.
- **Data impact:** none, additive, backfill, destructive, or unknown. Unknown is blocked.
- **Security impact:** identity, authorization, privacy, rights, payments, secrets, external fetches, and rate limits.
- **Validation:** commands and exact commit SHA for each required check.
- **Release boundary:** whether production deployment or D1 mutation is explicitly excluded.

A PR that mixes unrelated concerns must be split before integration unless splitting would make the change unsafe.

## 3. Shared-surface ownership

| Surface | Required owner | Integration rule |
|---|---|---|
| `src/index.js` Worker entry | Backend/runtime owner | One integration at a time; inspect cumulative route, middleware, schema-bootstrap and CSP diff |
| `package.json` scripts | Build/CI owner | Reconcile the entire script, never append independently to a shared command string |
| `.github/workflows/**` | CI/release owner | Compose steps cumulatively; check permissions, triggers, concurrency, names and required coverage |
| `migrations/**` | Database owner | Reserve one immutable migration number on the current canonical base before authoring |
| Route registry and authorization matrix | Architecture/security owners | Route identity and access policy change together; duplicate or unregistered routes fail |
| `public/app*.js` and other generated bundles | Frontend/build owner | Regenerate from canonical source; do not hand-edit or merge stale generated bundles |
| CSP, auth, payment, rights, export, admin | Security owner | Security-sensitive review plus negative tests is mandatory |

If two open PRs own the same shared path, they are serialized. The second PR must be rebased or ported after the first integration and revalidated on the new cumulative head.

## 4. Migration reservation and collision protocol

1. Read the complete migration directory on the current `main` SHA.
2. Read all open migration-bearing PRs and compare their proposed numbers and schema objects.
3. Reserve the next number in a dedicated migration-allocation record or issue before creating the file.
4. A reservation is not authorization to run the migration.
5. Never rename a conflicting migration mechanically. Reconcile dependencies, SQL semantics, runtime bootstrap, deployment preflight, fixtures and rollback behavior.
6. Migrations are immutable after merge. Corrections use a new forward migration.
7. CI must fail on duplicate numbers, duplicate object creation, missing migration registration, non-monotonic ordering, and runtime-bootstrap parity drift.
8. Run fresh-install and upgrade replay against disposable fixtures. Verify foreign keys, indexes, constraints, data preservation and idempotency.
9. Production D1 changes require a separately approved operation, verified backup, restore rehearsal, preflight, explicit owner authorization and post-change verification. A green CI run is not approval.

## 5. Route and authorization contract

- Each public route has one canonical route identity and one registry entry.
- Every protected route declares its authentication requirement, role/ownership predicate, resource visibility rule, and response projection.
- Authorization is enforced server-side; hiding a control in the UI is not access control.
- User-owned resources must be scoped to the authenticated principal in the query or mutation itself.
- Reader-facing APIs use explicit response allowlists and publication/rights eligibility checks.
- Negative tests cover anonymous access, wrong owner, wrong role, cross-account identifiers, unpublished resources, malformed identifiers and invalid state transitions.
- Route additions or changes must update route registry, authorization matrix, sitemap/robots policy where relevant, and route tests in one coherent PR.

## 6. CI and branch integration sequence

For each candidate:

1. Confirm the PR base is current `main`; record base and head SHAs.
2. Inspect changed paths and compare them with every open PR touching those paths.
3. Verify migration numbers and schema-object ownership before resolving conflicts.
4. Integrate only one coherent concern into a fresh candidate branch.
5. Run focused tests, then the complete Cloudflare source validation, route/authorization validation, architecture governance and Graphify checks.
6. Inspect workflow logs, not only the overall green badge. Confirm each expected test actually ran.
7. Re-run the full suite after conflict resolution, rebasing, generated-bundle changes or workflow edits.
8. Merge only after required reviews and checks are enforced by repository settings.
9. Refresh later PRs against the new `main` and repeat. Do not treat a list of individually green PRs as a green combined integration.

Workflow requirements:
- Pull requests targeting `main` run validation.
- Relevant pushes run validation.
- Permissions are least-privilege and read-only unless a narrowly scoped job requires writes.
- Concurrency groups prevent stale duplicate runs without cancelling required release evidence.
- Deployment workflows remain separate from ordinary validation and require explicit manual approval.
- CI fixtures must prove both a valid case passes and deliberately invalid cases fail.

## 7. Security, privacy and rights gates

Block integration when any of the following is unresolved:

- Cross-account access or missing owner scoping.
- Client-trusted role, balance, entitlement, payment, or moderation state.
- Missing idempotency or concurrency control for financial or claim operations.
- Unbounded user-controlled external URL fetches or unsafe media destinations.
- Missing content provenance, licence, attribution, or publication eligibility.
- Personal data exposed in public API projections, logs, exports, analytics, or search indexes.
- Account deletion, export, retention, or session revocation without an explicit policy and tests.
- Secrets committed to source, logs, build artifacts, or client bundles.

For deletion, export, ownership transfer, moderation, financial adjustments and production schema changes, require explicit audit events, re-authentication where appropriate, least privilege, and a recovery plan.

## 8. Release and rollback authority

A release is eligible only when all of the following are recorded for the exact commit:

- Required CI and architecture checks pass.
- Security-sensitive changes have an independent review.
- Migration preflight and backup/restore evidence are current when data is affected.
- Worker and asset build inputs are pinned to the reviewed source.
- Deployment is separately authorized and performed through the approved manual path.
- Post-deploy health, route smoke tests, served bundle version and D1 compatibility are verified.
- A tested rollback or forward-repair plan exists.

Never infer deployment success from a GitHub merge, build artifact, workflow dispatch, or local dry run.

## 9. Repository administration action required

The 2026-11-04 audit found `main` unprotected, required status checks disabled, and no repository rulesets. This runbook cannot change those account-level settings through the available GitHub connection.

The repository owner must configure a ruleset or branch protection policy for `main` with:

- Pull requests required; direct pushes restricted.
- Required, stable status checks selected from the actual validation workflow names after they are present on `main`.
- Required review for security-sensitive changes and dismissal of stale approvals when new commits are pushed.
- Conversation resolution before merge.
- Force pushes and branch deletion restricted.
- Administrator bypass minimized and explicitly documented.
- Merge queue or serialized integration used when available.

After configuring settings, re-query the repository settings and verify the effective rules. A policy document is not enforcement.

## 10. Governance completion evidence

Governance may be marked complete only when evidence exists for all of these:

- [ ] Exhaustive branch inventory is classified, with stale branches archived or retained intentionally.
- [ ] Canonical source owners and shared-surface owners are declared.
- [ ] Route registry and authorization matrix are complete and enforced.
- [ ] Migration ledger is unique, replayable and protected from duplicate allocation.
- [ ] Runtime bootstrap matches canonical migrations for fresh and upgrade paths.
- [ ] Negative fixtures demonstrate that governance checks reject invalid changes.
- [ ] Governance workflows are on `main` and run for all relevant PRs.
- [ ] Branch protection/rulesets are enabled and their effective settings verified.
- [ ] Open security/privacy/integrity blockers are closed on canonical commits with tests.
- [ ] Backup restore, production release and rollback procedures are rehearsed.
- [ ] Production Worker, D1, secrets and served assets are independently verified.

Until every applicable item has evidence, status remains **OPEN / NOT PRODUCTION-APPROVED**.
