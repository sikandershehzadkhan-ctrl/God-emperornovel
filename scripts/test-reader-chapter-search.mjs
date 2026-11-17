import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('public/app.js','utf8');
const served=fs.readFileSync('public/app-17.23.0.js','utf8');
const css=fs.readFileSync('public/imperial-design-system.css','utf8');

assert.equal(app,served,'Editable and served browser bundles must remain byte-identical.');
assert.match(app,/<input id="readerChapterSearch" type="search"/,'The reader drawer must expose a native chapter search input.');
assert.match(app,/aria-controls="readerChapterResults"/,'The search input must identify its chapter results.');
assert.match(app,/role="status" aria-live="polite"/,'Search result changes must be announced politely.');
assert.match(app,/item\.textContent\.toLocaleLowerCase\(\)\.includes\(query\)/,'Search must match chapter numbers and titles case-insensitively.');
assert.match(app,/item\.hidden=!match/,'Non-matching chapters must leave visual and keyboard navigation.');
assert.match(app,/No chapters match your search\./,'An empty search result must be explained.');
assert.match(css,/\.readerChapterItem\[hidden\]\{display:none!important\}/,'Hidden results must remain hidden despite chapter display styles.');
assert.match(css,/min-height:44px/,'The search control must meet the mobile touch-target minimum.');
assert.match(css,/\.readerChapterSearch input:focus-visible/,'The search control must have visible keyboard focus.');

console.log('Reader chapter search, live announcements, keyboard filtering and mobile target checks passed.');
