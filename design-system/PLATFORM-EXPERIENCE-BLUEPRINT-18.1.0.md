# Imperial Novel Complete Platform Experience Blueprint 18.1.0

**Product:** Imperial Novel  
**Motto:** Read • Create • Conquer  
**Status:** Canonical full-platform design blueprint. It defines the target experience and acceptance gates; it does not claim all screens are implemented or visually verified.  
**Parent foundation:** Design System 18.0.0 and its six-theme semantic token contract.

## 1. Product experience contract

Imperial Novel is an editorial-first storytelling platform. Its visual character is modern imperial authority with quiet luxury: precise, confident, immersive, and international. Reading and writing content outrank decoration.

- Brand anchors: Pure White #FFFFFF, Obsidian #0B1215, Imperial Purple #6A0DAD, Sapphire Blue #0F52BA.
- The 60/20/12/8 composition is a broad identity guide, not a rigid per-screen quota.
- The black-sun / empty-throne crest and restrained celestial geometry are original brand signatures.
- No gold-heavy chrome, rainbow gradients, casino styling, generic anime-template decoration, permanent blur, or copied competitor assets.
- Never fabricate ratings, activity, reader counts, creator credentials, revenue, availability, or social proof.
- Existing content, permissions, route identity, account boundaries, and financial state must remain intact through design migrations.

## 2. Six global themes and reader comfort

Global themes: Light, Dark, Midnight, Sepia, Imperial, Cosmic. Theme names and semantic intent are stable. Theme-specific values live in the canonical token stylesheet, never in page-local hard-coded palettes.

Reader comfort direction:
- Light canvas uses a soft warm white; chapter paper may be slightly warmer than surrounding UI.
- Dark and Midnight use softened near-white text, never pure white as long-form body copy.
- Imperial uses a deep plum environment with readable lavender-tinted text.
- Cosmic uses deep blue-black surfaces and cool, softened text.
- Sepia uses warm paper and brown-black ink.
- Saturated purple and sapphire are reserved for actions, links, focus, and selected states, not paragraph text.
- Reader preferences are independent from global site theme: font family, font size, line height, reading width, paragraph spacing, page background, brightness, warm-light filter, and reading progress.
- Reader defaults: 18px equivalent body size, 1.7–1.8 line-height, and a 65–75 character measure. User settings override defaults.
- Brightness and warm-light controls adjust the reading surface only; do not claim to control physical device brightness.
- Test actual foreground/background pairs for WCAG 2.2 AA. Palette-level checks do not certify every rendered state.

## 3. Information architecture and global navigation

### Desktop shell
- Brand/crest and wordmark at the start of the header.
- Primary destinations: Home, Discover, Library, Create, Community.
- Search is globally discoverable and keyboard accessible.
- Account menu contains profile, settings, notifications, wallet/tickets, help, and sign-out according to authentication state.
- Admin entry is visible only to authorized roles and never exposed as public navigation.
- Header remains compact; sticky behavior must not consume excessive reading viewport.

### Mobile shell
- Five primary destinations: Home, Discover, Library, Create, Community.
- Profile and secondary destinations live in a clearly labelled account surface.
- Navigation targets are at least 44px; active state uses shape/label as well as colour.
- Bottom navigation respects safe areas and must not cover reader controls, forms, or content.
- Drawer focus is managed; Escape closes it and focus returns to its trigger.

### Route ownership
Preserve the audited route registry and give every page a unique canonical URL. Static aliases may resolve to the same canonical destination, but must not create duplicate indexable content. Dynamic novel, chapter, author, fandom, and format routes have deterministic ownership and must not leak private workspaces.

## 4. Global layout and component system

### Layout primitives
- App shell: header, main landmark, optional contextual navigation, footer, mobile navigation.
- Content container: responsive max-width with consistent inline gutters.
- Editorial column: narrow readable measure and generous vertical rhythm.
- Discovery grid: adaptive card columns with stable image ratios.
- Workspace layout: sidebar + content on wide screens; stacked panels/drawers on narrow screens.
- Data workspace: responsive filters, summary region, and table/list switch where useful.
- Overlay layer: menus, dialogs, drawers, toast region with explicit stacking and focus behavior.

### Shared components
Buttons (primary, secondary, quiet, danger), links, icon buttons, fields, selects, textareas, checkboxes, switches, tabs, cards, story cards, author cards, avatars, badges, ratings, progress bars, pagination, breadcrumbs, chips, filters, sort controls, tables, dialogs, drawers, tooltips, alerts, toasts, skeletons, empty states, error states, confirmation panels, upload zones, chapter rows, comment threads, and reader toolbar.

Every component specifies default, hover, focus-visible, pressed, disabled, loading, success, error, empty, and responsive states as applicable. Native semantics and keyboard behavior belong to feature implementation, not CSS alone.

## 5. Page-family design specifications

### A. Home
Purpose: orient new visitors, return readers to their next chapter, and surface real discovery.
- Hero: concise brand promise, one primary discovery action, one creator action; no fake counters.
- Continue reading shelf only when real user history exists.
- Discovery sections: trending, latest updates, curated selections only when real, genres/formats, and creator highlights.
- Story cards show cover, title, author, format, genre/tags, truthful status, chapter/update metadata, and rating only when enough real votes exist.
- Design loading, no-content, partial-data, offline, and API failure states.
- Avoid repeating the same novel across shelves unless the shelf context makes the repeat useful.

### B. Discover, Catalog, Search, Genres, Tags, Formats, Trending
- Search-first discovery with query persistence, accessible filters, sort, and clear-filter action.
- Filters: format, genre, tags, language, completion/status, rating range, and supported metadata only.
- Results grid/list adapts to screen size; cards preserve consistent cover ratio and title readability.
- Genre/tag/format landing pages have unique editorial intro, filter context, canonical metadata, and crawlable pagination.
- Trending and ranking pages disclose time window and ranking basis. Never invent live activity.
- Empty results recommend adjacent filters without silently changing the query.

### C. Novel detail and chapter directory
- Cover and identity block: title, author, format, language, status, rating (whole-number 1–10 where available), and content notices.
- Primary actions: Read/Continue, Library/Follow, and supported request/report actions.
- Synopsis, metadata, tags, rights/attribution, author profile, table of contents, update history, ratings and comments are clearly separated.
- Chapter directory supports search/filter/sort and locked/free state disclosure without exposing restricted chapter content.
- Rights provenance and content notices are visible but do not overwhelm the story summary.

### D. Text reader and comic reader
- Reading canvas is visually isolated from site chrome.
- Toolbar: chapter navigation, table of contents, typography/preferences, theme, progress, report, and supported bookmark action.
- Text reader: stable line measure, paragraph rhythm, chapter title/author metadata, previous/next chapter, progress restore, and explicit bookmark state.
- Comic reader: vertical or page modes where supported, image loading placeholders, page sequence integrity, zoom/pan controls, next/previous chapter, and low-bandwidth behavior.
- Reader settings persist independently; changing global theme does not unexpectedly overwrite chapter preferences.
- Loading, missing chapter, locked chapter, offline, removed/rights-restricted chapter, and network retry states are explicit.
- No intrusive sticky banners or unrelated recommendations inside the reading measure.

### E. Library, History, Following, Requests, Tickets, Notifications
- Library: saved/followed works, progress, collections where supported, empty state, and bulk actions with confirmation.
- History: chronological reading activity, resume action, remove individual item, and clear-history confirmation.
- Following: followed authors/series and notification preferences.
- Requests: submission status, clear expectations, duplicate prevention, and truthful moderation state.
- Tickets/wallet: balance, ledger, transaction detail, purchase/earn/spend states, receipts, and support path. Financial actions use server-confirmed states only.
- Notifications: unread/read, category filters, clear-all confirmation, and accessible announcement behavior.

### F. Authentication, Account, Settings, Privacy
- Login/register/recovery screens use the same shell and form components, with clear error and loading states.
- Account page separates identity, profile, security, sessions, and creator status.
- Settings are grouped by reading, appearance, language, accessibility, notifications, and privacy.
- Preference controls explain whether changes save immediately or require Save.
- Account deletion, export, ownership transfer, and sensitive security changes require explicit confirmation and reauthentication where policy requires.
- Private data is never shown in public profile templates or another user's workspace.

### G. Author application and Author Studio
- Author onboarding explains eligibility, rights obligations, review status, and what happens next.
- Studio overview: drafts, published works, chapter activity, review tasks, and actionable next steps. Metrics appear only when sourced.
- Work manager: create/edit metadata, covers, synopsis, genres, tags, format, language, rights declaration, and visibility.
- Chapter editor: autosave state, word count, draft/preview/publish flow, chapter ordering, revision safeguards, and recoverable failure.
- Publishing workflow distinguishes draft, pending review, published, rejected, and withdrawn.
- Creator analytics identify date ranges and definitions; no fabricated revenue or readership.
- Rights and licensing controls remain visible at upload and publication points.

### H. Public author profile
- Author identity, biography, supported links, published works, update activity, and follow action.
- Privacy settings govern which fields appear.
- No invented verification marks, follower counts, or creator achievements.

### I. Community, Comments, Ratings, Leaderboard, Tier Lists, Voting
- Community home prioritizes readable discussions and useful topic navigation.
- Discussion threads have clear author/time context, reply hierarchy, pagination, report, and supported mute/block controls.
- Ratings use the governed whole-number 1–10 scale; show vote count and aggregate only when available and meaningful.
- Leaderboards disclose calculation and period; tie behavior is deterministic.
- Tier lists and voting disclose community participation rules and moderation state.
- Moderated, deleted, locked, and unavailable states are visually distinct and do not expose removed content.

### J. Trend Factory and OmniPortal
- Trend Factory is a research/workflow workspace, not a chapter ingestion tool. It may organize user-provided topic metadata and authorized public signals; never ingest or reproduce chapter bodies.
- Each signal includes source, timestamp, confidence/limitations, and user action. Do not label stale information as real-time.
- OmniPortal remains disabled until rights review and source authorization are approved. Its disabled state explains why and does not imply import capability is active.
- External-source previews distinguish metadata from licensed content.

### K. Admin and Trust & Safety
- Dedicated admin shell with clear role/permission context and no public-facing navigation leakage.
- Overview, users, author applications, publishing review, taxonomy, community moderation, reports, requests, donations, connectors/authorization, and audit logs are separate work areas.
- Destructive and financial actions require confirmation, clear target identity, reason capture where appropriate, and server-side authorization.
- Admin tables support mobile containment or stacked detail views; never shrink text to unreadable sizes.
- Every action shows pending/success/failure based on server response. No client-only authority.
- Security-sensitive records and user data remain scoped to least privilege.

### L. Legal, Help, Not Found, Offline and System States
- Privacy, Terms, Copyright/Rights, help, and policy pages use editorial layouts with readable measure and clear headings.
- 404, 403, 429, 500, maintenance, and offline states share a calm recovery pattern.
- System states explain what happened, what remains safe, and the next available action without exposing internals or secrets.

## 6. Responsive behavior

Test widths: 360px, 390px, 768px, 1024px, 1280px, and 1440px.
- 360/390: one-column content, compact header, bottom navigation, stacked filters, no horizontal page overflow.
- 768: two-column discovery where cover ratio and text remain readable; workspace sidebars may collapse.
- 1024: tablet workspace layouts and compact desktop navigation.
- 1280/1440: full content hierarchy with deliberate max-width; do not stretch prose across the screen.
- Tables may scroll within their own region; page body must not acquire accidental horizontal overflow.
- Check safe-area insets, keyboard-open forms, zoom to 200%, landscape phone, and reduced viewport height.

## 7. Localization, RTL and accessibility

- Interface localization supports the existing 14 locales; content language is independent of interface language.
- Urdu, Arabic, and Persian chapter text may be RTL independently of UI locale.
- Use logical CSS properties, dir semantics, and locale-aware number/date formatting.
- Do not mirror logos, media, or inherently directional icons indiscriminately.
- WCAG 2.2 AA target: semantic landmarks, labels, contrast, visible focus, keyboard operation, screen-reader names, error association, reduced motion, and touch target sizing.
- Test dialogs, menus, tabs, drawers, reader toolbar, filters, editor, upload, and admin tables with keyboard and screen reader.

## 8. Motion, imagery and visual effects

- Motion communicates state or hierarchy; it never blocks reading or task completion.
- Transitions are short and subtle. Honor prefers-reduced-motion.
- Glass effects are optional decoration, never the only surface boundary or text backdrop; provide solid fallback on low-end devices.
- Covers and artwork use consistent aspect ratios, reserved dimensions, lazy loading below the fold, and meaningful alt text.
- Use original/licensed/authorized/public-domain assets only. Do not scrape competitor art or use copyrighted story covers without rights.

## 9. Design migration sequence

Migrate and validate in this order, using one canonical token and component system:
1. Global shell, navigation, footer, overlays, and theme preference restoration.
2. Home and shared editorial/story-card patterns.
3. Discover/catalog/search/genre/tag/format/trending/ranking.
4. Novel detail and chapter directory.
5. Text reader and comic reader.
6. Library/history/following/requests/tickets/notifications.
7. Authentication/account/settings/privacy.
8. Author application, Author Studio, editor, and public author profile.
9. Community, comments, ratings, voting, leaderboards, tier lists.
10. Trend Factory and rights-gated OmniPortal.
11. Admin and Trust & Safety.
12. Legal, help, error, offline, and system pages.
13. Cross-route consistency, performance, accessibility, RTL, and visual regression.

Do not solve old styling conflicts by adding another override layer. For each page family, identify obsolete competing selectors, migrate markup to canonical components, remove dead styles only after confirming no route still depends on them, and preserve behavior with regression tests.

## 10. Acceptance gates and truthful status

A page family is design-complete only when all are true:
- Route and page inventory is complete.
- Desktop and mobile high-fidelity layouts are specified and implemented.
- Key interaction states are covered.
- The family uses canonical semantic tokens and shared components.
- No conflicting legacy visual system controls the same component.
- 360px/390px mobile, tablet, and desktop layouts pass visual inspection.
- Keyboard, screen-reader, contrast, reduced-motion, and RTL checks pass.
- Existing behavior, permissions, data ownership, and API contracts remain intact.
- No fabricated content or metrics appear.
- Screenshots or browser evidence exist for representative routes and states.

Overall platform design is not complete until every page family above passes. Token documentation, CSS availability, or source-level static tests alone do not satisfy this gate. No production deployment is implied by this blueprint.


## 11. Implementation checkpoint: page-family migration

This checkpoint records source changes on the isolated design branch. It is not a production release or a declaration that the acceptance gates in section 10 have passed.

### Implemented in PR #314
- Global shell: responsive navigation, account/theme/language entry points, keyboard-operable secondary drawer, footer, safe-area and reduced-motion handling.
- Home: editorial hero and search, six format entry points, live catalog shelves, creator/community/research pathways, and reading-comfort entry point.
- Catalog: search, status/format/rating/genre/tag/language filters, removable filter chips, server-backed results, pagination and empty/error states.
- Novel detail: canonical editorial hero, taxonomy links, rights/status information, story metrics, library/follow/share actions, latest chapters, rating/reaction/discussion areas.
- Chapter directory: archive header, chapter list, start-reading action, batch-unlock entry point, and return navigation.
- Reader: isolated canonical component class system, six independent reading palettes, adjustable text size/line spacing/measure, chapter drawer, bookmark, progress, keyboard navigation and existing unlock/history behavior.

### Validation state
- Source-level contract scripts exist for shell, homepage, catalog, and the novel/chapter/reader family. They are included in the package build chain.
- The latest commit has a successful Graphify architecture-map workflow run. No build/test workflow result is currently reported for the new contract scripts.
- Browser/device screenshots, assistive-technology review, RTL visual review, and cross-route regression testing remain outstanding.
- The reader markup no longer uses its retired reader component class names; the canonical reader styling is scoped to the new `.in-reader-*` components. Other page families still require the same legacy-style dependency audit and migration.
- No database, authorization, payment, or production deployment changes are included.

Next migration family: Library, history, following, requests, Crown Vault, and notifications.


### Additional page-family migration: personal library
- Rebuilt the signed-in library and following views with a distinct account collection layout.
- Added continue-reading cards, saved-story cards, chapter bookmarks, collection counts, empty states, and responsive shelves.
- Following mode now renders the fetched follows collection rather than repeating the saved-library collection.
- Preserved the existing library, history, bookmarks, follows, and follow-toggle API interactions.
- Replaced decimal rating formatting in this view with the platform's shared rating formatter.
- Added and wired a library/following design contract test.

- Rebuilt the standalone reading-history page with chronological return-to-chapter rows, author/title context, cover art, responsive layout, and an explicit empty/error state.
- Added reading-history design contract coverage to the existing library page-family test.

- Added the standalone reading-history route and a quiet canonical boot/recovery state. The retired “Your next world is loading / Preparing your storyverse” placeholder copy is removed from the boot path.
- The reader markup has been migrated off its former `.readerPage`, `.readerArticle`, and related legacy class family. The new reader components are isolated under `.in-reader-*` selectors, while stable control IDs and local reading-progress keys are preserved.
- The shell contract test now also guards the boot and recovery states against reintroducing the retired placeholder.

### Source contract audit
A connector-side audit evaluated 130 source assertions against the current branch for navigation, boot states, homepage, catalog, novel detail, chapter archive, reader, library, following, history, responsive selectors, preserved API hooks, and build-script wiring. All 130 passed. This was a source-content audit, not execution of the repository's Node test scripts or full `npm run build`; those remain pending in CI. No browser/device screenshots have been captured yet.

### Account tools migration: Crown Vault and request desk
- Rebuilt the Crown Vault as a balance-and-ledger view with server-provided balance, net flow, transaction reasons, timestamps, references, credit/debit direction, and truthful empty/error states. No purchase/top-up flow was invented.
- Rebuilt the story request desk with the server-reported weekly allowance, URL validation, submission feedback, disabled pending state, and post-submit allowance refresh.
- Request cost is shown only when the server returns it; missing cost is not silently represented as zero.
- Added source contract coverage for both account tools and wired it into the build chain.

### Notifications inbox migration
- Replaced the generic discovery-page wrapper with a dedicated notification inbox.
- Displays server-provided title, body, timestamp, read/unread state, and unread count; includes a mark-all-read action with pending/disabled handling and explicit empty/error states.
- Added a responsive notification design contract test and build-chain entry.

### Refreshed source-content audit
The combined source-content audit now covers 170 assertions across the migrated page families, including notifications. All 170 passed. These checks were evaluated against fetched branch source in the connector runtime; they are not a substitute for running `npm run build`, the Node contract scripts, or browser/device QA.

### Authentication and account center migration
- Rebuilt sign-in and registration layouts with distinct entry-state messaging, semantic field labels, email/username/password autocomplete, minimum password length, confirm-password validation, pending feedback, and accessible status messaging.
- Rebuilt the authenticated account center with profile identity, server-sourced Crown/history/following/unlock metrics, account navigation, sign-out action, and recommendation shelf.
- Preserved the existing authentication, profile, logout, and recommendation API calls; no account or permission policy changes were made.
- Added authentication/account design contract coverage and build-chain wiring.

### Settings and reading preferences migration
- Rebuilt the settings experience into distinct appearance/reader, accessibility/comfort, data portability, and account-shortcut sections.
- Preserved all existing control IDs, six theme choices, font-size/line-height/column-width preferences, reduced-motion/high-contrast/compact-card toggles, preference export/reset, and device-local reading-helper clearing.
- Kept the boundary explicit: clearing local reading helpers does not delete server account data.
- Added a settings design contract test and build-chain entry.

### Data-contract refinement and refreshed audit
- Verified the account collection endpoints against their server response projections: library/history/bookmarks use `novel_id`, while followed novel projections expose `id`. The following renderer now normalizes both shapes before constructing story links or unfollow actions.
- Corrected chapter-row styling selectors to target the actual `.chapter` markup emitted by the shared chapter-row renderer.
- The combined connector-side source-content audit now covers 244 assertions across the migrated families and these contract refinements; all 244 passed. Repository Node scripts, npm build, browser QA, and visual/accessibility checks are still not claimed as run.

### Creator workspace design migration
- Added an isolated Author Studio page scope using the shared page wrapper, without rewriting the mature author workflow markup or changing its API behavior.
- Added responsive creator workspace styling for story creation, rights evidence, draft/review status, edit forms, chapter composition and comic page sequencing.
- Preserved author/admin role gates, private draft behavior, publication review submission, rights-evidence requirements, and the existing author novel/chapter endpoints.
- Added a page-scope and workflow contract test to the build chain.

### Account, preferences and community design migration
- Connected Account Center navigation to Preferences & Accessibility and added direct account shortcuts to Crown Vault, Story Requests and rights-gated OmniPortal.
- Added source-level account/settings contract coverage for profile loading, recommendations, sign-out, six site/reader themes, typography, reading measure, motion, contrast, compact cards, preference export/reset and local-only reading helper clearing.
- Rebuilt the Community landing as the Imperial Commons: editorial hero, dedicated community destination links, recent discussion stream, trending story shelf, and Made For You entry point.
- Community data panels now expose loading states, empty states and retry/error feedback while preserving the existing discussion and published-catalog APIs.
- Replaced the leaderboard author's decimal rating display with the shared whole-number rating formatter.
- Added and wired account/settings and community contract tests into the build chain.

### Trend Factory design migration
- Isolated the Trend Factory page and its component namespace from retired generic styles.
- Added an editorial research hero, five-stage signal-to-review pipeline, searchable/filterable live catalog signal workspace, responsive result grid, and rights/sourcing safety panels.
- Kept the existing published-catalog metadata endpoint and filter behavior. The workspace continues to prohibit chapter-body ingestion and explicitly states that trend signals are not evidence of republication rights.
- Added responsive, reduced-motion-aware styling and a source-level contract test wired into the build chain.

### Rights-gated and account-service page-family migration
- Rebuilt OmniPortal's visual structure as a separately scoped metadata-discovery workspace, preserving its existing authorized-provider search and metadata-import request endpoints.
- The OmniPortal interface continues to state that only authorized connectors are queried, no paywall/DRM/login/access-control bypass is allowed, and source chapters are not copied.
- Reviewed and added build-contract coverage for the existing Crown Vault ledger, weekly Story Request Desk and Notifications center. Their existing server endpoints, ledger-only display, request submission, unread states and mark-read action remain unchanged.
- Explicitly kept unverified Crown purchase/payment flows out of the UI. No EasyPaisa integration or paid top-up flow is represented as active.


### Imperial Command administrator workspace
- Removed the legacy inline Admin stylesheet entirely and connected the shared semantic design tokens and component primitives.
- Migrated Admin component names and script selectors into an isolated namespace, retaining stable IDs and tab state classes.
- Added responsive command-center styling for the overview, user and creator review tables, taxonomy/community moderation, legal publishing and chapter management, donation/request/report queues, automation agents, connectors and connector authorization review.
- Preserved the server-side `/api/me` administrator-role gate and existing `/api/admin/*` workflows. This is a visual migration only; it does not broaden privileges or change server authorization.
- Added a source-level Admin contract test to the build chain.


### Remaining public discovery: leaderboard and tier list
- Rebuilt weekly/monthly/all-time leaderboard tabs with accessible pressed states, live novel/author rankings, clear ranking metadata and empty/error states.
- Rebuilt tier-list panels and story cards with responsive cover layouts and loading/empty/error states.
- Both pages now use the shared whole-number rating formatter rather than decimal rating precision.
- Added a discovery-page contract test and wired it into the build chain.


### Remaining public discovery routes
- Rebuilt Trending as a published-catalog activity shelf with live loading, empty and error states.
- Rebuilt Random Novel as a deliberate one-action discovery interaction with busy state, story details, cover art and retry-by-another-story behavior.
- Rebuilt Made For You with clear personalized-versus-popular fallback messaging and resilient recommendation loading.
- Rebuilt Vote Novels with a clear explanation that votes prioritize review but do not guarantee acquisition or rights, plus accessible voting rows and preserved vote endpoint behavior.
- Added responsive design contracts for all four routes and included them in the package build chain.


### Legal and trust-document pages
- Migrated Terms of Service, Privacy and Rights & Copyright pages off the legacy stylesheet and onto the shared semantic design tokens and component primitives.
- Preserved the existing policy copy while creating a consistent editorial hero, readable content sections, notice treatment, responsive typography and reduced-motion support.
- Added a contract test covering all three legal pages and wired it into the package build.
