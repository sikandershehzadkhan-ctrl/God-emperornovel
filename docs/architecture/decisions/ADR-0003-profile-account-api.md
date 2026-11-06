# ADR-0003: Owner-scoped profile and account-preference APIs

- **Status:** Proposed
- **Date:** 2026-11-04
- **Decision owners:** Identity domain and platform integrator

## Context

The canonical schema already contains profile fields from migration 0012 and the preferences JSON column from migration 0014. The current Worker exposes only a basic account summary, while the profile and settings surfaces do not yet have a complete owner-scoped API contract. Recreating the columns or adding another profile store would create schema collision risk.

## Decision

1. Reuse the existing `users` row as the sole owner of profile and preference data.
2. Require the authenticated session for private profile and preference reads/writes. Every mutation binds its target to `u.id`; request bodies cannot select an account or role.
3. Validate profile fields with the canonical identity policy and preferences with the canonical preferences policy.
4. Apply same-origin and Fetch Metadata checks, per-account rate limits and audit events to mutations.
5. Expose public profile data only when `profile_visibility='public'` and the account is not banned. Never return email, Crown balance or private account fields. Aggregate reading statistics require explicit opt-in.
6. Keep UI synchronization and two-account browser/Worker tests as separate follow-up gates. This API slice does not authorize production deployment.

## Consequences

- Existing migrations 0012 and 0014 are reused; no migration is added.
- Route-method and authorization ownership evidence must fingerprint the exact Worker blob.
- Private account isolation and public projection behavior require isolated two-account runtime tests before security sign-off.
- The account editor and settings UI remain local-only until their separate client integration is complete.

## Rollback

Revert the API handlers before deployment. No D1 data mutation or production migration is part of this decision.
