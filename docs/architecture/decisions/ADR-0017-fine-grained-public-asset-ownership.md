# ADR-0017: Fine-Grained Public Asset Ownership

- **Status:** Proposed
- **Date:** 2026-11-20
- **Decision owners:** Frontend platform and repository architecture

## Context

The canonical ownership registry previously assigned all of `public/` to one frontend owner. The current mainline contains 162 public files spanning 25 HTML page shells, seven release notes, 103 versioned release artifacts, six editable runtime sources, 11 brand/media assets, two crawl-policy files, and the cover library.

## Decision

Replace the broad `public/` catch-all with seven explicit owner groups: page shells, release notes, versioned release artifacts, editable runtime sources, brand/media assets, crawl/sitemap policy, and cover library.

Every public file must match exactly one category. New public files are classified by a build-gated test and must be assigned to the matching explicit owner. No broad `public/` fallback is permitted. Historical versioned artifacts are retained.

## Boundaries

- This is repository ownership governance, not a visual QA or rights certification.
- Versioned assets remain immutable release artifacts; this ADR does not authorize deletion.
- Cover images require a separate provenance and rights review.
- Runtime page and crawler behavior remain governed by the canonical route and sitemap registries.

## Validation

The public-domain test runs in the standard build and rejects unclassified files, duplicate ownership, or a reintroduced catch-all. Migration Governance verifies repository-wide ownership and decision evidence.
