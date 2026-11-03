# Imperial Novel — Navigation Link Coverage Snapshot (01N-36)

**Audit date:** 3 November 2026  
**Branch:** `main`  
**Files inspected:** `public/app-17.23.0.js`, `public/admin.html`, `public/community-taxonomy.html`, `public/index.html`  
**Status:** Static literal-link scan; computed navigation and browser behavior are not fully covered.

## 1. Result

A static scan of the current client bundle and the standalone Admin and Community Taxonomy documents found 64 distinct root-relative path literals in the main client bundle, plus links in the standalone documents. The observed links map to known route families in the Worker registry. This is not yet a complete navigation certification because routes can also be assembled dynamically, triggered by event handlers, returned by API data, or introduced by service-worker behavior.

## 2. Main client navigation/link targets observed

The client bundle contains links or route targets for:

- Core: `/`, `/catalog`, `/formats`, `/genres`, `/tags`, `/search`
- Discovery: `/community`, `/leaderboard`, `/tier-list`, `/random`, `/made-for-you`, `/trending`, `/vote`
- Reader/account: `/novel/:id`, `/novel/:id/chapters`, `/read/:id/:chapter`, `/library`, `/history`, `/following`, `/tickets`, `/requests`, `/notifications`, `/account`, `/login`, `/register`
- Creator/admin: `/author`, `/trend-factory`, `/admin`
- OmniPortal/legal: `/omniportal`, `/privacy`, `/terms`, `/copyright`
- Format landings: `/format/original`, `/format/fanfiction`, `/format/light_novel`, `/format/web_novel`, `/format/manga`, `/format/manhwa`
- Catalog query links: trending, updated, rating, completed, fanfiction kind, genre, tag and author filters.

Dynamic link patterns also include chapter previous/next navigation, bookmarks, novel IDs and encoded filter values.

## 3. Standalone page links

- `public/admin.html` links to catalog, community taxonomy, OmniPortal, account, home and login.
- `public/community-taxonomy.html` links to genres, tags, community and home.

No unregistered root-relative path was identified in this bounded static scan. Query-string variants resolve to registered base paths.

## 4. Coverage risks not closed by a literal scan

1. Computed paths and API-provided destinations require runtime capture.
2. Mobile menu, footer, logged-in account menu and role-specific creator/admin navigation need browser-level inspection.
3. The Admin standalone page has its own navigation and event handlers and must be audited independently.
4. The client uses service-worker registration; cached HTML/JS can cause deployed navigation to differ from repository source.
5. The `/fandom/:slug` route is accepted by the Worker but client boot redirects it to `/catalog?tag=...`; do not present it as a dedicated landing screen.
6. The `/for-you` and `/made-for-you` paths share a renderer; canonical and internal-link policy remains unresolved.
7. `/discover` and `/catalog` share a renderer; internal links currently favor `/catalog`, but canonical metadata and redirects still need runtime checks.

## 5. Next automated gate

Add a CI route-link test that:
- extracts literal links from HTML and client bundles;
- normalizes query strings while preserving dynamic path families;
- compares targets against the route manifest;
- flags unknown links and registered routes with no navigation entry;
- runs browser tests for mobile/desktop navigation and signed-in role variants;
- captures HTTP status, canonical/noindex, title and loaded asset version for every registered page.

## 6. Completion status

| Work package | Status |
|---|---|
| Main bundle literal-link scan | Complete for inspected file |
| Standalone Admin/taxonomy link scan | Complete for inspected files |
| Literal targets reconciled to route families | No orphan found in bounded scan |
| Dynamic/event-driven route capture | Pending |
| Mobile/footer/account/role navigation scan | Pending |
| Browser navigation tests | Pending |
| Production-versus-repository asset comparison | Pending |

**No application code, database, secrets, or production deployment were changed by this audit.**
