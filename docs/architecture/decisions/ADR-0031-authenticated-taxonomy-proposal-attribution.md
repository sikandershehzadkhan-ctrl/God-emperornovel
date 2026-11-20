# ADR-0031: Authenticated taxonomy proposal attribution

- **Status:** Proposed
- **Date:** 2026-11-20
- **Decision owners:** Imperial Novel maintainers
- **Scope:** `POST /api/taxonomy`

## Context

The community taxonomy submission handler accepted `creator_id` and `creator_name` from caller-controlled JSON. A pending proposal could therefore be attributed to an arbitrary account. Admin review remained required, but submitter identity and moderation evidence were not trustworthy.

## Decision

Keep approved taxonomy discovery public, but require an authenticated session to submit a taxonomy proposal. The Worker passes the authenticated principal into the handler. The server derives creator ID and username from that principal and ignores identity fields supplied by the client. Apply a per-user limit of five submissions per 24-hour rate-limit window using the existing authentication rate-limit table.

## Consequences

- Anonymous users can continue reading approved taxonomy entries but cannot submit proposals.
- A proposal's creator attribution is tied to the authenticated account.
- Client-provided creator identity can no longer be used to impersonate another account.
- The new regression check is part of the standard build.
- This decision does not certify all API routes or replace cross-account authorization testing.

## Validation

The change is covered by `scripts/test-taxonomy-submission-authorization.mjs`, which checks dispatcher principal propagation, authentication, rate limiting, server-derived identity, and rejection of caller-controlled identity fields. Cloudflare bundle validation and the full CI suite remain required before merge.
