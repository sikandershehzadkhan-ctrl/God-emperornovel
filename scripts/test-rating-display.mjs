import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const packageManifest = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = String(packageManifest.version || '').trim();
assert.match(version, /^\d+\.\d+\.\d+$/, 'Package version must be a valid semantic release version');

const source = fs.readFileSync('public/app.js', 'utf8');
const servedPath = `public/app-${version}.js`;
const served = fs.readFileSync(servedPath, 'utf8');
assert.equal(source, served, `Editable app source and current ${version} served runtime must remain identical`);

const match = source.match(/function ratingText\(value\)\s*\{[\s\S]*?\}/);
assert.ok(match, 'A shared truthful rating formatter must exist');
const ratingText = vm.runInNewContext(match[0] + '; ratingText');
const cases = [
  [10, '10/10'], [9.6, '10/10'], [7.4, '7/10'], ['2.2', '2/10'],
  [null, 'Not rated'], [undefined, 'Not rated'], [0, 'Not rated'],
  [-1, 'Not rated'], [11, 'Not rated'], ['invalid', 'Not rated'], [NaN, 'Not rated']
];
for (const [value, expected] of cases) assert.equal(ratingText(value), expected, 'Unexpected display for ' + String(value));

assert.equal((source.match(/ratingText\(n\.rating\)/g) || []).length, 6, 'All six public rating surfaces must use the shared formatter');
assert.ok(!source.includes('Number(n.rating||0).toFixed(1)'), 'Missing ratings must never be rendered as fabricated 0.0 values');
assert.ok(source.includes('<option value="8">8+ / 10</option><option value="6">6+ / 10</option><option value="4">4+ / 10</option>'),
  'Minimum-rating filters must use the 1-10 scale');

console.log('Rating display regression passed: 1–10 scale, whole-number labels, missing/invalid ratings, and source/served parity.');
