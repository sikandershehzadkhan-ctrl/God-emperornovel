# ADR-0032: One authoritative novel rating write handler

- **Status:** Proposed
- **Date:** 2026-11-20
- **Scope:** `POST /api/rating`

## Context

The Worker API dispatcher contained two matching `POST /api/rating` branches. The earlier branch checked that the target novel was published and had an eligible rights status. A later duplicate branch repeated the write but omitted that eligibility check. The earlier branch returned first, making the weaker duplicate unreachable in the current ordering, but retaining it created a route-order regression hazard.

## Decision

Keep one authoritative `POST /api/rating` handler. It must require an authenticated user, validate the rating value, verify publication and rights eligibility before writing, and update the novel's aggregate rating. Add a build-gated regression check that enforces uniqueness and the core authorization/eligibility conditions.

## Consequences

- There is one source location to maintain for rating writes.
- A future route reordering cannot accidentally expose the weaker duplicate implementation.
- The uniqueness test is intentionally a source-level guard; it does not replace integration tests against D1 or confirm the rating scale migration.

## Validation

`scripts/test-rating-handler-uniqueness.mjs` is included in the standard build gate. Cloudflare Source Validation, Migration Governance, and Graphify CI must pass before merge.
