# Imperial Novel platform completion register

**Product:** Imperial Novel  
**Motto:** Read • Create • Conquer  
**Baseline:** `main` at `96038d518243e13511f76187ebd65ac27c5dc55b` (4 November 2026 audit)  
**Purpose:** Ordered implementation and release gates from small interface details to platform-wide operations.

This register is a work plan, not a claim that listed capabilities are implemented, tested, or deployed. Update each item only when source, automated tests, and (where applicable) production behavior support the status.

## Release truth rules

- A route existing is not proof that its screen works.
- A UI control is not complete until its API, authorization, persistence, failure state, and tests work.
- A merged PR is not a production deployment.
- A successful deployment is not proof that the live user journey works.
- Never invent catalogue counts, ratings, users, readership, earnings, or uptime.
- Keep payments disabled until a real provider, merchant approval, webhook verification, refunds, reconciliation, and legal requirements are satisfied.
- Keep external-content connectors disabled until the rights evidence and permitted use are recorded.
- Do not run unreviewed D1 migrations against production.

## 0. Micro-quality and consistency

- [ ] Every interactive control has a real action or is clearly disabled.
- [ ] Every form has labels, validation, pending, success, and recoverable error states.
- [ ] Preserve entered data after recoverable errors.
- [ ] Add empty, loading, partial-data, offline, and retry states to every major screen.
- [ ] Keyboard focus, accessible names, Escape behavior, and 44px mobile targets are consistent.
- [ ] Reduced-motion preference is respected.
- [ ] No horizontal overflow at 320 CSS pixels; test narrow Android screens.
- [ ] Images have useful alternative text, stable dimensions, and optimized formats.
- [ ] No fake ratings, placeholder metrics, dead links, or misleading status labels.
- [ ] Localized strings do not overflow; Urdu, Arabic, and Persian are independently verified RTL.
- [ ] Reader content direction does not incorrectly reverse global navigation.
- [ ] Theme tokens remain semantic across Light, Dark, Midnight, Sepia, Imperial, and Cosmic.

**Gate:** component checks plus real mobile viewport and keyboard review.

## 1. Navigation, routes, and public discovery

- [ ] Reconcile the route registry against every actual page and API method.
- [ ] Confirm each route has one intended screen, access policy, canonical URL, and not-found behavior.
- [ ] Confirm personalized pages and private account routes are noindex.
- [ ] Validate canonical URLs, metadata, Open Graph, robots, sitemap, structured data, and pagination.
- [ ] Ensure sitemap includes only public, published, rights-eligible works and chapters.
- [ ] Verify search filters, sorting, pagination, and empty results reflect actual backend queries.
- [ ] Verify genre, tag, format, language, status, and content-warning taxonomy consistency.
- [ ] Add abuse-resistant search limits and safe query handling.

**Gate:** route/API inventories, SEO regression suite, and anonymous-user browser checks.

## 2. Reader and library

- [ ] Finish reading progress persistence and cross-device synchronization.
- [ ] Verify bookmarks are created only after explicit reader action.
- [ ] Complete library shelves, reading history, follows, and remove/undo behavior.
- [ ] Verify reader settings persist independently from site theme where intended.
- [ ] Complete chapter navigation, previous/next, table of contents, and resume behavior.
- [ ] Add reliable offline/PWA behavior only after cache invalidation, rights constraints, and storage limits are tested.
- [ ] Verify comic/image-page reader loading, ordering, accessibility, and failed-page recovery.
- [ ] Verify private history and progress never leak through public profile or API projections.

**Gate:** multi-account D1 tests, reader journey tests, and low-end Android performance review.

## 3. Profiles and account identity

- [ ] Integrate profile and account branches only after migration reconciliation.
- [ ] Confirm private-by-default profile visibility and field-level public projection.
- [ ] Verify profile editing, URL validation, avatar policy, biography limits, and unsaved-change handling.
- [ ] Verify username uniqueness, cooldown, historical-name protection, and registration collision behavior.
- [ ] Verify password change, re-authentication, session listing/revocation, and sign-out.
- [ ] Add email verification/reset only when a reliable delivery provider is configured.
- [ ] Add account export, deletion cooling-off, re-authentication, and creator ownership safeguards.
- [ ] Keep private email, role, session data, wallet/ledger data, and reading history out of public responses.

**Known integration blocker:** the account feature branch audit recorded duplicate migration payloads and a historical-username registration gap. A case-insensitive database insert guard and regression tests are required before that branch is release-ready.

**Gate:** migration rehearsal, privacy projection tests, and multi-user isolation tests.

## 4. Author Studio

- [ ] Reconcile chapter revision, scheduled publication, author goals, private notes, and reader-progress migrations against the real main migration head.
- [ ] Complete story creation and editing with ownership checks on every operation.
- [ ] Complete chapter editor, draft save, revision history, restore, and conflict handling.
- [ ] Make autosave state truthful: local, remote-saved, saving, failed, or unsaved.
- [ ] Complete scheduling with a reliable publication job and explicit failure/retry handling.
- [ ] Complete rights declaration, provenance, attribution, and content-warning workflows.
- [ ] Complete author dashboard with real, privacy-safe analytics.
- [ ] Ensure AI remains optional, owner-scoped, rights-aware, and disabled without configured provider credentials.
- [ ] Add export and creator-continuity safeguards before account deletion or ownership transfer.

**Gate:** author-owned data tests, migration rehearsal, editor recovery tests, and scheduled-job tests.

## 5. Catalog, rankings, and discovery

- [ ] Complete search relevance and filter composition.
- [ ] Ensure weekly/monthly rankings use correct time windows and verified activity.
- [ ] Ensure recommendation pages are private/noindex when personalized.
- [ ] Distinguish editorial shelves, popular lists, reader votes, and actual competitions.
- [ ] Add transparent recommendation explanations and user controls.
- [ ] Add deduplication across shelves without hiding legitimate works.
- [ ] Add cold-start and empty-catalog behavior without fabricated popularity.
- [ ] Add reader-driven tier tournaments only with eligibility, anti-brigading, rate limits, and auditable vote rules.

**Gate:** deterministic ranking fixtures, privacy tests, and abuse simulations.

## 6. Community and moderation

- [ ] Complete discussion feeds, comments, ratings, and review visibility rules.
- [ ] Add collections, polls, awards, and reader tournaments as real persisted features.
- [ ] Add reports with status, moderator notes isolation, audit trail, and appeal path.
- [ ] Add block, mute, and user-controlled notification preferences.
- [ ] Add anti-spam, rate limits, duplicate detection, and new-account abuse controls.
- [ ] Ensure deleted/hidden content cannot reappear in alternate feeds or cached responses.
- [ ] Escape and length-bound all user-generated content.
- [ ] Do not expose reply, upload, or notification controls until the full workflow exists.

**Gate:** role/ownership tests, abuse tests, moderation workflow review, and mobile UX checks.

## 7. Admin, rights, and trust

- [ ] Verify role boundaries for owner, admin, author, and reader on every API and UI action.
- [ ] Prevent removal or suspension of the last active administrator.
- [ ] Audit sensitive admin actions with actor, target, timestamp, and safe details.
- [ ] Complete reports, user moderation, content review, and appeals.
- [ ] Complete rights evidence and provenance records for text, covers, comics, and other media.
- [ ] Add DMCA/copyright complaint intake, counter-notice handling where legally applicable, repeat-infringer policy, and documented response workflow.
- [ ] Add privacy policy, terms, community rules, cookie/storage disclosures, and age/content policy review.
- [ ] Keep OmniPortal and external content ingestion disabled until rights approval is evidenced.
- [ ] Ensure no external chapter-body ingestion is used for trend analysis or AI training.

**Gate:** authorization matrix, rights review, audit-log tests, and documented operational procedures.

## 8. Payments and creator economy

- [ ] Keep all live payment collection disabled until provider and merchant onboarding are legitimate and approved.
- [ ] Define a ledger as the source of truth; never trust client balances.
- [ ] Implement signed webhook verification, idempotency, reconciliation, refunds, and dispute handling.
- [ ] Separate purchased credits, promotional credits, and non-cash platform points.
- [ ] Verify ticket pricing, purchase disclosures, and refund terms before enabling checkout.
- [ ] Add creator earnings only with transparent calculations, thresholds, tax/legal review, and a sustainable payout provider.
- [ ] Add abuse/fraud monitoring and immutable ledger audit trails.
- [ ] Do not expose personal payment account details or promise unsupported payout methods.

**Gate:** provider sandbox tests, ledger invariants, webhook replay tests, and legal/merchant approval.

## 9. Operations, resilience, and production

- [ ] Establish a single authoritative D1 migration ledger and migration rehearsal process.
- [ ] Verify backup creation, retention, restore drills, and documented recovery objectives.
- [ ] Verify Cloudflare Worker bindings, environment variables, secrets, and least-privilege access.
- [ ] Add health checks, error monitoring, privacy-safe logs, and actionable alerts.
- [ ] Add performance budgets for JavaScript, CSS, images, API latency, and Core Web Vitals.
- [ ] Test slow networks, interrupted requests, stale caches, and partial service failures.
- [ ] Add dependency and secret scanning plus supply-chain review.
- [ ] Verify CSP, CSRF, CORS, cookie flags, rate limits, input validation, and output encoding.
- [ ] Verify deploy rollback, post-deploy smoke tests, and asset/version consistency.
- [ ] Run full tests against a disposable database before any production migration.
- [ ] Verify the actual production URL, deployment identifier, D1 schema, and critical journeys after release.

**Gate:** CI green, migration rehearsal passed, backup restore demonstrated, deployment verified, and production smoke tests passed.

## 10. Final acceptance journeys

A release candidate is not complete until all of these pass:

1. Anonymous visitor discovers a published work and reads an available chapter.
2. Reader registers, signs in, bookmarks, resumes, changes reader settings, and sees only their own library/history.
3. Reader edits profile and verifies public/private field boundaries.
4. Author creates a work, saves drafts, revises, schedules, publishes, and sees accurate status.
5. Another reader discovers the work and interacts under community rules.
6. Moderator reviews a report; audit trail is recorded without leaking private notes.
7. Admin actions are role-checked, logged, and cannot remove the last active admin.
8. Search, rankings, sitemap, and metadata expose only eligible public content.
9. RTL, localization, accessibility, and narrow-screen flows pass.
10. Backup restore and deployment rollback are rehearsed.
11. Payments remain safely unavailable unless the full payment release gate has passed.

## Status vocabulary

- **Not started:** no implementation evidence.
- **In progress:** code exists, but one or more acceptance gates are missing.
- **Blocked:** a dependency, security, migration, rights, or provider decision prevents safe completion.
- **Code complete:** implementation and automated tests pass locally/CI.
- **Integrated:** changes are merged into the intended release branch.
- **Deployed:** production deployment is confirmed.
- **Verified live:** the production behavior has been tested on the actual website.

Never promote an item to a later status based on documentation or UI appearance alone.
