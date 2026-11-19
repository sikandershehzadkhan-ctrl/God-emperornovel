# ADR-0026: Require Explicit Sitemap Classification for Every Exact Page Route

- **Status:** Proposed
- **Date:** 2026-11-19
- **Decision owners:** SEO and routing architecture

## Context

The canonical route registry records exact page routes and a separate static sitemap list. Without a direct contract between each route's declared sitemap policy and runtime membership, metadata can drift while the sitemap array remains internally valid.

## Decision

Every exact page route must declare a non-empty sitemap policy. The canonical registry's `included-in-static-sitemap` declaration must match the runtime static path list exactly. Every runtime static path must have a corresponding exact page record. Noindex routes must never be included.

## Boundaries

Routes explicitly marked `not-in-static-sitemap` remain valid where intentional. This decision does not independently certify whether a page's editorial content is valuable enough to index; it ensures that the chosen policy is explicit and internally consistent.

## Validation

The canonical route registry contract checks all exact page records, static sitemap membership, and noindex exclusion.
