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


## Production browser smoke-test addendum (2026-10-31)

A read-only TinyFish browser session completed against production. This is an observed smoke test, not a full QA certification.

| Flow | Result | Finding |
|---|---|---|
| Homepage | Pass | Hero/navigation render; dynamic story shelves remained in skeleton/loading state |
| Discover `/catalog` | Partial | Search/filter interface renders, but catalog stayed on “Loading catalog…” with no cards |
| Novel `/novel/1` | Pass | The Imperial Ascendant, cover, author, rating and two chapters displayed |
| Reader `/read/1/1` | Pass | Chapter text, font-size controls, bookmark, theme toggle, progress and next/chapter navigation displayed |
| Locked chapter | Pass (presentation only) | Chapter 2 showed as locked for 1 Imperial Crown; purchase/settlement was not tested |
| Community | Pass (surface only) | Leaderboard, tier list, vote and random-novel entry points rendered; trending story displayed |
| Trend Factory | Pass (surface only) | Rights-first metadata discovery page rendered |

### Additional confirmed weaknesses

- **Catalog hydration defect or data-fetch issue:** the public catalog API returned one novel, but the live catalog UI remained in a loading state and did not render that result. This is a P0/P1 user-facing defect until its cause is isolated. Test API success, client parsing, filtering, empty/error handling and JS console/network errors.
- **Homepage shelf data gap:** story shelf skeletons remained visible in the browser session despite the published novel existing. Check the shelf endpoints, client hydration and timeout/error states.
- **Test-quality content:** the only published first chapter currently displays “Test it / Test 2”. Replace with a properly edited, authorized production chapter before public acquisition campaigns. Do not inflate chapter count with filler.
- **Paywall flow not certified:** the browser only observed the locked state. No purchase, unlock, refund, balance or ledger flow was executed in this smoke test.

### Interpretation

A route returning HTML or a page title is not enough to pass. The catalog API and rendered catalog disagree, so the catalog is not considered functionally passed. Reader rendering passed for the one sample chapter, but content quality and payment workflows remain unverified. Repeat this test after fixes and on a low-end Android device/network profile.
