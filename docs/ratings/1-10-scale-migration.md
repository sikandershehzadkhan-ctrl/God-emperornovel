# Novel rating scale migration: 1–10

## Decision
Imperial Novel's canonical novel rating scale is a whole-number value from 1 through 10. An unrated novel is represented as **Not rated**, never as zero.

## Existing behavior found on the implementation branch
- The `ratings` table constrains individual votes to 1–5.
- `POST /api/rating` rounds input and rejects values outside 1–5.
- `GET /api/rating` returns the aggregate average and per-user vote.
- The shared card formatter rounds to a whole number and renders `/5`.
- The `novels.rating` aggregate is recomputed from the `ratings` table.

## Migration policy
Existing votes are mapped deterministically from 1–5 to 2, 4, 6, 8, 10. This preserves ordering and relative positions on the new ten-point scale without inventing fractional votes. The migration rebuilds the constrained table in a forward-only D1 migration and recomputes each novel's aggregate from the migrated votes. Existing novels with no votes remain unrated (aggregate 0 in storage, rendered as Not rated).

## Required implementation gates
1. Reserve the next migration number through the repository's same-PR reservation process.
2. Add a forward-only migration; never edit applied migration files.
3. Update runtime bootstrap schema for fresh installations and API validation for 1–10.
4. Update the shared display formatter and all rating UI controls to accept 1–10.
5. Add SQLite migration fixtures for populated, empty, and edge-case vote sets; assert uniqueness, timestamps, and aggregate recomputation.
6. Update rating display/API contract tests and run full Cloudflare source validation, migration governance, and architecture checks.
7. Do not deploy the migration or change production data from this PR.

## Compatibility and data safety
- A vote of 1–5 becomes the corresponding even score 2–10.
- Re-submission remains an upsert keyed by user and novel.
- No ratings are fabricated for novels with no votes.
- The migration is irreversible at the data level; the mapping policy must be reviewed before merge and production application.
- This PR does not alter review eligibility, moderation, ranking weights, or monetization.
