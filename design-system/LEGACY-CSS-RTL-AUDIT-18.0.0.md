# Legacy CSS Directionality Audit 18.0.0

**Audit target:** PR #295 candidate commit `739ca677a8fdeead08d4ea8119a2667fb826c8ee`  
**Runtime asset version observed:** `17.23.0` in `package.json` and `wrangler.toml`  
**Scope:** source-level scan of Worker-served stylesheets registered by `src/index.js`. This is not browser visual QA.

## 1. Physical-direction declaration inventory

The scan counted physical CSS property declarations, not selector count. These declarations are not automatically defects: some are intentional LTR compositions, decorative positioning, or border accents. They do mean the stylesheet cannot be considered direction-neutral without component-level review.

| Stylesheet | Physical declarations | Observed properties |
|---|---:|---|
| `public/style-17.23.0.css` | 9 after targeted patches | margin-left: 4; margin-right: 2; border-left: 1; border-left-color: 1; right: 1 |
| `public/app-17.23.0.css` | 0 after targeted patch | community reply indentation now uses `margin-inline-start` at desktop and mobile widths |
| `public/imperial-luxury-17.23.0.css` | 0 after targeted patch | dark archive hero celestial ornaments now use logical inline-end positioning at desktop and mobile widths |
| `public/imperial-formats-17.23.0.css` | 0 after targeted patch | homepage format arrow now uses `margin-inline-start` |
| `public/imperial-comic-reader-17.23.0.css` | 0 | none found |
| `public/imperial-glass.css` | 0 | none found |
| `public/imperial-design-tokens.css` | 0 | none found |
| `public/imperial-ui-primitives.css` | 0 | none found |

The new token and primitive layers are clean in this scan. The safe, component-scoped direction assumptions found in community reply indentation, homepage format arrow, mobile navigation viewport anchoring, catalog metadata alignment, catalog status badge anchoring, reader lock-action spacing, menu drawer anchoring and RTL slide direction, active navigation indicators, menu icon spacing, legal list and notice accents, active filter label spacing, Trend Factory note accents, tooltip centering, homepage celestial artwork positioning, and archive hero desktop/mobile ornaments were migrated to logical properties and guarded by the design-system contract test. Remaining physical declarations in the main stylesheet are now concentrated in reader drawer anchoring/borders and a small number of icon/status/navigation spacing rules. Homepage celestial ornaments, archive hero ornaments, tooltip centering, legal accents, and Trend Factory note accents now use logical properties. The declaration inventory alone cannot determine which ones need mirroring. The latest homepage/luxury visual slice reduced the main stylesheet's physical-direction inventory from 28 to 9 declarations and the luxury stylesheet from 4 to 0.

## 2. Responsive breakpoint inventory

Observed width breakpoints include 360px and 390px in the main stylesheet, plus 420px, 520px, 600px, 620px, 640px, 650px, 680px, 700px, 760px, 900px, 980px, 1050px and 1100px across the registered stylesheets.

A dedicated 320px media query was not found in the scanned stylesheets. This is a review trigger, not proof of a 320px overflow: fluid sizing and wrapping may still work without a dedicated breakpoint. The 320 CSS-pixel reflow gate must be checked in a browser.

## 3. Route-adoption implications

The existing route/template inventory contains 33 explicit static routes and dynamic novel, chapter, reader, format, fandom, author and not-found patterns. Shared stylesheet registration guarantees delivery, not component adoption. Several route families still use legacy classes and need route-level checks.

Do not globally replace physical properties with logical properties. Review declarations by component and state, preserving deliberate LTR iconography, artwork composition, and visual accents where appropriate. For each changed family, verify English LTR and Urdu, Arabic and Persian RTL, including open/closed drawers, active navigation, tooltips, chapter lists, and overlays.

## 4. Release consistency finding

The PR is titled for design system v18.0.0, while the inspected candidate's `package.json` version and `wrangler.toml` `APP_VERSION` are both `17.23.0`. The Worker rewrites versioned asset URLs from `APP_VERSION`, so this is a release-governance mismatch that must be explicitly reconciled before any production release. Do not silently rename assets or bump the version as part of an RTL-only patch.

## 5. Next bounded implementation order

1. Reader: chapter drawer anchoring and border, toolbar, progress and text/comic controls.
2. Shell/navigation: remaining header and icon/status spacing.
3. Discovery: filter chips, cards, catalog metadata and pagination.
4. Account and creator surfaces: account menu, settings controls, studio panels.
5. Special surfaces: remaining community and standalone templates.

For each slice: make only component-scoped logical-property changes; add a source regression check for the migrated selectors; preserve route/API/authorization behavior; then capture desktop, tablet, 390px, 360px and 320px screenshots in English and RTL locales.

## 6. Current status

- Source inventory completed for the eight registered stylesheets listed above.
- New token and primitive stylesheets contain no physical left/right declarations in the scan.
- Remaining legacy declarations are catalogued; no global rewrite was applied.
- 320px and multilingual browser visual QA remain outstanding.
- No merge, production deployment, or runtime behavior change is claimed.
