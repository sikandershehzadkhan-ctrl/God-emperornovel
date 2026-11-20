import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('src/index.js', 'utf8');
const postHandlers = source.match(/if\\(p===["']\\/api\\/rating["']&&m===["']POST["']\\)/g) || [];
assert.equal(postHandlers.length, 1, 'there must be exactly one POST /api/rating handler');

const start = source.indexOf('if(p==="/api/rating"&&m==="POST")');
const end = source.indexOf('\\n', start);
assert.notEqual(start, -1, 'the canonical rating handler must exist');
const handler = source.slice(start, end);
assert.match(handler, /const e=need\\(u\\);if\\(e\\)return e;/, 'rating writes must require authentication');
assert.match(handler, /publication_status='published' AND rights_status IN \\('original','public_domain','licensed','authorized'\\)/, 'rating writes must reject unpublished or rights-ineligible novels');
assert.match(handler, /INSERT INTO ratings/, 'the canonical handler must persist ratings');
assert.match(handler, /UPDATE novels SET rating=/, 'the canonical handler must maintain the aggregate rating');

console.log('Canonical rating handler authorization and rights-eligibility checks passed.');
