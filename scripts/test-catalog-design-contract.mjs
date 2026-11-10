import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('public/app.js', 'utf8');
const css = fs.readFileSync('public/imperial-ui-primitives.css', 'utf8');
const start = app.indexOf('async function catalog(){');
const end = app.indexOf('\nasync function formatDirectory(', start);
assert.ok(start >= 0 && end > start, 'Catalog renderer must exist');
const catalog = app.slice(start, end);

for (const id of ['cf','resultCount','activeFilters','cat','pager']) {
  assert.ok(catalog.includes('id="'+id+'"'), 'Catalog must preserve interaction target: '+id);
}
for (const name of ['q','sort','status','kind','min_rating','genre','tag','language']) {
  assert.ok(catalog.includes('name="'+name+'"'), 'Catalog filter must remain available: '+name);
}
assert.ok(catalog.includes('apiWithTimeout(\'/api/novels?\'+p'), 'Catalog results must remain server-backed');
assert.ok(catalog.includes("apiWithTimeout('/api/formats')"), 'Format options must use the platform format registry');
assert.ok(catalog.includes('renderFilterChips'), 'Active filters must remain removable');
assert.ok(catalog.includes('catalogRetry'), 'Catalog network failure must offer retry');
assert.ok(catalog.includes('d.page>1') && catalog.includes('d.page+1'), 'Previous and next pagination must remain');
assert.ok(catalog.includes('Discover your next'), 'New editorial catalog heading must exist');
assert.ok(!catalog.includes('catalogTop panel'), 'Superseded catalog panel must be removed');
assert.ok(css.includes('.in-catalog-controls') && css.includes('.in-catalog-filter-grid') && css.includes('.in-catalog-grid'), 'Canonical catalog components must be styled');
assert.ok(css.includes('@media(max-width:38rem)'), 'Catalog must have a small-screen layout');
console.log('Catalog design contract passed.');
