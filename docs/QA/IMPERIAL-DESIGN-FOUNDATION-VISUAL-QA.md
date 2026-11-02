# Imperial Novel Design Foundation — Visual QA Runbook

**Scope:** Public application shell, homepage, catalog/discovery, novel detail, reader, community, author onboarding and Imperial Command Center.
**Branch:** `feature/imperial-design-architecture-seo`
**Status:** QA plan prepared; visual execution is pending a connected browser/device session.
**Release rule:** This document is a test protocol, not evidence that manual checks passed. Do not sign off or deploy on the strength of static CSS assertions alone.

## 1. Viewport and reflow matrix

Run every route group at the following CSS viewport widths. Record browser zoom separately from viewport width.

| Profile | CSS viewport | Primary risks |
|---|---:|---|
| Compact Android | 320 × 720 | Navigation collisions, clipped labels, card overflow |
| Narrow Android | 360 × 800 | Bottom navigation, search and card wrapping |
| Common Android | 390 × 844 | Homepage first viewport, drawer and safe areas |
| Large phone | 430 × 932 | Excessive card stretching, floating controls |
| Tablet portrait | 768 × 1024 | Desktop/mobile navigation breakpoint |
| Tablet landscape | 1024 × 768 | Navigation density and admin tables |
| Desktop | 1440 × 900 | Content measure, hierarchy and whitespace |

At every width, verify:
- No unintended page-level horizontal scrolling.
- No clipped text, controls, focus rings, dialogs or sticky navigation.
- Images and cards preserve their intended aspect ratio without stretching.
- Long titles, author names, translated labels and metadata wrap safely.
- Header, menu drawer, footer and bottom navigation do not cover actionable content.
- Scrollable tables/rails are intentionally contained and remain operable.
- Loading, empty, error and populated states all remain legible.

## 2. Zoom and text resizing

Test the homepage, catalog, novel detail, reader, author onboarding and admin workspace at:
- 100% browser zoom.
- 200% browser zoom.
- 200% text-only enlargement where supported by the browser/OS.

Pass criteria:
- Content reflows without two-dimensional page scrolling, except genuinely two-dimensional content such as a data table.
- No essential action disappears behind fixed navigation or overlays.
- Text remains readable and does not overlap icons, badges or adjacent controls.
- Form labels, validation messages and dialog actions remain visible.
- Reader controls remain reachable while the reading column narrows naturally.

Record browser, operating system, viewport and the exact route for every failure.

## 3. Interaction checks

### Global navigation
- Open and close the three-line menu using pointer, touch, Enter and Space.
- Confirm Escape closes the drawer.
- Confirm focus enters the drawer on open, stays within it while open, and returns to the trigger on close.
- Confirm current destination is announced correctly.
- Check LTR and RTL drawer placement and scrolling.

### Homepage and discovery
- Verify hero search, primary actions, format links, genre links and story cards.
- Scroll through every shelf and confirm no fixed element blocks its content.
- Confirm independent loading/error states do not hide successful shelves.
- Navigate away and back repeatedly; check that timers/listeners do not multiply and stale responses do not overwrite the current visit.

### Reader
- Open chapter list and reader preferences.
- Change theme, typography and font size.
- Confirm chapter text remains readable at 200% zoom and long paragraphs wrap.
- Verify safe-area padding and bottom controls on a phone-sized viewport.

### Admin
- Check navigation, cards, status badges, forms and tables.
- Confirm table overflow is confined to its own scroll container.
- Verify focus indicators and status meaning do not rely on color alone.

## 4. Accessibility checks

- Keyboard-only traversal in logical visual order.
- Visible focus for links, buttons, form controls and custom interactive cards.
- Screen-reader landmarks, page title, heading order, accessible names, state changes and form errors.
- Reduced-motion preference: no essential information depends on animation.
- Forced-colors/high-contrast mode: controls, borders, selected states and focus remain identifiable.
- RTL: logical alignment, drawer direction, punctuation and mixed-direction titles.
- Touch: primary controls meet the 44 × 44 CSS pixel target where practical; compact reader controls must not become difficult to activate.

## 5. Theme sampling

Repeat key routes in Light, Dark, Midnight, Sepia, Imperial and Cosmic themes:
- Body text and secondary text against their actual surfaces.
- Links, selected navigation and disabled controls.
- Focus indicators against adjacent surfaces.
- Form borders, placeholders, errors and success states.
- Reader chapter text, metadata and toolbar controls.

Automated contrast tests are a useful guard, but the manual review must inspect rendered foreground/background pairs, gradients, overlays, images and component-specific overrides.

## 6. Evidence log

Do not mark a row passed without recording the environment and observed result.

| Check | Environment / route | Result | Evidence / issue |
|---|---|---|---|
| 320px reflow | Not run | Pending | Browser/device session required |
| 360px reflow | Not run | Pending | Browser/device session required |
| 390px reflow | Not run | Pending | Browser/device session required |
| 430px reflow | Not run | Pending | Browser/device session required |
| 768px tablet | Not run | Pending | Browser/device session required |
| 1024px tablet | Not run | Pending | Browser/device session required |
| 1440px desktop | Not run | Pending | Browser/device session required |
| 200% browser zoom | Not run | Pending | Browser/device session required |
| Text enlargement | Not run | Pending | Browser/device session required |
| Keyboard and focus | Not run | Pending | Browser/device session required |
| Screen reader | Not run | Pending | Assistive technology required |
| Reduced motion | Not run | Pending | OS/browser preference required |
| Forced colors | Not run | Pending | Supported browser/OS required |
| RTL and Urdu/Arabic | Not run | Pending | Real rendered locale required |
| Android touch and safe areas | Not run | Pending | Physical device required |

## 7. Sign-off gate

Design Foundation sign-off requires:
1. All viewport and zoom rows executed, with failures fixed or explicitly accepted by the product owner.
2. Keyboard, screen-reader, reduced-motion, forced-colors and RTL checks completed.
3. No P0/P1 visual or interaction defects open.
4. The full automated Cloudflare source-validation workflow passing on the final review commit.
5. A fresh review of the changed files and confirmation that no production deployment occurred as part of QA.

**Current decision: NOT SIGNED OFF.** The automated acceptance suite has passed on the recorded review head, but browser screenshots, actual Android behavior, zoom and assistive-technology checks remain unverified.
