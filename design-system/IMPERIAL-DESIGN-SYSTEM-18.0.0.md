# Imperial Novel Design System 18.0.0

**Product:** Imperial Novel  
**Motto:** Read • Create • Conquer  
**Status:** Canonical specification, complete six-theme semantic token contract, opt-in component primitives, and application-shell asset registration. Existing page components have not yet been migrated to the new primitives.

## 1. Product design principles

1. **Editorial first:** reading and writing content outrank decoration.
2. **Quiet authority:** confident hierarchy, precise spacing, restrained imperial identity.
3. **Reader comfort:** long-form reading has its own measure, line-height, paper/ink roles and focus.
4. **One system:** public, reader, creator, community and admin experiences share semantic tokens and interaction conventions.
5. **Truthful UI:** never fabricate ratings, counts, availability, author credentials or activity.
6. **Inclusive by default:** keyboard, screen-reader, touch, reduced-motion, RTL and contrast behavior are part of component acceptance.
7. **Progressive performance:** no blur or animation is required to understand or operate the interface.

## 2. Brand and visual composition

The identity palette is fixed:
- Pure White `#FFFFFF`
- Obsidian Black `#0B1215`
- Imperial Purple `#6A0DAD`
- Sapphire Blue `#0F52BA`

The 60/20/12/8 proportions are a composition guideline for brand-led surfaces, not a requirement to force those percentages into every page. White is the default reading and working canvas; obsidian anchors high-contrast and dark surfaces; purple signals primary creation/action; sapphire signals discovery, links and secondary navigation. Semantic status colors are separate and must never be replaced by brand colors.

Visual signature: original black-sun / empty-throne crest and restrained celestial geometry. No copied competitor marks, gold-heavy chrome, rainbow gradients, casino styling, ornamental noise or permanent blur layers.

## 3. Semantic color roles

The CSS token file is the source of truth. Components must consume semantic roles rather than raw hex values.

| Role | Purpose |
|---|---|
| `--in-bg-canvas` | Page background |
| `--in-bg-subtle` | Quiet grouped regions |
| `--in-bg-surface` | Cards, forms and panels |
| `--in-bg-elevated` | Menus, dialogs and overlays |
| `--in-text-primary` | Main readable text |
| `--in-text-secondary` | Supporting content |
| `--in-text-muted` | Metadata, never sole essential instructions |
| `--in-border-default` | Standard separation |
| `--in-border-strong` | High-emphasis boundaries |
| `--in-action-primary` | Main action and creation |
| `--in-action-secondary` / `--in-action-secondary-text` | Discovery and secondary action with a defined readable foreground |
| `--in-focus-ring` | Visible keyboard focus |
| `--in-status-success/warning/danger/info` | Semantic feedback |
| `--in-reader-paper/ink` | Reader-specific surfaces |

### Palette contrast verification

The static design-system test calculates contrast from the actual CSS hex values for every theme. Current palette spot-checks:

| Theme | Body text | Primary action | Secondary action | Status text |
|---|---:|---:|---:|---:|
| Light | 16.51:1 | 9.24:1 | 7.15:1 | 5.87:1 minimum |
| Dark | 17.55:1 | 6.22:1 | 8.45:1 | 7.43:1 minimum |
| Midnight | 18.02:1 | 7.83:1 | 9.50:1 | 7.58:1 minimum |
| Sepia | 12.40:1 | 7.78:1 | 6.17:1 | 6.15:1 minimum |
| Imperial | 17.89:1 | 7.12:1 | 9.15:1 | 7.58:1 minimum |
| Cosmic | 17.98:1 | 8.34:1 | 10.25:1 | 7.69:1 minimum |

All listed text combinations exceed the WCAG AA normal-text threshold of 4.5:1. Focus indicators are separately checked against the 3:1 non-text threshold. These values are palette checks, not a substitute for inspecting rendered component states.

### Theme contract

Six themes are supported by the token contract: Light, Dark, Midnight, Sepia, Imperial and Cosmic. Theme changes must preserve semantic meaning, component states, focus visibility and readable contrast. Theme selection is a user preference; do not infer theme from account role or device.

## 4. Typography

- UI family: Inter with system sans-serif fallback.
- Editorial/novel headings: Georgia or a system serif fallback. Do not require remote font downloads for core readability.
- Numeric/technical metadata: system monospace only where alignment or code benefits.
- Body default: 1rem / 1.5 line-height.
- Reading body: user-adjustable, default 1.125rem / 1.78 line-height, measure 58–75 characters where practical.
- Hierarchy: 12, 14, 16, 18, 20, 24, 30, 36px. Avoid arbitrary one-off sizes.
- Font weight range: 400 body, 500 labels, 600 emphasis, 700 headings/actions.
- Do not use all-caps for long labels. Small uppercase eyebrow labels are decorative, not the only label.

## 5. Spacing, shape, elevation and layout

- 4px base spacing scale: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px.
- Radius: 6px compact controls, 10px standard controls, 14px cards, 20px feature panels, pill only for status/chips.
- Elevation: three restrained levels. Borders define structure; shadows are optional, never required for contrast.
- Content max width: 1280px. Long-form reading max width: 736px.
- Breakpoints: 360px small phone, 480px large phone, 768px tablet, 1024px compact desktop, 1280px wide desktop. Use content-driven changes, not device detection.
- Mobile gutters: 16px minimum; safe-area insets respected.
- Interactive target: 44×44px minimum (CSS token 44px). Dense data tables may scroll horizontally rather than shrink controls.

## 6. Component inventory and contracts

| Component | Required variants/states | Acceptance notes |
|---|---|---|
| Button | primary, secondary, quiet, danger; sm/md/lg; hover/focus/pressed/disabled/loading | Native button; action text describes outcome |
| Text field | default, search, password; idle/focus/error/disabled | Persistent label, help/error association |
| Select | default/disabled/error | Native select where possible; visible label |
| Checkbox/radio | checked/unchecked/disabled/error | Native input, 44px effective target |
| Toggle | on/off/disabled | Use only for immediate binary settings |
| Card | default/interactive/selected | Interactive card has one clear accessible action |
| Badge | neutral/success/warning/danger/info | Never communicate status by color alone |
| Avatar | image/initials/fallback | Decorative image alt empty when adjacent name exists |
| Tabs | selected/unselected/disabled | WAI-ARIA tab pattern, arrow-key navigation |
| Dialog | open/closed/loading/error | Focus containment, Escape close where safe, return focus |
| Toast | info/success/warning/error | Announce politely; critical errors persist in page |
| Table | default/sortable/empty/loading | Caption, scoped headers, mobile overflow |
| Navigation | desktop/mobile/RTL/current | Current location exposed semantically |
| Tooltip | hidden/visible | Supplemental only; never sole source of essential information |
| Empty state | first-use/no-results/error | Explain what happened and the next useful action |
| Skeleton | loading | Hidden from assistive tech; busy state on owning region |

### Component naming

- CSS classes use `in-` prefix.
- Tokens use `--in-{category}-{role}`.
- Variants use BEM modifiers, e.g. `.in-button--primary`.
- State uses native semantics first: `:disabled`, `:focus-visible`, `[aria-selected]`, `[aria-invalid]`, `[aria-pressed]`.
- Do not introduce a second global reset, icon pack, typography system or competing token namespace.

Implementation examples and accessibility responsibilities for every primitive are maintained in [COMPONENT-USAGE-18.0.0.md](./COMPONENT-USAGE-18.0.0.md). The audited route/template migration inventory is maintained in [ROUTE-TEMPLATE-MIGRATION-MAP-18.0.0.md](./ROUTE-TEMPLATE-MIGRATION-MAP-18.0.0.md). The usage guide distinguishes CSS appearance from application-owned keyboard, focus, persistence, authorization and async behavior.

## 7. Product patterns

### Forms
Use a visible label, concise help, inline validation, preserved user input after recoverable errors, and a clear submit result. Validate on submit and after correction, not aggressively on every keystroke.

### Search and filters
Search has an explicit label, clear action, loading state, no-results state and bounded result list. Filters expose active count and a one-action reset. URL state is used for shareable catalog filters.

### Reader
Reader chrome is quieter than the chapter. Offer adjustable font size, line height, width, theme, RTL direction and progress. Preserve the user's chosen settings. Avoid forced animation and interruptive overlays.

### Onboarding and publishing
Show progress, explain why sensitive information is requested, preserve drafts, distinguish save from publish, and require an explicit confirmation for irreversible/public actions.

### Errors and notifications
Explain the issue in plain language, identify whether the user's work was saved, and offer a safe next step. Never show a success toast before the server confirms success.

### Admin and creator workspaces
Use the same component contracts with role-specific information architecture. Authorization is server-side; hiding a button is not access control. Tables and audit views prioritize traceability over decorative density.

## 8. Accessibility and internationalization

- Target WCAG 2.2 AA for text, controls, focus and component behavior.
- Normal text contrast target 4.5:1; large text 3:1; meaningful non-text controls/boundaries 3:1.
- Never remove visible focus. Focus must not be hidden by sticky headers or drawers.
- All controls have programmatic names; errors connect with `aria-describedby`.
- Keyboard operation and logical focus order are mandatory.
- Reduced-motion preference removes non-essential transitions and animated skeletons.
- RTL uses logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline`) and mirrors directional icons only when their meaning is directional.
- Do not auto-translate creator-authored story content. UI locale and chapter language/direction remain independent.
- Support browser zoom to 200% and reflow at 320 CSS px without loss of essential functionality.

## 9. Performance and resilience

- No required remote font, animation, blur, or background image.
- Avoid backdrop-filter on full-screen or mobile surfaces; provide opaque fallback.
- Respect `prefers-reduced-motion`, `prefers-contrast` where supported, forced colors and safe areas.
- Prefer CSS-only primitives and native controls over a new component framework.
- Keep component CSS namespaced and additive during migration.
- The token and primitive stylesheets are registered after the existing application stylesheets. Tokens are additive; primitives are opt-in through `in-` classes. Do not bulk-replace legacy selectors or migrate page templates until route coverage, cascade compatibility and visual regression checks pass.

## 10. Governance and versioning

- This document and `public/imperial-design-tokens.css` are the canonical specification for v18.0.0.
- Component primitives are in `public/imperial-ui-primitives.css`.
- One semantic role has one owner. Feature teams may consume tokens but may not redefine global brand roles.
- A token change requires a rationale, theme impact review, contrast check and visual regression note.
- A new component requires anatomy, variants, states, keyboard behavior, responsive behavior, RTL behavior, localization impact, empty/error/loading states and tests.
- Breaking token changes increment the design-system major version; additive components/minor roles increment minor; fixes increment patch.
- Shared shell, global CSS, theme persistence or page-template changes require architecture ownership review and an ADR under the repository's canonical governance rules.
- Rollout order: foundation audit → token adoption → primitive adoption → page-family migration → visual QA → production release. No broad find/replace over legacy CSS.

## 11. Completion gates

The design system is not considered production-adopted until all are true:
1. Token contract and theme mappings are validated.
2. Component state and accessibility checks pass.
3. All public templates and runtime-created surfaces are inventoried.
4. Existing six-theme preference persistence remains intact.
5. English, Urdu, Arabic and Persian visual/RTL checks pass.
6. Desktop, tablet and 360px/390px phone screenshots are reviewed.
7. CSS source/served bundle parity and Cloudflare build pass.
8. No duplicate global tokens, regressions or unowned shared files remain.
9. Release is deployed and live assets are verified.

**Honest status:** the six theme palettes now define the full semantic color contract, the primitive layer includes accessible controls and feedback patterns, and both stylesheets are registered in the application shell. Existing page templates still primarily use legacy selectors. This PR does not claim full page migration, six-theme global preference UI, or completed visual/browser QA.


## 10. Global theme selection implementation

The shared application shell now exposes a native, keyboard-operable theme selector for all six supported themes: Light, Dark, Midnight, Sepia, Imperial and Cosmic. The selected value is stored under the existing `imperial_theme` preference key, validated against the six-theme allowlist, and applied to the document root. The Worker bootstrap uses the same allowlist before frontend hydration to avoid a dark/light-only flash that would overwrite the selected theme.

The selector is intentionally a native select rather than a custom menu, preserving built-in keyboard and assistive-technology behavior. The design-system contract test verifies the six options, persistence/application path, pre-hydration allowlist and visible focus styling.

This global selector does not yet claim that the separate legacy Reader theme controls have been unified. That requires a reader-specific migration and preference compatibility tests.


## 11. Shared shell and homepage theme adoption

The public shell and homepage now have a semantic compatibility layer. Existing legacy page variables (`--bg`, `--panel`, `--text`, `--line`, violet/action, status and shadow aliases) resolve through the six theme semantic roles. This avoids requiring a risky, repository-wide selector replacement before page-family migration.

The shared top navigation, brand, navigation links, search controls, mobile drawer, hero, format shelf, story cards, feature tiles, creator band and reader promise now have theme-aware overrides using semantic roles. Focus visibility is retained, and reduced-motion preferences are respected for the touched interactions.

This is a first bounded adoption slice, not a claim that every homepage descendant or every dedicated route template is fully migrated. The design-system contract now asserts the semantic compatibility bridge and key shared-shell/homepage selectors. Visual browser QA remains a release gate.


## 12. Discovery page-family adoption

The catalog filter panel, filter controls, result cards, active-filter chips, empty state, format directory links, genre cards, tag tiles and search controls now consume semantic theme roles. Existing API requests, query parameters, filter semantics, pagination and route destinations are unchanged. The styles preserve visible keyboard focus, 44px minimum filter controls on compact layouts, and reduced-motion preferences.

This is source-level theme adoption. It does not certify every catalog state or every viewport visually. Browser review across all six themes, 360px/390px widths, tablet/desktop, RTL and loading/error/empty/populated states remains required.


## 13. Story detail and chapter navigation adoption

The novel overview, metadata/stat surfaces, overview tabs, chapter rows and chapter-list interactions now consume semantic theme roles. Reader toolbar controls, chapter drawer entries and preference selects receive visible focus treatment and 44px minimum targets. Reduced-motion preferences are respected.

The chapter article itself retains its independent reader-theme preference (Light, Dark, Midnight, Sepia, Imperial and Cosmic). This slice deliberately does not unify the global application theme with saved reader preferences or change reading-progress, bookmark, chapter-unlock, comic-viewer or navigation behavior. That compatibility work remains a separate migration and must preserve existing saved preferences.

Source-level adoption is covered by the design-system contract. Visual review across all six global themes, reader themes, mobile widths, RTL, long titles, locked chapters, empty/error states and text/comic chapters remains required before this page family can be marked complete.


## 14. Account and personal library adoption

Account navigation, profile panels and metrics, personal-library story cards, reading-history/bookmark rows, notices and page-level library tabs now consume semantic theme roles. Account links and buttons have visible keyboard focus; navigation and row actions use the shared touch-target token. At mobile widths the account navigation becomes a horizontal scroll shelf and profile metrics reflow to two columns.

This is a visual/source adoption slice only. Authentication, profile APIs, library membership, history, bookmarks, following, ticket ledger and user data isolation are unchanged. No user data or server behavior is altered by these styles.

Visual QA remains required across all six themes, signed-in/signed-out states, empty/populated/error states, 360px/390px/mobile/tablet/desktop, long usernames and story titles, RTL, keyboard traversal and screen-reader naming. The Following route currently shares the library renderer; this CSS does not alter or claim to repair its underlying content behavior.
