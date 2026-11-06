# ADR-0031: Separate creator workspace from publishing execution

- Status: Accepted and implemented on the reconciliation branch; exact-head validation remains pending.
- Date: 2026-11-06
- Decision owners: creator, publishing, platform-kernel, platform-quality, platform-architecture

## Context

The Author Studio candidate combined creator-facing workflows (private notes, writing goals, feedback, editorial readiness, planning and analytics) with publishing-owned operations (chapter edits, revision history, publication state and scheduled release execution). Importing it as one feature would create competing ownership of chapter lifecycle behavior.

## Decision

1. Creator-facing workspace APIs and UI belong to the creator domain and are implemented in src/features/creator-studio/.
2. Chapter content, revision history, publication state, release schedules and due-publication execution belong to the publishing domain and are implemented in src/features/publishing-studio/.
3. src/index.js remains the platform-kernel composition root. It delegates to the two domain modules and retains unrelated routes and scheduled automation.
4. Shared Worker dispatch, route registries, authorization inventories, package build chain, browser shell and Wrangler configuration require coordinated integration and exact-head validation.
5. Existing migrations 0016, 0017, 0032 and 0033 are canonical and must be reused. No duplicate migration or production migration is authorized by this decision.

## Concurrency and audit invariant

A scheduled publication is successful only when the conditional draft-to-published chapter update changes exactly one row. Schedule deletion, parent novel timestamp update and audit insertion must each be gated by the immediately preceding successful write in the same ordered D1 batch. Notification and success counters must depend on the chapter update result. A competing cron invocation that loses the conditional update must not create an audit record or notification.

The due-row projection must include n.id AS novel_id; the parent novel update must never bind an absent projection field.

## Consequences

- Creator Studio and Publishing Studio have distinct domain owners and implementation modules.
- The canonical Worker composes both modules without replacing its existing runAutomation() scheduled path.
- The Publishing Studio scheduler is wired into the existing scheduled handler. This does not authorize production deployment or migration.
- Candidate-only combined Author Studio dispatch must not be imported; preserve existing creator applications, AI project routes, novels and chapter behavior.

## Validation required before merge or deployment

- Run local D1 integration tests for successful publication, stale schedules, rights changes and two overlapping invocations.
- Verify D1 batch changes() chaining against the supported Wrangler/D1 runtime.
- Verify the existing runAutomation() cron path still executes on every configured schedule.
- Verify notification is emitted once only after the successful chapter transition.
- Run all required exact-head governance, schema parity, route registry, Graphify and Cloudflare source workflows.
- Do not deploy or apply D1 migrations as part of this integration.
