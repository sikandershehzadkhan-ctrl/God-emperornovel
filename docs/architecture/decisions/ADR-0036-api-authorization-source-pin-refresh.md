# ADR-0036: Refresh API Authorization Evidence After Read-Route Hardening

- **Status:** Proposed
- **Date:** 2026-11-20
- **Scope:** Canonical API authorization registry and page route manifest

## Context

The Worker source changed to make four OmniPortal read endpoints explicitly GET-only and side-effect-free. The canonical API authorization registry pins the exact `src/index.js` blob, and the page route manifest pins the exact API authorization registry blob. Leaving either pin stale makes the source-audit gate correctly fail.

## Decision

Update the API authorization registry's source blob and source commit to the exact Worker source revision containing the new method guards. Update the page route manifest's API registry blob pin to the new registry blob. Preserve the existing exact API path/method inventory and access-control classifications; the four endpoints remain authenticated where private and retain their prior access class.

## Consequences

- The source-backed API authorization inventory remains cryptographically tied to the Worker source being tested.
- The page route manifest remains tied to the exact API authorization registry.
- Any later Worker source edit must refresh the API registry source pin and rerun the authorization inventory test.

## Verification

The build-gated `scripts/test-api-authorization-registry.mjs` validates both blob pins, exact API route/method coverage, admin guards, user/author ownership, rights filtering, Omni connector authorization and disabled payment webhook behavior.
