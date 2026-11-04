# Canonical migration collision register



## PR #124 security and account-deletion migration collision map

PR #124 is based on an older migration namespace and cannot be merged as-is. Its files 0009–0012 collide with current canonical migrations 0009–0012, while its 0013 chapter timestamp migration duplicates the canonical timestamp migration 0029. Its account-deletion request table also semantically duplicates the simpler `account_closure_requests` table from 0031. The canonical allocation after the validated 0001–0035 chain is:

| PR #124 source file | Canonical destination | Treatment |
| --- | --- | --- |
| 0009_password_reset_tokens.sql | 0036_password_reset_tokens.sql | Preserve; single-use hashed recovery tokens |
| 0010_email_verification.sql | 0037_email_verification.sql | Preserve; mailbox verification is distinct from the legacy verified badge |
| 0011_password_reset_email_snapshot.sql | 0038_password_reset_email_snapshot.sql | Preserve; bind recovery tokens to the mailbox that received them |
| 0012_novel_ownership_transfers.sql | 0039_novel_ownership_transfers.sql | Preserve; consent-based transfer with guarded acceptance |
| 0013_chapter_updated_at.sql | none | Omit; canonical 0029_chapter_update_timestamps.sql already owns this column and lifecycle |
| 0014_account_deletion_requests.sql | 0040_account_deletion_requests.sql | Reconcile into the existing `account_closure_requests` ledger from 0031; rebuild/extend its statuses and review metadata rather than creating a second request table |
| 0015_account_deletion_review_store.sql | 0041_account_deletion_review_store.sql | Preserve; review records and immutable events |
| 0016_account_deletion_reviewer_roles.sql | 0042_account_deletion_reviewer_roles.sql | Preserve; explicit specialist roles, not inherited from admin |
| 0017_account_deletion_disposition_plans.sql | 0043_account_deletion_disposition_plans.sql | Preserve; immutable versioned plans |
| 0018_account_deletion_disposition_approvals.sql | 0044_account_deletion_disposition_approvals.sql | Preserve; independent approval bound to exact plan digest |
| 0019_account_deletion_specialist_findings.sql | 0045_account_deletion_specialist_findings.sql | Preserve; specialist-scoped immutable findings |

This allocation is a namespace and semantic reconciliation, not permission to execute account erasure. Migration 0040 rebuilds the one canonical `account_closure_requests` ledger with review-capable states and metadata; 0041–0045 reference that same request identity. The older `account_deletion_requests` table is deliberately not created, so the user-facing cooling-off request and specialist review cannot drift into two competing sources of truth. The deployment workflow remains disabled. Before any production use, the new migrations must pass fresh and upgrade fixtures, foreign-key/integrity checks, reviewer-role separation tests, and ownership-transfer concurrency tests. The PR #124 Worker/API changes must be ported onto the current security integration without replacing the Origin/Fetch-Metadata, route-method, project-owner, report-audit or admin-account safeguards already integrated from PR #172.

## Current-main reconciliation checkpoint (2026-11-04)

- `main` and PR #173 have byte-identical migration files 0001–0011 (verified by Git blob SHA for each file).
- PR #173 is the audited source of migrations 0012–0035. These 24 migration files have now been ported into the current-main route/security integration branch after confirming 0001–0011 are byte-identical to main. The complete 0001–0035 fresh replay and integrity gates are now in CI; no production D1 migration has been run.
- PR #173 is two commits behind current `main` and changes the Worker, browser bundle, deployment workflow, package metadata and many tests. Its branch must not be merged wholesale: it does not contain the current route-security safeguards ported from PR #172.
- The current-main route/security integration branch removed the unreachable duplicate legacy `POST /api/rating` handler, migrated the runtime/API/UI to whole-number 1–10 ratings, added the fresh-install and legacy-conversion migrations 0034/0035, and registered `scripts/test-rating-handler-canonical.mjs` plus `scripts/test-rating-migration.py`. Full CI is the remaining verification gate.
- The canonical migration chain includes a fresh-install baseline (0034), even-value conversion of legacy scores (0035), a uniqueness guard, and a dedicated SQLite rating-migration test. These are now wired into current-main CI and must pass alongside the full 35-migration replay before this integration branch is eligible for review.


Status: integration candidate; no production D1 migration has been run.

## Canonical sequence

The canonical media/account/Author Studio branch already owns migrations 0001–0027:

- 0012 user profiles
- 0013 username-change cooldown and history
- 0014 account preferences
- 0015 historical-username insert guard
- 0016 chapter revisions
- 0017 scheduled chapter publications
- 0018–0027 media, rights, comic, donation-review and payment safeguards

The community/reader/account-closure branch used overlapping branch-local numbers. The safe, independent migrations have been moved into new, globally unique slots:

| Former branch-local file | Canonical file | Treatment |
| --- | --- | --- |
| 0012_runtime_feature_schema.sql | 0028_runtime_feature_integrity.sql | Ported. Adds referential-integrity triggers, archives duplicate/orphan reports before cleanup, and keeps runtime-created tables compatible. |
| 0013_chapter_update_timestamps.sql | 0029_chapter_update_timestamps.sql | Ported. |
| 0014_reader_engagement_metrics.sql | none | Intentionally omitted: source file is comment-only and creates no schema. |
| 0015_daily_view_analytics.sql | 0030_daily_view_analytics.sql | Ported. |
| 0016_reading_positions.sql | superseded | The canonical Worker already provides cross-device reading positions with optimistic concurrency; do not create a second table contract. |
| 0017_ten_point_ratings.sql | 0034_ratings_baseline.sql + 0035_ten_point_ratings.sql | Ported with a fresh-install baseline, existing-table rebuild and even-value conversion from 1–5 to 1–10. Worker API, runtime schema, reader control, catalog thresholds and display regressions were updated together. |
| 0018_comment_reports.sql | none | Intentionally omitted: source file is comment-only; comment-report schema is owned by 0028. |
| 0019_account_closure_requests.sql | 0031_account_closure_requests.sql | Ported. |


## Author editorial workspace reconciliation

The Author Editorial Workspace branch also used branch-local migrations 0012–0015:

| Former branch-local file | Canonical treatment |
| --- | --- |
| 0012_chapter_revisions.sql | Omitted as a duplicate: byte-identical to canonical 0016_chapter_revisions.sql. |
| 0013_scheduled_chapter_publications.sql | Omitted as a duplicate: byte-identical to canonical 0017_scheduled_chapter_publications.sql. |
| 0014_author_story_goals.sql | Ported as 0032_author_story_goals.sql. |
| 0015_author_private_notes.sql | Ported as 0033_author_private_notes.sql. |

This resolves the filename collisions without replaying duplicate DDL or displacing account migrations 0014–0015. The application APIs/UI and their owner-isolation tests still need to be integrated and validated with these tables before the Author Editorial Workspace can be considered fully integrated.


## Author Studio application integration completed

The canonical account-security integration now includes the Author Editorial Workspace application layer, not just its tables:

- Owner-scoped GET/PUT writing-goal APIs with bounded integer/date validation, atomic ownership predicates and audit events.
- Private note list/create/update/delete APIs with owner/story/chapter checks, 4,000-character bounds and audit events.
- Deterministic story readiness checks based on recorded metadata, supported formats, rights evidence and actual chapter completeness. These checks do not certify literary quality, originality, legal rights or approval.
- Phone-first Author Studio panels for goals, chapter-linked private notes and editorial readiness, with planning-queue signals.
- Regression coverage registered in the standard build, including owner isolation and source/served bundle parity.
- Existing comic page manager and creator media library were preserved and revalidated alongside the editorial workspace.

Canonical migrations 0032–0033 back these features. Their API/UI/test integration passed the complete Cloudflare Source Validation, account identity CI and Graphify workflows on commit `358269534ec8ac00fcbdd3ab1b41a9d6c4fa7f52`.

## Confirmed schema collisions that must not be papered over

### Reading positions

The canonical runtime schema on the media branch creates `reading_positions` with one row per (user, novel), columns `percent` and `revision`, and optimistic-concurrency updates. The incoming branch migration defines a different table with one row per (user, novel, chapter), column `progress_percent`, and no revision token.

Both definitions cannot safely own the same table name. A simple migration-number rename would leave the Worker queries and database contract inconsistent. The incoming per-chapter feature must be ported to a separately named table (for example `reader_chapter_positions`) and its API/UI queries updated in the same change, or the canonical contract must be deliberately redesigned with a tested data migration.


### Duplicate reader-progress proposals

The design branch's `0013_reader_progress.sql`, the phase branch's `0016_reading_positions.sql`, and the separate `history.progress_percent` proposal all represent overlapping cross-device chapter-position persistence. The canonical Worker already has `reading_positions` with a revision token and server-side conflict detection. These competing tables/columns are intentionally retired from the migration plan; new Library progress displays should read the canonical position API rather than introduce another independently writable progress store.

### Ten-point ratings

The canonical Worker lazily creates `ratings` with a 1–5 CHECK constraint. The incoming migration rebuilds `ratings` for 1–10 but assumes that the table already exists, while a fresh D1 migration replay does not create it before the rebuild. The endpoint also currently validates 1–5 on the canonical branch. This feature requires a coordinated migration that supports both fresh and existing databases, plus API/UI/test changes to 1–10. It is not safe to port the SQL alone.


### Reader progress history field

A separate reader-progress PR proposed adding `history.progress_percent`. The canonical Worker already persists cross-device chapter progress in `reading_positions` with optimistic concurrency (`percent` and `revision`) and local recovery. Adding a second independently writable progress field would create two competing sources of truth. Keep the existing `reading_positions` API as canonical; if the Library needs a history percentage, derive it from that source rather than storing a second percentage on `history`.

## Release requirements

1. Run the full Cloudflare Source Validation workflow against this branch, including fresh SQLite replay and migration integrity checks.
2. Add legacy-schema upgrade fixtures for runtime-created community tables, including duplicate and orphan reports.
3. Add a legacy-schema fixture for existing `reading_positions` and prove the new per-chapter table does not overwrite or reinterpret it.
4. Add fresh-install and existing-install fixtures for the ratings transition before enabling ten-point ratings.
5. Verify `PRAGMA integrity_check` and `PRAGMA foreign_key_check`.
6. Review the exact remote D1 migration ledger and take a recoverable backup before any production migration.
7. Deploy only through the explicitly approved production release workflow.

The ten-point rating implementation and fresh/legacy SQLite migration tests exist on PR #173, but they are not yet integrated into the current-main route/security integration branch. The duplicate legacy POST /api/rating handler has been removed on the current integration branch; the active Worker schema and API remain 1–5 until migrations 0012–0035 and the complete ten-point UI/API/schema/test set are reconciled together. This register is a source-level integration plan only. No production D1 migration has been run and no production Worker deployment is authorized by this work.


## Pull-request integration collision audit (2026-11-04)

### PR #124 versus the current canonical security integration

PR #124 remains **blocked from direct merge**: GitHub reports the branch as dirty against current `main`, and the branch contains 307 commits. Its 0009–0019 migration filenames collide with the already sequenced chain. The migration mapping above is not a filename-only rename:

- The password-reset token, email-verification, email-snapshot, ownership-transfer and reviewer-role migrations are byte-identical to canonical destinations 0036, 0037, 0038, 0039 and 0042 respectively.
- The old 0013 chapter timestamp migration is superseded by 0029. The canonical migration also adds edit-time timestamp maintenance and an index, so the old migration must not be replayed.
- The old 0014 deletion migration creates a second `account_deletion_requests` ledger. Canonical 0040 instead upgrades `account_closure_requests` created by 0031. Canonical 0041, 0043, 0044 and 0045 were adapted to reference that canonical ledger. Do not restore the old table or foreign keys.
- The 0015 review-store migration differs specifically in its foreign-key target and active-request statuses. The 0017–0019 specialist workflow migrations likewise reference the old request table on PR #124 but the canonical closure table in 0043–0045.

The account export, deletion-review APIs/UI and ownership-transfer APIs are not all present in the current route-registry Worker snapshot. Their migration presence does not mean those API features are integrated. Port those handlers separately against the canonical `account_closure_requests` schema and current authorization middleware; do not merge the old `src/index.js` wholesale.

### PR #173 versus PR #185

PR #173 (profile/account/reader/media consolidation) and PR #185 (current-main route registry/security audit) share 434 tracked paths in their branch trees; 32 shared paths have different Git blob IDs. The collision set includes the Worker entrypoint, both browser application bundles, HTML shell, package manifests/lockfile, deployment and Cloudflare workflows, Wrangler configuration, rating/runtime policy modules, and multiple regression tests.

The branches are not interchangeable and must not be merged by choosing one side for every conflict. PR #173 contains the consolidated product/runtime work and canonical migrations 0012–0035; PR #185 contains the current-main route inventory and the later security/route audit. A release candidate must port the route registry and audit onto the integrated PR #173 Worker, then regenerate the Worker source fingerprint and rerun authorization, route-method, build, migration and browser-bundle checks. Preserve the product behavior from PR #173 while reconciling the current-main route/security safeguards. Neither PR alone proves that combined result.

### PR #171 versus PR #186

PR #171 (older design plus homepage SSR integration) and PR #186 (design foundation ported onto current main) share 408 tracked paths; 13 shared paths have different blob IDs. The differing set includes `src/index.js`, `public/app.js`, versioned application/design bundles, `package.json`, deployment workflow and design/production regression tests.

PR #186 deliberately preserves the current-main Worker and ports the six-theme design foundation without importing the older SSR Worker. PR #171 contains the homepage SSR implementation and additional rating/reader-progress changes, but its Worker and migration context are stale relative to current main. Do not merge PR #171 wholesale or overwrite PR #186's current-main Worker. If homepage SSR is still required, port the SSR module and route integration as a separate, source-reviewed change, reconciling route ownership, ratings, metadata, cache behavior and private-route noindex tests first.

### Merge-safety rules

1. Never resolve a source/Worker conflict by taking an entire branch version without reviewing its route and security changes.
2. Never replay branch-local migrations when an identical or semantically superseding canonical migration already exists.
3. A schema migration being present does not prove its API/UI integration is present.
4. Recompute source fingerprints only after the relevant handlers have been reviewed; never update the hash merely to silence a test.
5. Keep production D1 migrations and Worker deployment gated. These are source integration decisions only; no production database or live deployment is authorized by this register.


### Reader stack PRs #153–#155 versus canonical reading-position storage

PR #153 (`feature/reader-progress-sync-17-46`) is stacked on #152 and proposes a second progress store:

- It adds `migrations/0016_reader_progress_sync.sql`, altering `history` with `progress_percent`. This filename directly collides with canonical PR #173's `0016_chapter_revisions.sql`.
- It changes `GET /api/history` and `POST /api/history` to persist and return `history.progress_percent`, and changes the reader to send progress through the history endpoint.
- Its test expects progress writes to require a published novel/chapter and an unlock record. The current #173 `POST /api/reading-position` instead writes to `reading_positions`, uses `percent` and optimistic `expected_revision`, and checks publication status. The handler as inspected does not itself check whether the chapter is free or unlocked.
- PR #173's reader already loads `/api/reading-position?novel_id=...`, restores the canonical `reading_positions` record, throttles saves, and handles HTTP 409 revision conflicts. The two client implementations are not drop-in compatible.

**Resolution:** do not take PR #153's migration or its `history.progress_percent` API changes. Keep `reading_positions` as the sole durable progress store. Port only independently useful reader behavior after comparing it with the #173 reader, and adapt library/history progress display by joining or separately reading canonical `reading_positions`; do not add a duplicate percentage column to `history`. Preserve local storage only as an offline/recovery fallback, not as a competing server source.

**Additional authorization gap to close before release:** the inspected #173 `POST /api/reading-position` validates that the novel and chapter are published, but does not check that the chapter is free or unlocked by the authenticated reader. Before enabling this route, add a server-side entitlement predicate consistent with the chapter-content endpoint (free/public access or a matching user unlock), and tests proving a locked, unpurchased chapter cannot be used to write a reading position. Do not copy PR #153's exact SQL blindly; reconcile its entitlement check with the canonical chapter access rules and free-chapter policy.

PR #154 (reader accessibility) changes the same two browser bundles and adds a source-level accessibility test. Its test and UI changes should be reviewed and ported independently after the reader-progress implementation is unified; do not let its branch base reintroduce PR #153's duplicate schema. PR #155 (library controls) also changes those bundles and extends the library localization test with bookmark removal, progress display, whole-number rating and empty-state assertions. These library controls are useful candidates, but the progress display must read the canonical position source and the bookmark delete action must remain user-scoped and authenticated.

The stack remains ordered #152 → #153 → #154 → #155. It is not safe to merge #154 or #155 as-is merely because their own diffs are small: their base includes #153. Rebase/port the independent accessibility and library-control behavior onto the consolidated reader only after the canonical reading-position contract and entitlement guard are settled. No migration from #153 is approved.


### Homepage/discovery stack PRs #146–#149 versus current-main foundations

The live PR metadata confirms the stack is still based on the older design branch rather than current main: #146 targets `feature/imperial-design-architecture-seo` (PR #120), #147 targets #146, #148 targets #147, and #149 targets #148. PRs #146 and #147 currently report `mergeable=false`; #148 and #149 report `mergeable=true` only relative to their immediate stacked bases, not as proof that the complete stack is compatible with current main.

- **#146 homepage lifecycle/SSR:** adds `src/homepage-ssr.mjs`, modifies `src/index.js`, both app bundles, the HTML shell, and `public/imperial-design-foundation.css`; it also adds a homepage-specific workflow and SSR/discovery tests. The SSR renderer escapes text, validates cover URLs and renders a small server-side homepage shell. The Worker injects its header and replaces the `main#app` contents in the HTML response. This must be reconciled with #186's current-main design foundation and #185's route/security Worker, not merged as a whole. Validate that SSR and client hydration do not duplicate the header, navigation, or homepage content; confirm the actual HTML shell shape and cache/noindex behavior for every route.
- **#147 period-correct rankings:** changes the Worker, both browser bundles and package scripts, and adds a focused leaderboard regression test. Port the ranking query and test independently onto the reconciled Worker; do not take its Worker entrypoint or app bundle wholesale.
- **#148 reader request history:** changes the `GET /api/requests` response to include a bounded request-history list alongside the current weekly usage count. The inspected query scopes rows with `WHERE user_id=?` and limits the history to 20 records. Preserve that user-scoped predicate and test cross-account isolation when porting it; its branch inherits #146/#147.
- **#149 catalog taxonomy/search and related recommendations:** adds separate parameterized search and recommendation policy modules, modifies the Worker and both bundles, and adds author-discovery, rights-filtering, search, rating-display and recommendation tests. The search policy caps terms at eight, escapes SQL LIKE wildcards, searches metadata plus taxonomy and uses correlated `EXISTS` clauses. Recommendation candidates are limited to published, rights-cleared works and exclude works already followed/read by the user. Port the policy modules and their tests as isolated units, then reconcile their SQL/schema assumptions with the canonical migrations and current route registry. Verify query plans and pagination on representative data before release.

**Resolution:** treat #146–#149 as a feature stack to port in order, not merge directly from the old #120 base. First reconcile #146's SSR/design changes with #186 and #185. Then port #147 rankings, #148 private request history, and #149 taxonomy/recommendation policies one at a time, running their focused tests and the full Worker/migration/SEO/browser suite after each integration. Do not update route fingerprints until the final Worker source is stable.

### Localization stack PRs #131–#145

The PR graph confirms a cumulative dependency chain, not a set of independent patches: #131 is based on the author/editor workspace branch; #132 → #133 → #134 → #135 → #136 → #137 → #138 → #139 → #140 → #141 → #142 → #143 form the localization stack; #145 (homepage and navigation accessibility localization) is based on #143. PR #144 is closed and is a duplicate/alternate account-settings localization branch, so do not revive or merge it independently.

The file lists show repeated edits to the same `public/app.js` and `public/app-17.24.0.js` bundles throughout the chain. PRs #131–#135 also repeatedly modify the same Cloudflare validation workflow and catalog-language-discovery test. Later PRs each add or extend page-specific localization tests for community, rankings, reader profile, account settings, author studio, library, and homepage/navigation. This means taking a later PR's app bundle without its entire dependency chain can silently drop earlier translations or page wiring.

**Resolution:** port the chain in dependency order onto the consolidated application bundle, preserving all 14 locale dictionaries and the rule that creator-authored chapter text is not automatically translated. Reconcile the final bundle with #173's profile/account/reader runtime and #186's design assets. Keep the language selector and RTL behavior independently tested, including Urdu, Arabic and Persian chapter content; do not assume interface localization changes authored content direction or translation. Re-run every page-specific localization test plus source/served bundle parity after the final bundle is assembled.


### Clarification: reading-position entitlement finding

A deeper inspection of #173's actual Worker handlers narrows the earlier note about chapter entitlements:

- `GET /api/chapters/:id` returns chapter content only when the chapter is free, the requester is an admin, or the authenticated user has a matching row in `unlocks`. For a locked chapter without an unlock, the response sets `content: null`.
- `POST /api/reading-position` checks authentication, positive IDs, chapter/percentage/revision bounds, and that the chapter and novel are published. It writes only the authenticated user's own `reading_positions` row and uses optimistic revision control. It does **not** return chapter content and does **not** debit or grant Crowns.
- Therefore, the missing unlock predicate is **not a demonstrated chapter-content disclosure or entitlement bypass**. It is a potential product-integrity inconsistency: a client can record a position for a locked chapter it could not read. This should be a deliberate policy decision, not described as a confirmed security vulnerability.

**Corrected resolution:** before adding an entitlement predicate, decide whether reading-position records represent (a) a genuine reading cursor, in which case only free or unlocked chapters should be accepted, or (b) a user-selected resume/bookmark target, in which case any published chapter may be stored. If policy (a) is chosen, add a predicate allowing free chapters or a matching `unlocks(user_id,chapter_id)` row, and test both cases plus cross-user isolation. If policy (b) is chosen, retain the current published-chapter check and document that position metadata is not proof of access. In either case, the chapter-content endpoint remains the actual entitlement enforcement boundary. Do not weaken that endpoint or infer unlock status from client-supplied fields.


### Catalog search schema compatibility check

A source-level compatibility check against #173's canonical Worker confirms the #149 search/recommendation policy's referenced core tables and metadata fields are present in its core schema: `novels.alt_titles`, `genres`, `tags`, `novel_genres`, and `novel_tags`. The #149 policy's primary SQL references therefore do not require a new migration for those structures. This is a static schema check only; the port still needs SQLite execution tests against a clean canonical migration/bootstrap database, including empty taxonomy, multiple matching tags/genres, escaped LIKE wildcards, pagination, and a reader with no follow/follow-history seeds.

### Validation after collision-register updates

The documentation commits `28466830` and `5d8756f6` each received successful Cloudflare Source Validation, Route Registry validation, and Graphify architecture-map workflow runs. The most recent confirmed run set is on `5d8756f6`. These workflows validate the integration branch's current Worker/route/migration guardrails; they do not certify the unported PR feature stacks or a live production deployment.
