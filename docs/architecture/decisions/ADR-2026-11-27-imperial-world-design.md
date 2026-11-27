# ADR-2026-11-27: Imperial Novel world design foundation

- **Status:** Proposed in draft PR #396
- **Date:** 2026-11-27
- **Decision owners:** Product owner and frontend platform owner
- **Scope:** `public/imperial-world-design.css` and its existing inclusion from `public/index.html`, covering homepage, discovery/catalog, novel detail, public author, Author Studio, account/library, Community discussions, Notifications, Leaderboard, Tier List, Random Novel, Vote Novels, and Request a New Novel.

## Context

Imperial Novel needs a coherent, original visual identity across discovery, reading, creation, community, and account experiences. The chosen direction is modern imperial luxury with contemporary editorial craft, futuristic restraint, and nature-inspired accents. Earlier high-contrast white and highly saturated purple treatments can create glare, especially during long reading sessions.

## Decision

1. Establish a dedicated, isolated stylesheet loaded after the existing frontend styles.
2. Use a balanced palette built around muted imperial purple, amethyst, sapphire, emerald, restrained champagne accents, obsidian, and warm ivory.
3. Prefer warm, low-glare page and reading surfaces. Decorative colors must not compromise chapter-text contrast.
4. Refine the existing homepage, catalog/discovery, novel-detail, public-author, Author Studio, personal account, and library structures through CSS rather than replacing their routing, data, or interaction logic.
5. Keep the implementation dependency-free and responsive, with visible keyboard focus and reduced-motion support.
6. Preserve the existing reader's six theme choices (light, dark, midnight, sepia, imperial, and cosmic); this stylesheet refines their visual surfaces without changing preference storage or reader behavior.
7. Improve small-screen reading ergonomics with responsive toolbar wrapping, larger touch targets, reduced article padding, and a stacked preference drawer.
8. Apply responsive editorial styling to discovery filters and story details, and provide focused form/layout styling for the existing creator workspace.
9. Give account and library pages a compact responsive dashboard layout, with accessible navigation and low-glare metric surfaces.
10. Refine the existing Community discussion feed and Notifications list with clear unread states, readable metadata, keyboard focus, and mobile spacing without changing their API or read-state behavior.
11. Give Leaderboard, Tier List, Random Novel, Vote Novels, and Request a New Novel cohesive low-glare cards, readable ranking and voting rows, responsive layouts, and visible focus states while preserving their existing APIs and interactions.

## Boundaries and non-goals

- This decision does not authorize a production deployment or a database/schema change.
- It does not claim that all routes have been visually redesigned or accessibility-audited.
- It does not add external fonts, remote image dependencies, tracking, or paid services.
- It does not change story content, ratings, rights status, account data, or application behavior.

## Validation required

- Cloudflare source validation and production build.
- Mobile and desktop visual review on real routes.
- Reader contrast and low-glare review across all six existing reader themes.
- Mobile layout review at narrow viewport widths, including the reader toolbar, preference drawer, catalog filters, story details, and creator form, account dashboard, and library navigation.
- Keyboard focus, reduced-motion, and responsive layout checks.
- Review of the ownership/governance gate before merge.

## Rollback

Remove the stylesheet reference from `public/index.html` and revert `public/imperial-world-design.css`. Existing application styles and application logic remain independent of this layer.
