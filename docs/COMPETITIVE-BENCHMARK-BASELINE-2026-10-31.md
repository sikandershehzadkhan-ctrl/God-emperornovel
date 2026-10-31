# Imperial Novel: Continuous Competitive Benchmark

**Baseline date:** 2026-10-31  
**Production inspected:** https://god-emperornovel.sikandershehzadkhan.workers.dev/  
**Source inspected:** `main`, release `17.21.0`; **live production:** `17.20.0`  
**Purpose:** Keep Imperial Novel in a recurring, evidence-based comparison with relevant reading, publishing, comics, translation and story-community products. This is a living audit, not a marketing scorecard.

## Rules of evidence

1. Compare live production with live competitor products, not mockups or roadmap promises.
2. A visible button, navigation item, database table or marketing claim is not proof that a feature works end to end.
3. Mark each capability **Verified**, **Partial**, **Catalog-only**, **Not verified**, or **Not available**. Record the exact test and date.
4. Competitor homepage claims are leads for testing, not independently verified functionality. Login-gated flows require a legitimate test account and must not be bypassed.
5. Never copy proprietary content, private APIs, protected artwork, or another platform's copyrighted material. Learn from product patterns and compete through authorized content and original implementation.
6. Never inflate catalog counts, ratings, traffic, translation quality, revenue or performance. Separate measured results from provider marketing claims.
7. Every finding needs severity, impact, reproduction steps, owner, fix, regression test and retest result.
8. Do not deploy financial, schema or security changes to production without their required preflight, backup/recovery plan and explicit production release gate.

## Live Imperial Novel baseline (2026-10-31)

| Area | Observation | Evidence status |
|---|---|---|
| Service health | `/api/health` returned `ok:true`, database `true`, version `17.20.0` | Verified live response |
| Published catalog | `/api/novels?limit=50&page=1` returned one published title, **The Imperial Ascendant**, with two published chapters | Verified live response; this is the result count returned by this query |
| Content formats | `/api/formats` advertises 15 formats | Verified live response |
| Text/comics | Four text formats and six illustrated-comics formats are described with text/panel/vertical readers | API capability declarations; end-to-end format QA still required |
| Screen/audio/game | Anime, cartoons, audiobooks, dramas and games explicitly say catalog-only / playback or integration not enabled | Verified live capability declaration |
| Comic reader | Source contains vertical-scroll and single-page controls, lazy image loading and a page cap | Source verified; live user-flow QA pending |
| Homepage | Live page presents Discover, Trend Factory, World Forge, Reader Constellation, OmniPortal, Creator Studio and Crown Vault | Verified live rendered copy; each destination still needs functional testing |
| AI authoring | Author Studio states provider generation requires a configured provider key; manual drafting remains available | Source/page verified; provider availability and generation quality not certified |
| Operational response | TinyFish fetches of health/formats/catalog returned tool-observed latencies of roughly 7.0s/7.5s/12.2s in this sample | Warning signal only, not a controlled browser benchmark or stable SLO |
| Production rollout | Current live API reports 17.20.0; recent source changes are not assumed deployed | Verified live version |

**Immediate strategic reality:** the strongest gap is not a missing decorative feature. The live catalog query returned one published novel and two chapters. Large competitors advertise extensive libraries and mature creator ecosystems. Imperial Novel must solve content supply, creator acquisition, retention and reliability, not just add menu items.

## Competitor snapshot

This is a first-pass public-site reconnaissance. It is not a full authenticated workflow audit.

### WTR-LAB — https://wtr-lab.com/

Public homepage/FAQ describes:
- Machine-translated web/light novels and multiple translation options (AI plus Google/Bing/Yandex).
- Community novel requests, votes and ticket-based priority/fast releases.
- Reading progress, bookmarks and update notifications for accounts.
- Ratings, reviews, discussions and a Discord community.
- Free reading and mobile browser access.

**Imperial Novel implications:** a real, lawful, quality-controlled translation experience; request voting; transparent release queues; reading continuity; bookmarks/notifications; reviews and community. We must not ingest unauthorized source chapters or reproduce WTR-LAB's content pipeline. Translation needs rights checks, source attribution and quality controls.

### FictionZone — https://fictionzone.net/

Live homepage showed:
- Top recommendations and hidden gems.
- Recent reviews with substantive reader text and timestamps.
- Discord community invitation.
Search results for its public pages surfaced browse filters, curated collections, author application, OmniPortal source discovery and a most-completed ranking. The homepage also displayed a notice that rankings were still being calculated.

**Imperial Novel implications:** high-quality review surfaces, useful editorial/algorithmic discovery, collections, author onboarding and transparent ranking states. Do not display empty or fabricated ranking data as if computed.

### WebNovel — https://www.webnovel.com/

Live homepage showed:
- Weekly featured content.
- Separate fanfiction and general fiction ranking families.
- Power, collection and active rankings.
- Fanfiction tags, rising fictions, new arrivals and editor selections.
- Author onboarding and author-guide entry points.

**Imperial Novel implications:** fanfiction deserves a first-class taxonomy and dedicated discovery, not a generic genre label. Build rankings with explicit definitions, anti-manipulation rules and real data. Build author onboarding, education, analytics and retention loops.

### TomatoMTL — https://tomatomtl.com/

A direct public fetch succeeded. The homepage identifies TomatoMTL as a Chinese MTL reading-assistance tool and exposes Most Viewed and Garden discovery shelves, category navigation, community topic posts with reply/save counts, language selection in Settings, and published reading-rate limits (the page text displayed 121 chapters/hour and 676/day in one notice, with a different hourly threshold in a repeated notice). The live reader translation workflow, provider details, rights status of individual source texts and actual output quality were not tested.

**Imperial Novel implications:** investigate reader-side bilingual/MTL assistance as a possible differentiator, but only after rights, provider cost, privacy, caching and translation-quality economics are solved.

### Faloo — https://www.faloo.com/

Live Chinese homepage showed:
- Male/female reading channels and broad genre navigation.
- Click, monthly-ticket and collection rankings.
- Audio-book channel and client/app promotion.
- Author portal and creator recruitment.
- Public positioning around comics, audio, animation, film/TV adaptations and IP development.

These are visible product surfaces and company claims, not independently audited backend capabilities.

**Imperial Novel implications:** strong localized genre navigation, creator pipelines, multiple ranking signals and a lawful long-term IP adaptation ecosystem. Audio/video require licensed media and real playback, not catalog labels.

### Qidian — https://www.qidian.com/

A direct public homepage fetch succeeded in Chinese. Visible surfaces include account login/registration, synced bookshelf and reading progress messaging, personalized recommendation messaging, category browsing, rankings, completed/free shelves, a dedicated author area, and multiple editorial/ranking shelves (including monthly-ticket, reading-follow, collection, potential and new-book rankings). The desktop homepage also advertises app downloads. Login-gated sync, recommendation quality, author publishing, paid reading and app behavior were not tested.


### Fanqie Novel (番茄小说) — https://fanqienovel.com/

A direct public homepage fetch succeeded in Chinese. It identifies Fanqie as a free-reading product associated with Douyin and exposes:
- Male- and female-oriented ranking entry points.
- A recent-updates table with category, title, latest chapter, author and update time.
- A writer-benefits area and author portal for creating works and viewing work data/earnings.
- A copyright/rights showcase area and references to original/IP works.
- Marketing copy for listening/read-aloud, reader community/book-circle features and a large authorized catalog.

These are visible page surfaces and product/company descriptions. Actual audio playback, payout eligibility, author contract workflow, recommendation personalization and the legal status of any individual title were not independently tested.

**Imperial Novel implications:** creator analytics and earnings visibility, separate reader/author experiences, update freshness, accessible audio controls and rights-aware catalog metadata are important benchmarks. We must not imply payouts or audio playback until provider, rights and payment workflows work end to end.

## 100-point competitive scorecard

The weights total 100. A score is assigned only after repeatable tests on Imperial Novel and the competitor baseline. **No overall percentage is assigned in this first reconnaissance.**

| Domain | Weight | What must be tested |
|---|---:|---|
| Catalog depth, rights and quality | 10 | Published volume, freshness, completeness, metadata quality, deduplication, lawful provenance, editorial quality |
| Discovery and search | 9 | Full-text/title/author/alias search, filters, sorting, tags, personalized discovery, recommendations, trending and ranking integrity |
| Reading experience | 12 | First-content latency, chapter transitions, typography, themes, progress sync, offline/PWA, bookmarks, history, accessibility, reader stability |
| Comics and media formats | 10 | Manga/manhwa/manhua/webtoon image pipelines, panel/vertical modes, zoom, preloading, RTL/reading direction, audio/video playback and licensing |
| Creator and publishing tools | 10 | Onboarding, drafts, editor, autosave, scheduling, revisions, analytics, collaboration, moderation, rights workflows, author support |
| Translation and localization | 8 | UI locales, translated metadata, bilingual reader, translation quality, language switching, RTL, locale-aware search and accessibility |
| Community and fandom | 8 | Reviews, ratings, comments, reactions, discussions, collections, fandom hubs, moderation, reporting, creator-reader interaction |
| Monetization and creator economics | 7 | Transparent pricing, payments, refunds, creator payouts, tax/fees, anti-fraud, purchase history, free access fairness |
| Trust, safety, privacy and IP | 10 | Authentication, authorization, abuse controls, copyright/takedown, age/content controls, privacy, data export/deletion, audit trails |
| Performance, reliability and accessibility | 8 | Core Web Vitals, low-end Android, mobile data, uptime, error rates, caching, bundle weight, keyboard/screen-reader/reduced-motion QA |
| SEO, distribution and growth | 4 | Crawlability, structured metadata, share cards, sitemap, deep links, installability, referral and acquisition loops |
| Operations and extensibility | 4 | Admin tools, observability, backups, recovery, API contracts, migrations, integrations, release/rollback automation |

### Score method

For each test case:
- **0%:** absent, broken, unsafe or misleading.
- **25%:** visible prototype or severely limited partial flow.
- **50%:** core happy path works but meaningful edge cases/quality controls are missing.
- **75%:** complete and reliable for normal users, with tested edge cases.
- **100%:** production-grade, accessible, measurable and at least competitive with the strongest relevant benchmark.

Domain score = average of its test cases. Weighted total = sum(domain score × domain weight). Also publish confidence and sample size. A missing test is **Not assessed**, never silently scored as zero or 100.

## Initial gap register

| Priority | Finding | Severity | Required next action |
|---|---|---|---|
| P0 | Live query returned one published novel and two chapters | Critical business/retention gap | Audit catalog rights/status and author acquisition; establish a sustainable authorized publishing pipeline and real release cadence |
| P0 | Five advertised formats are explicitly catalog-only (anime, cartoons, audiobook, drama, game) | High product-truth gap | Keep labels honest; prioritize licensed audio playback before expanding further, and do not promise streaming without rights/hosting |
| P0 | Live API sample showed high response times | High reliability warning | Run controlled repeated browser/network tests on low-end Android and mobile data; profile Worker, D1, assets, cold starts and client boot separately |
| P1 | Competitors visibly provide deeper ranking/review/collection/request loops | High discovery/community gap | Map current Imperial Novel APIs and flows against each one; implement only where data and moderation are real |
| P1 | WTR-LAB's public product description includes multiple translation engines and community request voting | High differentiation gap | Design rights-first translation and a transparent reader request/voting queue; verify costs before provider integration |
| P1 | Faloo surfaces audio and broader IP adaptation channels | Medium/high ecosystem gap | Build lawful rights metadata and adaptation permissions first; audio requires an actual player and licensed files |
| P1 | Fanfiction ranking/tag discovery is prominent on WebNovel | High audience-fit gap | Test Imperial Novel fanfiction taxonomy, fandom pages, tag search, rankings and copyright reporting |
| P1 | AI Author Studio depends on an externally configured provider key | High capability/dependency gap | Keep manual workflow complete; show honest provider status; benchmark low-cost/free providers only when terms and budget permit |
| P2 | Qidian and TomatoMTL were not fully inspected | Research gap | Revisit official accessible pages/apps and record the exact flows tested |
| P2 | No controlled cross-platform mobile benchmark has been run in this pass | Research gap | Establish a repeatable low-end Android test protocol and collect same-device measurements |

## Repeatable audit protocol

For each platform, test the same scenarios with a clean browser session and record date, device, viewport, network, account state and exact route:

1. First visit: homepage render, first content, layout shifts, image loading, navigation, consent/privacy and error handling.
2. Find a title: search exact title, partial title, alternate title, author, genre, tag and language; test empty/no-result states.
3. Choose a story: inspect metadata, rights/official status, cover, rating/review integrity, chapter count and update freshness.
4. Read: open first/middle/latest chapter, switch themes/font/spacing, navigate next/previous, refresh, resume, bookmark, history and report content.
5. Comics: open a real authorized comic chapter; test vertical and page modes, image failure, zoom, direction, preload and low-bandwidth behavior.
6. Create: register author, create draft, edit, autosave, preview, submit, receive review feedback, publish and update.
7. Community: review, rate, comment, react, follow, collection, report, block/mute and moderation.
8. Translation: switch UI locale, translate metadata, read bilingual content, compare quality and verify attribution/rights.
9. Payments: inspect prices, make no real purchase during benchmark, test sandbox only, verify refunds/receipts and ledger invariants.
10. Account/data: session expiry, logout, account settings, data export/deletion, privacy and notification controls.
11. Security: test only Imperial Novel or explicitly authorized test environments; use role matrices, IDOR, CSRF, XSS, injection, rate limits, abuse, webhook replay and SSRF tests. Never attack competitor infrastructure.
12. Accessibility/performance: keyboard, screen reader, contrast, reduced motion, zoom, small viewport, slow 3G simulation, CPU throttling and repeated cold/warm runs.

## Release gate

A competitor-inspired feature is not complete until:
- its product requirement and lawful source/rights are documented;
- server authorization and abuse controls are tested;
- loading, empty, error, offline and success states exist;
- mobile and accessibility checks pass;
- automated regression tests cover critical logic;
- production data and migrations are safely handled;
- live deployment is independently verified;
- the competitor comparison is repeated and the gap is retested.

## Next benchmark wave

1. Finish the production D1 donation-reference audit and close the duplicate-credit risk before touching payment uniqueness.
2. Audit the complete Imperial Novel route/API inventory and map each menu destination to a real working end-to-end flow.
3. Run controlled performance measurements on the homepage, search, novel detail, reader and comic reader.
4. Complete same-scenario comparisons for WTR-LAB, FictionZone, WebNovel, TomatoMTL, Faloo and Qidian.
5. Convert verified gaps into small, independently testable engineering workstreams. Fix critical correctness/security/reliability gaps before cosmetic parity.
6. Repeat the scorecard on every meaningful release. Keep the public site honest about what is live versus planned.

---
**Status:** Baseline reconnaissance recorded. Full competitor workflow testing, weighted score and overall percentage remain pending. This document does not certify that Imperial Novel is complete or competitive yet.


## Production browser smoke-test and latency addendum (2026-10-31)

Read-only browser checks were repeated. The second catalog test deliberately waited 10 seconds before classifying the page.

| Flow | Result | Finding |
|---|---|---|
| Homepage | Partial | Hero/navigation render; story shelves showed skeletons in the first browser session |
| Discover `/catalog` | Pass after wait | After approximately 10 seconds, the Imperial Ascendant card appeared; no loading indicator or visible error remained |
| Catalog API | Pass | HTTP 200; one published result, The Imperial Ascendant |
| Novel `/novel/1` | Pass | Cover, author, rating and two chapters displayed |
| Reader `/read/1/1` | Pass (render only) | Chapter text, font-size controls, bookmark, theme toggle, progress and chapter navigation displayed |
| Locked chapter | Presentation only | Chapter 2 showed as locked for 1 Imperial Crown; purchase/settlement was not tested |
| Community | Surface only | Leaderboard, tier list, vote and random-novel entry points rendered; trending story displayed |
| Trend Factory | Surface only | Rights-first metadata discovery page rendered |

### Corrected catalog diagnosis

The earlier claim that the catalog failed to render was premature. The second browser run confirms that the card eventually appears. The catalog is therefore **not currently classified as broken**. It is classified as **slow to become useful**: the test observed about 10 seconds before the story card appeared.

Repeated external fetch observations for the catalog API were approximately 4.5s and 7.4s, with one health fetch around 6.6s; another request was unreachable. These are tool-observed end-to-end fetch timings, not isolated Worker execution time or a controlled TTFB benchmark. They justify a controlled performance investigation, but they do not prove the Worker or D1 is solely responsible.

### Confirmed content and product gaps

- **Extremely sparse public catalog:** one published title and two chapters in the inspected API response. This is a severe audience-retention and competitive-positioning gap.
- **Test-quality content:** the only published first chapter currently displays “Test it / Test 2”. Replace it with a properly edited, authorized production chapter before public acquisition campaigns. Do not inflate chapter count with filler.
- **Homepage shelf delay:** the first browser run saw loading skeletons. Retest after controlled wait and trace shelf API timings and client hydration.
- **Paywall flow not certified:** only the locked presentation was observed. No purchase, unlock, refund, balance or ledger flow was executed.
- **Media formats:** five formats still declare catalog-only/playback or integration unavailable in the live formats response.

### Donation reference audit status

The read-only production D1 audit workflow run #25 for commit `850c6b8b760ac19e95b98b921bfe35f18f0a5ca7` completed successfully in 1m 1s. Its database inventory step includes the aggregate-only donation reference audit, which counts total donation rows, blank references, distinct normalized references, duplicate groups and extra duplicate rows. The actual SQL output is behind GitHub Actions authentication and was not accessible in the public browser session.

**Important:** a successful workflow run proves the audit job completed, not that duplicate count is zero. The production duplicate count remains **unknown** until an authorized operator can inspect the log output. Do not add a production uniqueness constraint or mutate donation records based on an assumed clean result.

### Next technical investigation

1. Use controlled browser instrumentation to measure navigation start, HTML response, JavaScript boot, catalog API start/end, format registry start/end, and first story-card paint separately.
2. Repeat at least five cold and warm samples on the same low-end Android device/network profile; report median and p75, not one fetch latency.
3. Inspect Worker initialization, D1 query plan/indexes, static asset caching, and client-side concurrent requests only after timings isolate the bottleneck.
4. Keep catalog loading, empty, and error states distinct. A slow response must not be mistaken for an empty catalog or an indefinite skeleton.
5. Retrieve the donation audit aggregate output through authorized GitHub Actions access before deciding whether a unique normalized-reference index is safe.

### Interpretation

A route returning HTML is not enough to pass. The catalog eventually renders its one result, but the observed delay is unacceptable as an uninvestigated experience. Reader rendering passed for one sample chapter, but content quality and payment workflows remain unverified. No production code or data was changed by these read-only tests.


### Third catalog inspection: hydration and timing evidence

A direct HTML extraction of `/catalog` showed the initial client shell text **“Loading catalog…”** and did not contain the story card. The browser smoke test later observed the card after waiting; a separate browser run reported it visible on its initial observation and gave only a rough ~3-second estimate. These observations are not a controlled, consistent timing series.

The browser automation interface explicitly could not expose Navigation Timing or Resource Timing APIs. Therefore we still do not have reliable `responseEnd`, API duration, or first-card paint measurements. Direct external fetch samples also include tool/network overhead and must not be treated as Worker TTFB.

**Current classification:** client-side catalog hydration is eventually successful, but first-content timing is not yet measured reliably. Keep this as a performance investigation, not a confirmed functional defect. Do not add indexes or alter Worker logic until controlled measurements isolate the bottleneck.


## Public discovery and creator-surface audit (2026-10-31)

A separate read-only browser session inspected Search, Formats, Genres, Author Studio and Account.

| Surface | Observed result | What remains unproven |
|---|---|---|
| Search `/search` | Public search works; searching “fantasy” returned The Imperial Ascendant | Ranking relevance, typo tolerance, synonyms, multilingual search and large-catalog performance |
| Formats `/formats` | Five format groups and format subtypes render; catalog-only constraints are disclosed | Actual comic/audio/video/game end-to-end experiences and format-specific metadata quality |
| Genres `/genres` | Browser displayed 158 genre cards with active catalog links | Taxonomy quality, duplicates, empty genre usefulness and search/filter consistency |
| Author Studio `/author` | Story creation form, format/language/status and rights fields render; unauthenticated “Your Works” is properly gated | Authenticated draft creation, autosave, edit, upload, preview, moderation feedback, publishing and analytics |
| Account `/account` | Correct sign-in/register landing state | Authenticated profile, privacy, notification, security and account deletion workflows |

### Interpretation

Public discovery is broader than the published catalog: 158 genre links and multiple format families exist, but only one published story appeared in the live catalog query. This is taxonomy breadth, not catalog depth. A visible Author Studio form is not proof that the full author publishing lifecycle works; that requires an authorized test account and end-to-end tests.


## Second live public-page comparison: WebNovel and WTR-LAB (2026-10-31)

A separate TinyFish browser session inspected Imperial Novel, WebNovel and WTR-LAB public surfaces in one read-only session. No sign-in, registration, form submission, purchases or data changes were performed. This is a small public-page sample, not a full competitor audit.

### Observed comparison

| Area | Imperial Novel | WebNovel | WTR-LAB |
|---|---|---|---|
| Homepage | Imperial brand hero, search, genre chips, two primary story shelves and feature deck | Featured carousel, awards/author-benefit section and multiple editorial shelves | Minimal search-first landing page |
| Navigation | Discover, Formats, Genres, Community, Rankings, OmniPortal, Library; 14 language choices and theme toggle | Browse, Rankings, Create; genre trees for male/female/comic/fanfiction and social links | Library, Novels, Ranking, Leaderboard; Discord/Patreon links |
| Discovery | Catalog filters/sorts, but one published novel returned | Weekly featured, reader picks, rising, new arrivals, editor picks, fanfiction and completed shelves | Novel list and search; limited homepage curation visible |
| Novel detail | Metadata, synopsis, start reading, library/follow/share, chapter list, rating/reaction/comment surfaces | Rich details, tags, chapter counts, reviews and read CTAs | Basic novel pages and translation/community notes |
| Reader | Sample text chapter rendered; locked chapter showed 1 Crown | Reader and chapter navigation visible | Translation-focused reader surfaced in public product description/sample |
| Creator | Author Studio route and form visible; authenticated lifecycle not tested | Dedicated Inkstone creator portal and author onboarding links | No creator tooling verified in this public sample |
| Community/ranking | Leaderboard, tier list, vote and random-novel entry points; detail page had no visible discussion activity in this sample | Multiple ranking families and reviews/social channels | Ranking/leaderboard and Discord/community voting surfaces |
| Formats/localization | 18 sub-formats across 5 groups; 14 locale choices; five media families still catalog-only | Novel/comic/fanfiction categories | Primarily novel/MTL positioning |

### High-priority competitive gaps

1. **Content depth and editorial quality:** live public catalog exposed one novel and two chapters. The sampled chapter content was test-quality, not launch-quality. This is a critical supply and trust issue.
2. **Discovery depth:** WebNovel exposes substantially more curated shelves and ranking families. Imperial Novel's discovery controls are a useful base, but need enough authorized works and meaningful signals to make them useful.
3. **Community activity and creator lifecycle:** Imperial Novel exposes community/creator entry points, but the browser did not verify authenticated publishing or a lively discussion ecosystem. Build complete, moderated workflows before marketing these as mature features.

### Limits and confidence

- Browser-native performance timing was unavailable; no LCP, TTFB or controlled time-to-content claims are made.
- Mobile quality was not assessed; the session used a desktop viewport.
- Login-gated creator, payment, personalized recommendation and moderation actions were not tested.
- Competitor features are observations of public surfaces, not proof of backend behavior or service quality.
- The 14 visible locale choices and 18 format subtypes are taxonomy/UI breadth, not proof of complete translation coverage or working playback for every format.

### Follow-up actions

1. Prioritize a rights-cleared, editorially reviewed content acquisition and author onboarding pipeline.
2. Audit every ranking and recommendation query for real signals, anti-manipulation and honest empty states.
3. Complete authenticated author, review, discussion, report and moderation flows with role-based regression tests.
4. Run same-device mobile testing and controlled performance measurements before changing Worker/D1 architecture.
5. Revisit WTR-LAB's actual reader translation flow and WebNovel's ranking/creator flows only through public or authorized test access.


## Follow-up production evidence and engineering changes (2026-10-31)

### Authenticated read-only production D1 results

The detailed output from audit workflow run #25 (commit \`850c6b8b760ac19e95b98b921bfe35f18f0a5ca7\`) was subsequently retrieved through the authenticated GitHub Actions connector. This supersedes the earlier statement that the counts were unknown.

| Audit | Actual production result |
|---|---:|
| Donation rows | 0 |
| Blank donation references | 0 |
| Distinct nonblank donation references | 0 |
| Duplicate normalized reference groups | 0 |
| Extra duplicate reference rows | 0 |
| Published novels | 1 |
| Published novels with unusual rights status | 0 |
| Published novels missing rights evidence | 0 |
| Published novels missing owner | 0 |
| Published chapters | 2 |
| Published chapters without a novel | 0 |

The audit used SELECT/PRAGMA statements only. It did not change data or deploy code. The D1 SQL timing reported by the audit for the aggregate rights and chapter checks was below 1 ms; these are individual SQL execution timings, not end-to-end page timings.

The same workflow reported the production Worker at version **17.20.0**, matching the repository's pre-follow-up target at that time. The public homepage returned HTTP 200 in approximately 0.087 seconds from the GitHub runner. Neither result certifies mobile performance or reader/API response time.

### Source changes merged to main, not yet deployed

- **PR #64 — catalog relationship pre-aggregation:** replaced the genre × tag × chapter join fan-out with separate correlated aggregates. Added SQLite parity tests for all sort modes and representative filters. Pull-request validation passed. A separate in-memory synthetic test (300 novels, 100 chapters, 5 genres and 20 tags per novel) measured a median of 752.8 ms for the previous query and 3.16 ms for the pre-aggregated query. This is a synthetic query-shape benchmark, not a Cloudflare production measurement.
- **PR #65 — donation reference uniqueness:** validates whole-number PKR amounts and bounded transaction references, creates a unique normalized-reference index on first donation submission, and adds a duplicate guard with conflict handling. The index was supported by the clean production audit above. CI passed. The automated payment webhook remains disabled.
- **PR #66 — runtime schema bootstrap:** consolidates auth-rate-limit, community and discovery runtime DDL behind one schema-version marker. Initialized Worker isolates now need one marker SELECT instead of repeatedly issuing the full DDL/cleanup sequence. Added a mocked-D1 fast-path regression test. CI passed.

All three PRs were merged to \`main\`. **None of these source changes has been deployed to the live Worker in this follow-up.** No production schema mutation was made by these PRs. Production performance improvements remain unverified until the code is deliberately deployed and measured.

### Current status

The immediate catalog, donation-integrity and cold-isolate schema-bootstrap source changes have passed CI. The platform is still not certified as competitive or launch-ready: the live catalog remains critically sparse, content quality needs editorial remediation, authenticated author/community/payment flows remain incompletely tested, and mobile/performance QA remains pending.


## Second direct-fetch competitor recheck (2026-10-31)

This pass used public homepage fetches only. It did not create accounts, submit forms, purchase, bypass access controls or test private APIs. Homepage claims are not treated as verified backend capability.

| Platform | Newly observed public surfaces | Important unverified areas |
|---|---|---|
| WTR-LAB | Translation options, request/vote/priority queue positioning, rankings, library and community links | Actual translation quality, rights/provenance of each title, chapter reader, ticket mechanics |
| FictionZone | Recommendations, hidden gems, recent user reviews, browse, collections, OmniPortal links, Discord; rankings page disclosed a calculating state | Ranking calculations, OmniPortal rights gates, author application lifecycle, authenticated community |
| TomatoMTL | MTL reader-assistance positioning, Most Viewed/Garden shelves, community topic counters, language settings and rate-limit notices | Actual translation UI/output, source licensing, translator providers, reader reliability |
| WebNovel | Weekly featured, top fanfiction books/tags, distinct fanfic and general Power/Collection/Active ranking groups, original-story and author onboarding sections | Authenticated Inkstone publishing, creator payouts, full reader/account behavior |
| Fanqie | Male/female rankings, fresh-update table, writer portal and earnings/data messaging, rights showcase, audio/community positioning | Audio playback, contract/payout flow, author analytics and recommendation behavior |
| Faloo | Male/female channels, genre taxonomy, click/monthly-ticket/collection rankings, author portal, audio and IP adaptation business surfaces | Actual audio playback, creator contract/payment process, IP rights and app workflows |
| Qidian | Category/search, rankings, completed/free shelves, author zone, synced bookshelf/progress and personalized-recommendation messaging, many editorial shelves | Login-gated sync, personalization quality, author lifecycle, purchase/payment and mobile app workflows |

### Updated strategic implications

1. **Content supply remains the dominant gap.** Imperial Novel's live catalog API still returns one published novel and two chapters. No feature-count comparison offsets this supply deficit.
2. **Discovery must be signal-backed.** Competitors expose differentiated rankings (power, collection, activity, monthly tickets, reading-follow, clicks and completion). Imperial Novel should define transparent metrics and anti-manipulation controls before expanding ranking labels.
3. **Creator economics are a full workflow.** Fanqie, Qidian, Faloo and WebNovel visibly market author portals, benefits, analytics, earnings or author education. Imperial Novel must build drafts, review, publishing, analytics, rights and payment ledgers as one tested lifecycle, not a form plus a dashboard label.
4. **Translation is a distinct product strategy.** WTR-LAB and TomatoMTL position translation as a core reading capability. Any Imperial Novel translation system must require source rights, attribution, provider terms, cost controls, privacy protections and quality evaluation.
5. **Audio/IP adaptation is not a format checkbox.** Fanqie/Faloo advertise listening or broader adaptation ecosystems. Imperial Novel's current audiobook format remains explicitly catalog-only; no live playback claim is justified.
6. **Localized product depth matters.** Chinese platforms expose different male/female audience paths, update tables and large genre/ranking taxonomies. Localization requires native editorial, metadata and moderation quality, not only translated navigation labels.

No overall competitive score is assigned. The sample is public-homepage reconnaissance, not a complete product or security audit.


## Production smoke-test correction (31 October 2026, 09:31 UTC)

A follow-up Fish browser session independently repeated the health and catalog API requests after the earlier browser audit reported a 502.

| Request | Attempt/result |
|---|---|
| \`GET /api/health\` | HTTP 200, \`ok:true\`, database \`true\`, version \`17.20.0\` |
| \`GET /api/health\` retry after 3 seconds | HTTP 200, \`ok:true\`, database \`true\`, version \`17.20.0\` |
| \`GET /api/novels?limit=10&page=1\` | HTTP 200, one published result |

This means the previous 502 was transient or specific to that browser run. It is **not evidence of a sustained health-endpoint outage**. Two successful retries are also not a full uptime or resilience test.

The latest mobile-first audit again observed the catalog's "Loading catalog…" state during its limited visit window, while an earlier follow-up had observed the title card render after waiting approximately 10 seconds. Taken together, the evidence points to **intermittent or excessive catalog hydration delay**, not a permanently empty catalog. The API returns one result; the UI wait behavior still needs controlled cold/warm testing on real mobile networks.

The live catalog contains one novel and two published chapters. The platform is healthy at the time of the repeat API checks, but content supply remains the most severe competitive gap.

### Route clarification

The visible Discover navigation points to \`/catalog\`. The application also maps \`/discover\` to the catalog template and dispatches it through the Worker. Therefore the earlier report that \`/discover\` is a broken navigation link was too strong; the direct path is supported by the application route map. No navigation defect is confirmed from that observation.

### Verification boundaries

These were public, read-only requests. The browser did not authenticate, submit forms, unlock paid chapters, or alter data. The returned HTTP status and JSON body are verified; response-time measurements were not exposed by this run.


## Fish browser competitive review (31 October 2026)

Read-only public-page comparison of Imperial Novel, WebNovel and WTR-LAB. No sign-in, purchases, form submissions, or data changes.

### Imperial Novel observations
- Public navigation exposes Discover, Formats, Genres, Community, Rankings, OmniPortal and Library, with language, theme, search, notifications and profile controls.
- Hero positioning and search are visible; catalog filters include sort, status, type, rating, genre, tag and language.
- Creator Studio, World Forge and Trend Factory entry points are visible.
- Language selector exposes 14 choices in this browser session. This establishes interface language options only; it does not prove chapter translation quality or RTL correctness.
- The public health URL returned HTTP 200 in this browser session. This run did not expose a version string or detailed JSON payload; earlier direct API tests did return version 17.20.0. Treat health body/version presentation as inconsistent across observations and retest with a direct HTTP client.
- Homepage first-view content density was sparse compared with WebNovel. Some shelves may hydrate after initial load; the browser did not certify their complete load behavior.
- Rankings exist, but public inspection did not establish the depth of time-windowed rankings or separate ranking families for novels, fanfiction and comics.
- The comic/manhwa catalog population and actual creator upload/publishing journey remain unverified.

### Competitor observations
- WebNovel public pages showed dense content shelves, distinct novel/comic/fanfiction discovery, extensive ranking families (including trending, collection, popularity, update, active and fandom), and a separate Inkstone creator entry point.
- WTR-LAB public pages showed a focused novel list, daily ranking, leaderboard, public statistics, changelog, Discord and Patreon links.
- This is a public-surface comparison only. It does not certify competitors' backend, security, payment systems or logged-in workflows.

### Prioritized product gaps
1. Increase useful first-screen content density without sacrificing load performance.
2. Expand rankings only where metrics are real and auditable: trending, update activity, collection/favorites, reader activity, and separate eligible content formats.
3. Add a clear author onboarding/benefits/help journey and explain Creator Studio vs World Forge.
4. Build a public transparency/statistics and help center surface with privacy-safe, real counts.
5. Verify localization end to end, including persistence, translated UI coverage, Arabic/Persian RTL and accessible language switching.
6. Implement and test a genuine comic creator workflow: authorized image upload/storage, ordering, validation, preview, draft/publish, reader rendering, and takedown/rights controls. Do not present catalog format labels as a complete comics publishing system.
7. Keep external community integrations optional and do not add fake Discord/social links before official channels exist.

### Confidence
High confidence for the elements directly visible in the browser; medium/low for dynamically loaded sections; not assessed for authenticated, transactional, administrative, backend and competitor-only account features. No comparative numerical score is assigned until equivalent test scenarios and sample sizes are established.
