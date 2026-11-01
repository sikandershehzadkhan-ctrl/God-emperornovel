# Imperial Novel | Phase 01Q: Complete Platform Reference Architecture

**Product:** Imperial Novel  
**Brand line:** Read • Create • Conquer  
**Architecture baseline:** Phase 01M screen-to-route blueprint, Phase 01N evidence audit, Phase 01O schema reconciliation, Phase 01P authorization model  
**Status:** Target reference architecture. This document is a design contract, not proof that any capability is implemented, tested, or deployed.

## 1. Purpose and governing decisions

This document joins the product, experience, application, data, security, integration, operations, and delivery views into one reference model. It is the parent architecture for subsequent domain specifications.

Imperial Novel is a rights-aware, multilingual reading, publishing, discovery, community, and creator-commerce platform. It must work well on low-to-mid-range Android phones and remain usable under intermittent mobile networks and constrained infrastructure.

Non-negotiable principles:
1. One product with explicit domains and shared platform foundations.
2. Private by default. Every user-owned resource is scoped to the authenticated principal and checked on every request.
3. The server is authoritative. Client state, route names, hidden controls, IDs and request payloads never grant access.
4. Rights before distribution. No work, chapter, metadata import or provider feed is distributed beyond documented rights.
5. Truthful data. Counts, ratings, rankings, freshness, online status and financial states come from defined sources.
6. Progressive capability. Unavailable providers, AI keys, payment rails or real-time transports degrade honestly rather than simulating success.
7. Mobile-first performance, accessibility and reading comfort.
8. Sensitive actions are auditable.
9. Ordered, immutable SQL migrations are the target schema authority.
10. Incremental delivery with evidence-based completion gates.

## 2. Product capability map

### 2.1 Reader and catalog
- Public home, discovery, search, taxonomy, collections and rankings.
- Novel detail, chapter listing, chapter reader, reviews, ratings and reactions.
- Library, bookmarks, reading history, reading positions, follows and notifications.
- Reader themes: Light, Dark, Midnight, Sepia, Imperial and Cosmic.
- Adjustable typography, line width, spacing, brightness guidance, reduced motion, progress restore and accessible navigation.
- Ratings are whole-number submissions from 1 to 10. Aggregate averages are derived values and labelled as averages.

### 2.2 Creator and publishing
- Author onboarding and eligibility.
- Author Studio dashboard, work editor, chapter editor, drafts, autosave, preview, scheduling and publication workflow.
- Rights/provenance declarations and evidence.
- Author profile, public catalog, verified analytics and reader feedback.
- Drafts and unpublished works are visible only to their owner and explicitly assigned reviewers with a valid purpose and permission.
- Publishing requires rights eligibility and valid workflow state. Authors cannot self-approve a review that requires independence.

### 2.3 Community and trust
- Comments, threaded discussions, reactions, reviews, follows, reports, moderation queues, appeals and user blocking/muting.
- Moderation actions are scoped to assigned queues and policy. They do not grant finance, provider-secret or unrelated private-content access.
- Case notes and reporter identity are restricted.

### 2.4 Commerce and creator support
- Ticket packages: PKR 10, 25, 50 and 100, subject to verified pricing configuration.
- Ticket ledger is append-only; corrections use compensating entries.
- Unlock prices and balances are calculated server-side.
- EasyPaisa remains unavailable until a legitimate merchant integration and reconciliation process are approved and verified.
- Payment claims use pending, approved and rejected states with idempotent transitions and evidence retention.
- No client-supplied balance, price, ticket quantity, payment status or approval result is trusted.

### 2.5 OmniPortal and Trend Factory
- OmniPortal is a provider- and rights-aware catalog discovery and metadata integration layer.
- Connectors default to disabled. Activation requires provider terms, rights scope, approved capabilities, safe endpoint validation and accountable review.
- Metadata/RSS/API-first acquisition. Chapter-body ingestion, mirroring or redistribution is disabled unless explicit rights permit it.
- Trend Factory discovers topics and catalog opportunities from approved metadata, RSS and APIs; it stores source, timestamp, terms status, attribution and provenance.
- Provider availability is not evidence of content rights.
- Reject private/local addresses, credential-bearing URLs, unsafe redirects, unsupported ports and unapproved hosts to prevent SSRF.

### 2.6 AI Author Studio and operational agents
- AI requires an authorized backend provider and valid server-held credentials. No fake generation, browser-exposed secret or hidden provider fallback.
- User prompts, generated drafts and AI projects are private to their owner unless explicitly shared.
- AI use is rate-limited, cost-bounded and records provider/model/version, usage, outcome and policy state without unnecessary prompt logging.
- Agents are allowlisted and scoped. They cannot self-assign permissions, bypass rights, approve their own financial actions or mutate policy.
- Proposed agents: Revenue, Provider Health, Duplicate Detection, Catalog Steward, Security Sentinel, Analytics and Omni Orchestrator. Each needs a capability contract and human approval gates for high-risk actions.

## 3. Experience and presentation architecture

### 3.1 Brand and visual system
- Product name: Imperial Novel. Deployment identifiers are never user-facing branding.
- Brand line: Read • Create • Conquer.
- Direction: Modern Smart Imperial Shenhao; premium, contemporary, editorial and futuristic.
- Core palette: Imperial Purple, Pure White, Sapphire Blue and Obsidian Black. Gold is a restrained accent, not the dominant surface color.
- Visual motif: black sun and empty throne / celestial palace, used as a distinctive signature rather than repetitive decoration.
- Avoid generic anime collage, crypto-casino gradients, excessive glow, rainbow palettes, clutter and template-like AI visuals.
- Typography, spacing, radii, shadows, elevation, motion and focus treatments are tokenized and shared across shells.

### 3.2 Application shells
- Public shell: discovery and marketing.
- Reader shell: minimal chrome, content-first, controls never obscure text.
- Creator shell: workspace navigation, autosave, preview and publishing state.
- Community shell: feeds, conversations and safety controls.
- Commerce shell: clear amounts, currency, references, status and confirmation.
- Admin shell: role-scoped modules, audit context and approval queues.
- System shell: maintenance, error, offline, restricted and recovery states.

### 3.3 Navigation
Desktop: Home, Discover, Trending, For You, Rankings, Library, Community, Author, More.  
Mobile: Home, Discover, Library, Create, Community, Profile.

Admin, finance and security controls never appear in public navigation. A visible link is not an access grant.

### 3.4 Universal screen contract
Every screen defines purpose, audience, canonical route, aliases, shell, entry/exit paths, components, API calls, data dependencies, authorization, SEO policy, localization, accessibility, responsive behavior, loading/empty/error/offline/forbidden/expired states, analytics and acceptance tests.

## 4. Logical system context

### 4.1 Actors
Anonymous visitor; registered reader; author; moderator and support staff; editorial and rights reviewers; publishing manager; finance operator and approver; provider operator; security analyst and administrator; analyst and agent operator; administrator/emergency super administrator; approved external provider and payment system; scheduled system job and constrained automation agent.

### 4.2 Logical layers
1. Experience: responsive web application, reader, creator workspace and staff consoles.
2. Edge/API: Cloudflare Worker entry, routing, validation, authentication, authorization, rate limiting and response policy.
3. Domain: identity, catalog, reading, creator, community, commerce, rights, providers, AI, analytics and operations.
4. Persistence: D1 relational data, object/media storage where configured, safe derived-data cache and migration history.
5. Async/event: verified job/event mechanism, retries, idempotency and dead-letter handling.
6. External integrations: approved payment, email, AI, analytics and metadata providers.
7. Governance: permissions, audit, privacy, retention, legal policy, release controls and incident response.

This is a logical decomposition, not a claim that every layer is a separate service. Start with a modular monolith on the existing Worker/D1 stack unless measured scale or isolation requirements justify splitting a domain.

## 5. Domain boundaries and ownership

| Domain | Owns | Must not own |
|---|---|---|
| Identity & Access | users, sessions, account state, roles, grants, security events | novel content or financial ledger |
| Catalog | novel metadata, taxonomy, publication eligibility, public catalog views | private reader history |
| Reading | chapters, reading positions, bookmarks, history, unlock entitlement checks | role assignment |
| Creator | author workspace, drafts, chapters, editorial submissions, schedules | payment approval |
| Community | comments, reactions, follows, reports, moderation cases | provider credentials |
| Commerce | ticket products, orders, payment claims, ledger, refunds, reconciliation | content rights decisions |
| Rights & Publishing | evidence, license scope, reviews, publication decisions | payment reconciliation |
| OmniPortal | provider registry, connector grants, metadata jobs, provenance | unrestricted chapter-body ingestion |
| Trend Factory | source observations, trend candidates, editorial review | automatic republication |
| AI Studio | user projects, generation jobs, usage/cost records | permission policy or secret disclosure |
| Analytics | event definitions, aggregate metrics, reporting | unrestricted user-level private data |
| Operations | health, jobs, feature flags, incidents, audit views | domain ownership bypass |

Domain modules expose explicit operations. Cross-domain writes use a documented application service or event, not ad-hoc direct mutation from unrelated handlers.

## 6. Route, API and authorization architecture

### 6.1 Route registry
- One canonical route registry defines route ID, path, parameters, aliases, shell, audience, indexing and access classification.
- Static routes match before dynamic parameters.
- Legacy aliases redirect explicitly and preserve meaningful query state.
- API routes are separately inventoried with method, request/response schema, side effects, permission, ownership predicate, rate limit, idempotency and audit requirements.
- Route metadata is navigation/documentation input only, never authorization.

### 6.2 Request enforcement pipeline
Every protected request:
1. Normalizes method, path and request metadata.
2. Applies size, content-type and rate limits.
3. Authenticates session and validates session/account state.
4. Validates input against a strict allowlisted schema.
5. Resolves resources using scoped queries where possible.
6. Checks permission, ownership, assignment, resource state and separation-of-duties rules.
7. Executes the domain operation transactionally where needed.
8. Writes required audit and outbox/event records.
9. Returns a minimal response with safe cache headers.
10. Emits privacy-safe telemetry.

Fail closed if required authorization, audit or transaction guarantees cannot be met.

### 6.3 Authorization model
Authentication answers who is calling. Account state answers whether the account may act. Role groups capabilities. Permission authorizes an operation. Ownership scopes a user resource. Assignment scopes staff access. Resource state determines whether an action is valid now. Context attributes further constrain region, sensitivity, amount, provider, time or purpose.

Use deny-by-default RBAC plus resource-level ABAC and ownership checks. Do not expand the current four-role string model into arbitrary user-editable role values. Migrate toward normalized role assignments, permissions and scoped grants with compatibility for existing users.

### 6.4 Private resource isolation
- Derive principal ID from the authenticated session, never from client-supplied owner ID.
- Read/update/delete queries include owner ID in the SQL predicate.
- Child resources validate child ID and parent ownership in the same scoped operation.
- Never fetch globally by opaque ID and rely on the UI to hide the result.
- Return a consistent not-found response for inaccessible private resources where revealing existence creates an oracle.
- Private responses use no-store/private cache policy unless a rigorously user-keyed cache is proven safe.
- Search, export, notifications, analytics, logs and background jobs preserve the same owner boundary.
- Staff access requires explicit permission, assignment, purpose and audit. Emergency access is time-limited.
- Test cross-user reads, writes, deletes, exports, event subscriptions and cached responses.

Sensitive classes include private messages, drafts, AI projects/prompts, reading history, library, payment evidence, tickets/ledger, support cases, session data and private analytics.

## 7. Data architecture

### 7.1 Authority and lifecycle
- Numbered SQL migrations are the target schema authority.
- Released migrations are immutable.
- Application version and database schema version are separate.
- Runtime verifies schema compatibility and reports a controlled unavailable state; it does not silently repair schema during ordinary requests.
- Data seeding is explicit and deterministic, not an incidental production bootstrap side effect.
- Existing runtime DDL must be reconciled with deployed installations before removal.

### 7.2 Core entity families
Identity: users, sessions, role assignments, permissions, grants, account events.  
Catalog: novels, chapters, genres, tags, collections, language, content warnings, rights records.  
Reading: reading positions, history, bookmarks, follows, unlock entitlements.  
Creator: author applications, projects, drafts, editorial submissions, schedules.  
Community: comments, reactions, reviews, reports, moderation cases, appeals.  
Commerce: ticket products, orders, payment claims, ledger entries, refunds, reconciliation.  
Provider: providers, connector authorizations, credential references, import jobs, provenance.  
AI: projects, prompt metadata, generation jobs, usage, cost and policy decisions.  
Operations: audit events, outbox, job runs, feature flags, incidents, schema history.

### 7.3 Integrity and data classification
- Foreign keys, unique constraints, CHECK constraints and indexes enforce invariants.
- Transactions protect balance changes, unlocks, payment approvals and publication transitions.
- Optimistic concurrency/version columns protect editor and review state.
- Idempotency keys protect payment callbacks, unlock requests, retries and jobs.
- Financial ledger is append-only; corrections use compensating entries.
- Backfills are bounded, resumable, observable and idempotent.
- Retention and deletion/anonymization are defined by data class.

Classification:
- Public: published novel metadata, public author profile, moderated public comments.
- User-private: reading history, library, drafts, messages, AI projects, personal settings.
- Sensitive: payment evidence, support cases, moderation reports, identity verification, session/security metadata.
- Restricted-secret: provider API keys, signing secrets, payment credentials and encryption material.
- Aggregated: de-identified analytics with minimum-cohort protections.

Each class has access, encryption, logging, cache, retention, export and deletion rules.

## 8. API and event architecture

### 8.1 API conventions
- Document externally meaningful contracts and version breaking changes.
- Validate path, query, headers and JSON body independently.
- Reject unknown properties on sensitive writes.
- Use consistent error codes and correlation IDs without exposing internals.
- Paginate unbounded collections with stable ordering and bounded page size.
- Use UTC timestamps and explicit currency codes.
- Calculate prices, permissions and state transitions on the server.
- Apply CSRF protection to cookie-authenticated state-changing requests; use Secure, HttpOnly, SameSite cookies and session rotation/revocation.
- CORS is an explicit allowlist, not wildcard for credentialed requests.

### 8.2 Domain events
Candidate events: UserRegistered, AccountStateChanged, SessionRevoked, NovelDraftSaved, RightsEvidenceSubmitted, NovelApproved, NovelPublished, ChapterPublished, ReadingPositionUpdated, NovelFollowed, CommentCreated, ReportOpened, ModerationDecisionRecorded, PaymentClaimSubmitted, PaymentApproved, PaymentRejected, TicketLedgerEntryCreated, ChapterUnlocked, ConnectorAuthorizationChanged, MetadataImportCompleted, AIGenerationRequested, AIGenerationCompleted, AIGenerationFailed, SecurityIncidentOpened, AgentRunStarted and AgentRunCompleted.

Events carry stable IDs, schema version, occurred-at time, actor/service identity, owner scope where applicable, aggregate ID and minimal payload. Never broadcast private content or secrets. Consumers are idempotent and retry-safe.

### 8.3 Real-time contract
Real-time means a declared transport and freshness target, not a decorative live badge.
- Use push only when the transport is verified and operationally reliable.
- Otherwise use bounded polling with documented interval, backoff, visibility pause and last-updated timestamp.
- Presence is ephemeral and privacy-controlled; recent activity is not online presence.
- Views, likes, comments and chapter counts define unique events, deduplication, bot filtering and measurement windows.
- Distinguish eventual consistency from transactional state.

## 9. Search, ranking and recommendation

- Search indexes only content eligible for the requesting audience. Private drafts and user data never enter public indexes.
- Query normalization, pagination, filters and sort keys are bounded and validated.
- Ranking algorithms have named signals, time windows, minimum-data thresholds and abuse controls.
- Separate popularity, quality, freshness, editorial selection and personalized recommendation labels.
- For You has user controls and a non-personalized fallback.
- Avoid sensitive profiling and provide reset/opt-out behavior where applicable.
- Ratings are integer 1–10 submissions; aggregate rating and count are separate fields with eligibility rules.
- Every displayed metric has a definition, source, time window and freshness label.

## 10. Localization, accessibility and reading comfort

- Locale-aware interface strings with a documented fallback chain.
- Initial language candidates: English, Urdu, Hindi, Simplified/Traditional Chinese, Japanese, Indonesian, French, Korean, Brazilian Portuguese, Arabic and Spanish, subject to reviewed translations.
- RTL layouts are tested in Urdu and Arabic, including mixed-direction punctuation and numbers.
- Currency, dates, numerals and time zones use locale-aware formatting.
- Novel source language is distinct from interface language and translation availability.
- Accessibility goal: WCAG 2.2 AA.
- Keyboard operation, semantic landmarks, focus management, visible focus, contrast, screen-reader labels, text resize, reduced motion and accessible validation are required.
- Reading comfort includes adjustable font size, line height, width, spacing, warm/cool themes, brightness guidance and no flashing or autoplay motion.

## 11. SEO, AEO and GEO

- Public published content gets stable canonical URLs, unique titles/descriptions and accurate structured data.
- Private pages, account pages, reader history, drafts, admin, search queries and sensitive states are noindex and protected server-side.
- Sitemap includes only canonical, eligible, indexable public routes.
- Robots directives never substitute for access control.
- AEO uses concise factual summaries, clear headings, entity consistency, author/source attribution and machine-readable metadata.
- GEO uses stable entity names, canonical profiles, accurate organization details, crawlable public content and transparent provenance.
- Avoid doorway pages, keyword stuffing, fake review markup, fabricated author credentials and unsupported aggregate counts.

## 12. Security, privacy and abuse resistance

Threat model: account takeover, session theft, IDOR, privilege escalation, CSRF, XSS, SQL injection, SSRF, spam, scraping, payment replay, race conditions, malicious uploads, prompt injection, data exfiltration, insider misuse and compromised providers.

Baseline controls:
- Secure password hashing and login throttling.
- Session rotation, revocation, expiry and secure cookie attributes.
- Strict output escaping and a compatible content security policy.
- Parameterized SQL and strict schema validation.
- Rate limits by account, IP/risk signal and operation.
- Abuse controls for comments, ratings, follows, votes, unlocks and reports.
- Safe upload allowlists, size limits, content inspection and private storage.
- SSRF-safe provider fetch with allowlists and redirect/IP validation.
- Server-side secret storage; never return secret values to browser or admin UI.
- Audit trails for privileged and sensitive operations.
- Data minimization, export, correction and deletion workflows.
- Incident response, credential rotation and breach containment playbooks.
- Independent security review before production rollout of finance, role management, connector activation and AI execution.

## 13. Performance and resilience

Set measurable targets and validate on representative low-end Android hardware and constrained networks:
- Fast text-first render; defer noncritical shelves and heavy media.
- Route-level code splitting and bounded JavaScript.
- Responsive images, modern formats, lazy loading and explicit dimensions.
- Avoid layout shifts, expensive blur/backdrop effects and continuous animation.
- Cache public catalog data safely; never share private cache entries across users.
- Offline reading may preserve already-authorized cached chapters only within defined rights and expiry policy.
- Retry transient reads with backoff; do not blindly retry non-idempotent writes.
- Gracefully degrade when recommendations, AI, analytics or providers fail.
- Health checks distinguish liveness, readiness, dependency health and schema compatibility.
- Define backup, restore, RPO/RTO and forward-recovery policy before critical releases.

## 14. Observability and operations

- Structured logs with request/correlation IDs and redaction.
- Metrics for latency, error rate, saturation, queue age, database failures, cache behavior, payment reconciliation and publication pipeline.
- Correlation across Worker, D1, jobs and providers where feasible.
- Alerts for auth anomalies, IDOR signals, repeated payment failures, ledger mismatch, connector abuse, queue backlog and schema incompatibility.
- Audit logs are separate from debug logs and protected from ordinary staff mutation.
- Admin dashboards show operational state and data freshness, not fabricated green indicators.
- Feature flags are server-controlled, audited and scoped. Security-critical controls fail closed.

## 15. Staff governance and separation of duties

Use the Phase 01P role catalogue as a target, not as currently implemented roles. Use normalized role assignments and permissions, scoped resource assignments, expiring elevated access, purpose-bound support access and audited emergency access.

High-risk separation:
- A requester cannot approve their own rights, payment, refund, role elevation or provider activation.
- Finance initiation and approval are separate capabilities.
- Rights review and publishing approval are separate where policy requires.
- Agent operators cannot edit agent policy or grant themselves capabilities.
- Security administrators cannot silently erase audit history.
- Super-admin access is exceptional, time-limited and reviewed.

## 16. Deployment and environment architecture

Environments:
1. Local/unit fixture environment.
2. Disposable integration database environment.
3. Staging Worker with staging-only bindings and synthetic data.
4. Production Worker and production D1, protected by explicit approval.

Rules:
- Production secrets and databases are never used by tests.
- Staging and production credentials are distinct.
- Build, unit, schema, security, asset and smoke tests gate release.
- Migrations are reviewed and serialized before application code that requires them.
- Rollback distinguishes code rollback from irreversible data migration; prefer forward-fix for destructive data changes.
- Production deploy requires explicit confirmation, backup/recovery readiness and post-deploy smoke verification.
- Infrastructure Worker name god-emperornovel is metadata only; user-facing brand remains Imperial Novel.

## 17. Delivery sequence and dependency gates

**Gate A — Foundation:** route registry, shells/tokens, API inventory, identity/session audit, schema authority, logging and test harness.

**Gate B — Private account and reader core:** account lifecycle, profile, library, bookmarks, reading position/history, follows, notifications and cross-user isolation tests.

**Gate C — Catalog and creator:** catalog eligibility, author onboarding, drafts, chapters, ownership-safe editor, rights evidence and publishing state machine.

**Gate D — Community and trust:** comments, reactions, reports, moderation, appeals, blocking and abuse controls.

**Gate E — Commerce:** ticket products, immutable ledger, unlock transactions, payment claims, reconciliation, idempotency and independent approval.

**Gate F — Discovery intelligence:** search, rankings, trending, recommendation, analytics definitions and freshness contracts.

**Gate G — OmniPortal and Trend Factory:** provider directory, authorization workflow, metadata-only ingestion, provenance, SSRF protections and human editorial review.

**Gate H — AI Author Studio and agents:** provider configuration, private projects, usage/cost limits, safety controls, agent allowlists and human approval.

**Gate I — Scale, localization and polish:** additional languages, AEO/GEO, accessibility, performance, observability, backup/restore drills and runbooks.

Each gate has exit criteria. A screen existing does not mean the capability is complete.

## 18. Definition of done

A capability is complete only when its user outcome and screen behavior are specified; routes and API contracts are registered; ownership and permission rules are enforced server-side; schema is covered by reviewed migrations; validation, rate limiting, idempotency and audit exist where required; loading/empty/error/offline/forbidden/expired states work; mobile, keyboard, screen-reader and localization checks pass; SEO/privacy policies are correct; metrics have definitions and freshness labels; unit/integration/authorization/abuse/regression tests pass; staging is verified with synthetic data; and release/recovery steps are documented.

Production status is reported only after actual deployment and smoke evidence.

## 19. Open decisions and blockers

Resolve by repository and environment evidence, not assumptions:
1. Exact production baseline commit and deployed application version.
2. Actual production D1 schema and migration history.
3. Complete route/API inventory against current Worker handlers.
4. Complete runtime DDL inventory and safe migration-only adoption path.
5. Supported staging database/Worker provisioning and test execution.
6. Confirmed provider contracts and approved rights scope.
7. Verified payment merchant integration and reconciliation process.
8. Chosen real-time transport and measurable freshness SLO.
9. Backup/restore capability and agreed RPO/RTO.
10. Data retention, privacy and account deletion policy for every sensitive data class.

## 20. Architecture status and next artifacts

This reference architecture consolidates design intent and evidence from prior phases. It does not certify implementation completeness. Existing behavior must be inspected domain by domain; every target control must map to a concrete route, query, schema object, test and operational control before release.

Next artifacts:
1. Domain-to-table ownership and data-flow map.
2. End-to-end user journeys and state machines.
3. Consolidated API contract catalogue.
4. Environment/release topology and measurable SLOs.
5. Traceability matrix linking requirements to implementation and tests.
