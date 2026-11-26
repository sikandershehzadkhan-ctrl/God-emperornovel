import assert from 'node:assert/strict';
import fs from 'node:fs';

const app=fs.readFileSync('public/app-17.24.0.js','utf8');
const css=fs.readFileSync('public/imperial-homepage-17.24.0.css','utf8');

assert.ok(app.includes("async function catalog()"),'Catalog route renderer must remain present');
assert.ok(app.includes("apiWithTimeout('/api/novels?'+p,{},12000)"),'Catalog must continue using its existing live novels API');
assert.ok(app.includes("p.set('limit','24')"),'Catalog page size must remain unchanged');
assert.ok(app.includes('items.map(catalogCard).join()'),'Catalog must keep rendering the existing story card projection');
assert.ok(app.includes('name="min_rating"'),'Minimum rating filter must remain available');
assert.ok(app.includes('name="genre"')&&app.includes('name="tag"')&&app.includes('name="language"'),'Genre, tag and language filters must remain available');
assert.ok(app.includes("href="/catalog""),'Catalog reset path must remain available');
assert.ok(css.includes('#cat.catalogGrid{')&&css.includes('grid-template-columns:repeat(4,minmax(0,1fr))'),'Desktop catalog must retain a four-column grid');
assert.ok(css.includes('@media(max-width:680px)')&&css.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'Catalog must adapt to two columns on mobile');
assert.ok(css.includes('@media(max-width:360px)'),'Very narrow phones must receive a compact card layout');
assert.ok(css.includes('html[data-theme="dark"] #cat .catalogCard'),'Catalog cards must define an explicit dark theme');
assert.ok(css.includes('html[data-theme="dark"] .catalogTop'),'Catalog filters must define an explicit dark theme');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'),'Catalog must honor reduced-motion preferences');
assert.ok(css.includes('@media(forced-colors:active)'),'Catalog must preserve forced-colors usability');

console.log('Imperial catalog presentation checks passed: live API/filter preservation, editorial cards, responsive layout, themes and accessibility.');
