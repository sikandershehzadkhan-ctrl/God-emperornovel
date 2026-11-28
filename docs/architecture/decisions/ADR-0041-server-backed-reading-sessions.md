# ADR-0041: Server-backed reading sessions and chapter completion

- Status: Proposed
- Date: 2026-11-28
- Owners: community / reader experience
- Depends on: ADR-0035 (Imperial XP ledger), migration 0050

## Context

The current reader stores scroll percentage in browser `localStorage`. The authenticated `POST /api/history` endpoint records the latest chapter number when an unlocked chapter is opened. Neither signal is a server-verifiable chapter completion event. A chapter number is reading history, not reading progress; a browser percentage is mutable client input.

The canonical migration history also contains older, conflicting reading-position proposals. This decision deliberately introduces a distinct session/completion record and does not rename, repurpose, or silently merge a legacy reading-position table. The active Worker route and schema must be re-audited at implementation time before any API integration.

## Decision

Add migration 0051 after migration 0050 with two tables:

- `reading_sessions`: authenticated user, chapter, unique SHA-256 hash of an opaque session token, server timestamps, expiry, required active duration, accumulated active seconds, maximum reported progress in basis points, heartbeat count and terminal status.
- `reading_completions`: one row per (user, chapter), linked to the exact completed session, with the server-recorded completion time, qualifying seconds and progress evidence.

Database constraints enforce one active session per user/chapter, token-hash shape, bounded timing/progress fields, one completion per user/chapter, terminal session transitions, and that a completion matches a qualified completed session. Account or chapter deletion cascades through the session/completion records.

## Application protocol to implement after schema review

1. Start: require a valid authenticated session, published rights-eligible novel/chapter, and the same entitlement/unlock check used by the chapter-content endpoint. Derive user and chapter IDs on the server. Generate a cryptographically random bearer token, persist only its SHA-256 hash, and return the raw token once.
2. Duration: derive a minimum duration from server-read chapter content length, clamped to 20–1,800 seconds. Never accept a client-supplied required duration.
3. Heartbeat: require the bearer token and authenticated owner match. Use server time only. Accept a progress report only as a bounded hint (0–10,000 basis points), retain the maximum, and credit only bounded elapsed intervals. Ignore stale, replayed, expired, or excessively delayed heartbeats. Rate-limit heartbeat frequency and session creation. The client should send heartbeats only while the document is visible, but visibility is not trusted as proof.
4. Completion: require server-accumulated active time to meet the stored minimum and maximum reported progress to reach at least 9,000 basis points. Atomically transition the session and insert the unique completion row. A repeated request returns the existing completion without a second award.
5. XP: only after the completion row is successfully created, the application may call the existing server-only XP ledger helper with a stable key such as `reading-completion:<user-id>:<chapter-id>`. Preserve the existing account eligibility and rolling XP cap. Never award for author self-reading, opening a chapter, a page refresh, or a client-only scroll event.

## Abuse model and limits

This design raises the cost of trivial replay and fabricated history; it does not prove human attention. A determined script can simulate elapsed heartbeats and progress. Server timestamps, bounded heartbeat credit, opaque one-use session tokens, account/chapter ownership, unique completion rows, rate limits and the existing XP cap are layered controls, not a CAPTCHA or biometric claim.

The completion threshold is a product policy, not an assertion that 90% scroll equals comprehension. It should be calibrated with real chapter lengths and accessibility testing. Users must still be able to read without participating in XP or leaderboard features.

## Privacy and data minimization

Sessions are private to their authenticated owner. Public leaderboard opt-in remains a separate setting. Do not expose session tokens, session IDs, raw progress events, reading timestamps, email addresses or account IDs in public profile/leaderboard responses. Store no chapter body copy in the session tables.

## Release boundaries

- Migration 0051 depends on 0050 and must remain in the same ordered canonical chain.
- This migration creates schema only; it awards no XP and changes no reader endpoint.
- API/UI integration requires separate source, authorization-registry, route-registry and adversarial tests.
- No production D1 migration or Worker deployment is authorized by this ADR.
- Production release remains blocked by the canonical backup, restore rehearsal, remote schema inventory, checksum reconciliation and explicit approval requirements.
