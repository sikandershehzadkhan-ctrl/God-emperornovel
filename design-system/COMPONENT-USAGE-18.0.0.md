# Imperial Novel Component Usage Guide 18.0.0

This guide documents the opt-in HTML contract for the namespaced primitives in `public/imperial-ui-primitives.css`. It is a reference for implementation work, not a claim that all legacy templates already use these classes.

## Loading and theme scope

The application shell loads, in order, the existing application styles, `/imperial-design-tokens.css`, then `/imperial-ui-primitives.css`. Keep the primitive classes opt-in. Do not add a second CSS reset or replace legacy selectors in bulk.

Set one supported theme on the document root:

```html
<html lang="en" data-theme="light">
```

Theme preference persistence belongs to the application preference layer. CSS does not write to storage. The shared shell provides a native six-theme selector (Light, Dark, Midnight, Sepia, Imperial and Cosmic). The selected theme is validated, persisted in the existing `imperial_theme` preference and applied before frontend hydration. Reader-specific preferences remain independent until reader migration. Reader theme preferences remain a separate feature until the reader is migrated and visually verified.

## Buttons

```html
<button class="in-button in-button--primary" type="button">Create novel</button>
<button class="in-button in-button--secondary" type="button">Preview</button>
<button class="in-button in-button--quiet" type="button">Cancel</button>
<button class="in-button in-button--danger" type="button">Delete draft</button>
<button class="in-button in-button--primary" type="button" disabled>Publishing unavailable</button>
```

Use native buttons for actions and anchors for navigation. Button text names the outcome. For asynchronous work, set `aria-busy="true"`, prevent duplicate submission in application logic, and replace the label with a truthful progress message. Never announce success before the server confirms it. All button sizes preserve the 44px minimum target.

## Fields and validation

```html
<label class="in-field-label" for="novel-title">Novel title</label>
<input class="in-field" id="novel-title" name="title" autocomplete="off"
       aria-describedby="novel-title-help" />
<p class="in-field-help" id="novel-title-help">Use the published title readers will see.</p>
<label class="in-field-label" for="story-language">Story language</label>
<select class="in-select" id="story-language" name="language">
  <option value="en">English</option>
</select>
<label class="in-field-label" for="summary">Summary</label>
<textarea class="in-textarea" id="summary" name="summary"></textarea>
```

On error, set `aria-invalid="true"` and connect the error message using `aria-describedby`. Preserve user-entered content after recoverable failures. Do not use placeholder text as the only label.

## Checkbox, radio and toggle

```html
<label class="in-check-row">
  <input class="in-checkbox" type="checkbox" name="rights-confirmed" />
  <span>I confirm I have the rights to publish this work.</span>
</label>
<label class="in-check-row">
  <input class="in-radio" type="radio" name="visibility" value="private" />
  <span>Private draft</span>
</label>
<label class="in-check-row">
  <input class="in-switch" type="checkbox" role="switch" aria-label="Enable email notifications" />
  <span>Email notifications</span>
</label>
```

The row supplies the effective 44px target. Keep the visible label adjacent to the control. A switch is for an immediate binary preference, not for a form choice that needs a separate Save action. The switch's checked state must be saved and announced by application logic. Its checked thumb mirrors toward inline-end under `[dir="rtl"]`; keep the document direction attribute authoritative rather than hard-coding a language-specific transform.

## Cards, badges and avatars

```html
<article class="in-card">
  <div class="in-card__body">
    <h2 class="in-card__title">Novel workspace</h2>
    <p>Continue editing your saved draft.</p>
  </div>
</article>
<span class="in-badge">Draft</span>
<span class="in-badge in-badge--success">Published</span>
<span class="in-avatar" aria-label="Author initials">SK</span>
```

If a card is interactive, use one clear anchor or button as its action. Do not nest interactive controls inside another interactive element. Never communicate a status by color alone. When an avatar is decorative beside the same person's visible name, use empty image alt text instead of repeating the name.

## Tabs

```html
<div class="in-tabs" role="tablist" aria-label="Workspace sections">
  <button role="tab" id="tab-details" aria-selected="true" aria-controls="panel-details">Details</button>
  <button role="tab" id="tab-chapters" aria-selected="false" aria-controls="panel-chapters" tabindex="-1">Chapters</button>
</div>
<section role="tabpanel" id="panel-details" aria-labelledby="tab-details">...</section>
```

CSS supplies appearance only. The owning feature must implement the WAI-ARIA tabs keyboard pattern: Left/Right Arrow (or Up/Down for vertical tabs), Home/End, focus management, and correct selected-panel visibility. Do not claim tabs are keyboard-complete by adding roles alone.

## Alerts, progress and feedback

```html
<div class="in-alert" role="status">Your draft is saved.</div>
<div class="in-alert in-alert--success" role="status">Chapter published.</div>
<div class="in-alert in-alert--warning" role="status">Your cover is still processing.</div>
<div class="in-alert in-alert--danger" role="alert">The chapter could not be saved.</div>
<progress class="in-progress" max="100" value="65" aria-label="Upload progress">65%</progress>
```

Use `role="alert"` only for urgent information. Non-urgent updates should be polite status messages. Include text with progress; do not rely on color or a progress bar alone.

## Tables, navigation and pagination

```html
<table class="in-table">
  <caption>Published chapters</caption>
  <thead><tr><th scope="col">Chapter</th><th scope="col">Status</th></tr></thead>
  <tbody><tr><th scope="row">Chapter 1</th><td>Published</td></tr></tbody>
</table>
<nav aria-label="Primary navigation">
  <a class="in-nav-link" href="/discover" aria-current="page">Discover</a>
</nav>
<nav class="in-pagination" aria-label="Catalog pages">
  <a class="in-nav-link" href="?page=1" aria-current="page">1</a>
  <a class="in-nav-link" href="?page=2">2</a>
</nav>
```

Tables need captions and scoped headers. On narrow screens, preserve readable column widths and allow a labeled horizontal scroll region rather than squeezing text. Use `aria-current="page"` for the current route or page.

## Dialogs, toasts, tooltips and empty states

The CSS primitives provide visual surfaces only. Dialog behavior must be implemented with a native `<dialog>` or a tested accessible dialog controller: move focus inside, contain Tab navigation, close on Escape when safe, and restore focus to the opener. Toasts require a live region and must not steal focus. Tooltips are supplementary, dismissible, and never the only place an essential instruction appears. Empty states explain what happened and provide a useful next action.

```html
<div class="in-toast" role="status" aria-live="polite">Changes saved.</div>
<div class="in-tooltip" role="tooltip" id="publish-help">Publishing makes this chapter visible to readers.</div>
<section class="in-empty-state">
  <h2>No chapters yet</h2>
  <p>Your first chapter will appear here after you save it.</p>
  <a class="in-button in-button--primary" href="/author/chapters/new">Write a chapter</a>
</section>
<div class="in-skeleton" aria-hidden="true" style="height:1rem;width:60%"></div>
```

## RTL, motion and forced colors

- Prefer logical CSS properties such as `margin-inline`, `padding-inline`, `inset-inline`, and `border-inline-start`.
- Set the document or scoped surface `dir="rtl"` for Urdu, Arabic and Persian UI. Do not reverse non-directional icons.
- The switch indicator has an RTL transform rule; validate all other directional controls in the owning feature.
- Honor `prefers-reduced-motion`; animation is never required to understand a state.
- Forced-colors mode must retain visible boundaries and focus.
- Test keyboard-only operation, 200% zoom, and 320 CSS-pixel reflow before a page is marked migrated.

## Security and product behavior

CSS classes are not authorization. The server must enforce owner, author, admin and reader permissions for every protected operation. A hidden or disabled control is not a security boundary. Never render fabricated ratings, reading counts, balances, earnings, publication states or activity to fill empty UI.

## Migration rule

Migrate one page family at a time. For each family, inventory all runtime states (loading, empty, error, permission denied, success, mobile and RTL), map its legacy elements to these primitives, run route-specific tests, and review desktop/tablet/mobile screenshots before enabling the change. Keep the old path available until the new page passes its acceptance checks.
