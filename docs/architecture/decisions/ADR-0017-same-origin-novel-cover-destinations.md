# ADR-0017: Same-origin novel cover destinations

**Status:** Accepted for the canonical integration branch  
**Date:** 5 November 2026

## Context

Novel cover URLs are rendered to readers and can be supplied through author and administrator publishing workflows. Accepting arbitrary remote URLs exposes reader IP addresses and referrer context to third-party image hosts, permits untrusted schemes and paths, and makes the browser's image policy broader than necessary.

The canonical application already bundles a finite set of cover images and a local placeholder. Comic page images are a separate media surface and may require HTTPS image sources on the reader route.

## Decision

1. Accept novel cover values only from an explicit allowlist of bundled same-origin cover paths or the local placeholder.
2. Enforce the allowlist in every author and administrator create/update route. Client-side controls are convenience only and are not a security boundary.
3. Use a local placeholder for absent legacy cover values. Reject explicitly supplied invalid values.
4. Make the general HTML Content Security Policy image source same-origin plus data images. Permit HTTPS image sources only on comic reader routes.
5. Restrict Author Studio cover controls to the bundled artwork choices and fail closed in client rendering.
6. Keep novel cover URLs distinct from comic page media policy and future authorized external media workflows.

## Consequences

- Remote novel cover URLs are not accepted through the covered publishing APIs.
- Existing remote cover values render as the local placeholder until replaced with an approved bundled cover.
- The policy reduces third-party image requests and prevents path traversal, encoded traversal, query/fragment suffixes, and unsafe schemes.
- Adding new bundled covers requires an explicit allowlist and regression-test update.
- No database migration is required. No production D1 mutation or Worker deployment is authorized by this decision.

## Validation

`scripts/test-cover-url-policy.mjs` verifies allowed values, unsafe schemes, remote hosts, traversal, encoded paths, query/fragment suffixes, malformed inputs, all four publishing write paths, Author Studio controls, and the route-specific CSP.
