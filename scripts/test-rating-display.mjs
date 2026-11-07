import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('public/app.js', 'utf8');
const served = fs.readFileSync('public/app-17.23.0.js', 'utf8');
assert.equal(source, served, 'Editable app source and served runtime must remain identical');

const match = source.match(/function ratingText\(value\)\s*\{[\s\S]*?\}/);
assert.ok(match, 'A shared truthful rating formatter must exist');
const ratingText = vm.runInNewContext(match[0] + '; ratingText');
const cases = [
  [10, '10/10'], [9.6, '10/10'], [8.4, '8/10'], ['2.2', '2/10'], [1, '1/10'],
  [null, 'Not rated'], [undefined, 'Not rated'], [0, 'Not rated'],
  [-1, 'Not rated'], [11, 'Not rated'], ['invalid', 'Not rated'], [NaN, 'Not rated']
];
for (const [value, expected] of cases) assert.equal(ratingText(value), expected, 'Unexpected display for ' + String(value));

assert.equal((source.match(/ratingText\(n\.rating\)/g) || []).length, 6, 'All six public rating surfaces must use the shared formatter');
assert.ok(!source.includes('Number(n.rating||0).toFixed(1)'), 'Missing ratings must never be rendered as fabricated 0.0 values');

const worker = fs.readFileSync('src/index.js', 'utf8');
const ratingIsland = fs.readFileSync('src/react/NovelRating.jsx', 'utf8');
const ratingCss = fs.readFileSync('public/app-17.23.0.css', 'utf8');
assert.ok(worker.includes('CHECK(rating BETWEEN 1 AND 10)'), 'Runtime bootstrap must enforce the 1–10 database constraint');
assert.equal(worker.split('rating<1||rating>10').length - 1, 2, 'All rating write handlers must validate the 1–10 range');
assert.ok(worker.includes('Math.min(10,minRating)'), 'Catalog minimum-rating filter must clamp to the ten-point scale');
assert.ok(worker.includes("Number(x.rating||0)>=9?'S':Number(x.rating||0)>=8?'A':Number(x.rating||0)>=6?'B':'C'"), 'Tier-list thresholds must be calibrated for the ten-point scale');
assert.ok(ratingIsland.includes('Array.from({ length: 10 }'), 'Rating control must expose ten selectable values');
assert.ok(ratingIsland.includes('Rate ${value} out of 10') && ratingIsland.includes('Your rating: {selected}/10'), 'Rating controls must announce and summarize values out of ten');
assert.ok(ratingIsland.includes('count > 0 ?') && ratingIsland.includes('"Not rated"'), 'Unrated novels must not display a fabricated zero score');
assert.ok(ratingCss.includes('flex-wrap:wrap') && ratingCss.includes('min-width:44px;min-height:44px'), 'Ten rating controls must wrap and preserve 44px touch targets');
assert.ok(source.includes('<option value="9">9+</option>') && source.includes('<option value="4">4+</option>'), 'Catalog rating filters must expose valid ten-point thresholds');


const worker = fs.readFileSync('src/index.js', 'utf8');
const ratingIsland = fs.readFileSync('src/react/NovelRating.jsx', 'utf8');
const ratingCss = fs.readFileSync('public/app-17.23.0.css', 'utf8');
assert.ok(worker.includes('CHECK(rating BETWEEN 1 AND 10)'), 'Runtime bootstrap must enforce the 1–10 database constraint');
assert.equal(worker.split('if(!nid||!Number.isInteger(rating)||rating<1||rating>10)').length - 1, 2, 'Both rating write handlers must reject fractional and out-of-range values');
assert.ok(worker.includes('Math.min(10,minRating)'), 'Catalog minimum-rating filter must clamp to the ten-point scale');
assert.ok(worker.includes("Number(x.rating||0)>=9?'S':Number(x.rating||0)>=8?'A':Number(x.rating||0)>=6?'B':'C'"), 'Tier-list thresholds must be calibrated for the ten-point scale');
assert.ok(ratingIsland.includes('Array.from({ length: 10 }'), 'Rating control must expose ten selectable values');
assert.ok(ratingIsland.includes('Rate ${value} out of 10') && ratingIsland.includes('Your rating: {selected}/10'), 'Rating controls must announce and summarize values out of ten');
assert.ok(ratingIsland.includes('count > 0 ?') && ratingIsland.includes('"Not rated"'), 'Unrated novels must not display a fabricated zero score');
assert.ok(ratingCss.includes('flex-wrap:wrap') && ratingCss.includes('min-width:44px;min-height:44px'), 'Ten rating controls must wrap and preserve 44px touch targets');
assert.ok(source.includes('<option value="9">9+</option>') && source.includes('<option value="4">4+</option>'), 'Catalog rating filters must expose valid ten-point thresholds');

console.log('Rating display regression passed: 1–10 scale, whole-number labels, missing/invalid ratings, and source/served parity.');
