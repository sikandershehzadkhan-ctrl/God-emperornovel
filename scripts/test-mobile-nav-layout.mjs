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
console.log('Mobile navigation narrow-viewport layout contracts passed.');
