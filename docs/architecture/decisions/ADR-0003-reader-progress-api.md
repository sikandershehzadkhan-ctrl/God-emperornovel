# ADR-0003: Owner-scoped reader progress API

## Status
Proposed in governed integration PR. No production deployment or live schema mutation has occurred.

## Context
The profile-identity integration contains a reader-progress design, but its Worker API was absent from the canonical integration. The canonical runtime feature schema was at version 1 and did not create the reading_positions table.

## Decision
- Advance the idempotent runtime feature schema to version 2 and create reading_positions with a per-user/per-novel primary key, bounded chapter and percentage fields, and account/novel foreign keys.
- Add authenticated GET and POST /api/reading-position handlers to the existing Worker without replacing its dispatcher.
- Bind every read and write to the authenticated session user; never accept user_id from the request.
- Require published chapters, published novels, and rights eligibility.
- Use same-origin enforcement, per-account rate limiting, and optimistic revision checks to prevent stale tabs from silently overwriting newer progress.
- Keep the response private/no-store through the existing JSON response helper.
- Do not add a competing numbered migration; the feature schema bootstrap owns this runtime-managed table.

## Consequences
Readers gain a secure persistence API for progress. Browser autosave/UI integration remains a separate follow-up; this ADR does not claim that the UI currently uses the endpoint.
