# ADR-0015: Accessible keyboard navigation for the admin dashboard

- **Status:** Proposed
- **Date:** 2026-11-05
- **Decision owners:** Experience shell and platform integrator

## Context

The admin dashboard has twelve sections presented as clickable buttons. Before this change, the navigation had no tablist/tab/tabpanel relationships, no roving focus model, and no arrow-key/Home/End navigation. The dashboard also lacked a skip link for keyboard users. A visual-only redesign does not resolve these interaction and assistive-technology gaps.

## Decision

1. Keep the existing twelve section IDs and `data-tab` values as the canonical tab-to-panel mapping.
2. Expose the navigation as a named `tablist`, each section selector as a `tab`, and each content section as its associated `tabpanel`.
3. Use roving tabindex so exactly one tab participates in the normal tab order; synchronize `aria-selected`, the active CSS class, and the panel's `hidden` property in one `showTab` transition.
4. Support ArrowLeft and ArrowRight with wrapping, plus Home and End, while preserving native click and Enter/Space button activation.
5. Provide a visible-on-focus skip link to the tablist and a visible focus indicator.
6. Keep server authorization, routes, APIs, database schema, browser bundle versioning and production deployment behavior unchanged.

## Consequences

- Keyboard-only users can move between all admin sections without tabbing through twelve controls.
- Assistive technology receives an explicit selected-tab and panel relationship.
- The existing admin section loading functions remain the single source of data loading behavior.
- No migration or persistent preference is required.

## Validation

The existing build-invoked navigation accessibility test verifies the skip link, all twelve tab/panel relationships, initial selected state, roving tabindex, hidden inactive panels and all four keyboard navigation keys. The full six-workflow integration suite must pass on the exact feature head before merge.

## Rollback

Revert the admin markup and its test assertions together. No data repair, migration rollback or production action is required.
