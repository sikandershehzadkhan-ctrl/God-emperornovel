# Imperial Novel homepage: Unslop source audit

Date: 2026-11-26  
Target: live homepage and current 17.24.0 source entry points  
Method: source inspection plus live Firecrawl content scrape. Desktop and mobile screenshot capture was requested, but the returned remote image could not be opened in this review. This is a source/content audit, not completed screenshot-based visual QA.

## Correct runtime entry points

- Cloudflare serves `public/index.html`, not the root `index.html`.
- `public/index.html` loads `/app-17.24.0.js`, `/style-17.24.0.css`, `/app-17.24.0.css`, `/imperial-luxury-17.24.0.css`, and related release assets.
- Root `index.html` is a small placeholder/demo page with a different title and sample chapter links. Do not mistake it for the production homepage or edit it as the live entry point.
- The actual homepage markup is rendered by `home()` in `public/app-17.24.0.js`.

## Findings

1. **Theme-dependent hero grid inconsistency.** The approved Imperial Archive direction explicitly calls for a single-column editorial hero with no portal card or decorative image dependency. Dark theme already sets one grid column. Light theme inherited the old two-column `.nextHero` grid, reserving an empty second track. This is a CSS consistency defect, not a missing artwork requirement.
2. **Legacy effects remain in shared base styles.** The base stylesheet defines radial/linear washes, a grid overlay, blurred glow, gradient headline text and shadow-heavy surfaces. Later release rules suppress some effects in dark mode, while light mode and some theme combinations can inherit parts of the older system.
3. **The homepage content direction is promising.** It already has product sections for formats, trending stories, latest updates, Creator Studio, Trend Factory and community. The hero should remain a focused editorial entry point rather than becoming a generic dashboard or a fake product-preview card.
4. **Unicode glyphs are used as category decoration.** The format and feature cards use assorted text glyphs. Review these in a separate icon pass and normalize to the project's existing SVG icon system where a glyph does not carry literary meaning.
5. **Layered stylesheets need controlled ownership.** The global stylesheet, app stylesheet and imperial-luxury release stylesheet all influence the hero and shared components. Keep the hero's new rules in one final, explicitly loaded, versioned homepage stylesheet and include it in the service-worker core precache.
6. **Mobile and RTL need dedicated checks.** Preserve the mobile search layout, touch targets, focus states, reduced motion and Urdu/Arabic directionality after changes.

## First implementation pass completed in the feature branch

- Added `public/imperial-homepage-17.24.0.css` as a final, versioned homepage layer.
- Made the editorial hero single-column in all themes, fixing the light-theme empty grid track.
- Replaced gradient headline text with a solid accessible purple accent; removed hero glow/grid pseudo-elements and shadows.
- Set warm paper (#FDFBF7) for light mode and obsidian surfaces (#111A1F / #0B1215) for dark mode, with amethyst accent in dark mode.
- Preserved the existing hero copy, GET search action, query field, routes and catalog claims.
- Added mobile stacking, 44px search controls, reduced-motion and forced-colors rules.
- Added the stylesheet to the production HTML entry and service-worker precache.
- Added a focused regression test to the build script.

## Verification still required

- Run the repository build and relevant homepage/route/accessibility checks.
- Render and inspect desktop and mobile screenshots from the actual build.
- Test light, dark, reading themes and Urdu/Arabic RTL.
- Confirm production behavior only after the relevant PR checks and deployment.
