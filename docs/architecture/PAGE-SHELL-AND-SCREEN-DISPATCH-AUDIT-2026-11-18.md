# Page Shell and Client Screen Dispatch Audit

**Audit date:** 2026-11-19  
**Scope:** Canonical Worker page registry, HTML shell dispatch, client boot dispatcher, URL policy and source-level accessibility contracts.

## Shared application screens

The shared boot router in `public/app.js` dispatches:

| Route | Client screen / behavior |
|---|---|
| `/` | `home()` |
| `/catalog`, `/discover` | `catalog()` |
| `/formats` | `formatDirectory()` |
| `/format/:id` | `formatLanding()` |
| `/genres` | `genres()` |
| `/tags` | `tags()` |
| `/search` | `search()` |
| `/novel/:id` | `novel()` |
| `/novel/:id/chapters` | `chapters()` |
| `/read/:novelId/:chapterId` | `reader()` |
| `/library` | `library()` |
| `/history` | `history()` |
| `/following` | `following()` |
| `/tickets` | `tickets()` |
| `/requests` | `requests()` |
| `/omniportal` | `omni()` |
| `/trend-factory` | `trendFactory()` |
| `/community`, `/leaderboard`, `/tier-list`, `/random`, `/made-for-you`, `/for-you`, `/trending`, `/vote`, `/notifications` | `discoveryPage(kind)` |
| `/settings` | `settings()` |
| `/author` | `authorStudio()` |
| `/account` | `account()` |
| `/login`, `/register` | `authPage(mode)` |
| `/author/:username` | `authorPublic()` |

These are observed dispatch calls, not a claim that every screen has complete or production-ready interactions.

## Standalone HTML screens

The Worker serves standalone documents outside the shared boot router:

- `/admin` → `admin.html`, a dedicated dashboard with inline application logic and noindex.
- `/community-taxonomy` → `community-taxonomy.html`, a standalone taxonomy page.
- `/privacy`, `/terms`, `/copyright` → standalone legal documents.

Each standalone screen still needs its own browser and assistive-technology QA.

## Canonical route and URL behavior

- `src/route-registry.mjs` is the runtime source for exact page shells, six dynamic page families, exact noindex utility paths and static sitemap membership.
- The Worker uses the same resolver for outer fetch dispatch and HTML shell selection; `src/sitemap.mjs` imports static paths from that registry.
- Known page paths with trailing slashes receive a 308 redirect to the slashless canonical path, preserving query parameters.
- `/fandom/{path}` is now a server-side 308 redirect to `/catalog?tag={last-path-segment}`; query parameters are retained and the tag is URL-encoded. The old client redirect remains only as a fallback.
- Indexable HTML responses receive a query-free canonical link. Exact private/utility paths and unknown routes receive noindex directives.
- Unknown extensionless paths return the 404 shell with HTTP 404 rather than a soft 200.
- Locale-prefixed URLs are not implemented. UI language is separate from chapter-body direction.

## Accessibility and RTL source contracts

The build now checks:
- Skip-to-main-content link and semantic header/navigation/main landmarks.
- Visible keyboard focus, reduced-motion handling and forced-colors focus support in source and versioned stylesheets.
- All 14 UI language options.
- Urdu, Arabic and Persian UI direction as RTL.
- Chapter content uses `dir="auto"`, independent of the UI locale.

These are source-level checks. They do not certify actual screen-reader output, contrast in every state, keyboard focus order, touch targets or responsive layout.

## Remaining screen audit

Still unverified and release-gated:

- Visual completeness and responsive behavior for every exact and dynamic route.
- Whether every visible control is wired to a real backend action.
- Loading, empty, error, unauthorized and permission-denied states.
- Keyboard navigation, focus trapping, screen-reader announcements and semantic form errors in a real browser.
- RTL page layout and mixed-direction chapter typography on real devices.
- Direct-load behavior and canonical redirects on the deployed Worker.

No production deployment or D1 mutation was performed by this audit.
