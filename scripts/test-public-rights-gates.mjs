import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
const lines = source.split('\n');
const catalog = lines.find(line => line.includes('let sql=')) || '';
const detail = lines.find(line => line.includes('let nm=p.match')) || '';
const chapter = lines.find(line => line.includes('let cm=p.match')) || '';
const unlock = lines.find(line => line.includes('const id=p.split') && line.includes('unlock')) || '';
const batch = lines.find(line => line.includes('let bu=p.match')) || '';
for (const [name, line] of Object.entries({catalog, detail, chapter, unlock, batch})) {
  assert.ok(line.includes('rights_status IN'), name + ' must enforce rights allowlist');
  for (const status of ['original','public_domain','licensed','authorized']) assert.ok(line.includes(status), name + ' missing allowed status ' + status);
}
console.log('PASS: catalog, novel detail, chapter reader, single unlock and batch unlock enforce the eligible rights allowlist.');
