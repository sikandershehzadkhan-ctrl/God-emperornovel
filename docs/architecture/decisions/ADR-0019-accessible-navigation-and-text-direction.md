# ADR-0019: Accessible navigation and independent text direction

- **Status:** Accepted for the foundation branch, pending PR review
- **Date:** 2026-11-19

## Context

The platform offers 14 UI language choices, including Urdu, Arabic and Persian, and permits chapter content in languages whose reading direction differs from the selected creator or reader interface language. The application shell already included a skip link and semantic navigation, but Persian UI direction and chapter-level direction were not handled explicitly. The shell also needed a stronger forced-colors fallback.

## Decision

- Set the document UI direction to RTL for Urdu, Arabic and Persian.
- Set the chapter content container to `dir="auto"`, allowing the chapter's first strong directional character to determine text direction independently of UI locale.
- Preserve the skip-to-main-content link and semantic main/header/nav landmarks.
- Add visible skip-link styling, keyboard focus outlines, reduced-motion handling and forced-colors focus treatment to both source and versioned CSS assets.
- Add a build-gated accessibility foundation contract that checks the source and versioned bundles remain aligned.

## Consequences

- UI locale and chapter body direction are separate controls.
- The changes establish source-level accessibility contracts; they do not replace browser-based keyboard, screen-reader, contrast, responsive, or real content QA.
