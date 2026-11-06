# ADR-0040: Repair English community notification empty-state localization

- Status: Accepted
- Date: 2026-11-06
- Decision owners: experience-shell, platform-quality, platform-architecture

## Context

The canonical discovery locale dictionary contained a malformed English key for the notifications empty state. The value was present, but the dictionary key accidentally included JavaScript interpolation fragments, so the community expansion localization test could not resolve the expected English label.

## Decision

Replace the malformed English dictionary key with the canonical "No notifications yet." key. Keep the English value equal to the source label and preserve the existing translations for the other thirteen locales. Apply the identical dictionary correction to public/app.js and public/app-17.23.0.js.

## Consequences

- The notifications empty state resolves through the shared locale dictionary.
- No API, route, persistence, rights or authorization behavior changes.
- Source and served application bundles must remain byte-identical.
- This correction is a build-blocking localization repair and does not change the release version.

## Validation

- Run test-community-expansion-localization.mjs.
- Verify all fourteen locale dictionaries contain non-empty values for the required discovery strings.
- Verify public/app.js and public/app-17.23.0.js are byte-identical.
