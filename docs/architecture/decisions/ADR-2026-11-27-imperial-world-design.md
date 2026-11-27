# ADR-2026-11-27: Imperial Novel world design foundation

- **Status:** Proposed in draft PR #396
- **Date:** 2026-11-27
- **Decision owners:** Product owner and frontend platform owner
- **Scope:** `public/imperial-world-design.css` and its existing inclusion from `public/index.html`

## Context

Imperial Novel needs a coherent, original visual identity across discovery, reading, creation, community, and account experiences. The chosen direction is modern imperial luxury with contemporary editorial craft, futuristic restraint, and nature-inspired accents. Earlier high-contrast white and highly saturated purple treatments can create glare, especially during long reading sessions.

## Decision

1. Establish a dedicated, isolated stylesheet loaded after the existing frontend styles.
2. Use a balanced palette built around muted imperial purple, amethyst, sapphire, emerald, restrained champagne accents, obsidian, and warm ivory.
3. Prefer warm, low-glare page and reading surfaces. Decorative colors must not compromise chapter-text contrast.
4. Refine the existing homepage structure through CSS rather than replacing its routing, data, or interaction logic.
5. Keep the implementation dependency-free and responsive, with visible keyboard focus and reduced-motion support.
6. Treat theme coverage as incremental: existing light/dark modes remain the only active theme controls until theme preference and reader settings are implemented and tested end-to-end.

## Boundaries and non-goals

- This decision does not authorize a production deployment or a database/schema change.
- It does not claim that all routes have been visually redesigned or accessibility-audited.
- It does not add external fonts, remote image dependencies, tracking, or paid services.
- It does not change story content, ratings, rights status, account data, or application behavior.

## Validation required

- Cloudflare source validation and production build.
- Mobile and desktop visual review on real routes.
- Reader contrast and low-glare review in both supported themes.
- Keyboard focus, reduced-motion, and responsive layout checks.
- Review of the ownership/governance gate before merge.

## Rollback

Remove the stylesheet reference from `public/index.html` and revert `public/imperial-world-design.css`. Existing application styles and application logic remain independent of this layer.
