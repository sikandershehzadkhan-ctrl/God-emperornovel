import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolve } from 'node:path';

function findEvidence(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return null;
  seen.add(value);
  if (typeof value.schema_evidence === 'string') {
    try { return JSON.parse(value.schema_evidence); } catch { return null; }
  }
  if (value.schema_evidence && typeof value.schema_evidence === 'object') return value.schema_evidence;
  if (Array.isArray(value)) {
    for (const item of value) { const found = findEvidence(item, seen); if (found) return found; }
  } else {
    for (const item of Object.values(value)) { const found = findEvidence(item, seen); if (found) return found; }
  }
  return null;
}
function normalize(raw) {
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch (error) { throw new Error('Wrangler output is not valid JSON; preserve the raw output and do not treat it as evidence. ' + error.message); }
  const evidence = findEvidence(parsed);
  assert.ok(evidence, 'Wrangler JSON did not contain the schema_evidence result cell.');
  assert.equal(evidence.database, 'god-emperornovel-db', 'Evidence database identity does not match the configured production D1.');
  assert.ok(typeof evidence.auditedAt === 'string' && !Number.isNaN(Date.parse(evidence.auditedAt)), 'Evidence audit timestamp is invalid.');
  assert.equal(evidence.inventoryComplete, true, 'Evidence must explicitly mark a complete inventory.');
  assert.ok(Array.isArray(evidence.tables) && evidence.tables.length > 0, 'Evidence has no table inventory.');
  assert.ok(Array.isArray(evidence.indexes), 'Evidence has no index inventory.');
  assert.ok(Array.isArray(evidence.foreignKeys), 'Evidence has no foreign-key inventory.');
  const tableNames = new Set();
  for (const table of evidence.tables) {
    assert.ok(table.name && Array.isArray(table.columns), 'Malformed table evidence.');
    assert.ok(!tableNames.has(table.name), 'Duplicate table in evidence: ' + table.name);
    tableNames.add(table.name);
    for (const column of table.columns) {
      for (const key of ['name','type','notnull','dflt_value','pk']) assert.ok(Object.hasOwn(column,key), 'Column evidence missing ' + key + ': ' + table.name);
    }
    for (const fk of table.foreignKeys || []) evidence.foreignKeys.push({ table: table.name, ...fk });
  }
  const indexNames = new Set();
  for (const index of evidence.indexes) {
    assert.ok(index.name && index.table && Array.isArray(index.columns), 'Malformed index evidence.');
    assert.ok(!indexNames.has(index.name), 'Duplicate index in evidence: ' + index.name);
    indexNames.add(index.name);
  }
  return evidence;
}
function selfTest() {
  const evidence = { database:'god-emperornovel-db',auditedAt:'2026-11-22T00:00:00Z',inventoryComplete:true,
    tables:[{name:'agents',sql:'CREATE TABLE agents(id INTEGER)',columns:[{name:'id',type:'INTEGER',notnull:0,dflt_value:null,pk:1}],foreignKeys:[]}],
    indexes:[{name:'idx_agent_runs_agent',table:'agent_runs',unique:0,columns:['agent_id','created_at'],sql:'CREATE INDEX...'}],foreignKeys:[] };
  const wrapper = JSON.stringify([{results:[{schema_evidence:JSON.stringify(evidence)}],success:true}]);
  assert.deepEqual(normalize(wrapper),evidence);
  assert.throws(()=>normalize(JSON.stringify([{results:[{schema_evidence:'{}'}]}])),/database identity/);
  assert.throws(()=>normalize('not json'),/not valid JSON/);
}
if (process.argv.includes('--self-test')) {
  selfTest();
  console.log('PASS: Wrangler JSON evidence is extracted and completeness/schema identity are enforced.');
} else {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) { console.error('Usage: node scripts/normalize-runtime-schema-audit.mjs <wrangler-json> <evidence-json>'); process.exit(2); }
  const evidence = normalize(fs.readFileSync(resolve(input),'utf8'));
  fs.writeFileSync(resolve(output),JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});
  console.log('Wrote normalized production schema evidence to ' + output);
}
export { normalize };
