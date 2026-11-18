# ADR-0017: Fine-Grained Public Asset Ownership

- **Status:** Proposed
- **Date:** 2026-11-18
- **Decision owners:** Architecture contracts and frontend runtime

## Context

The repository-wide ownership map covered all public assets through one broad `public/` owner. That prevented unowned files but did not distinguish HTML page shells, canonical runtime sources, generated version-stamped release artifacts, crawl policy, release notes, brand assets, and the cover library.

The audited source tree contains 162 tracked public files, including 103 versioned runtime artifacts and eight cover images.

## Decision

Replace the broad `public/` ownership catch-all with seven explicit owner groups:

- Page shells (25 HTML documents).
- Release notes (7 Markdown documents).
- Versioned runtime artifacts (103 release-stamped files).
- Canonical runtime sources (6 editable runtime files).
- Brand and static media assets (11 files).
- Crawl and sitemap policy (2 files).
- Cover library (`public/covers/`).

All these owners require an ADR or feature contract for changes. Add a build-gated test that enumerates tracked public files, classifies each file into exactly one expected owner, and rejects unclassified files or a reintroduced broad catch-all.

## Boundaries

- Versioned assets remain release artifacts; this decision does not authorize deleting historical bundles.
- Cover images remain a separate media-library responsibility.
- This does not certify image rights, asset quality, frontend behavior, or release reproducibility.
- Ownership outside `src/` and `public/` may still use coarse initial boundaries and remains subject to separate refinement.

## Validation

The public ownership test must pass in the normal build. Migration governance must confirm complete tracked-path coverage, no overlaps, and same-PR ADR coverage.
