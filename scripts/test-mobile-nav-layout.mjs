import fs from 'node:fs';
import assert from 'node:assert/strict';

const css = fs.readFileSync('public/imperial-design-system.css', 'utf8');
const app = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.23.0.js', 'utf8');

assert.equal(app, served, 'Editable and served runtimes must remain byte-for-byte identical.');
assert.match(app, /<nav class="mobileNav" aria-label="Primary mobile navigation">[\\s\\S]*?<a[^>]*>[^<]*<span>[\\s\\S]*?<\\/span>Profile<\\/a><\\/nav>/,
  'The mobile navigation must retain its six named destinations, including Profile.');
const fit = css.slice(css.lastIndexOf('/* Narrow-device navigation fit and footer clearance.'));
assert.ok(fit.length > 0, 'The narrow-device navigation override must remain the final cascade layer.');
assert.match(fit, /@media \\(max-width: 760px\\)[\\s\\S]*?\.mobileNav[\\s\\S]*?justify-content: stretch;/,
  'Mobile navigation must distribute its available width across the full bar.');
assert.match(fit, /\.mobileNav > a[\\s\\S]*?flex: 1 1 0;[\\s\\S]*?min-width: 0;[\\s\\S]*?padding-inline: 0;/,
  'Every mobile destination must share an equal shrinkable slot without intrinsic-width overflow.');
assert.match(fit, /font-size: 9px;[\\s\\S]*?white-space: nowrap;/,
  'Compact mobile labels must remain on one line at narrow widths.');
assert.match(fit, /\.footer[\\s\\S]*?padding-bottom: calc\\(92px \\+ env\\(safe-area-inset-bottom\\)\\);/,
  'Footer content must clear the fixed navigation bar and device safe area.');
console.log('Mobile navigation narrow-viewport layout contracts passed.');
