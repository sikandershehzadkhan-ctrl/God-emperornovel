# ADR-0001: Unified Imperial Novel design system

- Status: Accepted
- Date: 2026-11-10
- Decision owners: Imperial Novel product and engineering
- Scope: public and administrator application shells and shared visual foundation

## Context

The application shell loaded several independent stylesheets directly. Shared design decisions were repeated across the base stylesheet, luxury theme, format styles, comic reader styles and glass surfaces. This made visual precedence difficult to reason about and allowed old colors, surface treatments and page-specific overrides to compete with the current Imperial Novel identity.

The product needs one coherent design language across reading, discovery, creator, community and administration experiences, while retaining existing behavior during migration.

## Decision

1. Introduce `public/imperial-design-system.css` as the sole stylesheet entry point referenced by both `public/index.html` and `public/admin.html`.
2. Consolidate the six existing feature stylesheets into the single design-system file in their established cascade order. Migrate administrator-only inline styles into the same file. Neither application shell may load legacy CSS files through separate link tags, runtime `@import` requests or service-worker precache entries.
3. Make semantic tokens in the unified stylesheet the final authority for shared colors, surfaces, typography defaults, borders, focus, motion, touch targets and elevation.
4. Use comfortable warm-paper surfaces in light mode and obsidian surfaces in dark mode. Purple is the primary identity accent; sapphire is the secondary discovery/action accent. Teal, lime, pink and gold are not shared brand accents.
5. Publish semantic color, typography, spacing, radius, elevation, reading-width and breakpoint tokens. Use a 4px spacing scale and semantic names instead of embedding raw palette values in new components.
6. Provide opt-in accessible primitives for buttons, fields, cards, badges, tabs, tables, empty states, toasts and reader prose. New page work should use these primitives; legacy page selectors remain until migration parity is demonstrated.
7. Keep decorative glass restrained. Content surfaces must remain readable and degrade gracefully on touch devices and reduced-motion settings.
8. Migrate page families incrementally. Remove or delete legacy rules only after route-specific visual and functional parity checks prove they are no longer needed.
9. Preserve application behavior, route semantics, localization, RTL behavior, permissions, user data, payment controls and backend contracts during visual migration.

## First implementation

- The public and administrator application shells each reference exactly one stylesheet entry point, the same canonical file.
- The six existing feature styles have been consolidated into the canonical stylesheet in their original cascade order; semantic tokens and page-family migrations follow them in the same file.
- The main application and separate administrator shell each reference only the canonical stylesheet. Administrator-only inline CSS has been moved into the canonical file. The service worker precaches only that stylesheet, not the retired runtime CSS assets.
- Real primary buttons use the theme-aware foreground token; the current light and dark primary/hover combinations pass the automated 4.5:1 contrast threshold.
- The homepage hero, format cards, feature tiles and supporting bands are the first migrated page family.
- Semantic color, typography, spacing, elevation, breakpoint and reading-width tokens are available under the `--in-*` namespace.
- Opt-in primitives cover buttons, fields, cards, badges, tabs, tables, empty states, toasts and reader prose with keyboard focus and touch sizing.
- The homepage, shell, discovery, reader, account, creator, community, OmniPortal and administrator surfaces have targeted migration rules.
- A build regression test verifies both shells use one stylesheet, administrator inline CSS is absent, legacy runtime assets are not imported or precached, semantic tokens, component primitives, primary-action contrast, accessibility safeguards, reader themes and page-family selectors.

## Consequences

### Positive

- There is one predictable place to define shared visual tokens.
- Future page migrations can reuse the same color, surface, focus and responsive contracts.
- The shell no longer needs to enumerate every feature stylesheet.
- Existing feature styling remains available during safe migration.

### Trade-offs

- Historical stylesheet files remain in the repository as rollback references while route-by-route parity is verified, but they are no longer loaded by the application.
- The first phase does not claim that every route has been redesigned.
- Historical source files can be deleted after route-by-route visual, responsive, RTL and functional parity is proven against the consolidated stylesheet.

## Required validation before removing legacy styles

- Route inventory coverage for public, authenticated, creator and admin routes.
- Light/dark parity and RTL layout checks.
- Mobile viewport and touch-target checks.
- Keyboard focus, reduced-motion and contrast checks.
- Functional regression checks for forms, reading controls, navigation and permissions.
- Cloudflare build and deployment validation.

## Rollback

Revert the application shell stylesheet reference and the unified stylesheet changes together. No database or user-data rollback is required because this decision does not change persistence or backend contracts.
