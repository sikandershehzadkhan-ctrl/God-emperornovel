# Imperial Novel | Phase 01N: Repository Evidence Audit

**Audit date:** 2026-11-01  
**Repository:** `sikandershehzadkhan-ctrl/God-emperornovel`  
**Audited ref:** `architecture/phase-01m-screen-blueprint`  
**Package version observed:** `17.23.0`  
**Status:** Static source/configuration inspection. No production access or code execution.

## 1. Executive finding

The audited branch contains a substantial single-Worker application, a large client-rendered application, one baseline SQL migration plus additive migrations 0009–0011, runtime schema bootstrap helpers, numerous static source tests and a manual production workflow.

The main architectural risk is not absence of all functionality. It is **schema and behavior distributed across multiple mechanisms**:
1. baseline SQL migration;
2. additive numbered SQL migrations;
3. runtime core schema bootstrap with a version marker;
4. feature-specific runtime schema helpers;
5. request-time schema creation/alteration;
6. scheduled agent automation.

These mechanisms are not yet represented by one authoritative migration ledger. A fresh-database migration check appears inconsistent with the current migration set: migration 0010 indexes `novels.publication_status`, but baseline migration 0001 does not define that column. The Worker adds it later through `ensurePublishingSchema`, but the workflow's fresh SQLite migration check executes only the SQL files and does not run that Worker helper. This is a release-blocking preflight concern that must be reproduced in CI before any production deployment.

This audit does not authorize a schema change or deploy.

## 2. Evidence inventory

| Artifact | Observed state | Significance |
|---|---|---|
| `package.json` | Version 17.23.0; large `build` script | Build runs many source tests and syntax checks |
| `wrangler.toml` | Worker `god-emperornovel`; main `src/index.js`; assets `./public`; D1 binding `DB` | Current branch config points static assets to public directory |
| `migrations/0001_initial.sql` | Baseline tables and indexes | Defines foundational data model |
| `migrations/0009_catalog_filter_indexes.sql` | Catalog reverse-lookup indexes | Requires baseline taxonomy join tables |
| `migrations/0010_catalog_sort_indexes.sql` | Published catalog sort indexes | Requires `novels.publication_status` |
| `migrations/0011_author_applications.sql` | Author application table and indexes | Requires users table |
| `src/runtime-feature-schema.mjs` | Runtime versioned feature schema helper | Creates auth rate limits, engagement, request votes and comment columns |
| `src/index.js` | Worker/API, HTML routing, runtime bootstrap, agents | Large conditional dispatcher and multiple schema mechanisms |
| `public/app.js` | Client pathname dispatch and UI renderers | Route handling is not a declarative central registry |
| `.github/workflows/deploy.yml` | Manual production workflow | Requires explicit confirmation and gates migration/deploy |
| `scripts/test-production-deploy-gates.mjs` | Source-level deploy assertions | Checks manual confirmation, migration ordering and routes |
| `scripts/test-payment-webhook-disabled.mjs` | Webhook safety assertion | Confirms generic webhook remains disabled |

### Migration path reconciliation

Verified existing paths on the audited branch:
- `migrations/0001_initial.sql`
- `migrations/0009_catalog_filter_indexes.sql`
- `migrations/0010_catalog_sort_indexes.sql`
- `migrations/0011_author_applications.sql`

The guessed paths `0002_auth.sql` through `0008_platform_overview.sql` were not found at those exact paths. Do not assume those migration files exist. This does not prove that no equivalent schema changes were applied; runtime bootstrap and helper code create additional structures.

## 3. Database and schema findings

### 3.1 Baseline migration 0001

The baseline migration creates:
- users and sessions;
- novels and chapters;
- genres, tags and novel taxonomy joins;
- unlocks and batch unlocks;
- bookmarks and reading history;
- donations and connectors;
- comments and novel requests;
- audit logs.

It does not, in the inspected file, define all later fields and tables used by the Worker. In particular, the baseline `novels` definition does not include `publication_status` or creator ownership/review fields.

### 3.2 Runtime core schema

`ensureCoreSchema` in `src/index.js` creates or ensures additional tables including:
- ticket ledger;
- follows and user library;
- ratings with integer CHECK constraint from 1 to 10;
- comment reports and reports;
- notifications;
- agents and agent runs;
- app settings.

It also calls publishing schema, taxonomy, agent and AI Author schema helpers. It uses `app_settings.core_schema_version` and returns early when the marker equals `16.64.0`. The observed package version is 17.23.0, so the package release version and core schema marker are separate version concepts. Their relationship needs explicit documentation and a migration policy.

### 3.3 Feature and domain runtime schema

Additional schema is created outside numbered migrations:
- `ensurePublishingSchema`: adds novel ownership/publication/rights/review columns, chapter publication status and timestamps, chapter views and indexes.
- `createRuntimeFeatureSchemaEnsurer`: creates auth rate limits, comment likes/reports, novel reactions and request votes, and adds comment parent/edit columns.
- `ensureOmniTables`: adds connector capability/secret-reference/rights fields and creates connector events, import jobs, recommendations and authorization requests.
- AI Author Studio helper creates project, chapter job, generation run, benchmark and publishing policy structures.
- Analytics/engagement helpers create daily view and reaction/like tables.
- Taxonomy and donation index helpers add more runtime objects.

**Decision:** Before any schema implementation, produce a complete table/column/index inventory from all numbered SQL, runtime helpers, Worker queries and production schema metadata. Establish one forward-only migration authority. Runtime helpers should either be converted into explicit migration-managed changes or formally documented as idempotent bootstrap prerequisites with tested versioning and rollback/recovery behavior.

### 3.4 Fresh-database migration preflight concern

The production workflow's source-validation step runs a Python SQLite database and applies every `migrations/*.sql` file in lexical order. The observed 0010 SQL creates indexes using `publication_status`. The observed 0001 migration does not create that column. The Worker later adds it through `ensurePublishingSchema`, but that helper is not executed by the SQL-only preflight.

This is a concrete source-level incompatibility. Reproduce it with the exact migration files in a clean SQLite database and resolve it in a reviewed change before relying on the workflow as a valid fresh-install gate. Do not patch production or rewrite historical migrations as part of this audit.

## 4. Deployment and release controls

Observed `wrangler.toml`:
- Worker name: `god-emperornovel`.
- Entry point: `src/index.js`.
- Static assets directory: `./public`.
- D1 database name: `god-emperornovel-db`.
- D1 binding: `DB`.
- Cron triggers: every 15 minutes, hourly and daily at 03:00.
- `SITE_NAME` is Imperial Novel and `APP_VERSION` is 17.23.0.
- `OPENAI_MODEL` and base URL are configured as non-secret variables; API key is expected as a secret.
- Connector host allowlist is empty in the inspected file.
- Payment webhook secret variable is blank in the inspected file.

Observed deploy workflow:
- Manual `workflow_dispatch` only.
- Requires explicit `confirm_production_deploy=true`.
- No push or pull-request deployment trigger.
- Runs readiness checks, `npm ci`, `npm run build`, and fresh SQLite migration preflight.
- Checks Cloudflare token/account secrets.
- Checks production schema marker and required structures.
- Applies additive migrations before Worker deployment.
- Performs post-deploy route/API and D1 verification.

The workflow has valuable safety gates, but its migration preflight concern above must be resolved. This audit did not inspect secret values, execute the workflow, verify credentials or access Cloudflare production.

## 5. Route and API architecture reconciliation

### 5.1 Routing implementation

The Worker uses a large pathname/method conditional dispatcher in `api()` and an HTML route map in `html()`. The browser client uses pathname checks and page functions in `public/app.js`. A central declarative route registry was not observed.

Worker HTML route map includes public and account routes such as:
- `/`, `/catalog`, `/discover`, `/genres`, `/tags`, `/search`;
- `/library`, `/history`, `/following`, `/tickets`, `/requests`;
- `/omniportal`, `/community`, `/leaderboard`, `/tier-list`, `/random`;
- `/made-for-you`, `/for-you`, `/trending`, `/vote`, `/notifications`;
- `/settings`, `/account`, `/login`, `/register`, `/admin`, `/author`, `/trend-factory`;
- `/privacy`, `/terms`, `/copyright`, `/community-taxonomy`;
- `/novel/:id`, `/novel/:id/chapters`, `/read/:novelId/:chapterNumber`, `/fandom/*`, `/author/:slug`.

The client has a visible author application route `/become-an-author`; the HTML map maps it to `index.html`. Earlier production checks reported this route returned 404. Current branch routing is not proof of production route parity.

### 5.2 Observed API groups

- Health/config/auth: `/api/health`, `/api/config`, `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/me`, `/api/profile`.
- Catalog/taxonomy: `/api/genres`, `/api/tags`, `/api/formats`, `/api/novels`, `/api/novels/:id`, `/api/chapters/:id`, `/api/discovery/graph`.
- Reading/library: `/api/bookmark`, `/api/bookmarks`, `/api/library`, `/api/history`, `/api/reading-position`, `/api/recommendations`.
- Engagement/community: `/api/chapter-engagement`, `/api/novel-engagement`, `/api/novel-reactions`, `/api/comments`, `/api/comments/like`, `/api/comments/report`, `/api/rating`, `/api/report`, `/api/follow`, `/api/follows`, `/api/notifications`.
- Creator: `/api/author/applications`, `/api/author/applications/me`, `/api/author/analytics`, `/api/author/novels`, `/api/author/chapters`, `/api/author/ai/*`.
- Administration: `/api/admin/stats`, `/api/admin/users`, `/api/admin/agents`, `/api/admin/publishing/*`, `/api/admin/reports`, `/api/admin/community/*`, `/api/admin/donations`, `/api/admin/tickets`, `/api/admin/connectors`, `/api/admin/connector-authorization-requests`.
- OmniPortal: `/api/sources`, `/api/omni/status`, `/api/omni/search`, `/api/omni/resolve`, `/api/omni/import`, `/api/omni/jobs`, `/api/omni/smart-unlock`, plus connector authorization/admin endpoints.
- Commerce/requests: `/api/donations`, `/api/payment/webhook`, `/api/tickets/ledger`, `/api/requests`, `/api/vote-novels`.
- Platform metrics: `/api/platform/overview`, `/api/leaderboard`, `/api/tier-list`, `/api/random`, `/api/made-for-you`.

This list is an observed source inventory, not an exhaustive HTTP contract or production-verified API catalogue. Method, auth, request/response schemas, rate limits and side effects must be extracted per route before implementation.

## 6. Authorization, audit and agent findings

- `need(u)` checks authentication.
- `admin(u)` grants broad access when `u.role === 'admin'`.
- `author(u)` accepts admin or author role.
- Fine-grained route-specific RBAC/ABAC was not observed in the inspected guard helpers.
- Audit helper attempts an insert into `audit_logs` but catches and suppresses all failures. This is insufficient as the sole audit guarantee for consequential operations.
- User role values in the baseline migration have a CHECK constraint limited to user/author/moderator/admin; runtime core schema creates users without that same CHECK. Fresh and upgraded database behavior therefore needs reconciliation.
- Agent registry includes Revenue, Provider Health, Duplicate Detection, Catalog Steward, Security Sentinel, Analytics, Moderation, Notification and Omni Orchestrator, among others.
- Several agent paths perform simple local status/summary operations. Provider Health marks configured status based on the presence of search URL; this is not a real provider availability probe. Duplicate Detection records a queued-for-review message rather than a demonstrated duplicate scan in the inspected function. Security Agent summarizes open report count rather than a full threat-detection pipeline.
- Optional OpenAI integration falls back to local canned results when no key is present or a request fails. This fallback should never be described as a successful model-backed execution.
- Scheduled automation runs provider-health, notification, catalog, duplicate, security and analytics agents. Cron schedule is configured in Wrangler, but actual deployed trigger state was not checked.

## 7. Commerce and payment safety

- `/api/config` reports payments disabled until an approved merchant integration is configured.
- Generic `/api/payment/webhook` deliberately returns 503 and states provider-specific signature, amount, currency, event identity and replay protections are not verified.
- Donations use pending/manual review workflow; admin donation state changes and Crown ledger operations are present in source.
- Test `test-payment-webhook-disabled.mjs` asserts no webhook-driven user Crown balance or ledger credit occurs.
- Crown ledger and balance are separate persisted structures; reconciliation, refund, duplicate callback and financial audit tests remain required.
- Do not claim EasyPaisa checkout or automatic settlement is operational from the inspected code.

## 8. Real-time and analytics integrity

- Engagement and overview endpoints query D1 at request time.
- Client notification refresh uses a 30-second interval while the notifications page is visible.
- No WebSocket, Durable Object broadcast or server-sent event channel was established by this inspection.
- Request-time metrics and polling are not push real-time delivery.
- Daily view tables track view requests; unique readers and completed reads require separate instrumentation.
- Author analytics code must be described according to exact counters, not generic “unique readers” unless separately implemented.
- Any real-time label needs a timestamp and explicit mechanism: request-time, polling interval, scheduled refresh or push.

## 9. SEO, AEO and GEO foundation

Observed Worker HTML behavior:
- Route-specific title/description, canonical URL, robots policy and structured data for eligible novel, chapter and author pages.
- Dynamic robots and sitemap index/shards.
- Sitemap eligibility filters published works with allowed rights states.
- Locked chapter pages are marked noindex in the inspected path.
- HTML response applies CSP, nosniff, referrer policy, frame and permissions headers; a separate secure wrapper adds HSTS.
- Canonical author profiles are based on author names in the observed route logic.

Not verified:
- Search Console/Bing webmaster ownership or indexing outcomes;
- structured-data validity in external validators;
- social preview coverage across all routes;
- full AEO answer extraction and FAQ coverage;
- GEO entity/knowledge graph recognition;
- hreflang correctness and locale sitemap strategy;
- Core Web Vitals on real mobile devices.

AEO and GEO must be implemented as measurable content/entity/structured-data improvements, not claimed as rankings or guaranteed AI citations.

## 10. Test coverage and missing proof

The package build script includes tests for design foundation, library data flow, reading-position sync, notification delivery, content quality, discovery graph, home integration, live overview, SEO, formats, comics, catalog fallback, donations, runtime feature schema, auth, author applications, ratings, deploy gates, atomic unlock/refund and payment webhook safety, plus syntax and asset checks.

These are source-level tests referenced by the build script. They were not executed during this audit. A test file existing is not proof that it passes in the current environment or on production.

Missing evidence before architecture exit:
- clean migration chain test with runtime/bootstrap compatibility resolved;
- production D1 table/column/index inventory and schema marker verification;
- route-by-route production status and response contract inventory;
- permission matrix mapped to every write endpoint;
- audit failure behavior for high-impact operations;
- idempotency and concurrency test coverage for every financial mutation;
- provider rights and actual connector health evidence;
- real mobile performance and accessibility testing;
- real-time event freshness and delivery guarantees;
- current production deployment SHA/config versus audited branch.

## 11. Architecture decisions required before implementation

| Decision | Current evidence | Required resolution |
|---|---|---|
| Schema authority | SQL migrations plus runtime schema helpers | Define one versioned, forward-only migration plan |
| Fresh install | 0010 references a column added at runtime | Make SQL preflight and actual install path consistent |
| Core schema marker | Fixed 16.64.0 marker, package 17.23.0 | Define schema version independent of app version and upgrade path |
| Authorization | Coarse admin/author guards | Map granular permissions to every endpoint |
| Audit reliability | Errors suppressed by helper | Fail closed or durable pending state for high-risk actions |
| Agent capability | Local status strings and partial checks | Capability contract, truthful statuses, execution evidence |
| Production parity | Branch source only | Verify deployed commit/config/schema read-only |
| Route architecture | Multiple pathname conditionals | Create central route registry and generated checks |
| Real-time claims | D1 request-time plus polling | Specify event transport, freshness and fallback |
| Payments | Manual pending; generic webhook disabled | Provider-specific approved integration and ledger reconciliation |
| Privacy/account | Partial user journeys | Define export/deletion/recovery and retention workflows |

## 12. Recommended order of next architecture work

1. **01N.1 Schema authority and migration decision record.** Resolve the migration/runtime bootstrap mismatch without touching production.
2. **01N.2 API and permission matrix.** Classify every route by method, auth, owner scope, role/permission, validation, side effects and audit.
3. **01N.3 Route registry and SEO policy map.** Reconcile client, Worker HTML map and proposed canonical routes.
4. **01N.4 Real-time and analytics contract.** Define event source, polling/push, freshness and metric semantics.
5. **01N.5 Release and verification contract.** Make local/CI/Cloudflare migration, dry-run, D1 compatibility and post-deploy checks consistent.
6. **01N exit review.** Resolve blockers and sign off architecture before application code changes.

## 13. Safety boundary

This audit used GitHub source/configuration reads only. It did not execute the build, tests, migration SQL or workflow; query production D1; inspect secret values; authenticate to the live site; change source code; change D1; merge a PR; alter production settings; or deploy.

The findings describe the audited branch and may differ from main or production. Production parity remains unverified.
