# ADR: Execute public author discovery against a local Worker and D1 fixture

- **Date:** 2026-11-06
- **Status:** Proposed, pending review
- **Decision owner:** platform-architecture
- **Technical integrator:** platform-integrator
- **Related change:** Public author discovery follow-up to PR #265

## Context

The public author directory has a source-level regression that checks route text, SQL fragments, registries, localization strings and bundle parity. Those checks do not execute the route or prove its response projection against a database. The authorization matrix's acceptance criteria therefore lacked runtime evidence.

## Decision

Add `scripts/test-worker-public-author-discovery.mjs` to the mandatory build. It starts a local Wrangler Worker backed by a fresh local D1 store, applies repository migrations locally, seeds controlled fixtures, and exercises the real `GET /api/public-authors` endpoint.

The fixture covers:
- multiple eligible authors and works;
- published versus draft works;
- rights-cleared versus pending-rights works;
- valid and invalid rating values;
- zero-view works;
- literal percent, underscore and backslash search characters;
- bounded unfiltered and filtered result counts;
- exact public aggregate fields and absence of account/owner/private rights fields;
- rejection of non-GET methods.

## Isolation and safety

The script explicitly uses Wrangler's local D1 persistence directory and local Worker mode. It does not read production credentials, use a remote D1 database, or deploy a Worker. Temporary local data is removed during cleanup. The existing static test remains in place as a complementary source/registry/bundle contract.

## Scope and non-goals

No migration SQL, API implementation, authorization behavior, route shape, browser bundle or production deployment configuration is changed by this test addition. The test validates the current public aggregate contract; it does not certify browser rendering in every locale. LTR and RTL browser acceptance remains a staging gate until a browser-level CI test is added.

## Verification

Require Architecture Governance, Integration Migration Governance, Route Registry, Runtime Schema Parity, Graphify and Cloudflare Source Validation on the exact PR head. Cloudflare Source Validation must show the new local Worker/D1 test passing as part of `npm run build`. No production D1 access or deployment is permitted.
