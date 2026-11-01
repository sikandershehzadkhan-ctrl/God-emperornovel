# Imperial Novel: Solo-Owner and High-Concurrency Architecture
Phase 01N extension | Architecture blueprint | Draft 1.0

## 1. Operating reality

Imperial Novel has one human owner: its founder. There is no assumed team, co-founder, staff department, or external administrator. The owner makes product and business decisions. ChatGPT assists with architecture, implementation, code review, documentation, and tests through tools actually available in a session. Work is not performed invisibly in the background, and no task is described as completed unless the relevant artifact or test has actually been produced and verified.

Operating model:
- One owner account, protected as the unique platform-owner identity.
- No self-service owner registration, owner transfer, or owner-role assignment.
- No second owner, co-owner, or default admin.
- The owner can operate the platform from a mobile browser wherever the workflow permits.
- Automated jobs handle repetitive, bounded tasks such as notification delivery, metadata refresh, report triage, image processing and health checks.
- Automation cannot grant itself privileges, transfer ownership, publish unapproved rights-sensitive content, read private messages without a defined case basis, or perform unrestricted financial actions.
- Optional staff roles may be designed for future use but remain disabled/unassigned until the owner explicitly chooses to delegate.
- The system must remain operable if every optional staff account is absent.

Owner security:
- Strong unique credentials, MFA where supported, recovery codes, login alerts and session management.
- Owner-only actions require server-side authorization, not a hidden button or client-side role flag.
- Critical changes show a preview, affected-record count, clear confirmation and audit event.
- Preserve recoverable backups before destructive migrations and bulk actions.
- Ownership transfer, if ever necessary, requires a separate verified recovery procedure and must never be a normal API endpoint.

## 2. Complete platform domains to map

Every domain must be mapped through: navigation → route → screen → components → user actions → API operation → data entities → authorization → events → cache behavior → monitoring → tests.

1. Public site: home, about, help, contact, legal, accessibility and service status.
2. Discovery: catalog, search, filters, genres, genre detail, tags, tag detail, categories, formats, languages, trending, rankings, recommendations and random discovery.
3. Novel pages: detail, metadata, editions, series, collections, chapter index, update history, rights and publication state.
4. Reader: chapter route, typography, themes, reading progress, bookmarks, notes, history, accessibility, reader settings and offline strategy.
5. Identity: register, login, verification, recovery, sessions, profile, privacy, security, export and deletion.
6. Social: follows, followers, comments, replies, reactions, ratings, reviews, mentions, discussions, blocks, mutes, reports, appeals and optional messaging.
7. Creator Studio: dashboard, projects, novel editor, chapter editor, drafts, scheduling, publishing, analytics, collaboration, translation and rights.
8. OmniPortal: provider directory, authorization, connection health, metadata search, import review, provenance, rights checks, sync history and disconnect.
9. Trend Factory: source registry, RSS/API ingestion, metadata normalization, deduplication, trend signals, review queue, publishing queue, provenance and takedown.
10. AI services: provider settings, author assistance, summaries, metadata suggestions, moderation triage, translation assistance, quotas, cost controls and safety.
11. Monetization: ticket packages, payment instructions, EasyPaisa references, pending/approved/rejected review, ledger, refunds, receipts and revenue reports.
12. Community: forums, topics, events, polls, guidelines, moderation and appeals.
13. Notifications: inbox, preferences, delivery, retries, quiet periods and unsubscribe.
14. Owner console: overview, catalog, users, roles, moderation, rights, finance, providers, AI, localization, SEO, security, audit, backups and system settings.
15. Trust and safety: reports, cases, evidence, enforcement, appeals, abuse prevention and incident response.
16. Platform operations: health, metrics, logs, queues, cache, database, storage, backups, restore, release, rollback and status.
17. SEO/AEO/GEO: canonical URLs, structured data, robots, sitemaps, feeds, indexing and answer-engine metadata.
18. Localization: locale registry, language switcher, translated interface, localized metadata, RTL, fallback and translation workflow.
19. Integration: versioned APIs, webhooks, event contracts, provider credentials, secrets and feature flags.
20. Quality and release: unit, integration, end-to-end, accessibility, security, load, resilience, migration and release gates.

## 3. Sole-owner role and permission model

At launch, the only privileged human role is the platform owner. Public roles are guest, reader and approved author. Project-scoped collaborator/editor/translator permissions may be introduced when the relevant workflow exists. Moderator, support, finance, rights, security and localization roles are future delegation options, not assumed staff.

Rules:
- The owner identity is unique and cannot be claimed through public signup.
- A reader cannot change their role, edit another user's account, access another user's drafts or private library, or inspect private conversations.
- An author manages only their own works and explicitly assigned projects.
- A collaborator sees only the project resources and actions granted to them.
- A moderator, if later appointed, has a narrow scope and no finance, security or owner powers.
- A service agent has a machine identity and a narrow allow-list, never owner privileges.
- Authorization uses role + resource ownership + scope + relationship + account state + privacy settings. Default deny.
- Every sensitive operation is checked server-side on every request.
- Block, mute, restrict, report and appeal are separate functions.
- Block prevents unwanted follows, messages, mentions, invitations and targeted notifications where applicable.
- Private profile fields, libraries, activity, drafts, messages, payment details and sessions are private by default.

## 4. Complete route record requirements

Every route record must contain route ID, method (for APIs), pattern, route class, canonical URL, aliases, owning domain, parent navigation, breadcrumb, screen name, page shell, component inventory, parameters, query schema, locale behavior, actor classes, permission keys, resource scope, privacy classification, relationship checks, API contracts, data entities, state transitions, events, cache policy, SEO/indexing policy, rate limits, audit policy, loading/empty/error/forbidden states, responsive behavior, analytics events, test cases and implementation status.

Route matching rules:
- Match exact static paths before parameterized routes.
- Match specific routes before broad routes, such as /novel/:id/chapters before /novel/:id.
- Reserve namespaces for users, authors, novels, chapters, creator, messages, staff, admin and API.
- Validate every parameter and query value.
- Return real 401, 403 and 404 HTTP statuses.
- Define canonical and redirect rules before changing existing URLs.
- Preserve existing numeric novel/chapter routes until a tested migration and redirect plan exists.
- A page shell is not evidence that the destination screen is fully implemented.
- No menu item may point to a dead, placeholder or ambiguous route.

## 5. High-concurrency architecture

### 5.1 Core principle

Do not design for a single lucky traffic level. Design for measured capacity, graceful degradation and recovery. No honest architecture can promise that any finite system will never fail. The engineering goal is to prevent a traffic spike from taking down the whole platform, isolate overloaded subsystems, preserve data integrity, and recover predictably.

### 5.2 Request path

Reader device → Cloudflare edge/CDN → stateless Worker/API layer → cache or data service → D1 transactional database and object storage. Slow or nonessential tasks are sent to queues rather than performed inside the page request.

### 5.3 Stage-based capacity plan

| Stage | Concurrent active viewers to test | Design focus |
|---|---:|---|
| A: launch | 10–100 | Correctness, indexed queries, caching, error handling, basic load tests |
| B: early growth | 100–1,000 | Hot-route cache, query budgets, pagination, rate limits, queue isolation |
| C: growth | 1,000–10,000 | Load tests, precomputed discovery, read/write pressure analysis, database capacity review |
| D: large audience | 10,000–100,000 | Dedicated search/analytics/event services where justified, regional and edge strategy, queue partitioning |
| E: major scale | 100,000+ | Re-architecture from measured bottlenecks, capacity forecasting, resilience exercises and formal SLOs |

These are test-planning tiers, not claims that the current deployment can already sustain these loads. Concurrent viewers, requests per second, requests per user, cache hit ratio, database writes and chapter payload size must be measured separately.

### 5.4 Protect the popular chapter scenario

When 1,000 readers open the same chapter:
- Serve public chapter content through edge caching where rights, publication status and access policy allow.
- Keep user-specific reading position, bookmarks, notes and reactions separate from the cacheable chapter body.
- Use cache keys that include content version and locale where relevant.
- Invalidate or version the cached chapter when an authorized publication update occurs.
- Avoid running expensive recommendation, analytics or counter queries on every chapter view.
- Aggregate view events asynchronously and deduplicate where feasible.
- Rate-limit abusive clients without blocking legitimate readers indiscriminately.
- Apply backpressure to nonessential events before allowing them to exhaust database capacity.
- Keep chapter reads available if analytics, recommendation or notification services are degraded.

### 5.5 Storage and database

- Use D1 as the transactional source of truth while measured workload and platform limits support it.
- Index all high-frequency lookup and relationship paths; inspect query plans for hot queries.
- Avoid unbounded result sets, N+1 queries, full-table scans on request paths and large synchronous batches.
- Use cursor pagination for large feeds and histories.
- Keep media files in object storage, not relational rows.
- Use migrations with backups, forward checks, compatibility windows and rollback/recovery plans.
- Track database size, query duration, rows scanned, write contention, failures and backup health.
- Define a measured threshold at which D1 must be reassessed or selected high-volume domains moved to a better-suited service.
- Never split the database prematurely without a demonstrated bottleneck and a consistency plan.

### 5.6 Cache architecture

Cache candidates: public catalog metadata, public novel metadata, published chapter bodies, static assets, genre/tag pages and public rankings with bounded freshness.

Do not shared-cache: private profiles, private libraries, reading history, messages, drafts, payment records, session state or personalized responses.

Every cache record must define key, TTL, stale policy, invalidation event, privacy classification and failure behavior. Use versioned assets and stale-while-revalidate only where safe.

### 5.7 Queues and background jobs

Queue candidates: notification delivery, email, view aggregation, recommendation refresh, trending calculation, image processing, metadata ingestion, moderation triage, analytics rollups and scheduled publishing.

Every job needs idempotency, retry/backoff, maximum attempts, dead-letter handling, visibility timeout, priority, observability and a manual pause/replay mechanism. Queue failure must not silently lose payments, publication state or rights decisions.

### 5.8 Search and recommendations

Start with indexed database queries and precomputed lists where they meet requirements. Add a dedicated search index only when measured catalog size, relevance or latency justifies it. Search indexing must respect private content, blocks, takedowns, language and publication eligibility.

Recommendations should use cached/precomputed candidates and bounded personalization. If recommendations fail, show a safe popular/recent fallback rather than failing the homepage.

### 5.9 Real-time features

Use real-time delivery only where it materially helps: notifications, message delivery (if launched), moderation queue updates and selected live counters. Do not open a persistent connection for every passive page view. Provide polling or refresh fallbacks. Authenticate and authorize every subscription; scope events to the correct user/resource.

### 5.10 Failure isolation

Define graceful degradation:
- Search down: retain browse-by-genre and cached trending.
- Recommendations down: show recent/popular eligible works.
- Analytics down: queue events; reading continues.
- Notification delivery down: persist notifications and retry later.
- AI provider down: disable AI actions with a clear message; core reading and writing remain available.
- OmniPortal/provider down: preserve local catalog and show provider health.
- Payment provider/callback uncertainty: hold transaction in pending/reconciliation state; never double-credit.
- Queue backlog: prioritize transactional and safety workflows; throttle nonessential jobs.
- Database unavailable: return controlled errors, protect writes and show service status; never pretend a write succeeded.

## 6. Load, performance and resilience test matrix

Before release, test at minimum:
- 10, 50, 100, 500 and 1,000 concurrent chapter readers.
- Sudden ramp from low traffic to 1,000 concurrent sessions.
- Homepage/catalog/search traffic mix.
- Repeated hot chapter reads with cache cold and warm.
- Authenticated and anonymous traffic mix.
- Concurrent comments, follows, bookmarks and reading-position writes.
- Database slowdowns, queue outages, cache misses and provider timeouts.
- Duplicate payment callbacks and retry storms.
- Malformed requests, bot traffic and rate-limit evasion.
- Mobile network latency, interrupted requests and retry behavior.

Measure p50/p95/p99 latency, throughput, error rate, cache hit ratio, database query latency, write failures, queue age/depth, CPU/runtime duration, memory where available, and cost per 1,000 requests. Establish service-level objectives only after baseline measurements.

Release gates:
- No unexplained 5xx increase under expected load.
- No cross-user data leakage under concurrent access.
- No duplicate ticket credit or payment ledger corruption.
- No route returning a false success on failed persistence.
- No unbounded queue growth under sustained traffic.
- Recovery and rollback procedures exercised.
- Known capacity ceiling and next scaling action documented.

## 7. Owner control centre

One mobile-friendly owner console should expose:
- Platform status and active incidents.
- Traffic and performance overview.
- Reader and author growth, with privacy-respecting aggregate analytics.
- Content publishing and rights-review queues.
- Reports and safety cases.
- Ticket/payment reconciliation.
- AI/provider usage and cost limits.
- OmniPortal and Trend Factory source health.
- Database, cache, storage and queue health.
- Backup and restore verification.
- Security events and active sessions.
- Release history and rollback controls.

Use clear operational actions: inspect, retry, pause, approve, reject, revoke, restore, rollback. Dangerous actions need a preview and explicit confirmation. Avoid a cluttered cockpit of decorative metrics.

## 8. Route families to include in the master registry

Identity: /user/:username, /user/:username/library, /user/:username/activity, /user/:username/reviews, /settings/profile, /settings/privacy, /settings/security, /settings/sessions, /settings/notifications, /settings/language, /settings/blocked-users, /settings/muted-users, /settings/data-and-privacy.

Social: /followers, /following, /messages, /messages/requests, /messages/:conversationId, /messages/settings, /community/discussions, /community/discussions/:discussionId, /community/forums/:forumSlug, /community/forums/:forumSlug/topics/:topicId.

Creator: /creator, /creator/projects, /creator/projects/:projectId, /creator/novels/:novelId/team, /creator/novels/:novelId/permissions, /creator/novels/:novelId/rights, /creator/novels/:novelId/translation/:locale.

Safety: /safety, /safety/report, /safety/appeals, /safety/appeals/:appealId.

Owner-only: /owner, /owner/users, /owner/roles, /owner/permissions, /owner/moderation, /owner/rights, /owner/finance, /owner/providers, /owner/ai, /owner/localization, /owner/seo, /owner/security, /owner/audit, /owner/backups, /owner/operations, /owner/releases.

Staff routes, if ever delegated, should live in a distinct protected namespace and remain disabled until assigned. Sensitive owner routes must not be exposed as public navigation or indexed.

## 9. Other essential architecture controls

- Accessibility: keyboard support, semantic landmarks, screen-reader labels, contrast, reduced motion, focus management and readable typography.
- Reader comfort: font controls, line height, width, theme, brightness-safe palettes, reduced animation and persistent per-user preferences.
- Content rights: provenance, license evidence, takedown workflow, dispute status, territorial constraints and source attribution.
- Content integrity: publication state machine, draft/published separation, version history, review gate and rollback.
- Data protection: data classification, retention schedules, export, deletion, encryption in transit and at rest where supported, secret management and least privilege.
- Abuse resistance: rate limits, anti-spam, bot detection, block-evasion controls, safe uploads and report/appeal workflows.
- Financial integrity: append-only ticket ledger, idempotent payment reconciliation, clear pending states, manual adjustment audit and no credit from unverified callbacks.
- Localization: locale-aware routes, canonical/hreflang strategy, right-to-left layout, localized search and safe fallback.
- SEO/AEO/GEO: index only public eligible pages, structured metadata, stable canonical URLs, sitemap partitioning, freshness and crawl budget.
- Observability: structured logs, request correlation IDs, redaction of secrets/PII, error rates, latency histograms and alert thresholds.
- Disaster recovery: backup schedule, restore drills, recovery point objective and recovery time objective defined from business needs.
- Cost control: budgets and alerts for AI, storage, bandwidth, queue operations and external providers; hard limits for optional paid services.
- Feature flags: staged rollout, kill switch, per-domain rollback and no hidden dependency on unfinished features.

## 10. Architecture completion gates

Do not begin broad production implementation or deployment until:
1. Every route and navigation item is registered and conflict-checked.
2. Every route maps to a screen, shell, action or explicit redirect/404.
3. Every screen maps to components, actions and empty/loading/error/forbidden states.
4. Every action maps to an API contract and data mutation/read.
5. Every API maps to authentication, authorization, validation, rate limits, audit and error semantics.
6. Every data entity has ownership, privacy classification, retention and relationship constraints.
7. Every role/permission has a least-privilege policy and abuse-case tests.
8. Every real-time event has producer, consumer, scope and failure behavior.
9. Every public route has canonical, locale and indexing policy.
10. Every domain has responsive and accessibility requirements.
11. Critical journeys have end-to-end tests.
12. Load and failure tests demonstrate the agreed launch capacity.
13. Backup, restore, rollback and incident procedures are documented.
14. All architecture decisions and unresolved questions are recorded.

## 11. Evidence and status

This document is an architecture blueprint, not proof of deployed capacity. Existing repository code and current Cloudflare limits must be inspected and load-tested before making any throughput claim. The traffic tiers above are targets for test planning, not verified guarantees. Existing route and role implementations must be reconciled against this target before migrations are designed.

No production source, database, Worker configuration or deployment is changed by this document.