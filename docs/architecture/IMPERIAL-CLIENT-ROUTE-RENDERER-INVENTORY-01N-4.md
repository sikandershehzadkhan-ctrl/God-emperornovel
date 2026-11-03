# Phase 01N.4 — Client Route Renderer Inventory

Status: client dispatch/render function mapped for 40/40 existing route records from source. This is a renderer-level inventory, not a full component tree, action audit, accessibility audit or browser test.

Repository: `sikandershehzadkhan-ctrl/God-emperornovel`
Branch: `architecture/phase-01n-master-route-registry`
Source: `public/app.js`, blob `e857029f17d6f6d44233031cdb2b1029a60f6ac9`
Client bootstrap: `boot()`, line 613. Shared shell/navigation: `shell()`, line 63. Worker HTML shell mapping is recorded in Phase 01N.3.

## 1. Route-to-renderer inventory

| # | Route | Client renderer / destination | Evidence status |
|---:|---|---|---|
| 1 | `/` | `home()` | client-rendered |
| 2 | `/catalog` | `catalog()` | client-rendered |
| 3 | `/discover` | `catalog()` | client-rendered; shared catalog alias |
| 4 | `/trending` | `discoveryPage('trending')` | client-rendered |
| 5 | `/for-you` | `discoveryPage('made-for-you')` | client-rendered; same renderer as /made-for-you |
| 6 | `/made-for-you` | `discoveryPage('made-for-you')` | client-rendered; alias overlap |
| 7 | `/leaderboard` | `discoveryPage('leaderboard')` | client-rendered |
| 8 | `/tier-list` | `discoveryPage('tier-list')` | client-rendered |
| 9 | `/random` | `discoveryPage('random')` | client-rendered |
| 10 | `/vote` | `discoveryPage('vote')` | client-rendered |
| 11 | `/genres` | `genres()` | client-rendered |
| 12 | `/tags` | `tags()` | client-rendered |
| 13 | `/formats` | `formatDirectory()` | client-rendered |
| 14 | `/format/:formatSlug` | `formatLanding(decoded slug)` | client-rendered |
| 15 | `/search` | `search()` | client-rendered |
| 16 | `/library` | `library()` | client-rendered |
| 17 | `/history` | `history()` | client-rendered |
| 18 | `/following` | `following()` | client-rendered |
| 19 | `/notifications` | `discoveryPage('notifications')` | client-rendered |
| 20 | `/settings` | `settings()` | client-rendered |
| 21 | `/account` | `account()` | client-rendered |
| 22 | `/login` | `authPage('login')` | client-rendered |
| 23 | `/register` | `authPage('register')` | client-rendered |
| 24 | `/tickets` | `tickets()` | client-rendered |
| 25 | `/requests` | `requests()` | client-rendered |
| 26 | `/omniportal` | `omni()` | client-rendered |
| 27 | `/trend-factory` | `trendFactory()` | client-rendered |
| 28 | `/community` | `discoveryPage('community')` | client-rendered |
| 29 | `/community-taxonomy` | `community-taxonomy.html shell` | dedicated HTML shell; client composition requires separate inspection |
| 30 | `/privacy` | `privacy.html shell` | static legal HTML shell |
| 31 | `/terms` | `terms.html shell` | static legal HTML shell |
| 32 | `/copyright` | `copyright.html shell` | static legal HTML shell |
| 33 | `/admin` | `admin.html shell` | dedicated admin HTML; separate admin script/controls |
| 34 | `/author` | `authorStudio()` | client-rendered |
| 35 | `/become-an-author` | `becomeAuthor()` | client-rendered |
| 36 | `/novel/:novelId` | `novel()` | client-rendered |
| 37 | `/novel/:novelId/chapters` | `chapters()` | client-rendered |
| 38 | `/read/:novelId/:chapterNumber` | `reader()` | client-rendered |
| 39 | `/author/:username` | `authorPublic()` | client-rendered |
| 40 | `/fandom/:slug` | `redirect to /catalog?tag=slug` | redirecting client route |

## 2. Renderer functions located in the source

| Renderer | Source line |
|---|---:|
| `shell()` | 63 |
| `home()` | 65 |
| `trendFactory()` | 222 |
| `catalog()` | 224 |
| `formatDirectory()` | 249 |
| `formatLanding()` | 250 |
| `genres()` | 251 |
| `tags()` | 252 |
| `search()` | 253 |
| `novel()` | 254 |
| `chapters()` | 319 |
| `reader()` | 320 |
| `account()` | 378 |
| `library()` | 379 |
| `history()` | 380 |
| `following()` | 381 |
| `tickets()` | 382 |
| `requests()` | 383 |
| `omni()` | 384 |
| `discoveryPage()` | 431 |
| `becomeAuthor()` | 475 |
| `authorStudio()` | 544 |
| `authorPublic()` | 610 |
| `settings()` | 611 |
| `boot()` | 613 |

## 3. Shared-renderer and alias decisions

- `/discover` and `/catalog` intentionally invoke the same `catalog()` renderer. Their canonical URL policy remains a separate SEO decision.
- `/for-you` and `/made-for-you` invoke the same `discoveryPage('made-for-you')` renderer and the same recommendation destination. Preserve both links until a tested redirect/canonical migration is planned.
- `/trending`, `/leaderboard`, `/tier-list`, `/random`, `/vote`, `/notifications` and `/community` share the generic `discoveryPage(mode)` dispatcher but pass different modes. They are not the same screen content.
- `/fandom/:slug` is not an independent fandom screen in this client bootstrap. It redirects to catalog tag filtering.
- `/format/:formatSlug` has a dedicated renderer and is validated by the Worker against the supported format registry before the shell is served.
- `/admin`, `/community-taxonomy` and the legal pages use dedicated HTML shells and are not dispatched by this `app.js` bootstrap.

## 4. Route-specific implementation evidence and remaining checks

The presence of a renderer proves that the client has a route dispatch target. It does not prove all controls work, every API request is authorized, or every UI state is complete.

Still required:
1. Inspect each renderer's component/DOM inventory and conditional branches.
2. Enumerate interactive controls and their event handlers.
3. Map every request to exact Worker method, response schema and server-side permission.
4. Check account-bound reads/writes against a second test identity.
5. Verify empty, loading, error, offline, unauthorized and forbidden states.
6. Verify all route direct-load/refresh/back-forward behavior on mobile.
7. Inspect the dedicated admin and community-taxonomy HTML/scripts separately.
8. Verify screen-reader names, focus order, keyboard operation, reduced motion, contrast, RTL and 14-language text expansion.

## 5. Disposition

- [x] Re-read `public/app.js` from the target branch and verify its audited blob.
- [x] Locate the client bootstrap route dispatcher.
- [x] Map all 40 registry routes to their client renderer, static shell or redirect destination.
- [x] Identify shared renderer modes and overlapping aliases.
- [ ] Inventory components and actions per route.
- [ ] Complete API method/response/permission mapping.
- [ ] Add automated client route and behavior tests.
- [ ] Execute browser QA on mobile and desktop.

No runtime application code, D1 schema, secrets, Worker configuration or production deployment changed. This phase is architecture documentation only.

## Next

Phase 01N.5: component and user-action inventory for each renderer, starting with `home()`, `catalog()`, `novel()` and `reader()`, then account, creator and administration surfaces.
