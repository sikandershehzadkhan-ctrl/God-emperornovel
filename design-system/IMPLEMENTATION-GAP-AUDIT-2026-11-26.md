# Imperial Novel design implementation gap audit

- **Audit date:** 2026-11-26
- **Compared ref:** `brand/original-imperial-identity-policy-2026-11-26` (based on main at `c20ef675`)
- **Scope:** homepage asset loading, global/luxury CSS, and theme-controller source
- **Purpose:** establish a factual baseline before implementing the original design language.

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

Counts below were recalculated from the exact versioned files loaded by `index.html` on this branch. A custom-property declaration count includes repeated declarations in selectors; unique names are counted separately.

| File | Source size | Declarations | Unique custom-property names |
| --- | ---: | ---: | ---: |
| `public/style-17.24.0.css` | 144,710 characters | 210 | 53 |
| `public/imperial-luxury-17.24.0.css` | 26,801 characters | 42 | 15 |
| `public/app-17.24.0.css` | 5,801 characters | 3 | 3 |
| `public/imperial-glass.css` | 5,626 characters | 7 | 7 |
| `public/imperial-formats-17.24.0.css` | 8,015 characters | 0 | 0 |
| `public/imperial-comic-reader-17.24.0.css` | 2,138 characters | 0 | 0 |

The main stylesheet has eight `:root` blocks and 53 unique custom-property names. It contains multiple `html[data-theme]` override blocks. The luxury layer adds its own root token blocks and separate light/dark overrides. This confirms competing token definitions rather than one canonical semantic-token source.

## Theme capability: site and reader are separate

Source inspection of `public/app-17.24.0.js` and `public/style-17.24.0.css` confirms:

| Surface | Current supported values | Controller / storage |
| --- | --- | --- |
| Whole website | Light, Dark | `applyImperialTheme()`; `imperial_theme` |
| Long-form reader | Light, Dark, Midnight, Sepia, Imperial, Cosmic | `setReaderTheme()`; `imperial_reader_theme` |

The global controller coerces any value other than `light` to `dark`. The reader's six values are applied to `.readerPage[data-reader-theme]` selectors. Therefore, six global themes are a target specification, not an implemented site-wide feature. The two preferences are independent today.

## Specific gaps against the new design language

1. **Token duplication:** core surface/text/accent roles are declared in multiple layers and use generic names. This makes theme ownership and override precedence harder to reason about.
2. **Palette drift:** the main stylesheet includes legacy violet `#7651d8` and dark-theme violet/gold/electric accents; the luxury layer introduces the signature `#6A0DAD` and `#0F52BA` palette, while retaining earlier `#8b5cf6` and `#4f8cff` values.
3. **Semantic role coverage:** the new standard requires explicit page/surface/text/border/focus/action/status roles per theme. Existing root declarations do not demonstrate complete role coverage.
4. **Global theme coverage:** the site controller supports only Light and Dark. The reader supports six independently. Global Midnight, Sepia, Imperial, and Cosmic remain unimplemented.
5. **Layer count:** six stylesheets are loaded on the homepage. Migration should reduce competing ownership rather than append another permanent override layer.
6. **No visual certification:** no browser screenshot, contrast run, RTL interaction test, or device-level visual QA was performed in this source-only audit.

## Safe migration sequence

1. Inventory every variable and selector consumer across the six loaded stylesheets and route-specific styles.
2. Define one canonical semantic token contract with complete values for the themes that are actually in scope. Keep global-site and reader theme state independent until a deliberate integration decision is tested.
3. Map legacy variables to semantic tokens through a temporary compatibility mapping inside an existing stylesheet; do not add a seventh permanent override file or bulk-replace by colour alone.
4. Migrate shared components and one representative route at a time, beginning with homepage and reader surfaces.
5. Verify reader contrast, font sizing, keyboard focus, reduced motion, 44px targets, RTL content, and narrow Android layouts.
6. Remove obsolete declarations only after route-level visual and functional checks show no regression.
7. Update versioned asset references and cache policy as part of a separately reviewed release.

## Migration slice 1 (2026-11-26)

A first runtime CSS change has now been made on this branch in the existing `public/imperial-luxury-17.24.0.css` file; no seventh stylesheet was added. It defines semantic global Light/Dark tokens for canvas, surfaces, text, muted text, border, accent, action, focus, success, danger, warning, and shadows. Compatibility aliases map the current global legacy variables (`--bg`, `--panel`, `--text`, `--violet`, and related names) to those semantic roles. The site theme contract remains Light/Dark, and the reader theme state remains separate.

Source-level checks on the changed file found 211 opening and 211 closing braces and confirmed the core semantic roles are declared in both global theme blocks. This is only a structural source check. It is not a CSS parser run, build, screenshot review, contrast certification, RTL check, or mobile browser test. Hard-coded legacy colours and the original declarations still exist; this is a compatibility bridge, not a completed stylesheet consolidation.


### Core token-pair contrast calculation

A separate sRGB/WCAG relative-luminance calculation on the new token values produced these foreground/background ratios:

| Pair | Contrast ratio |
| --- | ---: |
| Light primary text / canvas | 18.28:1 |
| Light muted text / canvas | 6.20:1 |
| Light purple accent / white | 9.24:1 |
| Light sapphire action / white | 7.15:1 |
| Dark primary text / canvas | 16.01:1 |
| Dark muted text / canvas | 10.12:1 |
| Dark purple accent / dark surface | 6.64:1 |
| Dark sapphire action / dark surface | 6.73:1 |
| Light warning / canvas | 5.90:1 |
| Dark warning / canvas | 11.51:1 |

These selected token pairs exceed WCAG AA's 4.5:1 normal-text threshold. This is a calculation of selected token pairs only, not a whole-interface accessibility certification. Every actual text/background pairing, disabled state, hover/focus state, border, chart, icon, and overlay still requires route-level review.

## Remaining boundaries

No HTML, JavaScript, database, Worker configuration, secrets, image assets, or production deployment changed. The new visual tokens are not certified accessible or visually correct until measured and tested in a real browser across the supported route set. The asset provenance gaps remain open. This audit is not a complete selector-consumer inventory; that requires automated source analysis and browser QA.
