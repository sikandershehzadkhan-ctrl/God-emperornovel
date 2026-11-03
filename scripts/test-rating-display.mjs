import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.23.0.js', 'utf8');
const worker = fs.readFileSync('src/index.js', 'utf8');
const island = fs.readFileSync('src/react/NovelRating.jsx', 'utf8');
const migration = fs.readFileSync('migrations/0012_ten_point_ratings.sql', 'utf8');
assert.equal(source, served, 'Editable app source and served runtime must remain identical');

const start = source.indexOf('function ratingText(value){');
assert.ok(start >= 0, 'A shared truthful rating formatter must exist');
const end = source.indexOf('}', start);
assert.ok(end > start, 'Rating formatter must be complete');
const ratingText = vm.runInNewContext(source.slice(start, end + 1) + '; ratingText');
const cases = [
  [10, '10/10'], [9.6, '10/10'], [8.4, '8/10'], ['2.2', '2/10'],
  [1, '1/10'], [null, 'Not rated'], [undefined, 'Not rated'], [0, 'Not rated'],
  [-1, 'Not rated'], [11, 'Not rated'], ['invalid', 'Not rated'], [NaN, 'Not rated']
];
for (const [value, expected] of cases) assert.equal(ratingText(value), expected, 'Unexpected display for ' + String(value));

assert.equal(source.split('ratingText(n.rating)').length - 1, 6, 'All six public rating surfaces must use the shared formatter');
assert.ok(source.includes('name="min_rating"') && source.includes('<option value="8">8+'), 'Catalog minimum rating filter must use the ten-point scale');
assert.ok(worker.includes('rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 10)'), 'Fresh schema must enforce 1-10');
assert.ok(worker.includes('rating>10'), 'Rating API must reject values above 10');
assert.ok(worker.includes('whole number from 1 to 10'), 'Rating API must reject non-integer/out-of-range values with clear guidance');
assert.ok(island.includes('[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]'), 'Reader rating control must offer ten whole-number choices');
assert.ok(!island.includes('Your rating: {selected}/5'), 'Personal rating label must use the ten-point denominator');
assert.ok(island.includes('Not rated yet'), 'Zero votes must not be presented as a real 0.0 rating');
assert.ok(migration.includes('CASE rating WHEN 1 THEN 2 WHEN 2 THEN 4 WHEN 3 THEN 6 WHEN 4 THEN 8 WHEN 5 THEN 10'), 'Migration must preserve old scores by scaling them to even ten-point values');
assert.ok(migration.includes('UPDATE novels') && migration.includes('AVG(r.rating)'), 'Migration must recompute stored novel averages');
assert.ok(!source.includes('Number(n.rating||0).toFixed(1)'), 'Missing ratings must never be rendered as fabricated 0.0 values');
console.log('Rating regression passed: ten-point whole-number inputs, truthful empty states, API/schema bounds, migration mapping and runtime parity.');
