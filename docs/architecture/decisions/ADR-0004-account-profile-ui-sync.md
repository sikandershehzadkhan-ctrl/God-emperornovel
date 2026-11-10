# ADR-0004: Account profile editor and synchronized preferences

- **Status:** Proposed
- **Date:** 2026-11-04
- **Decision owners:** Identity domain and experience runtime

## Context

The profile and preference APIs are now available in the governed Worker. The account page still showed a placeholder avatar and did not expose the canonical profile fields. Settings were local-only, so preferences did not follow an authenticated reader across devices. Browser caching also needs an explicit invalidation when the served application bundle changes.

## Decision

1. Add an account profile editor that submits only the supported profile fields to `PUT /api/profile`. The server remains authoritative for field validation and account ownership.
2. Restore saved account preferences from `GET /api/account/preferences` when signed in. Keep immediate local persistence and debounce `PUT` updates to avoid sending a request for every slider movement.
3. Preserve anonymous local preferences. If the account has no saved preference record, initialize it from the current local settings.
4. Support the six existing site and reader themes in the canonical preference policy.
5. Bump the service-worker cache namespace when the application bundle changes, so an installed client cannot remain pinned to the old bundle under the same URL.

## Consequences

- `public/app.js` and `public/app-17.23.0.js` remain byte-identical.
- No new D1 migration is required.
- Offline preference edits remain local until connectivity returns and a settings sync is triggered; conflict resolution for simultaneous multi-device preference edits is last-write-wins and is not a collaborative merge.
- Account profile and preference behavior still requires isolated browser/Worker testing before production deployment.

## Rollback

Revert the UI and service-worker changes together. The existing API and stored profile/preferences data remain compatible.
