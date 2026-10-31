# Imperial Novel — World-Class Experience Blueprint & Fictionzone Benchmark

**Date:** 1 November 2026  
**Status:** Architecture and design decision record for the review branch  
**Brand:** Imperial Novel · Read • Create • Conquer

This document converts live public research into an implementation blueprint. It is not a claim that every capability described below is already live.

## 1. Research and verified Fictionzone patterns

Read-only public inspection covered Fictionzone homepage, Become an Author, OmniPortal, Browse and Trending pages; Imperial Novel production pages and APIs; and the previously inspected WebNovel and WTR-LAB public pages.

### Become an Author
- Public onboarding explains audience reach, writing/publishing tools, community feedback and readership analytics.
- Its application is email-based: applicants send an introduction and writing experience to the published author contact.
- It says original stories are preferred, review typically takes 3–5 business days, and authors retain ownership.
- The extracted page does not expose a self-service application form.

### OmniPortal
- Public positioning: discover novels across multiple sources in one place.
- Public homepage links expose provider-specific novel routes, including /omniportal/fq/{source-id} and /omniportal/qimao/{source-id}.
- The extracted OmniPortal page displayed 0 Sources / 0 Active. Treat this as the observed page snapshot, not proof of the entire provider network's inventory.
- The wider homepage links to source-backed OmniPortal destinations as well as Fictionzone-hosted novel pages.

### Discovery and trust
- Dedicated Browse, Trending, Most Read, Rising Stars, Hidden Gems, Top Rated and Most Completed destinations.
- Trending describes ranking by reading activity, engagement and reader enthusiasm.
- Recent reviews show dates and the reviewed story.
- Public Terms, Privacy and DMCA destinations.

These patterns inform our architecture only. Do not copy protected interface assets, text, novel metadata or chapter bodies. Reproduce useful capabilities with Imperial Novel's own design and lawful data sources.

## 2. Imperial Novel live baseline and critical gaps

The live homepage exposes Imperial branding, search, six format families, creator features, community, a featured story and 14 language choices.

Live checks on 1 November 2026 found:
- /author returned a generic homepage title/description and a visible client loading shell in extracted content. The rendered author journey needs browser verification.
- /omniportal explains rights-first discovery, but extracted public content does not show provider discovery or source health.
- /api/omni/status returned repeated registry entries for the same provider base URLs. Most observed records were disabled/pending. One TomatoMTL record was enabled/authorized but had no successful configured health check. This is not evidence of a working external search provider.
- /api/sources exposed 20 registered provider names. Registration is not connection or authorization.
- /api/platform/overview returned HTTP 404 in production. The real-time overview work exists on the review branch, not on the inspected live deployment.
- The review branch already contains a richer author application/review workflow and authorized-connector OmniPortal engine than the extracted production UI suggests. These need end-to-end validation before being described as fully operational.

**Truth rule:** registry entries, source URLs, queued imports, cached observations and feature flags must never be presented as active providers, live inventory, successful imports or live user counts.

## 3. Product experience and visual direction

Creative direction: **Modern Smart Imperial Shenhao**. Premium editorial publishing, modern imperial authority and restrained futuristic precision.

### Design system
- Primary palette: Imperial Purple, Pure White, Sapphire Blue and Obsidian Black.
- Gold is not a core brand color. Reserve it for rare earned or premium states.
- Editorial typography, generous but efficient spacing; covers and story information outrank interface decoration.
- Consistent light and dark themes. Sepia, Midnight, Imperial and Cosmic are reader preferences, not unrelated site skins.
- System-font-first interface typography; reliable Urdu, Arabic and Persian shaping, bidirectional text and RTL layouts.
- 4px spacing foundation, consistent radii, borders, focus rings, content widths and component states.
- Original Imperial crest/wordmark. Avoid generic anime, casino, crypto and template-dashboard styling.

### Responsive shell
**Desktop:** Home, Discover, Trending, Rankings, Library, Community and Create as primary destinations. Search, language, appearance, notifications and account remain visible utilities. Secondary destinations live in the accessible three-line drawer.

**Mobile:** five-item thumb-reachable navigation: Home, Discover, Library, Create and Community. Account/profile remains reachable from the header/account menu. Respect safe areas and 320px minimum layout width.

### Homepage hierarchy
1. Brand shell and global search.
2. Editorial hero with one primary action.
3. Genre and format shortcuts.
4. Featured Imperial Selection, editorially selected rather than fabricated.
5. Trending Now, with a real and explained activity window.
6. Rising Stories and New Authors, only after minimum data thresholds.
7. Recently Updated, using actual chapter timestamps.
8. Continue Reading / For You, personalized only for signed-in readers with a useful guest fallback.
9. Community pulse and author invitation.
10. Rights, trust, support and legal footer.

Hide empty shelves or replace them with a useful discovery action. Never repeat one story across shelves merely to fill space.

### Story card information model
Show only available, verified fields:
- Cover with descriptive alt text, title and author.
- Format, language and genre chips where useful.
- Ongoing/completed state.
- Published chapter count and last update.
- Rating plus review count only when a meaningful sample exists.
- Views/reading activity only when defined and not misleading.
- Clear Read / Continue / Preview action.

Do not render missing ratings, counts or dates as zero. Do not imply verified authorship from a free-form credited author string.

## 4. Information architecture and sitemap

### Public, indexable when substantive and rights-eligible

| Route | Purpose | Index policy |
|---|---|---|
| / | Platform and editorial discovery | Index |
| /catalog or /discover | Searchable catalog | Index; canonicalize filters |
| /trending | Real momentum rankings | Only with sufficient real data |
| /rankings or /leaderboard | Explicit ranking dimensions | Only when populated |
| /genres and /genre/{slug} | Genre discovery | When useful |
| /tags and /tag/{slug} | Trope/tag discovery | When useful |
| /formats and /format/{slug} | Format directory | When substantive |
| /novel/{id} | Published novel detail | If rights-cleared |
| /novel/{id}/chapters | Chapter directory | Conditional |
| /read/{id}/{chapter} | Reader | Only if publicly readable and policy permits |
| /author/{slug} | Public author identity and works | When substantive |
| /become-an-author | Public creator onboarding | Index |
| /community | Public community | When substantive |
| /help, /content-policy, /copyright, /privacy, /terms | Help and trust | When complete |
| /omniportal | Explain lawful federated discovery and providers | Index as product explainer, not private connector results |

### Authenticated or operational, noindex and never in sitemap
- /account, /settings, /library, /history, /following, /notifications
- /author/studio, /author/applications and private work/editor routes
- /admin and moderation queues
- /tickets, payments, unlock and transaction flows
- /omniportal/jobs, /omniportal/connectors and private authorization/import requests
- /api/*, private reports and internal agent/analytics routes

Authorization is enforced server-side. robots.txt and noindex are not security controls.

### Sitemap rules
- Canonical absolute URLs on the configured production origin.
- Only successful, public, substantive, published and rights-eligible pages.
- Public author profiles only when meaningful and backed by published eligible works.
- Accurate lastmod derived from real updates.
- Exclude arbitrary search/filter combinations, private workspaces, provider registry rows, locked/private chapter content and imported metadata without publication rights.
- Split large sitemaps at protocol limits and use a sitemap index when needed.
- Hreflang only for genuine equivalent localized pages with reciprocal mappings.

## 5. Become an Author — target journey

Build a self-service, accessible onboarding funnel rather than copying Fictionzone's email-only application.

1. Public /become-an-author page explains benefits, rights, formats, standards, review stages and realistic expectations.
2. Visitor creates/signs into an account.
3. Applicant submits public pen name, short bio, goals/experience, optional portfolio, preferred formats, authorized writing sample and rights declaration.
4. Server validates and rate-limits the application; applicant can view status and withdraw/resubmit according to policy.
5. Editorial/admin review queue records reviewer, timestamp, decision and actionable feedback.
6. Approval grants the least-privilege novel-author role; rejection does not expose private reviewer data.
7. Author Studio opens with an onboarding checklist: profile, first work, metadata, rights evidence, chapter draft, preview and submission.
8. Each work independently passes rights and publication review. Author approval is not blanket permission for future content.
9. Public author profile is generated only from verified/public fields and published eligible works.

Required states: not signed in, eligible to apply, incomplete, pending, changes requested/rejected, approved, withdrawn, rate-limited and service error. Use accessible status announcements and preserve form values after recoverable errors.

## 6. OmniPortal — target capability model

OmniPortal is a federated discovery and authorized connector system, not a chapter scraper or content mirror.

### Reader-facing experience
- Search Imperial Novel's eligible catalog first.
- Search only external providers with an active, tested, authorized API/feed connector.
- Provider filter, source label, result freshness and clear attribution.
- Result fields: title, author, cover, synopsis, language, source, external destination and last-checked time only when supplied by the authorized provider.
- Distinguish “Read on Imperial Novel” from “Open at source”.
- Explicit empty, offline, rate-limited, stale and unsupported-provider states.
- External results open the provider's canonical page unless a written agreement permits another flow.

### Connector lifecycle
Discovered → Registered → Authorization requested → Rights reviewed → Credentials configured → Health checked → Enabled → Monitored → Suspended/Revoked.

A provider becomes searchable only when all are true:
- Written authorization or terms permit the exact metadata/search use.
- Approved API/feed endpoint and host allowlist.
- Credentials stored as server-side secrets, never browser code.
- Health check succeeds and response schema is validated.
- Attribution, rate limits, caching, retention, takedown and contact requirements are recorded.
- Admin can pause/revoke immediately and events are audited.

### Import and content boundaries
- Metadata-only import by default and only when contractually allowed.
- Never bypass paywalls, DRM, logins, anti-bot controls or technical access restrictions.
- Never ingest chapter bodies, translations, covers or illustrations without explicit rights.
- A public URL or robots permission does not grant republication rights.
- Queue jobs need idempotency, deduplication, provenance, retries, status, cancellation and audit history.
- Provider failures must not block local catalog search.
- No external smart-unlock unless a real provider contract, entitlement check and payment flow exist.

### Admin connector operations
Show separate counts for registered, authorization-pending, authorized, enabled, healthy, degraded and disabled providers. Deduplicate by normalized base URL. Every metric is real-time request data or a timestamped health observation, with freshness shown explicitly. Never label a registered source as connected.

## 7. Real-time platform intelligence

The public overview must be backed by real D1 records and expose:
- Published, rights-eligible novel and chapter counts.
- Catalog views with a clear definition and time window.
- Distinct signed-in readers with recorded activity in the previous 24 hours, not “online now”.
- Chapter updates in the previous 24 hours.
- Recent chapter updates with actual timestamps.
- Trending based on a named, reproducible event window such as chapter unlocks over seven days, with minimum-volume rules and transparent fallback.

Every response includes generated_at, measurement windows and metric definitions. The public overview uses request-time D1 queries and no-store response headers; the browser refreshes every 60 seconds while visible and supports manual refresh. This is near-real-time polling, not a WebSocket or instant-push guarantee. Display the exact data-generation time and per-record event timestamps. Provider health is a timestamped observation from the last health check, not proof of continuous availability. No fake counts, placeholder data, fabricated earnings or inferred provider activity.

## 8. SEO, AEO and GEO

- Unique title, useful description, canonical URL, robots policy, Open Graph and Twitter metadata per public route.
- Crawlable HTML and meaningful headings/content before client hydration where feasible.
- JSON-LD only for visible verified Organization/WebSite, Book, Chapter, Person/ProfilePage and BreadcrumbList facts.
- Sitemap and robots generated from the same route/indexability policy.
- Explicit distinction between OAI-SearchBot search discovery and GPTBot/Google-Extended training access.
- Useful public explainers: how to read, publish, retain rights, use tickets, report copyright and understand rankings.
- Stable entity IDs and internal links among novels, authors, genres, tags and formats.
- No fake FAQ schema, keyword stuffing, mass thin landing pages or promises of search/AI rankings.
- Search Console, crawler and Core Web Vitals monitoring are post-deployment gates.

## 9. Performance, accessibility and trust gates

- Mobile-first budgets; prioritize LCP content, defer below-fold imagery, minimize blocking JavaScript and avoid heavy blur/animation.
- No layout shift from images; set dimensions/aspect ratios and responsive sources.
- WCAG 2.2 AA contrast, semantic landmarks, accessible names, keyboard operation, visible focus, reduced motion and 44px-class touch targets.
- Test light/dark themes, RTL, localization overflow and zoom.
- Security: server authorization, least privilege, CSRF protection where cookie-authenticated writes require it, rate limits, safe URL/host validation, output escaping, audit logs and secret isolation.
- Validate empty/loading/error/offline states, not only successful pages.

## 10. Delivery order and acceptance

**Phase 1 — Design and architecture:** reconcile route inventory, tokens, shell, page hierarchy, component states and sitemap policy.  
**Phase 2 — Homepage and discovery:** responsive editorial homepage, useful shelves, real catalog cards and real-time overview.  
**Phase 3 — Author journey:** public onboarding, application status, review workflow and complete Author Studio entry.  
**Phase 4 — OmniPortal:** deduplicated registry, provider lifecycle, authorization evidence, health monitoring, metadata search/import and reader UX.  
**Phase 5 — SEO/AEO/GEO and trust:** route metadata, sitemap, structured data, help content and crawl policy.  
**Phase 6 — QA:** automated tests, source validation, preview screenshots, narrow Android/mobile interaction checks, performance and accessibility audits.

Acceptance requires source-level tests, rendered-page verification, real-data checks and documented rollback. No merge, production D1 migration or deployment without explicit approval.
