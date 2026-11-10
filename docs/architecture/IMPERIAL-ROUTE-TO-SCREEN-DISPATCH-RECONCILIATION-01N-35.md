# Imperial Novel — Route-to-Screen Dispatch Reconciliation (01N-35)

**Audit date:** 3 November 2026  
**Branch:** `main`  
**Worker source:** `src/index.js`, blob `237f4461135eb77258b7184e361ce9dfd9a140e9`  
**Client source:** `public/app-17.23.0.js`, blob `a640fbfed7221adac1a6fd7fd6d5f0524016004a`  
**Purpose:** Distinguish route existence, served HTML shell, client-side screen dispatch and dedicated standalone pages.

## 1. Key finding

The Worker route table is not the screen registry. Several URL paths share the same HTML shell and are differentiated by client-side dispatch in `public/app-17.23.0.js`. A route can therefore be accepted by the Worker while still having no dedicated screen implementation.

The current mainline `public/index.html` loads `/app-17.23.0.js`. The inspected `public/app.js` and versioned app asset have the same blob SHA in this revision. The older named HTML shells also reference `/app.js?v=16.16.0`; this URL resolves to the same current repository asset path, but cache/version behavior still requires runtime verification.

## 2. Client-dispatched screens observed

| Route | Client screen/function | Current disposition |
|---|---|---|
| `/` | `home()` | Dedicated home renderer |
| `/catalog`, `/discover` | `catalog()` | Shared catalog renderer; discover is an alias |
| `/formats` | `formatDirectory()` | Dedicated format directory renderer |
| `/format/:formatSlug` | `formatLanding()` | Dynamic format landing |
| `/genres` | `genres()` | Dedicated genre directory renderer |
| `/tags` | `tags()` | Dedicated tag directory renderer |
| `/search` | `search()` | Dedicated search renderer |
| `/novel/:numericId` | `novel()` | Dedicated novel detail renderer |
| `/novel/:numericId/chapters` | `chapters()` | Dedicated chapter archive renderer |
| `/read/:numericNovelId/:chapterNumber` | `reader()` | Dedicated reader renderer |
| `/library` | `library()` | Dedicated private library renderer |
| `/history` | `history()` | Dedicated private history renderer |
| `/following` | `following()` | Dedicated following renderer |
| `/tickets` | `tickets()` | Dedicated ticket balance/ledger renderer |
| `/requests` | `requests()` | Dedicated request renderer |
| `/omniportal` | `omni()` | Dedicated OmniPortal renderer |
| `/community` | `discoveryPage('community')` | Shared discovery-page renderer |
| `/leaderboard` | `discoveryPage('leaderboard')` | Shared discovery-page renderer |
| `/tier-list` | `discoveryPage('tier-list')` | Shared discovery-page renderer |
| `/random` | `discoveryPage('random')` | Shared discovery-page renderer |
| `/made-for-you`, `/for-you` | `discoveryPage('made-for-you')` | Same personalized screen; canonical/alias decision remains |
| `/trending` | `discoveryPage('trending')` | Shared discovery-page renderer |
| `/vote` | `discoveryPage('vote')` | Shared discovery-page renderer |
| `/notifications` | `discoveryPage('notifications')` | Shared discovery-page renderer |
| `/settings` | `settings()` | Dedicated settings renderer |
| `/author` | `authorStudio()` | Creator workspace entry |
| `/account` | `account()` | Account renderer |
| `/login` | `authPage('login')` | Login renderer |
| `/register` | `authPage('register')` | Registration renderer |
| `/author/:username` | `authorPublic()` | Public author profile renderer |

## 3. Standalone HTML pages

These paths are served as dedicated HTML documents rather than being selected by the main app.js route switch:

| Route | Served asset | Verification boundary |
|---|---|---|
| `/admin` | `public/admin.html` | Standalone Admin Dashboard document; its own authorization and action handlers require separate audit |
| `/community-taxonomy` | `public/community-taxonomy.html` | Standalone taxonomy submission document |
| `/privacy` | `public/privacy.html` | Static legal document |
| `/terms` | `public/terms.html` | Static legal document |
| `/copyright` | `public/copyright.html` | Static rights/legal document |

The fact that `/admin` is a standalone document does not prove that its server APIs enforce the desired owner/admin permission separation. The page and API security boundaries must be audited independently.

## 4. Dynamic route exception: fandom

The Worker recognizes `/fandom/:slug` and serves the fandom shell, but the inspected client boot logic handles any `/fandom/` path by navigating to:

`/catalog?tag=<slug>`

This is a redirect-to-catalog behavior, not a dedicated fandom landing screen. It may be an intentional compatibility route, but the registry must not describe it as a completed fandom screen. The target decision is either:
- build a real fandom landing renderer and connect it to an approved taxonomy/content model; or
- retain the redirect and document it as a compatibility alias, with canonical and navigation rules.

## 5. Shared renderer versus distinct screen

The `discoveryPage(kind)` function is reused for community, leaderboard, tier-list, random, personalized, trending, voting and notifications routes. This is acceptable as code reuse only if each kind has distinct data, actions, access behavior, loading/empty/error states and page metadata. The route registry must not count the shared function as proof that every feature is complete.

Likewise:
- `/discover` and `/catalog` share one catalog screen.
- `/for-you` and `/made-for-you` share one personalized screen.
- `/author` and `/author/:username` have distinct private/public screen functions and must keep access boundaries separate.

## 6. Mainline asset observations

- `public/index.html` references `/app-17.23.0.js`.
- `public/app-17.23.0.js` and `public/app.js` resolve to the same blob SHA in this source revision.
- Named shells such as `novel.html`, `read.html`, `account.html` and `omniportal.html` reference `/app.js?v=16.16.0`.
- The repository includes many historical versioned CSS/JS assets. Their existence does not prove they are active. Active asset references must be taken from the actual served HTML and deployment asset configuration.
- The service worker is registered by the client boot code on HTTPS. Cache invalidation and stale-shell behavior need browser tests.

## 7. Remaining route-to-screen completion work

1. Inspect every navigation source (desktop, mobile, footer, account menu, creator/admin menus) and ensure every link resolves to a registered route.
2. Test every route against the deployed Worker for status code, shell, title, canonical/noindex, correct asset references and no unexpected fallback.
3. Exercise each client renderer and confirm meaningful distinct content, action behavior, authorization, empty/error states and mobile layout.
4. Audit the standalone admin document separately from the shared client app.
5. Decide the fandom redirect contract and the canonical relationships for route aliases.
6. Generate a route manifest in CI from Worker dispatch and client dispatch, then fail on unknown or orphaned navigation paths.

## 8. Completion status

| Work package | Status |
|---|---|
| Mainline client asset pinned | Complete |
| Worker-shell to client-renderer mapping | Mapped for observed routes |
| Standalone document mapping | Mapped |
| Fandom route mismatch identified | Complete |
| Shared-renderer feature completeness | Not verified |
| Full navigation/link scan | Pending |
| Browser/runtime route test suite | Pending |
| Production asset/cache verification | Pending |

**No application code, database, secrets, or production deployment were changed by this audit.**
