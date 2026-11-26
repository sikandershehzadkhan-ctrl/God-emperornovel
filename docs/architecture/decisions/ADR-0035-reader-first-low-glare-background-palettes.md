# ADR-0035: Reader-first low-glare background palettes

- Status: Proposed
- Date: 2026-11-26
- Owners: Frontend platform owner

## Context
Reader background preferences belong to the chapter-reading experience and must remain independent from the website-wide Light/Dark setting. Existing reader palettes included near-white backgrounds that can be uncomfortable for readers sensitive to glare. The user reported eye discomfort from the previously bright presentation.

## Decision
Keep the site-wide theme system unchanged. Expand chapter-reader-only choices to fifteen palettes: Soft Paper, Gentle Dark, Midnight, Muted Sepia, Imperial Plum, Cosmic Dusk, Warm Parchment, Oat Milk, Sage Garden, Misty Blue, Dusty Rose, Lavender Mist, Soft Charcoal, Deep Forest, and Quiet Ocean. Use subdued surfaces and matched foreground colors; avoid pure-white reading surfaces and neon text accents. Keep reader preference storage under the existing `imperial_reader_theme` key.

## Scope
The reader theme selector, reader theme preference list, and reader-scoped stylesheet are changed. The community feed regression test also resolves the served app bundle from the package version instead of a stale hard-coded release filename, allowing the existing build gate to validate the current app source/bundle pair. No account, chapter content, rights, API, database, or deployment behavior changes. Existing saved `light` preference is mapped to Soft Paper by the reader selector, while the new preference is saved only when the reader selects a theme.

## Validation
Validate JavaScript syntax, stylesheet loading, selector coverage, existing reader preference persistence, and release asset parity. The build's community-feed source/bundle equality check must use the package's current release version. Visual comfort and WCAG contrast must be confirmed in rendered browser testing before release.
