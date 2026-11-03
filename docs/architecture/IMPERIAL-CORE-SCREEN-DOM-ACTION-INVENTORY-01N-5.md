# Phase 01N.5 — Core Screen DOM, Action and API Inventory

Status: first component-anchor and action inventory completed for five high-traffic renderers covering six route records. This is a source inventory, not proof of complete interaction behavior or API authorization.

Repository: `sikandershehzadkhan-ctrl/God-emperornovel`
Branch: `architecture/phase-01n-master-route-registry`
Source: `public/app.js`, blob `e857029f17d6f6d44233031cdb2b1029a60f6ac9`

## Scope and method

Inspected the implementation bodies of `home()`, `catalog()`, `novel()`, `chapters()` and `reader()`. Recorded stable DOM selectors, observed API path references and the corresponding control/action families. Selector anchors are not a complete nested component tree.

### Home

- **Routes:** `/`
- **Renderer:** `home()`
- **Observed DOM/component anchors:** `#app`, `#trend`, `#latest`, `#homeConnections`, `#platformPulseUpdated`, `#platformPulseHealth`, `#platformPulseMetrics`, `#platformPulseUpdates`, `#platformPulseTrending`, `#platformPulseRefresh`
- **Observed API calls:**
  - `GET /api/novels?sort=trending&limit=10`
  - `GET /api/novels?sort=updated&limit=10`
  - `GET /api/discovery/graph?limit=60`
  - `GET /api/platform/overview`
  - `GET /api/health`
- **User actions evidenced by controls/handlers:**
  - Browse trending and recently updated story shelves
  - Refresh platform pulse data
  - Navigate to discovery/catalog and linked feature areas
- **Required verification:**
  - Never fabricate counts or health values when endpoints fail
  - Treat public overview as aggregate-only and avoid exposing private account data

### Catalog

- **Routes:** `/catalog`, `/discover`
- **Renderer:** `catalog()`
- **Observed DOM/component anchors:** `#app`, `#cf`, `#activeFilters`, `#resultCount`, `#cat`, `#pager`, `#catalogRetry`
- **Observed API calls:**
  - `GET /api/formats`
  - `GET /api/novels?... (URL-driven filter/sort/pagination query)`
- **User actions evidenced by controls/handlers:**
  - Choose format/category filters
  - Apply and clear query filters
  - Change sort and page
  - Retry failed catalog load
- **Required verification:**
  - Validate filter enums and bound page size on server
  - Keep query state shareable and canonical
  - Exclude unpublished and rights-ineligible works

### Novel detail

- **Routes:** `/novel/:novelId`
- **Renderer:** `novel()`
- **Observed DOM/component anchors:** `#app`, `#libraryBtn`, `#follow`, `#share`, `#novelEngagementRefresh`
- **Observed API calls:**
  - `GET /api/novels/:id`
  - `GET /api/me`
  - `POST /api/library`
  - `POST /api/follow`
- **User actions evidenced by controls/handlers:**
  - Open chapter archive and reading entry
  - Add/remove library state (control presence verified; exact toggle flow needs detailed event review)
  - Follow novel
  - Share novel
  - Refresh engagement
- **Required verification:**
  - Check published status and rights before public detail response
  - Library/follow mutations must bind to authenticated user
  - Reject cross-user IDs and mass assignment

### Chapter archive

- **Routes:** `/novel/:novelId/chapters`
- **Renderer:** `chapters()`
- **Observed DOM/component anchors:** `#app`, `#batch`
- **Observed API calls:**
  - `GET /api/novels/:id (chapter archive data is loaded through novel endpoint; exact nested payload needs schema check)`
- **User actions evidenced by controls/handlers:**
  - Start reading chapter one
  - Navigate to chapter links
  - Open batch unlock control
- **Required verification:**
  - Verify chapter ordering and publication eligibility
  - Ticket unlock must be atomic and idempotent
  - Do not leak draft/locked chapter bodies

### Reader

- **Routes:** `/read/:novelId/:chapterNumber`
- **Renderer:** `reader()`
- **Observed DOM/component anchors:** `#app`, `#readerContent`, `.readerPage`, `#readerThemeSelect`, `#readerThemeBtn`, `#readerLineSelect`, `#readerWidthSelect`, `#fontDown`, `#fontUp`, `#chapterDrawer`, `#chapterMenu`, `#closeChapterMenu`, `#bookmarkBtn`, `#unlock`, `#readerProgressBar`, `#progressText`, `#chapterActivityMetrics`, `#chapterActivityUpdated`, `#chapterActivityRefresh`
- **Observed API calls:**
  - `GET /api/novels/:id`
  - `GET /api/chapters/:id`
  - `GET /api/reading-position?novel_id=...`
  - `GET /api/me`
  - `POST /api/bookmark`
  - `POST /api/history`
  - `POST /api/reading-position`
  - `GET /api/chapter-engagement?chapter_id=...`
- **User actions evidenced by controls/handlers:**
  - Change reader theme, line spacing, width and font size
  - Open/close chapter drawer
  - Bookmark chapter
  - Unlock eligible locked chapter
  - Persist reading progress and history
  - Refresh chapter activity
- **Required verification:**
  - Reader chapter body must be published and rights-cleared
  - Reading position/history/bookmarks must be user-scoped
  - Unlock/payment requires transaction, idempotency and server-side price validation
  - Private progress must never be shared-cached

## Cross-screen observations

- The home page reads both trending and updated catalog slices, discovery graph, platform overview and health. A resilient UI must distinguish missing/failed telemetry from a real zero.
- Catalog filters are URL-driven. The API must enforce allowed query values and hard pagination limits regardless of client validation.
- Novel detail reads the current session before deciding account-dependent controls. All mutations remain server-authorized.
- Chapter archive and reader are distinct client renderers despite sharing the `novel.html` shell.
- Reader preferences are primarily local-device settings; bookmarks, history and reading position are account data and require separate privacy handling.
- The reader includes an explicit chapter activity refresh control and persisted progress UI. Do not label this as push/live streaming without transport evidence.

## Phase 01N.5 completion status

- [x] Inspect home renderer DOM anchors and API references.
- [x] Inspect catalog renderer DOM anchors and API references.
- [x] Inspect novel detail renderer DOM anchors and API references.
- [x] Inspect chapter archive renderer DOM anchors and API references.
- [x] Inspect reader renderer DOM anchors and API references.
- [x] Record route coverage for six registry entries.
- [ ] Inspect complete nested component structure and all event-handler bodies.
- [ ] Verify each API method, schema, ownership check and cache policy against Worker handlers.
- [ ] Add positive/negative automated interaction tests.
- [ ] Browser-test each state on mobile and desktop.

No runtime code, D1 migration, Worker configuration, secrets or production deployment changed.

## Next

Continue Phase 01N.5 with discovery, account, community and creator renderers, then inspect the standalone admin and community-taxonomy shells. API method/permission reconciliation remains a separate mandatory gate.
