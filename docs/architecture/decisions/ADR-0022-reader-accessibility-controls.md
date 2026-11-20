# ADR-0022: Accessible reader progress and chapter controls

**Status:** Accepted for the canonical integration branch  
**Date:** 5 November 2026  
**Decision owners:** Reader domain and experience shell

## Context

The reader's visual progress bar did not expose progressbar semantics or a readable current value. Its initial label could also confuse the novel's chapter position with the percentage read within the current chapter. The chapter drawer had no explicit accessible relationship to its trigger, did not move focus on open, and did not provide Escape-to-close focus restoration. Font-size controls relied on visible glyphs alone.

## Decision

1. Expose within-chapter completion as a labeled progressbar with minimum 0, maximum 100, current value and a readable value text.
2. Update the progressbar's accessible value whenever scroll progress changes.
3. Keep within-chapter completion separate from the novel's chapter position in the visible progress label.
4. Give the chapter menu an accessible name and `aria-controls` relationship to a labeled drawer region.
5. Move focus to the drawer close control when opening; Escape and the close control both close the drawer and restore focus to the menu trigger.
6. Give the font decrement/increment controls descriptive accessible names.
7. Preserve the existing reader-progress API, persistence model, bookmark behavior and served-bundle parity.

## Consequences

- Keyboard and screen-reader users can identify reader controls and chapter progress.
- Opening the drawer has a predictable focus destination and closing it returns focus to its trigger.
- No API, database, migration or production deployment changes are required.

## Validation

`scripts/test-reader-accessibility.mjs` checks the progressbar semantics and updates, chapter drawer relationships and focus behavior, Escape handling, font control labels, and byte-identical source/served bundles.
