# Imperial Novel — Fish Live UX Audit (2026-10-31)

## Scope and evidence

Read-only public-site inspection using TinyFish live browser automation. No sign-in, registration, purchase, form submission, data mutation or access-control bypass.

Primary run: `4f10bdf7-f76f-432e-8245-54c708274063` (completed 2026-10-31 07:55 UTC, 14 steps). The browser run explicitly reported that its time budget expired before all requested routes could be visited. Therefore this is a partial smoke audit, not a complete QA sign-off.

Companion public competitor sample: `3ebb176c-97b5-412c-9d2d-f73596168e4d`. Mobile inspection run: `0faab4bc-9576-4b73-9926-242b48a6292a`; that run could not set a 390×844 viewport and inspected the default browser width. Do not treat it as a verified narrow-device test.

At the time of this report, source `main` is release 17.21.0, while production health checks still reported 17.20.0. The 17.21.0 source changes have not been verified deployed.

## Verified live observations

### Homepage

- Product identity is rendered as **Imperial Novel**, with **READ • CREATE • CONQUER**.
- Public header exposes Discover, Formats, Genres, Community, Rankings, OmniPortal and Library.
- The language selector exposed 14 choices: English, Urdu, Hindi, Simplified Chinese, Traditional Chinese, Japanese, Indonesian, French, Korean, Brazilian Portuguese, Arabic, Spanish, Vietnamese and Persian.
- Homepage sections include format discovery, a trending shelf, a feature deck, a creator CTA and a latest-updates shelf.
- The audit observed The Imperial Ascendant as the visible featured story.
- No black/blank screen, broken cover image or homepage loading failure was observed in that browser session.

### Catalog and Discover

- Initial partial Fish audit: `/catalog` rendered filters but remained at “Loading catalog…” until that run's time budget ended. **Follow-up Fish browser retest (run `6fc1aa4e-2979-427e-be26-3e9d0247b8e5`, completed 2026-10-31) settled successfully, showed “Showing 1 story · Page 1”, and rendered The Imperial Ascendant with no visible loading indicator or error.** This supersedes the earlier incomplete observation as the latest browser state. The run did not expose DevTools console/network timing, so it does not prove the absence of JS errors or provide Core Web Vitals.
- Direct `/discover` returned the branded not-found page in production.
- The header's Discover link pointed to `/catalog`, which explains why clicking the label could work while a direct `/discover` URL failed.
- This is a genuine production route inconsistency, not proof that the source fix is absent. PR #69 added a `/discover` alias and timeout/retry behavior to source release 17.21.0; it is not production-verified until the Worker is deployed and retested.

### Health and latency

- One Fish browser session received HTTP 502 from `/api/health`.
- Separate read-only endpoint checks later received a healthy response reporting version 17.20.0 and a successful database probe.
- Treat this as intermittent/measurement-path variance. Do not declare the health endpoint permanently down or claim a stable latency figure from these samples.
- Fetch-service timing is not browser Core Web Vitals. No reliable LCP, INP, CLS, TTFB or mobile network profile was captured.

### Mobile limitations

A separate run reported that the header collapsed into a hamburger drawer, the language and theme controls were visible, the drawer opened/closed, and no overflow was noticed at the default browser width. However, the run could not set a 390×844 viewport. Therefore narrow-device wrapping, RTL layout, tap targets and bottom navigation remain unverified. No fixed bottom tab bar was observed.

## Competitive sample

The unauthenticated comparison with WebNovel and WTR-LAB found:

- WebNovel publicly exposes multiple editorial shelves, genre/fanfiction paths, Power/Collection/Active ranking families, creator onboarding and app download links.
- WTR-LAB publicly emphasizes translation, search, library/novel/ranking paths and community links.
- Imperial Novel has broader visible format taxonomy and 14-language navigation in this sample, but its discoverable supply was only one published novel with two chapters.
- Imperial Novel's author studio and reader/paywall surfaces are present, but authentication-gated workflows, payments, creator payouts and actual translation quality were not tested.

This sample is not a complete product audit and does not justify an overall competitor score.

## Severity-ranked findings

1. **P0 — Content supply / catalog viability:** production discovery is effectively one published work and two chapters. This is the largest competitive blocker. Do not manufacture catalogue volume or fake engagement.
2. **P1 — Production catalog loading:** the browser audit did not see catalog results before its time budget ended. Backend latency, request waterfall, cache behavior and client-side rendering must be measured separately before assigning a root cause.
3. **P1 — Production `/discover` direct route:** production returned not-found. Source PR #69 adds the alias; deployment and live route verification are still required.
4. **P1 — Health observability:** one 502 and later successful health checks show that a single result is insufficient. Add repeatable monitoring and distinguish Worker health from database readiness.
5. **P2 — Mobile validation:** true 390px viewport and RTL checks remain open. A default-width browser view is not a mobile test.
6. **P2 — Ranking URL consistency:** user-facing “Rankings” routes to `/leaderboard`. This is not inherently broken, but canonical URL and navigation naming should be intentionally documented.
7. **P2 — Feature truthfulness:** audio, screen playback and games are catalog-only. Keep those limitations explicit until licensed providers and complete playback workflows exist.

## Actions already merged into source

- PR #68 restores donation-reference index initialization and its regression coverage.
- PR #69 adds request timeouts, catalog skeletons, explicit retry/error states and a direct `/discover` alias. CI and the bundle dry-run passed.
- Neither PR's success is evidence of a production deployment.

## Required next verification

1. Deploy only after release validation and explicit production change review.
2. Verify `/discover` and `/catalog` directly on the live Worker.
3. Use browser-level timing and repeated cold/warm runs to measure catalog TTFB, API duration, content paint and layout stability.
4. Inspect the complete homepage/catalog request waterfall and database query plans before optimizing blindly.
5. Test 360px, 390px and 430px widths, plus Urdu/Arabic/Persian RTL.
6. Test all routes listed in the original audit goal: `/rankings`, `/community`, `/author`, and `/read/1/1`. These were not all visited in the primary run.

## Graphify and architecture mapping

Graphify's current official README describes it as a Claude Code skill, requiring Claude Code and Python 3.10+, installed via `pip install graphifyy && graphify install`; its `/graphify` workflow creates `graph.json`, `graph.html` and `GRAPH_REPORT.md`. The available execution environment exposes GitHub and browser connectors, not a repository-attached Claude Code session or local Python runtime. Therefore Graphify has **not** been executed and no Graphify output is claimed. A generic GitHub Actions job without the required Claude Code execution/authentication would not honestly run the documented workflow, so no pretend Graphify job is being added. The correct next step is to run the official skill in a repository-capable Claude Code environment, then commit its generated graph/report as versioned architecture evidence. Do not substitute a hand-written diagram and label it Graphify output.

Official reference: https://github.com/Graphify-Labs/graphify



## Follow-up live catalog check (2026-10-31)

A subsequent Fish browser run (`6fc1aa4e-2979-427e-be26-3e9d0247b8e5`) completed the `/catalog` visit and observed a settled page with one story card, The Imperial Ascendant, showing two chapters, 137 views and 5.0 rating. No visible loading state or error remained. Browser DevTools network and console data were not available, and this run did not measure LCP/INP/CLS/TTFB. Direct `/discover` was separately fetched again and still returned the branded 404 on production, while `/api/health` continued to report healthy DB and version 17.20.0. API response extraction reported fetch-service durations around 0.83–1.35 seconds for two `/api/novels` requests; these are tool-side fetch durations, not authoritative Worker TTFB or production performance metrics.
