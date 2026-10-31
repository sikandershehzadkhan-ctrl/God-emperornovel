# Imperial Novel — Product Architecture & Sitemap

Brand: Imperial Novel  
Promise: Read • Create • Conquer  
Positioning: A mobile-first international publishing and reading platform for authorized serialized fiction and visual storytelling.

This is the target architecture, not a claim that every listed route or feature is already implemented.

## Product principles

1. Reader-first: discovery, novel details, reading, progress and library must be effortless.
2. Creator-respectful: authors retain ownership and publication controls; rights and moderation review are explicit.
3. One coherent product: public discovery, reading, creator tools, community, commerce and operations share one design language and account model.
4. Mobile-first, not mobile-only: optimize for narrow screens and constrained networks without weakening desktop workflows.
5. Truthful by default: never fabricate catalog counts, ratings, rankings, earnings, availability or activity.
6. Rights before reach: only publish, translate, import, display or monetize material the platform is authorized to use.
7. Progressive complexity: expose the next useful action first; put advanced filters and administration behind clear secondary paths.
8. Accessible by design: semantic HTML, keyboard operation, visible focus, sufficient contrast, reduced motion, scalable text and RTL support.

## Information architecture

### Global public navigation
- Home
- Discover
- Trending
- Rankings
- Genres
- Formats
- Community
- Search

Global utilities: Library, Notifications, Language, Appearance and Account. Library and notifications are account-aware. Secondary destinations belong in the three-line navigation drawer.

### Primary mobile navigation
1. Home
2. Discover
3. Library
4. Create
5. Community

Profile/account remains reachable from the header and account menu. Keep bottom navigation limited to five high-frequency tasks.

### Product domains

| Domain | Purpose | Primary surfaces |
|---|---|---|
| Brand & discovery | Explain the platform and help visitors find stories | Home, Discover, Trending, Rankings, Genres, Tags, Formats, Search |
| Story catalog | Present authorized works and metadata | Novel detail, chapter list, author profile, series/format pages |
| Reading | Deliver a comfortable, reliable reading session | Chapter reader, reading settings, bookmarks, progress, history |
| Personal library | Help readers organize and resume | Library, following, history, saved lists, notifications |
| Creator workspace | Help authors create, publish and understand performance | Author Studio, works, editor, chapter manager, analytics, applications |
| Community | Enable constructive participation | Discussions, comments, reviews, votes, leaderboards, profiles |
| Commerce | Make paid actions clear and auditable | Crown Vault, chapter unlocks, payment references, transaction history |
| Trust & safety | Protect users, content and platform integrity | Reports, moderation, rights review, appeals, admin controls |
| Platform operations | Support safe and measurable operations | Admin, catalog stewardship, security, provider health, analytics |
| Shared foundation | Make all domains consistent | Design tokens, navigation, localization, SEO, accessibility, performance, APIs |

## Route inventory and target sitemap

Keep existing numeric routes stable until a tested slug/redirect migration is explicitly planned. Do not change canonical URLs casually.

### Public, indexable routes when useful content exists

| Route | Page intent | Index policy |
|---|---|---|
| / | Brand homepage and current catalog highlights | Index |
| /catalog | Searchable story catalog | Index |
| /genres | Genre directory | Index when populated |
| /tags | Tag directory | Index when populated |
| /formats | Supported content formats | Index |
| /format/:format | Format landing page | Index when substantive |
| /trending | Trending stories | Index when meaningful |
| /leaderboard | Public rankings | Index only with real, populated rankings |
| /novel/:id | Published novel detail | Index if published and rights-cleared |
| /novel/:id/chapters | Public chapter directory | Index if useful and populated |
| /read/:id/:chapter | Public chapter | Index only when publicly readable and substantive |
| /author/:username | Public author profile | Index when profile has public works or useful biography |
| /community | Public community entry point | Index if it has substantive public content |
| /fandom/:slug | Rights-cleared topic landing | Index only when useful, authorized and non-thin |

### Utility, account or private routes: exclude from public sitemap

- /login, /register, /account, /settings
- /library, /history, /following, /notifications
- /author and private creator workspace routes
- /admin and all admin routes
- /tickets, payment submission, transaction and unlock flows
- /requests, private reports and moderation queues
- /omniportal and connector configuration until it is a genuine public information page
- /trend-factory and internal analytics workspaces
- API routes and internal operational endpoints

These pages must not leak private data. Apply authentication and authorization independently of SEO directives. Use noindex where appropriate; robots.txt is not access control.

### Legal and support pages
- /privacy
- /terms
- /copyright
- /content-policy (target)
- /help (target)
- /contact (target)
- /report (target)

Publish only pages with complete, accurate content and an accountable support process.

## Page templates and content hierarchy

### Homepage
1. Header and primary navigation
2. Clear value proposition and one primary discovery action
3. Search entry point
4. Genre and format shortcuts
5. Editorially selected or genuinely trending stories
6. Recently updated works with truthful timestamps
7. Creator invitation and Author Studio introduction
8. Community entry point
9. Trust, rights and platform-policy links
10. Footer

Do not put every feature on the homepage. Give each major domain a clear destination.

### Catalog and discovery
- Search by title, author, alternate title and permitted metadata
- Filters: genre, tags, format, language, completion status, rating where data supports it
- Sort: relevance, latest update, popularity/trending, rating where sample size is meaningful
- Active filter chips, clear-all, empty states, shareable URLs and pagination
- Preserve filters when moving between pages

### Novel detail
- Cover, title, author, format, genres, status and concise synopsis
- Real catalog facts only
- Follow/save and reading actions
- Chapter list and update information
- Reviews and discussion with moderation/report controls
- Rights/attribution notices where required

### Reader
- Reading surface takes priority over surrounding chrome
- Configurable font, size, width, line height, themes and direction
- Previous/next chapter, chapter list, progress and bookmarks
- Keyboard and touch support
- Clear locked/free state and price before any unlock action
- No intrusive advertising or unnecessary scripts in the reading flow

### Creator Studio
- Overview and work list
- Work creation and metadata
- Chapter editor and draft/publish workflow
- Rights declarations and review status
- Preview before publication
- Analytics grounded in actual events
- Earnings and payment states only when the underlying provider workflow is active

## Shared application architecture

- Preserve the existing Cloudflare Worker + D1 platform and current route contracts.
- Keep public brand identity independent from infrastructure names.
- Use shared design tokens and reusable components rather than page-specific visual hacks.
- Keep page templates separate from data access and policy decisions.
- Use stable IDs internally; use human-readable slugs only with unique constraints and redirects.
- Public page data must be safe to render without a logged-in session.
- Private data must be fetched only after server-side authorization.
- Keep feature flags and provider integrations explicit; do not imply disabled services are live.
- Avoid unnecessary dependencies and external runtime CDNs.

## Definition of done for architecture

- Route inventory reconciled against Worker router, app dispatcher and actual links.
- Every route classified as public/indexable, public/noindex, authenticated, admin-only or API.
- Header, drawer, mobile navigation and footer have one source of truth.
- Page templates and component inventory are documented.
- Canonical URL policy is documented before route migration.
- No route is added to sitemap unless it returns a useful, indexable page.
- Architecture changes pass route, accessibility, security and regression checks.


## Live competitor and product baseline — 31 October 2026

Read-only public-page comparison was performed against the current Imperial Novel production homepage, WebNovel and WTR-LAB. This is a feature comparison, not a claim of feature parity or a full authenticated product audit.

### Verified current Imperial Novel strengths
- The homepage already presents a clear editorial hero, format discovery, live-catalog story shelves, Creator Studio positioning, Trend Factory, community and OmniPortal.
- The catalog exposes useful discovery controls for sort order, publication status, content format, rating, genre, tag and language.
- The mobile navigation exposes Home, Discover, Library, Create, Community and Profile.

### Competitor patterns worth learning from
- WebNovel exposes several distinct ranking views, including power, collection and activity; fanfiction and comics have their own discovery paths; the homepage also surfaces new arrivals, editor selections and an author onboarding path.
- WTR-LAB makes its novel list, daily rankings and leaderboard easy to find, and explains community requests, reading progress, language/translation choices and content-rights handling in its public information architecture.
- Imperial Novel should build equivalent discovery depth with its own rights-first catalog, not copy competitor layouts or adopt unlicensed ingestion/translation workflows.

### Product architecture decisions
- Keep separate discovery destinations for catalog, genres, tags, formats, trending and rankings; filters must preserve state and be shareable.
- Give rankings explicit dimensions and explain their underlying real data. Never fabricate popularity, activity or review counts.
- Make author profiles and author onboarding distinct routes; public profiles are indexable only when they have published, rights-cleared works.
- Keep internal search, private libraries, account settings, payment and author/admin tools out of search indexes.
- Preserve the existing numeric novel and chapter identifiers until a tested slug-and-redirect migration is designed.
