# Imperial Novel homepage: Unslop source audit

Date: 2026-11-26  
Target: live homepage and the current 17.24.0 source entry points  
Method: source inspection plus live Firecrawl content scrape. A screenshot capture was requested at desktop and mobile sizes, but the returned remote image could not be opened in this review. This is therefore a source/content audit, not a completed screenshot-based visual QA.

## Correct runtime entry points

- Cloudflare serves `public/index.html`, not the root `index.html`.
- `public/index.html` loads `/app-17.24.0.js`, `/style-17.24.0.css`, `/app-17.24.0.css`, `/imperial-luxury-17.24.0.css`, and related release assets.
- Root `index.html` is a small placeholder/demo page with a different title and sample chapter links. Do not mistake it for the production homepage or edit it as the live entry point.
- The actual homepage markup is rendered by `home()` in `public/app-17.24.0.js`.

## Findings

1. **Hero visual column is unoccupied.** The `.nextHero` stylesheet defines a two-column grid, but `home()` renders only `.nextHeroGlow` and `.nextHeroCopy`. The second column has no meaningful story-world artwork or product preview, leaving the hero's composition incomplete.
2. **The hero relies on generic effects.** The base stylesheet defines radial/linear washes, a grid overlay, a blurred glow, gradient headline text and shadow-heavy surfaces. The newer light-theme override removes some of these effects, but dark-theme rules reintroduce radial gradients, grid rings and a gradient CTA.
3. **The homepage's content direction is promising but visually under-expressed.** It already has real product sections for formats, trending stories, latest updates, Creator Studio, Trend Factory and community. The hero should visually express the Imperial Library / story-world concept rather than relying on empty space and decorative effects.
4. **Unicode glyphs are used as category decoration.** The format and feature cards use assorted text glyphs. Review these in the icon pass and normalize to the project's existing SVG icon system where the glyph does not carry literary meaning.
5. **Layered stylesheets need a controlled migration.** The global stylesheet, app stylesheet and imperial-luxury release stylesheet all influence the same hero and shared components. A redesign must be made in the release-owned source and verified against the stylesheet load order; do not append another uncontrolled override layer.
6. **Mobile and RTL need dedicated checks.** Source CSS has mobile breakpoints and the project supports Urdu/Arabic. Verify the hero stack order, search form, touch targets, focus states, reduced motion and logical direction after any change.

## Recommended first implementation pass

Redesign only the homepage hero first:
- Keep the existing copy, search GET action, routes and product claims.
- Fill the empty visual column with a meaningful, real catalog/story-world preview; do not invent ratings, reader counts or story metadata.
- Keep the Imperial Novel identity: warm paper, obsidian, imperial purple and sapphire, with botanical/natural imagery only when it supports the story-world scene.
- Remove decorative glow/grid effects and gradient text; use one intentional rich visual moment and quiet surrounding chrome.
- Preserve responsive stacking and the accessible search form.

## Verification still required

- Render and inspect desktop and mobile screenshots from the actual build.
- Test light, dark and reading themes, plus Urdu/Arabic RTL.
- Run the repository build and relevant homepage/route/accessibility checks.
- Confirm production behavior only after the relevant PR checks and deployment.
