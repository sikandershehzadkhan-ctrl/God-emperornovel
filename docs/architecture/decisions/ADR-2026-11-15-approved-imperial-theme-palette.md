# ADR: Approved Imperial palette for the current global themes

- Status: Proposed
- Date: 2026-11-15
- Scope: `public/imperial-luxury-17.23.0.css`

## Context

The existing global luxury stylesheet uses colors that drift from the approved Imperial Novel identity and applies a near-white, high-glare canvas in the light theme. The site's current runtime exposes two global themes (light and dark), while the reader has separate reading-theme preferences. This change must not imply that all six planned global themes are implemented.

## Decision

Keep the brand anchors exact:

- Pure White: `#FFFFFF`
- Obsidian: `#0B1215`
- Imperial Purple: `#6A0DAD`
- Sapphire Blue: `#0F52BA`

Use a softened semantic palette for the currently supported global themes:

- Light: paper surface `#FDFBF7`, white cards, Obsidian text, muted text `#53636A`.
- Dark: Obsidian surface `#0B1215`, raised cards `#151F24`, primary text `#E8EDEF`, muted text `#AAB7BC`, accessible accent tints `#C08AFF` and `#6AA5FF`.

Keep reader theme selection independent. Do not advertise Midnight, Sepia, Imperial, or Cosmic as global themes until their selector, persistence, token coverage, and regression tests are implemented.

## Accessibility and performance

The changed foreground/background pairs were checked against WCAG AA text contrast (4.5:1); each checked pair passed. Visible keyboard focus remains explicit. Mobile glass blur remains disabled to avoid unnecessary rendering cost on lower-powered devices.

## Release and rollout

This PR changes source only. It does not deploy to Cloudflare, alter D1, or change user preferences. Before production rollout, move the stylesheet into a cache-busted release asset, run the complete release validation, and verify computed styles and native controls on mobile and desktop in both supported global themes.

## Rollback

Revert the stylesheet change. No data migration or user-data rollback is required.
