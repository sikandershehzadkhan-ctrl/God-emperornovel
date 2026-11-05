# Integration Collision Register (2026-11-05)

## Purpose

This register records verified shared-file overlap among currently open pull requests targeting `main`. It is an integration-control artifact, not a declaration that any pull request is safe to merge independently. A PR being GitHub-`mergeable` only means GitHub currently sees no textual merge conflict against its base; it does not prove semantic compatibility with sibling PRs.

## Current disposition (verified 5 November 2026)

The original collision table below is retained as a historical snapshot. The following updates supersede its former open-PR statuses and queue.

| PR | Disposition | Evidence |
|---|---|---|
| #233 atomic community rate limits | Merged into the canonical integration root | Exact-head six-workflow validation passed after fixing the SQLite test separator and removing a duplicate claim insert |
| #214 older community implementation | Closed as superseded | Its atomic quota behavior is represented by merged PR #233 |
| #235 same-origin cover policy | Merged into the canonical integration root as `0f2a3a2c7144aa7ea56c529300a545363b5ef3f0` | Exact-head six-workflow validation passed, including cover-policy regression tests |
| #213 older cover implementation | Closed as superseded | Its policy was ported to the canonical root and merged through PR #235 |
| #236 main ancestry reconciliation | Merged into the canonical integration root as `4a538dfde11e301dfa4fb0aa65ea1b18c3f196e5` | Exact-head six-workflow validation passed; the integration root now contains the current main ancestry |
| #234 earlier ancestry reconciliation attempt | Closed as duplicate | Replaced by #236, which reran checks against the refreshed canonical base |
| #195 canonical architecture integration | Open, draft, not merged to main | Current candidate head follows the main-ancestry reconciliation. Consult the latest exact-head workflow runs and live compare before any merge decision; passing CI is not production approval |
| #189 homepage SSR / design foundation | Closed as superseded after path-level audit | SSR module and design stylesheet are byte-identical on the canonical root; equivalent Worker integration and regression tests are present. The old PR's 17.24 bundle is absent from the active 17.23 runtime and must not be reintroduced |
| #216 legacy core-schema rebuild plan | Replaced by refreshed canonical safety plan in `docs/architecture/LEGACY-CORE-SCHEMA-REBUILD-PLAN.md` | The old plan referenced an obsolete migration head and stale PR numbers. Its read-only preflight, fail-closed data disposition, fixture, backup, restore, and D1 transaction requirements were preserved and refreshed |
| #208 governance closure register | Replaced by refreshed canonical register in `docs/architecture/GOVERNANCE-CLOSURE-REGISTER-2026-11-05.md` | The old register contained historical PR/issue statuses and branch-protection observations. The useful closure gates were retained while volatile facts were marked for live re-verification |
| #176 platform completion register | Replaced by refreshed canonical checklist in `docs/architecture/IMPERIAL-PLATFORM-COMPLETION-REGISTER-2026-11-05.md` | Ordered product, security, reader, author, community, payments, operations, and acceptance gates were preserved; the old mainline baseline and account-branch blockers were refreshed to avoid stale claims |

### Governance defects found and corrected

1. The shared-surface lineage check could select the current PR as its own ancestor when a PR's base branch was also the head branch of a reverse-direction main-to-integration PR. The parent lookup now excludes the current PR and reverse-direction integration children.
2. The lineage check now validates the actual ancestor stack without mistaking a PR that merges `main` into the integration root for a parent of the root-to-main PR.
3. The community atomic-rate-limit test now constructs its SQLite statement separator without an escaped literal backslash and reuses the existing duplicate-report claim in its cascade assertion.
4. The cover policy's exact Worker blob fingerprints, canonical domain ownership, ADR, feature contract and build regression gate were synchronized. The policy is enforced server-side on all four author/admin novel-cover write routes.

### Remaining open-branch review

The following groups remain open and have not been declared safe to merge or closed merely because they are old. Their unique behavior and tests must be reconciled against the canonical root before disposition:

- #216 and #208 have been path-audited and their durable requirements ported into refreshed canonical documents; their old PRs still require closure after the replacement-document PR is accepted.
- #175 UX acceptance matrix and route-to-screen coverage matrix still require individual path-level review; do not close until their unique acceptance criteria and route evidence are accounted for.
- #156 homepage SSR fallback and #155–#146 reader/home/catalog feature chain.
- #145–#131 localization chain.
- #127 design foundation, #122 sitemap, and #119 rating validation.
- #95–#86 security hardening branches.
- #49–#28 media, reader, security, product and research branches.
- #8–#4 early product/engineering branches.

These are stale-branch candidates, not automatically duplicate work. The root contains later canonical migrations through 0046 and a governed Worker, but individual feature parity and test coverage still require path-level review before any old branch is closed. No historical migration from an old branch may be copied or renumbered without the migration-allocation and ownership gates.

### Current integration safety

- Canonical root: `integration/architecture-governance-root-17-70`.
- Current main ancestry is present in the root; re-run the compare immediately before any merge decision because commit counts are volatile.
- PR #195 remains draft. Passing CI is not approval to merge this 588-commit integration into main.
- No production deployment or production D1 migration was performed as part of this reconciliation.
- A successful exact-head CI run proves the tested commit passed those workflows; it does not certify every feature or production journey.

## Historical collision snapshot (superseded by current disposition)

All PRs below were observed open against the same base commit prefix `c909a8aa` during this audit.

| PR | Concern | Shared paths requiring serialized integration |
|---|---|---|
| #209 | Rating input validation | `src/index.js`, `package.json` |
| #210 | Runtime schema parity | `src/index.js`, `package.json`, `.github/workflows/validate-cloudflare-source.yml` |
| #211 | Atomic AI run claims | `src/index.js`, `package.json`, `.github/workflows/validate-cloudflare-source.yml` |
| #212 | Reader bookmark/history target validation | `src/index.js`, `package.json`, `.github/workflows/validate-cloudflare-source.yml` |
| #213 | Cover image destination boundary | `src/index.js`, `package.json` |
| #214 | Atomic community comment limits | `src/index.js`, `.github/workflows/validate-cloudflare-source.yml` |
| #195 | Architecture/ownership governance | `src/index.js`, `package.json`, `.github/workflows/validate-cloudflare-source.yml`, and runtime-feature schema files also changed by #214 |

Additional observed overlap:
- #213 and #195 both change `public/app.js` and a versioned browser bundle, so served-asset parity must be checked after integration.
- #214 and #195 both change `scripts/test-runtime-feature-schema.mjs` and `src/runtime-feature-schema.mjs`.
- #217 shares the Cloudflare validation workflow with #210, #211, #212 and #214.
- #195 and #219 both change `.github/pull_request_template.md`; their content was aligned byte-for-byte in the latest audited branches.

## Content-level divergence confirmation

A second comparison inspected the actual head blob SHA for every file shared by the PR pairs above. This confirms the overlaps are not merely matching path names:

- #214 has divergent head content against #213, #212, #211, #210, #209, #195 and #217 on the shared paths listed by the pairwise audit.
- #213 is divergent against #212, #211, #210, #209 and #195 on its overlapping files, including the browser bundle pair shared with #195.
- #212 is divergent against #211, #210, #209, #195 and #217 on overlapping runtime/build/workflow files.
- #211 is divergent against #210, #209, #195 and #217 on overlapping files.
- #210 is divergent against #209, #195 and #217 on overlapping files.
- #209 is divergent against #195 on `package.json`.
- #195 is divergent against #217 on the Cloudflare validation workflow.

The audit compared the blob SHAs reported for each PR's changed-file list. Different SHAs establish that the current branches do not carry identical file content. They do not by themselves identify which hunk is semantically correct; that requires sequential integration and tests.

## Required integration protocol

1. Keep the current PR branches open until their unique behavior is accounted for. Do not close or merge a branch merely because another branch touches the same path.
2. Integrate one Worker/build/workflow shared-surface change at a time. After each integration, rebase or reconstruct the next change on the new canonical head, preserving the complete intended diff.
3. Re-run the exact-head Cloudflare Source Validation, Route Registry, Architecture Governance, Graphify and Migration Governance checks applicable to the resulting branch. A pass on an older SHA does not validate a later SHA.
4. For every `src/index.js` change, compare route signatures, HTTP methods, authorization guards, owner scoping, request validation, response shapes and error behavior. Do not accept a textual merge alone.
5. For every `package.json` change, preserve all existing scripts/dependencies and verify lockfile consistency. Never resolve by choosing one branch's whole file without semantic reconciliation.
6. For every workflow change, retain all existing safety gates and triggers. Do not remove a gate to make a check green.
7. For browser changes, verify source/bundle parity and ensure no stale versioned bundle is served.
8. For migrations, require immutable historical SQL, a unique globally allocated number, an explicit reservation bound to the PR, and fresh integrity/foreign-key validation. Never replay a production migration as a substitute for CI validation.
9. Do not merge or deploy until all unique features, tests and required reviews are represented on the same candidate head and release gates pass.

## Suggested dependency-aware queue

This is an ordering proposal for controlled review, not permission to merge. Re-evaluate dependencies and current exact-head checks immediately before each integration.

1. **#219 migration governance and #218 enforcement runbook**: establish append-only migration and ownership controls before accepting schema/runtime work.
2. **#210 runtime schema parity**: reconcile runtime bootstrap with canonical schema before adding dependent transactional behavior.
3. **#211 atomic AI run claims**: validate migration `0012` reservation, deployment ordering and atomic-claim regression coverage.
4. **#212 reader target validation**: reconcile bookmark/history chapter target checks against the canonical reader-progress implementation.
5. **#209 rating input validation**: preserve whole-number 1–10 policy and existing rating behavior.
6. **#213 cover media boundary**: integrate backend URL policy and browser author UI changes together; verify served bundle parity.
7. **#214 atomic community rate limits**: integrate last because it overlaps runtime-feature schema files and the validation workflow changed by the governance foundation.
8. **#195 architecture root**: refresh against the integrated candidate, reconcile all remaining feature slices and rerun the complete governance suite before it becomes the canonical integration baseline.

## Known feature parity gaps from PR #173

The earlier route-signature comparison identified legacy declarations not present under the same method/path signatures in the governed Worker. These are a verification inventory, not a blind port list:

- Author Studio goals, notes, planning, readiness, schedules, analytics, feedback and media.
- Chapter revision history, scheduled publication and comic page management.
- Creator media upload/delete and administrator media review/storage.
- Administrator payment and ticket reconciliation/adjustment endpoints.

For each item, first check whether a current route implements the same behavior under a renamed path. If no equivalent exists, port it as a bounded feature slice with a canonical owner, route/authorization registration, server-side owner scoping, negative tests and explicit migration impact. Do not copy the older Worker or browser bundle wholesale.

## Audit evidence and limitations

- The PR overlap matrix above was derived from the GitHub changed-file lists for PRs #195 and #209–#214, #217, #218 and #219.
- The latest observed states showed these PRs open against the same base prefix; all listed PRs were reported mergeable by GitHub at audit time. This is not semantic approval.
- PR #195 exact-head validation previously passed Architecture Governance, Cloudflare Source Validation, Route Registry and Graphify on commit `211251056283db5537e6ef163e6d7191cba4aa50`.
- PR #219 exact-head validation passed Migration Governance, Cloudflare Source Validation and Graphify on commit `9bd66b08413b2406569f2ba42e98c612bbd06ae7`.
- Those checks apply only to those exact commits. Any subsequent commit requires fresh validation.
- No production deployment or production D1 migration is authorized by this register.
