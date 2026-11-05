# ADR-0023: Localized reader library and bookmark management

**Status:** Accepted for the canonical integration branch  
**Date:** 5 November 2026  
**Decision owners:** Reader domain and experience shell

## Context

The canonical Library, History and Following views were still rendered in English despite the platform's 14 interface-language selector. The Library view also omitted the saved within-chapter progress percentage and exposed no remove action for individual bookmarked chapters, even though the owner-scoped bookmark DELETE API is now available.

An older reader branch contains useful localization and bookmark-management behavior, but its rating display uses a five-point scale. Imperial Novel's canonical rating contract is a whole-number ten-point scale, so that legacy rating logic must not be copied.

## Decision

1. Add a dedicated 14-locale dictionary for Library, History and Following interface strings.
2. Apply the selected locale to static leaf text and accessible labels without replacing dynamic novel titles, author names, counts or chapter data.
3. Reapply localization after Library/History content changes and allow the existing language selector to update marked text.
4. Show saved within-chapter progress in Continue Reading.
5. Add an explicit remove action for each saved bookmark. Use the existing session-owner-scoped DELETE /api/bookmark endpoint.
6. Update the saved-story count and empty states after removal.
7. Preserve the canonical ten-point `ratingText` formatter. Do not reintroduce the legacy five-point parser or display fabricated decimal ratings.
8. Keep source and served browser bundles byte-identical.

## Consequences

- Library, History and Following become usable in all 14 currently supported interface languages.
- Readers can manage bookmarks directly from the Library view.
- Reading progress is visible before reopening a chapter.
- No API, schema, migration or production deployment changes are required.

## Validation

`scripts/test-library-localization.mjs` verifies 14 locales and 25 strings, page-local translation behavior, bookmark removal controls, reading-progress display, ten-point rating formatter parity, and byte-identical source/served bundles.
