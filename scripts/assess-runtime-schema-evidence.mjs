import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolve } from 'node:path';

const EXPECTED = {
  tables: {
    agents: ['id','slug','name','role','icon','mode','status','enabled','last_run_at','last_result','created_at'],
    agent_runs: ['id','agent_id','trigger','result','status','created_at'],
    taxonomy_submissions: ['id','type','name','slug','description','creator_id','creator_name','status','created_at','reviewed_at','reviewer_id']
  },
  columns: {
    comments: ['parent_id','edited_at'],
    novels: ['review_feedback','reviewed_by','reviewed_at'],
    connectors: ['search_url','auth_header','secret_name','rights_evidence_url','terms_url','rights_notes','metadata_import_allowed','attribution_required']
  },
  indexes: ['idx_agent_runs_agent']
};

function assess(evidence) {
  assert.ok(evidence && typeof evidence === 'object', 'Schema evidence JSON is required.');
  assert.equal(evidence.database, 'god-emperornovel-db',
    'Schema evidence must identify the configured production D1 database.');
  assert.ok(typeof evidence.auditedAt === 'string' && !Number.isNaN(Date.parse(evidence.auditedAt)),
    'Schema evidence must include a valid audit timestamp.');
  assert.equal(typeof evidence.inventoryComplete, 'boolean',
    'Schema inventory completeness must be explicitly declared.');
  assert.ok(Array.isArray(evidence.tables), 'Schema evidence must include tables.');
  assert.ok(Array.isArray(evidence.indexes), 'Schema evidence must include indexes.');

  const tables = new Map();
  for (const table of evidence.tables) {
    assert.ok(table && typeof table.name === 'string' && table.name.trim(), 'Every table needs a name.');
    assert.ok(!tables.has(table.name), 'Duplicate table evidence: ' + table.name);
    assert.ok(Array.isArray(table.columns), 'Every table needs a columns array: ' + table.name);
    const columns = new Map();
    for (const column of table.columns) {
      assert.ok(column && typeof column.name === 'string' && column.name.trim(), 'Every column needs a name.');
      assert.ok(!columns.has(column.name), 'Duplicate column evidence: ' + table.name + '.' + column.name);
      columns.set(column.name, column);
    }
    tables.set(table.name, columns);
  }
  const indexes = new Set();
  for (const index of evidence.indexes) {
    assert.ok(typeof index === 'string' && index.trim(), 'Index evidence entries must be names.');
    assert.ok(!indexes.has(index), 'Duplicate index evidence: ' + index);
    indexes.add(index);
  }

  const rows = [];
  const checkTable = (name, requiredColumns) => {
    if (!tables.has(name)) {
      rows.push({ object: 'table', name, status: evidence.inventoryComplete ? 'missing' : 'unknown',
        reason: evidence.inventoryComplete ? 'Absent from a complete table inventory.' : 'Absent from an incomplete inventory.' });
      return;
    }
    rows.push({ object: 'table', name, status: 'present', reason: 'Table exists in captured schema evidence.' });
    for (const column of requiredColumns) {
      const found = tables.get(name).get(column);
      rows.push({ object: 'column', name: name + '.' + column,
        status: found ? 'present' : evidence.inventoryComplete ? 'missing' : 'unknown',
        reason: found ? 'Column exists; type/default/constraints still require definition-level review.' :
          evidence.inventoryComplete ? 'Column absent from complete PRAGMA table_info evidence.' :
            'Column absent from incomplete PRAGMA table_info evidence.' });
    }
  };
  for (const [name, columns] of Object.entries(EXPECTED.tables)) checkTable(name, columns);
  for (const [name, columns] of Object.entries(EXPECTED.columns)) {
    if (!tables.has(name)) {
      rows.push({ object: 'table', name, status: evidence.inventoryComplete ? 'missing' : 'unknown',
        reason: 'Required parent table is not present in captured evidence.' });
      continue;
    }
    for (const column of columns) {
      const found = tables.get(name).get(column);
      rows.push({ object: 'column', name: name + '.' + column,
        status: found ? 'present' : evidence.inventoryComplete ? 'missing' : 'unknown',
        reason: found ? 'Column exists; type/default/constraints still require definition-level review.' :
          evidence.inventoryComplete ? 'Column absent from complete PRAGMA table_info evidence.' :
            'Column absent from incomplete PRAGMA table_info evidence.' });
    }
  }
  for (const name of EXPECTED.indexes) rows.push({
    object: 'index', name,
    status: indexes.has(name) ? 'present' : evidence.inventoryComplete ? 'missing' : 'unknown',
    reason: indexes.has(name) ? 'Index name exists; SQL definition still requires comparison.' :
      evidence.inventoryComplete ? 'Index absent from complete sqlite_master index inventory.' :
        'Index absent from incomplete index inventory.'
  });
  const counts = Object.fromEntries(['present','missing','mismatch','unknown'].map(status =>
    [status, rows.filter(row => row.status === status).length]));
  return {
    format: 'imperial-novel-runtime-schema-assessment/v1',
    database: evidence.database,
    auditedAt: evidence.auditedAt,
    inventoryComplete: evidence.inventoryComplete,
    counts,
    schemaObjectsPresentByName: counts.missing === 0 && counts.unknown === 0,
    releaseReady: false,
    limitation: 'Presence-only assessment. It does not compare full SQL definitions, constraints, foreign keys, data, migration provenance, backup readiness, or rehearsal results. It never authorizes migration or deployment.',
    rows
  };
}

function selfTest() {
  const base = { database: 'god-emperornovel-db', auditedAt: '2026-11-22T00:00:00Z', inventoryComplete: true,
    tables: [
      { name: 'agents', columns: EXPECTED.tables.agents.map(name => ({ name })) },
      { name: 'agent_runs', columns: EXPECTED.tables.agent_runs.map(name => ({ name })) },
      { name: 'taxonomy_submissions', columns: EXPECTED.tables.taxonomy_submissions.map(name => ({ name })) },
      { name: 'comments', columns: ['parent_id','edited_at'].map(name => ({ name })) },
      { name: 'novels', columns: ['review_feedback','reviewed_by','reviewed_at'].map(name => ({ name })) },
      { name: 'connectors', columns: EXPECTED.columns.connectors.map(name => ({ name })) }
    ], indexes: ['idx_agent_runs_agent'] };
  let result = assess(base);
  assert.equal(result.schemaObjectsPresentByName, true);
  assert.equal(result.releaseReady, false, 'Presence-only evidence must never authorize release.');
  const incomplete = assess({ ...base, inventoryComplete: false, indexes: [] });
  assert.ok(incomplete.counts.unknown > 0);
  const missing = assess({ ...base, tables: base.tables.filter(t => t.name !== 'agents') });
  assert.ok(missing.rows.some(row => row.object === 'table' && row.name === 'agents' && row.status === 'missing'));
  assert.throws(() => assess({ ...base, inventoryComplete: 'yes' }), /completeness/);
  assert.throws(() => assess({ ...base, tables: [...base.tables, base.tables[0]] }), /Duplicate table/);
}

if (process.argv.includes('--self-test')) {
  selfTest();
  console.log('PASS: runtime schema assessment classifies present/missing/unknown without authorizing release.');
} else {
  const [evidencePath] = process.argv.slice(2);
  if (!evidencePath) {
    console.error('Usage: node scripts/assess-runtime-schema-evidence.mjs <captured-schema-evidence.json>');
    process.exit(2);
  }
  const result = assess(JSON.parse(fs.readFileSync(resolve(evidencePath), 'utf8')));
  process.stdout.write(JSON.stringify(result, null, 2) + '\\n');
  if (!result.schemaObjectsPresentByName) process.exitCode = 1;
}

export { assess };
