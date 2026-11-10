# ADR-0038: Canonical Community localization browser-bundle integration

**Status:** Accepted for the governed integration candidate  
**Date:** 6 November 2026  
**Owners:** Community experience, experience shell and platform quality

## Context

The canonical integration root already contains the Community localization feature contract, fourteen-locale regression test, build registration and governance references. The legacy Community localization branch is stale and contains unrelated differences, so importing its full browser bundles would risk regressing newer canonical behavior.

## Decision

1. Port only the Community locale dictionary, translation helper and static-label localization lifecycle into the current canonical browser application.
2. Keep `public/app.js` and `public/app-17.23.0.js` byte-identical.
3. Preserve the existing recent-discussions and trending catalog API requests and rendering behavior.
4. Translate only static interface labels and loading, empty and unavailable states. Novel titles, usernames, discussion bodies and other creator/community-authored content remain unchanged.
5. Retain the canonical Community localization test, feature contract, build registration and governance references already present on the root.
6. Add no route, API contract, D1 entity, migration, account preference or production data change.

## Consequences

The Community landing page receives fourteen-locale interface coverage without replacing the current discovery feed or importing stale browser code. No database migration or production deployment is required.

## Validation

The exact pull-request head must pass the six required integration workflows. The Community regression verifies all 24 strings across fourteen locales, post-render language application, dynamic content preservation and source/served bundle parity.
