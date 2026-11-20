# ADR-0022: Fine-Grained Public Asset Ownership

- **Status:** Proposed
- **Date:** 2026-11-19
- **Decision owners:** Platform architecture and frontend runtime

## Context

A single `public/` owner concealed materially different responsibilities: page shells, canonical runtime sources, historical versioned bundles, brand assets, crawl policy, release notes, and cover media.

## Decision

Replace the broad public catch-all with seven explicit owner groups: page shells, release notes, versioned release artifacts, canonical runtime sources, brand assets, crawl/sitemap policy, and the cover library.

Every group requires an ADR or feature contract for changes. A build-gated test enumerates tracked public files, verifies their classification and exact single ownership, and rejects a reintroduced catch-all.

## Boundaries

This ownership policy does not certify asset licensing, visual quality, runtime behavior, or release reproducibility. Historical versioned assets are retained.

## Validation

The public ownership test runs in the standard build and verifies the tracked Git inventory, exact classification, unique ownership, and explicit cover-library boundary.
