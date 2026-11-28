# ADR-0033: Imperial user-rank progression and founder designation

- **Date:** 2026-11-28
- **Status:** Proposed
- **Related:** ADR-0008, ADR-0009, ADR-0010, ADR-0021, ADR-0032

## Context

The existing `/api/leaderboard` and `/leaderboard` experience ranks novels and authors. It does not yet provide an earned user-rank progression. A separate user system is needed without replacing the existing story and author rankings.

The product has approved a 50-entry rank catalogue. Ranks 1–49 are earned progression tiers. Rank 50, **Imperial God Emperor**, is a founder-only designation and must never be granted by XP, client input, leaderboard position, or ordinary administration UI.

## Decision

1. Keep the existing novel and author leaderboard data and presentation intact.
2. Define a canonical immutable catalogue of 49 earned ranks and one founder-only designation.
3. Resolve earned rank from server-controlled XP thresholds only. The pure catalogue module does not accept or infer founder identity.
4. Keep rank separate from account role and authorization. No rank grants admin, moderation, payment, or data-access privileges.
5. Record future XP awards in an auditable, idempotent server-side ledger. Only verified, eligible events may award XP; page refreshes, raw views, self-actions, repeated likes, account creation, and purchased currency are not XP sources.
6. User leaderboard positions are time-windowed competitive snapshots (weekly, monthly, all-time), separate from permanent rank progression.
7. Public leaderboard output must use minimal public profile fields and respect account visibility, bans, deletion, and opt-out policy.
8. Founder designation must be bound to a verified, server-controlled owner identity/configuration. Never trust a client-supplied role, user ID, username, email, or `isFounder` flag.

## Delivery boundary

This first foundation change adds the catalogue and pure progression resolver plus deterministic tests. It does not create D1 tables, award XP, expose a new API, change the current leaderboard UI, assign the founder designation, or deploy the Worker. Those require a separately reviewed schema/API integration after the canonical migration foundation and ownership/auth registries are reconciled.

## Acceptance criteria

- Exactly 50 named entries exist, with 49 strictly increasing earned XP thresholds.
- Rank 50 has no XP threshold and cannot be returned by the progression resolver.
- Invalid, negative, fractional, and very large XP inputs are handled deterministically.
- Rank resolution never changes account roles or authorization.
- Existing novel/author leaderboard behavior remains unchanged.
- No production D1 mutation or deployment occurs in this change.
