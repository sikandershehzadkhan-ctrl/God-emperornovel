import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.23.0.js', 'utf8');
assert.equal(app, served, 'Editable and served application runtimes must remain byte-for-byte identical.');

assert.match(app, /<aside class="menuDrawer" id="imperialMenuDrawer" role="dialog" aria-modal="true" aria-label="Main navigation" aria-hidden="true" inert>/,
  'The closed mobile navigation drawer must be a labelled modal dialog and inert.');
assert.match(app, /menuDrawer\.inert=true/,
  'Closing the drawer must remove its descendants from keyboard interaction.');
assert.match(app, /menuDrawer\.inert=false/,
  'Opening the drawer must restore its descendants to keyboard interaction.');
assert.match(app, /menuDrawer\.setAttribute\('aria-hidden','true'\)/,
  'Closing the drawer must hide it from assistive technology.');
assert.match(app, /menuDrawer\.setAttribute\('aria-hidden','false'\)/,
  'Opening the drawer must expose it to assistive technology.');
assert.match(app, /menuButton\.setAttribute\('aria-expanded','true'\)/,
  'Opening the drawer must update the trigger expanded state.');
assert.match(app, /menuButton\.setAttribute\('aria-expanded','false'\)/,
  'Closing the drawer must update the trigger collapsed state.');
assert.match(app, /menuCloseButton\?\.focus\(\)/,
  'Opening the drawer must move keyboard focus inside it.');
assert.match(app, /if\(wasOpen\)menuButton\?\.focus\(\)/,
  'Closing the drawer must return focus to the menu trigger without stealing focus when already closed.');
assert.match(app, /if\(e\.key!=='Tab'\)return;const focusable=\[\.\.\.menuDrawer\.querySelectorAll\('a\[href\],button:not\(\[disabled\]\),\[tabindex\]:not\(\[tabindex="-1"\]\)'\)\]/,
  'The open drawer must enumerate its interactive descendants for keyboard focus containment.');
assert.match(app, /e\.shiftKey&&\(document\.activeElement===first\|\|!menuDrawer\.contains\(document\.activeElement\)\)/,
  'Shift+Tab at the first item or outside the drawer must wrap focus to the last item.');
assert.match(app, /!e\.shiftKey&&\(document\.activeElement===last\|\|!menuDrawer\.contains\(document\.activeElement\)\)/,
  'Tab at the last item or outside the drawer must wrap focus to the first item.');
assert.match(app, /if\(e\.key==='Escape'\)\{e\.preventDefault\(\);closeMenu\(\);return\}/,
  'Escape must close the open drawer.');
assert.match(app, /menuScrim\?\.addEventListener\('click',closeMenu\)/,
  'The visible scrim must continue to close the drawer.');
console.log('Mobile navigation keyboard accessibility contracts passed.');
