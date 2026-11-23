import assert from 'node:assert/strict';
import fs from 'node:fs';
import { resolve } from 'node:path';

const col = (name, type, notnull = 0, dflt_value = null, pk = 0) => ({ name, type, notnull, dflt_value, pk });
const EXPECTED_TABLES = {
  media_assets: [
    col('id','INTEGER',0,null,1), col('owner_user_id','INTEGER',1), col('storage_provider','TEXT',1,"'r2'"),
    col('object_key','TEXT',1), col('mime_type','TEXT',1), col('size_bytes','INTEGER',1),
    col('width','INTEGER'), col('height','INTEGER'), col('sha256_hex','TEXT'),
    col('status','TEXT',1,"'pending_upload'"), col('rights_status','TEXT',1,"'pending_review'"),
    col('rights_holder','TEXT',0,"''"), col('license_name','TEXT',0,"''"), col('rights_evidence','TEXT',0,"''"),
    col('created_at','TEXT',1,'CURRENT_TIMESTAMP'), col('uploaded_at','TEXT'), col('reviewed_at','TEXT'),
    col('deleted_at','TEXT'), col('reviewed_by_user_id','INTEGER')
  ],
  comic_chapter_pages: [
    col('id','INTEGER',0,null,1), col('chapter_id','INTEGER',1), col('media_asset_id','INTEGER',1),
    col('page_number','INTEGER',1), col('alt_text','TEXT',1,"''"), col('caption','TEXT',1,"''"),
    col('created_at','TEXT',1,'CURRENT_TIMESTAMP')
  ],
  media_asset_reviews: [
    col('id','INTEGER',0,null,1), col('media_asset_id','INTEGER',1), col('reviewer_user_id','INTEGER',1),
    col('decision','TEXT',1), col('note','TEXT',1,"''"), col('created_at','TEXT',1,'CURRENT_TIMESTAMP')
  ],
  agents: [
    col('id','INTEGER',0,null,1), col('slug','TEXT',1), col('name','TEXT',1), col('role','TEXT',1),
    col('icon','TEXT',0,"'🤖'"), col('mode','TEXT',1,"'automation'"), col('status','TEXT',1,"'ready'"),
    col('enabled','INTEGER',1,'1'), col('last_run_at','TEXT'), col('last_result','TEXT',0,"''"),
    col('created_at','TEXT',1,'CURRENT_TIMESTAMP')
  ],
  agent_runs: [
    col('id','INTEGER',0,null,1), col('agent_id','INTEGER',1), col('trigger','TEXT',1),
    col('result','TEXT',0,"''"), col('status','TEXT',1,"'ok'"), col('created_at','TEXT',1,'CURRENT_TIMESTAMP')
  ],
  taxonomy_submissions: [
    col('id','INTEGER',0,null,1), col('type','TEXT',1), col('name','TEXT',1), col('slug','TEXT',1),
    col('description','TEXT',0,"''"), col('creator_id','INTEGER'), col('creator_name','TEXT',0,"''"),
    col('status','TEXT',1,"'pending'"), col('created_at','TEXT',1,'CURRENT_TIMESTAMP'),
    col('reviewed_at','TEXT'), col('reviewer_id','INTEGER')
  ]
};
const EXPECTED_ADDED_COLUMNS = {
  'comments.parent_id': col('parent_id','INTEGER'),
  'comments.edited_at': col('edited_at','TEXT'),
  'novels.review_feedback': col('review_feedback','TEXT',0,"''"),
  'novels.reviewed_by': col('reviewed_by','INTEGER'),
  'novels.reviewed_at': col('reviewed_at','TEXT'),
  'connectors.search_url': col('search_url','TEXT',0,"''"),
  'connectors.auth_header': col('auth_header','TEXT',0,"'authorization'"),
  'connectors.secret_name': col('secret_name','TEXT',0,"''"),
  'connectors.rights_evidence_url': col('rights_evidence_url','TEXT',0,"''"),
  'connectors.terms_url': col('terms_url','TEXT',0,"''"),
  'connectors.rights_notes': col('rights_notes','TEXT',0,"''"),
  'connectors.metadata_import_allowed': col('metadata_import_allowed','INTEGER',1,'0'),
  'connectors.attribution_required': col('attribution_required','INTEGER',1,'0')
};
const EXPECTED_UNIQUE_CONSTRAINTS = [
  { table: 'comic_chapter_pages', columns: ['chapter_id','page_number'] },
  { table: 'comic_chapter_pages', columns: ['chapter_id','media_asset_id'] },
  { table: 'agents', columns: ['slug'] },
  { table: 'taxonomy_submissions', columns: ['type','slug'] }
];
const EXPECTED_INDEXES = {
  idx_media_assets_owner_status: { table: 'media_assets', columns: ['owner_user_id','status','created_at'], unique: false },
  idx_media_assets_rights_status: { table: 'media_assets', columns: ['rights_status','status','created_at'], unique: false },
  idx_comic_pages_chapter_order: { table: 'comic_chapter_pages', columns: ['chapter_id','page_number'], unique: false },
  idx_comic_pages_asset: { table: 'comic_chapter_pages', columns: ['media_asset_id'], unique: false },
  idx_media_asset_reviews_asset_created: { table: 'media_asset_reviews', columns: ['media_asset_id','created_at','id'], unique: false },
  idx_agent_runs_agent: { table: 'agent_runs', columns: ['agent_id','created_at'], unique: false }
};

function normalizeDefault(value) {
  if (value === null || value === undefined) return null;
  return String(value).replace(/^\((.*)\)$/,'$1').replace(/\s+/g,' ').trim();
}
function compareColumn(actual, expected, label) {
  if (!actual) return { status: 'missing', reason: 'Column is absent from complete PRAGMA table_info evidence.' };
  const fields = ['type','notnull','pk'];
  const differences = fields.filter(key => String(actual[key] ?? '') !== String(expected[key] ?? ''));
  if (normalizeDefault(actual.dflt_value) !== normalizeDefault(expected.dflt_value)) differences.push('dflt_value');
  return differences.length
    ? { status: 'mismatch', reason: 'Column definition differs in: ' + differences.join(', ') + '.' }
    : { status: 'verified', reason: 'Column type, nullability, default and primary-key position match source DDL.' };
}
function assess(evidence) {
  assert.ok(evidence && typeof evidence === 'object', 'Schema evidence JSON is required.');
  assert.equal(evidence.database, 'god-emperornovel-db', 'Evidence must identify the configured production D1 database.');
  assert.ok(typeof evidence.auditedAt === 'string' && !Number.isNaN(Date.parse(evidence.auditedAt)), 'A valid audit timestamp is required.');
  assert.equal(typeof evidence.inventoryComplete, 'boolean', 'Inventory completeness must be an explicit boolean.');
  for (const key of ['tables','indexes','tableIndexes','foreignKeys','triggers']) assert.ok(Array.isArray(evidence[key]), 'Evidence must include ' + key + ' arrays.');
  const tables = new Map();
  for (const table of evidence.tables) {
    assert.ok(table && typeof table.name === 'string' && table.name.trim(), 'Every table requires a name.');
    assert.ok(!tables.has(table.name), 'Duplicate table: ' + table.name);
    assert.ok(Array.isArray(table.columns), 'Every table requires a columns array: ' + table.name);
    const columns = new Map();
    for (const c of table.columns) {
      assert.ok(c && typeof c.name === 'string' && c.name.trim(), 'Every column requires a name.');
      assert.ok(!columns.has(c.name), 'Duplicate column: ' + table.name + '.' + c.name);
      columns.set(c.name, c);
    }
    tables.set(table.name, { ...table, columnMap: columns });
  }
  const indexes = new Map();
  for (const index of evidence.indexes) {
    assert.ok(index && typeof index.name === 'string' && index.name.trim(), 'Every index requires a name.');
    assert.ok(!indexes.has(index.name), 'Duplicate index: ' + index.name);
    indexes.set(index.name, index);
  }
  const triggerNames = new Set(evidence.triggers.map(trigger => trigger.name));
  const expectedTriggers = [
    'trg_comic_page_requires_publishable_asset_insert',
    'trg_comic_page_requires_publishable_asset_update',
    'trg_referenced_media_must_remain_publishable',
    'trg_comic_page_asset_must_match_novel_owner_insert',
    'trg_comic_page_asset_must_match_novel_owner_update',
    'trg_media_asset_reviews_require_independent_reviewer',
    'trg_media_asset_approval_requires_review',
    'trg_media_asset_reviews_no_update',
    'trg_media_asset_reviews_no_delete',
    'trg_media_asset_owner_quota_insert',
    'trg_media_asset_owner_quota_update',
    'trg_media_asset_mark_deleted_timestamp',
    'trg_media_asset_deleted_is_terminal'
  ];
  const rows = [];
  const absent = (kind, name) => evidence.inventoryComplete
    ? { status: 'missing', reason: 'Absent from complete ' + kind + ' inventory.' }
    : { status: 'unknown', reason: 'Absent from incomplete ' + kind + ' inventory.' };
  for (const [name, expectedColumns] of Object.entries(EXPECTED_TABLES)) {
    const table = tables.get(name);
    if (!table) { rows.push({ object: 'table', name, ...absent('table',name) }); continue; }
    rows.push({ object: 'table', name, status: 'verified', reason: 'Table is present; table-level constraints are not fully inferred from PRAGMA table_info.' });
    const actualNames = table.columns.map(c => c.name);
    if (actualNames.length !== expectedColumns.length || expectedColumns.some((c,i) => actualNames[i] !== c.name)) {
      rows.push({ object: 'table-columns', name, status: 'mismatch', reason: 'Column count or ordinal order differs from the source CREATE TABLE statement.' });
    }
    for (const expected of expectedColumns) rows.push({ object: 'column', name: name + '.' + expected.name, ...compareColumn(table.columnMap.get(expected.name), expected) });
  }
  for (const [identity, expected] of Object.entries(EXPECTED_ADDED_COLUMNS)) {
    const [tableName,columnName] = identity.split('.');
    const table = tables.get(tableName);
    if (!table) { rows.push({ object: 'table', name: tableName, ...absent('table',tableName) }); continue; }
    rows.push({ object: 'column', name: identity, ...(table.columnMap.has(columnName)
      ? compareColumn(table.columnMap.get(columnName), expected)
      : absent('column',identity)) });
  }
  for (const expected of EXPECTED_UNIQUE_CONSTRAINTS) {
    const actual = evidence.tableIndexes.find(index => index.table === expected.table &&
      Boolean(index.unique) && Array.isArray(index.columns) &&
      index.columns.join(',') === expected.columns.join(','));
    rows.push({ object: 'unique-constraint', name: expected.table + '(' + expected.columns.join(',') + ')',
      status: actual ? 'verified' : evidence.inventoryComplete ? 'missing' : 'unknown',
      reason: actual ? 'SQLite unique index metadata confirms the required ordered unique key.' :
        evidence.inventoryComplete ? 'Required unique key is absent from complete PRAGMA index_list evidence.' :
          'Required unique key is not visible in incomplete PRAGMA index_list evidence.' });
  }
  for (const [name, expected] of Object.entries(EXPECTED_INDEXES)) {
    const actual = indexes.get(name);
    if (!actual) { rows.push({ object: 'index', name, ...absent('index',name) }); continue; }
    const differences = [];
    if (actual.table !== expected.table) differences.push('table');
    if (Boolean(actual.unique) !== expected.unique) differences.push('unique');
    if (!Array.isArray(actual.columns) || actual.columns.join(',') !== expected.columns.join(',')) differences.push('columns');
    rows.push({ object: 'index', name, status: differences.length ? 'mismatch' : 'verified',
      reason: differences.length ? 'Index differs in: ' + differences.join(', ') + '.' : 'Index table, ordered columns and uniqueness match source DDL.' });
  }
  for (const name of expectedTriggers) rows.push({
    object: 'trigger', name,
    status: triggerNames.has(name) ? 'verified' : evidence.inventoryComplete ? 'missing' : 'unknown',
    reason: triggerNames.has(name) ? 'Trigger name is present; SQL body equivalence still requires review.' :
      evidence.inventoryComplete ? 'Required trigger is absent from complete sqlite_master trigger inventory.' :
        'Trigger absence cannot be established from incomplete inventory.'
  });
  const counts = Object.fromEntries(['verified','missing','mismatch','unknown'].map(status => [status,rows.filter(r => r.status === status).length]));
  return {
    format: 'imperial-novel-runtime-schema-definition-comparison/v1',
    database: evidence.database, auditedAt: evidence.auditedAt, inventoryComplete: evidence.inventoryComplete,
    counts, definitionsCompatible: counts.missing === 0 && counts.mismatch === 0 && counts.unknown === 0,
    releaseReady: false,
    limitations: [
      'This compares source-transcribed table columns, column properties and the required runtime index only.',
      'It compares media registry tables, columns, unique keys, indexes and required trigger names, but does not prove CHECK constraints, trigger SQL-body equivalence, all foreign-key semantics, row-data safety, migration provenance, backup restoration or production-shaped rehearsal.',
      'It never authorizes migration or deployment.'
    ],
    rows
  };
}
function selfTest() {
  const tables = Object.entries(EXPECTED_TABLES).map(([name,columns]) => ({ name, columns: columns.map(c => ({...c})) }));
  for (const identity of Object.keys(EXPECTED_ADDED_COLUMNS)) {
    const [tableName] = identity.split('.');
    let table = tables.find(t => t.name === tableName);
    if (!table) { table = { name: tableName, columns: [] }; tables.push(table); }
    table.columns.push({...EXPECTED_ADDED_COLUMNS[identity]});
  }
  const base = { database:'god-emperornovel-db', auditedAt:'2026-11-22T00:00:00Z', inventoryComplete:true, tables,
    indexes:[
    {name:'idx_agent_runs_agent',table:'agent_runs',columns:['agent_id','created_at'],unique:false},
    {name:'idx_media_assets_owner_status',table:'media_assets',columns:['owner_user_id','status','created_at'],unique:false},
    {name:'idx_media_assets_rights_status',table:'media_assets',columns:['rights_status','status','created_at'],unique:false},
    {name:'idx_comic_pages_chapter_order',table:'comic_chapter_pages',columns:['chapter_id','page_number'],unique:false},
    {name:'idx_comic_pages_asset',table:'comic_chapter_pages',columns:['media_asset_id'],unique:false},
    {name:'idx_media_asset_reviews_asset_created',table:'media_asset_reviews',columns:['media_asset_id','created_at','id'],unique:false}
  ], tableIndexes:[{name:'agents_slug',table:'agents',columns:['slug'],unique:true},{name:'taxonomy_type_slug',table:'taxonomy_submissions',columns:['type','slug'],unique:true},
    {name:'comic_chapter_pages_chapter_page',table:'comic_chapter_pages',columns:['chapter_id','page_number'],unique:true},
    {name:'comic_chapter_pages_chapter_asset',table:'comic_chapter_pages',columns:['chapter_id','media_asset_id'],unique:true}], foreignKeys:[], triggers: Object.keys({
    trg_comic_page_requires_publishable_asset_insert:1,trg_comic_page_requires_publishable_asset_update:1,trg_referenced_media_must_remain_publishable:1,
    trg_comic_page_asset_must_match_novel_owner_insert:1,trg_comic_page_asset_must_match_novel_owner_update:1,
    trg_media_asset_reviews_require_independent_reviewer:1,trg_media_asset_approval_requires_review:1,trg_media_asset_reviews_no_update:1,trg_media_asset_reviews_no_delete:1,
    trg_media_asset_owner_quota_insert:1,trg_media_asset_owner_quota_update:1,trg_media_asset_mark_deleted_timestamp:1,trg_media_asset_deleted_is_terminal:1
  }).map(name=>({name,table:'media_assets',sql:'CREATE TRIGGER '+name})) };
  let result = assess(base);
  assert.equal(result.definitionsCompatible,true);
  assert.equal(result.releaseReady,false);
  const wrong = structuredClone(base);
  wrong.tables.find(t=>t.name==='connectors').columns.find(c=>c.name==='metadata_import_allowed').notnull=0;
  assert.ok(assess(wrong).counts.mismatch > 0);
  const missing = structuredClone(base);
  missing.indexes=[];
  assert.ok(assess(missing).counts.missing > 0);
  const uncertain = assess({...base,inventoryComplete:false,indexes:[]});
  assert.ok(uncertain.counts.unknown > 0);
  const wrongIndex = structuredClone(base);
  wrongIndex.indexes[0].columns=['created_at','agent_id'];
  assert.ok(assess(wrongIndex).counts.mismatch > 0);
  assert.throws(()=>assess({...base,tables:[...tables,tables[0]]}),/Duplicate table/);
}
if (process.argv.includes('--self-test')) {
  selfTest();
  console.log('PASS: definition comparison detects column/index mismatches and never authorizes release.');
} else {
  const [file] = process.argv.slice(2);
  if (!file) { console.error('Usage: node scripts/compare-runtime-schema-definitions.mjs <normalized-schema-evidence.json>'); process.exit(2); }
  const result = assess(JSON.parse(fs.readFileSync(resolve(file),'utf8')));
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  if (!result.definitionsCompatible) process.exitCode=1;
}
export { assess };
