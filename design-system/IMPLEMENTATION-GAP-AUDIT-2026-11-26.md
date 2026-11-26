# Imperial Novel design implementation gap audit

- **Audit date:** 2026-11-26
- **Compared ref:** repository `main` at audit time
- **Scope:** homepage asset loading and current global/luxury CSS files
- **Purpose:** establish a factual baseline before implementing the new original design language.

## Observed runtime wiring

`public/index.html` declares `data-theme="light"` and loads these stylesheets in order:

1. `/style-17.24.0.css`
2. `/app-17.24.0.css`
3. `/imperial-luxury-17.24.0.css`
4. `/imperial-formats-17.24.0.css`
5. `/imperial-comic-reader-17.24.0.css`
6. `/imperial-glass.css`

The app entry script is `/app-17.24.0.js`. This is direct source evidence of the homepage's stylesheet stack; it does not prove all routes load exactly the same stack.

## Measured source baseline

| File | Source size | CSS custom-property declarations/occurrences observed |
| --- | ---: | ---: |
| `public/style.css` | 143,839 characters | 206 |
| `public/imperial-luxury-17.24.0.css` | 26,801 characters | 42 |

The stylesheet contents include repeated definitions for generic variables such as `--bg`, `--panel`, `--text`, `--muted`, and `--violet`, plus multiple `html[data-theme]` override blocks. The luxury layer contains an initial dark palette, then later light/dark token blocks. This is a layered legacy implementation, not yet one canonical semantic-token source.

## Specific gaps against the new design language

1. **Token duplication:** core surface/text/accent roles are declared in multiple layers and use generic names. This makes theme ownership and override precedence harder to reason about.
2. **Palette drift:** the main stylesheet includes violet `#7651d8` and dark-theme violet/gold/electric accents; the luxury layer introduces the signature `#6A0DAD` and `#0F52BA` palette, while also retaining earlier `#8b5cf6` and `#4f8cff` values.
3. **Semantic role coverage:** the new standard requires explicit page/surface/text/border/focus/action/status roles per theme. The observed root declarations are mostly generic colour variables and do not by themselves demonstrate complete role coverage.
4. **Theme implementation proof:** the homepage root defaults to `data-theme="light"`. The CSS source has multiple theme override blocks, but this audit did not execute all six planned themes or verify their persisted settings.
5. **Layer count:** six stylesheets are loaded on the homepage. The design-system migration should reduce competing ownership rather than append another permanent override layer.
6. **No visual certification:** no browser screenshot, contrast run, RTL interaction test, or device-level visual QA was performed in this source-only audit.

## Safe migration sequence

1. Inventory every variable and selector consumer across the six loaded stylesheets and route-specific styles.
2. Define one canonical semantic token contract with complete Light, Dark, Midnight, Sepia, Imperial, and Cosmic values.
3. Map legacy variables to semantic tokens through a temporary compatibility layer; do not bulk-replace by colour alone.
4. Migrate shared components and one representative route at a time, beginning with homepage and reader surfaces.
5. Verify reader contrast, font sizing, keyboard focus, reduced motion, 44px targets, RTL content, and narrow Android layouts.
6. Remove obsolete declarations only after route-level visual and functional checks show no regression.
7. Update versioned asset references and cache policy as part of a separately reviewed release.

## Non-actions and boundaries

This audit does not change CSS, HTML, JavaScript, image files, or production. It does not certify the current visual system as original, accessible, or complete. It is not a full selector-consumer inventory; that requires automated source analysis and browser QA on the full route set.
