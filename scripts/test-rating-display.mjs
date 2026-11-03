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
  [5, '5/5'], [4.6, '5/5'], [3.4, '3/5'], ['2.2', '2/5'],
  [null, 'Not rated'], [undefined, 'Not rated'], [0, 'Not rated'],
  [-1, 'Not rated'], [6, 'Not rated'], ['invalid', 'Not rated'], [NaN, 'Not rated']
];
for (const [value, expected] of cases) assert.equal(ratingText(value), expected, 'Unexpected display for ' + String(value));

assert.equal((source.match(/ratingText\(n\.rating\)/g) || []).length, 6, 'All six public rating surfaces must use the shared formatter');
assert.ok(!source.includes('Number(n.rating||0).toFixed(1)'), 'Missing ratings must never be rendered as fabricated 0.0 values');
console.log('Rating display regression passed: 1–5 scale, whole-number labels, missing/invalid ratings, and source/served parity.');
