# WTR-Lab competitor gap register

**Baseline reviewed:** `main` at `c9f896f8b7a898c8838886091a533e28ae1892e1` (source) and package version `17.23.0` at the time of review.  
**Purpose:** turn public WTR-Lab product research into an honest, implementation-aware Imperial Novel roadmap.  
**Rule:** source presence is not proof of a complete user journey; a draft PR is not a production feature; a route returning HTTP 200 is not proof that its underlying workflow works.

## Current Imperial Novel capabilities verified in source

- Catalog API supports query, genre, tag, status, format/kind, language, author, minimum rating, sorting and pagination.
- Reader supports chapter navigation, bookmarks, reading history, rating, comments, comment likes/reports and novel reactions.
- Library and following APIs are owner-scoped; notifications are owner-scoped.
- Reader requests have a weekly free allowance and voting; the request workflow uses a supported-source registry.
- Leaderboards, a ratings-derived tier display, random discovery and personalized recommendations exist.
- Author applications, novel/chapter authoring endpoints, publication review, author analytics and AI-assisted author project endpoints exist.
- OmniPortal is rights-gated; imports are metadata-only by default and connectors require authorization.
- Rights-aware publication, admin moderation routes, sitemap/SEO foundations and multiple security controls exist.

## WTR-Lab features: gap assessment

| WTR-Lab capability | Imperial Novel baseline | Decision |
|---|---|---|
| Advanced multi-field novel finder | Catalog filters exist; multi-term relevance search is being developed on an unmerged branch | Complete and test search before expanding filters |
| Reader library, history, bookmarks | Present in baseline; bookmark intent/progress/accessibility improvements are in stacked unmerged PRs | Finish the reader PR chain and validate migrations |
| Personal glossary and term replacement | No equivalent end-to-end feature verified in baseline | High-priority reader feature; per-user, per-novel scope |
| Public reading folders/collections | No collection/folder API or UI verified | Build after schema, privacy and moderation design |
| Community polls | No poll API or UI verified | Build with eligibility, anti-abuse and close-time rules |
| Tier-list tournaments | Existing tier page derives S/A/B/C from ratings; no user-submitted tournament workflow verified | Keep distinct; implement real submissions and scoring only after rules are specified |
| Awards and creator tipping | No reader award workflow verified; existing donations are not equivalent | Defer until accounting, payout and fraud controls exist |
| Reader XP/levels/streaks | No complete progression ledger verified | Defer until anti-farming rules and value proposition exist |
| Community moderation | Novel comments, reports and admin moderation routes exist | Extend carefully; do not duplicate report systems |
| Reader novel requests and voting | Present | Improve request history, clear statuses and transparent pricing |
| Rankings | Weekly/monthly/all-time API exists; period correctness work is in an unmerged PR | Validate time-window semantics and data definitions |
| Translation and TTS | Browser narration exists in earlier work; broad user-controlled translation/glossary parity not verified | Prefer on-device/free controls; never expose provider secrets |

## Release-aware open work observed

The following PRs were open at the time of this review. Their presence must not be counted as merged or live:

- #152 explicit bookmark intent and owner-scoped bookmark removal.
- #153 synchronized reading progress.
- #154 reader accessibility improvements.
- #155 library bookmark removal and progress display.
- #147 period-correct leaderboard calculations (reported non-mergeable/outdated at inspection).
- #148 private reader request history.
- #149 improved catalog search and recommendations.
- #145 homepage localization.
- #146 homepage performance and lifecycle.
- #156 server-rendered homepage fallback.

PR #152–#155 form a dependency chain. Merge/rebase and validation must proceed in dependency order, not by selecting the newest PR first. PR #148 depends on the leaderboard branch. The source validation workflow passing on a head commit does not mean a PR has been merged or deployed.

## Recommended implementation sequence

1. **Release hygiene:** reconcile stacked reader and catalog PRs, validate every migration and regression test, then merge only when branch ancestry and checks are clean.
2. **Discovery:** complete multi-term search, filter combinations, pagination stability, period-correct rankings and accurate empty states.
3. **Reader foundation:** progress, bookmark intent, reading preferences, glossary/term replacement, optional narration and accessible chapter navigation.
4. **Community v1:** public/private collections first, then polls. Add owner isolation, visibility controls, reporting, moderation, rate limits and deletion behavior from day one.
5. **Community v2:** reader-submitted tier tournaments with published eligibility, scoring, deadlines, tie handling and auditability.
6. **Creator economy:** awards only after an auditable ledger, explicit fees, refunds, payout readiness and jurisdiction/payment review. Do not imply donations equal creator earnings.
7. **Quality and release:** mobile viewport QA, RTL, all supported locales, accessibility, performance, SEO, D1 migration parity, backup/restore and production smoke tests.

## Non-negotiable safeguards

- Never ingest chapter bodies from external sites without documented rights.
- Never enable OmniPortal connectors without verified authorization and terms.
- Never display fabricated ratings, review counts, reading counts, earnings or rankings.
- Keep all user-owned folders, polls, reading data, requests and notifications owner-scoped.
- Use server-side authorization for every mutation; hiding a button is not access control.
- Treat Crowns as a ledgered platform balance, not creator income or real-money value unless a compliant payout system is explicitly built.
- Keep payment webhooks disabled until a real provider, signature verification, idempotency and reconciliation are implemented and tested.
- A deployment is complete only after the production Worker and D1 schema are verified, not merely after CI or a dry run.

## Evidence and limitations

This register is based on source inspection of the repository's `main` branch and public WTR-Lab pages/documentation. It is not a live authenticated user test. Private account flows, payment settlement, user-specific data and production D1 contents require authorized testing. "Not verified" means no complete implementation was found in the reviewed baseline, not that every possible branch lacks it.
