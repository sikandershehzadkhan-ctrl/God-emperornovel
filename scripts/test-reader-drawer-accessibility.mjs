import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('public/app.js','utf8');
const served=fs.readFileSync('public/app-17.23.0.js','utf8');
const css=fs.readFileSync('public/imperial-design-system.css','utf8');

assert.equal(app,served,'Editable and served browser bundles must remain identical.');
assert.match(app,/<aside id="chapterDrawer" class="chapterDrawer" role="dialog" aria-modal="true" aria-label="Chapter list and reading settings" aria-hidden="true" inert hidden>/,
  'The closed reader drawer must be a labelled, modal, inert dialog.');
assert.match(app,/<div id="chapterDrawerScrim" class="chapterDrawerScrim" hidden><\/div>/,
  'The closed reader drawer must have a hidden backdrop.');
assert.match(app,/drawer\.inert=!open/,
  'Closing the reader drawer must remove its controls from keyboard interaction.');
assert.match(app,/drawer\.setAttribute\('aria-hidden',String\(!open\)\)/,
  'The reader drawer must synchronize its accessibility-tree visibility.');
assert.match(app,/id="chapterMenu"[^>]*aria-controls="chapterDrawer"/,
  'The chapter-list trigger must identify its controlled dialog.');
assert.match(app,/chapterBtn\.setAttribute\('aria-expanded',String\(open\)\)/,
  'The chapter-list trigger must announce its expanded state.');
assert.match(app,/settingsBtn\.setAttribute\('aria-expanded',String\(open\)\)/,
  'The settings trigger must announce its expanded state.');
assert.match(app,/scrim\.addEventListener\('click',\(\)=>closeReaderDrawer\(\)\)/,
  'Tapping outside the drawer must close it.');
assert.match(app,/if\(e\.key==='Escape'\)\{e\.preventDefault\(\);closeReaderDrawer\(\);return\}/,
  'Escape must close the reader drawer and restore focus.');
assert.match(app,/if\(e\.shiftKey&&\(document\.activeElement===first\|\|!drawer\.contains\(document\.activeElement\)\)\)/,
  'Shift+Tab must wrap focus to the final reader-drawer control.');
assert.match(app,/!e\.shiftKey&&\(document\.activeElement===last\|\|!drawer\.contains\(document\.activeElement\)\)/,
  'Tab must wrap focus to the first reader-drawer control.');
assert.match(app,/document\.body\.style\.overflow='hidden'/,
  'Opening the reader drawer must prevent background-page scrolling.');
assert.match(app,/document\.body\.style\.overflow=bodyOverflowBeforeDrawer/,
  'Closing the reader drawer must restore the previous body overflow style.');
assert.match(app,/const closeReaderDrawer=\(restoreFocus=true\)=>\{[\s\S]*?drawerTrigger\?\.isConnected[\s\S]*?target\.focus\(\)/,
  'Closing the reader drawer must safely restore focus even if its original trigger was removed.');
assert.match(app,/document\.addEventListener\('focusin',[\s\S]*?drawer\.contains\(e\.target\)[\s\S]*?focus\(\)/,
  'Programmatic focus must not escape the open modal drawer.');
assert.match(app,/node\.getClientRects\(\)\.length>0/,
  'Hidden chapter search results and off-screen controls must not enter the focus trap.');
assert.match(app,/const closeReaderDrawer=\(restoreFocus=true\)=>\{[\s\S]*?if\(restoreFocus\)/,
  'Closing the reader drawer must return focus to the element that opened it.');
assert.match(css,/\.chapterDrawerScrim\{position:fixed;z-index:70;inset:74px 0 0;/,
  'The scrim must cover the page beneath the sticky reader toolbar.');
assert.match(css,/@media\(max-width:760px\)\{\.chapterDrawer\{top:64px;width:min\(420px,96vw\)/,
  'The reader drawer must use the compact mobile viewport.');
assert.match(css,/padding-bottom:calc\(90px \+ env\(safe-area-inset-bottom\)\)/,
  'The reader page must respect mobile safe-area insets.');

console.log('Reader drawer modal, keyboard, focus and mobile viewport checks passed.');
