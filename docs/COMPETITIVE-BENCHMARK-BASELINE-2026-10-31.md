# Imperial Novel: Continuous Competitive Benchmark

**Baseline date:** 2026-10-31  
**Production inspected:** https://god-emperornovel.sikandershehzadkhan.workers.dev/  
**Source inspected:** `main`, release `17.20.0`  
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

Search results describe a reading-assistance tool for real-time machine translation of novels. The site fetch was bot-blocked in this reconnaissance, so current live features were **not verified**.

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

Direct fetch was unreachable in this run. Its current live experience remains **not verified** and must be revisited through accessible official pages/apps. Do not substitute third-party descriptions for a live product audit.

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
