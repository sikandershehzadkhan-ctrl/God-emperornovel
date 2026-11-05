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
| #216 legacy core-schema rebuild plan | Closed as superseded by PR #237 | The old plan referenced an obsolete migration head and stale PR numbers. Its read-only preflight, fail-closed data disposition, fixture, backup, restore, and D1 transaction requirements were preserved and refreshed |
| #208 governance closure register | Closed as superseded by PR #237 | The old register contained historical PR/issue statuses and branch-protection observations. The useful closure gates were retained while volatile facts were marked for live re-verification |
| #176 platform completion register | Closed as superseded by PR #237 | Ordered product, security, reader, author, community, payments, operations, and acceptance gates were preserved; the old mainline baseline and account-branch blockers were refreshed to avoid stale claims |
| #122 dynamic public sitemap | Closed as superseded | Canonical `src/sitemap.mjs` and `src/seo.mjs` provide a stronger sharded sitemap index, bounded novel/chapter pagination, robots policy and route-aware SEO; `test-dynamic-sitemap.mjs` and `test-seo-foundation.mjs` cover the integrated implementation |
| #119 rating input validation | Closed as superseded | Canonical Worker validation and `test-rating-input-validation.mjs` enforce whole-number ratings from 1–10; the old PR's separate 1–5 parser conflicts with the platform's 1–10 rating contract and is not to be reintroduced |
| #240 explicit bookmark intent | Merged into canonical integration root | Chapter visits now update history only; explicit POST/DELETE actions are owner-scoped; exact-head six-workflow validation passed |
| #241 reader accessibility controls | Merged into canonical integration root | Accessible chapter progress semantics, drawer relationships/focus/Escape behavior and named font controls; exact-head six-workflow validation passed |
| #242 Library/History localization | Merged into canonical integration root | Fourteen locale dictionaries, localized Library/History/Following, reading progress and explicit bookmark removal; canonical ten-point ratings preserved; exact-head six-workflow validation passed |
| #152 reader bookmark intent | Closed as superseded by #240 | The unique explicit-save/remove behavior is integrated in #240; the old automatic-on-open bookmark behavior is intentionally not preserved |
| #153 reader progress sync | Closed as superseded | Canonical `/api/reading-position`, browser synchronization, optimistic concurrency and offline fallback are covered by `test-reading-position-api` and reader-progress tests; its old migration 0016 conflicts with the canonical chapter-revisions migration and was not copied |
| #154 reader accessibility | Closed as superseded by #241 | Keyboard drawer focus, Escape handling, progressbar semantics and descriptive controls are integrated in #241 |
| #155 reader library controls | Closed as superseded by #242 | Fourteen-language Library/History/Following, progress display and bookmark removal are integrated; the legacy five-point rating logic was excluded |
| #156 homepage SSR fallback | Open; partial parity only | Canonical SSR renderer and public-novel projection are present; canonical `test-homepage-ssr-integration.mjs` covers the current renderer. The legacy `test-homepage-ssr.mjs` is coupled to stale 17.23 client/SSR markup and is not a safe direct port. The unique connector-registry deduplication behavior has been reconstructed in PR #243. Homepage content localization and broader no-JS/RTL assertions remain unported; keep #156 open until those requirements are selectively reconciled. |
| #127 visual design foundation | Open; partial parity only | Canonical `imperial-design-foundation.css` and design integration test supersede the old token/layout/reader/component foundation in part, but the old branch's admin tab keyboard/ARIA behavior is absent from canonical `public/admin.html`, and several admin/page-specific styles remain unmatched. Selectively reconcile before closing; do not merge its 17.24 assets wholesale |

### Governance defects found and corrected

1. The shared-surface lineage check could select the current PR as its own ancestor when a PR's base branch was also the head branch of a reverse-direction main-to-integration PR. The parent lookup now excludes the current PR and reverse-direction integration children.
2. The lineage check now validates the actual ancestor stack without mistaking a PR that merges `main` into the integration root for a parent of the root-to-main PR.
3. The community atomic-rate-limit test now constructs its SQLite statement separator without an escaped literal backslash and reuses the existing duplicate-report claim in its cascade assertion.
4. The cover policy's exact Worker blob fingerprints, canonical domain ownership, ADR, feature contract and build regression gate were synchronized. The policy is enforced server-side on all four author/admin novel-cover write routes.

### Remaining open-branch review

The following groups remain open and have not been declared safe to merge or closed merely because they are old. Their unique behavior and tests must be reconciled against the canonical root before disposition:

- #216, #208 and #176 were path-audited; their durable requirements were ported into canonical documents merged through PR #237, and the stale PRs were closed as superseded.
- #175 UX acceptance matrix and route-to-screen coverage matrix were ported as dated canonical acceptance references in PR #239; its unique Worker noindex correction was handled separately by PR #238. Both replacement PRs passed validation and the stale PR was closed.
- #156 homepage SSR and homepage-content localization parity; #151–#146 reader/home/catalog feature chain.
- #145–#131 localization chain.
- #127 design foundation, especially admin keyboard/ARIA behavior and remaining page-specific styling.
- #95–#86 security hardening branches.
- #49–#28 media, reader, security, product and research branches.
- #8–#4 early product/engineering branches.

These are stale-branch candidates, not automatically duplicate work. The root contains later canonical migrations through 0046 and a governed Worker, but individual feature parity and test coverage still require path-level review before any old branch is closed. No historical migration from an old branch may be copied or renumbered without the migration-allocation and ownership gates.

### Current integration safety

- Canonical root: `integration/architecture-governance-root-17-70`.
- Current main ancestry is present in the root; re-run the compare immediately before any merge decision because commit counts are volatile.
- PR #195 remains draft. It is a large integration candidate; recheck its live ahead/behind count and exact-head workflows before any merge decision. Passing CI is not approval to merge it into main.
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


## Follow-up audit (2026-11-05 evening)

### PR #156: selective parity, not wholesale merge

The canonical root contains `src/homepage-ssr.mjs`, `src/public-novel.mjs` and `scripts/test-homepage-ssr-integration.mjs`. The older #156 branch has a materially different SSR renderer and a test coupled to its old homepage markup, old client bundle and old CSS. Replacing the current renderer or the active 17.23 browser bundle with those files would reintroduce stale runtime content.

A separate test in #156 exposed a genuine remaining behavior gap: `seedOmni` used `INSERT OR IGNORE` despite the current `connectors` table having no matching unique constraint, and public OmniPortal status did not collapse duplicate normalized base URLs. That behavior has been selectively reconstructed on the canonical root in **PR #243**. The same slice also closes an authorization gap in the administrator connector-create route: new connectors are disabled and pending until evidence/terms review, rather than being inserted as authorized without evidence. PR #243 is open and awaits exact-head validation; it is not merged.

### PRs #145–#131: localization chain remains a parity gap

The legacy chain is based on the 17.24 runtime and includes stale migration files 0012–0015 plus old Worker and browser bundles. The canonical root is governed through migration 0046 and the active 17.23 browser bundle. The chain is hundreds of commits divergent from the current integration root; it must not be merged as a unit or have its migration numbering copied.

The canonical app already has the 14-language interface dictionary and selected localized surfaces, including Library/History coverage, but the audit found missing canonical tests for several legacy surfaces and no equivalent `HOME_LANG` homepage-content dictionary in the current `public/app.js`. The unique localization requirements need path-by-path parity checks and bounded ports on a fresh canonical branch. Keep the legacy chain open until that work is accounted for; do not close it merely because its branches are stale.

### PR #243/#244: connector-registry acceptance boundary

- PR #243 was superseded by PR #244 after a missing shared-surface feature-contract update prevented a clean exact-head validation cycle.
- PR #244 passed all six exact-head workflows (Architecture Governance, Cloudflare Source Validation, Route Registry, Runtime Schema Parity, Migration Governance and Graphify) on `384659543741a58e6ab6cf2e3e53b4745968762a`.
- PR #244 was squash-merged into the governed integration root as `bb8b47a3d6eb4833fcc05269b1f06cc3dec4a652`; it was not merged into `main`.
- Registry seeding uses a normalized `NOT EXISTS` guard; public status selects one stable representative per normalized URL and prefers an enabled/authorized row.
- Administrator connector creation validates an allowlisted HTTPS origin, rejects a normalized duplicate with HTTP 409, and creates a disabled/pending record.
- Existing duplicate rows are not deleted by a public GET. The administrator cleanup endpoint remains the explicit repair path.
- No migration, production D1 mutation or deployment is included.
- The table still has no database-enforced unique index on normalized `base_url`; this code-only slice does not claim uniqueness under every concurrent administrator write. A future unique-index migration requires separate allocation and reviewed reference-preserving data repair.

### PR #147: period-correct leaderboard presentation

- The canonical Worker already had period-scoped chapter-unlock ranking, published-chapter and rights-eligibility filters, author normalization, and zero-unlock novel suppression. The legacy PR #147 branch contained a useful UI explanation and unlock-count display, plus a chapter/time lookup index, but its Worker query was not copied wholesale.
- Ported the UI labels and returned unlock counts onto a fresh branch from the governed integration root. Preserved the canonical ten-point rating formatter and the stronger zero-unlock suppression.
- Added the idempotent runtime bootstrap index `idx_unlocks_chapter_time` on `unlocks(chapter_id,unlocked_at)`; no numbered migration or production D1 mutation.
- Extended the existing mandatory leaderboard test to assert period metric labels, novel/author unlock counts, index presence and byte-identical source/versioned browser bundles.
- Added ADR-0024 and the period-correct leaderboard feature contract, including explicit route, rights and rollout boundaries.
- This is a selective port, not a merge of PR #147 or its stale parent chain. Exact-head CI is still required before integration.
