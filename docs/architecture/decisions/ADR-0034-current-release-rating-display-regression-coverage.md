# ADR-0034: Current-release rating display regression coverage

- **Date:** 2026-11-26
- **Status:** Accepted
- **Related:** ADR-0032, ADR-0033, release 17.24.0

## Context

The rating display regression test was pinned to the versioned frontend bundle from release 17.23.0 even though the repository package version had advanced to 17.24.0. That meant the test could pass while no longer checking the bundle selected for the current release.

## Decision

Keep the rating formatter regression test in engineering tooling and resolve the served frontend bundle path from the semantic version in package.json. The test must verify that public/app.js and public/app-{version}.js are byte-for-byte identical before exercising the shared rating formatter.

The regression cases continue to require whole-number labels on the 1–10 scale and truthful handling of missing, invalid, zero, negative, and out-of-range values. The six public rating surfaces must continue using the shared formatter.

This is a test and release-integrity change only. It does not change rating data, Worker APIs, database schema, frontend runtime behavior, or deployment configuration.

## Validation

The normal build invokes scripts/test-rating-display.mjs. Cloudflare source validation and migration governance must pass for the pull request. The test also relies on the release-version gate to ensure the current versioned asset exists.

## Evidence boundary

The change does not claim that live production rating data is correct or that the test has passed until the relevant GitHub Actions checks complete successfully. No production Worker, D1 database, or deployment is changed.
