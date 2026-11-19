# ADR-0023: Keep the Static Sitemap Fallback Identical to the Canonical Route Registry

- **Status:** Proposed
- **Date:** 2026-11-19
- **Decision owners:** SEO, routing and release engineering

## Context

The Worker-generated static sitemap is derived from the canonical route registry, while `public/sitemap.xml` remains a static fallback artifact. A partial assertion that checks only a few expected URLs can allow the fallback to drift, omit indexable routes, or accidentally include a noindex utility route.

## Decision

The dynamic sitemap contract must parse the fallback XML and compare its complete ordered URL path list against `SITEMAP_STATIC_PATHS`. It must also prove that no exact noindex route appears in the fallback. This test runs in the normal build.

## Boundaries

This verifies source artifacts and generated XML logic. It does not prove that the production Worker has been deployed or that production D1 contains eligible novels and chapters.

## Validation

The dynamic sitemap test validates exact static fallback parity, noindex exclusion, dynamic index pagination, rights-filtered novel/chapter query constraints, and sitemap route wiring.
