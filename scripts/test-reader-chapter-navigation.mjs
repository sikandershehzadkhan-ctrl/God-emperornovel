import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('public/app.js','utf8');
const served=fs.readFileSync('public/app-17.23.0.js','utf8');
const worker=fs.readFileSync('src/index.js','utf8');
const css=fs.readFileSync('public/imperial-design-system.css','utf8');

assert.equal(app,served,'Editable and served browser bundles must remain byte-identical.');
assert.ok(app.includes('<nav class="readerActions" aria-label="Chapter navigation">') && app.includes('</nav></article>'),'Previous, chapter-list and next controls must be grouped in a named navigation landmark.');
assert.doesNotMatch(app,/<div class="readerActions">/,'Chapter navigation must not remain an unnamed generic container.');
assert.match(app,/d\.previous\?\x60<a class="secondary" rel="prev" aria-label="Previous chapter:/,'Available previous chapters must expose a semantic previous link.');
assert.match(app,/d\.next\?\x60<a class="primary" rel="next" aria-label="Next chapter:/,'Available next chapters must expose a semantic next link.');
assert.match(app,/readerNavDisabled[^>]*aria-disabled="true">← First chapter/,'The first chapter must show a non-interactive first-chapter boundary.');
assert.match(app,/readerNavDisabled[^>]*aria-disabled="true">Last chapter →/,'The last chapter must show a non-interactive last-chapter boundary.');
assert.match(app,/Number\(d\.previous\.chapter_number\)/,'Previous navigation must use the server-provided previous chapter number.');
assert.match(app,/Number\(d\.next\.chapter_number\)/,'Next navigation must use the server-provided next chapter number.');
assert.match(worker,/chapter_number<\? ORDER BY chapter_number DESC LIMIT 1/,'The backend must select the nearest lower published chapter.');
assert.match(worker,/chapter_number>\? ORDER BY chapter_number LIMIT 1/,'The backend must select the nearest higher published chapter.');
assert.match(worker,/c\.publication_status='published'.*ORDER BY chapter_number DESC LIMIT 1/,'Previous navigation must exclude unpublished chapters.');
assert.match(worker,/c\.publication_status='published'.*ORDER BY chapter_number LIMIT 1/,'Next navigation must exclude unpublished chapters.');
assert.match(css,/\.readerNavDisabled\{[^}]*cursor:not-allowed/,'Boundary states must be visually non-interactive.');
assert.match(css,/\.readerNavDisabled\{[^}]*user-select:none/,'Boundary states must not look like selectable links.');
assert.match(css,/@media\(max-width:760px\)\{\.readerNavDisabled\{min-height:44px/,'Mobile boundary states must retain a 44px touch-height footprint.');

console.log('Reader chapter navigation boundaries, semantic links, published ordering and mobile states passed.');
