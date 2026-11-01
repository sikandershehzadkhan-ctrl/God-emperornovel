# Imperial Novel | Phase 01N.3: Canonical Route & SEO Registry

**Audited ref:** `architecture/phase-01m-screen-blueprint`  
**Status:** Route/SEO architecture proposal reconciled against static branch source. Not production-verified.

## 1. Current routing model

The audited branch has three related routing layers:
1. `public/app.js` pathname-based page dispatch and client-side navigation.
2. `src/index.js` HTML route-to-static-file map, dynamic SEO enrichment and API dispatcher.
3. `wrangler.toml` asset/Worker-first route configuration.

These layers overlap but are not generated from one canonical route registry. Route additions can therefore be linked in the client but absent from Worker HTML mapping, metadata policy or Worker-first configuration. A single declarative registry should eventually generate route tests, canonical metadata rules, robots policy and sitemap eligibility.

## 2. Observed route inventory and target policy

| Route family | Current branch evidence | Canonical/SEO policy |
|---|---|---|
| `/` | Home HTML and client page | Index; one canonical root |
| `/catalog` | Catalog HTML/client | Index; query filters generally canonicalize to base or curated landing |
| `/discover` | Worker HTML route, client catalog-compatible path | Index only if distinct page intent; otherwise canonicalize to /catalog |
| `/catalog?sort=trending` | Client trending state | Canonical policy must prevent duplicate sort permutations |
| `/genres`, `/tags` | Public directories | Index if useful, stable and populated |
| `/format/:format` | Dynamic supported format route | Index only for valid, curated format IDs |
| `/search` | Search route | Usually noindex for arbitrary query results; preserve user utility |
| `/novel/:id` | Dynamic published novel metadata | Index only when published and rights-eligible |
| `/novel/:id/chapters` | Chapter archive | Index policy based on unique useful content; avoid thin duplicate listing |
| `/read/:novelId/:chapterNumber` | Dynamic published chapter | Index only if rights-eligible and intentionally public; locked chapters noindex |
| `/author/:slug` | Public author profile route | Index when profile resolves to published works and has stable canonical |
| `/fandom/:slug` | Fandom route | Index only for approved, useful, rights-safe public hubs |
| `/library`, `/history`, `/following` | User-specific | noindex; authenticated owner scope |
| `/account`, `/settings` | User-specific | noindex; authenticated owner scope |
| `/tickets`, `/requests` | Account/commerce | noindex for personal transaction surfaces; public help content separate |
| `/notifications` | Private | noindex; authenticated owner scope |
| `/community` | Public/community shell | Index hub; private subresources noindex |
| `/leaderboard`, `/tier-list`, `/trending` | Public discovery | Index only with meaningful, non-thin, fresh data and clear metric definitions |
| `/made-for-you`, `/for-you` | Personalization | noindex; do not expose personalized private data to crawlers |
| `/vote` | Request voting | Index landing if public, but personal vote state private |
| `/omniportal` | Provider/source discovery | Index only for public explanatory content; no secrets, job details or restricted provider evidence |
| `/trend-factory` | Intelligence/editorial product | Public overview may index; source credentials, jobs and internal analytics noindex |
| `/become-an-author` | Client link and HTML map observed | Preserve and verify direct route; previous production 404 reported |
| `/author` | Author Studio shell | noindex; requires auth/creator permission |
| `/admin` | Admin shell | noindex; server-side permission required |
| `/login`, `/register` | Auth pages | noindex; avoid indexing query/token values |
| `/privacy`, `/terms`, `/copyright` | Legal pages | Index; version and effective date visible |
| `/community-taxonomy` | Public approved taxonomy submission surface | Index policy based on usefulness; private pending submissions never index |
| `/robots.txt`, `/sitemap.xml`, sitemap shards | Worker-generated | Technical endpoints, not ordinary pages |

## 3. Route compatibility and normalization

Preserve current working public URLs until compatibility tests prove a replacement:
- `/catalog` remains the stable catalog entry.
- `/discover` must either be a real distinct route or a deliberate canonical alias.
- `/novel/:id` and `/read/:novelId/:chapterNumber` remain stable deep-link formats until an explicit ID/slug migration is planned.
- `/author/:slug` must not conflict with `/author` Creator Studio.
- `/author/:slug` must not be mistaken for a private author dashboard.
- `/become-an-author` must resolve directly and preserve its application flow.
- Trailing slash normalization must be consistent.
- Percent-encoded route segments must be decoded once and safely.
- Unknown formats, malformed IDs and missing records return a genuine 404.
- Query parameters are validated, bounded and sorted before canonical URL generation.
- Authentication return URLs must be same-origin and allowlisted.

Do not redirect old routes until links, QR codes, bookmarks, search results and mobile deep links have been tested.

## 4. Canonical metadata contract

Every indexable route has:
- unique title and useful description;
- one absolute canonical URL;
- robots directive;
- locale and alternate-language policy when translation is genuinely available;
- Open Graph/Twitter metadata;
- structured data appropriate to the page type;
- stable entity IDs and sameAs references only when verified;
- last meaningful content update date where available.

Never:
- emit a canonical URL to an unpublished or unauthorized work;
- expose a private query string, user ID or session token in canonical metadata;
- mark empty/thin search result permutations indexable;
- claim author identity or rights ownership based only on a source match;
- generate fake ratings, view counts, chapter counts or author statistics.

## 5. Structured data and AEO/GEO

Page-type mapping:
- Home: Organization/WebSite/SearchAction only where values and search target are real.
- Catalog/genre/format landing: CollectionPage/ItemList for visible entries.
- Novel: Book/CreativeWork with verified author, language, status and cover.
- Chapter: Chapter/CreativeWork with correct parent novel and publication state.
- Author: ProfilePage/Person only for the public profile identity supported by the data.
- Community group/discussion: structured data only where schema vocabulary and visible content fit.
- Legal/help: WebPage/Article with version/effective date where useful.

AEO/GEO content quality:
- Provide concise, directly answerable page introductions.
- Use consistent entity names and clear author/novel relationships.
- Maintain visible provenance for external trend claims.
- Avoid generated FAQ spam and unsupported “best/top” claims.
- Keep structured data consistent with visible page content.
- Do not promise placement in search engines or AI answer systems.

## 6. Sitemap eligibility and freshness

The Worker currently generates sitemap index/shards for novels, authors and unlocked chapters using published and rights-eligible filters. Maintain these gates.

Required improvements:
- Use actual content `updated_at` values and stable pagination ordering.
- Include only canonical URLs returning 200.
- Exclude locked/private/unpublished/unlicensed content.
- Exclude duplicate aliases and noindex pages.
- Ensure shard counts and offsets remain consistent under concurrent catalog changes.
- Include locale alternates only when translated pages are real and reviewed.
- Validate sitemap XML and URL host against configured canonical origin.
- Monitor 404/5xx and indexing coverage; sitemap inclusion is not proof of indexing.

## 7. Robots and crawler policy

Robots rules are discovery guidance, not access control. Private APIs and admin surfaces must be protected independently.

- Keep private/account/admin route noindex at HTML level.
- Avoid exposing internal search endpoints, user data or job IDs in sitemaps.
- AI crawler access settings must be explicit, documented and consistent with user rights and content licensing.
- Do not allow training/search crawlers to access content where rights or policy do not permit.
- Avoid contradictory robots meta and robots.txt directives.
- Do not block assets required to render indexable pages.

## 8. Registry schema proposal

The canonical route registry should include:
- route_id;
- path pattern and aliases;
- route owner/domain;
- page shell and client renderer;
- Worker HTML mapping;
- auth requirement and permission;
- resource ownership scope;
- canonical URL builder;
- robots/index policy;
- structured-data builder;
- sitemap eligibility;
- locale/alternate policy;
- cache and freshness policy;
- route-level test IDs;
- migration/deprecation status.

The registry should be machine-checkable and generate route tests. It must not be used as the sole authorization enforcement mechanism.

## 9. Route consistency test suite

1. Every client navigation link resolves to a Worker HTML route or explicitly supported dynamic route.
2. Every Worker HTML route has a client renderer or a deliberate server-rendered page.
3. Every protected route is noindex and server-authorized.
4. Every canonical URL resolves to the same content and returns 200.
5. Every alias redirects to the selected canonical route without losing safe query state.
6. Malformed novel/chapter/format/author identifiers return 404.
7. `/author` and `/author/:slug` resolve to different intended experiences.
8. `/become-an-author` direct navigation works in production.
9. Query permutations do not create duplicate indexable pages.
10. Sitemap URLs are canonical, published, rights-eligible and return 200.
11. Locked chapter URLs have the intended noindex behavior.
12. No private route exposes personal content to crawler requests.
13. Structured data matches visible title, author, language, rating and chapter metadata.
14. All locale alternates resolve and reciprocally reference one another.
15. Canonical origin never falls back to a staging or preview hostname in production.

## 10. Outstanding verification

- Current main branch route inventory versus this audited feature branch.
- Production direct-route status for every high-value route.
- Actual SEO metadata rendered on production.
- External structured-data validation.
- Sitemap and robots behavior under real production data.
- Search Console/Bing indexing and canonical reports.
- Mobile route transitions and deep links.
- Full AEO/GEO content and entity audit.

No source code, route, metadata, robots policy, sitemap, production data or deployment was changed.
