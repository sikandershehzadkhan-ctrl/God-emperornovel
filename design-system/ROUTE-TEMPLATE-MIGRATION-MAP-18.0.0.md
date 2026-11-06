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

The list avoids duplicate stylesheet tags. The root `index.html` also declares both links directly. This guarantees asset availability across mapped HTML templates; it does **not** mean legacy pages have adopted the `in-` component classes.

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

## 6. Current migration status

- Shared token/primitive assets are registered for all Worker-served HTML templates.
- The design-system contract and platform source tests pass in GitHub Actions.
- The shared public shell now renders a native six-theme selector (Light, Dark, Midnight, Sepia, Imperial and Cosmic). The selected theme is allowlisted, persisted as `imperial_theme`, and restored by the Worker bootstrap before frontend hydration.
- The six-theme selector is shared across routes that use the public `shell()` renderer. Dedicated HTML templates that do not invoke this shell still need independent appearance controls or a deliberate decision to inherit the root preference.
- The reader still has independent theme controls/preferences and legacy reader styling; global/reader preference unification has not been performed.
- The shared header, drawer, mobile navigation and homepage still primarily use legacy component classes. Design tokens and primitives are available, but the shell and homepage have **not** passed the page-family migration gate.
- No route family is declared fully migrated by this inventory. No production deployment or visual screenshot sign-off is claimed.


## 7. Immediate next implementation slice: shared shell and homepage

The six-theme selector is implemented in the public shell, but it is not a complete shell migration. The next slice must adapt the header, drawer, mobile navigation and homepage to semantic tokens without replacing route logic or changing authorization.

Required checks before marking this slice complete:
- Root theme changes update header, drawer, mobile navigation, footer and homepage surfaces without hard-coded light-only text/background colors.
- Theme selection survives refresh and does not get reset by the Worker bootstrap.
- Language selection remains independent; Urdu, Arabic and Persian retain RTL behavior.
- Drawer open/close, Escape handling, active route, account/admin links and mobile navigation behavior remain unchanged.
- Search and all navigation links retain their exact destinations.
- No new fabricated catalog data or feature claims are introduced.
- CI and responsive visual review pass at desktop, tablet, 390px and 360px widths.
