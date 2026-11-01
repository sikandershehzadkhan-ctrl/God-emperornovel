# Imperial Novel — Phase 01M Screen-to-Route Product Blueprint

**Product:** Imperial Novel  
**Brand line:** Read • Create • Conquer  
**Workstream:** Master architecture, Phase 01M  
**Branch:** architecture/phase-01m-screen-blueprint  
**Status:** Architecture work in progress. This document is a product contract, not evidence of implemented or deployed screens.

## 1. Purpose and governing rule

This blueprint turns the sitemap into a screen-by-screen product specification. Every route must resolve to a deliberate screen, and every visible control must resolve to a defined interaction, permission check, data contract, and user-visible result.

Architecture is completed before implementation begins. This branch contains architecture documentation only. Do not merge application changes, execute D1 migrations, alter production data, or deploy from this workstream.

## 2. Source-of-truth and compatibility rules

1. The route registry is the authority for public URLs, aliases, access, canonical URLs, layouts, and page states.
2. Preserve all working production URLs. A proposed route never silently replaces an existing route.
3. Before implementation, reconcile the master sitemap with the actual router, current production URLs, API handlers, and D1 schema.
4. Route aliases must use explicit redirects and preserve query parameters where meaningful.
5. Static routes must be matched before dynamic route parameters. Reserve static keywords to prevent collisions.
6. Public, private, staff-only, and machine endpoints have separate access and indexing policies.
7. The interface may hide unavailable actions, but the server must independently enforce every permission and ownership rule.
8. A metric is displayed only with a documented definition, source, time window, and freshness. Missing data is unavailable, never fabricated.
9. “Real-time” must name the actual delivery method and freshness. Polling is not described as instant push.
10. A screen is not complete until its normal, loading, empty, partial, error, offline, forbidden, and expired-session states are specified.

## 3. Screen registry contract

Every screen record must contain:

- **Screen ID:** stable unique identifier.
- **Canonical route:** exact path and parameter definitions.
- **Aliases:** existing routes that must continue to work.
- **Domain / parent:** sitemap ownership and breadcrumb hierarchy.
- **Purpose / audience:** user need and intended roles.
- **Layout shell:** public, reader, creator, community, commerce, admin, or system.
- **Entry points / exit paths:** navigation links and next actions.
- **Component inventory:** shared and screen-specific components.
- **Interaction contract:** control, precondition, action, success, failure, retry, and cancellation.
- **API contract:** method, path, authentication, request, response, errors, pagination, and idempotency where relevant.
- **Data dependencies:** entities, ownership, freshness, and cache policy.
- **Authorization:** role, permission, ownership, resource state, and account-state checks.
- **Real-time contract:** event or polling source, refresh interval, visibility behavior, reconnection, and stale label.
- **SEO / AEO / GEO:** indexability, canonical, metadata, structured data, and crawl policy.
- **Localization:** locale fallback, translated content, RTL, number/date/currency formatting.
- **Responsive rules:** mobile, tablet, desktop, touch, keyboard, and safe areas.
- **Accessibility:** semantic landmarks, names, focus, contrast, zoom, motion, and screen-reader announcements.
- **Page states:** loading through recovery.
- **Analytics:** privacy-safe product events and explicit exclusions.
- **Acceptance tests:** functional, security, accessibility, responsive, SEO, and performance checks.
- **Release status:** Planned, Specified, Reviewed, Implemented, Integrated, Tested, Deployed, or Blocked. Documentation status must never be confused with software status.

## 4. Shared shell and global navigation

### 4.1 Public shell

- Compact brand header with accessible logo/wordmark, primary navigation, search, language, and account entry.
- Main landmark with a consistent content grid and deliberate full-width editorial sections.
- Footer with About, Help, Contact, Terms, Privacy, Copyright, Content Policy, accessibility, and language controls.
- Mobile bottom navigation: Home, Discover, Library, Create, Community, Profile.
- Desktop navigation: Home, Discover, Trending, For You, Rankings, Library, Community, Author, More.
- “Create” routes signed-out visitors to public author onboarding; signed-in users are routed according to their actual creator permissions.
- Admin and financial controls never appear in public navigation.
- Navigation active state must be conveyed by more than color alone.

### 4.2 Specialized shells

- **Reader shell:** chapter canvas takes priority; minimal chrome; controls never cover text.
- **Creator shell:** workspace navigation, autosave state, contextual help, and clear publishing workflow.
- **Community shell:** feed/discussion navigation and visible safety/report controls.
- **Commerce shell:** clear amount, currency, order reference, status, and irreversible-action confirmation.
- **Admin shell:** server-authorized navigation, role-scoped modules, audit context, and approval queues.
- **System shell:** focused recovery action for errors, maintenance, restricted access, and offline states.

### 4.3 Global overlays

Search overlay, mobile navigation sheet, account menu, notification panel, language picker, theme picker, report dialog, share sheet, confirmation dialog, and contextual help are registered interactions. Each overlay needs an accessible name, focus entry, keyboard behavior, close behavior, focus restoration, mobile safe-area handling, and explicit failure feedback.

## 5. Public homepage

### HOM-001 — Home
**Route:** `/`  
**Shell:** Public  
**Audience:** Everyone  
**Indexing:** Index, follow, canonical to the homepage.

**User outcome:** Understand what Imperial Novel offers and reach a useful reading or creation action quickly.

**Composition order:**
1. Global header and prominent search.
2. Editorial hero with one real eligible featured work or a real platform announcement.
3. Signed-in continuation shelf, omitted for anonymous visitors.
4. Trending shelf with named metric and measurement window.
5. Recently published / updated chapter shelf.
6. Genre, language, format, and theme discovery.
7. Author and community discovery.
8. Creator onboarding / Creator Studio entry.
9. Rights-first OmniPortal and sourced Trend Factory entry points, shown only with accurate capability/status copy.
10. Trust, help, legal, and language footer.

**Interactions:**
- Hero primary action opens the referenced work or destination.
- Search opens the search experience and preserves the entered query.
- Story card opens its canonical detail route.
- Continue reading opens the last accessible chapter and restores progress.
- Shelf “View all” opens the matching filtered listing.
- Save/follow/reaction actions require authentication and return a clear sign-in path.
- Manual refresh refreshes only the affected data region and exposes last-updated time.

**Data:** eligible published works, real chapter publication timestamps, ranking aggregates, signed-in user's progress, authorized public author profiles, community summaries, and platform capability flags. Every shelf has an independent empty and error state.

**Freshness:** response timestamp and per-metric window are visible where metrics are shown. Polling frequency is specified by the endpoint contract; pause polling while the page is hidden. Do not imply online-now presence from 24-hour reader activity.

**SEO:** unique title/description, canonical, Open Graph/Twitter metadata, one clear H1, descriptive links, and Organization/WebSite structured data where truthful. Do not emit fabricated aggregate ratings or counts.

**Acceptance:** no horizontal overflow at 320px; no autoplay carousel; all CTAs resolve; no fabricated counters; content remains useful if any shelf API fails; keyboard and screen-reader navigation work.

## 6. Discovery and search

### DSC-001 — Discovery hub
**Route:** `/discover`  
**Shell:** Public  
**Purpose:** Provide a browsable entry point into the catalog.

**Components:** search entry, genre/category grid, language and format shortcuts, curated collections, new releases, completed/ongoing shelves, and editorial picks.

**Interactions:** every taxonomy chip opens its canonical landing page; collection cards open collection detail; filters are URL-addressable; pagination preserves filters and sort.

**Data:** published and rights-eligible catalog records only. Empty taxonomy groups are hidden or clearly marked unavailable.

### DSC-002 — Advanced discovery
**Route:** `/discover/advanced`  
**Components:** query input, genre, tags, language, format, completion status, publication status, content warnings, date range, rating threshold, sort, applied-filter chips, result count, and result list.

**Filter rules:** use allowlisted values; normalize and validate query parameters; provide Reset and Apply; mobile uses a filter sheet, desktop may use a filter rail. Shareable URL state is authoritative after navigation.

**Sort rules:** every sort label explains its metric and time window. “Trending” must identify its underlying signal and window. User ratings are whole numbers from 1 to 10; averages may be derived from eligible ratings and must not be presented as individual ratings.

### DSC-003 — Random discovery
**Route:** `/discover/random`  
**Behavior:** server-selected eligible work; optional user filters; avoid repeatedly returning the same work in one session where feasible. Provide “Show another” with loading and failure feedback. Do not use random placeholders.

### DSC-004 — Hidden gems
**Route:** `/discover/hidden-gems`  
**Behavior:** transparent eligibility rule based on low exposure plus quality/engagement signals. Explain that “hidden gem” is a platform editorial/algorithmic label, not an objective guarantee. Suppress insufficient-data claims.

### DSC-005 — Editor picks
**Route:** `/discover/editor-picks`  
**Behavior:** editorially curated collection with curator, selection date, short rationale, and removal/expiry policy. Do not imply editorial endorsement without a recorded selection.

### DSC-006 — New releases
**Route:** `/discover/new`  
**Behavior:** sort by first publication timestamp, not last update. Distinguish newly published works from newly published chapters.

### DSC-007 — Recently updated
**Route:** `/discover/updated`  
**Behavior:** sort by eligible chapter publication/update timestamp. Exclude draft-only edits and unpublished material.

### DSC-008 — Completed works
**Route:** `/discover/completed`  
**Behavior:** only works whose authoritative publication status is completed. Preserve language, genre, format, and content-warning filters.

### DSC-009 — Ongoing works
**Route:** `/discover/ongoing`  
**Behavior:** only works whose authoritative status is ongoing and which have at least one published chapter.

### SEA-001 — Search
**Route:** `/search`  
**Components:** labelled search field, query suggestions, type tabs, recent searches (private to user), filters, result groups, and pagination.

**Search behavior:** debounce input; cancel stale requests; escape rendered text; keyboard-navigate suggestions; preserve query in URL; never expose private drafts, private profiles, private messages, or unpublished content.

**Subroutes:** `/search/novels`, `/search/authors`, `/search/users`, `/search/genres`, `/search/tags`, `/search/collections`, `/search/discussions`, `/search/reviews`, `/search/advanced`.

**SEO:** search result pages are generally noindex to prevent thin/duplicated query URLs. Canonical taxonomy and curated collection pages are separately indexable under their own route policies.

## 7. Taxonomy and editorial landing pages

Routes: `/genres`, `/genre/:slug`, `/categories`, `/category/:slug`, `/tags`, `/tag/:slug`, `/themes`, `/theme/:slug`, `/tropes`, `/trope/:slug`, `/languages`, `/language/:code`.

Each landing page requires:
- Stable taxonomy identifier and unique slug.
- Localized display name and optional editorial description.
- Related taxonomy links without circular or duplicate link spam.
- Eligible published-work list with pagination.
- Empty, unavailable, and unknown-slug states.
- Canonical URL and indexability rules based on useful, non-empty content.
- Structured data only where semantically appropriate.
- RTL-safe typography and locale-aware sorting.

## 8. Novel detail and chapter catalog

### NOV-001 — Novel detail
**Canonical route decision:** preserve the currently deployed route contract. The proposed `/novel/:slug` and repository documentation's `/novels/:slug` must be reconciled against the real router before either is declared canonical. Existing working links must remain valid.

**Above the fold:** cover, title, credited author, concise synopsis, language, format, publication status, content rating/warnings, rights/source label, primary Read/Continue action, and Add to Library.

**Below the fold:** full synopsis, genre/tag/theme/trope metadata, chapter list, eligible ratings/reviews, author profile, series order, update history, related works, and report action.

**Interactions:** start/resume reading; add/remove library entry; follow author; open chapter list; submit rating/review; report work; share canonical URL. Every mutation requires authentication, server authorization, rate limits, validation, and visible outcome.

**Metrics:** only show metrics backed by records. A rating is displayed on a 1–10 scale. Missing values are omitted, not rendered as 0 or 0.0. Aggregates disclose sample size where appropriate.

**Rights:** show factual rights/provenance status. A provider match or metadata record alone never proves permission to republish chapter text.

### NOV-002 — Chapter list
**Route proposal:** `/novel/:slug/chapters`  
Show ordered published chapters, publication timestamps, access status, and pagination/cursor behavior. Never leak draft titles or scheduled chapters to unauthorized users.

### NOV-003 — Reviews
**Route proposal:** `/novel/:slug/reviews`  
Show eligible reviews, whole-number 1–10 ratings, sort/filter, helpful reactions, report action, moderation state, and authenticated review submission. Enforce one review policy per user/work and safe edit history.

### NOV-004 — Discussion
**Route proposal:** `/novel/:slug/discussion`  
Connect work-specific discussions to community moderation, notifications, and report workflows. Do not duplicate independent comment systems without a clear domain boundary.

### Additional novel subpages
Characters, world, glossary, updates, author, recommendations, and report pages are specified as child screens with the same work-level access, rights, localization, canonical, and state rules.

## 9. Reader experience

### RDR-001 — Chapter reader
**Route decision:** preserve current production reader URLs and numeric identifiers. The proposed `/read/:chapterId` and nested `/novels/:slug/read/:chapter` forms must be reconciled with the actual router; do not break bookmarks or shared chapter links.

**Primary objective:** comfortable, uninterrupted long-form reading.

**Layout:** minimal reader header; work/chapter identity; chapter text canvas; previous/next navigation; settings panel; bookmark and report controls; optional progress affordance. Chapter text remains the dominant visual element.

**Reader themes:** Light, Dark, Midnight, Sepia, Imperial, Cosmic. Theme previews must meet contrast requirements and not rely on decorative background art for text legibility.

**Reader controls:** font family, font size, line height, content width, paragraph spacing, margins, alignment, theme, and optional reduced motion. Persist preferences per user; provide sensible local defaults for anonymous users.

**Progress:** save chapter, position, completion state, and timestamp. Use idempotent upserts, offline pending state, conflict policy, retry, and last-saved time. Never overwrite a newer server position with an older delayed request.

**Chapter access:** show access requirement and total price before any payment flow. Confirm entitlement on the server before delivering locked content. Payment UI must not obscure or corrupt chapter text.

**Ads:** no ad overlays or injected interruptions inside chapter text. Any permitted ad placement must be outside the reading canvas, policy-compliant, and must not cause unexpected layout shifts.

**Accessibility:** text zoom, screen-reader reading order, keyboard-accessible controls, high contrast, no forced gestures, no flashing, reduced-motion support.

### RDR-002 — Reader settings
**Route proposal:** `/reader/settings`  
Provide theme, font, size, line height, width, paragraph spacing, alignment, and reset-to-default. Preview changes before saving; expose save state and restore previous preferences on failure.

### RDR-003 — Bookmarks, highlights and notes
Private to the owner. All APIs enforce user ownership. Provide create/edit/delete, chapter context, safe export policy, and clear behavior if a chapter becomes unavailable.

### RDR-004 — Reading progress/history/statistics
Show per-user progress and history only to that user. Statistics define the measurement window and timezone. Offline and delayed events must be reconciled without double counting.

### RDR-005 — Offline library
Only cache content that the platform is legally entitled to distribute and the user's entitlement permits. Explain expiry, storage, removal, and sync behavior. Do not promise offline availability where browser storage limits make it unreliable.

## 10. Shared interaction and state contract

Every control must specify:
- Initial state and enabled/disabled conditions.
- Required authentication and permission.
- Validation and confirmation.
- Request in flight and duplicate-submit prevention.
- Success result and updated visible data.
- Recoverable failure, retry, and cancellation.
- Offline behavior and reconciliation.
- Accessible status announcement.
- Safe analytics event, if any.

Every data region must support: initial loading, loaded, empty, partial, stale, error, offline, unauthorized, and retry. Skeletons must match the final layout and have a bounded timeout/fallback.

## 11. Cross-cutting acceptance gates

- **Route integrity:** direct-load, refresh, back/forward, canonical, aliases, query state, unknown slug, and redirect tests.
- **Functional integrity:** every button, link, form, menu, filter, modal, and keyboard action has a defined result.
- **Security:** direct API access, cross-account access, ownership, role escalation, CSRF, rate limit, session expiry, and private-cache isolation.
- **Data truth:** no fabricated metrics, stale status disclosure, no duplicate mutations, and correct publication/rights filtering.
- **Responsive:** 320, 360, 390, 768, 1024, and 1440 CSS px; portrait/landscape; safe areas; long localized strings.
- **Accessibility:** WCAG 2.2 AA target, keyboard-only, screen reader, 200% zoom, visible focus, reduced motion, and contrast.
- **Performance:** route-level budgets, image dimensions, lazy loading, bounded polling, no long main-thread tasks, and low-memory Android checks.
- **SEO:** canonical, robots, metadata, sitemap consistency, structured-data validity, and noindex for private/search/locked content as appropriate.
- **Localization:** Urdu/Arabic RTL, mixed-script content, locale dates, digits, and PKR formatting.
- **Failure recovery:** slow network, offline, API 4xx/5xx, expired session, partial API failure, and stale cached data.

## 12. Scope completed in this increment

This increment defines the registry contract and the first connected public/discovery/search/taxonomy/novel/reader screen family. It does not claim that every sitemap route has been individually specified. Creator, community, messaging, OmniPortal, Trend Factory, AI, commerce, administration, localization, legal, developer, and system screens remain to be completed in subsequent architecture increments.

## 13. Review checklist for this document

- [ ] Reconcile every canonical route against the current production router.
- [ ] Reconcile API names and response contracts against actual Worker handlers.
- [ ] Reconcile data dependencies against existing D1 migrations and tables.
- [ ] Review role/permission mapping against Phase 01I.
- [ ] Review API consistency against Phase 01J.
- [ ] Review database consistency against Phase 01K.
- [ ] Review visual tokens and component contracts against Phase 01L.
- [ ] Complete remaining product-domain screen specifications.
- [ ] Resolve route collisions and define backward-compatible redirects.
- [ ] Obtain product architecture review before implementation begins.


## 14. Repository and production reconciliation findings (read-only audit, 1 November 2026)

The following facts were checked against the PR #120 feature branch source and public production endpoints. They are baseline evidence for architecture reconciliation, not approval to merge or deploy.

### 14.1 Current route and API contract observations

- The current client uses pathname-based rendering and hard-coded navigation links in `public/app.js`; this is not yet a central declarative route registry.
- Current client links include `/`, `/catalog`, `/catalog?sort=trending`, `/leaderboard`, `/library`, `/community`, `/become-an-author`, `/author`, `/trend-factory`, `/genres`, `/formats`, `/format/:format`, `/tickets`, `/omniportal`, `/account`, `/search`, and `/notifications`.
- Story cards currently link to `/novel/:id`; reader links use `/read/:novelId/:chapterNumber`. Preserve these numeric-ID routes and shared links until a tested slug/ID compatibility strategy exists.
- Worker API routes observed include `/api/health`, `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/me`, `/api/config`, `/api/genres`, `/api/tags`, `/api/public-authors`, `/api/sources`, `/api/omni/status`, `/api/omni/search`, `/api/omni/resolve`, `/api/omni/import`, `/api/omni/jobs`, `/api/omni/smart-unlock`, `/api/formats`, `/api/chapter-engagement`, `/api/novel-engagement`, `/api/platform/overview`, `/api/discovery/graph`, `/api/novels`, `/api/novels/:id`, `/api/chapters/:id`, chapter unlock and batch-unlock routes, `/api/bookmark`, `/api/history`, and `/api/reading-position`.
- The feature branch contains the `/api/platform/overview` handler and request-time D1 metric definitions. Public production returned 404 for this endpoint during the read-only check. Therefore the feature-branch handler is not evidence of production availability.
- The feature branch OmniPortal status handler returns a deduplicated provider snapshot and explicit capability information. Public production still returned repeated provider records from an older response during the same audit. Treat this as a deployment gap, not a reason to mutate production records during architecture work.
- Public production returned a Page Not Found response for `/become-an-author` at the time checked. The feature branch PR describes a public onboarding page. The architecture must distinguish public onboarding from authenticated author application and private Author Studio.

### 14.2 Route decisions that must be resolved before implementation

1. **Catalog route:** `/catalog` is the current discovery entry point. A future `/discover` route may be an alias or canonical migration only after redirects, sitemap, navigation, analytics, and shared links are specified.
2. **Novel route:** `/novel/:id` is the current detail route. A slug route may be introduced only with stable ID resolution and permanent redirects that preserve old URLs.
3. **Reader route:** `/read/:novelId/:chapterNumber` is the current client link shape. A chapter-ID route must not be substituted until numeric legacy links and chapter identity are reconciled.
4. **Author routes:** `/become-an-author` is public onboarding; `/author` is a separate authenticated creator entry. The eventual route registry must define the exact post-login destination and role gates.
5. **Trending:** currently represented by `/catalog?sort=trending`; a dedicated `/trending` page must have a canonical/redirect decision and a transparent ranking definition.
6. **Rankings:** `/leaderboard` is the current public route; a future `/rankings` route must preserve old bookmarks and define ranking dimensions and time windows.

### 14.3 Observed contract and product gaps to carry into later domain architecture

- The Worker uses a large pathname/method conditional API dispatcher. The architecture should define domain groupings and a route registry without assuming the code has already been modularized.
- Authentication currently exposes register/login/logout/me handlers. The full account-recovery, email verification, multi-factor, session-management, and staff step-up journeys still require explicit screen and API design.
- `/api/config` reports payments disabled until an approved merchant integration is configured. Payment screens must display unavailable/pending configuration accurately; do not present EasyPaisa as operational until the merchant and verification workflow are genuinely configured.
- The reader and catalog use existing numeric identifiers and D1 records. The future route model must not assume opaque UUIDs or a new normalized schema is already present.
- The current catalog client has a compact `card()` renderer that omits missing rating/chapter metadata, while a separate `catalogCard()` renderer formats fallback values as zero. The screen contract must require one shared truthful metric-rendering policy and regression coverage across every card variant.
- The current theme toggle is a light/dark switch. Six reader themes and full account-level appearance preferences are a product requirement to specify, not a claim about current implementation.
- The client language selector includes English, Urdu, Hindi, Simplified/Traditional Chinese, Japanese, Indonesian, French, Korean, Brazilian Portuguese, Arabic, Spanish, Vietnamese, and Persian. This selector does not prove every page, content record, email, or RTL layout is fully localized.
- The existing Worker API has request-time D1 engagement/overview handlers in the feature branch. Polling freshness and metric definitions must be preserved in UI labels; polling is not WebSocket push and reader activity is not online presence.

### 14.4 Evidence boundary

This audit read source files on the PR #120 feature branch and fetched selected public production URLs. It did not run the application locally, query the production D1 database, authenticate as a user, perform device screenshot testing, change source code, execute migrations, merge a PR, or deploy. Any such work must be recorded separately with exact test/deployment evidence.


## 15. Phase 01M continuation index

The screen blueprint is being maintained as a set of domain-specific architecture documents on this branch:

- [01M.1 — Screen-to-route foundation, public discovery, catalog and reader](IMPERIAL-NOVEL-PHASE-01M-SCREEN-TO-ROUTE-BLUEPRINT.md)
- [01M.2 — Creator, community, messaging and notifications](IMPERIAL-NOVEL-PHASE-01M-2-CREATOR-COMMUNITY-MESSAGING-BLUEPRINT.md)
- [01M.3 — OmniPortal and Trend Factory](IMPERIAL-NOVEL-PHASE-01M-3-OMNIPORTAL-TREND-FACTORY-BLUEPRINT.md)
- [01M.4 — Commerce, Crowns and Payments](IMPERIAL-NOVEL-PHASE-01M-4-COMMERCE-TICKETS-PAYMENTS-BLUEPRINT.md)
- [01M.5 — Administration, Security and Operations](IMPERIAL-NOVEL-PHASE-01M-5-ADMIN-SECURITY-OPERATIONS-BLUEPRINT.md)
- [01M.6 — Localization, Accessibility and Legal Experience](IMPERIAL-NOVEL-PHASE-01M-6-LOCALIZATION-ACCESSIBILITY-LEGAL-BLUEPRINT.md)
- [01M.7 — Account, Identity, Library, Notifications and Support](IMPERIAL-NOVEL-PHASE-01M-7-ACCOUNT-IDENTITY-LIBRARY-NOTIFICATIONS-SUPPORT-BLUEPRINT.md)
- [01M.8 — Cross-Domain Journeys and Route Reconciliation](IMPERIAL-NOVEL-PHASE-01M-8-CROSS-DOMAIN-JOURNEYS-AND-ROUTE-RECONCILIATION.md)

Each document is a specification. A listed route or logical API contract is not asserted to exist until independently reconciled with the current router and Worker implementation. The next architecture increments must cover OmniPortal, Trend Factory, commerce/payments, administration/agents, AI workspace as a distinct product area, localization, legal/trust, developer/system screens, and cross-domain route/permission reconciliation.


## Phase 01N architecture evidence

- [01N — Repository Evidence Audit](IMPERIAL-NOVEL-PHASE-01N-REPOSITORY-EVIDENCE-AUDIT.md)
- [01N.1 — Schema Authority and Migration Decision](IMPERIAL-NOVEL-PHASE-01N-1-SCHEMA-AUTHORITY-AND-MIGRATION-DECISION.md)
- [01N.2 — API Authorization and Side-Effect Matrix](IMPERIAL-NOVEL-PHASE-01N-2-API-AUTHORIZATION-AND-SIDE-EFFECT-MATRIX.md)
- [01N.3 — Canonical Route and SEO Registry](IMPERIAL-NOVEL-PHASE-01N-3-CANONICAL-ROUTE-AND-SEO-REGISTRY.md)
- [01N.4 — Real-Time Events and Analytics Contract](IMPERIAL-NOVEL-PHASE-01N-4-REALTIME-EVENTS-AND-ANALYTICS-CONTRACT.md)
- [01N.5 — Release and Production Verification Contract](IMPERIAL-NOVEL-PHASE-01N-5-RELEASE-AND-PRODUCTION-VERIFICATION-CONTRACT.md)
- [01N.6 — Architecture Conflict Review and Exit Gates](IMPERIAL-NOVEL-PHASE-01N-6-ARCHITECTURE-CONFLICT-REVIEW-AND-EXIT-GATES.md)
- [01O.1 — Database Schema Authority and Migration Reconciliation](IMPERIAL-NOVEL-PHASE-01O-1-DATABASE-SCHEMA-AUTHORITY-AND-MIGRATION-RECONCILIATION.md)
- [01O.2 — Runtime DDL Ownership and Migration Dependency Map](IMPERIAL-NOVEL-PHASE-01O-2-RUNTIME-DDL-OWNERSHIP-AND-MIGRATION-DEPENDENCY-MAP.md)
- [01O.3 — Numbered Migration Inventory and Test Matrix](IMPERIAL-NOVEL-PHASE-01O-3-NUMBERED-MIGRATION-INVENTORY-AND-TEST-MATRIX.md)
- [01O.4 — Clean Install, Upgrade and Schema Verification Plan](IMPERIAL-NOVEL-PHASE-01O-4-CLEAN-INSTALL-UPGRADE-AND-SCHEMA-VERIFICATION-PLAN.md)
- [01P — Roles, Permissions and Staff Boundaries](IMPERIAL-NOVEL-PHASE-01P-ROLES-PERMISSIONS-AND-STAFF-BOUNDARIES.md)
- [01P.1 — API-to-Permission and Ownership Matrix](IMPERIAL-NOVEL-PHASE-01P-1-API-TO-PERMISSION-AND-OWNERSHIP-MATRIX.md)
- [01P.2 — Worker API Route Inventory](IMPERIAL-NOVEL-PHASE-01P-2-WORKER-API-ROUTE-INVENTORY.md)
- [01P.3 — Authorization, Ownership and IDOR Security Test Matrix](IMPERIAL-NOVEL-PHASE-01P-3-AUTHORIZATION-AND-IDOR-SECURITY-TEST-MATRIX.md)
