# Phase 01N.3 — Observed Route-to-Shell Reconciliation

Status: source-backed shell mapping completed for the 40 records in the master registry. This is not a component-level screen audit and is not production/browser QA.

Repository: `sikandershehzadkhan-ctrl/God-emperornovel`
Branch: `architecture/phase-01n-master-route-registry`
Application version in package metadata: `17.23.0`
Source: `src/index.js`, blob `13874ee0fde4e31e04a652c5169776c3b6f95c38`, HTML resolver beginning at line 1035 and Worker dispatch at lines 1038–1057.
Registry: `docs/architecture/IMPERIAL-MASTER-ROUTE-REGISTRY-01N.json`

## 1. Route-to-shell evidence

All 40 existing registry records were compared with the actual `html()` resolver's explicit shell map and dynamic route matchers.

| # | Route pattern | Observed shell | Registry status | Owning domain |
|---:|---|---|---|---|
| 01 | `/` | `index.html` | observed | brand-discovery |
| 02 | `/catalog` | `catalog.html` | observed | discovery |
| 03 | `/discover` | `catalog.html` | observed | discovery |
| 04 | `/trending` | `index.html` | observed | discovery |
| 05 | `/for-you` | `index.html` | observed | discovery |
| 06 | `/made-for-you` | `index.html` | observed-alias-conflict | discovery |
| 07 | `/leaderboard` | `index.html` | observed | discovery-community |
| 08 | `/tier-list` | `index.html` | observed | community |
| 09 | `/random` | `index.html` | observed | discovery |
| 10 | `/vote` | `index.html` | observed | community |
| 11 | `/genres` | `genres.html` | observed | taxonomy-discovery |
| 12 | `/tags` | `tags.html` | observed | taxonomy-discovery |
| 13 | `/formats` | `index.html` | observed | content-formats |
| 14 | `/format/:formatSlug` | `index.html` | observed | content-formats |
| 15 | `/search` | `search.html` | observed | search |
| 16 | `/library` | `library.html` | observed | reader-account |
| 17 | `/history` | `history.html` | observed | reader-account |
| 18 | `/following` | `following.html` | observed | account-community |
| 19 | `/notifications` | `index.html` | observed | account-realtime |
| 20 | `/settings` | `index.html` | observed | identity |
| 21 | `/account` | `account.html` | observed | identity |
| 22 | `/login` | `login.html` | observed | identity |
| 23 | `/register` | `register.html` | observed | identity |
| 24 | `/tickets` | `tickets.html` | observed | commerce |
| 25 | `/requests` | `requests.html` | observed | reader-community |
| 26 | `/omniportal` | `omniportal.html` | observed | omniportal |
| 27 | `/trend-factory` | `index.html` | observed | trend-factory |
| 28 | `/community` | `index.html` | observed | community |
| 29 | `/community-taxonomy` | `community-taxonomy.html` | observed | community-governance |
| 30 | `/privacy` | `privacy.html` | observed | legal |
| 31 | `/terms` | `terms.html` | observed | legal |
| 32 | `/copyright` | `copyright.html` | observed | legal-rights |
| 33 | `/admin` | `admin.html` | observed | administration |
| 34 | `/author` | `index.html` | observed | creator |
| 35 | `/become-an-author` | `index.html` | observed | creator-onboarding |
| 36 | `/novel/:novelId` | `novel.html` | observed-dynamic | story-catalog |
| 37 | `/novel/:novelId/chapters` | `novel.html` | observed-dynamic | story-catalog |
| 38 | `/read/:novelId/:chapterNumber` | `read.html` | observed-dynamic | reader |
| 39 | `/author/:username` | `author-public.html` | observed-dynamic | public-author-profile |
| 40 | `/fandom/:slug` | `fandom.html` | observed-dynamic | community-fandom |

## 2. Route resolution facts verified in source

- Explicit static shell map includes the routes listed above.
- `/discover` and `/catalog` both resolve to `catalog.html`; this is a shared shell, not proof of a canonical redirect.
- `/for-you` and `/made-for-you` both resolve to `index.html`; their product-level distinction/canonical policy remains unresolved.
- `/novel/:numericId` and `/novel/:numericId/chapters` both resolve to `novel.html`.
- `/read/:numericNovelId/:chapterNumber` resolves to `read.html`.
- `/author/:username` resolves to `author-public.html`; exact `/author` resolves to `index.html`.
- `/fandom/:slug` resolves to `fandom.html`.
- `/format/:formatId` resolves to `index.html` only when the decoded format ID is in `CONTENT_FORMAT_IDS`; invalid or malformed IDs select `404.html`.
- The Worker sends unmatched extensionless paths through the HTML resolver. The resolver selects `404.html` and returns HTTP 404 for that selected shell.
- The HTML resolver applies `no-store` to HTML responses and builds novel/chapter metadata only for published content with an eligible rights status.
- The Worker applies common security response headers after route resolution.

## 3. Important distinction: shell mapping is not full screen mapping

This pass proves which HTML shell is selected by source routing. It does not yet prove that each route has a complete, unique screen composition. Several destinations intentionally share `index.html`; their client-side rendering must be inspected separately.

The following remain open for each route:
1. Actual visible screen composition and conditional states.
2. Component inventory and reusable component ownership.
3. User actions and exact client event handlers.
4. API request/response schema and method enforcement.
5. Server-side authorization and resource ownership checks.
6. Loading, empty, error, offline, forbidden and not-found behavior.
7. Keyboard, screen-reader, mobile, RTL and localization checks.
8. Automated direct-load, refresh, back/forward and HTTP status tests.

## 4. Source-level route hazards to preserve

- Resolve `/novel/:id/chapters` before the shorter `/novel/:id` pattern in any future generalized router.
- Keep `/author` distinct from `/author/:username`.
- Preserve numeric novel/chapter URLs and existing bookmarks while any future slug or stable chapter-ID migration is designed.
- Do not add links to proposed creator/admin subroutes until the Worker actually dispatches them and their authorization is tested.
- Do not represent shared-shell destinations as separate implemented pages without client-render evidence.
- Maintain real HTTP 404 status for unknown routes.

## 5. Phase 01N.3 disposition

- [x] Re-read the audited Worker source and verify its blob SHA.
- [x] Compare all 40 registry routes against the HTML resolver.
- [x] Record the observed shell for all 40 routes.
- [x] Record dynamic route patterns and invalid-format behavior.
- [x] Record the actual fallback HTTP 404 behavior.
- [ ] Inspect client-side rendering for all 40 route destinations.
- [ ] Map visible components and action handlers.
- [ ] Reconcile API methods, response fields and object-level permissions.
- [ ] Add automated route contract tests and execute them.
- [ ] Browser-test deep links, refresh, navigation and responsive states.

No application runtime code, database migration, Worker configuration or production deployment was changed in this phase. This commit updates architecture documentation only.

## Next phase

Phase 01N.4: client-rendered screen and component inventory, beginning with destinations that currently share `index.html`, then the dedicated catalog, reader, novel, account, author and admin shells.
