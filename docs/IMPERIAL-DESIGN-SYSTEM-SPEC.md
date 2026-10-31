# Imperial Novel — Visual Design System Specification

Creative direction: Modern Smart Imperial Shenhao  
Brand line: Read • Create • Conquer

The design should communicate editorial quality, modern imperial authority and technological confidence. It must not resemble a generic anime landing page, crypto casino, gold-heavy luxury template or decorative AI-generated dashboard.

## Brand palette

Core identity colors:

| Token | Direction | Usage |
|---|---|---|
| Imperial Purple | Deep, intelligent purple | Brand identity, authorship, primary emphasis |
| Pure White | Clean neutral white | Light surfaces, reading comfort, contrast |
| Sapphire Blue | Precise blue | Discovery, links, focus and selected data |
| Obsidian Black | Near-black, not flat pitch black | Dark surfaces and reading chrome |

Use semantic tokens rather than hard-coded colors:
- --color-brand
- --color-brand-strong
- --color-discovery
- --color-bg
- --color-surface
- --color-surface-raised
- --color-text
- --color-muted
- --color-border
- --color-success
- --color-warning
- --color-danger
- --focus-ring

Gold is not a core color. If used at all, it is a rare, small accent for a genuinely premium or earned status.

## Visual principles

1. Editorial over ornament: clear type hierarchy, strong covers, calm surfaces and purposeful whitespace.
2. One signature, not ten effects: use a distinctive crest and disciplined purple/sapphire details; avoid competing glows, grids, orbits and gradients.
3. Content is the hero: novel covers, titles, synopsis and chapter text dominate decorative interface chrome.
4. Quiet luxury: precise borders, measured radii, consistent spacing and restrained depth.
5. Functional color: color communicates state or action, not decoration.
6. Consistent light and dark themes: both are designed intentionally; neither is a recolor afterthought.
7. Fast by default: no heavy background video, unnecessary blur, oversized images, blocking third-party fonts or animation-heavy transitions.
8. Responsive by construction: layouts adapt at content-driven breakpoints and remain usable at 320px width.

## Typography

- Use a highly readable sans-serif system stack for interface text.
- Reserve a restrained editorial serif for selected display headings only where it strengthens the brand.
- Reader typography is user-configurable and optimized for long-form comfort.
- Define a type scale for display, page title, section title, body, supporting text, labels and metadata.
- Use fluid sizing with sensible minimum and maximum values.
- Keep body line length comfortable; avoid tiny metadata and all-caps paragraphs.
- Support Urdu, Arabic and Persian shaping, right-to-left direction and language-specific line-height.

## Layout and spacing

- Use a consistent spacing scale based on 4px increments.
- Define shared content widths for reading, forms, dashboards and catalog grids.
- Use a predictable page grid and alignment system.
- Desktop navigation may expose high-frequency destinations; secondary items belong in the three-line drawer.
- Mobile primary navigation remains compact and thumb-reachable.
- Respect safe areas on mobile devices.
- Avoid horizontal scrolling except in intentionally scrollable content rails.

## Component inventory

### Global shell
- Brand crest and wordmark
- Desktop primary navigation
- Three-line menu button and accessible drawer
- Search entry
- Language selector
- Theme control
- Account and notifications
- Five-item mobile bottom navigation
- Consistent footer

### Content and discovery
- Novel card and compact card
- Catalog filter bar and active filter chips
- Genre and format tiles
- Ranking row
- Editorial story feature
- Author identity block
- Empty, loading, error and skeleton states

### Reading
- Reader toolbar
- Chapter title and metadata
- Reading canvas
- Progress indicator
- Previous/next controls
- Bookmark and reading settings
- Locked-chapter purchase disclosure
- Comic page viewer where licensed visual content exists

### Real-time intelligence components
- Platform Pulse: six truthful catalog/activity metrics, explicit measurement windows, last-generated timestamp, manual refresh and service-health state.
- Recent Updates: timestamped chapter events linked to their published reading destinations.
- Reader Momentum: unlock-based ranking with its measurement window visible.
- Provider Snapshot: registered, authorized, search-ready and health-observed states kept distinct, with last-check timestamps.
- Loading, stale, refreshing, unavailable and degraded states must be visually distinct and accessible.
- Use tabular numerals for changing metrics. Avoid flashing counters, false online indicators and continuous animation.
- Refresh only while the page is visible; announce meaningful updates politely without repeatedly interrupting screen readers.

### Creator and operations
- Dashboard metric card
- Work and chapter table/list
- Editor controls
- Publication status badge
- Rights evidence panel
- Review/approval timeline
- Audit log and moderation queue

### Feedback and forms
- Buttons with clear hierarchy
- Text inputs, selects, checkboxes and radio controls
- Dialogs and confirmation patterns
- Toast/status messages
- Form validation and accessible error summary

Each component must have documented states: default, hover, focus, active, disabled, loading, success and error as applicable.

## Interaction and accessibility

- All controls work with keyboard and touch.
- Visible focus rings are never removed without an equivalent.
- Menu drawer manages focus, Escape dismissal and accessible expanded state.
- Use semantic landmarks and heading order.
- Provide descriptive accessible names for icon-only controls.
- Never communicate state using color alone.
- Meet WCAG 2.2 AA contrast targets.
- Respect prefers-reduced-motion and user motion preferences.
- Use sufficiently large touch targets, ideally 44×44 CSS pixels.
- Support zoom and text resizing without clipped content.
- Provide RTL layouts and bidirectional text isolation where needed.

## Motion and performance

- Motion is short, purposeful and optional.
- Avoid parallax, continuous ambient animation, large blur layers and layout-shifting transitions.
- Prefer opacity and transform for simple transitions.
- Defer below-the-fold cover images and set image dimensions/aspect ratios.
- Use responsive image sizes and modern formats when available.
- Keep critical CSS and first-screen JavaScript small.
- Avoid duplicate stylesheets and repeated overrides; consolidate only after visual regression coverage exists.
- Preserve a usable static/loading fallback if application JavaScript fails.

## Design review checklist

- Does the page look unmistakably Imperial Novel without excessive ornament?
- Is the most important action obvious within the first viewport?
- Is story content more prominent than interface chrome?
- Are light and dark themes both polished?
- Does the page work at 320px, common Android widths, tablet and desktop?
- Are contrast, keyboard, focus, screen-reader labels and reduced motion correct?
- Does the page remain fast on a low-end mobile device and constrained connection?
- Are loading, empty, error and disabled states designed?
- Are labels and content localized without overflow?
- Are visual assets original or properly licensed?


## Implemented foundation and automated checks — 31 October 2026

The first shared design-foundation stylesheet is now linked after the existing global styles in the review branch. It introduces the Imperial Purple, Sapphire Blue, White and Obsidian token set; shared surface, spacing, radius and content-width tokens; responsive global shell, drawer, mobile navigation and footer refinements; card/control/reader surface alignment; visible keyboard focus; and reduced-motion handling. The homepage receives an editorial hero and restrained imperial seal treatment, followed by clearer format, story, creator and feature shelves.

The editable and versioned browser bundles are kept synchronized where shared page-title metadata is updated. Browser/PWA theme colors now use the same Imperial Purple accent. A build-integrated design test checks stylesheet structure, key brand tokens, responsive and accessibility hooks, stylesheet load order, absence of remote runtime imports, bundle parity and PWA/browser theme-color consistency.

This is the foundation pass, not final visual sign-off. Device screenshots, contrast sampling, interaction checks and Core Web Vitals still need a browser-connected QA pass before merge/deployment.
