import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('src/index.js', 'utf8');
const index = fs.readFileSync('public/index.html', 'utf8');
const appSource = fs.readFileSync('public/app.js', 'utf8');
const registryMatch = source.match(/const CONTENT_FORMATS=(\[[\s\S]*?\n\];)/);
assert.ok(registryMatch, 'Server-owned content format registry exists');
const formats = [...registryMatch[1].matchAll(/\{id:"([a-z_]+)",label:"([^"]+)",group:"([a-z]+)"\}/g)]
  .map(([, id, label, group]) => ({ id, label, group }));
assert.ok(formats.length >= 12, 'Registry includes a broad set of formats');
assert.equal(new Set(formats.map(x => x.id)).size, formats.length, 'Format IDs are unique');
assert.ok(formats.every(x => x.label.trim() && x.group.trim()), 'Every format has a label and group');
assert.ok(source.includes('if(p==="/api/formats"&&m==="GET")'), 'Public format registry endpoint exists');
assert.ok(source.includes('CONTENT_FORMAT_IDS.has(kind)'), 'Author/admin publishing validates format IDs');
assert.ok(source.includes('supported_formats:CONTENT_FORMATS.map'), 'Invalid formats return accepted IDs');

const scriptMatch = index.match(/<script src="\\/([^"]+\\.js)" defer><\\/script>/);
assert.ok(scriptMatch, 'HTML entry references a versioned application bundle');
assert.ok(fs.existsSync('public/' + scriptMatch[1]), 'HTML application bundle exists');
const appFiles = ['app.js', scriptMatch[1]];
for (const name of new Set(appFiles)) {
  const app = fs.readFileSync('public/' + name, 'utf8');
  assert.ok(app.includes("async function formatDirectory()"), name + ' includes format directory');
  assert.ok(app.includes("async function formatLanding(kind)"), name + ' includes format-specific shelves');
  assert.ok(app.includes("api('/api/formats')"), name + ' consumes server-owned format registry');
  assert.ok(app.includes("p==='/formats'"), name + ' routes the format directory');
  assert.ok(app.includes('/format/'), name + ' links to format-specific shelves');
}
assert.ok(index.includes('/imperial-formats-17.15.0.css'), 'HTML references versioned format styles');
assert.ok(fs.existsSync('public/imperial-formats-17.15.0.css'), 'Versioned format stylesheet exists');
console.log('Content format checks passed: ' + formats.length + ' canonical formats, ' + new Set(appFiles).size + ' frontend bundles, entry assets verified.');
