# ADR-0025: Settings language selector and reader localization

**Status:** Accepted for the governed integration candidate  
**Date:** 5 November 2026  
**Owners:** Experience shell and reader experience

## Context

The canonical 17.23 runtime already has a mature settings page, six-theme controls, account-preference synchronization and session-owned reader progress. The legacy localization chain adds a fourteen-locale settings dictionary, an explicit settings-page language selector and ten reader strings. Its 17.24 reader implementation predates the canonical progress API and must not replace the newer reader lifecycle.

## Decision

1. Preserve the canonical settings implementation, theme controls, accessibility preferences, account-preference synchronization and local-first behavior.
2. Add a fourteen-locale settings dictionary and a native-language selector to the existing settings page. The selector reads and writes the existing imperial_language local preference through the shared setINLang function.
3. Mark only known static settings labels for translation; keep language option names native and avoid translating user-generated values.
4. Merge ten reader strings into the existing fourteen-locale interface dictionaries and use a small readerText helper for dynamic progress/footer labels.
5. Mark locked-chapter copy and Crown labels as translatable while preserving chapter content, progress API, bookmarks, unlock operations, and session-owned synchronization.
6. Preserve the six-theme reader, existing accessibility controls and canonical rating formatter.
7. Keep public/app.js and public/app-17.23.0.js byte-identical, and run the settings/reader localization regressions in the mandatory build.

## Consequences

Readers can use the settings page to change interface language and receive localized reader controls across fourteen locales. No new account preference or database column is introduced; language remains a browser-local interface preference.

## Validation

The settings test verifies fourteen locale dictionaries, language preference restore, live switching and bundle parity. The reader test verifies ten translated strings, dynamic progress/footer labels, accessibility labels and bundle parity. The existing reader progress, bookmark, unlock and library tests remain mandatory.
