# Imperial Novel — Responsive Page & Component Specifications

**Workstream:** Design foundation, companion to `IMPERIAL-NOVEL-DESIGN-ARCHITECTURE-17.25.0.md`  
**Status:** Implementation-ready design contract; screenshots and production UI verification are still required.

## Shared shell

### Desktop
- Header: brand mark/wordmark, primary navigation, global search, language control, account actions.
- Main content: centered editorial grid with a readable maximum width; full-bleed sections only for deliberate editorial moments.
- Footer: About, Help, Contact, Terms, Privacy, Copyright, Content Policy, language.
- Sticky behavior must not consume excessive vertical space or cover focused controls.

### Mobile
- Compact top bar: brand, search affordance, account/profile.
- Bottom navigation: Home, Discover, Library, Create, Community, Profile.
- Bottom navigation respects safe-area insets and never covers reader controls or form submit actions.
- Secondary navigation uses accessible drawers/sheets with clear close controls and focus management.
- No hover-only actions.

## Page specifications

### Home
**Desktop order:** Header → editorial hero → continue reading (signed in) → trending → latest updates → genre discovery → author/community feature → footer.

**Mobile order:** Header → compact hero → continue reading → trending cards → latest updates → genres → community feature.

**Hero rules:** Use one real published work or a real editorial announcement. Artwork has defined crop behavior, title and synopsis have readable contrast, and CTA leads to a real route. No fake carousel autoplay. If no eligible featured item exists, render a curated catalog section instead of an empty hero.

**Cards:** cover, title, author, genre/language metadata, publication state, and one relevant engagement signal only when available. Clamp text without hiding essential metadata. Entire card must not become an ambiguous nested interactive control.

### Discover
- Search field remains prominent and has a clear label.
- Filter groups: genre, language, format, completion status, publication recency, and tags.
- Applied filters appear as removable chips and are encoded in URL query parameters.
- Sort menu labels include their meaning (e.g. most viewed in the last 7 days).
- Desktop may use a filter rail; mobile uses a filter sheet with applied-filter count and explicit Apply/Reset actions.
- Loading preserves layout; empty state offers reset and alternative discovery links; errors allow retry.
- Search results are paginated or cursor-loaded with stable URLs and no duplicate records.

### Novel detail
**Above the fold:** cover, title, author, concise synopsis, primary Read/Continue action, Save action, and clear content/language/status metadata.

**Below:** full synopsis, genres/tags, chapter list, eligible reviews, author profile, and related works.

- The rights/source label is factual and visible where relevant.
- Chapter rows show chapter number/title, publication date, and access state.
- Locked chapters explain the access requirement before the user enters a purchase flow.
- Rating aggregates are hidden until there are enough eligible ratings under the platform's policy.
- Report action is accessible without requiring the user to find a hidden menu.

### Reader
- Keep chapter text as the visual center; controls are secondary.
- Top reader bar: back to work, chapter position/title, reading settings, more actions.
- Bottom/edge controls: previous/next chapter and optional progress affordance.
- Settings panel: theme, font family, font size, line height, content width, paragraph spacing.
- Themes: Light, Dark, Midnight, Sepia, Imperial, Cosmic. Theme names are accompanied by previews and maintain contrast.
- Progress save has explicit states: saving, saved with timestamp, offline/pending, and failed with retry.
- Chapter content is not interrupted by ads or overlays. Any permitted advertising placement must be outside the reading text and must not shift the reader unexpectedly.
- Keyboard: Escape closes panels; arrow/page navigation is optional and must not conflict with assistive technology or editable fields.
- Mobile gestures are optional; visible buttons remain available.

### Library
- Tabs/filters: All, Reading, Completed, Saved, Collections.
- Each work shows progress and last-read date only for the signed-in owner.
- Continue action resumes at the last valid chapter.
- Empty state explains how to add works and links to Discover.
- Private library data must never be exposed in public cache or public APIs.

### Community
- Topic feed with clear category, author, timestamp, and moderation/report controls.
- Comment/reply hierarchy remains readable on mobile.
- Posting requires authentication and server-side rate/abuse controls.
- Optimistic posting must revert visibly if the server rejects the action.
- Moderation states are communicated respectfully without exposing private moderator notes.

### Author Studio
- Separate workspace shell, visually related to the public site but optimized for task completion.
- Overview: drafts, published works, pending review, recent activity, and explicit next-step checklist.
- Work editor: metadata panel, chapter list, autosave status, preview, rights declaration, submit-for-review/publish action.
- Chapter editor: distraction-reduced writing canvas, word count, validation, save/recovery state, preview.
- Publishing actions require server-confirmed ownership and permission.
- Analytics show metric definition, date range, freshness timestamp, and data availability. Do not invent data when the account has no activity.
- Destructive actions require confirmation and clear consequences.

### Account and security
- Profile, language, reading preferences, privacy, sessions/devices, notification preferences, and account deletion/export where supported.
- Session revocation and security events use clear success/failure feedback.
- Sensitive settings require re-authentication where risk warrants it.
- Never reveal tokens, secrets, internal risk scores, or another user's private information.

## Shared component contract

Every interactive component defines:
- semantic element and accessible name;
- keyboard behavior and focus-visible style;
- touch target and responsive behavior;
- default, hover, focus, pressed, disabled, loading, success, and error states as applicable;
- loading and failure behavior;
- analytics event only where justified and privacy-safe.

### Core components
1. **Button:** primary, secondary, tertiary, destructive, and icon-only variants. Icon-only controls require accessible labels.
2. **Search:** labelled input, clear action, suggestion list with keyboard navigation, loading and no-result states.
3. **WorkCard:** cover, title, author, metadata, optional verified metrics, and explicit save action.
4. **ChapterRow:** chapter identity, date, access state, and navigation.
5. **Metric:** value, definition, aggregation window, and freshness where applicable.
6. **FilterChip:** selected state, remove action, and keyboard support.
7. **Dialog/Sheet:** labelled title, focus trap, Escape close, focus restoration, safe-area handling.
8. **Toast/InlineNotice:** concise feedback; important errors remain persistent and actionable.
9. **Skeleton:** matches final layout dimensions and is never used as an indefinite loading state.
10. **Pagination/LoadMore:** preserves scroll position and exposes progress to assistive technology.

## Responsive behavior matrix

| Area | Small mobile | Large mobile/tablet | Desktop |
|---|---|---|---|
| Primary nav | Bottom bar | Bottom bar or compact rail | Header navigation |
| Discover filters | Sheet | Sheet/side panel | Filter rail |
| Work cards | Single column | 2 columns where legible | Editorial grid |
| Reader controls | Compact top bar + bottom actions | Expandable controls | Toolbar + settings panel |
| Studio navigation | Drawer | Collapsible rail | Persistent sidebar |
| Admin tables | Stacked records | Horizontal scroll only if labelled | Data table |

## Visual QA checklist

- Test at 320, 360, 390, 768, 1024, and 1440 CSS px.
- Check portrait and landscape mobile.
- Check keyboard-only navigation and screen-reader names.
- Check 200% text zoom and long translated strings.
- Check RTL with Urdu and Arabic, including mixed numerals and punctuation.
- Check empty, slow network, offline, API failure, and expired-session states.
- Check real content with long titles, missing covers, unusually long author names, and zero engagement.
- Check reduced motion and high contrast settings.
- Confirm no blank/black-screen transitions, layout jumps, or horizontal overflow.

## Acceptance gate

This specification is accepted only when each page has a reviewed visual implementation, real responsive screenshots, accessibility checks, and functional tests. The written specification is not evidence that the production website has changed.
