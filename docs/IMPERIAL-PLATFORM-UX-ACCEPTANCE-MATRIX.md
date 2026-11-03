# Imperial Novel: Platform UX Acceptance Matrix

**Product:** Imperial Novel  
**Motto:** Read • Create • Conquer  
**Scope:** Cross-platform UX and UI quality gates for the production website  
**Status:** Design handoff and acceptance criteria; not a claim that every screen currently passes  
**Baseline:** Existing Imperial design foundation, six-theme direction, route architecture and mobile-first product requirements

## 1. Product experience principles

1. **Reader-first clarity:** readers can discover a story, understand its format and publication status, begin reading, and resume without hunting through menus.
2. **Creator control:** authors can understand draft, review, scheduling, publication, rights and feedback states without ambiguous actions.
3. **Trust before decoration:** privacy, content rights, ratings, payments and moderation states must be accurate and explainable.
4. **Mobile is the primary constraint:** core flows must work at narrow phone widths, with no horizontal overflow or desktop-only controls.
5. **International by design:** interface localization and user-authored content are distinct; Urdu, Arabic and Persian reading surfaces must support RTL independently.
6. **Progressive enhancement:** a slow or failed optional feature must not erase the page's primary content or trap the user in a loading shell.
7. **No pretend affordances:** do not display upload, email verification, payment, reply, offline or AI controls unless the complete capability is enabled and its outcome is observable.

## 2. Shared visual system

Use the existing design-foundation tokens as the source of truth. Do not create a competing palette or redefine tokens locally.

| Role | Existing direction |
|---|---|
| Brand | Imperial Purple `#6A0DAD` |
| Discovery/action | Sapphire Blue `#0F52BA` |
| Primary ink | Obsidian `#0B1215` |
| Light surface | Pure White `#FFFFFF` |
| Canvas | Soft neutral surface |
| Semantic | Success, warning, danger and focus tokens from the shared foundation |
| Spacing | 4px base scale; use shared spacing tokens |
| Radius | Shared small, medium and large radius tokens |
| Motion | Short, restrained transitions; honor reduced-motion preference |
| Typography | System-first sans-serif stack with clear reading line-height and bounded line length |

### Theme contract

- Support Light, Dark, Midnight, Sepia, Imperial and Cosmic themes through shared semantic tokens.
- A component must use semantic surface, text, border and focus tokens, not hard-coded colors.
- Theme changes must not reduce text contrast or make disabled, selected and focused states indistinguishable.
- Reader theme and site theme preferences must remain conceptually distinct where the product exposes separate controls.

## 3. Global shell and navigation

### Desktop
- Brand and primary navigation remain visually distinct from account actions.
- Search is easy to reach and exposes a clear label, empty state and keyboard focus.
- Navigation labels describe destinations rather than internal feature names.
- Long navigation must not push account controls off-screen.

### Mobile
- Keep the primary navigation reachable with one hand.
- Respect safe-area insets and avoid covering page actions with bottom navigation.
- Use a navigation drawer or compact navigation pattern with a visible close action and predictable focus behavior.
- Do not duplicate every desktop navigation item in a crowded mobile header.
- Keep tap targets at least 44 by 44 CSS pixels.

### All breakpoints
- No horizontal page overflow at 320 CSS pixels.
- Focus remains visible when navigating by keyboard.
- Menus close on Escape and return focus to their trigger.
- Active route is communicated visually and programmatically.

## 4. Screen-family acceptance criteria

### Home and discovery
- Explain the product and lead with real, published, rights-eligible content.
- Shelf ordering and ranking labels must match the data query that produced them.
- Do not show invented totals, empty 0.0 ratings, fake online counts or fabricated activity.
- Deduplicate stories across adjacent shelves when the design implies distinct recommendations.
- Loading, empty, error and partial-data states must preserve navigation and retry paths.
- Search and taxonomy entry points must remain usable without waiting for every shelf request.

### Catalog, search, genres and tags
- Filters must be labelled, keyboard-operable and reflected in the result state.
- Applied filters must be removable individually and resettable.
- Sort labels must describe the actual ordering.
- Empty results must explain how to broaden the search.
- Pagination or incremental loading must preserve the selected filters and scroll context.
- Novel cards must disclose title, author, format and only verified rating/chapter metadata.

### Novel detail and chapter reader
- Clearly identify format, author, publication state, content warning where applicable, rights/attribution information and chapter availability.
- Chapter lists must distinguish free, locked, scheduled, unpublished and unavailable states accurately.
- Reader controls must expose font size, line height, width, theme and navigation with accessible labels.
- Reading position and bookmarks must not leak across accounts.
- RTL direction must be applied to the reading content surface without incorrectly reversing unrelated interface chrome.
- Comic and image-page readers must provide meaningful loading, failure and page-navigation states.

### Library, history and reading progress
- Empty states explain how to add or resume a story.
- Remove, bookmark and follow actions provide clear confirmation and undo where safe.
- Progress synchronization must disclose signed-out/local-only behavior.
- Private reading history must never appear in public profile projections.

### Profiles and account settings
- Public profiles default to private until the user explicitly opts into public visibility.
- Public profile responses must exclude email, role, Crown balance, session information and private reading records.
- Reading statistics remain hidden unless explicitly enabled.
- Profile editing validates lengths and URLs inline and preserves unsaved edits after recoverable errors.
- Username changes require re-authentication, explain cooldown and availability, and do not silently detach authored works.
- Session management must identify the current session without exposing session hashes or unsupported device fingerprints.
- Email changes and avatar uploads must remain clearly unavailable until delivery and storage infrastructure is configured.

### Author Studio
- Separate story setup, chapter drafting, revision history, scheduling, publication and reader feedback into understandable tasks.
- Autosave and local draft recovery must communicate whether the latest text is saved locally, remotely or not saved.
- Never imply a scheduled chapter is published before the scheduled publication job succeeds.
- Rights and attribution requirements must be visible before submission and publication.
- Reader feedback must be owner-scoped, bounded, and escape untrusted user text.
- Do not display reply controls until a real reply and moderation workflow exists.

### Community
- Comments, discussions, reports, ratings and notifications must disclose their visibility and moderation state.
- User-generated text must be escaped and length-bounded.
- Hidden or deleted content must not reappear through alternate feeds.
- Reporting must provide a clear submitted state without revealing private moderation notes.
- Rating input and display must follow the same active rating contract. Do not silently convert the current 1–5 system to a 1–10 system.

### Admin and operations
- Administrative actions must state their target and consequence before irreversible changes.
- Destructive actions require confirmation and auditability.
- Admin-only controls must not be exposed to ordinary readers or authors.
- Operational dashboards must distinguish unavailable telemetry from a true zero.
- Payment, ledger, rights and moderation data must be minimized by role.

## 5. Component-level definition of done

Every shared component must define and test:

| State | Required behavior |
|---|---|
| Default | Clear purpose and hierarchy |
| Hover | Non-essential enhancement only; never the sole interaction cue |
| Focus | Visible focus indicator with sufficient contrast |
| Active/selected | Distinct visual and programmatic state |
| Disabled | Understandable unavailable state; not confused with loading |
| Loading | Stable layout and announced status where appropriate |
| Empty | Helpful explanation and valid next action |
| Error | Plain-language message, preserved user input and safe retry |
| Success | Observable confirmation tied to the actual completed action |
| Reduced motion | No essential information depends on animation |
| RTL | Direction, alignment and icon placement verified in context |

Shared components include buttons, icon buttons, text fields, password fields, selects, checkboxes, switches, tabs, cards, story covers, badges, dialogs, toasts, pagination, navigation, menus, skeletons and empty states.

## 6. Accessibility release gates

- Meet WCAG 2.2 AA contrast requirements for text and meaningful controls.
- All inputs have persistent programmatic labels; placeholders are not labels.
- All interactive controls are keyboard reachable and have visible focus.
- Touch targets are at least 44 by 44 CSS pixels where practical.
- Validation errors are associated with their fields and announced.
- Status updates use appropriate live regions without announcing every minor visual change.
- Images have context-appropriate alternative text; decorative images are hidden from assistive technology.
- Page headings form a logical hierarchy.
- Dialogs manage focus and restore it on close.
- Reduced-motion preferences are respected.
- Test at 200% zoom and narrow viewport widths.
- Verify English LTR and Urdu/Arabic/Persian RTL separately.

## 7. Performance and resilience gates

- Avoid blocking third-party requests for core navigation and reading.
- Reserve image dimensions to prevent layout shift.
- Lazy-load below-the-fold imagery without delaying the first meaningful content.
- Keep the initial route usable if recommendations, analytics or optional personalization fail.
- Avoid duplicate API requests caused by multiple UI islands mounting the same data source.
- Show stale-but-valid content only when its age and refresh behavior are understood.
- Preserve form input when a request times out or the network drops.
- Test on constrained mobile bandwidth and low-memory devices.

## 8. Evidence required before marking a screen complete

For each route and role, record:

1. Route and authenticated role tested.
2. Viewport sizes, including 320px phone width and a desktop width.
3. Theme and language/direction tested.
4. Default, loading, empty, error and success states captured.
5. Keyboard and screen-reader checks performed.
6. API ownership and privacy boundary verified where personal data is involved.
7. Regression test or manual test evidence linked.
8. Whether the result is local, CI-passed, staged, or production-verified.

A design specification, passing unit test, successful build, successful deployment and verified production behavior are separate evidence levels. Do not collapse them into a single “complete” status.

## 9. Current known integration gates

The current development history contains independent draft work for profile identity, account security/preferences, route registry and design foundation. Before integrating those branches:

- Reconcile migration numbering and dependencies against the complete migration directory and runtime schema bootstrap.
- Preserve the current production application bundle until the integrated build passes.
- Keep account/profile migrations additive and rehearse the full chain against a fresh SQLite database.
- Do not run production D1 migrations as part of branch integration.
- Run the full application build, Cloudflare readiness check, Worker dry-run and relevant regression tests.
- Perform mobile, theme and RTL browser QA after the integrated build exists.

## 10. Ownership and change governance

- Product UX owns terminology, user goals, task flows and state definitions.
- UI design owns tokens, hierarchy, responsive layouts, accessibility and component behavior.
- Engineering owns implementation, data correctness, runtime performance and tests.
- Security/privacy review owns authorization, ownership isolation, sensitive data exposure and destructive actions.
- Release management owns migration sequencing, staging evidence and production verification.

A feature is not accepted because its screen looks finished. It is accepted when the visible promise, server behavior, privacy boundary, failure state and release evidence agree.
