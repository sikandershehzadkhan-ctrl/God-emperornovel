# ADR-0042: Inject the platform audit service into Creator Studio

- Status: Accepted
- Date: 2026-11-08
- Decision owners: creator, platform-kernel, platform-architecture

## Context

Creator Studio records audit events for story-goal changes and other private editorial actions. The Creator Studio module called the platform audit function, but the Worker composition did not pass that dependency into the module. The resulting undefined callback caused authenticated goal writes to return an internal server error after their database operation.

## Decision

Treat audit logging as an explicit platform-kernel dependency. Inject the existing audit callback into handleCreatorStudioRequest and declare it in the module's handler contract. Keep the audit implementation centralized in the Worker; do not duplicate audit SQL in the feature module or expose internal audit errors to clients.

## Consequences

- Creator Studio audit calls use the same platform audit implementation as other Worker domains.
- Story-goal writes can complete without an undefined callback failure.
- Worker source and feature source fingerprints in the API and authorization inventories must match the exact committed files.
- Future feature modules must declare injected platform services explicitly in their composition contract.

## Validation

- Run the full Worker two-account account/reader isolation integration test.
- Verify goal create, update, clear and owner-transfer isolation behavior.
- Run Creator/Publishing domain-boundary tests, API route inventory checks and architecture governance.