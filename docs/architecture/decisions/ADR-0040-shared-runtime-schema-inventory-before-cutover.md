# ADR-0040: Inventory shared runtime schema bootstrap before migration cutover

- **Status:** Accepted for source-level governance; production cutover remains blocked
- **Date:** 2026-11-20
- **Decision owners:** Database and production operations; Worker runtime; platform architecture and release

## Context

The Worker API dispatcher invokes shared core and runtime-feature schema initializers before ordinary API route dispatch. The scheduled Worker entrypoint also invokes the core initializer. These initializers contain a mixture of DDL, data backfills, cleanup, reference-data seeding, and schema-version marker writes.

Canonical migrations now cover much of this behavior, but source inspection identified remaining runtime-only schema operations: two comment columns, the community taxonomy submissions table, and eight optional connector configuration columns. The remote production D1 schema and exact applied migration history have not yet been inspected. Therefore neither source presence nor fresh-SQLite migration replay can prove which operations production still needs.

## Decision

1. Maintain `docs/production/SHARED-RUNTIME-SCHEMA-INVENTORY.md` as the source-to-migration map and explicit blocker register.
2. Add `scripts/test-shared-runtime-schema-inventory.mjs` to the Cloudflare build so covered schema areas and known outstanding runtime DDL remain visible to CI.
3. Link the inventory from the canonical production D1 release plan.
4. Do not remove, bypass, or claim read-only behavior for the shared initializers until an explicitly approved read-only production D1 audit, exact migration reconciliation, and production-shaped rehearsal are complete.
5. Do not allocate or apply new migration numbers for the outstanding structures until the remote definitions and existing data are known. Migration 0047 remains retired and is never reused.
6. Treat the runtime marker writes, auth-rate-limit cleanup, taxonomy/agent seeding, and scheduled-handler bootstrap as separate responsibilities that must receive deliberate replacements before the legacy initializers are removed.

## Consequences

- Runtime schema debt is explicit rather than hidden behind route-level GET tests.
- CI protects the inventory from accidental removal or undocumented source drift.
- The current PR remains a draft and is not production-release-ready.
- No production database query, mutation, migration, backup, restore, or Worker deployment is authorized by this decision.

## Verification

The Cloudflare build runs `scripts/test-shared-runtime-schema-inventory.mjs`. Migration governance validates ownership and ADR coverage for the new production document, engineering test, and build-script change.
