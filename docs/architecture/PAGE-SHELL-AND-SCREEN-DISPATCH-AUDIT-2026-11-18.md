# Page Shell and Client Screen Dispatch Audit

**Audit date:** 2026-11-18  
**Scope:** Static Worker page shells and the client boot dispatcher in `public/app.js`.

## Shared application screens

The following route families are dispatched by the shared `boot()` router in `public/app.js`:

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
| `/community`, `/leaderboard`, `/tier-list`, `/random`, `/made-for-you`, `/for-you`, `/trending`, `/vote`, `/notifications` | `discoveryPage(kind)` with route-specific kind |
| `/settings` | `settings()` |
| `/author` | `authorStudio()` |
| `/account` | `account()` |
| `/login`, `/register` | `authPage(mode)` |
| `/author/:username` | `authorPublic()` |

These are observed dispatch calls, not a claim that every screen has complete or production-ready interactions.

## Standalone HTML screens

The Worker also serves standalone page documents that do not use the shared `app.js` boot router:

- `/admin` → `admin.html`, a dedicated dashboard document with inline application logic and a noindex directive.
- `/community-taxonomy` → `community-taxonomy.html`, a standalone taxonomy page with inline script.
- `/privacy` → `privacy.html`.
- `/terms` → `terms.html`.
- `/copyright` → `copyright.html`.

These routes need their own screen-level QA and should not be treated as shared-app screens.

## Important route behavior: fandom

The Worker recognizes `/fandom/{slug}` and serves `fandom.html`, but the client boot router does not render a dedicated fandom screen. It redirects the browser to `/catalog?tag={slug}`.

Therefore this route is classified as a **client-side tag redirect**, not as a completed fandom landing page. If a dedicated fandom experience is required later, it needs an explicit product and route decision rather than being assumed from the Worker dispatch pattern.

## Remaining screen audit

This document records dispatch and shell type only. The following remain unverified:

- Visual completeness and responsive behavior for each screen.
- Whether each control is wired to a real backend action.
- Loading, empty, error, and unauthorized states.
- Keyboard and screen-reader behavior.
- Locale and RTL coverage.
- Browser-level navigation and direct-load behavior on the deployed Worker.

No production deployment or D1 mutation was performed.
