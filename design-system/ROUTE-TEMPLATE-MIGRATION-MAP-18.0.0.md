# Imperial Novel Design-System Route and Template Migration Map 18.0.0

**Purpose:** establish the audited route/template inventory that must be migrated and visually verified before the design system can be called production-adopted.

**Source of truth inspected:** `src/index.js` HTML response map and `public/app.js` route dispatcher on the PR branch. This inventory records source mappings, not proof that every route has passed browser QA.

## 1. Explicit route-to-template map

| Route | HTML template | Runtime owner / page family |
|---|---|---|
| `/` | `index.html` | Home |
| `/catalog` | `catalog.html` | Catalog |
| `/discover` | `catalog.html` | Catalog / discovery |
| `/formats` | `index.html` | Format directory |
| `/genres` | `genres.html` | Genre directory |
| `/tags` | `tags.html` | Tag directory |
| `/search` | `search.html` | Search |
| `/library` | `library.html` | Reader library |
| `/history` | `history.html` | Reading history |
| `/following` | `following.html` | Followed creators |
| `/tickets` | `tickets.html` | Ticket wallet |
| `/requests` | `requests.html` | Reader requests |
| `/omniportal` | `omniportal.html` | External discovery / rights-sensitive import |
| `/community` | `index.html` | Community |
| `/leaderboard` | `index.html` | Rankings |
| `/tier-list` | `index.html` | Tier lists |
| `/random` | `index.html` | Random discovery |
| `/made-for-you` | `index.html` | Personalized discovery |
| `/settings` | `index.html` | Account settings |
| `/for-you` | `index.html` | Personalized discovery alias |
| `/trending` | `index.html` | Trending |
| `/vote` | `index.html` | Voting |
| `/notifications` | `index.html` | Notifications |
| `/trend-factory` | `index.html` | Trend Factory |
| `/community-taxonomy` | `community-taxonomy.html` | Community taxonomy |
| `/privacy` | `privacy.html` | Privacy legal page |
| `/terms` | `terms.html` | Terms legal page |
| `/copyright` | `copyright.html` | Copyright / rights page |
| `/account` | `account.html` | Account |
| `/login` | `login.html` | Authentication |
| `/register` | `register.html` | Authentication |
| `/admin` | `admin.html` | Admin command center |
| `/author` | `index.html` | Author Studio |

There are **33 explicit static route entries** in the Worker map.

## 2. Dynamic route patterns

| Pattern | HTML template | Runtime owner / page family |
|---|---|---|
| `/format/:slug` | `index.html` | Format landing |
| `/novel/:id` | `novel.html` | Novel detail |
| `/novel/:id/chapters` | `novel.html` | Chapter list |
| `/read/:id/:chapter` | `read.html` | Text / comic reader |
| `/fandom/:slug` | `fandom.html` | Fandom redirect / discovery |
| `/author/:username` | `author-public.html` | Public author profile |
| unmatched route | `404.html` | Not found |

## 3. Renderer inventory observed

The shared frontend dispatcher contains dedicated rendering functions for these major areas:

- Shell and landing: `shell`, `home`, `pageStart`, `simplePage`.
- Discovery: `catalog`, `formatDirectory`, `formatLanding`, `genres`, `tags`, `search`, `trendFactory`, `discoveryPage`.
- Story and reading: `novel`, `chapters`, `reader`, `chapterRow`, `renderChapterContent`, `initComicViewer`.
- Reader account: `library`, `history`, `following`, `tickets`, `requests`, `account`, `settings`.
- Creator and publishing: `authorApplicationPage`, `authorStudio`, `authorPublic`.
- Community and trust surfaces: `loadCommunity`, `loadComments`, `loadRating`, `omni`, `authPage`.
- Runtime helpers: API, localization, theme preference, reactions, comic-page sequencing and application boot.

The `/admin` page is served from a dedicated `admin.html` template; do not assume it uses the same renderer or permissions as the public shell.

## 4. Shared stylesheet delivery

The Worker `html()` function maintains one `releaseStyles` list and appends missing stylesheets before `</head>`. PR #295 registers both design-system assets in this shared list:

- `/imperial-design-tokens.css`
- `/imperial-ui-primitives.css`

The list avoids duplicate stylesheet tags. The root `index.html` also declares all three shared foundation links directly: `imperial-glass.css`, `imperial-design-tokens.css` and `imperial-ui-primitives.css`. This guarantees asset availability across mapped HTML templates; it does **not** mean legacy pages have adopted the `in-` component classes.

## 5. Migration sequence and acceptance

Migrate by page family, not by a global selector replacement:

1. **Shared shell and home:** navigation, header, footer, responsive menu, global theme control, boot/error states.
2. **Discovery:** catalog, search, formats, genres, tags, trending, ranking, personalized shelves.
3. **Story detail and reader:** novel detail, chapters, text reader, comic reader, progress, reader preferences.
4. **Reader account:** library, history, following, wallet, requests, account, authentication, settings.
5. **Creator:** author application, Author Studio, chapter editor, publishing workflow, public author profile.
6. **Community and special surfaces:** discussions, reactions, notifications, OmniPortal, Trend Factory, taxonomy.
7. **Admin and legal:** dedicated admin template, privacy, terms, copyright, not-found and system errors.

Each family must pass:
- route coverage for normal, loading, empty, error, forbidden and success states;
- keyboard-only and screen-reader checks for controls;
- 44px effective targets and visible focus;
- desktop, tablet, 360px and 390px phone layouts;
- English plus Urdu, Arabic and Persian RTL checks;
- 200% zoom and 320 CSS-pixel reflow;
- no fabricated counts, ratings, balances or publication state;
- server-side authorization unchanged;
- screenshots and visual regression review before enabling the family.

## 5A. RTL source audit boundary

The shared component-primitives stylesheet uses logical layout properties and includes an RTL-specific switch-thumb mirror. The interface locale controller sets document direction for Urdu, Arabic and Persian. The Worker HTML bootstrap now restores the saved locale and sets the root `lang` and `dir` before first paint for all 14 values exposed by the language selector (`en`, `ur`, `hi`, `zh-CN`, `zh-TW`, `ja`, `id`, `fr`, `ko`, `pt-BR`, `ar`, `es`, `vi`, `fa`). Urdu, Arabic and Persian receive `dir="rtl"`; the other choices receive `dir="ltr"`. This prevents standalone templates from depending on the public-shell language initializer to establish text direction. A source comparison of the `IN_LANG` dictionaries confirms all 14 locale entries contain the same 32 interface strings; a contract test now enforces the locale list and key parity. This confirms dictionary-key coverage, not independent linguistic review or full translation of all page content.

The latest source-level audit of all eight Worker-registered stylesheets found no physical left/right positioning, margin, padding, inset or border declarations, and no `text-align:left/right`, `float:left/right` or `clear:left/right` declarations. Component-scoped logical-property migrations now cover the high-impact shell, discovery, reader, format, legal and decorative hero selectors recorded in `LEGACY-CSS-RTL-AUDIT-18.0.0.md`. This is a source inventory, not proof that every legacy page, icon, alignment, overlay, or responsive state renders correctly in RTL. Full RTL sign-off remains blocked on route-level Urdu, Arabic and Persian browser checks at mobile and desktop widths.

Regression coverage prevents new physical left/right positioning, spacing, inset, border, float/clear or text-align declarations from entering all eight registered stylesheets and the 25 standalone template styles. Targeted assertions also protect migrated legacy selectors. Component-level review remains mandatory: source cleanliness alone cannot certify route behavior.

## 5B. Legacy RTL bridge slice

A bounded RTL override slice now mirrors high-impact legacy layout details: chapter drawer placement and edge, active side-navigation indicator, catalog metadata alignment, status badge placement, reader action spacing, community reply indentation, format-experience alignment, format arrow placement, legal list/notice accents, Trend Factory note accents, homepage feature/status positioning, and selected decorative hero anchors.

These overrides are scoped to `[dir="rtl"]` and do not alter centered text or the underlying route/API behavior. They are source-level CSS bridges only. They do not constitute complete RTL certification: other legacy selectors, nested responsive states, icons, overlays and route-specific content still require rendered Urdu, Arabic and Persian review at mobile and desktop widths.

## 6. Current migration status

- Shared token/primitive assets are registered for all Worker-served HTML templates.
- The design-system contract and platform source tests pass in GitHub Actions.
- The shared public shell now renders a native six-theme selector (Light, Dark, Midnight, Sepia, Imperial and Cosmic). The selected theme is allowlisted, persisted as `imperial_theme`, and restored by the Worker bootstrap before frontend hydration.
- The six-theme selector is shared across routes that use the public `shell()` renderer. Dedicated HTML templates that do not invoke this shell still need independent appearance controls or a deliberate decision to inherit the root preference.
- The reader still has independent theme controls/preferences and legacy reader styling; global/reader preference unification has not been performed.
- The shared header, drawer, mobile navigation and homepage have a semantic six-theme source-adoption layer over the existing legacy classes. The shared shell/homepage have **not** passed the full page-family acceptance gate because six-theme, RTL, responsive and interaction browser QA remains outstanding.
- No route family is declared fully migrated by this inventory. No production deployment or visual screenshot sign-off is claimed.


## 7. Current next implementation slice: visual certification of shell and homepage

The shell/homepage semantic source-adoption layer is implemented in section 8. The remaining work is not another broad CSS rewrite: it is rendered certification of the actual shared shell and homepage.

Required checks before marking this family complete:
- Compare all six themes across header, drawer, mobile navigation, footer, hero, format shelf, story cards and feature tiles.
- Verify theme persistence after refresh and confirm the Worker bootstrap does not reset the chosen theme.
- Verify language selection remains independent; Urdu, Arabic and Persian retain correct RTL order, drawer direction, active indicators and icon spacing.
- Exercise drawer open/close, Escape handling, focus order, active route, account/admin links, search and mobile navigation.
- Review desktop, tablet, 390px, 360px and 320px widths, including 200% zoom and long localized labels.
- Capture screenshots and test keyboard/screen-reader behavior. Source contracts and CI are necessary but not visual sign-off.


## 8. Shared shell and homepage adoption slice

**Implemented in source:** semantic legacy-variable bridge in the design token stylesheet, plus six-theme overrides for the public header/navigation, search controls, mobile drawer, homepage hero, format shelf, story cards, feature tiles, creator band and reader promise. The shared shell's six-theme selector remains native and keyboard operable.

**Still required before declaring this family complete:** live browser review of all six themes; 360px and 390px mobile layouts; tablet and desktop navigation overflow; Urdu/Arabic/Persian RTL; focus order and Escape behavior in the drawer; footer theme consistency; check all hero/form descendants and catalog empty/error states. This source-level slice does not constitute visual regression sign-off.


## 9. Discovery source adoption slice

**Implemented in source:** semantic theme overrides for catalog filter panels and controls, result cards, active filter chips, empty states, format directory links, genre cards, tag tiles and search controls. Existing data/API behavior, query parameters, pagination and route destinations were not changed.

**Still required before declaring the discovery family complete:** visual browser review for all six themes and populated/loading/empty/error states; desktop, tablet, 390px and 360px layouts; RTL; keyboard traversal; filter control contrast; long titles and tags; image fallback behavior. Source CSS and passing contract tests do not substitute for visual QA.


## 10. Story detail and chapter navigation source adoption

**Implemented in source:** semantic theme overrides for the novel hero, cover frame, title, metadata/stat cards, overview tabs, chapter rows and chapter hover state. Reader toolbar controls, chapter drawer links and preference selects have visible focus and 44px minimum targets; reduced-motion preferences are respected.

**Intentionally unchanged:** novel/chapter API calls, route destinations, ratings/comments/reactions, library/follow actions, chapter unlocks, reading progress, bookmarks, comic page sequencing and the reader's independent theme preference. Reader article colors remain controlled by the reader preference until a separate compatibility migration is tested.

**Still required:** browser screenshots for all six global themes and six reader themes; desktop/tablet/390px/360px; Urdu/Arabic/Persian RTL; long titles; locked/unlocked chapter rows; populated/empty/error/loading states; keyboard and screen-reader review; comic and text chapter verification. Source CSS and contract tests are not visual sign-off.


## 11. Account and personal library source adoption

**Implemented in source:** semantic theme overrides for account navigation, profile panels/metrics, page-level library story cards, history/bookmark rows, notices and tabs. Account links and buttons have visible focus; account navigation and row actions use the 44px touch-target token. At narrow widths, the account menu becomes a horizontal scroll shelf and profile metrics use a two-column layout.

**Intentionally unchanged:** authentication, account/profile APIs, library membership, reading history, bookmarks, following, ticket ledger and user data boundaries. The Following route continues to use its existing shared library renderer; no behavior change is implied by this CSS slice.

**Still required:** visual QA for six themes; signed-in/signed-out and empty/populated/error states; 360px/390px/mobile/tablet/desktop; long usernames/titles; RTL; keyboard and screen-reader review. Source CSS and contract assertions are not visual sign-off.


## 12. Settings and notification center source adoption

**Implemented in source:** semantic theme overrides for settings panels, appearance/accessibility rows, selects/range controls, save notices and action links; notification rows, unread state and mark-all-read action receive semantic surfaces, focus and touch-target styling. Mobile settings controls retain full-width layout; reduced-motion is respected.

**Intentionally unchanged:** device-local preference keys, export/reset behavior, independent reader preferences, notification API/read-state behavior, authentication and server data.

**Still required:** six-theme visual QA; keyboard-only and screen-reader review; high-contrast/reduced-motion checks; read/unread/empty/error notification states; 360px/390px layouts and RTL. Source CSS and contract assertions are not visual sign-off.


## 13. Author Studio source adoption

**Implemented in source:** actual authorStudioLayout, authorCreateForm, authorWorksPanel, authorWork, authorEditForm, authorChapterForm and comicAuthorBuilder regions receive semantic six-theme styling. Desktop uses a two-column workspace; mobile collapses forms and actions to one column. Status chips, inputs, focus states and action touch targets use semantic roles.

**Intentionally unchanged:** role gating, private drafts, rights evidence, author APIs, publication review, chapter submission, ticket fields and comic sequence limits.

**Still required:** browser QA for unauthenticated/non-author/author/admin states, empty/populated/error work lists, story editing, chapter/comic creation, six themes, RTL, keyboard/screen reader and mobile widths. Source checks are not visual sign-off.


## 14. Community discovery source adoption

**Implemented in source:** quick destination cards, public discussion feed, trending-story cards and discovery banner use semantic six-theme roles. Focus visibility, touch targets, tablet/mobile grid behavior and reduced motion are covered.

**Intentionally unchanged:** discussion API, public/rights-cleared story visibility, story links and all moderation or social permissions. This route has no composer, so no new posting capability is implied.

**Still required:** populated/empty/error discussion states, empty catalog, six-theme visual QA, RTL, keyboard/screen-reader review, reduced-motion checks and 360px/390px mobile layouts.


## 15. Trend Factory source adoption

**Implemented in source:** the existing metadata-first Trend Factory hero, pipeline, search/sort/format controls, catalog result cards, safety guidance and integrity note consume semantic six-theme roles. Controls retain visible keyboard focus, 44px targets, narrow-screen stacking and reduced-motion behavior. Existing published-catalog API, filtering and rights-first boundaries are unchanged.

**Integrity correction:** the Trend Factory rights-review card no longer implies that a Trend Factory-specific review workspace or approval workflow exists. It now states that this workspace is not available yet. The dedicated `/admin` command center is a separate Worker-served template with its own server-side role guard; it is not a Trend Factory rights-review workflow, and this design migration adds no new Admin permissions or approval capability.

**Still required:** browser QA for all six themes; live, empty, loading and API-error states; long titles; desktop/tablet/360px/390px layouts; RTL; keyboard and screen-reader checks. Admin remains a separate functional and server-authorization workstream.


## 16. Dedicated Admin template source adoption

**Route correction:** `/admin` is served by the Worker as `public/admin.html`; it is not rendered by the public `app.js` shell router. The dedicated template calls `/api/me` and replaces its body unless the authenticated role is `admin`. The Worker API layer also has a server-side administrator guard, and the audited stats, users, publishing and connector endpoints invoke it.

**Implemented in source:** the dedicated Admin template's hero, cards, navigation, tables, forms, notices, status labels and actions now consume semantic six-theme roles. Keyboard focus, 44px navigation/action targets, narrow-screen table scrolling and reduced-motion behavior are included. Existing administration workflows, API calls and authorization logic are unchanged.

**Still required:** full endpoint-by-endpoint authorization review, CSRF/session review, owner/admin privilege-boundary tests, all six themes, mobile/tablet/desktop screenshots, RTL, keyboard and screen-reader QA, and populated/empty/error states. This is a source-level visual adoption, not a security sign-off or production release.


## 17. Community Taxonomy standalone route adoption

**Implemented in source:** the Worker now marks the dedicated `community-taxonomy.html` template with a page class, allowing the shared semantic theme layer to override its former fixed dark-only palette. The proposal form, guidance cards, status messages, links and form fields now follow all six themes. Keyboard focus, 44px primary action/link targets and reduced-motion behavior are included.

**Behavior preserved:** the existing taxonomy submission form and `POST /api/taxonomy` request remain unchanged. The moderation decision, data validation and server-side policy are not modified by this visual migration.

**Still required:** all six theme screenshots, RTL, 360px/390px mobile, desktop, form validation/error/success states, keyboard/screen-reader QA and the remaining standalone templates.


## 18. Standalone Author Studio artifact (not the active `/author` route)

**Source status:** `public/author.html` is a separate legacy/static artifact with six-theme styling, semantic canvas/surface/text/border/action/status/focus roles, responsive form layout, 44px primary controls and reduced-motion handling. The Worker route map currently sends `/author` to `index.html`; therefore the standalone artifact is not the active Author Studio route and must not be counted as active-route adoption.

**Active route ownership:** `/author` uses the shared application shell and `public/app.js` Author Studio renderer. Its creation, works-list, edit-story, chapter-composer and comic-page-composer classes receive the semantic theme layer described in section 16. The two surfaces require separate route and artifact checks.

**Behavior preserved:** no author APIs, draft creation, chapter workflows, AI project creation, role checks, upload or media-hosting capabilities are enabled by this stylesheet work.

**Still required:** browser QA of the actual `/author` route for all six themes, desktop/tablet/320px/360px/390px layouts, RTL, long validation messages, loading/empty/permission-denied/API-error states, keyboard and screen-reader use. The standalone `author.html` artifact should be reconciled or retired in a separately reviewed routing change.


## 19. Reader utility and community activity route adoption

**Implemented in source:** leaderboard rank badges and period selectors, tier-list panels/cards, random-discovery result cards, novel voting rows, request and OmniPortal form controls, ticket balance metrics and ledger rows now consume semantic six-theme roles. Focus indicators, 44px primary controls, small-screen random-result stacking and reduced-motion handling are included.

**Behavior preserved:** existing leaderboard, tier-list, random-novel, vote, request, ticket-ledger and OmniPortal API calls remain unchanged. No payment, request quota, voting eligibility, connector access, rights, or import behavior was modified.

**Important boundaries:** ticket displays remain the existing account ledger, not a payment gateway; OmniPortal remains rights-first and does not gain new connectors or import permissions from this visual work.

**Still required:** six-theme screenshots; 360px/390px/tablet/desktop; RTL; no-data, API-error, signed-out and populated states; keyboard/screen-reader QA. This adoption covers existing route components, not a feature-completeness or security sign-off.


## 20. Standalone legal and trust document adoption

**Implemented in source:** Privacy, Terms of Service, and Rights & Copyright pages now use the shared semantic six-theme canvas, surface, text, border, action and focus roles. Existing legal notice panels and links receive matching theme treatment. Mobile reading spacing and reduced-motion behavior are included.

**Behavior preserved:** legal copy, route mapping, publication-rights rules, privacy disclosures, terms, and reporting instructions are unchanged. This is a presentation migration, not legal review or a claim that the policies satisfy every jurisdiction.

**Still required:** legal copy review for current operating practices and applicable jurisdictions; six-theme screenshots; RTL and mobile review; keyboard/screen-reader checks; and confirmation that each disclosure accurately matches production data handling.


## Standalone route audit follow-up (2026-11-07)

- `/admin` resolves to `admin.html`; the shared Worker HTML response injects the saved interface `lang` and `dir` before first paint. The Admin template's table alignment and mobile action anchor now use logical properties and have contract assertions.
- `/privacy`, `/terms`, and `/copyright` resolve to their standalone legal templates and receive the same shared Worker bootstrap. Their document structure is not independently translated by that bootstrap; it sets language metadata and writing direction only.
- `/novel/:id` and `/read/:id/:chapter` resolve to shell templates that load the versioned public app bundle. The bundle remains responsible for route content and reader behavior.
- `/author` currently resolves to `index.html`, not `author.html`. The `authorStudioPage` body-marker branch in the Worker helper is not reached through `/author`; the standalone `author.html` artifact must not be treated as the active Author Studio route until routing is deliberately reconciled.
- Browser verification of the actual rendered routes, including 320px reflow, RTL navigation order, forms, tables, dialogs and reader controls, remains outstanding.


## Standalone-template directionality regression guard (2026-11-07)

- Audited all 25 HTML templates represented by the Worker route map, including the dedicated Admin, Author Studio artifact, legal, taxonomy, reader, novel and not-found templates.
- The source scan found no physical left/right positioning, spacing, border, float/clear or text alignment declarations in these templates at the audited revision.
- Added a build-contract guard over the complete template set so future standalone-page CSS cannot quietly reintroduce physical direction assumptions.
- This is a source-level regression check only. It does not prove that rendered route content, third-party assets, SVG artwork or interactive states are visually correct in Urdu, Arabic or Persian.
- Browser screenshot and interaction QA remains a separate release gate.



## 21. Public author profile route adoption

**Route ownership:** `/author/:username` is rendered by the shared `authorPublic()` frontend route using the existing public published-novel catalog API. It is distinct from the private `/author` Author Studio route and the legacy standalone `author.html` artifact.

**Implemented in source:** the public identity header, author mark, published-work section, empty/error panels and focus treatment now consume the active six-theme semantic roles. The identity header reflows at narrow mobile widths and respects reduced-motion preferences.

**Behavior preserved:** the existing public catalog query, author slug handling, published-work visibility and novel links are unchanged. No private profile fields, creator dashboard data, follower features or new APIs are introduced.

**Still required:** all six theme screenshots; 320px/360px/390px/tablet/desktop; Urdu/Arabic/Persian RTL; no-published-work and API-error states; keyboard and screen-reader review. Source contracts are not visual sign-off.


## 22. Authentication route adoption

**Route ownership:** `/login` and `/register` use the existing `authPage(mode)` renderer in the shared application bundle. Their separate HTML templates load the same Worker-registered semantic token and primitive stylesheets.

**Implemented in source:** authentication panels, labels, input fields, submit controls, feedback notices and account-switch links now use the active six-theme semantic roles. Keyboard focus is visible, submit targets meet the 44px contract, and the form spacing adapts to narrow mobile screens. Reduced-motion behavior is respected.

**Behavior preserved:** login/register API paths, password confirmation validation, required fields, password minimum length, session handling and post-login navigation are unchanged. No authentication policy or server authorization behavior was changed.

**Still required:** six-theme browser screenshots; 320px/360px/390px/tablet/desktop; Urdu/Arabic/Persian RTL; invalid credentials, password mismatch, server error and successful sign-in/registration states; keyboard and screen-reader review. Source contracts are not visual sign-off.


## 23. Expanded semantic contrast matrix (2026-11-07)

The design-system build contract now checks every theme's primary, secondary and muted text against all four standard content surfaces: canvas, subtle, surface and elevated. It also verifies inverse text/background pairs and the text contrast of primary-action hover/active and secondary-action hover states. These checks supplement the existing WCAG AA checks for reader ink/paper, links, action defaults, status foreground/background pairs, focus indicators and strong control boundaries.

The matrix is source-derived and runs as part of the standard build. It does not replace rendered contrast inspection where translucency, imagery, gradients, overlays or user-generated content alter the effective background.
