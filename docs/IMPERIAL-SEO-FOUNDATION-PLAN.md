# Imperial Novel — Technical SEO Foundation Plan

This plan is based on inspection of the current main branch and deployed homepage on 31 October 2026. It records verified gaps and the implementation sequence. It does not claim that fixes have shipped.

## Verified current state

- The deployed homepage uses public/index.html and the versioned public/app-17.23.0.js application.
- The homepage has a title, meta description, robots directive, Open Graph and Twitter metadata.
- public/robots.txt exists and references /sitemap.xml.
- public/sitemap.xml currently lists only five URLs: home, catalog, OmniPortal, community and leaderboard.
- The homepage metadata inspected from production did not expose a canonical link.
- Public route templates such as catalog, genres, reader and author profile have mostly static titles/descriptions.
- The Worker html() handler substitutes __SEO_TITLE__ and __SEO_DESC__, but the novel template is the only inspected template using those placeholders. The reader template still has a generic title and description.
- The Worker serves the 404 template through the normal HTML path; its HTTP status behavior needs explicit verification and correction.
- public/index.html includes social tags but does not currently contain canonical or page-specific JSON-LD.
- The root-level index.html is a stale, unreferenced sample with obsolete God Emperor branding. The deployed asset directory is ./public; do not mistake the root sample for the live homepage.

## SEO goals

- Every indexable public page has a unique, accurate title and useful meta description.
- Every indexable page emits one absolute canonical URL on the production origin.
- Social previews use page-specific titles, descriptions and suitable licensed images.
- Public catalog and story detail pages are crawlable with meaningful HTML content and stable internal links.
- Sitemap contains only canonical, public, indexable, successful URLs.
- Account, admin, payment, private library and operational pages are excluded from indexing.
- Structured data describes only visible, verified facts.
- International pages use correct language and direction; add hreflang only when equivalent localized pages genuinely exist.
- Search traffic is measured through Search Console and real analytics, not guessed.

## Required implementation work

### A. Metadata and canonical URLs
- Add a single safe SEO metadata builder in the Worker.
- Add unique title, description, canonical, robots, Open Graph and Twitter fields per route.
- Escape all inserted values and validate canonical URLs against the configured production origin.
- Use stable existing numeric novel/chapter URLs until a slug migration has redirect and duplicate-content tests.
- For filtered catalog query strings, define one canonical policy. Do not let every filter combination create an uncontrolled indexable URL set.
- Set noindex,follow on thin, private, account, admin and transactional surfaces as appropriate.
- Do not expose private titles, descriptions or account details in metadata.

### B. Crawlable HTML and route status
- Ensure public novel detail and chapter pages expose meaningful server-rendered content to crawlers where feasible.
- Verify response status for every route class.
- Unknown routes must return HTTP 404, not a 200 response containing a 404-looking page.
- Unpublished, removed or rights-restricted works must not leak through HTML, API, sitemap or structured data.
- Avoid redirect chains; preserve useful legacy URLs with a single permanent redirect only after mapping is verified.

### C. Sitemap
Replace the five-entry static sitemap with a generated sitemap index or sitemap that includes:
- Home and stable public directory pages
- Published, rights-cleared novel detail URLs
- Public author profiles with meaningful content
- Public chapter URLs only when indexable and accessible under platform policy
- Valid localized equivalents only when available

Exclude:
- Login/register/account/settings
- Library/history/following/notifications
- Admin and creator dashboards
- Payment, unlock and private request flows
- API routes
- Thin, unpublished, removed, blocked or rights-pending content

Use accurate lastmod values derived from real content updates. Do not invent change frequency or priority values. Split large sitemaps at protocol limits and use a sitemap index when necessary.

### D. Robots and indexing controls
- Keep robots.txt available at the site root.
- Point it to the canonical production sitemap URL.
- Block crawling of internal API paths only where appropriate; do not rely on robots.txt to secure private pages.
- Use page-level noindex directives for private and utility routes so crawlers can see the directive.
- Check staging environments are not accidentally indexable.

### E. Structured data
Use JSON-LD only when represented information is visible and accurate:
- Organization or WebSite for platform identity
- BreadcrumbList for navigational hierarchy
- Book or CreativeWork for genuine novel details where fields are supported
- Person for public author profiles with accurate public identity data

Do not fabricate ratings, review counts, authorship, publication dates, prices, availability or awards. Structured data does not guarantee a rich result. Validate syntax and eligibility before release.

### F. Social sharing and images
- Use page-specific Open Graph title and description.
- Use a stable, high-quality, rights-cleared share image with correct dimensions.
- Do not use an app icon as the default social image for every novel if a licensed novel cover is available.
- Keep Twitter card metadata consistent with Open Graph.
- Provide descriptive image alt text and avoid indexing unauthorized images.

### G. International SEO
- Maintain explicit locale routes or query strategy before publishing translated pages.
- Use correct lang and dir attributes.
- Provide hreflang only for true equivalent pages with reciprocal links.
- Do not machine-translate protected content without permission.
- Ensure Urdu, Arabic and Persian pages support RTL and canonical locale URLs.

## Page indexability matrix

| Page class | Index? | Sitemap? |
|---|---:|---:|
| Homepage | Yes | Yes |
| Catalog and useful genre/format directories | Yes, when substantive | Yes |
| Published novel detail | Yes, if rights-cleared | Yes |
| Public author profile | Yes, if substantive | Yes |
| Public chapter | Conditional on access and content quality | Conditional |
| Search results and arbitrary filters | Usually no or canonicalized | No |
| Login, register, account, settings | No | No |
| Library, history, following, notifications | No | No |
| Author Studio and admin | No | No |
| Payment, unlock, private request | No | No |
| API and internal tools | No | No |
| Legal pages | Yes when complete and useful | Yes |

## SEO validation gates

Before release:
1. Unit tests for title/description escaping, canonical construction and robots policy.
2. Route tests for every public/private route class.
3. Sitemap tests proving every entry is canonical, public, published and eligible.
4. Tests proving unpublished and rights-pending content is absent from sitemap and structured data.
5. HTTP checks for 200, 301/308 and true 404 behavior.
6. Validate JSON-LD syntax and compare every field against visible page content.
7. Inspect production page source, not only hydrated browser DOM.
8. Check mobile rendering and Core Web Vitals using real measurements.
9. Submit the sitemap in Google Search Console after production deployment.
10. Monitor indexing, canonical selection, crawl errors and search performance over time.

## Reference standards

- Google Search Central — Sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- Google Search Central — Build and submit a sitemap: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Google Search Central — Canonicalization: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Google Search Central — Robots meta tags: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- Google Search Central — Structured data introduction: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- Google Search Central — JavaScript SEO basics: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics

## Release boundary

This document is a plan and audit record. It does not modify production, D1, Cloudflare settings or live SEO behavior. Implement in a reviewable branch, run tests, inspect rendered page source and verify production only after an explicitly approved deployment.
