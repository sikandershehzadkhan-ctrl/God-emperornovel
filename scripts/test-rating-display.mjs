import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.23.0.js', 'utf8');
const worker = fs.readFileSync('src/index.js', 'utf8');
const ratingComponent = fs.readFileSync('src/react/NovelRating.jsx', 'utf8');
const migration = fs.readFileSync('migrations/0012_rating_scale_10.sql', 'utf8');
const styles = fs.readFileSync('public/app-17.23.0.css', 'utf8');
assert.equal(source, served, 'Editable app source and served runtime must remain identical');

const match = source.match(/function ratingText\(value\)\s*\{[\s\S]*?\}/);
assert.ok(match, 'A shared truthful rating formatter must exist');
const ratingText = vm.runInNewContext(match[0] + '; ratingText');
const cases = [
  [10, '10/10'], [9.6, '10/10'], [8.4, '8/10'], ['2.2', '2/10'],
  [1, '1/10'], [null, 'Not rated'], [undefined, 'Not rated'], [0, 'Not rated'],
  [-1, 'Not rated'], [11, 'Not rated'], ['invalid', 'Not rated'], [NaN, 'Not rated']
];
for (const [value, expected] of cases) assert.equal(ratingText(value), expected, 'Unexpected display for ' + String(value));

assert.equal((source.match(/ratingText\(n\.rating\)/g) || []).length, 6, 'All six public rating surfaces must use the shared formatter');
assert.ok(!source.includes('Number(n.rating||0).toFixed(1)'), 'Missing ratings must never be rendered as fabricated 0.0 values');
assert.match(worker, /CHECK\(rating BETWEEN 1 AND 10\)/, 'New ratings must be constrained to integers 1–10');
assert.match(worker, /rating>10\)return json\(\{error:"Rating must be 1-10"\},400\)/, 'Rating API must reject values outside 1–10');
assert.match(worker, /Math\.min\(10,minRating\)/, 'Catalog minimum-rating filter must support the 10-point scale');
assert.match(ratingComponent, /\[1, 2, 3, 4, 5, 6, 7, 8, 9, 10\]/, 'Rating control must expose ten choices');
assert.ok(ratingComponent.includes('Math.round(average)} / 10'), 'Rating average must display as a whole number out of 10');
assert.match(styles, /\.ratingStars\{display:flex;flex-wrap:wrap/, 'Ten rating controls must wrap on narrow screens');
assert.match(styles, /\.ratingStar\{[^}]*min-width:44px;min-height:44px/, 'Rating choices must meet the 44px touch target');
assert.match(migration, /rating\*2/, 'Migration must preserve legacy relative rating positions');
assert.match(migration, /CHECK\(rating BETWEEN 1 AND 10\)/, 'Migrated table must enforce the new scale');
assert.match(migration, /UPDATE novels[\s\S]*AVG\(r\.rating\)/, 'Novel aggregate ratings must be recalculated from migrated votes');
console.log('Rating scale regression passed: 1–10 API, schema, migration, whole-number display, and source/served parity.');
