# ADR-0034: Keep OmniPortal GET routes read-only

- **Status:** Proposed
- **Date:** 2026-11-20
- **Scope:** OmniPortal API read routes and connector registry initialization

## Context

The public OmniPortal status and search GET routes performed database schema setup. Status also seeded connector registry rows. Authenticated import-job and recommendation GET routes likewise called the schema setup helper even though their backing tables are part of the existing migration history. GET requests should not perform hidden schema or seed writes.

## Decision

Remove schema initialization from the public status/search GET routes and authenticated import-job/recommendation GET routes. Move connector registry seeding to the admin-protected connector listing route, which remains responsible for ensuring the OmniPortal tables and columns exist before returning connector administration data.

## Consequences

- Public status/search reads no longer trigger schema setup or connector seeding.
- Authenticated import-job and recommendation reads no longer trigger schema setup.
- Connector registry bootstrap occurs when an administrator opens connector management.
- Existing D1 schema and migration history are unchanged.
- Other calls to the schema helper, including admin mutation/maintenance paths, remain outside this decision and require separate review.

## Validation

`scripts/test-omni-get-readonly.mjs` is included in the build gate. It checks the read-route side-effect boundary and verifies connector initialization remains behind the admin guard. CI and runtime tests remain required before merge.


## Scope limitation
These contracts guarantee that the named route branches do not invoke Omni schema creation and reject unsupported HTTP methods. They do not yet certify that the complete API request is database-read-only: the shared Worker dispatcher still invokes legacy ensureCoreSchema and ensureRuntimeFeatureSchema initialization before route dispatch. Removing those shared initializers requires a separate full schema inventory and production reconciliation; this PR does not claim that work is complete.
