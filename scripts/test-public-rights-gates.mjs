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
const publicAuthors = source.split('\n').filter(line => line.includes('SELECT author,COUNT(*) novel_count')) ;
assert.equal(publicAuthors.length, 2, 'both public author discovery queries must exist');
for (const query of publicAuthors) assert.ok(query.includes("rights_status IN ('original','public_domain','licensed','authorized')"), 'public author discovery must exclude ineligible rights');
const ratingQueries = source.split('\n').filter(line => line.includes("SELECT id FROM novels WHERE id=? AND publication_status='published'"));
assert.ok(ratingQueries.length >= 2, 'rating GET and POST must verify novel eligibility');
for (const query of ratingQueries) assert.ok(query.includes("rights_status IN ('original','public_domain','licensed','authorized')"), 'rating endpoints must exclude ineligible rights');
assert.ok(source.includes("WHERE r.user_id=? AND n.publication_status='published' AND n.rights_status IN ('original','public_domain','licensed','authorized') GROUP BY n.id,r.id"), 'personalized recommendations must enforce rights');
assert.ok(source.includes("WHERE n.publication_status='published' AND n.rights_status IN ('original','public_domain','licensed','authorized') AND n.id NOT IN(SELECT novel_id FROM follows WHERE user_id=?)"), 'fallback recommendations must enforce rights');
console.log('PASS: catalog, detail, chapter, unlock, author discovery, ratings and recommendations enforce the eligible rights allowlist.');
