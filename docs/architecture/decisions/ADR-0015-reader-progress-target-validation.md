# ADR-0015: Validate reader progress against published chapter targets

- **Status:** Proposed
- **Date:** 2026-11-05
- **Decision owners:** Reader domain and platform kernel

## Context

The bookmark and history POST handlers accepted client-supplied novel and chapter values without proving that the chapter existed, belonged to that novel, or was published. History checked novel visibility only. Invalid targets and cross-novel chapter-number mismatches could therefore be persisted.

## Decision

1. Parse novel and chapter identifiers as positive safe integers.
2. Resolve the exact pair using a join between `novels` and `chapters`.
3. Require the novel to be published and rights-eligible, and the chapter itself to be published.
4. Perform no write when validation fails.
5. Derive the user owner exclusively from the authenticated session; never accept a user identifier from the request.
6. Reuse existing routes and tables. Add no migration.

## Consequences

- Invalid, draft, missing and cross-novel targets are rejected before mutation.
- Existing bookmark and history rows remain unchanged on rejected requests.
- No schema change or production data migration is required.
- GET route behavior is unchanged.

## Validation

The JavaScript test covers malformed and unsafe identifiers plus Worker handler guards. The SQLite integration test replays canonical migrations and verifies chapter/novel relationship and publication constraints, including rejected-target non-mutation. Authorization matrix entries document session-owner scoping. A dedicated cross-account Worker/D1 runtime test remains required before security sign-off.
