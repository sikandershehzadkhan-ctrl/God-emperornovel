import fs from 'node:fs';
import assert from 'node:assert/strict';

const css = fs.readFileSync('public/imperial-design-system.css', 'utf8');
const app = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.23.0.js', 'utf8');

assert.equal(app, served, 'Editable and served runtimes must remain byte-for-byte identical.');
const navStart = app.lastIndexOf('<nav class="mobileNav"');
const navEnd = app.indexOf('</nav>', navStart);
assert.ok(navStart >= 0 && navEnd > navStart, 'Mobile navigation markup must exist.');
const nav = app.slice(navStart, navEnd);
for (const label of ['Home', 'Discover', 'Library', 'Create', 'Community', 'Profile']) {
  assert.ok(nav.includes('>' + label + '</a>'), 'Missing mobile destination: ' + label);
}

const marker = '/* Narrow-device navigation fit and footer clearance.';
const markerIndex = css.lastIndexOf(marker);
assert.ok(markerIndex >= 0, 'Narrow-device navigation override must exist.');
const fit = css.slice(markerIndex);
for (const rule of [
  '@media (max-width: 760px)',
  '.mobileNav {',
  'justify-content: stretch;',
  '.mobileNav > a {',
  'flex: 1 1 0;',
  'min-width: 0;',
  'padding-inline: 0;',
  'font-size: 9px;',
  'white-space: nowrap;',
  '.footer {',
  'padding-bottom: calc(92px + env(safe-area-inset-bottom));'
]) {
  assert.ok(fit.includes(rule), 'Missing narrow mobile navigation contract: ' + rule);
}
const readerMarker = '/* Reader viewport containment: prevent intrinsic sticky-toolbar width';
const readerMarkerIndex = css.lastIndexOf(readerMarker);
assert.ok(readerMarkerIndex >= 0, 'Reader viewport containment override must exist.');
const readerFit = css.slice(readerMarkerIndex);
for (const rule of [
  '@media (max-width: 760px)',
  '#app > .readerPage {',
  'width: 100%;',
  'min-width: 0;',
  'max-width: 100%;',
  'box-sizing: border-box;'
]) {
  assert.ok(readerFit.includes(rule), 'Missing narrow reader containment contract: ' + rule);
}
const filterInputStart = css.lastIndexOf('.filterGroup select,');
assert.ok(filterInputStart >= 0, 'Catalog filter input sizing rules must exist in the canonical stylesheet.');
const filterInputRules = css.slice(filterInputStart, filterInputStart + 500);
for (const rule of [
  '.filterGroup select,',
  '.filterGroup input {',
  'width: 100%;',
  'min-width: 0;',
  'min-height: 44px;'
]) {
  assert.ok(filterInputRules.includes(rule), 'Missing responsive catalog filter sizing contract: ' + rule);
}
console.log('Mobile navigation narrow-viewport layout contracts passed.');
