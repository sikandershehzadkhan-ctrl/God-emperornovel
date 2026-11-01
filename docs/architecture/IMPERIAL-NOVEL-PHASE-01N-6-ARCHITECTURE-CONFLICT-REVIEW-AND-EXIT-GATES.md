# Imperial Novel | Phase 01N.6: Architecture Conflict Review & Exit Gates

**Review date:** 2026-11-01  
**Repository:** `sikandershehzadkhan-ctrl/God-emperornovel`  
**Review ref:** `architecture/phase-01m-screen-blueprint`  
**Status:** Architecture review record. No implementation or production action authorized.

## 1. Executive decision

The architecture is **not ready to exit into broad implementation**. The domain blueprints are substantial, but the repository evidence exposes unresolved conflicts in migration ownership, branch integration, API permissions, route metadata, and release validation.

The most serious blocker is the migration model:
- The numbered migration directory contains an actual sequence gap: migration 0012 is absent on this branch, while migrations 0014 and 0018 explicitly delegate feature-table ownership to it.
- Runtime schema helpers still create or alter many of the same objects as numbered SQL migrations, so there are competing schema authorities.
- Migration 0004 adds novels.publication_status before migration 0010 creates published-catalog indexes.
- Migration 0005 adds chapters.publication_status before migration 0013 creates chapter timestamp triggers and indexes.
- Migration 0003 creates the initial ratings table with a 1–5 CHECK before migration 0017 rebuilds it for integer ratings 1–10.
- The deployment workflow's production preflight assumes publication_status and other base structures already exist, then applies only migrations 0009–0011. It is not a clean-install test of the full migration directory.

The evidence does not establish that migrations 0010, 0013 or 0017 necessarily fail when the full available sequence is applied in order. The confirmed blockers are the missing 0012 migration artifact, runtime/migration schema divergence, and lack of a proven clean-install plus supported-upgrade test.

**Decision:** Do not implement new schema-dependent features or run production migrations until one canonical schema bootstrap and supported upgrade path are proven.

## 2. Branch and source-of-truth reconciliation

The repository contains multiple active branches for design, fixes, feature work, deployment audits and documentation. GitHub compare results on the review date showed:
- `main` is an ancestor of `feature/imperial-design-architecture-seo` in the compared history, with the feature branch 500 commits ahead of main.
- `architecture/phase-01m-screen-blueprint` is 30 commits ahead of `feature/imperial-design-architecture-seo` in the compared history.
- All three package manifests inspected report version `17.23.0`.

Commit distance and matching package versions do not prove that every branch's code, tests, migrations or deployment workflow is identical. The architecture branch must not be treated as automatically equivalent to the currently intended production source.

Before implementation:
1. Select one canonical integration base commit.
2. Compare every candidate branch by file-level diff, not package version.
3. Reconcile changes in `src/index.js`, `public/app.js`, CSS/assets, migrations, `wrangler.toml`, tests and workflows.
4. Identify the intended production release branch and deployment workflow.
5. Record the immutable SHA used for the final architecture-to-implementation handoff.

Do not merge the architecture branch or any feature branch merely because its documentation is complete.

## 3. Confirmed conflict register

| ID | Conflict | Evidence | Risk | Required resolution |
|---|---|---|---|---|
| C-01 | Runtime and migration schema ownership overlap | Runtime helpers add publication, engagement, AI and other schema also represented in SQL; 0004/0005/0003 satisfy the later 0010/0013/0017 prerequisites in the numbered sequence | Schema drift and environment-dependent behavior | Consolidate schema authority and test full clean/upgrade paths |
| C-02 | Ratings schema is defined in both migration and runtime bootstrap | Migration 0003 creates ratings with a 1–5 constraint; runtime core creates it with a 1–10 constraint; migration 0017 rebuilds the migration baseline to 1–10 | Different starting states may skip or repeat conversion assumptions | Define one canonical baseline and upgrade path; preserve existing rating rows |
| C-03 | Runtime feature migration ownership is unresolved | 0014/0018 comments refer to 0012, but 0012 file is absent on audited branch | Missing community tables/indexes on clean install | Decide whether 0012 belongs in canonical migration history and restore/test exact artifact |
| C-04 | Deployment workflow migration scope differs from repository migration inventory | Workflow confirmation text describes 0009–0011; preflight globs every SQL migration; later files 0013–0018 exist | Preflight/deploy semantics diverge | Make workflow migration inventory explicit and prove exactly what is applied |
| C-05 | Runtime schema version and package version are independent but not fully governed | core marker observed at 16.64.0; package is 17.23.0 | False compatibility assumptions | Define DB schema version and app compatibility policy |
| C-06 | Multiple runtime schema helpers write DDL | Core, publishing, feature, OmniPortal, AI, analytics, taxonomy and donation helpers | Hidden request-time DDL, drift and race conditions | Inventory every DDL statement/call site and migrate to canonical ownership |
| C-07 | Coarse admin/author guards do not equal domain permissions | `admin(u)`, `author(u)`, `need(u)` | Privilege overreach/IDOR risk | Endpoint-level permission and resource ownership tests |
| C-08 | Audit helper suppresses persistence errors | Audit insert failure is caught and ignored in observed helper | Consequential actions may proceed without durable audit | Define fail-closed policy for high-risk operations |
| C-09 | Client, Worker HTML and sitemap route definitions are separate | pathname dispatch, HTML route map, crawler metadata and sitemap generation | Broken deep links, duplicate canonical pages, noindex gaps | Create a generated/validated route registry |
| C-10 | Architecture master index has a duplicated 01M.5 entry and misleading self-link for 01M.1 | Repeated 01M.5 line; 01M.1 points to the master document itself | Navigation/document control ambiguity | Correct index links and separate master index from 01M.1 specification |
| C-11 | Real-time language risks overstating polling | Notification polling observed; no push transport established | Misleading “live” UI and stale metrics | Use freshness vocabulary and explicit transport contracts |
| C-12 | Production status is not established by branch evidence | No production D1 query, deployment execution or live route verification in this audit | Incorrect release claims | Require immutable release identity and production smoke evidence |

## 4. Migration chain: required resolution sequence

Do not patch the first failing SQL statement and stop. The full ordered set must be tested.

### 4.1 Inventory
- List every migration filename and checksum on the canonical release branch.
- Confirm the sequence gap at 0012 and resolve its ownership before treating 0014/0018 as complete.
- Extract all CREATE TABLE, ALTER TABLE, indexes, triggers, foreign keys and CHECK constraints from migrations.
- Extract all runtime schema DDL and all call sites.
- Compare the actual resulting schema objects with every SQL query's table/column references.
- Compare migration history and schema structure in a non-production D1 fixture.

### 4.2 Establish a deterministic bootstrap
- A new database must be constructible from numbered migrations alone.
- Upgrade paths from supported historic production states must be explicit.
- Do not rewrite already-applied migrations.
- Avoid conditional DDL that silently hides partial or incompatible structures.
- Runtime request handlers must not be responsible for creating domain tables or columns.
- D1 migration history is authoritative; any compatibility marker must be derived/validated, not an independent truth source.

### 4.3 Reproduce and prove
- Run all migrations in lexical order on a clean SQLite database.
- Run all migrations on a clean D1 test database.
- Test the actual supported production upgrade baseline.
- Test data preservation for ratings, users, novels, chapters, comments, ledger entries and reading positions.
- Verify indexes, triggers, constraints and foreign keys after each path.
- Confirm repeat/deploy behavior and interrupted migration recovery.

Only after these gates pass may a schema implementation plan be approved.

## 5. API and permission exit requirements

The 01N.2 matrix is a first-pass classification, not an exhaustive authorization proof. Before implementation:
- enumerate every Worker route and method from source;
- extract full handler branches and helper-level authorization;
- record public/authenticated/service/staff classification;
- prove owner-scoped reads and writes;
- test all numeric ID routes against cross-account access;
- identify sensitive response fields and cache policy;
- define state transitions, idempotency and transaction boundaries;
- make high-risk audit failure behavior explicit;
- map each staff role to narrow permissions and resource scopes;
- require dual control for financial, rights and role/security operations where appropriate.

No UI-hidden route may be considered protected without a server-side check.

## 6. Route, SEO and content-truth exit requirements

- One route registry must reconcile browser client, Worker HTML mapping, redirects, canonical URLs, sitemap, robots and route tests.
- Preserve stable existing deep links until a tested compatibility migration exists.
- Separate public author profiles from private Author Studio.
- Confirm direct production resolution for `/become-an-author`.
- Index only published, rights-eligible, canonical content.
- Mark private, personal, search-query and admin routes noindex.
- Structured data must match visible page content and verified records.
- AEO/GEO must use useful, attributable information, not generated FAQ spam or unsupported rankings.
- Ratings are whole integers 1–10; missing metrics must remain unavailable, never become fake zeros.
- Locale alternates and RTL claims require actual translated content and layout coverage.

## 7. Real-time and analytics exit requirements

- D1 is authoritative for business state.
- Polling, scheduled jobs and push are distinct transport classes.
- Every displayed metric has a definition, source, time window, deduplication rule and freshness timestamp.
- Raw request counts are not unique readers.
- Chapter opens are not chapter completions.
- Provider configured state is not provider health.
- Payment attempt is not verified payment or ledger credit.
- No online-presence claim without a privacy-reviewed presence implementation.
- Push, if later introduced, carries minimal event references and is not the source of truth.

## 8. Design and mobile exit requirements

The design architecture must be converted into measurable page-level acceptance tests:
- Imperial Purple, Pure White, Sapphire Blue and Obsidian Black remain the core visual system.
- Avoid gold-heavy, rainbow, generic anime and casino-like styling.
- Keep the black-sun/empty-throne identity restrained and recognizable.
- Define tokens for surfaces, typography, spacing, radii, elevation, focus, motion and states.
- Verify the 320px–374px compact width before larger breakpoints.
- Test eye comfort, contrast, reader line length, font scaling, reduced motion and RTL.
- Prevent black/blank screens on refresh and direct deep links.
- Measure LCP, INP, CLS and memory behavior on representative low-end Android hardware.
- Design targets are not reported as achieved until measured.

## 9. Release governance

- Architecture branch is not a production release branch.
- No migration is run on production during architecture review.
- No production Worker deployment is triggered by branch update or PR merge.
- Release must bind commit SHA, build artifact, migration set, Worker deployment ID, D1 migration state and smoke-test results.
- Verify served HTML and asset hashes when the live site appears unchanged.
- A workflow success message alone is not proof that the intended UI is live.
- Rollback decisions must account for forward-only D1 schema changes and financial/content data.

## 10. Architecture exit checklist

Architecture may be marked ready for implementation only when every item below has an owner, evidence and acceptance test:

- [ ] Canonical source branch and immutable base SHA selected.
- [ ] Branch diffs reconciled across app source, styles, assets, migrations, tests and workflows.
- [ ] Full D1 schema inventory and migration history documented.
- [ ] Clean-install and all supported upgrade paths pass.
- [ ] Runtime DDL ownership fully reconciled.
- [ ] Route registry covers client, Worker, SEO, sitemap and robots.
- [ ] Every API method has an authorization and side-effect contract.
- [ ] Resource ownership and IDOR tests are defined.
- [ ] Staff permissions and separation of duties are approved.
- [ ] Financial ledger/payment state machine and rights state machine are approved.
- [ ] Real-time transport and freshness semantics are defined per surface.
- [ ] Metric definitions and truthful fallback behavior are approved.
- [ ] Localization, RTL and accessibility acceptance tests are complete.
- [ ] Mobile visual/performance budgets are testable.
- [ ] Legal, privacy, content rights and provider authorization gates are complete.
- [ ] Manual production release and recovery procedure is validated.
- [ ] Master architecture index and document links are corrected.
- [ ] Implementation sequence is prioritized by dependency and risk.

## 11. Recommended implementation order after architecture approval

1. **Schema and release foundation:** canonical migrations, environment compatibility, test fixtures, release identity.
2. **Identity and authorization:** sessions, account safety, resource ownership, staff permissions, audit.
3. **Route and design foundation:** route registry, design tokens, shared shells, mobile navigation and error states.
4. **Catalog and reader:** truthful metadata, search/discovery, reading progress, access controls and performance.
5. **Creator and publishing:** author onboarding, editor, revisions, rights review and publication workflow.
6. **Community and notifications:** reviews, comments, moderation, follows and persisted notifications.
7. **Commerce:** Crown ledger, tickets, manual payment review and author earnings, only after financial controls.
8. **OmniPortal and Trend Factory:** provider rights, metadata provenance, review queues and safe jobs.
9. **Localization, accessibility and SEO/AEO/GEO:** verified locale coverage and canonical public content.
10. **Admin, agents and operations:** least privilege, audit, incident workflows, measured automation.
11. **Production verification:** mobile tests, smoke suite, staged release and post-deploy evidence.

This is a dependency order, not an estimate of completion or a claim that any feature is already implemented.

## 12. Final decision

**Architecture status: NOT YET APPROVED FOR IMPLEMENTATION.**

The next work must close the migration/schema blocker and reconcile the canonical branch. Once those are proven, the architecture can be signed off domain by domain and implementation can begin without guessing at production schema or merging incompatible branch histories.

No application code, migration, production database, Worker setting, secret, branch protection rule, pull request or deployment was changed by this review.


## 13. Follow-up branch inspection: community schema candidate

A separate branch, `fix/community-schema-foundation-001`, contains a candidate `migrations/0012_runtime_feature_schema.sql` and `scripts/test-community-schema-integrity.py`. This explains why migrations 0014 and 0018 refer to migration 0012 even though that file is absent from the reviewed architecture branch.

GitHub compare reports this candidate branch as divergent from the architecture branch (20 commits ahead and 534 behind in the comparison). It is therefore **not integrated evidence** and must not be copied or merged wholesale.

The candidate migration has useful design work:
- creates auth rate-limit, comment-like/report, novel-reaction and request-vote structures;
- adds referential-integrity behavior for legacy tables;
- archives duplicate/orphan comment reports before cleaning the active table;
- provides an idempotency/integrity test for a legacy pre-existing community schema.

Additional review is mandatory before adoption:
1. Its test starts from a deliberately constructed legacy schema, not a fully clean database with every numbered migration applied.
2. It performs data cleanup and archives rows. The archive mapping, retention, uniqueness and foreign-key semantics require explicit approval and fixture coverage.
3. It still does not supply the missing publication-status prerequisite for migration 0010/0013.
4. It does not establish that the `ratings` table exists before migration 0017.
5. The runtime helper and SQL migration must not remain competing schema authorities after the transition.
6. The candidate branch's source and workflow changes must be reconciled against the selected canonical release commit.

**Decision:** Treat migration 0012 as a valuable candidate artifact requiring review, not as an approved fix. The full ordered migration set remains unproven.

## 14. Updated migration blocker severity

The schema blocker is classified as **critical / release-blocking** because migration and runtime ownership diverge. The numbered chain already includes publication columns in 0004/0005 and a ratings baseline in 0003. At minimum, the migration sequence must account for:
- the missing 0012 community feature migration referenced by 0014/0018;
- equivalent runtime and migration definitions for publication, ratings and community features;
- safe 1–10 rating constraint conversion with preservation of existing rows;
- all runtime-created core, OmniPortal, AI, analytics, taxonomy and donation objects;
- legacy data preservation during deduplication and table rebuilds.

No production D1 state was queried and no candidate branch was merged.
