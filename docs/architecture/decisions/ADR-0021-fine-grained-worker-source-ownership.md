# ADR-0021: Fine-Grained Worker Source Ownership

- **Status:** Proposed
- **Date:** 2026-11-19
- **Decision owners:** Platform architecture and engineering governance

## Context

The repository-wide ownership map covered all Worker source through one broad `src/` owner. That prevented unowned files but did not express responsibility for routing, security, publishing policy, catalog projection, runtime schema, or React community components.

## Decision

Replace the broad source catch-all with explicit ownership for the Worker composition entrypoint, route and sitemap policy, authentication, connector security, content policy, author application policy, donation policy, public novel projection, runtime schema, and React reader/community components.

All source owners require an ADR or feature contract for changes. A build-gated test enumerates tracked source files and verifies exact single ownership. New source files must be assigned before integration.

## Boundaries

This is an ownership boundary, not a claim that `src/index.js` has already been decomposed or that dependency direction is fully clean. Those remain separate engineering tasks.

## Validation

The source ownership test runs in the standard build and checks the tracked Git inventory, owner uniqueness, no catch-all, and exact domain assignments.
