# Phase 01N.2 — Navigation and Route Coverage Audit

Status: First-pass source audit completed on the Phase 01N architecture branch.
Audited source revision: `src/index.js` blob `13874ee0fde4e31e04a652c5169776c3b6f95c38`; `public/app.js` blob `e857029f17d6f6d44233031cdb2b1029a60f6ac9`; `public/admin.html` blob `67a4624a4e439ca3ad62c73313d3b72e109ce66a`.

This is a source-level route audit, not browser QA. It identifies links and dispatch rules visible in source. It does not claim every client interaction was exercised.

## 1. Navigation destinations observed in the main application bundle

The main application bundle contains links to these route destinations:

- `/`
- `/catalog`
- `/catalog?sort=trending`
- `/catalog?sort=updated`
- `/catalog?sort=rating`
- `/catalog?status=completed`
- `/catalog?kind=fanfiction`
- `/catalog?genre=...`
- `/catalog?tag=...`
- `/catalog?author=...`
- `/leaderboard`
- `/library`
- `/community`
- `/become-an-author`
- `/search`
- `/notifications`
- `/account`
- `/trend-factory`
- `/genres`
- `/formats`
- `/author`
- `/tickets`
- `/omniportal`
- `/admin`
- `/privacy`
- `/terms`
- `/copyright`
- `/tags`
- `/format/:formatId`
- `/novel/:numericId`
- `/novel/:numericId/chapters`
- `/read/:numericNovelId/:chapterNumber`
- `/login`
- `/register`
- `/history`
- `/following`
- `/requests`
- `/tier-list`
- `/vote`
- `/random`
- `/made-for-you`

The catalog query-state vocabulary observed in client links includes `sort`, `status`, `kind`, `genre`, `tag`, and `author`. The catalog registry must define allowed values, validation, default sort, pagination behavior, and canonical/indexing behavior for each combination.

## 2. Admin navigation and feature surface

The Admin HTML currently contains internal controls that call admin APIs for:

- Publishing queue and novel/chapter moderation
- Admin statistics
- User management
- Ticket management
- Community comments and reports
- Author applications
- Taxonomy review
- Donations
- Requests
- General reports
- Agent operations
- Connector management and authorization requests
- OmniPortal provider health

The Worker currently exposes the exact `/admin` HTML route. It does not define the proposed individual page routes such as `/admin/users`, `/admin/novels`, `/admin/security`, `/admin/audit-logs`, or `/admin/analytics` in its explicit HTML route map. Those must be treated as target routes, not existing destinations. The current admin surface is primarily a single dashboard with internal sections/actions, not a fully routed admin information architecture.

The Admin page contains links to `/catalog`, `/community-taxonomy`, `/omniportal`, `/account`, `/`, and `/login`. These cross-domain links must be checked for role-aware behavior and safe return paths.

## 3. Confirmed routing gaps against the desired complete platform

| Gap ID | Missing or incomplete route family | Current evidence | Architecture requirement |
|---|---|---|---|
| NAV-001 | User profile `/user/:username` | No matching Worker page route found | Public profile route with privacy-aware sections |
| NAV-002 | Creator workspace subroutes | Only `/author` entry exists in HTML route map | Dedicated dashboard, novels, chapter manager, editor, publishing, analytics and settings routes |
| NAV-003 | Admin subroutes | Only exact `/admin` page is mapped | Dedicated URLs for each admin domain and record detail |
| NAV-004 | Novel SEO slug routes | Current public links use numeric `/novel/:id` | Preserve numeric contract now; design future alias/redirect migration separately |
| NAV-005 | Stable chapter identity route | Current links use `/read/:novelId/:chapterNumber` | Stable chapter ID canonical identity requires migration plan |
| NAV-006 | Genre detail routes | `/genres` exists; no genre detail path in Worker map | `/genres/:genreSlug` |
| NAV-007 | Tag detail routes | `/tags` exists; no tag detail path in Worker map | `/tags/:tagSlug` |
| NAV-008 | Category routes | No category page family observed | Category directory and detail routes, if categories are a distinct taxonomy |
| NAV-009 | Rankings taxonomy | `/leaderboard` and `/tier-list` exist; no `/rankings` route | Define ranking landing and distinct ranking dimensions; avoid duplicate ranking concepts |
| NAV-010 | Account settings subsections | Only `/settings` maps to shared homepage shell | Profile, security, privacy, language and notification preferences routes |
| NAV-011 | Community detail routes | `/community` exists; discussion/forum detail patterns not mapped | Discussion and forum index/detail routes if those features are in scope |
| NAV-012 | OmniPortal route spelling and hierarchy | Existing path is `/omniportal` | Decide whether to retain it or migrate to `/omni-portal`; never break current links |
| NAV-013 | Trend Factory workspace routes | Only `/trend-factory` is mapped | Discover, trend detail, import queue and import review routes |
| NAV-014 | Language landing routes | Language is a catalog filter; no dedicated language route family observed | Separate interface locale from content language; add landing routes only when substantive |
| NAV-015 | Notifications screen | Route exists but currently maps to `index.html` | Dedicated notifications screen, unread state, pagination and authorization |

## 4. Route matching hazards

1. `/author` and `/author/:username` share a namespace. The exact private creator route must be resolved before the dynamic public author profile route.
2. `/novel/:id/chapters` must be matched before `/novel/:id`.
3. `/read/:novelId/:chapterNumber` is the established reader route and must not be confused with a future slug-based chapter route.
4. `/discover` and `/catalog` both use the catalog shell. Their canonical and menu behavior needs one documented decision.
5. `/for-you` and `/made-for-you` are both present in route/client architecture. Consolidate or explicitly differentiate them.
6. Query-driven catalog states must be parsed and validated; unknown values must not create arbitrary canonical pages.
7. The Worker falls back to `404.html` in its HTML resolver for unmatched paths. Route tests must verify the HTTP status is actually 404, not merely a 404-looking page returned with status 200.
8. Admin and creator target subroutes currently lack explicit screen mapping. Do not link to them until registered and implemented.

## 5. Client API calls observed in the main application bundle

The application bundle references these API families:

- Identity: `/api/me`, `/api/auth/*`, `/api/profile`
- Catalog: `/api/novels`, `/api/novels/:id`, `/api/formats`, `/api/genres`, `/api/tags`
- Discovery: `/api/discovery/graph`, `/api/platform/overview`, `/api/recommendations`, `/api/leaderboard`, `/api/tier-list`, `/api/random`, `/api/made-for-you`
- Reader: `/api/chapters/:id`, `/api/reading-position`, `/api/chapter-engagement`, `/api/novel-engagement`
- Library: `/api/library`, `/api/history`, `/api/bookmark`, `/api/bookmarks`, `/api/follow`, `/api/follows`
- Community: `/api/requests`, `/api/comments`, `/api/rating`, `/api/vote-novels`
- Commerce: `/api/tickets/ledger`
- OmniPortal: `/api/omni/status`, `/api/omni/search`, `/api/omni/import`
- Notifications: `/api/notifications`, `/api/notifications/read`
- Creator: `/api/author/applications/me`, `/api/author/applications`, `/api/author/analytics`, `/api/author/novels`, `/api/author/chapters`

This is a client-reference list. It does not establish method, permission, or response contract; those are tracked separately.

## 6. Completion assessment

- Route taxonomy: drafted.
- Existing Worker HTML route inventory: captured.
- Existing API path inventory: captured.
- Main application navigation destinations: captured.
- Admin dashboard action/API surface: captured at path-family level.
- Missing target route families: identified.
- Full menu source reconciliation: incomplete (all secondary navigation, footer, mobile drawer, conditional/auth states and React-island links still need review).
- API method and permission matrix: incomplete.
- Browser-level route and HTTP status verification: not performed.
- Route-to-screen/component/action mapping: pending.

No production files were changed. No database or Worker configuration was changed. This audit is documentation-only.
