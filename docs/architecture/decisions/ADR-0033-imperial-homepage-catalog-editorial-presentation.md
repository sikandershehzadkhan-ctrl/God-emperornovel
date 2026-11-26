# ADR-0033: Imperial homepage and catalog editorial presentation

- **Date:** 2026-11-26
- **Status:** Accepted
- **Related:** ADR-0032, ADR-0010, and the Imperial Unslop design direction

## Context

The homepage and catalog had accumulated competing visual treatments, including legacy glass-like surfaces, gradient washes, and inconsistent light-theme layout behavior. The homepage also loaded its trending and latest shelves through a single `Promise.all`, so one failed catalog request caused both shelves to display an error. The current app runtime is versioned and must remain synchronized with its editable source and tests.

## Decision

1. Keep the Imperial Novel visual identity original. The upstream Unslop skill is used as licensed design guidance only; its upstream license and attribution remain intact, and Imperial Novel-specific overrides remain separate.
2. Use warm-paper light surfaces, obsidian dark surfaces, restrained Imperial purple accents, clear typography, and quiet editorial card chrome across the homepage and catalog.
3. Preserve existing catalog API contracts, rights eligibility, filters, sort behavior, page size, story projections, routes, and chapter/story content. This presentation change must not fabricate recommendations, reader activity, ratings, or content.
4. Load trending and latest homepage shelves independently with settled request results. A failure in one shelf must not hide successful results from the other. The latest shelf must retain its existing cross-shelf de-duplication behavior when trending data is available.
5. Treat the versioned browser runtime selected by `package.json` as the current served application source. Keep `public/app.js` synchronized with `public/app-<version>.js`, and make runtime parity tests resolve the current package version rather than hard-code an older bundle.
6. Keep the new Unslop skill under a dedicated, explicitly owned agent-guidance path. It is advisory tooling and is not part of the production runtime or asset bundle.

## Consequences

- Homepage and catalog styling changes are scoped to the approved Imperial editorial direction and preserve the existing product behavior.
- The homepage can still show one successful shelf when the other catalog endpoint is unavailable.
- Build validation catches stale editable/served runtime pairs and shelf regression behavior.
- The agent-skill path has an explicit owner in the canonical ownership registry.
- No database migration, payment behavior, authentication policy, rights policy, or production deployment is changed by this ADR.

## Validation

The PR's Cloudflare source-validation workflow runs the full build, including runtime parity and homepage/catalog regression tests, then performs Worker dry-run and production safety checks. Browser screenshot QA and deployment remain separate release gates.
