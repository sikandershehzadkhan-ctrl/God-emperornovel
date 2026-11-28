# ADR-0035: Imperial user XP ledger and leaderboard data boundary

- **Date:** 2026-11-28
- **Status:** Proposed
- **Related:** ADR-0033, ADR-0034, ADR-0009, ADR-0011

## Context

Imperial Novel's existing leaderboard ranks novels and authors. User rank progression requires an auditable source of XP and a separate visibility preference. The application must not trust client-supplied XP, event types, user IDs, or founder flags.

## Decision

1. Use migration 0050 to add an XP ledger with integer deltas, a constrained event taxonomy, globally unique source-event keys, timestamps, and a foreign key that cascades with account deletion.
2. Derive current XP as the sum of ledger deltas. Do not persist a mutable client-controlled XP balance or a rank snapshot in this table.
3. Use `users.imperial_rank_visibility`, default off, as the user's opt-in preference for public user-ranking participation.
4. Keep the rank catalogue in application code. This database migration does not store founder identity, founder designation, account roles, or permissions.
5. Only trusted server-side handlers may append XP after verifying the underlying event and deriving the account ID from the authenticated session. A source-event key must be stable and idempotent.
6. Raw page views, page refreshes, account creation, self-likes, repeated actions, purchased tickets, and purchased currency are not XP sources.
7. Existing novel and author leaderboard queries remain unchanged until user leaderboard APIs are separately integrated and authorized.
8. Account deletion removes XP ledger rows through the user foreign-key cascade.

## Delivery boundary

Migration 0050 and a SQLite regression test establish the data foundation only. This change does not award XP, add API routes, expose a user leaderboard, change profile UI, assign rank 50, or deploy production D1.

## Acceptance

- New users default to rank leaderboard visibility off.
- XP deltas must be nonzero integers within the bounded range.
- Event types are constrained to the reviewed allowlist.
- Source-event keys are globally unique and bounded.
- Ledger rows cannot reference nonexistent users and are removed when a user is deleted.
- Query indexes support per-user progression and time-windowed leaderboard aggregation.
- No production database mutation or Worker deployment occurs.
