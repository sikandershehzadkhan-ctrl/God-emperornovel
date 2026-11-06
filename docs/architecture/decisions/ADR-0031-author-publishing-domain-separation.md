# ADR-0031: Separate creator workspace from publishing execution

- Status: Accepted for integration design; runtime wiring remains pending.
- Date: 2026-11-06
- Decision owners: creator, publishing, platform-kernel, platform-quality, platform-architecture

## Context

The Author Studio candidate combines creator-facing workflows (private notes, writing goals, feedback, editorial readiness, planning and analytics) with publishing-owned operations (chapter edits, revision history, publication state and scheduled release execution). It also introduces a Worker dispatch hook and a cron hook. Importing that candidate as one feature would create a second owner for publishing behavior and risk replacing the canonical Worker's existing scheduled automation.

## Decision

1. Creator-facing workspace APIs and UI belong to the `creator` domain.
2. Chapter content, revision history, publication state, release schedules and due-publication execution belong to the `publishing` domain.
3. `src/index.js` remains the platform-kernel composition root. Feature modules may be called from it, but may not replace unrelated scheduled automation.
4. Shared Worker dispatch, route registries, authorization inventories, package build chain, browser shell and Wrangler configuration require coordinated integration and exact-head validation.
5. Existing migrations `0016`, `0017`, `0032` and `0033` are canonical and must be reused. No duplicate migration or production migration is authorized by this decision.

## Concurrency and audit invariant

A scheduled publication is successful only when the conditional draft-to-published chapter update changes exactly one row. Schedule deletion, parent novel timestamp update and audit insertion must each be gated by the immediately preceding successful write in the same ordered D1 batch. Notification and success counters must depend on the chapter update result. A competing cron invocation that loses the conditional update must not create an audit record or notification.

The due-row projection must include `n.id AS novel_id`; the parent novel update must never bind an absent projection field.

## Consequences

- Creator Studio and Publishing Studio can evolve without competing ownership of chapter state.
- The existing automation scheduler remains intact when the publishing processor is eventually composed into `scheduled()`.
- This decision does not itself expose APIs, load browser assets, alter routes, change cron cadence, or enable scheduled publication in production.
- A future integration change must add feature contracts, route/method and authorization inventory entries, tests, source fingerprints and CI evidence in the same reviewed slice.

## Validation required before runtime integration

- Run a local D1 integration test for successful publication, stale schedules, rights changes and two overlapping invocations.
- Verify D1 batch `changes()` chaining against the supported Wrangler/D1 runtime.
- Verify the existing `runAutomation()` cron path still executes on every configured schedule.
- Verify notification is emitted once only after the successful chapter transition.
- Run all required exact-head governance, schema parity, route registry, Graphify and Cloudflare source workflows.
- Do not deploy or apply D1 migrations as part of this integration.
