# ADR-0018: Idempotent OmniPortal connector registry

- **Status:** Accepted for the canonical integration candidate
- **Date:** 2026-11-05
- **Owners:** Platform kernel, rights and platform quality
- **Supersedes:** The older connector seeding and status behavior carried by the legacy homepage SSR branch

## Context

The Worker creates the connector registry table without a uniqueness constraint on `base_url`. The previous `seedOmni` helper used `INSERT OR IGNORE`, which does not prevent duplicate rows when no matching unique constraint exists. Because `GET /api/omni/status` invokes registry seeding, repeated requests could create duplicate registry rows. The public status projection then returned every duplicate.

The administrator connector-create route also marked a newly added connector as `authorized` without requiring rights evidence, bypassing the separate authorization review gate.

## Decision

1. Seed registry entries with `INSERT ... SELECT ... WHERE NOT EXISTS`, comparing trimmed, case-insensitive base URLs with trailing slashes removed.
2. Project one connector row per normalized base URL from the public status route. Prefer an enabled or authorized record, then the lowest connector ID as a stable tie-breaker.
3. Validate administrator-supplied connector base URLs as allowlisted HTTPS origins with no credentials, path, query or fragment.
4. Reject a normalized duplicate administrator registration with HTTP 409 rather than creating another row.
5. Create newly registered connectors with `rights_status='pending'` and `enabled=0`. The existing rights-evidence/terms review remains the only route to authorization.
6. Normalize whitespace and repeated trailing slashes in the administrator duplicate-cleanup grouping.

## Data and rollout

No schema or migration is introduced. Existing duplicate rows are not silently deleted by a public GET request. The administrator cleanup endpoint remains the explicit repair path and preserves references in `import_jobs` and `connector_events` when it removes duplicate rows.

The code-level existence check prevents repeated sequential seeding and the public projection prevents duplicate status entries. This change does not claim a database-enforced unique constraint against every possible concurrent administrator write. A future uniqueness migration would require a separately reserved migration number, a reviewed historical-data deduplication plan and an explicitly approved production migration.

## Security and compatibility

- Public status remains read-only and does not expose connector credentials or authorization secrets.
- Only existing administrator authorization can create a connector.
- New connectors remain disabled and pending until rights evidence or terms are reviewed.
- Existing enabled/authorized connector records are preferred in the public projection so a stale duplicate cannot hide the operational record.
- No production D1 mutation or deployment is part of this change.

## Verification

The dedicated regression test checks idempotent seed SQL, normalized status deduplication, duplicate-write rejection, HTTPS-origin validation, pending rights state and cleanup normalization. The complete exact-head validation suite is required before this slice can be merged into the canonical integration root.
