# Imperial Novel Master Route Registry — Phase 01N

Status: Architecture draft, read-only source audit performed.
Product: Imperial Novel
Promise: Read • Create • Conquer
Scope: Canonical route taxonomy and observed route inventory.
Safety: This document does not authorize implementation, merge, database mutation, or production deployment.

## 1. Evidence and reconciliation basis

The registry was reconciled against `src/index.js` on the architecture branch based on `feature/imperial-design-architecture-seo` (source blob `13874ee0fde4e31e04a652c5169776c3b6f95c38`). The Worker currently dispatches HTML routes through an explicit page map plus dynamic path patterns, and API routes through a separate `/api/` dispatcher.

Important: a path being accepted by the HTML dispatcher does not prove that its page has a complete, dedicated screen. Several paths currently resolve to `index.html`, so route existence and screen completeness are tracked separately.

The existing product architecture explicitly preserves numeric novel/chapter identifiers until a tested migration exists. Therefore this registry does not replace the established `/novel/:id` and `/read/:id/:chapter` contracts with slug-based routes.

## 2. Canonical route rules

1. Lowercase paths; use hyphens for multiword static segments.
2. One canonical URL per indexable resource.
3. Omit trailing slashes except the root route.
4. Dynamic identifiers must be validated against the owning resource and parent relationship.
5. Stable database IDs are authoritative; slugs are presentation and discoverability aids.
6. Query parameters express filters, sorting, pagination, or temporary view state, not separate resource identities.
7. Unknown routes return a real 404 response/page; do not silently serve the homepage as a fallback.
8. Moved resources use explicit permanent redirects only after the destination is verified.
9. Private routes require server-side authorization regardless of robots directives.
10. API routes are versioned under `/api/v1/` for new contracts. Existing unversioned API paths remain compatibility contracts until migration is designed and tested.
11. Route ownership is assigned to one primary product domain. Shared components do not change route ownership.
12. Every navigation entry and actionable link must point to a registered route or declare a non-navigation action.

## 3. Route record contract

Every route record must contain:

- `route_id`: immutable registry identifier.
- `pattern`: canonical path or path pattern.
- `route_type`: page, API, redirect, asset, or system.
- `status`: observed, target, deprecated, or blocked.
- `domain_owner`: one primary product domain.
- `screen_id`: screen/template identifier for page routes.
- `source_file`: current router/dispatcher source.
- `methods`: allowed HTTP methods for API routes.
- `auth_policy`: public, optional, authenticated, owner, author, moderator, admin, service, or unresolved.
- `permission`: explicit capability required.
- `data_contract`: entities and response/request schema.
- `seo_policy`: index, noindex, canonical, sitemap, and alternate-language policy.
- `realtime_policy`: none, polling, event, or push, with freshness definition.
- `states`: loading, empty, error, success, forbidden, and not-found behavior.
- `tests`: route match, permission, contract, navigation, accessibility, and responsive checks.

No route is marked complete while its screen, permissions, or tests remain unresolved.

## 4. Observed public and utility page routes

These are paths currently present in the HTML dispatcher. “Shell mapping” identifies the HTML file selected by the Worker, not proof that all screen behavior is complete.

| Canonical path/pattern | Worker shell | Primary owner | Access / index policy | Audit note |
|---|---|---|---|---|
| `/` | index.html | Brand & Discovery | Public, index | Homepage |
| `/catalog` | catalog.html | Discovery | Public, index if useful | Catalog |
| `/discover` | catalog.html | Discovery | Public, index | Alias/template route; canonical policy required |
| `/trending` | index.html | Discovery | Public, conditional index | Dedicated destination required |
| `/for-you` | index.html | Discovery | Auth-aware, noindex | Personalization screen must define signed-out behavior |
| `/made-for-you` | index.html | Discovery | Auth-aware, noindex | Overlaps /for-you; reconcile into one canonical route |
| `/leaderboard` | index.html | Discovery / Community | Public, conditional index | Ranking dimensions and data definitions required |
| `/tier-list` | index.html | Community | Public, conditional index | Ranking methodology required |
| `/random` | index.html | Discovery | Public, noindex | Action/utility, not a stable landing page |
| `/vote` | index.html | Community | Auth policy unresolved | Define vote target and state |
| `/genres` | genres.html | Taxonomy & Discovery | Public, index if populated | Directory |
| `/tags` | tags.html | Taxonomy & Discovery | Public, index if populated | Directory |
| `/formats` | index.html | Content Formats | Public, index if substantive | Currently shares homepage shell |
| `/format/:formatSlug` | index.html | Content Formats | Public, conditional index | Dynamic format landing |
| `/search` | search.html | Search | Public, noindex | Search query must not create crawl traps |
| `/library` | library.html | Reader / Account | Authenticated, noindex | Private user data |
| `/history` | history.html | Reader / Account | Authenticated, noindex | Private reading history |
| `/following` | following.html | Account / Community | Authenticated, noindex | Private following list |
| `/notifications` | index.html | Account / Real-time | Authenticated, noindex | Dedicated screen and unread state required |
| `/settings` | index.html | Account & Identity | Authenticated, noindex | Settings subsections not yet individually routed |
| `/account` | account.html | Account & Identity | Authenticated, noindex | Account overview |
| `/login` | login.html | Identity | Public, noindex | Authentication |
| `/register` | register.html | Identity | Public, noindex | Registration |
| `/tickets` | tickets.html | Commerce | Authenticated, noindex | Balance and transaction privacy |
| `/requests` | requests.html | Reader / Community | Auth policy unresolved | Define request ownership and visibility |
| `/omniportal` | omniportal.html | OmniPortal | Public/private split unresolved | Current public surface and connector controls must be separated |
| `/trend-factory` | index.html | Trend Factory | Internal/authenticated, noindex | Dedicated workspace required |
| `/community` | index.html | Community | Public, conditional index | Community landing |
| `/community-taxonomy` | community-taxonomy.html | Community Governance | Public submission / admin review | Separate public and admin workflows |
| `/privacy` | privacy.html | Legal | Public, index | Legal content |
| `/terms` | terms.html | Legal | Public, index | Legal content |
| `/copyright` | copyright.html | Legal & Rights | Public, index | Rights policy |
| `/admin` | admin.html | Administration | Admin only, noindex | Admin shell; subroutes needed |
| `/author` | index.html | Creator | Authenticated, noindex | Private author entry/application |
| `/become-an-author` | index.html | Creator Onboarding | Public, index | Public onboarding; distinct from /author |

### Dynamic public content routes

| Pattern | Shell | Owner | Access / index policy | Contract |
|---|---|---|---|---|
| `/novel/:novelId` | novel.html | Story Catalog | Published + rights eligible; index | Numeric novel ID preserved |
| `/novel/:novelId/chapters` | novel.html | Story Catalog | Published; conditional index | Chapter directory |
| `/read/:novelId/:chapterNumber` | read.html | Reader | Published/readable; chapter-specific index policy | Existing reader URL contract |
| `/author/:username` | author-public.html | Public Author Profiles | Public profile; index only when useful | Distinct from private /author |
| `/fandom/:slug` | fandom.html | Community / Fandom | Rights-cleared, substantive content only | Dynamic topic landing |

### Dispatcher and screen gaps

- `/trending`, `/for-you`, `/made-for-you`, `/leaderboard`, `/tier-list`, `/random`, `/vote`, `/notifications`, `/settings`, `/formats`, `/trend-factory`, `/community`, `/admin`, `/author`, and `/become-an-author` currently select `index.html` or a shared shell. Each requires screen-level verification and a defined component/action map.
- `/for-you` and `/made-for-you` are overlapping destinations. Select one canonical route and preserve the other only as a redirect/compatibility alias after confirming current links.
- `/discover` maps to the catalog shell. Canonical and menu-label behavior must be consistent.
- The dynamic novel and chapter routes use numeric identifiers today. Do not change them without a route migration plan, redirect table, sitemap reconciliation, and bookmark compatibility tests.
- The Worker HTML dispatcher can serve a shell for a path without proving that the client renders the intended screen. Browser route coverage is required.

## 5. Observed API route inventory

The following exact path families were found in the Worker API dispatcher on the audited source revision. This is a path inventory, not a complete method/permission contract. Methods and authorization are to be extracted and reviewed route by route in Phase 01N.3–01N.5.

### Identity and account
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/me`
- `/api/profile`
- `/api/config`

### Catalog, discovery and taxonomy
- `/api/novels`
- `/api/novels/:id`
- `/api/chapters/:id`
- `/api/genres`
- `/api/tags`
- `/api/formats`
- `/api/public-authors`
- `/api/discovery/graph`
- `/api/search` (not confirmed in this source inventory; do not assume it exists)
- `/api/random`
- `/api/recommendations`
- `/api/made-for-you`
- `/api/leaderboard`
- `/api/tier-list`
- `/api/vote-novels`

### Reading, library and engagement
- `/api/library`
- `/api/history`
- `/api/follow`
- `/api/follows`
- `/api/bookmark`
- `/api/bookmarks`
- `/api/reading-position`
- `/api/chapter-engagement`
- `/api/novel-engagement`
- `/api/novel-reactions`
- `/api/rating`
- `/api/comments`
- `/api/comments/like`
- `/api/comments/report`
- `/api/report`
- `/api/notifications`
- `/api/notifications/read`

### Creator and AI
- `/api/author/applications`
- `/api/author/applications/me`
- `/api/author/novels`
- `/api/author/chapters`
- `/api/author/analytics`
- `/api/author/ai/status`
- `/api/author/ai/projects`
- `/api/author/ai/projects/:id`
- `/api/author/ai/benchmarks`

### Commerce
- `/api/tickets/ledger`
- `/api/donations`
- `/api/payment/webhook`
- `/api/novels/:id/batch-unlock`

### OmniPortal and external providers
- `/api/sources`
- `/api/omni/status`
- `/api/omni/search`
- `/api/omni/resolve`
- `/api/omni/import`
- `/api/omni/jobs`
- `/api/omni/smart-unlock`
- `/api/connector-authorization-requests`

### Community
- `/api/taxonomy`
- `/api/requests`

### Administration and operations
- `/api/health`
- `/api/agents`
- `/api/admin/agents`
- `/api/admin/agents/run`
- `/api/admin/stats`
- `/api/admin/users`
- `/api/admin/users/:id`
- `/api/admin/tickets`
- `/api/admin/donations`
- `/api/admin/donations/:id`
- `/api/admin/requests`
- `/api/admin/reports`
- `/api/admin/reports/:id`
- `/api/admin/taxonomy`
- `/api/admin/author-applications`
- `/api/admin/connector-authorization-requests`
- `/api/admin/connector-authorization-requests/:id`
- `/api/admin/connectors`
- `/api/admin/connectors/cleanup`
- `/api/admin/omni/health`
- `/api/admin/publishing`
- `/api/admin/publishing/novels`
- `/api/admin/publishing/novels/:id`
- `/api/admin/publishing/chapters`
- `/api/admin/publishing/chapters/:id`
- `/api/admin/publishing/chapters/reorder`
- `/api/admin/community/comments`
- `/api/admin/community/reports`

### Platform intelligence
- `/api/platform/overview`

## 6. Proposed target routes not yet verified as implemented

These are architecture targets, not observed current routes. They must not be linked from production until their screens and backend contracts exist.

- `/rankings` and explicit ranking dimensions such as `/rankings/power`, `/rankings/collections`, `/rankings/active`
- `/genres/:genreSlug`
- `/tags/:tagSlug`
- `/categories` and `/categories/:categorySlug`
- `/languages` and `/languages/:languageCode`
- `/new-releases`, `/completed`, `/recently-updated`
- `/novel/:novelSlug` as a future SEO-friendly alias/canonical migration, only after numeric route redirect design
- `/novel/:novelId/chapter/:chapterId/:chapterSlug` as a future stable chapter identity route, only after migration and collision tests
- `/user/:username`
- `/settings/profile`, `/settings/security`, `/settings/privacy`, `/settings/language`
- `/creator/dashboard`, `/creator/novels`, `/creator/novels/new`, `/creator/novels/:novelId/edit`
- `/creator/novels/:novelId/chapters`, `/creator/novels/:novelId/chapters/new`, `/creator/novels/:novelId/chapters/:chapterId/edit`
- `/creator/publishing`, `/creator/analytics`, `/creator/earnings`, `/creator/settings`
- `/community/discussions`, `/community/discussions/:discussionId`, `/community/forums`, `/community/forums/:forumSlug`
- `/omni-portal` as a future canonical spelling, with `/omniportal` retained as a redirect only after route audit
- `/omni-portal/providers`, `/omni-portal/providers/:providerId`, `/omni-portal/connections`
- `/trend-factory/discover`, `/trend-factory/trends/:trendId`, `/trend-factory/imports`, `/trend-factory/imports/:importId`
- `/admin/dashboard`, `/admin/novels`, `/admin/chapters`, `/admin/security`, `/admin/audit-logs`, `/admin/analytics`, `/admin/system/health`, `/admin/settings`, `/admin/agents`

## 7. Namespace and collision rules

- Reserve top-level product namespaces: `admin`, `api`, `author`, `become-an-author`, `catalog`, `community`, `discover`, `format`, `formats`, `fandom`, `genres`, `history`, `library`, `login`, `novel`, `notifications`, `omniportal`, `read`, `register`, `search`, `settings`, `tags`, `tickets`, `trend-factory`, `trending`.
- Public usernames and novel slugs must never shadow reserved system routes.
- `/author` is the private creator entry; `/author/:username` is a public profile. The exact path must be matched before the dynamic profile pattern.
- `/novel/:id/chapters` must be matched before `/novel/:id`.
- `/read/:novelId/:chapterNumber` is a distinct reader namespace and must not be interpreted as a novel slug route.
- API paths must never fall through to the HTML page dispatcher.
- Admin APIs must not be exposed through public client-side route aliases.

## 8. Language and localization policy

Do not introduce language-prefixed URLs indiscriminately. First separate interface locale from content language:

- Interface locale controls navigation, labels, formatting, accessibility strings and RTL direction.
- Content language describes the novel/chapter itself and is catalog metadata.
- A translated edition is a distinct authorized content edition with its own identity and canonical relationship to the source work.
- Locale prefixes (for example `/ur/`, `/hi/`, `/ja/`, `/zh-CN/`, `/zh-TW/`, `/ar/`) are reserved for genuinely translated/indexable page experiences, not merely a reader preference cookie.
- Every translated page needs reciprocal `hreflang`, a self-canonical URL, translated metadata and a valid fallback.
- Do not generate empty translated URLs or duplicate indexable copies of untranslated content.

## 9. Indexing and sitemap invariants

- Index only useful, public, published, rights-eligible resources.
- Exclude account, library, history, notifications, settings, creator workspace, admin, payment, connector control, private import and internal analytics routes.
- Chapter indexing must follow publication, access and content-quality rules; locked/private chapters must not be accidentally indexed.
- Search result URLs with arbitrary query combinations must not create crawl traps.
- Sitemap membership is derived from verified route eligibility, not from a static list of every registered path.
- Robots directives are not authorization.

## 10. Phase 01N completion gates

- 01N.1 taxonomy and naming: this document establishes the draft rules; needs review against all navigation sources.
- 01N.2 inventory: observed page/API inventory captured; needs complete menu/link scan and API method extraction.
- 01N.3 screen map: pending.
- 01N.4 data/API contract map: pending.
- 01N.5 permissions and ownership: pending.
- 01N.6 localization/SEO: initial policy captured; per-route metadata pending.
- 01N.7 automated route coverage: pending.
- 01N.8 architecture reconciliation: pending.

No implementation, merge or production release is authorized by this architecture document.
