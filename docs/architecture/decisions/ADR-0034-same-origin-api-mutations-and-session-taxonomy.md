# ADR-0034: Same-origin API mutations and session-owned taxonomy attribution

- **Status:** Proposed in PR #398
- **Date:** 2026-11-27
- **Decision owners:** Worker/API security owner and platform integration owner
- **Scope:** Cloudflare Worker API mutation boundary and community taxonomy submissions

## Context

The Worker currently accepts state-changing API requests without a central same-origin request check. Cookie sessions use SameSite=Lax, but that cookie attribute is not the only CSRF boundary the application should rely on. The taxonomy proposal handler also accepted creator_id and creator_name from request JSON, allowing submitter attribution to be forged.

## Decision

1. Every mutating request under /api/* must include an Origin header exactly matching the request URL origin.
2. Reject mutating requests whose Sec-Fetch-Site is cross-site or none. Safe methods GET, HEAD, and OPTIONS are not subject to this mutation gate.
3. Taxonomy proposal creation requires an authenticated session. Store creator ID and username from the resolved session only. Ignore caller-provided identity fields.
4. Keep the guard at the Worker fetch boundary so new API mutation routes inherit it by default.
5. Add regression tests to the normal build. No production deployment is implied by this ADR or PR.

## Compatibility and rollout

The current first-party browser application sends same-origin requests. Requests from command-line tools, native apps, or external integrations that omit Origin will be rejected for mutations. If a future non-browser client is needed, design a separate authenticated API contract with explicit credentials and abuse controls rather than weakening browser CSRF protection.

Taxonomy submissions now require login. Public taxonomy discovery remains read-only and available without authentication.

## Verification required before merge

- Unit tests for safe methods, exact-origin mutations, mismatched origins, cross-site metadata, and missing Origin.
- Source regression tests for Worker enforcement and session-derived taxonomy attribution.
- Full Cloudflare source validation and repository governance workflows.
- Manual compatibility check of login, registration, comments, bookmarks, chapter unlocks, author edits, and admin actions in the first-party browser client.

## Security boundary

This decision reduces CSRF exposure and prevents taxonomy submitter impersonation. It does not replace route-level authentication, role checks, object ownership checks, output encoding, or database constraints. It is not a security certification.