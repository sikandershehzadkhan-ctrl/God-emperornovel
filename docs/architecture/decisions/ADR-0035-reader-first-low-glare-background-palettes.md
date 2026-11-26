# ADR-0035: Reader-first low-glare background palettes

- Status: Proposed
- Date: 2026-11-26
- Owners: Frontend platform owner

## Context
Reader background preferences belong to the chapter-reading experience and must remain independent from the website-wide Light/Dark setting. Existing reader palettes included near-white backgrounds that can be uncomfortable for readers sensitive to glare. The user reported eye discomfort from the previously bright presentation.

## Decision
Keep the site-wide theme system unchanged. Expand chapter-reader-only choices to fifteen palettes: Soft Paper, Gentle Dark, Midnight, Muted Sepia, Imperial Plum, Cosmic Dusk, Warm Parchment, Oat Milk, Sage Garden, Misty Blue, Dusty Rose, Lavender Mist, Soft Charcoal, Deep Forest, and Quiet Ocean. Use subdued surfaces and matched foreground colors; avoid pure-white reading surfaces and neon text accents. Keep reader preference storage under the existing `imperial_reader_theme` key.

## Scope
The reader theme selector, reader theme preference list, reader-scoped stylesheet, and a dedicated reader theme regression test are changed. The community feed, rating-display, and homepage shelf regression tests resolve the served app bundle from the package version instead of stale hard-coded release filenames, allowing existing build gates to validate the current app source/bundle pair. No account, chapter content, rights, API, database, or deployment behavior changes. Existing saved `light` preference is mapped to Soft Paper by the reader selector, while the new preference is saved only when the reader selects a theme.

## Validation
The build runs a dedicated reader theme regression test covering all 15 option labels, reader/settings selector parity, stylesheet loading, saved legacy preference mapping, source/served-bundle parity, and WCAG AA contrast (4.5:1) for body and muted text. The community-feed, rating-display, and homepage shelf source/bundle checks resolve the current release asset from package.json. Rendered browser testing is still required to assess actual display brightness and visual comfort before release.
