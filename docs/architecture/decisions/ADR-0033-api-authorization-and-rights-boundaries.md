# ADR-0033: Source-audited API authorization and object ownership registry

- **Date:** 2026-11-20
- **Status:** Accepted
- **Related:** ADR-0030, ADR-0032, and API-AUTHORIZATION-REGISTRY-01N.json

## Context

The page-shell route registry did not describe every API method or prove the access rules applied to user-owned rows, author resources, rights-gated stories, external connectors, and administrative operations.

The source audit also found gaps: comment list/create/reaction/report handlers did not consistently join to the parent novel's publication and rights state; rating statistics could be read for unpublished or rights-ineligible novels; and bookmark writes did not validate the target novel/chapter. The rating write handler still accepted the legacy 1-5 scale despite the 1-10 database migration.

## Decision

Add a separate API authorization registry that inventories every exact API path/method declaration and dynamic API pattern. It records admin-only, authenticated-user, author-owner, public-rights, Omni connector, and disabled payment-webhook policies.

The Worker now:
- Requires published and eligible-rights parent novels for comment listing, creation, likes, and reports.
- Requires published and eligible-rights novels before returning rating statistics or accepting ratings.
- Accepts only whole-number ratings from 1 through 10.
- Validates bookmark target novels and, when supplied, the published chapter number.
- Keeps OmniPortal imports authenticated and restricted to enabled, rights-authorized connectors.
- Keeps the automated payment webhook disabled until provider signature, amount/currency, event identity, and replay protections are verified.

A build-gated test compares the complete exact API path/method inventory to the registry, checks every admin route and critical dynamic route guard, and verifies user/author ownership scopes and rights filters.

## Validation

The API authorization source test and a Worker-level mock-D1 runtime test run in the normal build sequence alongside route-registry, SEO, and sitemap integration tests. The runtime test exercises admin denial, author object ownership, authenticated user scoping, rights-gated chapter visibility, fractional rating rejection, and bookmark eligibility. Existing Cloudflare source validation and migration governance remain required.

## Evidence boundary

The checks are source-level and use mock-D1 Worker integration only for sitemap behavior. The mock-D1 test does not prove actual SQLite/D1 query execution or live database contents. Seeded SQLite/D1 adversarial tests, live provider/webhook tests, and deployed response-shape verification remain open. No production D1 mutation or deployment is included.
