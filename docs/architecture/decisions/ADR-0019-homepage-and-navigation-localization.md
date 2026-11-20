# ADR-0019: Homepage and navigation accessibility localization

- **Status:** Accepted for the canonical integration candidate
- **Date:** 2026-11-05
- **Owners:** Experience shell and platform quality
- **Related legacy work:** PRs #145 and #156; their old Worker and 17.24 browser bundles are not imported

## Context

The canonical browser application already exposes fourteen interface locales and has a separate Library/History dictionary. However, the homepage's editorial copy remained English-only, and the accessible skip-navigation link had no translation key. The older localization branch contains a fourteen-locale homepage dictionary, but its 17.24 application bundle is substantially divergent from the canonical 17.23 runtime and cannot be copied wholesale.

## Decision

1. Port only the homepage dictionary `HOME_LANG` from the audited legacy branch; keep the canonical app renderer, API calls, SSR handoff and active 17.23 bundle.
2. Localize exact static homepage text nodes after either the server-rendered handoff or client fallback. Wrap matching text nodes in `data-in-lang` spans while preserving surrounding whitespace and existing semantic elements.
3. Exclude dynamic catalog story cards from automatic copy translation. Titles, author names and other creator-supplied content remain in their authored language.
4. Observe homepage child-list updates so static labels introduced by asynchronous rendering are handled, avoid repeat DOM writes when text already matches, and disconnect the observer when the root is detached.
5. Localize the homepage search placeholder and accessible name through the existing fourteen-locale dictionary.
6. Add the skip-navigation label to all fourteen interface dictionaries and expose the shell skip link to the existing language switcher.
7. Apply RTL direction to Urdu, Arabic and Persian.

## Data, privacy and compatibility

No API, database entity, migration, account setting or server-side content translation is introduced. The existing `imperial_language` browser preference remains canonical. Creator-written novel titles, chapter text, author names and other dynamic story content are not automatically translated.

The server-rendered page remains a valid English no-JavaScript fallback. When the browser application boots, the stored interface locale is applied to the static homepage and navigation. The source `public/app.js` and served `public/app-17.23.0.js` must remain byte-identical.

## Verification

The mandatory build includes a fourteen-locale homepage copy test and a fourteen-locale skip-navigation/RTL test. Both verify the canonical and versioned browser bundles remain identical.
