# Integration Collision Register (2026-11-05)

## Purpose

This register records verified shared-file overlap and integration disposition across open pull requests targeting `main` or the governed integration root. It is an integration-control artifact, not a declaration that any pull request is safe to merge independently. A PR being GitHub-`mergeable` only means GitHub currently sees no textual merge conflict against its base; it does not prove semantic compatibility with sibling PRs.

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
| #244 OmniPortal connector registry deduplication | Merged into the canonical integration root as `bb8b47a3d6eb4833fcc05269b1f06cc3dec4a652` | Exact-head six-workflow validation passed; repeated registry seeding is idempotent, public status is deduplicated, duplicate admin registrations are rejected, and new connectors remain pending until rights review |
| #243 first connector-registry validation attempt | Closed as superseded by #244 | The initial exact-head build exposed a missing platform-integration contract update; the corrected complete change was reconstructed and all six workflows passed on #244 |
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
| #156 homepage SSR fallback | Open; partial parity only | Canonical SSR renderer and public-novel projection are present; canonical `test-homepage-ssr-integration.mjs` covers the current renderer. The legacy `test-homepage-ssr.mjs` is coupled to stale 17.23 client/SSR markup and is not a safe direct port. Connector-registry deduplication is integrated through #244, and homepage/navigation localization is integrated through #253. Remaining work is limited to the unique no-JS/RTL and hydration assertions after path-level comparison; keep #156 open until those are reconciled. |
| #127 visual design foundation | Open; partial parity only | Canonical `imperial-design-foundation.css` and its integration test supersede the old token/layout/reader/component foundation in part. The previously missing admin tab keyboard/ARIA behavior was integrated separately through merged PR #260. Remaining work is limited to unmatched admin/page-specific styles; selectively reconcile before closing and do not merge its 17.24 assets wholesale. |
| #251 alternate homepage localization | Closed as superseded by #253 | Same homepage/navigation surface; stale 17.23 branch failed a brittle Library localization assertion and omitted newer Settings/Rankings dictionaries. Its unique behavior is present in #253. |
| #262 community localization | Open; refresh required | Current-root community localization candidate; six checks passed on recorded head, but it is one commit behind the current root. Rebase/port onto current head and rerun all six workflows. |
| #263 bounded OmniPortal responses | Open, draft | Adds 1 MiB streaming JSON limit, 120-character search bound and eight-provider cap. Exact-head validation pending; no migration or deployment. |
| #145 legacy homepage localization | Closed as superseded by #253 | Current-root HOME_LANG, accessible navigation, skip-link, RTL and SSR/client localization tests cover the same scope on the 17.23 runtime. |
| #148 reader request history | Closed as superseded by canonical integration | Current Worker/UI and mandatory `test-reader-request-history.mjs` preserve owner scoping, bounded history and accessible status feedback. |

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

A separate test in #156 exposed a genuine remaining behavior gap: `seedOmni` used `INSERT OR IGNORE` despite the current `connectors` table having no matching unique constraint, and public OmniPortal status did not collapse duplicate normalized base URLs. That behavior was selectively reconstructed on the canonical root in PR #243, then superseded by PR #244 after the shared-surface contract was corrected. PR #244 passed all six exact-head workflows and was squash-merged into the governed integration root. The same slice closes an authorization gap in the administrator connector-create route: new connectors are disabled and pending until evidence/terms review, rather than being inserted as authorized without evidence.

### PRs #145–#131: localization chain remains a parity gap

The legacy chain is based on the 17.24 runtime and includes stale migration files 0012–0015 plus old Worker and browser bundles. The canonical root is governed through migration 0046 and the active 17.23 browser bundle. The chain is hundreds of commits divergent from the current integration root; it must not be merged as a unit or have its migration numbering copied.

The canonical root now includes fourteen-language Library/History coverage (#242), homepage/navigation localization (#253), settings/reader localization (#256), and rankings/Tier List localization (#259). The current community localization candidate is PR #262; its six workflows passed on its recorded head, but that head is one commit behind the current root and requires refreshed exact-head validation. Remaining parity gaps include Author Studio, Catalog, Genre/Tag/Search, Formats and Reader Profile. Port only those missing surfaces onto the current 17.23 runtime with dedicated tests. PR #251 was closed as superseded by #253 after confirming its homepage behavior was already integrated and its stale bundle omitted newer Settings/Rankings dictionaries.

### PR #244: connector-registry acceptance boundary

- Registry seed uses a normalized `NOT EXISTS` guard; public status selects one stable representative per normalized URL and prefers an enabled/authorized row.
- Administrator connector creation validates an allowlisted HTTPS origin, rejects a normalized duplicate with HTTP 409, and creates a disabled/pending record.
- Existing duplicate rows are not deleted by a public GET. The administrator cleanup endpoint remains the explicit repair path.
- No migration, production D1 mutation or deployment is included.
- The current table still has no database-enforced unique index on normalized `base_url`; this code-only slice does not claim uniqueness under every concurrent administrator write. A future unique-index migration requires a separate allocation and reviewed reference-preserving data repair.


### PR #147: period-correct leaderboard UI parity

- The canonical Worker already ranks by period-scoped chapter unlocks, filters to published rights-eligible works and published chapters, normalizes author identity, and suppresses zero-unlock novel rows. The legacy PR #147 query was therefore not copied wholesale.
- A bounded port now aligns the leaderboard UI with the existing API: it explains the selected-period chapter-unlock metric and displays returned unlock counts on novel and author cards.
- The canonical ten-point rating formatter is retained. The runtime bootstrap receives the idempotent composite index idx_unlocks_chapter_time on unlocks(chapter_id, unlocked_at).
- The existing mandatory leaderboard test now verifies API semantics, visible labels and counts, index presence, and byte-identical canonical/versioned browser bundles.
- ADR-0024 and a feature contract document ownership, existing route/entity reuse, no-migration scope and acceptance criteria.
- PR #245 and PR #247 were superseded and closed after their bases moved. PR #248 carried the corrected exact-head evidence and passed all six required workflows on commit 41281720fd7bad999c8ef8d044217a367488faa8. It was squash-merged into the governed integration root as fd81e5b064b7b4cf9d2bfb810dcf21f1542b969f, not into main.
- No production deployment, production D1 mutation or numbered migration is included.

### PR #248 exact-head validation and integration

- Architecture Governance, Cloudflare Source Validation, Route Registry, Runtime Schema Parity, Integration Migration Governance and Graphify all passed on the exact validated head.
- The first validation attempt exposed stale route-method and authorization Worker fingerprints. Both evidence files were refreshed to the exact Worker blob 830f6385856b11b356cba9352b776ae89d24b879; the corrected exact-head run then passed.
- PR #248 was squash-merged into the governed integration root. The same changes are not merged into main and are not a production deployment approval.



### PR #246: homepage and navigation localization collision

- The legacy homepage-localization branch was two commits behind the refreshed integration root and shared the canonical browser bundles and package build script. It was not merged directly.
- Ported only the 14-locale HOME_LANG dictionary, static text-node localization helper, async mutation observation with detached-root cleanup, localized search placeholder/accessibility name, skip-link translations, and Urdu/Arabic/Persian RTL behavior.
- Preserved the canonical homepage SSR handoff, live catalog rendering, creator-authored story content, period-correct leaderboard UI and ten-point rating formatter. The localization observer excludes dynamic story cards and does not rewrite unchanged text.
- Synchronized public/app.js and public/app-17.23.0.js; added dedicated 14-locale homepage and skip-navigation regressions to the mandatory build.
- Added ADR-0019 and the homepage-navigation-localization feature contract. No API route, database entity, migration, account setting or production deployment is changed.
- The refreshed integration candidate is on branch integration/homepage-navigation-localization-17-75. Exact-head validation remains required before merging into the governed root.


### Homepage localization regression reconciliation

- The first exact-head build confirmed the new homepage and navigation localization tests passed, then exposed two brittle legacy assertions in existing shared localization/accessibility checks: one expected the unmarked skip-link markup, and another expected the former RTL/fallback implementation strings.
- The implementation keeps the accessible skip link marked for translation and correctly enables RTL for Urdu, Arabic and Persian. Existing Library/History locale application remains intact.
- Updated the content-format regression to assert the new localized skip-link, Persian RTL and safe English-key fallback behavior. The Library selector compatibility regression was preserved by retaining its expected selector form.
- The updated check is registered in the homepage localization feature contract. A fresh exact-head validation cycle is required; do not weaken or skip either legacy regression.


### PR #253 exact-head validation and integration

- The final homepage/navigation localization candidate passed all six exact-head workflows: Architecture Governance, Cloudflare Source Validation, Route Registry, Runtime Schema Parity, Integration Migration Governance and Graphify.
- The Cloudflare build executed both new fourteen-locale homepage/navigation regressions and the existing Library/History, content-format and accessibility checks. The compatibility changes preserve all existing checks; none were skipped or weakened.
- The initial exact-head build identified two stale string-level assertions in existing tests, plus a selector-format assertion in the Library localization test. The implementation compatibility and test expectations were corrected, then the clean exact-head run passed.
- PR #253 was squash-merged into the governed integration root as 6fa17d5ec807f6cf08a650f3584ad1dbb44482a2. It was not merged into main and does not authorize production deployment.
- Creator-authored story titles, author names and dynamic catalog content remain excluded from automatic translation. No API, Worker, database entity, migration, account setting or production data change was introduced.


### PR #143: settings and reader localization collision

- The legacy localization branch is based on the older stacked 17.24 chain and replaces the reader function with a version that predates the canonical session-owned progress API. It is not safe to merge wholesale.
- The canonical root already has a full settings page, six-theme preferences, account preference synchronization, reader progress synchronization, bookmarks and Crown unlock flows. Those implementations are preserved.
- Ported the fourteen-locale settings dictionary and native-language selector into the existing settings page using the existing browser-local imperial_language preference.
- Ported ten reader strings into the existing fourteen-locale dictionary, marking only static labels and resolving dynamic progress/footer copy through readerText. Chapter content and user-owned state remain unchanged.
- Added settings and reader localization regression tests to the mandatory build, plus ADR-0025 and a feature contract.
- No route signature, API contract, database entity, migration, production data mutation or deployment is introduced. Exact-head CI is required before integration.


### Settings/reader localization build correction

- The first exact-head build exposed that two legacy localization tests were still hard-coded to load the stale 17.24.0 bundle. The canonical platform serves 17.23.0, so the tests were corrected to validate public/app-17.23.0.js instead of importing or creating a stale 17.24 bundle.
- Direct source checks now confirm the settings selector, fourteen-locale settings dictionary, ten reader translations, dynamic reader labels, and byte-identical canonical/versioned bundles. A fresh exact-head build is still required to certify the full suite.


### Reader accessibility regression reconciliation

- The first settings/reader localization build confirmed the new settings and reader locale tests were not yet the only integration gate: the existing reader accessibility test expected English-only progress aria-valuetext strings.
- Updated the canonical reader to localize both initial and live progress announcements using readerText while preserving numeric progress values and progressbar semantics.
- Updated the existing reader accessibility regression to assert localized initial/live value text, and registered the test in the settings-reader feature contract and platform integration governance.
- No progress persistence, revision, bookmark, unlock or ownership behavior changed. A fresh exact-head build is required.

- Follow-up refinement: the reader now reapplies the active locale after its markup handoff, translates bookmark and reader-theme accessible names, and uses the library dictionary for the remove-bookmark state. The canonical and served bundles are resynchronized; the feature contract records this lifecycle.


### PR #256 exact-head validation and integration

- Settings and reader localization passed all six exact-head workflows: Architecture Governance, Cloudflare Source Validation, Route Registry, Runtime Schema Parity, Integration Migration Governance and Graphify.
- The mandatory Cloudflare build passed the settings language selector, reader locale completeness, reader accessibility, library localization and all existing reader progress/bookmark/unlock regressions.
- The first candidate exposed legacy tests hard-coded to the 17.24 asset and English-only progress announcements. Tests and reader aria-valuetext were updated to validate the canonical 17.23 bundle and localized progress text; no regression was removed or skipped.
- Reader locale application now runs after markup handoff; bookmark and reader-theme accessible names are translated. Canonical progress synchronization, revision checks, bookmarks, Crown unlocks and creator-authored chapter content remain unchanged.
- PR #256 was squash-merged into the governed integration root as 6774f37dd40a8966267bad3f697edbc6a48ed900. It was not merged into main and does not authorize production deployment.


### PR #137: rankings and tier-list localization collision

- The legacy PR #137 branch is based on the 17.24 localization chain and its ranking copy describes generic catalog activity. That wording conflicts with the canonical period-scoped chapter-unlock ranking now implemented in the Worker and displayed by PR #248.
- Ported the fourteen-locale ranking dictionary onto the current 17.23 runtime and added accurate translations for the selected-period chapter-unlock metric, novel/author ranking descriptions, unlock counts and author empty state.
- Leaderboard and Tier List now reapply the selected locale after dynamic rendering. Creator-authored novel titles and author names remain unchanged.
- Preserved the canonical ten-point rating formatter, published-rights filters, zero-unlock suppression, existing routes and API responses.
- Added ADR-0026, a feature contract and a mandatory fourteen-locale regression. No API, database entity, migration or production deployment is included. Exact-head validation remains required.


### Rankings localization regression adjustment

- The first exact-head build confirmed the locale dictionary and other checks loaded, then exposed a brittle assertion that expected rankingText() to wrap explanatory copy directly. The implementation intentionally marks static explanation paragraphs with data-in-lang and reapplies setINLang after rendering; dynamic counts use rankingText().
- Updated the regression to assert the actual static-markup and dynamic-count paths separately. The chapter-unlock wording remains unchanged and accurately reflects the canonical API. A clean exact-head run is required.


### Period leaderboard regression compatibility

- The first rankings-localization build passed the new locale test but exposed a hard-coded English suffix in the existing period-correct leaderboard regression. The UI now correctly renders the unlock metric through rankingText('unlocks') for the active locale.
- Updated the existing API/UI regression to assert that numeric unlock counts use the locale key, preserving the period, rights, zero-activity and numeric-count checks. The test was registered in the feature and platform contracts; no assertion was removed.
- A fresh exact-head validation is required.


### PR #259 exact-head validation and integration

- The final rankings/Tier List localization candidate passed all six exact-head workflows: Architecture Governance, Cloudflare Source Validation, Route Registry, Runtime Schema Parity, Integration Migration Governance and Graphify.
- The mandatory build passed the fourteen-locale ranking test and the existing period-correct leaderboard regression after its unlock-count assertions were updated to use the active locale key. No ranking, numeric-count, rights or zero-activity assertion was removed.
- PR #259 was squash-merged into the governed integration root as d962c637c228dce16a08c9d4ac3e03000570a01b. It was not merged into main and does not authorize production deployment.
- The leaderboard now localizes the period chapter-unlock explanation and novel/author unlock metrics across fourteen interface locales. Tier List labels and empty states are also localized. Creator-authored titles and author names remain unchanged.

### PR #263: bounded OmniPortal connector responses

- Added a streaming JSON parser with a 1 MiB per-provider body limit, JSON content-type validation, strict UTF-8 decoding and malformed JSON rejection.
- Bounded OmniPortal search input to 120 characters and external fan-out to eight enabled, rights-authorized connectors.
- Preserved local catalog results, the existing connector HTTPS allowlist, seven-second timeout, rights checks, normalization and deduplication.
- Added `scripts/test-bounded-json-response.mjs`, ADR-0028 and the `omniportal-bounded-json-response` feature contract.
- Refreshed the route, API-method and authorization evidence fingerprints to the exact Worker blob and commit.
- No migration, production data change, secret, chapter-body ingestion or deployment is included.
- PR #263 targets the governed integration root and remains draft pending exact-head validation. Do not merge or deploy until all six required workflows pass on its final head.


### PR #262: Community discovery localization, clean-root port (2026-11-06)

- The original Community localization branch was based on a stale 17.24 app bundle and diverged from the canonical root. Its app bundle was not merged wholesale.
- Ported the fourteen-locale COMMUNITY_LANG dictionary additively onto the canonical root after Public Author Discovery, preserving the /authors route, author navigation, and current ranking dictionary.
- Added Community static labels and loading/empty/unavailable states with locale reapplication after initial render and after the trending catalog response.
- Creator-authored novel titles, usernames, discussion bodies and descriptions remain unchanged. Existing Community and trending API requests, publication filters and rights eligibility are unchanged.
- Added a dedicated localization regression and retained the isolated rankings dictionary test. The mandatory build continues to include bounded JSON and all six account-lifecycle migration regressions.
- No route, API, database entity, migration, payment behavior or production deployment is introduced.
- ADR allocation: Public Author Discovery remains ADR-0027, bounded OmniPortal responses remain ADR-0028, and Community discovery localization is ADR-0029.
- Exact-head validation is required before integration. This record describes the clean-root port, not production release approval.


## Follow-up audit (2026-11-06): architecture integration refresh

### PR #293 remediation integrated

- PR #293 (ADR identifier and migration-domain ownership remediation) was merged into the canonical integration root as `d1245321f82b3fdbce1875ee2a09986c7c5f2720`.
- All six exact-head workflows passed on PR #293 head `fd51526160f1ec42b91df69b0e64bad33491e87b` before merge.
- Nine colliding ADR records were renumbered to ADR-0030 through ADR-0038; the numbered ADR audit reports 38 canonical records and zero duplicate IDs.
- Migration ownership allocation now covers 0001–0046 in contiguous, non-overlapping ranges. No SQL migration content was changed by PR #293.

### PR #195 exact-head validation and scope

- After PR #293 merged, PR #195 advanced to integration commit `d1245321f82b3fdbce1875ee2a09986c7c5f2720`; all six exact-head workflows passed.
- The candidate contains 310 changed files, including Worker/browser runtime code, 35 SQL migrations (0012–0046), matching reservation records, architecture documents, tests and workflow changes. It is not a documentation-only change.
- The editable and served browser JavaScript files `public/app.js` and `public/app-17.23.0.js` have identical Git blob SHA at the audited root.
- Canonical ownership inventory: 19 domains, 218 owned paths, zero cross-domain path-prefix overlaps in the current ownership registry.
- Domain dependency graph: 19 nodes, no unknown dependency references and no cycles.
- Static route inventory: 80 exact paths and 22 dynamic patterns; 34 public screen routes are separately registered with no duplicate exact paths. These inventories do not prove every runtime route or authorization contract.

### Authorization review remains a release blocker

- The API method inventory contains 80 exact route entries and 22 dynamic route patterns, representing 154 method signatures.
- The authorization ownership matrix reviews 59 route-method entries. Its own disclosure states that all other routes remain pending handler-level review. The remaining 95 method signatures must not be treated as authorization-approved.
- The matrix records 14 findings (9 high, 5 medium). AUTH-001 and AUTH-012 still require two-account Worker/D1 runtime proof for cross-account and AI-project ownership isolation. Other findings still require the specific browser, D1 or Worker runtime tests described in the matrix.
- AUTH-009 was refreshed to reflect exact-head CI validation of the ten-point rating migration and fresh SQLite migration checks. Production D1 rollout remains pending.

### Production migration gate remains closed

- The production deploy workflow is manual and explicitly blocks any canonical SQL migration numbered above 0011.
- The current candidate contains migrations 0012–0046. They must not be applied to production until the remote migration ledger, recoverable backup, legacy compatibility and per-migration preflight/postflight are separately reviewed.
- No production deployment, remote D1 migration or live-data mutation was performed during this audit.

### Stale feature branches: no wholesale merges

- PRs #149 and #146 overlap PR #195 on shared Worker, browser bundle, package and design/SEO surfaces. Their unique tests and behavior need selective parity review against the canonical root; their complete branches must not be merged wholesale.
- PRs #131–#141 form an older stacked localization chain and share `public/app.js`, package scripts and/or the Cloudflare validation workflow. They also carry the older 17.24 browser bundle. Rebuild only missing localization surfaces on the current 17.23 canonical runtime, preserving source/served-bundle parity.
- PR #156 and PR #127 remain partial-parity candidates as described above. Security PRs #86–#95 remain outside the active integration queue until the separately paused security review is resumed.
- PR #195 remains draft despite passing six checks. It is not ready for mainline merge until the 95 pending authorization route-method reviews, required runtime isolation tests, stale-branch parity decisions and migration rollout boundary are resolved.
