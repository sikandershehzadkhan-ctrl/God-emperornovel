import fs from 'node:fs';
import assert from 'node:assert/strict';

const css = fs.readFileSync('public/imperial-design-system.css', 'utf8');
const html = fs.readFileSync('public/index.html', 'utf8');
const admin = fs.readFileSync('public/admin.html', 'utf8');

const media = [...css.matchAll(/@media\s*\((?:max|min)-width:\s*(\d+)px\)/g)].map(match => Number(match[1]));
for (const width of [1080, 900, 760, 700, 640, 390, 360]) {
  assert.ok(media.includes(width), 'Responsive design must retain a deliberate breakpoint at ' + width + 'px.');
}

assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.adminWrap\s*\{\s*padding:\s*14px 0 92px;/,
  'Administrator shell must reduce its outer spacing on mobile.');
assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.adminGrid\s*\{\s*grid-template-columns:\s*repeat\(2,minmax\(0,1fr\)\)/,
  'Administrator overview cards must reflow to two columns on mobile.');
assert.match(css, /@media\s*\(max-width:\s*700px\)[\s\S]*?\.chapterTools\s*\{\s*grid-template-columns:\s*1fr;/,
  'Chapter administration controls must stack on narrow screens.');
assert.match(css, /@media\s*\(max-width:\s*700px\)[\s\S]*?\.chapterRow\s*\{\s*grid-template-columns:\s*1fr;/,
  'Chapter administration rows must become a readable single-column layout.');
assert.match(css, /@media\s*\(max-width:\s*360px\)[\s\S]*?\.authorWorkActions[^}]*flex-basis:\s*100%/,
  'Creator workspace actions must stack on very narrow phones.');

for (const selector of [
  '.adminWrap', '.adminHero', '.adminGrid', '.adminCard', '.adminTable',
  '.chapterTools', '.chapterRow', '.authorStudioLayout', '.authorCreateForm',
  '.comicPageComposerGrid', '.readerBar', '.readerContent'
]) {
  assert.ok(css.includes(selector), 'Responsive page-family styling must cover ' + selector + '.');
}

assert.match(css, /minmax\(0,\s*1fr\)/,
  'Responsive grids must permit content to shrink instead of forcing horizontal overflow.');
assert.match(css, /overflow-wrap:\s*anywhere/,
  'Long identifiers and creator-entered content must wrap within narrow layouts.');
assert.match(css, /html\[dir="rtl"\]\s+\.adminWrap\s+\.adminTable\s+th/,
  'Administrator table direction must be explicitly adapted for RTL.');
const rtlNav = css.match(/html\[dir="rtl"\]\s+\.adminWrap\s+\.mobileAdmin\s*\{([^}]*)\}/);
assert.ok(rtlNav, 'Floating administrator navigation must have a dedicated RTL rule.');
assert.match(rtlNav[1], /inset-inline-start:\s*auto;/,
  'RTL floating navigation must reset its logical start edge.');
assert.match(rtlNav[1], /inset-inline-end:\s*10px;/,
  'RTL floating navigation must anchor to the logical end edge.');
assert.doesNotMatch(rtlNav[1], /(?:^|[;\s])(?:left|right)\s*:/,
  'RTL floating navigation must not use physical left/right positioning.');

for (const shell of [html, admin]) {
  assert.equal((shell.match(/rel="stylesheet"/g) || []).length, 1,
    'Each application shell must continue to load only the unified stylesheet.');
  assert.match(shell, /href="\/imperial-design-system\.css"/,
    'Each application shell must load the canonical design system.');
}

console.log('Responsive and RTL design contracts passed.');
