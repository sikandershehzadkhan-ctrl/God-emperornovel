import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/index.js', 'utf8');
const routeStart = source.indexOf('if(p==="/api/rating"&&m==="POST")');
assert.notEqual(routeStart, -1, 'Rating write route must exist');
const route = source.slice(routeStart, routeStart + 1800);
assert.ok(
  route.includes('rating=Number(b.rating)'),
  'Rating input must be parsed without rounding'
);
assert.ok(
  route.includes('!Number.isSafeInteger(nid)||nid<1||!Number.isSafeInteger(rating)||rating<1||rating>5'),
  'Rating and novel ID must both be positive safe integers, with rating in range'
);
assert.ok(
  !route.includes('Math.round(Number(b.rating))'),
  'Fractional ratings must not be silently rounded'
);

// Exercise the exact validation rule used by the route against malformed inputs.
const valid = vm.runInNewContext(
  '(nid,rating)=>Number.isSafeInteger(nid)&&nid>=1&&Number.isSafeInteger(rating)&&rating>=1&&rating<=5'
);
for (const rating of [1, 2, 3, 4, 5]) assert.equal(valid(42, rating), true);
for (const rating of [0, 6, -1, 1.2, 4.9, NaN, Infinity, '5', null, undefined, 'not-a-number']) {
  assert.equal(valid(42, rating), false, 'Invalid rating accepted: ' + String(rating));
}
for (const nid of [0, -1, 1.5, NaN, Infinity, '42', null, undefined]) {
  assert.equal(valid(nid, 5), false, 'Invalid novel id accepted: ' + String(nid));
}
console.log('Rating input regression passed: integer 1–5 only; positive safe-integer novel IDs; no rounding or NaN bypass.');
