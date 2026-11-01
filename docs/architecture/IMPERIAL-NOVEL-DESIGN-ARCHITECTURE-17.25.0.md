# Imperial Novel — Design, Information Architecture & Discovery Blueprint

**Product:** Imperial Novel  
**Brand line:** Read • Create • Conquer  
**Release workstream:** 17.25 design foundation  
**Status:** Architecture specification; implementation and production verification remain separate gates.

## 1. Product and experience principles

Imperial Novel is a premium, international fiction and creator platform. It is not a generic anime landing page, crypto dashboard, or decorative concept shell. The experience must make reading, discovery, publishing, and community participation feel like one coherent product.

### Experience principles
1. **Reading first:** content, typography, navigation, and reading continuity outrank decorative effects.
2. **One product, connected journeys:** reader, author, community, and administration share identity, permissions, catalog data, and design language.
3. **Truthful by default:** counts, views, likes, comments, rankings, balances, and publication states come from authoritative server data. Never fabricate activity or counters.
4. **Progressive disclosure:** show the next useful action; keep advanced author, moderation, and admin controls out of ordinary reader paths.
5. **Mobile-first performance:** the small-screen experience is a first-class layout, not a compressed desktop page.
6. **Accessible luxury:** visual richness must never reduce contrast, keyboard access, text scaling, or reduced-motion support.
7. **Rights-aware discovery:** only original, licensed, authorized, public-domain, or otherwise legally permitted works may be published or promoted.

## 2. Brand and visual system

### Visual direction
Modern Smart Imperial Shenhao: contemporary luxury, quiet authority, editorial clarity, and restrained futuristic detail.

### Core palette roles
- **Obsidian Black / Midnight:** primary dark surfaces, immersive reader chrome, and high-contrast navigation.
- **Pure White / Porcelain:** reading surfaces, editorial content, and clean information panels.
- **Imperial Purple:** primary brand identity and selected active states.
- **Sapphire Blue:** links, focus indicators, information, and selected interactive accents.
- **Turquoise / Emerald:** limited positive and success states.
- **Gold:** rare ceremonial accent only; never the dominant interface color.

Color tokens must be semantic (surface, text, border, action, focus, status), not scattered raw hex values. Light and dark themes must both be designed intentionally. Gradients, glow, blur, and animation are optional accents, never substitutes for hierarchy.

### Typography and layout
- Use a highly legible UI sans for navigation and controls, paired with an editorial reading face where it improves long-form comfort.
- Establish a consistent type scale, line-height system, spacing scale, content widths, and responsive breakpoints.
- Keep chapter text at a comfortable measure; provide user-controlled font size, line height, margins, and reading theme.
- Prefer crisp borders and layered surfaces over heavy glass effects.
- Every component needs default, hover, focus-visible, active, disabled, loading, empty, error, and success states where applicable.

### Design acceptance criteria
- No horizontal overflow at 320px viewport width.
- Touch targets generally at least 44×44 CSS px.
- Text and controls meet WCAG 2.2 AA contrast requirements.
- Visible keyboard focus; semantic landmarks and correctly labelled controls.
- Respect prefers-reduced-motion; no flashing or essential information conveyed only by motion.
- Layout remains usable at 200% text zoom.

## 3. Information architecture and sitemap

### Public reader experience
- `/` — Home
- `/discover` — Discover and advanced search
- `/trending` — Trending works and topics
- `/for-you` — Personalized recommendations (only when signed in and enough signals exist)
- `/rankings` — Rankings with transparent metric and time window
- `/novels/:slug` — Novel detail, synopsis, metadata, rights/source label, author, reviews, and chapter list
- `/novels/:slug/read/:chapter` — Reader
- `/genres/:slug` — Genre landing page
- `/tags/:slug` — Topic landing page
- `/authors/:handle` — Public author profile
- `/search` — Search results
- `/community` — Community overview
- `/community/:slug` — Community topic or discussion
- `/about`, `/help`, `/contact`, `/terms`, `/privacy`, `/copyright`, `/content-policy`

### Signed-in reader
- `/library` — Reading library and collections
- `/history` — Reading history and progress
- `/bookmarks` — Saved chapters and works
- `/notifications` — Account notifications
- `/account` — Profile, security, privacy, language, and preferences
- `/wallet` — Ticket balance and transaction history

### Creator workspace
- `/studio` — Author Studio overview
- `/studio/works` — Owned works and publication status
- `/studio/works/new` — Create a work
- `/studio/works/:id` — Work settings and metadata
- `/studio/works/:id/chapters` — Chapter management
- `/studio/works/:id/chapters/:chapterId/edit` — Chapter editor
- `/studio/analytics` — Server-derived readership and engagement analytics
- `/studio/earnings` — Earnings and payout records, if enabled
- `/studio/rights` — Rights declarations and evidence workflow

### Administration (server-authorized)
- `/admin` — Admin overview
- `/admin/catalog` — Catalog stewardship and duplicate review
- `/admin/reports` — Reports and moderation queue
- `/admin/rights` — Rights and takedown review
- `/admin/payments` — Ticket and manual payment verification
- `/admin/users` — User and role management
- `/admin/security` — Sessions, audit events, abuse signals
- `/admin/providers` — Provider health and connector approvals
- `/admin/operations` — Operational health and release status

Every route must have an explicit access policy, canonical URL policy, metadata policy, loading state, empty state, error state, and mobile layout.

## 4. Navigation model

### Desktop primary navigation
Home · Discover · Trending · For You · Rankings · Library · Community · Author Studio · More

### Mobile primary navigation
Home · Discover · Library · Create · Community · Profile

The mobile Create item opens the creator workspace only for authorized accounts; otherwise it presents a clear sign-in or author-onboarding route. Admin links never appear in public navigation. Active states must be clear without relying on color alone.

## 5. Core page composition

### Home
1. Compact global header and search.
2. Editorial hero based on real featured catalog entries, not a fake promotional work.
3. Continue reading for signed-in users.
4. Trending and newly updated works, each with a disclosed time window and server-derived metrics.
5. Genre/topic discovery.
6. Author/community discovery.
7. Footer with policy, support, and language controls.

### Discover
- Search by title, author, genre, tags, language, status, and format.
- Filters are URL-addressable and shareable.
- Sorting labels explain the metric and time range.
- Empty results offer useful filter reset and spelling alternatives.

### Novel detail
- Cover, title, author, synopsis, genres, language, content notices, rights/source label, publication status, and update cadence.
- Start/continue reading and add-to-library actions.
- Rating/review summary only when backed by eligible records.
- Chapter list with publication timestamps and access state.
- No invented ratings, views, followers, or chapter counts.

### Reader
- Distraction-reduced chapter canvas with previous/next navigation.
- Themes: Light, Dark, Midnight, Sepia, Imperial, Cosmic.
- Font family/size, line height, content width, margins, and reading progress controls.
- Bookmark, report, and permitted engagement actions.
- Progress sync must tolerate offline/intermittent mobile connections and resolve conflicts safely.
- Monetization must not interrupt or corrupt chapter text; access rules are explicit before purchase.

### Author Studio
- Clear publishing checklist and draft/published states.
- Autosave with visible save status and recovery.
- Preview before publish; validation for metadata, content, rights, and chapter order.
- Ownership and all write permissions enforced on the server, never only in the UI.
- Analytics explain definitions, time windows, and data freshness.

## 6. Shared application architecture

Use a domain-oriented structure with clear boundaries:
- **Identity & access:** authentication, sessions, roles, ownership, and authorization.
- **Catalog:** works, chapters, authors, genres, tags, languages, formats, and rights metadata.
- **Reader:** chapter delivery, progress, bookmarks, history, and preferences.
- **Engagement:** likes, comments, reviews, follows, and notifications.
- **Creator:** drafts, publishing workflow, analytics, and earnings.
- **Commerce:** ticket ledger, payment intents, manual verification, entitlements, and audit trail.
- **Community & moderation:** discussions, reports, policy enforcement, and appeals.
- **Discovery:** search, rankings, recommendation inputs, and trend aggregation.
- **Integrations:** provider registry, authorization scopes, health, quotas, and connector audit.
- **Administration & observability:** privileged operations, audit events, metrics, and incident response.

Keep UI components presentational where practical. Domain operations belong behind typed service/API boundaries. Validate all untrusted input at the server boundary. Use database constraints and transactions for invariants such as ownership, payment approval, entitlement issuance, and unique engagement records.

## 7. Real-time information contract

Real-time must mean fresh, authoritative data, not animated numbers.

For each metric, define:
- source of truth;
- update event or polling interval;
- freshness timestamp;
- aggregation window;
- deduplication and anti-abuse rule;
- cache lifetime and invalidation;
- behavior when stale or unavailable.

Views, likes, comments, reviews, follows, reading progress, notifications, and payment states must be persisted and permission-checked server-side. Optimistic UI may be used only with rollback on failure. Show stale/offline indicators when the client cannot confirm freshness. Do not expose private reading activity or personal data through public counters.

## 8. SEO, AEO, and GEO

### Technical SEO
- Server-render or statically render indexable public pages where the application architecture permits.
- Unique title, description, canonical URL, language, and Open Graph metadata per public work/author/genre page.
- XML sitemap index split by content type and updated from published records.
- Robots policy excludes account, studio, admin, private, draft, and transactional routes.
- Correct status codes, redirects, pagination/canonical handling, and noindex for thin or private pages.
- Structured data only when page content genuinely satisfies the relevant schema; never fabricate ratings or reviews.
- Stable, human-readable slugs and internal links.

### AEO and GEO
- Write concise, factual summaries for public works, authors, genres, and help pages.
- Use clear headings, direct definitions, and machine-readable metadata.
- Publish transparent platform/about/editorial/policy pages that explain source, rights, and update practices.
- Keep entity names and descriptions consistent across pages.
- Make crawl access deliberate; do not expose private content, user data, drafts, or unauthorized provider content for discoverability.

## 9. Localization and international readiness

Plan for English, Urdu, Arabic, Simplified and Traditional Chinese, Spanish, French, Brazilian Portuguese, Hindi, Indonesian, Japanese, and Korean. Translation coverage must be measured per route and component, not inferred from the presence of dictionary files. Support locale-aware dates/numbers, language metadata, font fallbacks, text expansion, and RTL layout for Urdu and Arabic. Keep language preference separate from content language preference.

## 10. Performance and resilience budgets

Initial product budgets (to be validated against real devices and field data):
- LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 at the 75th percentile.
- Avoid shipping the full creator/admin application bundle to anonymous readers.
- Responsive image sizes, modern formats, lazy loading below the fold, and explicit dimensions.
- Cache public catalog data with clear invalidation; do not cache private or financial responses publicly.
- Paginate large lists and use database indexes for real query patterns.
- Provide skeletons only where layout is stable; avoid endless spinners and blank/black screens.
- Capture client errors, API latency, database errors, and release health without logging secrets or sensitive content.

## 11. Trust, safety, and monetization boundaries

- Rights review precedes publication and any external content ingestion.
- OmniPortal/provider connectors remain disabled until authorization, terms, and rights are reviewed.
- Trend Factory uses metadata/RSS/API-first discovery; never ingest or republish unlicensed chapter bodies.
- EasyPaisa/manual payments use pending, approved, and rejected states; no ticket or paid entitlement is granted before verified approval.
- Ledger operations are idempotent, auditable, and transactionally consistent.
- Monetag is the only currently requested third-party ad network.
- Admin agents and automated moderation may recommend actions, but privileged destructive actions require policy checks and auditable human authorization.

## 12. Delivery sequence and definition of done

### Stage A — Design foundation
- Approve semantic tokens, typography, spacing, breakpoints, component states, and accessibility rules.
- Produce responsive page specifications for Home, Discover, Novel Detail, Reader, Studio, and Community.
- Confirm route map, navigation, and content hierarchy.
- Review against real mobile screenshots and keyboard/accessibility checks.

### Stage B — Core product journeys
- Verify browse → novel detail → read → save/progress.
- Verify sign-in → library/history → notifications.
- Verify author onboarding → draft → preview → rights review → publish.

### Stage C — Live data and operations
- Verify server-derived engagement metrics and freshness.
- Verify moderation, reporting, payment ledger, and admin audit.
- Verify provider permissions and disabled-by-default integration policy.

### Stage D — Discoverability and release
- Verify SEO/AEO/GEO metadata, sitemap, robots, structured data, localization, and performance.
- Run dependency-backed tests, typecheck, lint, build, migration rehearsal, security review, and staging smoke tests.
- Release only after a reviewed rollback plan and production compatibility verification.

A stage is complete only when its implementation exists, automated checks pass, manual acceptance checks pass on mobile and desktop, and the result is verified in the intended environment. This document alone does not certify implementation or production readiness.
