# Imperial Novel Route Registry — Current Mainline Reconciliation (01N-33)

**Audit date:** 3 November 2026  
**Audited branch:** `main`  
**Audited source:** `src/index.js`, blob `237f4461135eb77258b7184e361ce9dfd9a140e9`  
**Registry baseline:** `IMPERIAL-MASTER-ROUTE-REGISTRY-01N.md` and `.json`  
**Purpose:** Replace stale route-dispatch assumptions with a reproducible current-mainline snapshot.  
**Disposition:** Inventory reconciliation completed; route-to-screen, API method/auth, browser, and release gates remain separate and are not falsely marked complete.

## 1. Route dispatch contract observed on current main

The Worker HTML resolver contains 33 exact path-to-shell entries and four dynamic route families. Unknown paths select `404.html`. This is source evidence only; an HTTP 404 status and client-rendered screen still require runtime tests.

### Exact HTML routes

| Path | Shell | Access / SEO disposition |
|---|---|---|
| `/` | `index.html` | Public, indexable |
| `/catalog` | `catalog.html` | Public, indexable subject to content |
| `/discover` | `catalog.html` | Alias; canonical decision required |
| `/formats` | `index.html` | Public; verify format directory screen |
| `/genres` | `genres.html` | Public |
| `/tags` | `tags.html` | Public |
| `/search` | `search.html` | Public, noindex |
| `/library` | `library.html` | Authenticated, noindex |
| `/history` | `history.html` | Authenticated, noindex |
| `/following` | `following.html` | Authenticated, noindex |
| `/tickets` | `tickets.html` | Authenticated, noindex |
| `/requests` | `requests.html` | Auth policy and visibility require route-level verification |
| `/omniportal` | `omniportal.html` | Public status and authenticated actions must remain separated |
| `/community` | `index.html` | Public shell; dedicated screen verification required |
| `/leaderboard` | `index.html` | Public shell; ranking semantics required |
| `/tier-list` | `index.html` | Public shell; methodology required |
| `/random` | `index.html` | Utility/action route, normally noindex |
| `/made-for-you` | `index.html` | Personalized; noindex and per-user cache isolation |
| `/settings` | `index.html` | Authenticated, noindex |
| `/for-you` | `index.html` | Personalized; overlap with made-for-you must be resolved |
| `/trending` | `index.html` | Public shell; verify dedicated screen |
| `/vote` | `index.html` | Vote eligibility and target state required |
| `/notifications` | `index.html` | Authenticated, noindex |
| `/trend-factory` | `index.html` | Creator/internal workspace; noindex |
| `/community-taxonomy` | `community-taxonomy.html` | Public submission surface; moderation private |
| `/privacy` | `privacy.html` | Public legal page |
| `/terms` | `terms.html` | Public legal page |
| `/copyright` | `copyright.html` | Public rights/legal page |
| `/account` | `account.html` | Authenticated, noindex |
| `/login` | `login.html` | Public entry, noindex |
| `/register` | `register.html` | Public entry, noindex |
| `/admin` | `admin.html` | Administrator-only, noindex |
| `/author` | `index.html` | Private creator entry, noindex |

### Dynamic HTML route families

| Pattern | Shell | Access and matching rule |
|---|---|---|
| `/format/:formatSlug` | `index.html` | Public format landing; validate against registered format |
| `/novel/:numericId/chapters` | `novel.html` | Published, rights-eligible novel; match before novel detail |
| `/novel/:numericId` | `novel.html` | Published, rights-eligible novel; preserve numeric identity |
| `/read/:numericNovelId/:chapterNumber` | `read.html` | Published/readable chapter; preserve existing reader contract |
| `/fandom/:slug` | `fandom.html` | Public only when content and rights rules permit |
| `/author/:username` | `author-public.html` | Public author profile; exact `/author` must win first |

The Worker sitemap handler additionally recognizes `/sitemap.xml`, `/sitemap-static.xml`, `/sitemap-novels.xml`, and `/sitemap-chapters.xml`. Novel/chapter sitemap membership is limited to published works whose rights status is one of `original`, `public_domain`, `licensed`, or `authorized`; paging is bounded.

## 2. Noindex policy observed in current HTML resolver

The exact-path set currently contains:

- `/admin`
- `/account`
- `/login`
- `/register`
- `/library`
- `/history`
- `/following`
- `/tickets`
- `/requests`
- `/settings`
- `/notifications`
- `/author`

This is a source observation, not a full SEO certification. In particular, personalized routes, private route aliases, dynamic chapter access states, response headers, and canonical/hreflang behavior must be tested separately. Robots directives never replace authorization.

## 3. API route dispatcher inventory on current main

Static extraction found 74 exact API path comparisons. Dynamic suffixes and delegated handlers also exist; this table groups the observed API surface by domain. The route list does not infer methods where the handler does not explicitly constrain them.

### Identity and account
`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/me`, `/api/profile`, `/api/config`.

### Catalog, taxonomy and discovery
`/api/novels`, `/api/novels/:id`, `/api/genres`, `/api/tags`, `/api/formats`, `/api/public-authors`, `/api/discovery/graph`, `/api/random`, `/api/recommendations`, `/api/made-for-you`, `/api/leaderboard`, `/api/tier-list`, `/api/vote-novels`.

### Reader and engagement
`/api/chapters/:id`, `/api/novels/:id/batch-unlock`, `/api/library`, `/api/history`, `/api/follow`, `/api/follows`, `/api/bookmark`, `/api/bookmarks`, `/api/reading-position`, `/api/chapter-engagement`, `/api/novel-engagement`, `/api/novel-reactions`, `/api/rating`, `/api/comments`, `/api/comments/like`, `/api/comments/report`, `/api/report`, `/api/notifications`, `/api/notifications/read`.

### Creator and AI
`/api/author/applications`, `/api/author/applications/me`, `/api/author/novels`, `/api/author/chapters`, `/api/author/analytics`, `/api/author/ai/status`, `/api/author/ai/projects`, `/api/author/ai/benchmarks`.

### Commerce and requests
`/api/tickets/ledger`, `/api/donations`, `/api/payment/webhook`, `/api/requests`.

### OmniPortal and provider control
`/api/sources`, `/api/omni/status`, `/api/omni/search`, `/api/omni/resolve`, `/api/omni/import`, `/api/omni/jobs`, `/api/omni/smart-unlock`, `/api/connector-authorization-requests`.

### Community
`/api/taxonomy`, `/api/community/discussions`.

### Administration and operations
`/api/health`, `/api/agents`, `/api/admin/agents`, `/api/admin/agents/run`, `/api/admin/stats`, `/api/admin/users`, `/api/admin/tickets`, `/api/admin/donations`, `/api/admin/requests`, `/api/admin/reports`, `/api/admin/taxonomy`, `/api/admin/author-applications`, `/api/admin/connector-authorization-requests`, `/api/admin/connectors`, `/api/admin/connectors/cleanup`, `/api/admin/omni/health`, `/api/admin/publishing`, `/api/admin/publishing/novels`, `/api/admin/publishing/chapters`, `/api/admin/publishing/chapters/reorder`, `/api/admin/community/comments`, `/api/admin/community/reports`.

### Route-specific note
The current source has dynamic resource handlers under novel, chapter, author AI project, admin user, publishing novel/chapter, donation, report and connector-authorization paths. Their complete method, validation, ownership, response-field, rate-limit, cache and audit contracts must be generated from the actual handler branches and tested. Do not infer them from this path list.

## 4. Route conflicts and canonical decisions

1. `/discover` and `/catalog`: retain compatibility for both; choose one canonical destination and ensure internal links, metadata and sitemap agree.
2. `/for-you` and `/made-for-you`: determine whether these are true separate products. If not, designate one canonical path and redirect only after all client links and return URLs are reconciled.
3. `/author` versus `/author/:username`: exact private route first; public profile route must never inherit creator-workspace access.
4. `/novel/:id/chapters` before `/novel/:id`: required deterministic matching.
5. Numeric novel and chapter-number routes remain stable. Slug routes are not authorized until a migration, redirect table, sitemap, bookmarks, shares and analytics compatibility tests exist.
6. `/omniportal` remains the observed path. Do not rename to `/omni-portal` without a compatibility redirect and canonical review.
7. Do not create links to proposed creator/admin subroutes until the Worker, UI screen, API contracts and authorization tests all exist.

## 5. Target routes still missing from current HTML dispatcher

These are product targets, not existing production routes:

- Public profiles: `/user/:username` (unless deliberately consolidated with author profiles).
- Taxonomy detail: `/genres/:genreSlug`, `/tags/:tagSlug`; category and content-language landings only if they have distinct substantive data.
- Creator workspace: `/creator/dashboard`, `/creator/novels`, `/creator/novels/new`, `/creator/novels/:novelId/edit`, `/creator/novels/:novelId/chapters`, chapter create/edit, publishing, analytics, earnings and settings.
- Admin information architecture: dashboard, users, novels, chapters, rights review, reports, community moderation, payments, connectors, security, audit log, analytics and system health.
- Account settings: profile, security, privacy, language and notification preferences.
- Community: discussions/forums index and detail pages, if the feature is approved and implemented.
- Trend Factory: discovery, trend detail, imports and import review.
- OmniPortal: provider directory/detail and connection management, with public provider status separated from private connector configuration.

Do not add placeholders that silently render the homepage. Unimplemented target routes must remain unlinked and return a truthful 404 or an explicit not-yet-available response.

## 6. Universal route record contract

Every page, API endpoint, redirect and system endpoint must have a registry record with:

- immutable `route_id`, canonical pattern, route type and domain owner;
- observed/target/deprecated/blocked status and source revision;
- exact HTTP methods and content type where applicable;
- authentication class and named permission predicate;
- resource owner source, parent-child relationship and tenant boundary;
- request schema, response DTO/field allowlist and error contract;
- publication and rights eligibility requirements;
- cache policy, rate limit, idempotency and audit policy;
- SEO index/noindex/canonical/sitemap/hreflang policy for pages;
- loading, empty, success, error, forbidden and not-found states;
- navigation entry points and safe return-route behavior;
- automated route, permission, data-leakage, accessibility, responsive and browser tests.

A route is not complete merely because the Worker returns a shell or an API handler recognizes its path.

## 7. Completion register

| Work package | Result |
|---|---|
| Canonical naming and namespace rules | Documented |
| Current mainline exact HTML dispatch | Reconciled: 33 exact paths |
| Current mainline dynamic HTML dispatch | Reconciled: 6 dynamic families |
| Sitemap endpoint family | Reconciled |
| Current mainline exact API path comparisons | Reconciled: 74 static comparisons |
| Existing route conflicts | Identified with safe compatibility rules |
| Missing target page families | Enumerated |
| Per-endpoint method/auth/ownership/DTO matrix | Not complete; must be source-derived and tested |
| Full client navigation and footer/mobile link scan | Not complete |
| Per-route screen/component/action mapping | Not complete |
| HTTP status and route/browser coverage | Not complete |
| Production route verification | Not complete |
| Release/deployment | Not part of this architecture audit |

## 8. Release invariants

- Every private route is authorized server-side on every request.
- User A cannot read, change, export or enumerate User B's private data by changing IDs, query parameters, nested paths, pagination cursors or HTTP methods.
- Authors cannot access another author's drafts, chapters, analytics or projects without a valid explicit grant.
- Admin operations use the owner/permission model; a generic role label is not sufficient proof of authority.
- Public content routes consistently enforce publication and rights eligibility.
- Public APIs expose allowlisted DTOs, never future database columns by default.
- Private and personalized responses are not shared-cacheable.
- Unknown routes return an actual 404 status and do not fall through to the homepage.
- Sitemap and canonical metadata include only verified public, useful, rights-eligible resources.
- Every route change updates Worker dispatch, `wrangler.toml` asset routing, navigation, service-worker/PWA behavior where relevant, tests and this registry together.

**Conclusion:** The route inventory is now reconciled to the current `main` source snapshot. The route registry itself is not declared 100% complete because method/permission contracts, screen mapping, complete link discovery and runtime/browser verification remain open. No production route or database was changed by this document.
