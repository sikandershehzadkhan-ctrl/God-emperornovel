import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('public/app.js', 'utf8');
const css = fs.readFileSync('public/imperial-ui-primitives.css', 'utf8');
const start = app.indexOf('async function home(){');
const end = app.indexOf('\nasync function catalog(', start);
assert.ok(start >= 0 && end > start, 'Homepage renderer must exist');
const home = app.slice(start, end);

assert.ok(home.includes('The next world'), 'Editorial homepage hero must be present');
assert.ok(!home.includes('Open a world.'), 'Superseded homepage hero must be removed');
assert.ok(home.includes('id="trend"') && home.includes('id="latest"'), 'Live story shelves must retain their data targets');
assert.ok(home.includes('/api/novels?sort=trending&limit=10'), 'Trending shelf must use live catalog data');
assert.ok(home.includes('/api/novels?sort=updated&limit=10'), 'Latest shelf must use live catalog data');
assert.ok(home.includes('uniqueLatestStories'), 'Latest shelf must avoid duplicating trending titles');
assert.ok(home.includes('Story shelves could not be loaded.'), 'Catalog failure state must remain visible');
for (const route of ['/format/original','/format/fanfiction','/format/light_novel','/format/web_novel','/format/manga','/format/manhwa','/author','/community','/trend-factory','/settings']) {
  assert.ok(home.includes('href="'+route+'"'), 'Homepage destination must remain available: '+route);
}
assert.ok(css.includes('.in-home-hero') && css.includes('.in-home-format-grid') && css.includes('.in-home-ecosystem'), 'Canonical homepage components must be styled');
assert.ok(css.includes('@media(max-width:48rem)'), 'Homepage must have a mobile layout');
assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'), 'Homepage must respect reduced motion');
console.log('Homepage design contract passed.');
