# ADR-0002: Isolated identity and media policy foundations

## Status
Proposed in integration PR; no production behavior or data has changed.

## Context
The legacy platform integration candidate contains useful pure policy functions for account profiles, username changes, account preferences and media upload validation. Copying its older Worker wholesale would overwrite newer routing, authorization, security and architecture-governance work. These policies can be integrated independently before route/API composition is reconciled.

## Decision
- Place identity policy modules under `src/identity/` and media upload policy under `src/media/`, following canonical path ownership.
- Keep the policies pure: no database, request, session, storage or network access.
- Add focused regression tests and run them in the mandatory build.
- Preserve strict validation for profile field allowlists, HTTPS/same-origin avatar URLs, reserved usernames, supported themes/accessibility values, image MIME signatures, size limits and private object-key construction.
- Do not expose routes, enable uploads, configure R2, or claim account/profile features are live through this slice.
- Integrate API routes and UI only in a later change that updates route, API-method and authorization inventories against the current Worker source.

## Consequences
This creates reusable, testable policy foundations without replacing the current Worker or adding migrations. It does not complete profile/account/media product behavior. Existing D1 migrations remain immutable.
