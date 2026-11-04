import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('public/app.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const served = fs.readFileSync('public/app-' + pkg.version + '.js', 'utf8');
const worker = fs.readFileSync('src/index.js', 'utf8');
const island = fs.readFileSync('src/react/NovelRating.jsx', 'utf8');
const css = fs.readFileSync('public/app-' + pkg.version + '.css', 'utf8');
const baseline = fs.readFileSync('migrations/0034_ratings_baseline.sql', 'utf8');
const migration = fs.readFileSync('migrations/0035_ten_point_ratings.sql', 'utf8');

assert.equal(source, served, 'Editable app source and served runtime must remain identical');
const match = source.match(/function ratingText\\(value\\)\\s*\\{[\\s\\S]*?\\}/);
assert.ok(match, 'A shared truthful ten-point rating formatter must exist');
const ratingText = vm.runInNewContext(match[0] + '; ratingText');
const cases = [
  [10, '10/10'], [9.6, '10/10'], [8.4, '8/10'], ['2.2', '2/10'],
  [1, '1/10'], [null, 'Not rated'], [undefined, 'Not rated'], [0, 'Not rated'],
  [-1, 'Not rated'], [11, 'Not rated'], ['invalid', 'Not rated'], [NaN, 'Not rated']
];
for (const [value, expected] of cases) assert.equal(ratingText(value), expected, 'Unexpected display for ' + String(value));

assert.ok((source.match(/ratingText\\(n\\.rating\\)/g) || []).length >= 7, 'All public rating surfaces must use the shared formatter');
assert.ok(!source.includes('Number(n.rating||0).toFixed(1)'), 'Missing ratings must never render as fabricated 0.0 values');
assert.ok(source.includes('<option value="8">8+</option><option value="6">6+</option><option value="4">4+</option>'), 'Catalog minimum rating filter must use ten-point thresholds');
assert.ok(worker.includes('rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 10)'), 'Runtime schema must enforce the ten-point scale');
assert.ok((worker.match(/rating>10/g) || []).length === 2, 'Both rating write paths must enforce the ten-point upper bound');
assert.ok(worker.includes('Rating must be a whole number from 1 to 10'), 'Rating API must reject fractions and out-of-range values');
assert.ok(island.includes('[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]'), 'Reader rating control must offer ten whole-number choices');
assert.ok(island.includes('Your rating: {selected}/10') && island.includes('"Not rated yet"'), 'Rating summary must use /10 and a truthful empty state');
assert.ok(css.includes('grid-template-columns:repeat(10,minmax(0,1fr))'), 'Ten rating controls must fit a responsive ten-column grid');
assert.ok(baseline.includes('CREATE TABLE IF NOT EXISTS ratings') && baseline.includes('BETWEEN 1 AND 5'), 'Baseline migration must create the legacy table for fresh databases');
assert.ok(migration.includes('CASE rating WHEN 1 THEN 2 WHEN 2 THEN 4 WHEN 3 THEN 6 WHEN 4 THEN 8 WHEN 5 THEN 10'), 'Migration must preserve old ratings through an even-value scale conversion');
assert.ok(migration.includes('UPDATE novels') && migration.includes('AVG(r.rating)'), 'Migration must recompute stored novel averages');
console.log('Ten-point rating regression passed: API, schema, display, catalog filters, responsive control and source/served parity.');
